// One stretch of longitudes to draw a trip in, for a map that does not repeat its
// layers across world copies (Leaflet) (#2975).
//
// Leaflet draws a marker at its literal longitude only, on one copy of the world.
// A trip from Los Angeles (-118) to Auckland (174.8) therefore had its pins at
// opposite ends of that copy, while the flight between them, drawn the short way
// across the Pacific, ran off the edge to the Los Angeles of the next copy. The
// frame moves the seam of the drawn world into the widest stretch of the planet
// the trip leaves empty, so the whole trip, flight included, lies on one copy:
// Los Angeles at 242, Auckland at 174.8.
//
// A trip that does not cross the antimeridian gets no frame at all, and every
// layer draws exactly what it drew before.

import { wrapLongitude } from '@trek/shared';

/** The drawn world runs from `seam` to `seam + 360`. */
export interface LngFrame {
  readonly seam: number;
}

/** Re-seam only when that narrows the trip by at least this much: a world tour stays as it is. */
const MIN_SAVING_DEG = 45;
/** A previous seam is kept while the trip drawn with it is at most this much wider than the best. */
const KEEP_SEAM_SLACK_DEG = 15;

/** Width of the trip, in degrees, when the world is drawn from `seam` eastwards. */
function spanFrom(seam: number, sorted: number[]): number {
  let min = Infinity;
  let max = -Infinity;
  for (const lng of sorted) {
    const framed = lng < seam ? lng + 360 : lng;
    if (framed < min) min = framed;
    if (framed > max) max = framed;
  }
  return max - min;
}

/**
 * The frame for these longitudes, or null when the plain world already holds the
 * trip narrowly enough. `previous` is the frame in use: it is kept while it still
 * works, so adding or filtering a place does not slide every layer sideways.
 */
export function tripLngFrame(lngs: readonly number[], previous: LngFrame | null = null): LngFrame | null {
  const sorted = lngs
    .filter(Number.isFinite)
    .map(wrapLongitude)
    .sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  const last = sorted.length - 1;

  // The widest stretch with no point in it. The one across the antimeridian comes first,
  // so a trip that leaves the Pacific empty keeps the plain world.
  let gapSize = sorted[0] + 360 - sorted[last];
  let gapWest = sorted[last];
  let crossesAntimeridian = false;
  for (let i = 0; i < last; i++) {
    const size = sorted[i + 1] - sorted[i];
    if (size > gapSize) {
      gapSize = size;
      gapWest = sorted[i];
      crossesAntimeridian = true;
    }
  }
  if (!crossesAntimeridian) return null;

  const plainSpan = sorted[last] - sorted[0];
  const bestSpan = 360 - gapSize;
  if (plainSpan - bestSpan < MIN_SAVING_DEG) return null;

  if (previous && spanFrom(previous.seam, sorted) <= bestSpan + KEEP_SEAM_SLACK_DEG) return previous;
  // The middle of the empty stretch: lines that bulge a little past a stop stay clear of it.
  return { seam: gapWest + gapSize / 2 };
}

/** Where a longitude is drawn in the frame. Without a frame it is drawn where it is. */
export function frameLng(frame: LngFrame | null, lng: number): number {
  if (!frame) return lng;
  return frame.seam + ((((lng - frame.seam) % 360) + 360) % 360);
}

/**
 * A line in the frame: its first point moved into it, every next point kept within
 * half a world of the one before, so the line stays one line where it crosses the
 * antimeridian or the seam. Without a frame the line is drawn as it is.
 */
export function frameLine<T extends readonly [number, number]>(
  frame: LngFrame | null,
  line: readonly T[]
): [number, number][] {
  if (!frame) return line as unknown as [number, number][];
  const out: [number, number][] = [];
  let prevRaw = 0;
  let prevDrawn = 0;
  for (let i = 0; i < line.length; i++) {
    const [lat, lng] = line[i];
    if (i === 0) {
      prevDrawn = frameLng(frame, lng);
    } else {
      let delta = lng - prevRaw;
      delta -= 360 * Math.round(delta / 360);
      prevDrawn += delta;
    }
    prevRaw = lng;
    out.push([lat, prevDrawn]);
  }
  return out;
}
