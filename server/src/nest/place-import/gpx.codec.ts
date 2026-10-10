/**
 * GPX in and out: the one place the XML library is configured for GPX.
 *
 * Reading comes in two modes, chosen by the caller, because the two GPX
 * importers want different things from the same document and have shipped
 * that way:
 *
 *  - `geometry` (the trip and Tours importers): tag values are parsed, so
 *    `<ele>12.5</ele>` arrives as a number, and the repeating elements are the
 *    six that carry places and geometry, matched on the name as written.
 *    `<name>007</name>` becomes the number 7 and character references stay
 *    undecoded, which is fine for track geometry.
 *  - `text` (the list importer in collections): text stays text, so a
 *    waypoint called 007 keeps its zeros, numeric character references
 *    (`&#233;`) are decoded, and `link` / `label` repeat as well, matched on
 *    the local name so a namespaced `<trek:label>` counts.
 *
 * Writing goes through one builder and one document envelope (`writeGpx`),
 * shared by the trip export and the list export: GPX 1.1, creator TREK, the
 * schema location, then the caller's namespaces, metadata and elements.
 */
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type GpxReadMode = 'geometry' | 'text';

/** Repeating elements in geometry mode: the places and the geometry, by name as written. */
const GEOMETRY_ARRAYS = ['wpt', 'trkpt', 'rtept', 'trk', 'trkseg', 'rte'];

/** Repeating elements in text mode, matched on the local name. */
const TEXT_ARRAYS = new Set(['wpt', 'rte', 'rtept', 'trk', 'trkseg', 'trkpt', 'link', 'label']);

const localName = (name: string): string => name.slice(name.indexOf(':') + 1);

/** The GPX parser for one read mode. Built once per mode below; exported for the tests. */
export function createGpxParser(mode: GpxReadMode): XMLParser {
  if (mode === 'geometry') {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => GEOMETRY_ARRAYS.includes(name),
    });
  }
  // Entities declared in a DOCTYPE never reach the text parser: the list reader
  // refuses a document carrying one before parsing.
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    parseAttributeValue: false,
    htmlEntities: true,
    isArray: (name, _path, _leaf, isAttribute) => !isAttribute && TEXT_ARRAYS.has(localName(name)),
  });
}

/** Frozen at import, one shared instance per mode. */
export const gpxGeometryParser = createGpxParser('geometry');
export const gpxTextParser = createGpxParser('text');

export const GPX_NAMESPACE = 'http://www.topografix.com/GPX/1/1';

/** Coordinates are written with 7 decimals, ~11 mm, which is past what any consumer
 *  device resolves and keeps the file from carrying float noise. */
export function coord(n: number): string {
  return Number(n.toFixed(7)).toString();
}

const gpxBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
});

/** What goes inside `<gpx>`; an empty element list is left out entirely. */
export interface GpxDocument {
  /** Extra `xmlns:<prefix>` bindings, written after the default namespace. */
  namespaces?: Record<string, string>;
  metadata: Record<string, unknown>;
  wpt?: unknown[];
  rte?: unknown[];
  trk?: unknown[];
}

/** A GPX 1.1 document, elements in the schema's order (metadata, wpt, rte, trk). */
export function writeGpx(doc: GpxDocument): string {
  const namespaces = Object.fromEntries(Object.entries(doc.namespaces ?? {}).map(([prefix, uri]) => [`@_xmlns:${prefix}`, uri]));
  return gpxBuilder.build({
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    gpx: {
      '@_version': '1.1',
      '@_creator': 'TREK',
      '@_xmlns': GPX_NAMESPACE,
      ...namespaces,
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': `${GPX_NAMESPACE} ${GPX_NAMESPACE}/gpx.xsd`,
      metadata: doc.metadata,
      ...(doc.wpt?.length ? { wpt: doc.wpt } : {}),
      ...(doc.rte?.length ? { rte: doc.rte } : {}),
      ...(doc.trk?.length ? { trk: doc.trk } : {}),
    },
  });
}
