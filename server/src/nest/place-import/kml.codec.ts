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
 */
import { stripHtmlTags } from '../common/stripHtmlTags';
import type { KmlDocumentRead, KmlImportSummary, ParsedKmlPlacemark } from './place-import.types';

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import unzipper from 'unzipper';
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

function parseKmlLineStringCoordinates(value: unknown): Array<{ lat: number; lng: number; ele: number | null }> | null {
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
    .filter((p): p is { lat: number; lng: number; ele: number | null } => p !== null);

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

export function extractKmlPlacemarkNodes(kmlRoot: any): KmlPlacemarkNode[] {
  const nodes: KmlPlacemarkNode[] = [];

  const visitNode = (node: any, currentFolderName: string | null): void => {
    if (!node || typeof node !== 'object') return;

    for (const placemark of asArray(node.Placemark)) {
      nodes.push({ placemark, folderName: currentFolderName });
    }

    for (const folder of asArray(node.Folder)) {
      // Nested folders inherit/override folder context used for category matching.
      const folderName = asTrimmedString(folder?.name) || currentFolderName;
      visitNode(folder, folderName);
    }

    for (const childDocument of asArray(node.Document)) {
      visitNode(childDocument, currentFolderName);
    }
  };

  visitNode(kmlRoot, null);
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
 * A KML document as its placemarks (each level's own before its folders'), with the summary the
 * import fills in. Throws the two messages the import route has always
 * answered for a broken file.
 */
export function readKmlDocument(fileBuffer: Buffer): KmlDocumentRead {
  const decoded = decodeUtf8WithWarning(fileBuffer);

  const validationResult = XMLValidator.validate(decoded.text);
  if (validationResult !== true) {
    throw new Error('Malformed KML: invalid XML structure');
  }

  const parsed = kmlParser.parse(decoded.text);
  const kmlRoot = parsed?.kml ?? parsed;

  if (!kmlRoot || typeof kmlRoot !== 'object') {
    throw new Error('Malformed KML: could not parse XML');
  }

  const placemarkNodes = extractKmlPlacemarkNodes(kmlRoot);
  const summary = createKmlImportSummary(placemarkNodes.length);

  if (decoded.warning) {
    summary.warnings.push(decoded.warning);
  }

  return { placemarks: placemarkNodes.map(parsePlacemarkNode), summary };
}

// ---------------------------------------------------------------------------
// KMZ unpacking
// ---------------------------------------------------------------------------

export async function unpackKmzToKml(
  kmzBuffer: Buffer,
  decompressedSizeLimit = KMZ_DECOMPRESSED_SIZE_LIMIT,
): Promise<Buffer> {
  let zip;
  try {
    zip = await unzipper.Open.buffer(kmzBuffer);
  } catch {
    throw new Error('Invalid KMZ archive.');
  }

  const kmlEntries = zip.files.filter(
    (entry) => !entry.path.endsWith('/') && entry.path.toLowerCase().endsWith('.kml'),
  );
  if (kmlEntries.length === 0) {
    throw new Error('KMZ archive does not contain a KML file.');
  }

  const preferredEntry = kmlEntries.find((entry) => entry.path.toLowerCase().endsWith('doc.kml')) || kmlEntries[0];

  if (preferredEntry.uncompressedSize > decompressedSizeLimit) {
    throw new Error('KMZ archive exceeds the maximum allowed decompressed size.');
  }

  return preferredEntry.buffer();
}
