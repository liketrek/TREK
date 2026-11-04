// Coordinates the map hands out, brought back from a repeated world copy (#2976).
//
// Leaflet and MapLibre/Mapbox repeat the world sideways, and a pointer on a copy
// reports the longitude it has on that copy: 274.9 for -85.1. Anything that
// stores a point or asks a server about it wants the point on the real world.

import { wrapLongitude } from '@trek/shared';

/** The same point with its longitude on the real world, in [-180, 180]. */
export function onRealWorld<T extends { lat: number; lng: number }>(point: T): T {
  const lng = wrapLongitude(point.lng);
  return lng === point.lng ? point : { ...point, lng };
}

export interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * A viewport box moved whole by a multiple of 360 degrees so its centre lies on
 * the real world. A box looking at a copy of Japan then asks for Japan. A box
 * that spans the antimeridian keeps one edge past it, as it always had.
 */
export function bboxOnRealWorld<T extends Bbox>(bbox: T): T {
  const centre = (bbox.west + bbox.east) / 2;
  const shift = wrapLongitude(centre) - centre;
  if (shift === 0) return bbox;
  return { ...bbox, west: bbox.west + shift, east: bbox.east + shift };
}
