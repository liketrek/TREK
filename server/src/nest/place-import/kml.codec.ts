/**
 * KML and KMZ in: the one place the XML library is configured for KML.
 *
 * A KMZ is unpacked to its KML (doc.kml preferred, the decompressed size
 * capped), the bytes are decoded as UTF-8 (loosely, with a warning, when they
 * are not), the document is validated and parsed, and every Placemark comes
 * back with the folder it sat in, its name, a plain-text description, and
 * either a point or a path's first point plus the path as route geometry.
 * Which placemarks become places, and under which category, is the importing
 * domain's decision.
 *
 * The Tours import reads the same document for its lines instead (IO-02):
 * every LineString and gx:Track, also inside a MultiGeometry or gx:MultiTrack,
 * as a line of its own, and a count of what it leaves out.
 */
import { stripHtmlTags } from '../common/stripHtmlTags';
import {
  KmlReadError,
  type KmlDocumentRead,
  type KmlImportSummary,
  type KmlLeftOut,
  type KmlLineRead,
  type KmlLinesRead,
  type ParsedKmlPlacemark,
} from './place-import.types';

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import unzipper, { type File as ZipEntry } from 'unzipper';
import { TextDecoder } from 'util';

export type { ParsedKmlPlacemark } from './place-import.types';

export interface KmlPlacemarkNode {
  placemark: any;
  folderName: string | null;
}

const kmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['Placemark', 'Folder', 'Document'].includes(name),
  // Treat <description> as raw text so mixed-content HTML (e.g. <br/>, <i>)
  // is returned as a string instead of a parsed object.
  stopNodes: ['*.description'],
});

export const KMZ_DECOMPRESSED_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB

const UTF8_DECODER_FATAL = new TextDecoder('utf-8', { fatal: true });
const UTF8_DECODER_LOOSE = new TextDecoder('utf-8');

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** One parsed element: its children and attributes by name. */
type KmlNode = Readonly<Record<string, unknown>>;

const isKmlNode = (value: unknown): value is KmlNode =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** A child of a parsed element by name; nothing for text or an empty element. */
const field = (value: unknown, name: string): unknown => (isKmlNode(value) ? value[name] : undefined);

function asTrimmedString(value: unknown): string | null {
  if (value == null) return null;
  // Parsed objects (mixed-content XML parsed without stopNodes) must not
  // produce "[object Object]" — extract #text if present, else return null.
  if (typeof value === 'object') {
    const candidate = (value as Record<string, unknown>)['#text'];
    if (typeof candidate === 'string') return candidate.trim() || null;
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function decodeHtmlEntities(value: string): string {
  const withNamedEntities = value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITY_MAP[m] || m);

  return withNamedEntities
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    });
}

export function decodeUtf8WithWarning(fileBuffer: Buffer): { text: string; warning: string | null } {
  try {
    return { text: UTF8_DECODER_FATAL.decode(fileBuffer), warning: null };
  } catch {
    return {
      text: UTF8_DECODER_LOOSE.decode(fileBuffer),
      warning: 'The uploaded file is not valid UTF-8. Some characters may be shown incorrectly.',
    };
  }
}

export function sanitizeKmlDescription(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) return null;

  // Unwrap CDATA sections — present when fast-xml-parser returns raw node text
  // via stopNodes. Must happen before tag-stripping so the CDATA markers are
  // not mis-parsed as tags.
  const withoutCdata = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

  const withLineBreaks = withoutCdata.replace(/<br\s*\/?>/gi, '\n');
  const stripped = stripHtmlTags(withLineBreaks);
  const decoded = decodeHtmlEntities(stripped)
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return decoded || null;
}

type LinePoint = { lat: number; lng: number; ele: number | null };

function parseKmlLineStringCoordinates(value: unknown): LinePoint[] | null {
  const coordinates = asTrimmedString(value);
  if (!coordinates) return null;

  const points = coordinates
    .trim()
    .split(/\s+/)
    .map((coord) => {
      const parts = coord.split(',');
      const lng = Number.parseFloat(parts[0] ?? '');
      const lat = Number.parseFloat(parts[1] ?? '');
      const eleRaw = parts[2] != null ? Number.parseFloat(parts[2]) : Number.NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng, ele: Number.isFinite(eleRaw) ? eleRaw : null };
    })
    .filter((p): p is LinePoint => p !== null);

  return points.length >= 2 ? points : null;
}

export function parseKmlPointCoordinates(value: unknown): { lat: number; lng: number } | null {
  const coordinates = asTrimmedString(value);
  if (!coordinates) return null;

  const firstCoordinate = coordinates.split(/\s+/)[0];
  const [lngRaw, latRaw] = firstCoordinate.split(',');
  if (lngRaw == null || latRaw == null) return null;

  const lng = Number.parseFloat(lngRaw);
  const lat = Number.parseFloat(latRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function createKmlImportSummary(totalPlacemarks: number): KmlImportSummary {
  return {
    totalPlacemarks,
    createdCount: 0,
    skippedCount: 0,
    warnings: [],
    errors: [],
  };
}

/** Every container of a document (the root, its Documents and Folders), each before its own, with its folder name. */
function visitKmlContainers(kmlRoot: unknown, visit: (node: KmlNode, folderName: string | null) => void): void {
  const visitNode = (node: unknown, currentFolderName: string | null): void => {
    if (!isKmlNode(node)) return;
    visit(node, currentFolderName);

    for (const folder of asArray(node.Folder)) {
      // Nested folders inherit/override folder context used for category matching.
      const folderName = asTrimmedString(field(folder, 'name')) || currentFolderName;
      visitNode(folder, folderName);
    }

    for (const childDocument of asArray(node.Document)) {
      visitNode(childDocument, currentFolderName);
    }
  };

  visitNode(kmlRoot, null);
}

export function extractKmlPlacemarkNodes(kmlRoot: any): KmlPlacemarkNode[] {
  const nodes: KmlPlacemarkNode[] = [];
  visitKmlContainers(kmlRoot, (node, folderName) => {
    for (const placemark of asArray(node.Placemark)) {
      nodes.push({ placemark, folderName });
    }
  });
  return nodes;
}

export function parsePlacemarkNode(node: KmlPlacemarkNode): ParsedKmlPlacemark {
  const pointCoords = parseKmlPointCoordinates(node.placemark?.Point?.coordinates);

  let routeGeometry: string | null = null;
  let pathFirstPt: { lat: number; lng: number } | null = null;
  if (!pointCoords) {
    const linePts = parseKmlLineStringCoordinates(node.placemark?.LineString?.coordinates);
    if (linePts) {
      pathFirstPt = { lat: linePts[0].lat, lng: linePts[0].lng };
      const hasAllEle = linePts.every((p) => p.ele !== null);
      routeGeometry = JSON.stringify(linePts.map((p) => (hasAllEle ? [p.lat, p.lng, p.ele] : [p.lat, p.lng])));
    }
  }

  return {
    name: asTrimmedString(node.placemark?.name),
    description: sanitizeKmlDescription(node.placemark?.description),
    lat: pointCoords?.lat ?? pathFirstPt?.lat ?? null,
    lng: pointCoords?.lng ?? pathFirstPt?.lng ?? null,
    folderName: node.folderName,
    routeGeometry,
  };
}

/**
 * A KML file as its parsed root element. Throws the two messages the import
 * route has always answered for a broken file.
 */
function parseKmlRoot(fileBuffer: Buffer): { kmlRoot: KmlNode; warning: string | null } {
  const decoded = decodeUtf8WithWarning(fileBuffer);

  const validationResult = XMLValidator.validate(decoded.text);
  if (validationResult !== true) {
    throw new KmlReadError('malformed', 'Malformed KML: invalid XML structure');
  }

  const parsed: unknown = kmlParser.parse(decoded.text);
  const kmlRoot = field(parsed, 'kml') ?? parsed;

  if (!isKmlNode(kmlRoot)) {
    throw new KmlReadError('malformed', 'Malformed KML: could not parse XML');
  }

  return { kmlRoot, warning: decoded.warning };
}

/**
 * A KML document as its placemarks (each level's own before its folders'), with the summary the
 * import fills in.
 */
export function readKmlDocument(fileBuffer: Buffer): KmlDocumentRead {
  const { kmlRoot, warning } = parseKmlRoot(fileBuffer);

  const placemarkNodes = extractKmlPlacemarkNodes(kmlRoot);
  const summary = createKmlImportSummary(placemarkNodes.length);

  if (warning) {
    summary.warnings.push(warning);
  }

  return { placemarks: placemarkNodes.map(parsePlacemarkNode), summary };
}

// ---------------------------------------------------------------------------
// Lines for the Tours import (IO-02)
// ---------------------------------------------------------------------------

/** What a document holds besides placemarks that the Tours import never reads: overlays, and links it never follows. */
const LEFT_OUT_FEATURES = ['NetworkLink', 'GroundOverlay', 'ScreenOverlay', 'PhotoOverlay'] as const;

/** The points of a gx:Track, each `<gx:coord>` written `lng lat alt` with spaces. */
function parseKmlTrackCoordinates(value: unknown): LinePoint[] | null {
  const points = asArray(value).flatMap((coord): LinePoint[] => {
    const [lng = Number.NaN, lat = Number.NaN, ele = Number.NaN] = (asTrimmedString(coord) ?? '')
      .split(/\s+/)
      .map((part) => Number.parseFloat(part));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ lat, lng, ele: Number.isFinite(ele) ? ele : null }];
  });
  return points.length >= 2 ? points : null;
}

/**
 * A line as route geometry, `[lat, lng, ele]` only where its heights can be
 * trusted as heights. KML's default altitude mode is clampToGround, under
 * which an altitude means nothing, and Google My Maps writes a 0 for every
 * point. So the heights are kept when the line says `absolute`, dropped when
 * it names any other mode, and without a mode kept unless every one is 0. A
 * line with a point lacking one keeps none, as a GPX track does.
 */
export function kmlLineGeometry(points: LinePoint[], altitudeMode: string | null): number[][] {
  const complete = points.every((p) => p.ele !== null);
  const meaningful = altitudeMode === null ? points.some((p) => p.ele !== 0) : altitudeMode === 'absolute';
  return points.map((p) => (complete && meaningful && p.ele !== null ? [p.lat, p.lng, p.ele] : [p.lat, p.lng]));
}

/** One geometry element of a placemark taken apart into its lines; what is not a line is counted as left out. */
function collectKmlLines(node: KmlNode, inheritedMode: string | null, lines: number[][][], leftOut: KmlLeftOut): void {
  const mode = asTrimmedString(node.altitudeMode) ?? inheritedMode;
  const shapes = [
    ...asArray(node.LineString).map((line) => ({
      line,
      points: parseKmlLineStringCoordinates(field(line, 'coordinates')),
    })),
    ...asArray(node.Track).map((line) => ({ line, points: parseKmlTrackCoordinates(field(line, 'coord')) })),
  ];
  for (const { line, points } of shapes) {
    if (points) lines.push(kmlLineGeometry(points, asTrimmedString(field(line, 'altitudeMode')) ?? mode));
    else leftOut.other += 1;
  }
  for (const group of [...asArray(node.MultiGeometry), ...asArray(node.MultiTrack)]) {
    if (isKmlNode(group)) collectKmlLines(group, mode, lines, leftOut);
  }
  leftOut.points += asArray(node.Point).length;
  leftOut.areas += asArray(node.Polygon).length;
  leftOut.other += asArray(node.Model).length + asArray(node.LinearRing).length;
}

const leftOutTotal = (leftOut: KmlLeftOut) => leftOut.points + leftOut.areas + leftOut.other;

/**
 * A placemark's lines, each kept apart: two lines of one placemark are never
 * joined into one, they are numbered after its name instead.
 */
function placemarkLines(placemark: unknown, leftOut: KmlLeftOut): KmlLineRead[] {
  const geometries: number[][][] = [];
  const before = leftOutTotal(leftOut);
  if (isKmlNode(placemark)) collectKmlLines(placemark, null, geometries, leftOut);
  // A placemark that held nothing at all, not even something left out, is counted once.
  if (geometries.length === 0 && leftOutTotal(leftOut) === before) leftOut.other += 1;

  const name = asTrimmedString(field(placemark, 'name'));
  const description = sanitizeKmlDescription(field(placemark, 'description'));
  return geometries.map((geometry, index) => ({
    name: name && geometries.length > 1 ? `${name} (${index + 1}/${geometries.length})` : name,
    description,
    geometry,
  }));
}

/**
 * A KML document as the lines a tour can be made of, in document order, and a
 * count of what it holds besides: single points, areas, and everything else
 * (models, overlays, links to other files, which are never followed, and
 * lines too short to be one).
 */
export function readKmlLines(fileBuffer: Buffer): KmlLinesRead {
  const { kmlRoot, warning } = parseKmlRoot(fileBuffer);
  const leftOut: KmlLeftOut = { points: 0, areas: 0, other: 0 };
  const lines = extractKmlPlacemarkNodes(kmlRoot).flatMap(({ placemark }) => placemarkLines(placemark, leftOut));
  visitKmlContainers(kmlRoot, (node) => {
    for (const feature of LEFT_OUT_FEATURES) leftOut.other += asArray(node[feature]).length;
  });
  return { lines, leftOut, warnings: warning ? [warning] : [] };
}

// ---------------------------------------------------------------------------
// KMZ unpacking
// ---------------------------------------------------------------------------

const tooLarge = () =>
  new KmlReadError('archive_too_large', 'KMZ archive exceeds the maximum allowed decompressed size.');

/**
 * An archive entry decompressed, stopped as soon as it passes the limit. The
 * size an entry's header states is only a claim, so the bytes themselves are
 * counted: a crafted archive cannot unpack more than the limit by lying.
 */
export async function readKmzEntryCapped(entry: Pick<ZipEntry, 'stream'>, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of entry.stream()) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    size += bytes.length;
    if (size > limit) throw tooLarge();
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

/**
 * The KML a KMZ archive carries. Only that one entry is read: images and
 * other files beside it are never unpacked, run or fetched.
 */
export async function unpackKmzToKml(
  kmzBuffer: Buffer,
  decompressedSizeLimit = KMZ_DECOMPRESSED_SIZE_LIMIT,
): Promise<Buffer> {
  let zip;
  try {
    zip = await unzipper.Open.buffer(kmzBuffer);
  } catch {
    throw new KmlReadError('archive_invalid', 'Invalid KMZ archive.');
  }

  const kmlEntries = zip.files.filter(
    (entry) => !entry.path.endsWith('/') && entry.path.toLowerCase().endsWith('.kml'),
  );
  if (kmlEntries.length === 0) {
    throw new KmlReadError('archive_without_kml', 'KMZ archive does not contain a KML file.');
  }

  const preferredEntry = kmlEntries.find((entry) => entry.path.toLowerCase().endsWith('doc.kml')) || kmlEntries[0];

  if (preferredEntry.uncompressedSize > decompressedSizeLimit) {
    throw tooLarge();
  }

  try {
    return await readKmzEntryCapped(preferredEntry, decompressedSizeLimit);
  } catch (err) {
    if (err instanceof KmlReadError) throw err;
    // A damaged entry fails while it inflates, not while the directory is read.
    throw new KmlReadError('archive_invalid', 'Invalid KMZ archive.');
  }
}
