import { useSettingsStore } from '../../store/settingsStore'
import { decodePolyline } from './transitGeometry'
import { haversineKm } from '../../utils/geo'
import type { Waypoint, SnappedWaypoint, RouteAvoidClass } from '../../types'

/**
 * Valhalla, the second routing engine, asked only the questions OSRM cannot answer.
 *
 * The shipped OSRM hosts are built without excludable road classes: their car profile
 * says so in its own Lua ("no memory for classes on demand server"), and `exclude=`
 * comes back as HTTP 400 on every leg. So the one thing a road tripper keeps asking
 * for — drive this without the tolls — has never worked on a default install.
 *
 * FOSSGIS runs a public Valhalla on the whole planet next to it, keyless, and there
 * avoidance is a runtime weighting rather than a profile that has to be rebuilt. This
 * module is the adapter: same question, different engine, answer shaped like the OSRM
 * one so the callers do not have to care which engine spoke.
 *
 * Deliberately NOT a replacement for the OSRM path. Three measured reasons:
 *   - it caps at ten locations, and following a track sends a day's stops plus up to
 *     nine anchors, so the bundled requests would start failing;
 *   - it refuses a point it cannot bind to a road, where OSRM still snaps one. The
 *     Stephansdom, in a pedestrian zone, answers `No path could be found for input`
 *     until a search radius is allowed;
 *   - it prices roads differently. Over ten European legs its drive times sat 5.4 %
 *     above OSRM's on average and 36 % above on one, and those times feed the arrival
 *     clocks of a road trip day. Mixing engines inside one chain would move times
 *     nobody asked to move.
 *
 * Which leaves exactly the shape this module serves: two points, one avoidance, asked
 * on demand, drawn as an offer next to the route rather than replacing it.
 */

/** The public instance, matching how the OSRM defaults are shipped rather than configured. */
const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de'

/**
 * How far Valhalla may look for a road under a point, in metres.
 *
 * Zero is its default and it is the wrong default for TREK's data, which is full of
 * museums, viewpoints and restaurants that sit inside a pedestrian zone. Measured on
 * Vienna's Stephansdom: without a radius the whole route answers error 442, with 50 it
 * routes, and 200 changed nothing further. So 50 buys the fix and nothing beyond it.
 */
const SNAP_RADIUS_M = 50

/** TREK's profile names against Valhalla's costing models. */
const COSTING: Record<'driving' | 'walking' | 'cycling', string> = {
  driving: 'auto',
  walking: 'pedestrian',
  cycling: 'bicycle',
}

/**
 * What a caller can ask to be left out, against the costing option that asks for it.
 *
 * Every one of these is a weighting from 0 to 1, not a ban — which is the whole reason
 * this engine is worth having. Asked to avoid tolls between New York and Boston it
 * still returns a tolled road, because there is no untolled way, where OSRM's `exclude`
 * would refuse to answer at all. The caller has to read the answer to find out what it
 * got, which is what `hasToll` and friends are for.
 */
const AVOID_OPTION: Record<AvoidClass, string> = {
  motorway: 'use_highways',
  toll: 'use_tolls',
  ferry: 'use_ferry',
}

/** The same three classes the rest of the app names; aliased so this file reads on its own. */
export type AvoidClass = RouteAvoidClass

/**
 * Locations one request may carry. The eleventh answers
 * `{"error_code":150,"error":"Exceeded max locations: 10"}` with HTTP 400.
 */
const MAX_LOCATIONS = 10

/**
 * Pause between the pieces of a split day, in milliseconds.
 *
 * The public instance allows about one request a second per client, and a day long
 * enough to be split is exactly the case that would fire two back to back. Matches the
 * 1100 ms the road trip rail already leaves between its own days.
 */
const CHUNK_PAUSE_MS = 1100

/**
 * Extra attempts for one piece of a split day.
 *
 * One, not a ladder: the common failure here is the public instance's rate limit, which
 * a single pause clears, and anything a second attempt cannot fix is not going to be
 * fixed by a fourth while somebody waits for their map.
 */
const CHUNK_RETRIES = 1

/** One way of driving a leg, in the units OSRM answers in so callers need no branch. */
export interface ValhallaLeg {
  coordinates: [number, number][]
  /** Metres. Valhalla is asked in kilometres and converted here. */
  distance: number
  /** Seconds. */
  duration: number
  /** What the route ACTUALLY has, as opposed to what was asked for. */
  hasToll: boolean
  hasHighway: boolean
  hasFerry: boolean
}

/** A routed chain: one leg per pair of consecutive waypoints, plus the whole of it. */
export interface ValhallaRun {
  legs: ValhallaLeg[]
  total: ValhallaLeg
  /**
   * Where each waypoint actually met the road.
   *
   * Reconstructed from the shape rather than read from a field, because Valhalla echoes
   * the coordinates it was GIVEN in `trip.locations` and never says where it bound them.
   * The ends of a leg's line are those points: measured against Füssen, its first vertex
   * came back at 47.571617 / 10.70153, which is OSRM's snapped location for the same
   * request to the digit. Without this the dashed kerb-to-door spur from #2273 would
   * quietly disappear from every day routed by this engine.
   */
  snapped: SnappedWaypoint[]
}

/**
 * The instance's Valhalla, or null when it should not ask one.
 *
 * Blank falls back to the public instance, the same reading `routing_base_url` gets —
 * with one condition. An operator who filled in their OWN router chose deliberately
 * against the public hosts, usually because their instance is not supposed to talk to
 * third parties at all, and quietly adding a second public host they never asked for
 * would undo that choice. They lose nothing: a self-hosted OSRM built through the MLD
 * pipeline answers `exclude` on its own, which is exactly the fallback below.
 */
export function valhallaBase(): string | null {
  const settings = useSettingsStore.getState().settings
  const configured = settings.valhalla_base_url?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  return settings.routing_base_url?.trim() ? null : FOSSGIS_VALHALLA
}

/** True when this engine can be asked at all, so callers can skip building a request. */
export function valhallaAvailable(): boolean {
  return valhallaBase() !== null
}

/** Hosts that have already proved they are not a Valhalla, by base URL. */
const notValhalla = new Set<string>()

/**
 * One leg with a road class weighted away, or null when it cannot be had.
 *
 * Null for every failure, deliberately: this is an offer next to a route that already
 * exists, so a host that is down, a rate limit, a point in a field and a genuinely
 * connected-only-by-motorway leg all mean the same thing to the caller — there is no
 * second way to show. The one failure worth remembering is a host that is not a
 * Valhalla at all, because that is true of every leg from now on rather than this one.
 */
export async function valhallaRouteAvoiding(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  avoid: AvoidClass,
  signal?: AbortSignal,
): Promise<ValhallaLeg | null> {
  const run = await valhallaRun([from, to], profile, [avoid], signal)
  return run ? run.total : null
}

/**
 * A whole chain of waypoints, one leg per pair, or null when it cannot be had.
 *
 * Split when it has to be. Ten locations is a hard cap, and a road trip day is bundled
 * into one request precisely so it appears at once rather than trickling in — so a day
 * over the cap is cut into runs that overlap by one point and the legs are concatenated.
 * That is exact, not an approximation: measured over a six-stop day, [0..3] plus [3..5]
 * came back within two metres and under a second of the same day asked whole, because
 * the shared point is routed to and from identically.
 *
 * The pieces go out one after another with a pause, since a day long enough to need
 * splitting is exactly the one that would otherwise fire two requests inside a second
 * at a host that allows one.
 */
export async function valhallaRun(
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  signal?: AbortSignal,
): Promise<ValhallaRun | null> {
  const base = valhallaBase()
  if (!base || notValhalla.has(base) || waypoints.length < 2) return null

  const legs: ValhallaLeg[] = []
  const chunks = chunkWaypoints(waypoints)
  for (const [index, chunk] of chunks.entries()) {
    if (signal?.aborted) return null
    if (index > 0) await pause(CHUNK_PAUSE_MS, signal)
    // Retried per piece rather than per day. The caller retries the whole task, so a
    // rate limit on the last piece of a split day would otherwise throw away the pieces
    // that already answered and ask for all of them again — three times over, against a
    // host that allows one request a second.
    let run = await requestRun(base, chunk, profile, avoid, signal)
    for (let attempt = 0; !run && attempt < CHUNK_RETRIES && !signal?.aborted; attempt++) {
      // Not when the host just proved it is not a Valhalla at all: that answer will not
      // change on a second ask, and asking anyway is the request the memo exists to save.
      if (notValhalla.has(base)) break
      await pause(CHUNK_PAUSE_MS, signal)
      run = await requestRun(base, chunk, profile, avoid, signal)
    }
    // A day is one answer or none. Half a day of legs would be worse than no answer:
    // the schedule chains leg times blindly and cannot tell that it is missing some, so
    // it would print a complete, plausible, wrong timetable rather than a gap.
    if (!run) return null
    legs.push(...run.legs)
  }
  if (legs.length !== waypoints.length - 1) return null
  return { legs, total: joinLegs(legs), snapped: snappedFrom(legs, waypoints) }
}

/**
 * Where each waypoint met the road, taken off the ends of the legs that touch it.
 *
 * A leg's line starts at the bound position of its first stop and ends at the bound
 * position of its second, so stop i is the head of leg i, and the last stop is the tail
 * of the last leg. The distance is measured here rather than reported, the same recovery
 * `readSnapped` already applies when OSRM leaves the field out.
 */
function snappedFrom(legs: ValhallaLeg[], waypoints: Waypoint[]): SnappedWaypoint[] {
  return waypoints.map((waypoint, i) => {
    const line = i < legs.length ? legs[i].coordinates : legs[legs.length - 1].coordinates
    const at = i < legs.length ? line[0] : line[line.length - 1]
    const asked: [number, number] = [waypoint.lat, waypoint.lng]
    return {
      asked,
      at,
      meters: haversineKm(waypoint, { lat: at[0], lng: at[1] }) * 1000,
    }
  })
}

/** Runs of at most ten points, each starting on the one the previous ended at. */
function chunkWaypoints(waypoints: Waypoint[]): Waypoint[][] {
  if (waypoints.length <= MAX_LOCATIONS) return [waypoints]
  const chunks: Waypoint[][] = []
  for (let start = 0; start < waypoints.length - 1; start += MAX_LOCATIONS - 1) {
    chunks.push(waypoints.slice(start, start + MAX_LOCATIONS))
  }
  return chunks
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
  })
}

/** One request, at most ten locations. */
async function requestRun(
  base: string,
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  signal?: AbortSignal,
): Promise<Omit<ValhallaRun, 'snapped'> | null> {
  const costing = COSTING[profile]
  // All of them in one request: the options are independent weightings, so asking to
  // leave out tolls and ferries together is one question rather than two routes to
  // reconcile. Measured Hamburg to Copenhagen: tolls, motorways and ferries weighted
  // away together answered 656.9 km against 339.2 km for the plain route.
  const options: Record<string, number> = {}
  for (const cls of avoid) options[AVOID_OPTION[cls]] = 0
  const body = {
    locations: waypoints.map(w => ({ lat: w.lat, lon: w.lng, radius: SNAP_RADIUS_M })),
    costing,
    costing_options: { [costing]: options },
    directions_options: { units: 'kilometers' },
  }

  try {
    const response = await fetch(`${base}/route`, {
      method: 'POST',
      // A browser cannot set User-Agent, so this is the whole of what FOSSGIS asks a
      // client to identify itself with. It costs a preflight, which is answered.
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'trek' },
      body: JSON.stringify(body),
      signal,
    })
    if (!response.ok) {
      // 404 and 405 mean this URL is not a Valhalla — an OSRM pointed at by mistake,
      // or a proxy that swallowed the path. Every other status is about this request:
      // 400 carries the real refusals (unroutable point, over 1500 km apart) and 429
      // is the public instance's one-per-second.
      if (response.status === 404 || response.status === 405) notValhalla.add(base)
      return null
    }
    return runFrom(await response.json())
  } catch {
    return null
  }
}

/**
 * Several legs read as one, the way a caller that only wants the whole drive sees it.
 *
 * The seam matters more than it looks. Every leg ends where the next begins, so a plain
 * concatenation repeats that vertex — and this line is not only drawn: a via dropped on
 * the route is projected onto it to work out which leg it belongs after, and that index
 * is written to the database. A repeated point can put the via on the wrong leg, which
 * is a stored wrong answer rather than an invisible one.
 */
function joinLegs(legs: ValhallaLeg[]): ValhallaLeg {
  const coordinates: [number, number][] = []
  for (const leg of legs) {
    const last = coordinates[coordinates.length - 1]
    const first = leg.coordinates[0]
    const continues = last && first && last[0] === first[0] && last[1] === first[1]
    coordinates.push(...(continues ? leg.coordinates.slice(1) : leg.coordinates))
  }
  return {
    coordinates,
    distance: legs.reduce((sum, l) => sum + l.distance, 0),
    duration: legs.reduce((sum, l) => sum + l.duration, 0),
    // One tolled leg makes the drive a tolled drive: `some`, never `every`, or a day
    // with a single toll booth in it would be labelled toll-free.
    hasToll: legs.some(l => l.hasToll),
    hasHighway: legs.some(l => l.hasHighway),
    hasFerry: legs.some(l => l.hasFerry),
  }
}

/**
 * The Valhalla answer as a leg, or null when it is not one.
 *
 * Split out because it is the whole of the format knowledge and the only part worth
 * testing without a network: the native shape, not `format=osrm`. That flag exists and
 * would have kept the response side unchanged, but it drops `has_toll` — the one field
 * this is all for — and carries every intersection instead, which measured 5.7 times
 * larger on Paris to Lyon. Translating a smaller answer beats parsing a familiar one.
 */
/**
 * The answer read leg by leg, which is what a whole day needs.
 *
 * Valhalla gives every leg its own summary, so a chain comes back already divided the
 * way a road trip day wants it: this stop to the next, with its own distance, its own
 * drive time, and its own honest `has_toll`. Reading only the trip summary would flatten
 * a day into one number and lose the per-leg times the schedule is built from.
 *
 * The fallback to the trip summary is for a single leg only. Where several legs carry no
 * summary of their own there is no honest way to divide one total between them, and a
 * guess here would arrive as a wrong arrival time rather than as a missing one.
 */
export function runFrom(data: unknown): Omit<ValhallaRun, 'snapped'> | null {
  const trip = tripOf(data)
  if (!trip || !Array.isArray(trip.legs) || !trip.legs.length) return null

  const legs: ValhallaLeg[] = []
  for (const leg of trip.legs) {
    if (typeof leg.shape !== 'string') return null
    const summary = leg.summary ?? (trip.legs.length === 1 ? trip.summary : undefined)
    if (!summary) return null
    // Precision 6, verified against a known point: decoded as 5 the first vertex of a
    // Paris route reads 488.56, which is not a latitude; as 6 it reads 48.856193.
    const measure = measured(summary, decodePolyline(leg.shape, 6))
    if (!measure) return null
    legs.push(measure)
  }
  return { legs, total: joinLegs(legs) }
}

interface ValhallaSummary { [key: string]: number | boolean | undefined }

function tripOf(data: unknown) {
  return (data as {
    trip?: { legs?: { shape?: string; summary?: ValhallaSummary }[]; summary?: ValhallaSummary }
  })?.trip
}

/** A summary and a shape as a leg, or null when the summary carries no numbers. */
function measured(summary: ValhallaSummary, coordinates: [number, number][]): ValhallaLeg | null {
  if (!coordinates.length) return null
  const length = Number(summary.length)
  const time = Number(summary.time)
  if (!Number.isFinite(length) || !Number.isFinite(time)) return null

  return {
    coordinates,
    // Asked in kilometres, answered in kilometres, handed on in metres because that is
    // what every caller already reads off an OSRM route.
    distance: length * 1000,
    duration: time,
    hasToll: summary.has_toll === true,
    hasHighway: summary.has_highway === true,
    hasFerry: summary.has_ferry === true,
  }
}

/**
 * Whether a route actually avoids what it was asked to avoid.
 *
 * The reason this function exists rather than a boolean on the request: `use_tolls: 0`
 * is a weighting, so between two points with no untolled connection Valhalla answers a
 * tolled route and reports it honestly. Labelling that "No tolls" would be a lie on
 * screen, and the flags are in the answer precisely so nobody has to guess.
 */
export function legAvoids(leg: ValhallaLeg, avoid: AvoidClass): boolean {
  if (avoid === 'toll') return !leg.hasToll
  if (avoid === 'motorway') return !leg.hasHighway
  return !leg.hasFerry
}
