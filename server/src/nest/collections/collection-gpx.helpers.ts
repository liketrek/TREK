import { XMLParser } from 'fast-xml-parser';
import type { ZodType } from 'zod';
import {
  COLLECTION_FILE_FORMAT,
  COLLECTION_FILE_VERSION,
  COLLECTION_GPX_NAMESPACE,
  COLLECTION_GPX_PLACE_FIELDS,
  MAX_COLLECTION_FILE_BYTES,
  MAX_COLLECTION_FILE_LABELS,
  MAX_COLLECTION_FILE_PLACES,
  collectionFileLabelSchema,
  collectionFilePlaceSchema,
  collectionFileSchema,
  collectionLinkSchema,
  type CollectionFile,
  type CollectionFileLabel,
  type CollectionFilePlace,
  type CollectionGpxExport,
  type CollectionGpxProblem,
  type CollectionGpxReadResult,
  type CollectionLink,
} from '@trek/shared';
import { coord, gpxBuilder } from '../places/gpx-export.helpers';

/**
 * A list as GPX and back (#2301).
 *
 * Both halves work on the list file from `collection-file.schema.ts`, never on
 * rows: the writer is handed the file the JSON export returns, so it cannot
 * carry anything the file does not, and the reader produces a file that is
 * then imported like any other. The only thing this module decides is how the
 * fields of a place map onto a waypoint, and that table lives in the contract
 * (`COLLECTION_GPX_PLACE_FIELDS`).
 *
 * Same library as the trip importer and exporter in places/, with a reader of
 * its own: the trip parser turns `<name>007</name>` into the number 7 and does
 * not decode character references, which is fine for track geometry and wrong
 * for the names and notes a list is made of.
 */

/** A list file as the exporter builds it, its places already in the file's shape. */
export type ExportedCollectionFile = Omit<CollectionFile, 'places'> & { places: CollectionFilePlace[] };

const GPX_NAMESPACE = 'http://www.topografix.com/GPX/1/1';
/** The prefix this writer binds; the reader looks the namespace up instead. */
const TREK = 'trek';
/** OsmAnd writes its favourites with the address in its own namespace. */
const OSMAND_NAMESPACES = ['https://osmand.net', 'http://osmand.net'];
const HTTP_URL = /^https?:\/\//i;

/** The extension fields that hold one value each; labels and links repeat. */
const SCALAR_EXTENSIONS = (Object.keys(COLLECTION_GPX_PLACE_FIELDS) as (keyof CollectionFilePlace)[]).filter(
  field => COLLECTION_GPX_PLACE_FIELDS[field] === 'extension' && field !== 'labels' && field !== 'links',
);

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

/**
 * Text XML 1.0 can hold. The builder escapes markup but passes through the
 * control characters the spec forbids outright, and one of those in a place
 * name is enough for a strict reader to refuse the whole file.
 */
function xmlText(value: string): string {
  return value.replace(/[\p{Cc}\p{Cs}\uFFFE\uFFFF]/gu, ch => (ch === '\t' || ch === '\n' || ch === '\r' ? ch : ''));
}

/** A value as element text, or nothing, since an empty element is noise to every reader. */
function textOf(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return xmlText(String(value)).trim() || undefined;
}

/**
 * `<desc>` is what other apps show under the name, so it gets the place's
 * description and, on a line of its own after it, the address: GPX has no
 * element for an address, and without it a waypoint in OsmAnd is a pin with a
 * name. The address also travels in the extension, which is what TREK reads
 * back; the reader strips this copy again (see `withoutAddress`).
 */
function describe(place: CollectionFilePlace): string | undefined {
  return textOf([place.description?.trim(), place.address?.trim()].filter(Boolean).join('\n\n'));
}

function placeExtensions(place: CollectionFilePlace): Record<string, unknown> | undefined {
  const ext: Record<string, unknown> = {};
  for (const field of SCALAR_EXTENSIONS) {
    const value: unknown = place[field];
    if (typeof value === 'string' || typeof value === 'number') ext[`${TREK}:${field}`] = textOf(value);
  }
  const labels = (place.labels ?? []).map(textOf).filter(Boolean);
  if (labels.length) ext[`${TREK}:label`] = labels;
  const links = (place.links ?? []).filter(link => HTTP_URL.test(link.url));
  if (links.length) {
    ext[`${TREK}:link`] = links.map(link => ({ '@_href': xmlText(link.url), '#text': textOf(link.label) }));
  }
  return Object.keys(ext).length ? ext : undefined;
}

/** Element order is the GPX 1.1 schema's: name, cmt, desc, link, type, extensions. */
function waypoint(place: CollectionFilePlace, lat: number, lng: number): Record<string, unknown> {
  const website = place.website && HTTP_URL.test(place.website) ? xmlText(place.website) : undefined;
  return {
    '@_lat': coord(lat),
    '@_lon': coord(lng),
    name: xmlText(place.name),
    cmt: textOf(place.notes),
    desc: describe(place),
    link: website ? { '@_href': website } : undefined,
    type: textOf(place.category),
    extensions: placeExtensions(place),
  };
}

function metadata(file: ExportedCollectionFile): Record<string, unknown> {
  const ext: Record<string, unknown> = {};
  if (file.color) ext[`${TREK}:color`] = textOf(file.color);
  if (file.icon) ext[`${TREK}:icon`] = textOf(file.icon);
  if (file.labels?.length) {
    ext[`${TREK}:label`] = file.labels.map(label => ({
      ...(label.color ? { '@_color': xmlText(label.color) } : {}),
      '#text': xmlText(label.name),
    }));
  }
  return {
    name: xmlText(file.name),
    desc: textOf(file.description),
    time: file.exported_at,
    extensions: Object.keys(ext).length ? ext : undefined,
  };
}

/**
 * The list as a GPX 1.1 document: one waypoint per place that has
 * coordinates. A place without them cannot be a waypoint, so it is left out
 * and counted, and the caller says how many.
 */
export function collectionFileToGpx(file: ExportedCollectionFile): CollectionGpxExport {
  const wpt: Record<string, unknown>[] = [];
  let omitted = 0;
  for (const place of file.places) {
    const { lat, lng } = place;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      omitted += 1;
      continue;
    }
    wpt.push(waypoint(place, lat, lng));
  }

  const gpx: string = gpxBuilder.build({
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    gpx: {
      '@_version': '1.1',
      '@_creator': 'TREK',
      '@_xmlns': GPX_NAMESPACE,
      [`@_xmlns:${TREK}`]: COLLECTION_GPX_NAMESPACE,
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': `${GPX_NAMESPACE} ${GPX_NAMESPACE}/gpx.xsd`,
      metadata: metadata(file),
      ...(wpt.length ? { wpt } : {}),
    },
  });
  return { name: file.name, gpx, waypoints: wpt.length, omitted };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Why a document was refused, carried to the controller as the response's `code`. */
export class CollectionGpxError extends Error {
  constructor(
    readonly code: CollectionGpxProblem,
    message: string,
  ) {
    super(message);
    this.name = 'CollectionGpxError';
  }
}

/**
 * The most elements a document may open before it is parsed at all.
 *
 * The size cap already bounds this, but loosely: a megabyte of `<a/>` is a
 * quarter of a million nodes for the parser to build. A real GPX of that size
 * is a recorded track at three or four elements a point, around thirty
 * thousand, so this sits well clear of every genuine file.
 */
export const MAX_GPX_ELEMENTS = 100_000;

/** Elements that may repeat, so they always parse as arrays. Matched on the local name. */
const REPEATED = new Set(['wpt', 'rte', 'rtept', 'trk', 'trkseg', 'trkpt', 'link', 'label']);

const localName = (name: string): string => name.slice(name.indexOf(':') + 1);

/**
 * Text stays text (`parseTagValue: false`), so a waypoint called 007 keeps its
 * zeros. `htmlEntities` is on for the numeric character references it also
 * unlocks (`&#233;`), which this library otherwise leaves undecoded. Entities
 * declared in a DOCTYPE never reach it: a document carrying one is refused
 * before parsing.
 */
const reader = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  parseAttributeValue: false,
  htmlEntities: true,
  isArray: (name, _path, _leaf, isAttribute) => !isAttribute && REPEATED.has(localName(name)),
});

type XmlNode = Record<string, unknown>;

function isNode(value: unknown): value is XmlNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** An element as an object; `<wpt/>` parses as an empty string, which has no fields either. */
function node(value: unknown): XmlNode {
  return isNode(value) ? value : {};
}

/** An empty list reads as no list, the way the file itself leaves one out. */
function someOf<T>(items: T[]): T[] | undefined {
  return items.length ? items : undefined;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

/** An element's text: plain, or beside attributes as `#text`. A repeated element counts once. */
function text(value: unknown): string | null {
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isNode(value)) return text(value['#text']);
  return null;
}

function attr(value: unknown, name: string): string | null {
  const raw = node(value)[`@_${name}`];
  return typeof raw === 'string' ? raw.trim() || null : null;
}

/** A coordinate attribute as a number, or null. The range is the contract's to check. */
function coordinate(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Cut to the contract's length without leaving half of a surrogate pair behind. */
function clip(value: string, max: number | null): string {
  if (max === null || value.length <= max) return value;
  const cut = value.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

/** The prefix a document binds to one of these namespaces on its root, if any. */
function prefixFor(root: XmlNode, namespaces: readonly string[]): string | null {
  for (const [key, value] of Object.entries(root)) {
    if (key.startsWith('@_xmlns:') && typeof value === 'string' && namespaces.includes(value.trim())) {
      return key.slice('@_xmlns:'.length);
    }
  }
  return null;
}

/**
 * `raw` in the shape `schema` accepts, or null.
 *
 * A field the schema refuses is dropped and the rest kept, which is the file
 * contract's own rule: one unreadable field costs that field. Only a refused
 * `required` field costs the whole thing, because without it nothing is left.
 * The schema is the one place the limits live, so none are repeated here.
 */
function fit<T>(schema: ZodType<T>, raw: Record<string, unknown>, required: readonly string[]): T | null {
  const given = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined));
  const first = schema.safeParse(given);
  if (first.success) return first.data;
  const refused = new Set(first.error.issues.map(issue => String(issue.path[0])));
  if (required.some(field => refused.has(field))) return null;
  const second = schema.safeParse(Object.fromEntries(Object.entries(given).filter(([key]) => !refused.has(key))));
  return second.success ? second.data : null;
}

const LABEL_NAME = collectionFilePlaceSchema.shape.labels.unwrap().element;

/** GPX 1.1 `<link href>`, or GPX 1.0's `<url>` beside `<urlname>`. */
function gpxLinks(el: XmlNode): CollectionLink[] {
  const found = asArray(el.link).map(link => ({ url: attr(link, 'href'), label: text(node(link).text) }));
  if (found.length === 0 && text(el.url)) found.push({ url: text(el.url), label: text(el.urlname) });
  return found
    .map(link => fit(collectionLinkSchema, link, ['url']))
    .filter((link): link is CollectionLink => link !== null);
}

/**
 * The description as the writer had it: when a TREK file put the address
 * under it as a courtesy to other apps, the address comes back off.
 */
function withoutAddress(desc: string | null, address: string | null): string | null {
  if (!desc || !address) return desc;
  if (desc === address) return null;
  const suffix = `\n\n${address}`;
  return desc.endsWith(suffix) ? desc.slice(0, -suffix.length).trim() || null : desc;
}

/** The prefixes a document bound to the namespaces this reader understands. */
interface Prefixes {
  trek: string | null;
  osmand: string | null;
}

/**
 * One waypoint (or named route point) as a place, or null when it cannot be one.
 *
 * Coordinates are the one thing a waypoint must have. A missing name is given
 * one, `Waypoint N` after its position in the file, which is what the trip
 * importer calls it too: an unnamed pin is still a place somebody marked, and
 * the number is how they find it again in the app that made the file.
 */
function readPlace(value: unknown, fallbackName: string | null, prefixes: Prefixes): CollectionFilePlace | null {
  const el = node(value);
  const lat = coordinate(el['@_lat']);
  const lng = coordinate(el['@_lon']);
  const name = text(el.name) ?? fallbackName;
  if (lat === null || lng === null || !name) return null;

  const ext = node(el.extensions);
  const own = (field: string): unknown => (prefixes.trek ? ext[`${prefixes.trek}:${field}`] : undefined);
  const address = text(own('address')) ?? (prefixes.osmand ? text(ext[`${prefixes.osmand}:address`]) : null);
  const desc = text(el.desc);
  const cmt = text(el.cmt);
  const [website, ...moreLinks] = gpxLinks(el);
  const ownLinks = asArray(own('link'))
    .map(link => fit(collectionLinkSchema, { url: attr(link, 'href'), label: text(link) }, ['url']))
    .filter((link): link is CollectionLink => link !== null);

  const raw: Record<string, unknown> = {
    name: clip(name, collectionFilePlaceSchema.shape.name.maxLength),
    lat,
    lng,
    description: prefixes.trek ? withoutAddress(desc, address) : desc,
    // Garmin writes the same text into both; once is enough.
    notes: !prefixes.trek && cmt === desc ? null : cmt,
    website: website?.url,
    // OsmAnd files its favourites into groups by <type>; Garmin has only <sym>.
    category: text(el.type) ?? text(el.sym),
    address,
    labels: someOf(
      asArray(own('label'))
        .map(text)
        .filter((label): label is string => label !== null && LABEL_NAME.safeParse(label).success)
        .slice(0, MAX_COLLECTION_FILE_LABELS),
    ),
    links: someOf([...moreLinks, ...ownLinks]),
  };
  for (const field of SCALAR_EXTENSIONS) {
    const value = text(own(field));
    if (field === 'address' || value === null) continue;
    raw[field] = field === 'price' ? Number(value) : value;
  }
  return fit(collectionFilePlaceSchema, raw, ['name', 'lat', 'lng']);
}

function listName(root: XmlNode, meta: XmlNode, fileName: string | undefined): string {
  const fromFile = fileName?.split(/[\\/]/).pop()?.replace(/\.gpx$/i, '').trim();
  // GPX 1.1 keeps the name in <metadata>, GPX 1.0 on the root.
  const name = text(meta.name) ?? text(root.name) ?? (fromFile || 'GPX');
  return clip(name, collectionFileSchema.shape.name.maxLength);
}

/** Everything that can be refused without building a tree, checked before one is built. */
function refuseBeforeParsing(source: string): string {
  // Bytes, not characters: the limit is the JSON file's, and a megabyte of
  // text outside Latin-1 is fewer characters than that.
  if (Buffer.byteLength(source, 'utf8') > MAX_COLLECTION_FILE_BYTES) {
    throw new CollectionGpxError('too-large', 'That GPX file is too large');
  }
  const xml = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  // GPX has no use for a DTD, and a DTD is where both classic XML attacks
  // live: external entities that read files or URLs, and nested ones that
  // expand a kilobyte into gigabytes. The parser refuses the first and caps
  // the second; refusing the declaration outright means relying on neither.
  if (/<!(?:DOCTYPE|ENTITY)/i.test(xml)) {
    throw new CollectionGpxError('unreadable', 'A GPX file with a DOCTYPE is not read');
  }
  let elements = 0;
  for (let at = xml.indexOf('<'); at !== -1; at = xml.indexOf('<', at + 1)) {
    // `</`, `<!` and `<?` close an element or open a comment, CDATA or declaration.
    const next = xml.charCodeAt(at + 1);
    if (next !== 0x2f && next !== 0x21 && next !== 0x3f) elements += 1;
    if (elements > MAX_GPX_ELEMENTS) throw new CollectionGpxError('unreadable', 'That GPX file has too many elements');
  }
  return xml;
}

/**
 * A GPX document as the list file it amounts to.
 *
 * Every waypoint becomes a place, and so does a route point somebody named;
 * an unnamed route point is a bend in the road and a track is a line, neither
 * a place, so both are only counted for the importer to be told about.
 */
export function gpxToCollectionFile(source: string, fileName?: string): CollectionGpxReadResult {
  const xml = refuseBeforeParsing(source);
  let doc: unknown;
  try {
    doc = reader.parse(xml, true);
  } catch {
    throw new CollectionGpxError('unreadable', 'That GPX file is not well-formed XML');
  }
  const rootValue = node(doc).gpx;
  if (rootValue === undefined) throw new CollectionGpxError('not-gpx', 'That is not a GPX file');
  const root = node(rootValue);
  const prefixes: Prefixes = {
    trek: prefixFor(root, [COLLECTION_GPX_NAMESPACE]),
    osmand: prefixFor(root, OSMAND_NAMESPACES),
  };

  const places: CollectionFilePlace[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let trackPoints = 0;
  const take = (value: unknown, fallbackName: string | null, routePoint: boolean) => {
    const place = readPlace(value, fallbackName, prefixes);
    if (!place) {
      skipped += 1;
      return;
    }
    // A route drawn through waypoints repeats each of them as a route point
    // (Garmin does this for every route); the place is already on the list.
    const key = `${place.lat},${place.lng},${place.name}`;
    if (routePoint && seen.has(key)) return;
    seen.add(key);
    places.push(place);
  };

  asArray(root.wpt).forEach((wpt, i) => take(wpt, `Waypoint ${i + 1}`, false));
  for (const rte of asArray(root.rte)) {
    for (const point of asArray(node(rte).rtept)) {
      if (text(node(point).name)) take(point, null, true);
      else trackPoints += 1;
    }
  }
  for (const trk of asArray(root.trk)) {
    for (const segment of asArray(node(trk).trkseg)) trackPoints += asArray(node(segment).trkpt).length;
  }

  if (places.length > MAX_COLLECTION_FILE_PLACES) {
    throw new CollectionGpxError('too-many-places', `That GPX file has more than ${MAX_COLLECTION_FILE_PLACES} places`);
  }

  const meta = node(root.metadata);
  const metaExt = node(meta.extensions);
  const own = (field: string): unknown => (prefixes.trek ? metaExt[`${prefixes.trek}:${field}`] : undefined);
  const labels = asArray(own('label'))
    .map(label => fit(collectionFileLabelSchema, { name: text(label), color: attr(label, 'color') }, ['name']))
    .filter((label): label is CollectionFileLabel => label !== null)
    .slice(0, MAX_COLLECTION_FILE_LABELS);

  const file = fit(
    collectionFileSchema,
    {
      format: COLLECTION_FILE_FORMAT,
      version: COLLECTION_FILE_VERSION,
      name: listName(root, meta, fileName),
      description: text(meta.desc) ?? text(root.desc),
      color: text(own('color')),
      icon: text(own('icon')),
      labels,
      places,
    },
    ['format', 'version', 'name', 'places'],
  );
  // The envelope above always fits today; this keeps a stricter contract from becoming a 500.
  if (!file) throw new CollectionGpxError('unreadable', 'That GPX file could not be read as a list');
  return { file, skipped, track_points: trackPoints };
}
