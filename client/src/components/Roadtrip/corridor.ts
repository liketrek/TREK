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
/** A segment shorter than a millimetre, squared — below this there is nothing to project onto. */
const DEGENERATE_SEGMENT_KM2 = 1e-12

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
  // A segment whose two ends are the same point to within a millimetre has no
  // direction to project onto, so measure straight to it. Written as a range because
  // the ends came through a chain of floating point arithmetic and never land on 0.
  if (lenSq < DEGENERATE_SEGMENT_KM2) return { distanceKm: haversineKm(p, a), t: 0 }
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
/**
 * Splits a step that is longer than a box into even pieces.
 *
 * The simplifier is right to reduce a dead straight motorway stretch to its two ends,
 * but tiling walks point to point: two ends 100 km apart produce a box at each end and
 * nothing in between, so the middle of the drive would never be searched.
 */
function densify(line: LatLng[], maxStepDeg: number): LatLng[] {
  if (line.length < 2) return line
  const out: LatLng[] = [line[0]]
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]
    const b = line[i]
    const span = Math.max(Math.abs(b.lat - a.lat), Math.abs(b.lng - a.lng))
    const steps = Math.max(1, Math.ceil(span / maxStepDeg))
    for (let s = 1; s <= steps; s++) {
      out.push({
        lat: a.lat + ((b.lat - a.lat) * s) / steps,
        lng: a.lng + ((b.lng - a.lng) * s) / steps,
      })
    }
  }
  return out
}

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

  // The point the open box last swallowed. When a box closes, the next one starts
  // from it rather than from `p` alone, so the two overlap by exactly one step of
  // the walk. Starting at `p` left the stretch between them covered only by the
  // padding on either side — and the walk steps in up to maxSpanDeg/2 while the
  // padding is widthKm, so at the offered widths a band of several kilometres of
  // route fell into no box at all. Nothing downstream noticed: the panel counts
  // tiles asked and tiles answered, so it reported a finished, uncapped,
  // error-free search of a drive it had never fully looked at. "Find fuel along
  // the route" is the whole feature.
  let previous: LatLng | null = null

  for (const p of densify(line, maxSpanDeg / 2)) {
    if (!current) {
      current = { south: p.lat, north: p.lat, west: p.lng, east: p.lng }
      previous = p
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
      const from = previous ?? p
      current = {
        south: Math.min(from.lat, p.lat),
        north: Math.max(from.lat, p.lat),
        west: Math.min(from.lng, p.lng),
        east: Math.max(from.lng, p.lng),
      }
    } else {
      current = next
    }
    previous = p
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

/**
 * The point that lies `metres` along a line, measured the way a car drives it.
 *
 * Every other helper in this file goes the other way: given a point, where on the line
 * is it. This is the inverse, and it exists because the range budget produces a distance
 * ("the tank is empty 340 km in") with no idea where that is on the map.
 *
 * Walked segment by segment rather than approximated, and interpolated inside the
 * segment it lands in, because the answer becomes a marker somebody drives to. Past the
 * end it returns the last point rather than null: a tank that runs out after the day's
 * final stop still ran out somewhere, and the caller decides what to do about that.
 */
export function pointAtMeters(line: LatLng[], metres: number): LatLng | null {
  if (!line.length) return null
  if (line.length === 1 || metres <= 0) return line[0]

  let covered = 0
  for (let i = 1; i < line.length; i++) {
    const step = haversineKm(line[i - 1], line[i]) * 1000
    if (covered + step >= metres) {
      // How far into this segment, as a fraction. A zero-length segment (two identical
      // vertices, which a concatenated route line does produce) would divide by zero,
      // and its start point is the right answer anyway.
      const t = step > 0 ? (metres - covered) / step : 0
      return {
        lat: line[i - 1].lat + (line[i].lat - line[i - 1].lat) * t,
        lng: line[i - 1].lng + (line[i].lng - line[i - 1].lng) * t,
      }
    }
    covered += step
  }
  return line[line.length - 1]
}

/**
 * A box around a point, sized so its inscribed circle reaches `radiusKm`.
 *
 * The server turns a box into centre plus half the diagonal, so a box of ±r asks for
 * r·√2 of reach and finds things in the corners that are further away than they look.
 * Sized from the radius rather than guessed, and the caller still has to read the
 * answer's own `clamped` flag: above 20 km the index narrows the search silently.
 */
export function boxAround(point: LatLng, radiusKm: number): Bbox {
  const dLat = radiusKm / KM_PER_DEG_LAT
  const dLng = radiusKm / (KM_PER_DEG_LAT * Math.max(0.01, Math.cos(toRad(point.lat))))
  return {
    south: point.lat - dLat,
    west: point.lng - dLng,
    north: point.lat + dLat,
    east: point.lng + dLng,
  }
}
