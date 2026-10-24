/**
 * The geometry of a search along a line (PLN-02): where the index is asked,
 * the stretches Overpass is asked in, and the query that asks for every kind
 * near one stretch at once. Pure: PoisAlongResolver makes the calls.
 */
import { overpassSelector } from './osm-filter.helpers';
import { lineMetres, pointAtMeters, simplifyLine, sliceAtMeters, type LatLng } from '@trek/shared/roadtrip';

/**
 * The most circles one line is asked in. The index answers each in a fraction
 * of a second, so this bounds the requests one search sends rather than its
 * time; a longer line is searched along its first part and the answer says so.
 */
const MAX_BEADS = 24;

/** The most points the Overpass query carries; the line is simplified until it fits. */
const MAX_AROUND_POINTS = 120;

const METRES_PER_DEGREE = 111_320;

/**
 * The longest stretch of a line one Overpass query covers, so the box it asks
 * for candidates stays close to its part of the line however the line runs.
 */
const OVERPASS_STRETCH_M = 50_000;

/** The most stretches one line is asked in; a longer line is searched along its first 400 km and the answer says so. */
const MAX_OVERPASS_STRETCHES = 8;

/**
 * How long Overpass may spend on the query near a line, in seconds, sent as
 * its `[timeout:N]`. Shorter than the explore pill's, because a person waits
 * for the search beside the index. The client waits a little longer than this
 * (osm.client), never less, or it would hang up on an answer still coming.
 * Fifteen rather than ten: a public mirror under load queues a query for a
 * few seconds before it runs, and ten had a plain viewpoint search given up.
 */
export const OVERPASS_ALONG_QUERY_TIMEOUT_S = 15;

/** One circle the index is asked in. */
interface AlongBead {
  lat: number;
  lng: number;
  radiusM: number;
}

export interface AlongPlan {
  beads: AlongBead[];
  /** The part of the line the beads cover: all of it, unless the line was too long. */
  covered: LatLng[];
  capped: boolean;
}

/**
 * Circles strung along the line like beads, so together they hold every point
 * within the corridor of it. They lie a step apart, at least two and at most
 * six corridor widths. Each reaches half a step and a corridor width: a place
 * near the line is at most a corridor from the line, and that point of the
 * line at most half a step from a bead, however the line turns at a street
 * corner. The index answers nearest first, so the wider reach costs nothing
 * close to the line. A line longer than the beads reach is covered along its
 * start.
 */
export function alongPlan(line: LatLng[], corridorM: number): AlongPlan {
  const total = lineMetres(line);
  const step = Math.min(6 * corridorM, Math.max(2 * corridorM, total / (MAX_BEADS - 1)));
  const coveredM = Math.min(total, step * (MAX_BEADS - 1));
  // A hair of slack, so a line exactly a whole number of steps long takes no bead twice.
  const steps = Math.max(0, Math.ceil(coveredM / step - 1e-9));
  const radiusM = Math.ceil(step / 2 + corridorM);
  const beads = Array.from({ length: steps + 1 }, (_, index) => pointAtMeters(line, Math.min(coveredM, index * step)))
    .filter((at): at is LatLng => at !== null)
    .map((at) => ({ lat: at.lat, lng: at.lng, radiusM }));
  const capped = coveredM < total;
  return { beads, covered: capped ? sliceAtMeters(line, 0, coveredM) : line, capped };
}

interface AlongStretches {
  stretches: LatLng[][];
  /** The line was longer than the stretches reach; only its start is asked. */
  capped: boolean;
}

/**
 * The line cut into stretches of equal length, none longer than one Overpass
 * query covers, together the whole line unless it runs past what one search
 * asks. A line that fits one stretch is asked as it is.
 */
export function overpassStretches(line: LatLng[]): AlongStretches {
  const total = lineMetres(line);
  // A hair of slack, so a line exactly a whole number of stretches long takes no extra one.
  const needed = Math.max(1, Math.ceil(total / OVERPASS_STRETCH_M - 1e-9));
  if (needed === 1) return { stretches: [line], capped: false };
  const length = total / needed;
  // The last stretch ends at the line's own end, not where adding up the lengths lands.
  const end = (index: number) => (index + 1 === needed ? total : (index + 1) * length);
  const stretches = Array.from({ length: Math.min(needed, MAX_OVERPASS_STRETCHES) }, (_, index) =>
    sliceAtMeters(line, index * length, end(index)),
  );
  return { stretches, capped: needed > MAX_OVERPASS_STRETCHES };
}

interface AroundPath {
  points: LatLng[];
  /** How far from the simplified line a place may lie and still be near the real one. */
  radiusM: number;
  bbox: { south: number; west: number; north: number; east: number };
}

/**
 * The line as Overpass' `around` filter takes it: simplified until it has at
 * most a hundred and twenty points, the reach widened by what the
 * simplification moved it, and the box that holds it all, so the query looks
 * at the candidates of that box only.
 */
export function aroundPath(line: LatLng[], corridorM: number): AroundPath {
  let toleranceM = Math.max(10, corridorM / 10);
  let points = simplifyLine(line, toleranceM / 1000);
  while (points.length > MAX_AROUND_POINTS) {
    toleranceM *= 2;
    points = simplifyLine(line, toleranceM / 1000);
  }
  const radiusM = Math.ceil(corridorM + toleranceM);
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const padLat = radiusM / METRES_PER_DEGREE;
  const widest = Math.max(...lats.map((lat) => Math.abs(lat)));
  const padLng = radiusM / (METRES_PER_DEGREE * Math.max(0.01, Math.cos((widest * Math.PI) / 180)));
  return {
    points,
    radiusM,
    bbox: {
      south: Math.min(...lats) - padLat,
      west: Math.min(...lngs) - padLng,
      north: Math.max(...lats) + padLat,
      east: Math.max(...lngs) + padLng,
    },
  };
}

const coordinate = (value: number) => value.toFixed(5);

/**
 * One Overpass query for every kind near the line: the candidates of the box,
 * then those of them within reach of the line itself, with the short deadline
 * of its own above.
 */
export function overpassAlongQuery(filters: readonly string[], path: AroundPath, cap: number): string {
  const { south, west, north, east } = path.bbox;
  const box = `(${[south, west, north, east].map(coordinate).join(',')})`;
  const selectors = filters.map((filter) => `  ${overpassSelector(filter, box)};`).join('\n');
  const line = path.points.map((point) => `${coordinate(point.lat)},${coordinate(point.lng)}`).join(',');
  return `[out:json][timeout:${OVERPASS_ALONG_QUERY_TIMEOUT_S}];\n(\n${selectors}\n)->.cand;\nnwr.cand(around:${path.radiusM},${line});\nout center tags ${cap + 25};`;
}
