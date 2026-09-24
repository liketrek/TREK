import { XMLBuilder } from 'fast-xml-parser';

/**
 * GPX writer, the mirror of the importer in places.helpers.ts. Same library, the
 * builder half rather than the parser half, so nothing new is pulled in.
 *
 * The import decides the shape here: a `<wpt>` becomes a place with coordinates, a
 * `<rte>` or `<trk>` becomes a place carrying `route_geometry`, so writing back is
 * that mapping reversed. Days are the one thing GPX has no import counterpart for:
 * a day's stops in order make a perfectly good `<rte>`, which is what puts a
 * planned day on a handheld.
 */

/** A place as the exporter needs it. Anything with geometry writes as a track. */
export interface GpxExportPlace {
  name: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** JSON `[[lat, lng]]` or `[[lat, lng, ele]]`, exactly as the importer stored it. */
  route_geometry: string | null;
  /** Category name, written as <sym> so devices can pick an icon per kind of stop. */
  category: string | null;
}

/** One planned day: its stops in `order_index`, written as a route. */
export interface GpxExportDay {
  dayNumber: number;
  date: string | null;
  title: string | null;
  points: Array<{ name: string; lat: number; lng: number }>;
}

export interface GpxExportInput {
  tripTitle: string;
  places: GpxExportPlace[];
  days: GpxExportDay[];
}

export interface GpxExportOptions {
  waypoints?: boolean;
  tracks?: boolean;
  dayRoutes?: boolean;
}

type Pt = { lat: number; lng: number; ele: number | null };

/** Coordinates are written with 7 decimals, ~11 mm, which is past what any consumer
 *  device resolves and keeps the file from carrying float noise. */
export function coord(n: number): string {
  return Number(n.toFixed(7)).toString();
}

function parseGeometry(raw: string | null): Pt[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const points: Pt[] = [];
  for (const entry of parsed) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const lat = Number(entry[0]);
    const lng = Number(entry[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const rawEle = entry.length > 2 ? Number(entry[2]) : Number.NaN;
    points.push({ lat, lng, ele: Number.isFinite(rawEle) ? rawEle : null });
  }
  return points;
}

/** <desc> carries whatever context the place has, description first, address after,
 *  because a device usually shows only the first line or two. Joined with a plain
 *  comma: handhelds with a narrow font render anything fancier as a box. */
function describe(place: GpxExportPlace): string | undefined {
  const parts = [place.description?.trim(), place.address?.trim()].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

/** Shared with the list writer in collections/, which writes the same dialect. */
export const gpxBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
});

/**
 * Build a GPX 1.1 document. Returns null when the selection produced nothing at all,
 * so the caller can answer 404 rather than hand over an empty file that silently
 * imports as nothing on the other end.
 */
export function buildGpx(input: GpxExportInput, opts: GpxExportOptions = {}): string | null {
  const { waypoints = true, tracks = true, dayRoutes = true } = opts;

  const wpt: unknown[] = [];
  const trk: unknown[] = [];
  const rte: unknown[] = [];

  for (const place of input.places) {
    const geometry = parseGeometry(place.route_geometry);

    if (tracks && geometry.length > 0) {
      trk.push({
        name: place.name,
        desc: describe(place),
        trkseg: {
          trkpt: geometry.map(p => ({
            '@_lat': coord(p.lat),
            '@_lon': coord(p.lng),
            ...(p.ele != null ? { ele: coord(p.ele) } : {}),
          })),
        },
      });
      // A geometry place also holds the start coordinates, but writing it as a
      // waypoint too would drop a stray pin on the start of every track.
      continue;
    }

    if (waypoints && place.lat != null && place.lng != null) {
      wpt.push({
        '@_lat': coord(place.lat),
        '@_lon': coord(place.lng),
        name: place.name,
        desc: describe(place),
        ...(place.category ? { sym: place.category } : {}),
      });
    }
  }

  if (dayRoutes) {
    for (const day of input.days) {
      if (day.points.length < 2) continue; // a single stop is not a route
      const label = day.title?.trim()
        ? `${day.dayNumber}. ${day.title.trim()}`
        : day.date
          ? `${day.dayNumber}. ${day.date}`
          : String(day.dayNumber);
      rte.push({
        name: label,
        rtept: day.points.map(p => ({
          '@_lat': coord(p.lat),
          '@_lon': coord(p.lng),
          name: p.name,
        })),
      });
    }
  }

  if (wpt.length === 0 && trk.length === 0 && rte.length === 0) return null;

  const doc = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    gpx: {
      '@_version': '1.1',
      '@_creator': 'TREK',
      '@_xmlns': 'http://www.topografix.com/GPX/1/1',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
      metadata: { name: input.tripTitle },
      ...(wpt.length ? { wpt } : {}),
      ...(rte.length ? { rte } : {}),
      ...(trk.length ? { trk } : {}),
    },
  };

  return gpxBuilder.build(doc);
}

/** Filenames land on the receiving filesystem, so its reserved characters are
 *  folded away rather than escaped. Header safety is contentDisposition()'s
 *  job since #2165, which is why the title's own script survives here —
 *  沖縄 stays 沖縄 instead of being mangled into underscores. */
export function gpxFilename(tripTitle: string): string {
  const base = tripTitle
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f"\\/:*?<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replaceAll(' ', '-');
  // Codepoints, not UTF-16 units: slice() would cut an emoji in half and the
  // lone surrogate is exactly what URI-encoding chokes on.
  return `${[...base].slice(0, 60).join('') || 'trip'}.gpx`;
}
