// The lines of a journey map, laid the short way across the antimeridian (#3080).
//
// A recorded day, a trip's GPX and the faint line between entries all come as
// points with longitudes in [-180, 180]. A ship from Samoa to Fiji therefore steps
// from -179.9999 to 179.9998, and both renderers drew that step as a line across
// the whole world. The trip's plan map solved this for its own layers (#2975,
// #2977); the journey map draws with the same tools here.
//
// Leaflet draws every layer at its literal longitude on one copy of the world, so
// it gets the trip's longitude frame: the seam moves into the widest stretch the
// journey leaves empty, and pins and lines are drawn in it on one copy. A GL map
// repeats the world itself and places each pin on the copy nearest the view, so
// there a line only has to stay continuous.

import type { JourneyTrack } from '@trek/shared';
import { frameLine, frameLng, tripLngFrame, type LngFrame } from '../../utils/lngFrame';
import { unwrapLngs } from '../Map/flightGeodesy';

/** A point of a line, `[lat, lng]`. */
type LatLng = [number, number];

/**
 * The frame the Leaflet journey map draws in, from everything it locates: the
 * entries, the trail and every track. Null for a journey that stays off the
 * antimeridian, which then draws exactly as before. `previous` is kept while it
 * still fits, so a rebuild does not slide the map sideways.
 */
export function journeyLngFrame(
  points: readonly { lng: number }[],
  tracks: readonly JourneyTrack[],
  previous: LngFrame | null = null
): LngFrame | null {
  const lngs: number[] = [];
  for (const point of points) lngs.push(point.lng);
  for (const track of tracks) for (const [, lng] of track.points) lngs.push(lng);
  return tripLngFrame(lngs, previous);
}

/**
 * The polylines to draw for one line of the journey map. Every step between two
 * points takes the short way, so a crossing of the antimeridian stays a short hop.
 *
 * With a frame (Leaflet, a journey across the antimeridian) the line is drawn in
 * it, beside the pins. Without one the line starts where its first point is and
 * runs on past ±180 where it crosses; `wrapCopies` (Leaflet, whose vector layers
 * do not repeat across world copies) then adds the same line shifted by 360
 * degrees, so the part past the edge shows on the world the pins are on. A GL map
 * repeats the line itself and needs no copy.
 */
export function journeyLines(frame: LngFrame | null, line: readonly LatLng[], wrapCopies: boolean): LatLng[][] {
  if (frame) return [frameLine(frame, line)];
  const unwrapped = unwrapLngs(line as LatLng[]);
  if (!wrapCopies) return [unwrapped];
  const west = unwrapped.some(([, lng]) => lng < -180);
  const east = unwrapped.some(([, lng]) => lng > 180);
  if (!west && !east) return [unwrapped];
  const shift = west ? 360 : -360;
  return [unwrapped, unwrapped.map(([lat, lng]) => [lat, lng + shift] as LatLng)];
}

/** A point as the frame draws it; without a frame it is drawn where it is. */
export function framePoint(frame: LngFrame | null, lat: number, lng: number): LatLng {
  return [lat, frameLng(frame, lng)];
}
