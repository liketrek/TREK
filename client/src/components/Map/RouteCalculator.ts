import { useSettingsStore } from '../../store/settingsStore'
import { pluginsApi } from '../../api/client'
import type { DistanceUnit, RouteResult, RouteSegment, RouteWithLegs, Waypoint, RouteAnchors } from '../../types'
import { formatDistance } from '../../utils/units'

// FOSSGIS hosts OSRM with real per-profile routing (car/foot/bike) — the
// project-osrm.org demo is car-only (it ignores the profile in the URL). Use
// the matching profile so walking routes follow footpaths, not the road network.
const OSRM_PROFILE_BASE: Record<'driving' | 'walking' | 'cycling', string> = {
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
}

/** OSRM's own profile names, which a self-hosted instance serves under its own paths. */
const OSRM_PROFILE_PATH: Record<'driving' | 'walking' | 'cycling', string> = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike',
}

/**
 * Where to ask for a route.
 *
 * The public FOSSGIS hosts allow roughly one request a second, which a road trip — every
 * leg of every day — runs into immediately. An instance that runs its own OSRM sets
 * `routing_base_url` and everything routes against that instead; the server has to name
 * the same origin in its connect-src, or the browser blocks the requests silently.
 *
 * A configured base is expected to serve the standard OSRM layout,
 * `<base>/route/v1/<profile>/…`, which is what `osrm-routed` does out of the box.
 */
function routeBaseFor(profile: 'driving' | 'walking' | 'cycling'): string {
  const configured = useSettingsStore.getState().settings.routing_base_url?.trim()
  if (!configured) return OSRM_PROFILE_BASE[profile]
  return `${configured.replace(/\/+$/, '')}/route/v1/${OSRM_PROFILE_PATH[profile]}`
}

/**
 * A routing request the host refused, as opposed to one it answered with "no route".
 *
 * The public OSRM instances allow roughly one request a second and answer 429 above that.
 * Both used to arrive as the same generic Error, so a caller could not tell "back off and
 * try again" from "these two points are not connected by road" — and a road trip, which
 * asks for every leg of every day, hits the first case constantly while the second is
 * rare. `retryAfterMs` carries the host's own `Retry-After` when it sends one.
 */
export class RoutingRefusedError extends Error {
  constructor(readonly status: number, readonly retryAfterMs: number | null) {
    super(status === 429 ? 'Routing rate limit reached' : 'Route could not be calculated')
    this.name = 'RoutingRefusedError'
  }

  /** True when waiting and asking again is the right response. */
  get isRateLimit(): boolean {
    return this.status === 429 || this.status === 503
  }
}

/** `Retry-After` is either seconds or an HTTP date; anything else is no answer at all. */
function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get('Retry-After')
  if (!raw) return null
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000)
  const at = Date.parse(raw)
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now())
}

// Cache route responses keyed by the exact waypoint list. Routes are stable, so
// this avoids re-hitting the public OSRM demo server on every day switch / reorder.
const routeCache = new Map<string, RouteWithLegs>()
const ROUTE_CACHE_MAX = 200

/**
 * A route profile is either one of the built-in OSRM profiles or a plugin profile
 * key `plugin:<pluginId>/<profileId>` — the route toggle offers those for every
 * active routeProvider plugin, and calculateRouteWithLegs dispatches on the prefix.
 */
export type RouteProfileKey = 'driving' | 'walking' | 'cycling' | (string & {})

export function parsePluginProfile(profile: string): { pluginId: string; profileId: string } | null {
  if (!profile.startsWith('plugin:')) return null
  const rest = profile.slice('plugin:'.length)
  const slash = rest.indexOf('/')
  if (slash <= 0 || slash === rest.length - 1) return null
  return { pluginId: rest.slice(0, slash), profileId: rest.slice(slash + 1) }
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
  const url = `${routeBaseFor(profile)}/${coords}?overview=full&geometries=geojson&steps=false`

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new RoutingRefusedError(response.status, retryAfterMs(response))
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
    distanceText: formatRouteDistance(distance),
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
export function withHotelBookends<T extends { lat: number; lng: number }>(
  runs: T[][],
  firstWay: T | undefined,
  lastWay: T | undefined,
  startHotel: T | null,
  endHotel: T | null,
): T[][] {
  const out: T[][] = []
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

/** A stop that can carry its name into a deep link that has somewhere to put one. */
export type NamedWaypoint = Waypoint & { name?: string | null }

/** TREK's route profiles in CoMaps' vocabulary; a plugin profile has no equivalent and drives. */
function coMapsRouteType(profile: RouteProfileKey): string {
  if (profile === 'walking') return 'pedestrian'
  if (profile === 'cycling') return 'bicycle'
  return 'vehicle'
}

/**
 * Open a day's stops in CoMaps for offline navigation (#1904).
 *
 * CoMaps has two links and they trade against each other. `route` builds real
 * turn-by-turn in the given travel mode but takes a start and a destination and
 * nothing between them; `map` takes any number of named pins but routes nothing.
 * So a two-stop day goes as a route — everything it has fits, mode included —
 * and a longer one goes as pins, because handing over the whole day and letting
 * CoMaps route leg by leg beats quietly dropping the middle of someone's plan.
 * A day that needs the full itinerary as one navigable track has the GPX export.
 *
 * https rather than `cm://` for the same reason as `getCoMapsUrlForPlace`.
 */
export function generateCoMapsUrl(places: NamedWaypoint[], profile: RouteProfileKey = 'driving'): string | null {
  const valid = places.filter((p) => p.lat != null && p.lng != null)
  if (valid.length === 0) return null
  const label = (p: NamedWaypoint) => encodeURIComponent(p.name?.trim() || `${p.lat},${p.lng}`)
  if (valid.length === 2) {
    const [from, to] = valid
    return `https://comaps.at/route?sll=${from.lat},${from.lng}&saddr=${label(from)}`
      + `&dll=${to.lat},${to.lng}&daddr=${label(to)}&type=${coMapsRouteType(profile)}`
  }
  const pins = valid.map((p) => `ll=${p.lat},${p.lng}&n=${label(p)}`).join('&')
  return `https://comaps.at/map?v=1&${pins}`
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
  const url = `${routeBaseFor('driving')}/${coords}?overview=false&geometries=geojson&steps=false&annotations=distance,duration`

  const response = await fetch(url, { signal })
  if (!response.ok) throw new RoutingRefusedError(response.status, retryAfterMs(response))

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
      distanceText: formatRouteDistance(leg.distance),
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
  { signal, profile = 'driving', tripId, dayId }: { signal?: AbortSignal; profile?: RouteProfileKey; tripId?: number | string | null; dayId?: number | null } = {}
): Promise<RouteWithLegs> {
  if (!waypoints || waypoints.length < 2) {
    return { coordinates: [], distance: 0, duration: 0, legs: [] }
  }

  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';')
  // The cached result carries formatted leg distances, so the active distance unit is
  // part of the key — otherwise switching km↔mi would return stale text (#1300).
  // A plugin route is trip-/day-specific (it may return different charging stops for
  // the same coordinates on a different day), so its key includes tripId/dayId;
  // the built-in OSRM profiles are context-free and leave those out.
  const pluginScope = profile.startsWith('plugin:') ? `:${tripId ?? ''}:${dayId ?? ''}` : ''
  const cacheKey = `${profile}:${getDistanceUnit()}:${coords}${pluginScope}`
  const cached = routeCache.get(cacheKey)
  if (cached) return cached

  // Plugin profile (`plugin:<id>/<profile>`): the server invokes that routeProvider
  // and normalizes its answer; null means the provider failed or refused, and the
  // throw makes callers fall back to straight lines exactly like an OSRM outage.
  const pluginProfile = parsePluginProfile(profile)
  if (pluginProfile) {
    if (tripId == null) throw new Error('Plugin routing needs a trip context')
    const { route } = await pluginsApi.pluginRoute(pluginProfile.pluginId, pluginProfile.profileId, {
      tripId,
      dayId: dayId ?? null,
      waypoints: waypoints.map((p) => ({ lat: p.lat, lng: p.lng })),
    }, { signal })
    if (!route) throw new Error('No route found')
    const legs: RouteSegment[] = route.legs.map((leg, i): RouteSegment => {
      const from: [number, number] = [waypoints[i].lat, waypoints[i].lng]
      const to: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng]
      const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
      return {
        mid, from, to,
        distance: leg.distance,
        duration: leg.duration,
        walkingText: formatDuration(leg.distance / (5000 / 3600)),
        drivingText: formatDuration(leg.duration),
        distanceText: formatRouteDistance(leg.distance),
        durationText: formatDuration(leg.duration),
        ...(leg.note ? { noteText: leg.note } : {}),
      }
    })
    const result: RouteWithLegs = {
      coordinates: route.coordinates,
      distance: route.distance,
      duration: route.duration,
      legs,
      ...(route.viaPoints.length ? { vias: route.viaPoints } : {}),
    }
    routeCache.set(cacheKey, result)
    if (routeCache.size > ROUTE_CACHE_MAX) {
      const oldest = routeCache.keys().next().value
      if (oldest !== undefined) routeCache.delete(oldest)
    }
    return result
  }

  // Written as literals rather than narrowing `profile`: its type is an open string union
  // (plugins name their own modes), which no comparison narrows to the three OSRM knows.
  const osrmProfile: 'driving' | 'walking' | 'cycling' =
    profile === 'walking' ? 'walking' : profile === 'cycling' ? 'cycling' : 'driving'
  const url = `${routeBaseFor(osrmProfile)}/${coords}?overview=full&geometries=geojson&annotations=distance,duration`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new RoutingRefusedError(response.status, retryAfterMs(response))

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
        distanceText: formatRouteDistance(leg.distance),
        durationText: formatDuration(leg.duration),
      }
    }
  )

  const result: RouteWithLegs = { coordinates, distance: route.distance, duration: route.duration, legs }
  routeCache.set(cacheKey, result)
  if (routeCache.size > ROUTE_CACHE_MAX) {
    const oldest = routeCache.keys().next().value
    if (oldest !== undefined) routeCache.delete(oldest)
  }
  return result
}

function getDistanceUnit(): DistanceUnit {
  return useSettingsStore.getState().settings.distance_unit === 'imperial' ? 'imperial' : 'metric'
}

function formatRouteDistance(meters: number): string {
  const unit = getDistanceUnit()
  if (unit === 'metric' && meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return formatDistance(meters / 1000, unit)
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) {
    return `${h} h ${m} min`
  }
  return `${m} min`
}

/** One way of driving a leg, as OSRM offers it. */
export interface RouteAlternative {
  coordinates: [number, number][]
  distance: number
  duration: number
  /** Where this route differs most from the first one — the point that would pin it. */
  divergence: { lat: number; lng: number } | null
  /** Set when this way exists because a road class was left out of it. */
  avoids?: 'motorway' | 'toll'
}

/**
 * Road classes worth asking the router to leave out, in the order they are tried.
 *
 * OSRM's own alternative search is conservative: it only offers a second road when the
 * detour is short enough and shares little enough with the first, so on a long motorway
 * run it usually answers with exactly one route — while a perfectly good, slower way over
 * the B-roads exists and is what somebody opening "other ways" is looking for. Excluding
 * a class asks a different question and reliably produces that road.
 *
 * Only for driving: the foot and bike profiles have no excludable classes, and asking
 * anyway earns an `InvalidOptions` for nothing.
 */
const EXCLUDABLE_CLASSES = ['motorway', 'toll'] as const

/** Two lines are the same road if their length and their duration agree closely enough. */
function sameRoad(a: RouteAlternative, b: RouteAlternative): boolean {
  return Math.abs(a.distance - b.distance) < 200 && Math.abs(a.duration - b.duration) < 60
}

/**
 * One route with a road class left out, or null when the router will not or cannot.
 *
 * Every failure is a null: an instance built without excludable classes answers
 * `InvalidOptions`, a rate limit answers 429, and a leg with no way round the motorway
 * answers `NoRoute`. None of those is worth an error on screen — they all just mean this
 * particular question had no answer.
 */
async function routeExcluding(
  coords: string,
  profile: 'driving' | 'walking' | 'cycling',
  exclude: string,
  signal?: AbortSignal,
): Promise<RouteAlternative | null> {
  try {
    const url = `${routeBaseFor(profile)}/${coords}?exclude=${exclude}&overview=full&geometries=geojson`
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    const data = await response.json()
    const route = data?.code === 'Ok' && Array.isArray(data.routes) ? data.routes[0] : null
    if (!route?.geometry?.coordinates?.length) return null
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
      distance: route.distance,
      duration: route.duration,
      divergence: null,
    }
  } catch {
    return null
  }
}

/**
 * The ways of driving one leg, not one day.
 *
 * Deliberately per leg: OSRM only offers alternatives between exactly two coordinates, so
 * asking for a whole day would mean splitting it into one request per leg — which is the
 * bundling `splitIntoRuns` exists to avoid, and the reason a road trip appears at once
 * instead of trickling in. Asked for a single leg, on demand, it costs one extra request.
 *
 * `divergence` is the point on each alternative that lies furthest from the default route.
 * It is what makes a choice persistable: saving that point as a via forces the router back
 * onto this road on every future request, without storing a polyline that would go stale
 * with the next OSM update.
 */
export async function calculateAlternatives(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
  { signal, limit = 3 }: { signal?: AbortSignal; limit?: number } = {},
): Promise<RouteAlternative[]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${routeBaseFor(profile)}/${coords}?alternatives=${limit}&overview=full&geometries=geojson`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new RoutingRefusedError(response.status, retryAfterMs(response))

  const data = await response.json()
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || !data.routes.length) return []

  const routes: RouteAlternative[] = data.routes.map((r: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }) => ({
    coordinates: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distance: r.distance,
    duration: r.duration,
    divergence: null,
  }))

  // Nothing but the router's own preference came back, which is what it answers on most
  // long legs. Rather than reporting "only one sensible way", ask a different question:
  // the same drive without the motorway, and failing that without the tolls. Tried one at
  // a time and stopped as soon as one lands, so a leg that does have a second road costs
  // one extra request rather than three, and the public hosts' one-per-second limit is
  // not spent on questions already answered.
  if (routes.length < 2 && profile === 'driving') {
    for (const exclude of EXCLUDABLE_CLASSES) {
      if (signal?.aborted) break
      const detour = await routeExcluding(coords, profile, exclude, signal)
      if (detour && !routes.some(r => sameRoad(r, detour))) {
        detour.avoids = exclude
        routes.push(detour)
        break
      }
    }
  }

  // The first route is what the router would have given anyway; the others are measured
  // against it so each one can be pinned by the point that makes it different.
  const [primary, ...rest] = routes
  for (const alt of rest) alt.divergence = furthestPointFrom(alt.coordinates, primary.coordinates)
  return routes
}

/** The point of `line` that lies furthest from `reference`, in plain degrees. */
function furthestPointFrom(line: [number, number][], reference: [number, number][]): { lat: number; lng: number } | null {
  if (!line.length || !reference.length) return null
  // Every tenth vertex is plenty: alternatives differ over kilometres, not metres, and a
  // full cross product of two thousand-point lines is not worth the milliseconds.
  const step = Math.max(1, Math.floor(reference.length / 200))
  let best: { lat: number; lng: number } | null = null
  let bestDist = -1
  for (let i = 0; i < line.length; i += Math.max(1, Math.floor(line.length / 200))) {
    const [lat, lng] = line[i]
    let nearest = Infinity
    for (let j = 0; j < reference.length; j += step) {
      const dLat = lat - reference[j][0]
      const dLng = (lng - reference[j][1]) * Math.cos((lat * Math.PI) / 180)
      const d = dLat * dLat + dLng * dLng
      if (d < nearest) nearest = d
    }
    if (nearest > bestDist) { bestDist = nearest; best = { lat, lng } }
  }
  return best
}
