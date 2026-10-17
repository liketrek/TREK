import type { PaddleLock, TrackMarks } from '@trek/shared';
import { haversineKm } from './geo';

/**
 * PAD-03 for a recorded track: portages and locks laid onto the line as it
 * was recorded, by their distance from its start. Nothing here moves a point
 * of the track; a mark is only ever a distance along it.
 */

export const NO_TRACK_MARKS: TrackMarks = { portages: [], locks: [] };

/** How far from the line, in metres, a click still counts as a click on it. */
export const TRACK_PICK_TOLERANCE_M = 250;

interface Projection {
  /** Metres along the track to the nearest point of it. */
  atM: number;
  /** How far the click was from that point, in metres. */
  offM: number;
}

/**
 * The nearest point of the track to a click, as its distance along the line
 * and the gap to it. The nearest point is found flat within each segment,
 * near enough at the length of a segment; null for a track of fewer than two points.
 */
export function projectOntoTrack(
  track: readonly (readonly [number, number])[],
  point: { lat: number; lng: number }
): Projection | null {
  if (track.length < 2) return null;
  const toRad = Math.PI / 180;
  const metresPerLat = 111_195;
  let along = 0;
  let best: Projection | null = null;
  for (let i = 1; i < track.length; i += 1) {
    const [aLat, aLng] = track[i - 1];
    const [bLat, bLng] = track[i];
    const metresPerLng = metresPerLat * Math.cos(((aLat + bLat) / 2) * toRad);
    const bx = (bLng - aLng) * metresPerLng;
    const by = (bLat - aLat) * metresPerLat;
    const px = (point.lng - aLng) * metresPerLng;
    const py = (point.lat - aLat) * metresPerLat;
    const lengthSq = bx * bx + by * by;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lengthSq));
    const offM = Math.hypot(px - t * bx, py - t * by);
    // Along the line by great circle, as every other measure of the track is taken.
    const length = haversineKm({ lat: aLat, lng: aLng }, { lat: bLat, lng: bLng }) * 1000;
    if (!best || offM < best.offM) best = { atM: along + t * length, offM };
    along += length;
  }
  return best;
}

/** The marks with a lock added at a distance along the track, its times still to enter. */
export function withLock(marks: TrackMarks, atM: number): TrackMarks {
  const lock = { at_m: Math.round(atM), wait_minutes: null, transit_minutes: null };
  return { ...marks, locks: [...marks.locks, lock].sort((a, b) => a.at_m - b.at_m) };
}

/**
 * The marks with a portage between two distances, in either order. A portage
 * that would overlap one already there is not added: the marks come back as
 * they were, and the caller can say why.
 */
export function withPortage(marks: TrackMarks, aM: number, bM: number): TrackMarks {
  const fromM = Math.round(Math.min(aM, bM));
  const toM = Math.round(Math.max(aM, bM));
  if (toM <= fromM) return marks;
  if (marks.portages.some((p) => fromM < p.to_m && toM > p.from_m)) return marks;
  const portage = { from_m: fromM, to_m: toM, extra_minutes: null };
  return { ...marks, portages: [...marks.portages, portage].sort((a, b) => a.from_m - b.from_m) };
}

export function withoutPortage(marks: TrackMarks, index: number): TrackMarks {
  return { ...marks, portages: marks.portages.filter((_, i) => i !== index) };
}

export function withPortageExtra(marks: TrackMarks, index: number, minutes: number | null): TrackMarks {
  return { ...marks, portages: marks.portages.map((p, i) => (i === index ? { ...p, extra_minutes: minutes } : p)) };
}

/** The lock at this index with new times, or gone with null. */
export function withLockTimes(marks: TrackMarks, index: number, lock: PaddleLock | null): TrackMarks {
  if (!lock) return { ...marks, locks: marks.locks.filter((_, i) => i !== index) };
  return { ...marks, locks: marks.locks.map((l, i) => (i === index ? { ...l, ...lock } : l)) };
}

/**
 * The track cut into the stretches paddled and the stretches carried, for the
 * map to draw the portages in their own colour. Each cut falls on the
 * interpolated point at the portage's distance, so the parts meet exactly.
 */
export function splitTrackByPortages(
  track: readonly (readonly [number, number])[],
  portages: TrackMarks['portages']
): Array<{ coordinates: [number, number][]; land: boolean }> {
  if (track.length < 2 || portages.length === 0) return [{ coordinates: track.map(([a, b]) => [a, b]), land: false }];
  const cuts = portages.flatMap((p) => [p.from_m, p.to_m]).sort((a, b) => a - b);
  const parts: Array<{ coordinates: [number, number][]; land: boolean }> = [];
  let current: [number, number][] = [[track[0][0], track[0][1]]];
  let land = false;
  let along = 0;
  let cut = 0;
  for (let i = 1; i < track.length; i += 1) {
    const a = track[i - 1];
    const b = track[i];
    const length = haversineKm({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] }) * 1000;
    while (cut < cuts.length && cuts[cut] <= along + length) {
      const t = length === 0 ? 0 : (cuts[cut] - along) / length;
      const at: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      current.push(at);
      if (current.length >= 2) parts.push({ coordinates: current, land });
      current = [at];
      land = !land;
      cut += 1;
    }
    current.push([b[0], b[1]]);
    along += length;
  }
  if (current.length >= 2) parts.push({ coordinates: current, land });
  return parts;
}
