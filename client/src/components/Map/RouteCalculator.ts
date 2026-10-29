import { useSettingsStore } from '../../store/settingsStore'
import { pluginsApi } from '../../api/client'
import type { RouteEngine, RouteResult, RouteSegment, RouteWithLegs, SnappedWaypoint, Waypoint, RouteAnchors } from '../../types'
import { haversineKm } from '../../utils/geo'
import { countRoute } from './routeUsageCounter'
import { cacheRoute, rememberRoute, routeInMemory, storedRoute } from './routeStore'
import { formatDuration, formatRouteDistance, getDistanceUnit, legSegment } from './routeText'
import type { RouteAlternative } from './routeTypes'
import { valhallaAvailable, valhallaPlansDays, valhallaRoutesDays, type AvoidClass } from './valhallaRoute'
import { EXCLUDABLE_CLASSES, valhallaDayAlternatives, valhallaDayRoute, valhallaExcluding } from './valhallaDayRoute'
import { furthestFrom, sameRoad, type RouteUsageSurface } from '@trek/shared'

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
/**
 * A configured base URL without its trailing slashes.
 *
 * Walked rather than matched with `/\/+$/`: that pattern backtracks over a run of
 * slashes, and the value comes from an instance setting somebody types. Linear either
 * way in practice, but the regex is the shape a scanner is right to flag.
 */
function withoutTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}

function routeBaseFor(profile: 'driving' | 'walking' | 'cycling'): string {
  const configured = useSettingsStore.getState().settings.routing_base_url?.trim()
  if (!configured) return OSRM_PROFILE_BASE[profile]
  return `${withoutTrailingSlashes(configured)}/route/v1/${OSRM_PROFILE_PATH[profile]}`
}

/**
 * Permission to turn around at a stop, for requests that have stops to turn around at.
 *
 * OSRM's car profile forbids a u-turn at an INTERMEDIATE waypoint unless asked otherwise,
 * and a refusal is not local: the whole request comes back `400 NoRoute`, every leg of it,
 * however many were fine. A stop on a dead end is enough. Gouffre de Padirac snaps onto
 * `Route du Puits au Salvage`, which goes nowhere else, so a day that visits it in the
 * middle lost all its legs at once while each of its pairs routed perfectly on its own.
 * That is also why the fault looked like it depended on how the stops were spread across
 * days: a pair on a day boundary is asked for on its own, and a request with nothing in
 * the middle has nothing to refuse.
 *
 * Correct as well as convenient here. TREK's waypoints are places somebody stops at, not
 * shape hints, and the way out of a dead end IS the way back in, and the constraint was
 * buying a detour even where it did not refuse outright.
 *
 * Empty for two waypoints, which have no middle, so the many two-point callers
 * (alternatives, the day connectors, booking geometry) keep the URL they had.
 */
const U_TURN_PARAM = '&continue_straight=false'

function uTurnParam(waypoints: readonly Waypoint[]): string {
  return waypoints.length > 2 ? U_TURN_PARAM : ''
}

/**
 * `fetch`, with the request counted.
 *
 * Every route TREK draws goes out from here, and nowhere else, which makes this the one
 * place that can answer how much routing an instance really does — the number behind
 * "could we host an engine ourselves". Counted: how many requests, of what kind, how
 * many waypoints, roughly how far, and whether the host refused. Not counted, because it
 * is never sent: where any of it was.
 *
 * Distance is the straight line along the waypoint chain rather than the routed length,
 * which is only in the answer and differs per response shape. It is a floor on the real
 * figure, and a floor is enough to tell a 1500 km per-request limit from a 150 km one.
 *
 * An aborted request is not a failure: the map cancels constantly while someone drags.
 */
async function routedFetch(
  url: string,
  signal: AbortSignal | undefined,
  kind: RouteUsageSurface,
  profile: 'driving' | 'walking' | 'cycling',
  waypoints: readonly Waypoint[],
): Promise<Response> {
  const selfHosted = !!useSettingsStore.getState().settings.routing_base_url?.trim()
  let km = 0
  for (let i = 1; i < waypoints.length; i++) km += haversineKm(waypoints[i - 1], waypoints[i])
  const sample = { profile, surface: kind, selfHosted, waypoints: waypoints.length, km }
  const asked = withoutUTurnIfRefused(url)
  try {
    const response = await fetch(asked, { signal })
    countRoute({ ...sample, failed: !response.ok })
    if (response.ok || !asked.includes(U_TURN_PARAM)) return response
    const plain = await droppedUTurn(asked, response)
    if (!plain) return response
    const second = await fetch(plain, { signal })
    countRoute({ ...sample, failed: !second.ok })
    return second
  } catch (err) {
    if (!(err instanceof DOMException && err.name === 'AbortError')) {
      countRoute({ ...sample, failed: true })
    }
    throw err
  }
}

/**
 * Hosts that answered `InvalidQuery` to `continue_straight`, by origin.
 *
 * OSRM refuses an unknown query parameter outright rather than ignoring it, so a router
 * that has never heard of this one would refuse EVERY request with a stop in the middle,
 * which is a far worse fault than the one it fixes. `osrm-routed` has understood it
 * since 5.6, so this is about something else answering under `routing_base_url`, and the
 * first real request is the probe: there is no separate one.
 *
 * By origin rather than per profile, because a router either knows the parameter or does
 * not; and in a Set rather than a setting, so pointing the instance at a router that does
 * know it starts asking again without a reload. Same shape and the same reasoning as
 * `excludeUnsupported` below.
 */
const uTurnUnsupported = new Set<string>()

const originOf = (url: string): string => {
  try { return new URL(url).origin } catch { return url }
}

/** The url as it should go out, with the permission dropped for a host that refused it. */
function withoutUTurnIfRefused(url: string): string {
  if (!url.includes(U_TURN_PARAM)) return url
  return uTurnUnsupported.has(originOf(url)) ? url.replace(U_TURN_PARAM, '') : url
}

/**
 * The same url without the u-turn permission, once it is clear the host objects to the
 * PARAMETER and not to the route. Null when the refusal was about the route itself.
 *
 * OSRM says which it is: `InvalidQuery` names the query string, `NoRoute` names the road.
 * Reading the body is safe here because this response is about to be thrown away either
 * way, and it only happens on a 400 for a request that carried the parameter.
 */
async function droppedUTurn(url: string, response: Response): Promise<string | null> {
  if (response.status !== 400) return null
  let code: unknown
  try { code = (await response.clone().json())?.code } catch { return null }
  if (code !== 'InvalidQuery') return null
  uTurnUnsupported.add(originOf(url))
  return url.replace(U_TURN_PARAM, '')
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

/** One of the three profiles both engines know, or null for a plugin's own. */
function builtInProfile(profile: RouteProfileKey): 'driving' | 'walking' | 'cycling' | null {
  return profile === 'driving' || profile === 'walking' || profile === 'cycling' ? profile : null
}

/**
 * The classes a request really weighs away, in a stable order, and none when it cannot.
 *
 * Only the driving profile has classes to leave out and only Valhalla can leave them out,
 * so every other request is asked plainly whatever the trip says. One function for the
 * day routing and for the offers beside it, so the two cannot disagree about which engine
 * a leg belongs to.
 */
export function avoidedClasses(profile: RouteProfileKey, avoid: readonly AvoidClass[]): AvoidClass[] {
  return profile === 'driving' && avoid.length > 0 && valhallaAvailable()
    ? [...avoid].sort((a, b) => a.localeCompare(b))
    : []
}

/**
 * The engine a request with this profile and avoidance is planned with: Valhalla for every
 * day where it routes the days, and for a day that avoids something wherever it can; OSRM
 * for the rest. Planned, not promised: a day Valhalla cannot answer, or one asked while
 * the relay rests, is drawn by OSRM, and the answer says so in its `engine`.
 */
export function routeEngineFor(profile: RouteProfileKey, avoid: readonly AvoidClass[]): RouteEngine {
  if (parsePluginProfile(profile)) return 'plugin'
  if (avoidedClasses(profile, avoid).length) return 'valhalla'
  return builtInProfile(profile) && valhallaPlansDays() ? 'valhalla' : 'osrm'
}

/** The profile Valhalla routes a request under, or null where `routeEngineFor` gives it to another engine. */
function valhallaProfile(profile: RouteProfileKey, avoid: readonly AvoidClass[]): 'driving' | 'walking' | 'cycling' | null {
  return routeEngineFor(profile, avoid) === 'valhalla' ? builtInProfile(profile) : null
}

/**
 * Where a Valhalla answer is kept: beside the OSRM key, which keeps the shape it always
 * had. A day that weighs classes away keeps the key it has had since only Valhalla could
 * answer one, so the days a device already holds stay found; a day that avoids nothing
 * names the engine instead.
 */
function valhallaKey(plainKey: string, avoiding: readonly AvoidClass[]): string {
  return avoiding.length ? `${plainKey}:avoid=${avoiding.join(',')}` : `${plainKey}:valhalla`
}

/**
 * OSRM's answer for a day Valhalla could not route. A day that avoided nothing is then
 * routed as it always was, without a word. One that avoided something says that nothing
 * was avoided, with the reason, so the rail flags the day instead of implying the setting
 * held on a road nobody weighed.
 */
function withFallbackNoted(plain: RouteWithLegs, avoiding: AvoidClass[]): RouteWithLegs {
  const drawn = withEngine(plain, 'osrm')
  return avoiding.length ? { ...drawn, avoidance: { asked: avoiding, achieved: [], fellBack: true } } : drawn
}

/**
 * A kept route with the engine that drew it. A key holds one engine's answers only, so an
 * entry kept before answers named their engine is that key's.
 */
function withEngine(route: RouteWithLegs, engine: RouteEngine): RouteWithLegs {
  return route.engine ? route : { ...route, engine }
}

/**
 * A day planned with Valhalla: its answer, kept under the Valhalla key, or where it gives
 * none OSRM's for the whole day, kept under the plain key. One engine per day, never one
 * leg from each. While the relay rests, a day that avoids nothing is not put to it at all.
 */
async function valhallaOrOsrmDay(
  waypoints: Waypoint[],
  { profile, avoiding, keys, signal }: {
    profile: 'driving' | 'walking' | 'cycling'
    avoiding: AvoidClass[]
    keys: { valhalla: string; plain: string; coords: string }
    signal?: AbortSignal
  },
): Promise<RouteWithLegs> {
  const asking = avoiding.length > 0 || valhallaRoutesDays()
  const routed = asking ? await valhallaDayRoute(waypoints, profile, avoiding, signal) : null
  if (routed) {
    cacheRoute(keys.valhalla, routed)
    return routed
  }
  const plain = (await storedRoute(keys.plain)) ?? await osrmWithLegs(waypoints, keys.coords, profile, signal)
  cacheRoute(keys.plain, plain)
  return withFallbackNoted(plain, avoiding)
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
  const url = `${routeBaseFor(profile)}/${coords}?overview=full&geometries=geojson&steps=false${uTurnParam(waypoints)}`

  const response = await routedFetch(url, signal, 'route', profile, waypoints)
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
  const url = `${routeBaseFor('driving')}/${coords}?overview=false&geometries=geojson&steps=false&annotations=distance,duration${uTurnParam(waypoints)}`

  const response = await routedFetch(url, signal, 'segments', 'driving', waypoints)
  if (!response.ok) throw new RoutingRefusedError(response.status, retryAfterMs(response))

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route found')

  const legs = data.routes[0].legs
  return legs.map((leg: OsrmLeg, i: number): RouteSegment => legSegment(leg, i, waypoints))
}

interface OsrmLeg { distance: number; duration: number }

/**
 * One OSRM call per waypoint-run that returns BOTH the real road geometry (for the
 * map) and per-leg distance/duration (for the sidebar connectors). Results are cached
 * by the exact waypoint list. Throws on OSRM failure so callers can fall back to a
 * straight line.
 */
export async function calculateRouteWithLegs(
  waypoints: Waypoint[],
  { signal, profile = 'driving', tripId, dayId, avoid = [] }: {
    signal?: AbortSignal
    profile?: RouteProfileKey
    tripId?: number | string | null
    dayId?: number | null
    /** Road classes to weight away. Only the driving profile has any, and only Valhalla can. */
    avoid?: readonly AvoidClass[]
  } = {}
): Promise<RouteWithLegs> {
  if (!waypoints || waypoints.length < 2) {
    return { coordinates: [], distance: 0, duration: 0, legs: [] }
  }

  const valhallaDay = valhallaProfile(profile, avoid)
  const avoiding = avoidedClasses(profile, avoid)

  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';')
  // The cached result carries formatted leg distances, so the active distance unit is
  // part of the key — otherwise switching km↔mi would return stale text (#1300).
  // A plugin route is trip-/day-specific (it may return different charging stops for
  // the same coordinates on a different day), so its key includes tripId/dayId;
  // the built-in profiles are context-free and leave those out.
  //
  // The engine belongs in the key because the two price roads differently: a day OSRM
  // drew handed out as Valhalla's after the admin switched engines would keep the old
  // times on every device that held it, and the other way round. An OSRM answer keeps
  // the key it always had, so the routes already kept on a device stay good.
  //
  // The avoidance belongs in the key for two reasons pointing opposite ways. Without it
  // turning the switch on returns the tolled route out of cache in under a millisecond,
  // so nothing on screen changes and it reads as a broken toggle. And the leak the other
  // way is worse: this Map is shared with the ordinary day planner, the studio and the
  // booking geometry, none of which ask for avoidance, so an avoid-routed answer stored
  // under the plain key would hand them a road nobody drives. So the Valhalla keys only
  // ever hold a Valhalla answer: when Valhalla cannot answer and OSRM drives the request
  // after all, that answer is filed under the OSRM key, where it is exactly what an
  // ordinary caller would have got. Filed under the Valhalla key it stood in for the
  // weighed road until the next reload, however soon Valhalla came back.
  const pluginScope = profile.startsWith('plugin:') ? `:${tripId ?? ''}:${dayId ?? ''}` : ''
  const plainKey = `${profile}:${getDistanceUnit()}:${coords}${pluginScope}`
  // Which engine the day is planned with does not follow the relay's rest, so a day kept
  // from Valhalla is still found while the relay rests, offline above all.
  const cacheKey = valhallaDay ? valhallaKey(plainKey, avoiding) : plainKey
  // A plugin route stays in memory: its answer depends on the trip and the day,
  // and may carry live data such as charging stops. The rest is kept on the device
  // too, so a trip that shows its whole route opens drawn (#2794).
  const cached = pluginScope ? routeInMemory(cacheKey) : await storedRoute(cacheKey)
  if (cached) return withEngine(cached, routeEngineFor(profile, avoid))

  if (valhallaDay) {
    const keys = { valhalla: cacheKey, plain: plainKey, coords }
    return valhallaOrOsrmDay(waypoints, { profile: valhallaDay, avoiding, keys, signal })
  }

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
    const legs = route.legs.map((leg, i): RouteSegment => ({
      ...legSegment(leg, i, waypoints),
      durationText: formatDuration(leg.duration),
      ...(leg.note ? { noteText: leg.note } : {}),
    }))
    const result: RouteWithLegs = {
      coordinates: route.coordinates,
      distance: route.distance,
      duration: route.duration,
      legs,
      ...(route.viaPoints.length ? { vias: route.viaPoints } : {}),
      engine: 'plugin',
    }
    rememberRoute(cacheKey, result)
    return result
  }

  const result = await osrmWithLegs(waypoints, coords, profile, signal)
  cacheRoute(cacheKey, result)
  return result
}

/** The OSRM answer for a chain, one leg per waypoint pair. Throws like every OSRM call here. */
async function osrmWithLegs(
  waypoints: Waypoint[],
  coords: string,
  profile: RouteProfileKey,
  signal?: AbortSignal,
): Promise<RouteWithLegs> {
  // Written as literals rather than narrowing `profile`: its type is an open string union
  // (plugins name their own modes), which no comparison narrows to the three OSRM knows.
  const osrmProfile: 'driving' | 'walking' | 'cycling' =
    profile === 'walking' ? 'walking' : profile === 'cycling' ? 'cycling' : 'driving'
  const url = `${routeBaseFor(osrmProfile)}/${coords}?overview=full&geometries=geojson&annotations=distance,duration${uTurnParam(waypoints)}`
  const response = await routedFetch(url, signal, 'legs', osrmProfile, waypoints)
  if (!response.ok) throw new RoutingRefusedError(response.status, retryAfterMs(response))

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route found')

  const route = data.routes[0]
  const coordinates: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  )
  // The day plan's connectors also show the leg's own duration line.
  const legs: RouteSegment[] = (route.legs || []).map(
    (leg: OsrmLeg, i: number): RouteSegment => ({
      ...legSegment(leg, i, waypoints),
      durationText: formatDuration(leg.duration),
    })
  )

  const snapped = readSnapped(data, waypoints)
  return { coordinates, distance: route.distance, duration: route.duration, legs, ...(snapped ? { snapped } : {}), engine: 'osrm' }
}

/**
 * The snap positions out of an OSRM answer, or undefined if it did not describe them.
 *
 * OSRM reports this in every response and TREK has thrown it away since the first route
 * was drawn. `distance` is the straight line from the coordinate we sent to the road it
 * used; it is recomputed from the two points when the field is missing or nonsense, so a
 * mirror that trims its answers still produces a usable gap rather than a wrong one.
 *
 * All-or-nothing on purpose: a partial list would have to be indexed by waypoint anyway,
 * and one bad entry would put a spur on the wrong stop.
 */
function readSnapped(data: unknown, waypoints: Waypoint[]): SnappedWaypoint[] | undefined {
  const raw = (data as { waypoints?: unknown })?.waypoints
  if (!Array.isArray(raw) || raw.length !== waypoints.length) return undefined
  const out: SnappedWaypoint[] = []
  for (let i = 0; i < raw.length; i++) {
    const loc = (raw[i] as { location?: unknown })?.location
    if (!Array.isArray(loc) || loc.length < 2) return undefined
    const [lng, lat] = loc as [number, number]
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
    const asked: [number, number] = [waypoints[i].lat, waypoints[i].lng]
    const at: [number, number] = [lat, lng]
    const reported = (raw[i] as { distance?: unknown })?.distance
    const meters = typeof reported === 'number' && Number.isFinite(reported) && reported >= 0
      ? reported
      : haversineKm({ lat: asked[0], lng: asked[1] }, { lat, lng }) * 1000
    out.push({ asked, at, meters })
  }
  return out
}

/**
 * Hosts that have already answered "I do not do exclude", by base URL.
 *
 * Both public hosts TREK ships with reject the parameter outright with HTTP 400: the
 * upstream car profile is built without excludable classes, and only a self-hosted OSRM
 * built through the MLD pipeline supports it. Without this, every long leg on a default
 * install pays two extra requests to be told twice that it cannot have what it asked for,
 * against a host that allows one request per second.
 *
 * The first real attempt is the probe; there is no separate one. Only a 400 is recorded,
 * because only a 400 is about the host rather than about this particular question: a 429
 * is a rate limit, an abort is the user moving on, and a `NoRoute` means this leg has no
 * way round the motorway while the next one might.
 *
 * Per base URL rather than global, so pointing the instance at an own router that does
 * support it starts asking again without a reload.
 */
const excludeUnsupported = new Set<string>()

/**
 * One route with a road class left out, or null when the router will not or cannot.
 *
 * Every failure is a null: a rate limit answers 429, and a leg with no way round the
 * motorway answers `NoRoute`. Neither is worth an error on screen — they just mean this
 * particular question had no answer.
 */
async function routeExcluding(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  exclude: AvoidClass,
  signal?: AbortSignal,
): Promise<RouteAlternative | null> {
  // Valhalla first, because on a default install it is the only one of the two that
  // can answer at all. It weights the class away instead of banning it, so it also
  // answers on a leg where the class cannot be avoided — and says so, which is why the
  // result is thrown away below unless the road really came back without it.
  const weighted = await valhallaExcluding(from, to, profile, exclude, signal)
  if (weighted) return weighted

  // OSRM has a ferry class too, but on a leg where the ferry IS the crossing it answers
  // NoRoute rather than driving round, so there is nothing to offer and no point paying
  // a request to be told so.
  if (exclude === 'ferry') return null
  return osrmExcluding(from, to, profile, exclude, signal)
}

/** The same leg from OSRM with the class excluded outright, or null. */
async function osrmExcluding(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  exclude: AvoidClass,
  signal?: AbortSignal,
): Promise<RouteAlternative | null> {
  const base = routeBaseFor(profile)
  if (excludeUnsupported.has(base)) return null
  try {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
    const url = `${base}/${coords}?exclude=${exclude}&overview=full&geometries=geojson`
    const response = await routedFetch(url, signal, 'alternatives', profile, [from, to])
    if (!response.ok) {
      // 400 is the router saying the parameter itself is not available here, which is
      // true of every leg from now on. Anything else is about this request alone.
      if (response.status === 400) excludeUnsupported.add(base)
      return null
    }
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
 *
 * `avoid` is the classes the trip weighs away. A leg Valhalla routes, because it routes
 * the days or because the trip avoids something, gets its offers from Valhalla too,
 * weighed the same way, and never from OSRM: a list holding both engines is what offered
 * a road the rail was not on as the quicker one, and clicking it changed nothing.
 */
export async function calculateAlternatives(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling' = 'driving',
  { signal, limit = 3, avoid = [], engine = routeEngineFor(profile, avoid) }: {
    signal?: AbortSignal
    limit?: number
    avoid?: readonly AvoidClass[]
    /** The engine that drew the leg, where it is known; the planned one otherwise. */
    engine?: RouteEngine
  } = {},
): Promise<RouteAlternative[]> {
  const routes = engine === 'valhalla'
    ? await alternativesFromValhalla(from, to, profile, avoidedClasses(profile, avoid), { limit, signal })
    : await alternativesFromOsrm(from, to, profile, limit, signal)
  if (!routes.length) return routes

  // The first route is what the router would have given anyway; the others are measured
  // against it so each one can be pinned by the point that makes it different.
  const [primary, ...rest] = routes
  for (const alt of rest) alt.divergence = furthestPointFrom(alt.coordinates, primary.coordinates)
  return routes
}

/**
 * The offers for a leg of a day Valhalla routes, every one of them Valhalla's.
 *
 * A day that weighs classes away has no other engine to ask: this throws when Valhalla has
 * nothing to say, so the picker reports a router that is not answering. Quietly offering
 * OSRM's roads instead is the very mix this path exists to end. A day that avoids nothing
 * went to OSRM whole when Valhalla did not answer it, so its offers do the same.
 */
async function alternativesFromValhalla(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  avoiding: AvoidClass[],
  { limit, signal }: { limit: number; signal?: AbortSignal },
): Promise<RouteAlternative[]> {
  const asking = avoiding.length > 0 || valhallaRoutesDays()
  const offered = asking ? await valhallaDayAlternatives(from, to, profile, avoiding, { limit, signal }) : null
  if (offered) return offered
  if (avoiding.length) throw new Error('No route found')
  return alternativesFromOsrm(from, to, profile, limit, signal)
}

/** The offers for a leg of a trip that avoids nothing: OSRM's, and one avoidance offer. */
async function alternativesFromOsrm(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  limit: number,
  signal?: AbortSignal,
): Promise<RouteAlternative[]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${routeBaseFor(profile)}/${coords}?alternatives=${limit}&overview=full&geometries=geojson`
  const response = await routedFetch(url, signal, 'alternatives', profile, [from, to])
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
  // the same drive without the motorway, then without the tolls, then without a ferry.
  // Tried one at a time and stopped as soon as one lands, so a leg that does have a
  // second road costs one extra request rather than three.
  //
  // This used to produce nothing at all on a default install: OSRM's `exclude` is HTTP
  // 400 on both public hosts, whose car profile is built without excludable classes. It
  // now asks Valhalla first, where avoidance is a runtime weighting, and only falls back
  // to OSRM's `exclude` for an instance running its own MLD-built router.
  if (routes.length < 2 && profile === 'driving') {
    for (const exclude of EXCLUDABLE_CLASSES) {
      if (signal?.aborted) break
      const detour = await routeExcluding(from, to, profile, exclude, signal)
      if (detour && !routes.some(r => sameRoad(r, detour))) {
        detour.avoids = exclude
        routes.push(detour)
        break
      }
    }
  }
  return routes
}

/** The point of `line` that lies furthest from `reference`, in plain degrees. */
function furthestPointFrom(line: [number, number][], reference: [number, number][]): { lat: number; lng: number } | null {
  const furthest = furthestFrom(line, reference)
  return furthest ? { lat: furthest.lat, lng: furthest.lng } : null
}
