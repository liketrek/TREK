/**
 * Corridor geometry — "what lies along this drive", without asking Overpass to think
 * about a polyline.
 *
 * The naive form (`around:` with a hundred coordinates) is what every POI provider warns
 * about and times out on. OsmAnd solves it the other way round and this follows it: ask
 * for plain bounding boxes that cover the route, then measure each candidate's
 * perpendicular distance to the line and throw away what is too far. The boxes are what
 * the existing /api/maps/pois route already accepts, so no new server surface is needed.
 *
 * Everything here is pure: no React, no network, no store.
 */

export interface LatLng {
  lat: number
  lng: number
}

export interface Bbox {
  south: number
  west: number
  north: number
  east: number
}

const EARTH_RADIUS_KM = 6371
const KM_PER_DEG_LAT = 111.32

const toRad = (deg: number): number => (deg * Math.PI) / 180

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Perpendicular distance from a point to a line segment, in kilometres.
 *
 * Works in a local equirectangular projection around the segment: longitudes shrink by
 * cos(lat), which is the whole reason a uniform degree padding is wrong at 60° north.
 * Over the few kilometres a corridor spans, the error against a proper geodesic is far
 * below the width the user picked.
 */
export function distanceToSegmentKm(p: LatLng, a: LatLng, b: LatLng): number {
  return projectOnSegment(p, a, b).distanceKm
}

/**
 * Perpendicular distance to a segment plus where along it the foot of that perpendicular
 * falls (0 at `a`, 1 at `b`). The second number is what places a candidate correctly in
 * the drive — taking the segment's midpoint instead makes every petrol station on a long
 * straight report the same position.
 */
export function projectOnSegment(p: LatLng, a: LatLng, b: LatLng): { distanceKm: number; t: number } {
  const latScale = KM_PER_DEG_LAT
  const lngScale = KM_PER_DEG_LAT * Math.cos(toRad((a.lat + b.lat) / 2))
  const ax = a.lng * lngScale
  const ay = a.lat * latScale
  const bx = b.lng * lngScale
  const by = b.lat * latScale
  const px = p.lng * lngScale
  const py = p.lat * latScale
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return { distanceKm: haversineKm(p, a), t: 0 }
  // Clamped so a point beside the segment's end measures to the end, not to the
  // infinite line — otherwise a stop 200 km past the destination looks "on the way".
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return { distanceKm: Math.hypot(px - cx, py - cy), t }
}

export interface CorridorHit {
  /** Kilometres from the route line at its closest point. */
  offRouteKm: number
  /** Kilometres travelled along the route before reaching that closest point. */
  alongKm: number
}

/**
 * Where a point sits relative to the route: how far off it is, and how far into the
 * drive it comes. The second number is what puts "lunch" before "the hotel" in a list
 * instead of sorting by name.
 */
export function projectOntoRoute(p: LatLng, line: LatLng[]): CorridorHit | null {
  if (line.length < 2) return null
  let best = Number.POSITIVE_INFINITY
  let bestAlong = 0
  let travelled = 0
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]
    const b = line[i + 1]
    const segment = haversineKm(a, b)
    const { distanceKm: d, t } = projectOnSegment(p, a, b)
    if (d < best) {
      best = d
      bestAlong = travelled + t * segment
    }
    travelled += segment
  }
  return { offRouteKm: best, alongKm: bestAlong }
}

/**
 * Bounding boxes covering the route, each no larger than `maxSpanDeg`.
 *
 * The server clamps any box bigger than that (MAX_BBOX_SPAN_DEG) so Overpass is not
 * asked to scan a continent, which means a long drive has to be cut into boxes here
 * rather than sent as one. Boxes are grown along the route until one would exceed the
 * span, so a straight motorway needs far fewer requests than a mountain road.
 */
export function corridorTiles(line: LatLng[], widthKm: number, maxSpanDeg = 0.45): Bbox[] {
  if (line.length === 0) return []
  const padLat = widthKm / KM_PER_DEG_LAT
  const tiles: Bbox[] = []
  let current: Bbox | null = null

  const padded = (b: Bbox): Bbox => {
    // Longitude degrees shrink towards the poles, so the padding has to grow with
    // latitude or the corridor is narrower than asked for in the north.
    const midLat = (b.north + b.south) / 2
    const padLng = padLat / Math.max(0.2, Math.cos(toRad(midLat)))
    return {
      south: b.south - padLat,
      north: b.north + padLat,
      west: b.west - padLng,
      east: b.east + padLng,
    }
  }

  for (const p of line) {
    if (!current) {
      current = { south: p.lat, north: p.lat, west: p.lng, east: p.lng }
      continue
    }
    const next: Bbox = {
      south: Math.min(current.south, p.lat),
      north: Math.max(current.north, p.lat),
      west: Math.min(current.west, p.lng),
      east: Math.max(current.east, p.lng),
    }
    const grown = padded(next)
    if (grown.north - grown.south > maxSpanDeg || grown.east - grown.west > maxSpanDeg) {
      tiles.push(padded(current))
      current = { south: p.lat, north: p.lat, west: p.lng, east: p.lng }
    } else {
      current = next
    }
  }
  if (current) tiles.push(padded(current))
  return tiles
}

/**
 * Thins a route down to the points that still describe it, so the corridor is built
 * from tens of coordinates rather than the thousands a routed geometry carries.
 * Ramer-Douglas-Peucker with the tolerance expressed in kilometres.
 */
export function simplifyLine(line: LatLng[], toleranceKm: number): LatLng[] {
  if (line.length < 3) return line.slice()
  let maxDist = 0
  let index = 0
  const first = line[0]
  const last = line[line.length - 1]
  for (let i = 1; i < line.length - 1; i++) {
    const d = distanceToSegmentKm(line[i], first, last)
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist <= toleranceKm) return [first, last]
  const left = simplifyLine(line.slice(0, index + 1), toleranceKm)
  const right = simplifyLine(line.slice(index), toleranceKm)
  return [...left.slice(0, -1), ...right]
}
