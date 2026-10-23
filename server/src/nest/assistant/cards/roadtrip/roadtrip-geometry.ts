import { finite, isLat, isLng } from '../card-values';
import { drivenPieces, riddenRanges, rideGaps, simplifyLine, type CarrierTerminal } from '@trek/shared/roadtrip';

/**
 * The lines a road trip card draws, cut down to what a card may carry: the
 * pieces of a day the car drives (a ride between two terminals is left out,
 * as the corridor search leaves it out), each thinned until it fits its share
 * of the card's points, at five decimals.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** A stop as the ride gaps read it: where it is, and the ride it is a terminal of. */
export interface GapStop extends LatLng {
  carrier?: CarrierTerminal;
}

/** The first tolerance a line is simplified with, in kilometres; it doubles until the line fits. */
const FIRST_TOLERANCE_KM = 0.01;
const MAX_ROUNDS = 16;

function round5(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

/** A point as a card draws it, `[lat, lng]` at five decimals. */
export function roundPoint(point: LatLng): [number, number] {
  return [round5(point.lat), round5(point.lng)];
}

/** The points of a raw geometry (`[lat, lng]` pairs), the broken ones left out. */
export function linePointsOf(raw: unknown): LatLng[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((pair: unknown) => {
    if (!Array.isArray(pair)) return [];
    const lat = finite(pair[0]);
    const lng = finite(pair[1]);
    return isLat(lat) && isLng(lng) ? [{ lat, lng }] : [];
  });
}

/** Every `count`th point, both ends kept: the last resort when simplifying cannot thin a line enough. */
function sampled(line: readonly LatLng[], count: number): LatLng[] {
  const step = (line.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) => line[Math.round(index * step)]);
}

/** A line with at most `max` points (two at the least), the shape kept as far as the points allow. */
export function thinLine(line: readonly LatLng[], max: number): LatLng[] {
  const most = Math.max(2, max);
  if (line.length <= most) return [...line];
  let tolerance = FIRST_TOLERANCE_KM;
  let thin = [...line];
  for (let round = 0; round < MAX_ROUNDS && thin.length > most; round += 1) {
    thin = simplifyLine([...line], tolerance);
    tolerance *= 2;
  }
  return thin.length > most ? sampled(thin, most) : thin;
}

/** The pieces of a day's geometry the car drives, each of two points at least. */
export function drivenLines(geometry: readonly LatLng[], stops: readonly GapStop[]): LatLng[][] {
  if (geometry.length < 2) return [];
  const spine = [...geometry];
  return drivenPieces(spine, riddenRanges(spine, rideGaps(stops))).filter((piece) => piece.length >= 2);
}
