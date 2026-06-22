import type { RouteResult, RouteSegment, RouteWithLegs, Waypoint, RouteAnchors } from '../../types'
import { apiClient } from '../../api/client'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

// FOSSGIS hosts OSRM with real per-profile routing (car/foot/bike) — the
// project-osrm.org demo is car-only (it ignores the profile in the URL). Use
// the matching profile so walking routes follow footpaths, not the road network.
const OSRM_PROFILE_BASE: Record<'driving' | 'walking' | 'cycling', string> = {
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
}

// Cache route responses keyed by the exact waypoint list. Routes are stable, so
// this avoids re-hitting the public OSRM demo server on every day switch / reorder.
const routeCache = new Map<string, RouteWithLegs>()
const ROUTE_CACHE_MAX = 200
const ROUTE_CACHE_STORAGE_KEY = 'trek:route-cache:v1'
const ROUTE_CACHE_VERSION = 1
const ROUTE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
export type RoutingProvider = 'osrm' | 'google_maps'

interface GoogleDirectionsDuration {
  seconds: number | null
  text: string | null
}

interface GoogleDirectionsRoute {
  distance?: { meters: number | null; text: string | null }
  duration?: GoogleDirectionsDuration
  traffic?: {
    duration?: GoogleDirectionsDuration | null
    range?: { minSeconds: number | null; maxSeconds: number | null; text: string | null } | null
  } | null
  overviewGeometry?: Array<{ lat: number; lng: number }>
}

interface GoogleDirectionsResponse {
  routes?: GoogleDirectionsRoute[]
}

interface StoredRouteCacheEntry {
  key: string
  savedAt: number
  route: RouteWithLegs
}

interface StoredRouteCache {
  version: number
  entries: StoredRouteCacheEntry[]
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStoredRouteCache(): StoredRouteCacheEntry[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(ROUTE_CACHE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredRouteCache
    if (parsed?.version !== ROUTE_CACHE_VERSION || !Array.isArray(parsed.entries)) return []
    const cutoff = Date.now() - ROUTE_CACHE_MAX_AGE_MS
    return parsed.entries
      .filter(entry => entry && typeof entry.key === 'string' && entry.savedAt >= cutoff && entry.route)
      .slice(-ROUTE_CACHE_MAX)
  } catch {
    return []
  }
}

function writeStoredRouteCache(entries: StoredRouteCacheEntry[]): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(ROUTE_CACHE_STORAGE_KEY, JSON.stringify({
      version: ROUTE_CACHE_VERSION,
      entries: entries.slice(-ROUTE_CACHE_MAX),
    }))
  } catch {
    // Storage can be unavailable or full; the in-memory cache still works.
  }
}

function getPersistedRoute(cacheKey: string): RouteWithLegs | null {
  const entries = readStoredRouteCache()
  const entry = entries.find(e => e.key === cacheKey)
  if (!entry) return null
  routeCache.set(cacheKey, entry.route)
  return entry.route
}

function setCachedRoute(cacheKey: string, route: RouteWithLegs): void {
  routeCache.set(cacheKey, route)
  if (routeCache.size > ROUTE_CACHE_MAX) {
    const oldest = routeCache.keys().next().value
    if (oldest !== undefined) routeCache.delete(oldest)
  }

  const entries = readStoredRouteCache().filter(e => e.key !== cacheKey)
  entries.push({ key: cacheKey, savedAt: Date.now(), route })
  writeStoredRouteCache(entries)
}

export function __clearRouteCacheForTests(): void {
  routeCache.clear()
}

/** Fetches a full route via OSRM and returns coordinates, distance, and duration estimates for driving/walking. */
export async function calculateRoute(
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
  { signal }: { signal?: AbortSignal } = {}
): Promise<RouteResult> {
  if (!waypoints || waypoints.length < 2) {
    throw new Error('At least 2 waypoints required')
  }

  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_BASE}/${profile}/${coords}?overview=full&geometries=geojson&steps=false`

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error('Route could not be calculated')
  }

  const data = await response.json()

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found')
  }

  const route = data.routes[0]
  const coordinates: [number, number][] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])

  const distance: number = route.distance
  let duration: number
  if (profile === 'walking') {
    duration = distance / (5000 / 3600)
  } else if (profile === 'cycling') {
    duration = distance / (15000 / 3600)
  } else {
    duration = route.duration
  }

  const walkingDuration = distance / (5000 / 3600)
  const drivingDuration: number = route.duration

  return {
    coordinates,
    distance,
    duration,
    distanceText: formatDistance(distance),
    durationText: formatDuration(duration),
    walkingText: formatDuration(walkingDuration),
    drivingText: formatDuration(drivingDuration),
  }
}

/**
 * Prepends a hotel→first-waypoint run and appends a last-waypoint→hotel run to the
 * day's activity runs, so the drawn route starts and ends at the day's accommodation
 * (matching the sidebar's hotel connectors). A bookend is only added when both its
 * hotel and the first/last located waypoint exist; passing nulls leaves `runs`
 * untouched. The shared first/last waypoint is repeated so the polylines join.
 */
export function withHotelBookends(
  runs: Waypoint[][],
  firstWay: Waypoint | undefined,
  lastWay: Waypoint | undefined,
  startHotel: Waypoint | null,
  endHotel: Waypoint | null,
): Waypoint[][] {
  const out: Waypoint[][] = []
  if (startHotel && firstWay) out.push([startHotel, firstWay])
  out.push(...runs)
  if (endHotel && lastWay) out.push([lastWay, endHotel])
  return out
}

export function generateGoogleMapsUrl(places: Waypoint[]): string | null {
  const valid = places.filter((p) => p.lat && p.lng)
  if (valid.length === 0) return null
  if (valid.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${valid[0].lat},${valid[0].lng}`
  }
  const stops = valid.map((p) => `${p.lat},${p.lng}`).join('/')
  return `https://www.google.com/maps/dir/${stops}`
}

// Squared planar distance — enough for nearest-neighbor comparisons and cheaper than a full haversine.
function sqDist(a: Waypoint, b: Waypoint): number {
  return (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2
}

// Length of visiting `order` in sequence, optionally pinned to a fixed start and/or end anchor.
// With start === end this is a closed loop back to the anchor (a day out from and back to the hotel).
function tourLength(order: Waypoint[], start?: Waypoint, end?: Waypoint): number {
  if (order.length === 0) return 0
  let total = 0
  if (start) total += Math.sqrt(sqDist(start, order[0]))
  for (let i = 0; i < order.length - 1; i++) total += Math.sqrt(sqDist(order[i], order[i + 1]))
  if (end) total += Math.sqrt(sqDist(order[order.length - 1], end))
  return total
}

// Greedy nearest-neighbor ordering, seeded at the start anchor when there is one.
function nearestNeighborOrder<T extends Waypoint>(valid: T[], start?: Waypoint): T[] {
  const visited = new Set<number>()
  const result: T[] = []
  let current: Waypoint
  if (start) {
    current = start
  } else {
    current = valid[0]
    visited.add(0)
    result.push(valid[0])
  }
  while (result.length < valid.length) {
    let nearestIdx = -1
    let minDist = Infinity
    for (let i = 0; i < valid.length; i++) {
      if (visited.has(i)) continue
      const d = sqDist(valid[i], current)
      if (d < minDist) { minDist = d; nearestIdx = i }
    }
    if (nearestIdx === -1) break
    visited.add(nearestIdx)
    current = valid[nearestIdx]
    result.push(valid[nearestIdx])
  }
  return result
}

// 2-opt: repeatedly reverse a sub-segment whenever it shortens the tour. This removes the crossings
// a pure nearest-neighbor pass leaves behind. The start/end anchors stay fixed, so a round trip
// (start === end) is untangled into a clean loop rather than an open path.
function twoOptImprove<T extends Waypoint>(order: T[], start?: Waypoint, end?: Waypoint): T[] {
  if (order.length < 3) return order
  let best = order
  let bestLen = tourLength(best, start, end)
  let improved = true
  while (improved) {
    improved = false
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1))
        const len = tourLength(candidate, start, end)
        if (len < bestLen - 1e-12) {
          best = candidate
          bestLen = len
          improved = true
        }
      }
    }
  }
  return best
}

/**
 * Reorders waypoints to minimize travel distance: a nearest-neighbor pass for a good starting order,
 * then 2-opt to untangle crossings. Optional anchors (e.g. the day's accommodation) pin the route's
 * ends — start === end makes it a loop out from and back to the hotel; a transfer day runs start → end.
 */
export function optimizeRoute<T extends Waypoint>(places: T[], anchors: RouteAnchors = {}): T[] {
  const { start, end } = anchors
  const valid = places.filter((p) => p.lat && p.lng)
  if (valid.length <= 1) return places
  // Two unanchored stops have no meaningful order to optimize; anchors can still flip them.
  if (valid.length === 2 && !start && !end) return places

  const order = twoOptImprove(nearestNeighborOrder(valid, start), start, end)

  // A round trip's loop direction is arbitrary, so orient it to begin at the stop nearest the hotel —
  // that reads naturally as "leave the hotel, head to the closest place, …, come back".
  if (start && end && start.lat === end.lat && start.lng === end.lng && order.length > 1) {
    if (sqDist(order[order.length - 1], start) < sqDist(order[0], start)) order.reverse()
  }

  return order
}

/** Fetches per-leg distance/duration from OSRM and returns segment metadata (midpoints, walking/driving times). */
export async function calculateSegments(
  waypoints: Waypoint[],
  { signal }: { signal?: AbortSignal } = {}
): Promise<RouteSegment[]> {
  if (!waypoints || waypoints.length < 2) return []

  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_BASE}/driving/${coords}?overview=false&geometries=geojson&steps=false&annotations=distance,duration`

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Route could not be calculated')

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route found')

  const legs = data.routes[0].legs
  return legs.map((leg: { distance: number; duration: number }, i: number): RouteSegment => {
    const from: [number, number] = [waypoints[i].lat, waypoints[i].lng]
    const to: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng]
    const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
    const walkingDuration = leg.distance / (5000 / 3600)
    return {
      mid, from, to,
      distance: leg.distance,
      duration: leg.duration,
      walkingText: formatDuration(walkingDuration),
      drivingText: formatDuration(leg.duration),
      distanceText: formatDistance(leg.distance),
    }
  })
}

/**
 * One OSRM call per waypoint-run that returns BOTH the real road geometry (for the
 * map) and per-leg distance/duration (for the sidebar connectors). Results are cached
 * by the exact waypoint list. Throws on OSRM failure so callers can fall back to a
 * straight line.
 */
export async function calculateRouteWithLegs(
  waypoints: Waypoint[],
  {
    signal,
    profile = 'driving',
    provider = 'osrm',
    optimism = 0.33,
    departureLocalDateTime,
  }: {
    signal?: AbortSignal
    profile?: 'driving' | 'walking' | 'cycling'
    provider?: RoutingProvider
    optimism?: number
    departureLocalDateTime?: string | null
  } = {}
): Promise<RouteWithLegs> {
  if (!waypoints || waypoints.length < 2) {
    return { coordinates: [], distance: 0, duration: 0, legs: [] }
  }

  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';')
  const boundedOptimism = normalizeOptimism(optimism)
  const cacheKey = provider === 'google_maps'
    ? `${provider}:${profile}:${boundedOptimism.toFixed(2)}:${departureLocalDateTime || 'now'}:${coords}`
    : `${provider}:${profile}:${coords}`
  const cached = routeCache.get(cacheKey)
  if (cached) return cached
  const persisted = getPersistedRoute(cacheKey)
  if (persisted) return persisted

  if (provider === 'google_maps') {
    const result = await calculateGoogleRouteWithLegs(waypoints, {
      signal,
      profile,
      optimism: boundedOptimism,
      departureLocalDateTime,
    })
    setCachedRoute(cacheKey, result)
    return result
  }

  const url = `${OSRM_PROFILE_BASE[profile]}/${coords}?overview=full&geometries=geojson&annotations=distance,duration`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Route could not be calculated')

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route found')

  const route = data.routes[0]
  const coordinates: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  )
  const legs: RouteSegment[] = (route.legs || []).map(
    (leg: { distance: number; duration: number }, i: number): RouteSegment => {
      const from: [number, number] = [waypoints[i].lat, waypoints[i].lng]
      const to: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng]
      const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
      const walkingDuration = leg.distance / (5000 / 3600)
      return {
        mid, from, to,
        distance: leg.distance,
        duration: leg.duration,
        walkingText: formatDuration(walkingDuration),
        drivingText: formatDuration(leg.duration),
        distanceText: formatDistance(leg.distance),
        durationText: formatDuration(leg.duration),
      }
    }
  )

  const result: RouteWithLegs = { coordinates, distance: route.distance, duration: route.duration, legs }
  setCachedRoute(cacheKey, result)
  return result
}

function normalizeOptimism(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.33
}

function googleMode(profile: 'driving' | 'walking' | 'cycling'): 'driving' | 'walking' | 'bicycling' {
  return profile === 'cycling' ? 'bicycling' : profile
}

function addSecondsToLocalDateTime(localDateTime: string, seconds: number): string {
  const match = localDateTime.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return localDateTime
  const [, y, mo, d, h, mi, s = '0'] = match
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
  date.setUTCSeconds(date.getUTCSeconds() + Math.max(0, Math.round(seconds)))
  return date.toISOString().slice(0, 16)
}

function pickGoogleDurationSeconds(route: GoogleDirectionsRoute, optimism: number): number {
  const min = route.traffic?.range?.minSeconds
  const max = route.traffic?.range?.maxSeconds
  if (Number.isFinite(min) && Number.isFinite(max)) {
    const best = Number(min)
    const worst = Number(max)
    return Math.max(0, worst - (worst - best) * optimism)
  }
  const trafficDuration = route.traffic?.duration?.seconds
  if (Number.isFinite(trafficDuration)) return Math.max(0, Number(trafficDuration))
  const duration = route.duration?.seconds
  return Number.isFinite(duration) ? Math.max(0, Number(duration)) : 0
}

async function calculateGoogleRouteWithLegs(
  waypoints: Waypoint[],
  {
    signal,
    profile,
    optimism,
    departureLocalDateTime,
  }: {
    signal?: AbortSignal
    profile: 'driving' | 'walking' | 'cycling'
    optimism: number
    departureLocalDateTime?: string | null
  },
): Promise<RouteWithLegs> {
  const legs: RouteSegment[] = []
  const coordinates: [number, number][] = []
  let distance = 0
  let duration = 0
  let currentDeparture = departureLocalDateTime || null

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i]
    const to = waypoints[i + 1]
    const body = {
      origin: { lat: from.lat, lng: from.lng },
      destination: { lat: to.lat, lng: to.lng },
      mode: googleMode(profile),
      includeOverviewGeometry: true,
      includeSteps: false,
      ...(currentDeparture ? { time: { kind: 'departAtLocal' as const, localDateTime: currentDeparture } } : {}),
    }
    const response = await apiClient.post('/maps/directions-preview', body, { signal }).then(r => r.data as GoogleDirectionsResponse)
    const route = response.routes?.[0]
    if (!route) throw new Error('No route found')

    const legDuration = pickGoogleDurationSeconds(route, optimism)
    const legDistance = Number(route.distance?.meters) || 0
    const geometry = route.overviewGeometry?.map(p => [p.lat, p.lng] as [number, number])
    if (geometry?.length) {
      if (coordinates.length && geometry.length && coordinates[coordinates.length - 1][0] === geometry[0][0] && coordinates[coordinates.length - 1][1] === geometry[0][1]) {
        coordinates.push(...geometry.slice(1))
      } else {
        coordinates.push(...geometry)
      }
    } else {
      if (coordinates.length === 0) coordinates.push([from.lat, from.lng])
      coordinates.push([to.lat, to.lng])
    }

    const mid: [number, number] = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2]
    const durationText = formatDuration(legDuration)
    legs.push({
      mid,
      from: [from.lat, from.lng],
      to: [to.lat, to.lng],
      distance: legDistance,
      duration: legDuration,
      walkingText: durationText,
      drivingText: durationText,
      distanceText: route.distance?.text ?? formatDistance(legDistance),
      durationText,
    })
    distance += legDistance
    duration += legDuration
    if (currentDeparture) currentDeparture = addSecondsToLocalDateTime(currentDeparture, legDuration)
  }

  return {
    coordinates,
    distance,
    duration,
    legs,
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) {
    return `${h} h ${m} min`
  }
  return `${m} min`
}
