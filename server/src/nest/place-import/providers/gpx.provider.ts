import { Injectable } from '@nestjs/common';
import { coord, gpxGeometryParser, writeGpx } from '../gpx.codec';
import type { GpxImportOptions, PreparedGpxPlace } from '../place-import.types';

/**
 * A trip as GPX and back: the reader that turns a GPX file into the places an
 * import would create, and the writer that is its mirror. Both go through
 * gpx.codec (the geometry read mode, the shared document writer).
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

  return writeGpx({ metadata: { name: input.tripTitle }, wpt, rte, trk });
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

/**
 * Parses a GPX file into the places an import would create, without writing
 * anything. Waypoints become places, each route and each track becomes one
 * place carrying its geometry.
 */
export function prepareGpxRows(fileBuffer: Buffer, opts: GpxImportOptions = {}): PreparedGpxPlace[] {
  const { importWaypoints = true, importRoutes = true, importTracks = true, defaultName } = opts;

  const parsed = gpxGeometryParser.parse(fileBuffer.toString('utf-8'));
  const gpx = parsed?.gpx;
  if (!gpx) return [];

  const str = (v: unknown) => (v != null ? String(v).trim() : null);
  const num = (v: unknown) => { const n = Number.parseFloat(String(v)); return Number.isNaN(n) ? null : n; };

  // Routes and tracks rarely carry their own <name>. Without one they all fall back to the
  // same generic label, so name-based dedup drops every import after the first. Derive a
  // base from the source filename (the requested behaviour) and suffix an index so multiple
  // geometries from one file stay distinct.
  const rawName = str(defaultName);
  const baseName = rawName ? rawName.replace(/\.[^.]+$/, '').trim() || rawName : null;
  let geoSeq = 0;
  const geoName = (explicit: string | null, fallback: string): string => {
    if (explicit) return explicit;
    geoSeq++;
    const base = baseName || fallback;
    return geoSeq === 1 ? base : `${base} ${geoSeq}`;
  };

  const waypoints: PreparedGpxPlace[] = [];

  // 1) Parse <wpt> elements (named waypoints / POIs)
  if (importWaypoints) {
    for (const wpt of gpx.wpt ?? []) {
      const lat = num(wpt['@_lat']);
      const lng = num(wpt['@_lon']);
      if (lat === null || lng === null) continue;
      waypoints.push({ lat, lng, name: str(wpt.name) || `Waypoint ${waypoints.length + 1}`, description: str(wpt.desc) });
    }
  }

  // 2) Parse <rte> routes as polyline-places (one place per route with route_geometry)
  if (importRoutes) {
    for (const rte of gpx.rte ?? []) {
      const pts = (rte.rtept ?? [])
        .map((pt: Record<string, unknown>) => ({ lat: num(pt['@_lat']), lng: num(pt['@_lon']), ele: num(pt['ele']) }))
        .filter((p: { lat: number | null; lng: number | null; ele: number | null }) => p.lat !== null && p.lng !== null) as Array<{ lat: number; lng: number; ele: number | null }>;
      if (pts.length === 0) continue;
      const hasAllEle = pts.every(p => p.ele !== null);
      const routeGeometry = pts.map(p => hasAllEle ? [p.lat, p.lng, p.ele] : [p.lat, p.lng]);
      waypoints.push({ lat: pts[0].lat, lng: pts[0].lng, name: geoName(str(rte.name), 'GPX Route'), description: str(rte.desc), routeGeometry: JSON.stringify(routeGeometry) });
    }
  }

  // 3) Extract full track geometry from <trk>
  if (importTracks) {
    for (const trk of gpx.trk ?? []) {
      const trackPoints: { lat: number; lng: number; ele: number | null }[] = [];
      for (const seg of trk.trkseg ?? []) {
        for (const pt of seg.trkpt ?? []) {
          const lat = num(pt['@_lat']);
          const lng = num(pt['@_lon']);
          if (lat === null || lng === null) continue;
          trackPoints.push({ lat, lng, ele: num(pt.ele) });
        }
      }
      if (trackPoints.length === 0) continue;
      const start = trackPoints[0];
      const hasAllEle = trackPoints.every(p => p.ele !== null);
      const routeGeometry = trackPoints.map(p => hasAllEle ? [p.lat, p.lng, p.ele] : [p.lat, p.lng]);
      waypoints.push({ lat: start.lat, lng: start.lng, name: geoName(str(trk.name), 'GPX Track'), description: str(trk.desc), routeGeometry: JSON.stringify(routeGeometry) });
    }
  }

  return waypoints;
}

/** The GPX source: a trip file in, a trip file out. */
@Injectable()
export class GpxProvider {
  read(fileBuffer: Buffer, opts: GpxImportOptions = {}): PreparedGpxPlace[] {
    return prepareGpxRows(fileBuffer, opts);
  }

  write(input: GpxExportInput, opts: GpxExportOptions = {}): string | null {
    return buildGpx(input, opts);
  }

  filename(tripTitle: string): string {
    return gpxFilename(tripTitle);
  }
}
