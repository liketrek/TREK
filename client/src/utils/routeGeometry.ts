export interface DistanceIndexedProfileSample {
  distanceMeters: number
  elevationMeters: number
  lat?: number
  lng?: number
}

export interface RouteProfileFocus {
  distanceMeters: number
  elevationMeters: number | null
  lat: number
  lng: number
  sampleIndex: number
}

export interface RouteGeometryAnalysis {
  routeCoordinates: [number, number][]
  distanceKm: number
  minEle: number | null
  maxEle: number | null
  gain: number | null
  loss: number | null
  distanceIndexedProfileSamples: DistanceIndexedProfileSample[]
}

export type RouteGeometryPoint = [number, number] | [number, number, number]

function isRoutePoint(value: unknown): value is RouteGeometryPoint {
  return Array.isArray(value) && (value.length === 2 || value.length === 3) &&
    Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180 &&
    (value.length === 2 || Number.isFinite(value[2]))
}

/** Parses and filters route coordinates for analysis and map rendering. */
export function parseRenderableRouteGeometry(routeGeometry: string | null | undefined): RouteGeometryPoint[] | null {
  if (!routeGeometry) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(routeGeometry)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null
  const points = parsed.filter(isRoutePoint)
  return points.length >= 2 ? points : null
}

function haversineMeters(a: RouteGeometryPoint, b: RouteGeometryPoint): number {
  const earthRadiusMeters = 6_371_000
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const [lat1, lng1] = a
  const [lat2, lng2] = b
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const chord = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2
  const boundedChord = Math.min(1, Math.max(0, chord))
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(boundedChord), Math.sqrt(1 - boundedChord))
}

/** Interpolates a focus point from prepared samples in O(log n). */
export function focusRouteProfileAtDistance(
  samples: readonly DistanceIndexedProfileSample[],
  requestedDistanceMeters: number,
): RouteProfileFocus | null {
  if (samples.length < 2 || !Number.isFinite(requestedDistanceMeters)) return null
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (![first.lat, first.lng, last.lat, last.lng].every(Number.isFinite)) return null
  const distanceMeters = Math.max(first.distanceMeters, Math.min(last.distanceMeters, requestedDistanceMeters))

  let low = 0
  let high = samples.length - 1
  while (low + 1 < high) {
    const middle = (low + high) >>> 1
    if (samples[middle].distanceMeters < distanceMeters) low = middle
    else high = middle
  }
  if (distanceMeters <= first.distanceMeters) low = high = 0
  else if (distanceMeters >= last.distanceMeters) low = high = samples.length - 1

  const start = samples[low]
  const end = samples[high]
  if (![start.lat, start.lng, end.lat, end.lng].every(Number.isFinite)) return null
  const span = end.distanceMeters - start.distanceMeters
  const ratio = low === high || span <= 0 ? 0 : (distanceMeters - start.distanceMeters) / span
  const interpolate = (a: number | undefined, b: number | undefined): number | null =>
    Number.isFinite(a) && Number.isFinite(b) ? a! + (b! - a!) * ratio : null

  return {
    distanceMeters,
    elevationMeters: interpolate(start.elevationMeters, end.elevationMeters),
    lat: interpolate(start.lat, end.lat)!,
    lng: interpolate(start.lng, end.lng)!,
    sampleIndex: ratio < 0.5 ? low : high,
  }
}

/**
 * Derives all route metrics and chart samples from the current place geometry.
 * Persisted tour metrics are only a list/display cache; detail views use this
 * live analysis so their values and profile can never drift apart.
 */
export function analyzeRouteGeometry(routeGeometry: string | null | undefined): RouteGeometryAnalysis | null {
  const points = parseRenderableRouteGeometry(routeGeometry)
  if (!points) return null
  const hasElevation = points.every(point => point.length >= 3 && Number.isFinite(point[2]))
  let distanceMeters = 0
  let minEle = hasElevation ? points[0][2]! : null
  let maxEle = minEle
  let gain = hasElevation ? 0 : null
  let loss = hasElevation ? 0 : null
  const distanceIndexedProfileSamples: DistanceIndexedProfileSample[] = hasElevation
    ? [{ distanceMeters: 0, elevationMeters: points[0][2]!, lat: points[0][0], lng: points[0][1] }]
    : []

  for (let index = 1; index < points.length; index++) {
    distanceMeters += haversineMeters(points[index - 1], points[index])
    if (!hasElevation) continue

    const elevation = points[index][2]!
    minEle = Math.min(minEle!, elevation)
    maxEle = Math.max(maxEle!, elevation)
    const delta = elevation - points[index - 1][2]!
    if (delta > 0) gain! += delta
    else loss! += Math.abs(delta)
    distanceIndexedProfileSamples.push({ distanceMeters, elevationMeters: elevation, lat: points[index][0], lng: points[index][1] })
  }

  return {
    routeCoordinates: points.map(([lat, lng]) => [lat, lng]),
    distanceKm: distanceMeters / 1000,
    minEle,
    maxEle,
    gain,
    loss,
    distanceIndexedProfileSamples,
  }
}
