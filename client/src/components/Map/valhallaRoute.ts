import {
  resolveValhallaProvider,
  VALHALLA_COSTING,
  VALHALLA_RELAY_MAX_LOCATIONS,
  valhallaRoutesEveryDay,
  type ValhallaProvider,
  type ValhallaRelayAction,
} from '@trek/shared'
import { valhallaRelayRepo } from '../../repo/valhallaRelayRepo'
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
 * On the public instance it is deliberately NOT a replacement for the OSRM path. Three
 * measured reasons:
 *   - it caps at ten locations, and following a track sends a day's stops plus up to
 *     nine anchors, so the bundled requests would start failing;
 *   - it refuses a point it cannot bind to a road, where OSRM still snaps one. The
 *     Stephansdom, in a pedestrian zone, answers `No path could be found for input`
 *     until a search radius is allowed;
 *   - it prices roads differently, and not by a constant anybody could correct for.
 *     Over twelve European legs the per-leg drive time ran from 14.7 % under OSRM's to
 *     13.2 % over, and the sign follows the region rather than the road: on Spanish
 *     autovía Valhalla is the faster of the two on every leg measured, through a city
 *     it is half again slower. Those times feed the arrival clocks of a road trip day,
 *     so mixing engines inside one chain would move times nobody asked to move, and
 *     subtracting one engine's figure from the other's, which is what an offer beside
 *     a route invites, measures the gap between two speed models and nothing else.
 *
 * Which leaves exactly the shape this module serves there: two points, one avoidance,
 * asked on demand, drawn as an offer next to the route rather than replacing it.
 *
 * The TREK services' Valhalla and an own one take twenty locations and no pace of one a
 * second, so with either of them this engine routes every day (`valhallaDayRun`), and a
 * day it cannot answer goes to OSRM whole. The third reason holds on every host, which
 * is why one day is never routed by both.
 */

/** The public instance, matching how the OSRM defaults are shipped rather than configured. */
const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de'

/**
 * The TREK services' Valhalla, reached through this server's relay: same origin, so no
 * connect-src to add, and the installation key stays on the server.
 */
const TREK_VALHALLA = '/api/routing/valhalla'

/**
 * How long this tab leaves the relay alone after it could not answer: signed out on a
 * shared page, the allowance spent, the services down. FOSSGIS answers meanwhile.
 */
const RELAY_REST_MS = 10 * 60_000

/** The longest Retry-After of the relay this tab follows; a longer one is asked about again after it. */
const RELAY_MAX_WAIT_MS = 60 * 60_000

/**
 * How long a route or a height question may take through the relay or at an own Valhalla.
 * The server gives the TREK Valhalla ten seconds; this leaves room for its 502 to arrive
 * first. Where the relay itself hangs, FOSSGIS answers soon after; where an own Valhalla
 * does, OSRM routes the day, rather than the day waiting as long as the browser would.
 */
const ASK_TIMEOUT_MS = 12_000

/**
 * How far Valhalla may look for a road under a point, in metres.
 *
 * Zero is its default and it is the wrong default for TREK's data, which is full of
 * museums, viewpoints and restaurants that sit inside a pedestrian zone. Measured on
 * Vienna's Stephansdom: without a radius the whole route answers error 442, with 50 it
 * routes, and 200 changed nothing further. So 50 buys the fix and nothing beyond it.
 */
const SNAP_RADIUS_M = 50

/** What a caller tunes in the costing model: a weighting, a switch, or a bicycle type by name. */
export type CostingOptions = Record<string, number | string | boolean>

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
 * Locations one request to the public instance may carry. The eleventh answers
 * `{"error_code":150,"error":"Exceeded max locations: 10"}` with HTTP 400. The TREK
 * Valhalla and an own one take `VALHALLA_RELAY_MAX_LOCATIONS`.
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

/**
 * A stretch of a leg the router takes by boat, by the indices of the leg's
 * line where the boat leaves and lands, with the crossing's own length in
 * metres and its time in seconds (null where the router gave none).
 */
export interface FerrySpan {
  from: number
  to: number
  metres: number
  seconds: number | null
}

/**
 * What the router may bind a point to. `exclude_ferry` keeps a point off a
 * ferry's edge: a stop beside a pier, bound onto the boat line, would make the
 * route ride the boat to its next landing however the costing weighs ferries.
 */
export interface SearchFilter {
  exclude_ferry?: boolean
}

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
  /** CW-12: where the leg goes by boat, read off its maneuvers; absent where it does not. */
  ferrySpans?: FerrySpan[]
}

/**
 * CW-12: the router's own word that no way joins the points, apart from a
 * router that gave no answer at all: down, rate limited, or not asked.
 */
export interface ValhallaNoPath {
  noPath: true
}

/**
 * The refusals that are about the way rather than the host: points in
 * regions no edge connects (170), a point with no edge near it (171), and no
 * path found between them (442).
 */
const NO_PATH_CODES = new Set([170, 171, 442])
const NO_PATH: ValhallaNoPath = { noPath: true }

/** A host that let a question run out its deadline, apart from one that refused it. */
const TOO_SLOW = { tooSlow: true } as const
type TooSlow = typeof TOO_SLOW

function tooSlow(answer: unknown): answer is TooSlow {
  return answer === TOO_SLOW
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

/** Until when this tab asks FOSSGIS instead of a relay that could not answer. */
let relayRestingUntil = 0

/**
 * The instance's Valhalla, or null when it should not ask one.
 *
 * The admin's choice (`routing_valhalla_provider`) stands. Without one, an own Valhalla
 * is asked, and otherwise the TREK services through the relay, with FOSSGIS behind it —
 * with one condition. An operator who filled in their OWN router chose deliberately
 * against the public hosts, usually because their instance is not supposed to talk to
 * third parties at all, and quietly adding a second host they never asked for would
 * undo that choice. They lose nothing: a self-hosted OSRM built through the MLD
 * pipeline answers `exclude` on its own, which is exactly the fallback below.
 */
export function valhallaBase(): string | null {
  const { provider, own } = currentProvider()
  if (provider === 'custom') return own
  if (provider === 'trek') return TREK_VALHALLA
  return provider === 'fossgis' ? FOSSGIS_VALHALLA : null
}

/**
 * The provider as the settings choose it. Whether the TREK services can answer is the
 * relay's to say; until it said no, it is asked, and `ignoreRest` reads past its no.
 */
function currentProvider(ignoreRest = false): { provider: ValhallaProvider | null; own: string } {
  const settings = useSettingsStore.getState().settings
  const own = settings.valhalla_base_url?.trim().replace(/\/+$/, '') ?? ''
  const provider = resolveValhallaProvider({
    provider: settings.routing_valhalla_provider,
    valhallaUrl: own,
    routingUrl: settings.routing_base_url,
    trekAvailable: ignoreRest || Date.now() >= relayRestingUntil,
  })
  return { provider, own }
}

/**
 * Whether the days are asked here right now rather than of OSRM: with the TREK services
 * or an own Valhalla. While the relay rests after a failure this reads as FOSSGIS, so the
 * days go to OSRM until it is asked again.
 */
export function valhallaRoutesDays(): boolean {
  return valhallaRoutesEveryDay(currentProvider().provider)
}

/**
 * Whether the days are planned with this engine, resting relay or not. The route cache is
 * keyed by it: a day this device already holds from Valhalla stays found while the relay
 * rests, offline above all, where every question to it fails and it rests at once.
 */
export function valhallaPlansDays(): boolean {
  return valhallaRoutesEveryDay(currentProvider(true).provider)
}

/** True when this engine can be asked at all, so callers can skip building a request. */
export function valhallaAvailable(): boolean {
  return valhallaBase() !== null
}

/** Hosts that have already proved they are not a Valhalla, by base URL. */
const notValhalla = new Set<string>()

/** Whether a question may go to this base: a Valhalla, and the public one only where it may stand in. */
function mayAsk(base: string | null, publicFallback: boolean): base is string {
  return !!base && !notValhalla.has(base) && (publicFallback || base !== FOSSGIS_VALHALLA)
}

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
  costingOptions: Readonly<CostingOptions> = {},
): Promise<ValhallaRun | null> {
  const ask: RunAsk = { costingOptions, searchFilter: null, publicFallback: true }
  const run = await chainRun(waypoints, profile, avoid, signal, ask)
  if (!run || 'noPath' in run) return null
  return run
}

/**
 * A day of the planner or the road trip, routed here because this engine routes the
 * days (`valhallaRoutesDays`) or because the day avoids something only it can avoid.
 *
 * A day that avoids nothing is never handed to the public instance: OSRM routes it
 * there, as it always has, so where the TREK services cannot answer this is null and
 * OSRM takes the whole day. A day that avoids something goes to FOSSGIS behind the
 * relay as before, since OSRM cannot weigh a class away.
 */
export async function valhallaDayRun(
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  signal?: AbortSignal,
): Promise<ValhallaRun | null> {
  const run = await chainRun(waypoints, profile, avoid, signal, dayAsk(avoid))
  return run && !('noPath' in run) ? run : null
}

function dayAsk(avoid: readonly AvoidClass[]): RunAsk {
  return { costingOptions: {}, searchFilter: null, publicFallback: avoid.length > 0 }
}

/**
 * CW-12: a chain walked on foot, every point bound off the boat lines. Measured
 * on Venice: a stop by a vaporetto pier bound onto the boat line ended the
 * route on the ferry to its next landing, which `use_ferry` cannot weigh away
 * because the edge is where the route starts, not a choice along it. Tells a
 * walk no way joins (`noPath`) from a router that did not answer (null).
 */
export function valhallaRunOnFoot(
  waypoints: Waypoint[],
  signal: AbortSignal | undefined,
  costingOptions: Readonly<CostingOptions>,
  searchFilter: Readonly<SearchFilter>,
): Promise<ValhallaRun | ValhallaNoPath | null> {
  return chainRun(waypoints, 'walking', [], signal, { costingOptions, searchFilter, publicFallback: true })
}

/** How a chain is asked for besides its profile and avoidance. */
interface RunAsk {
  costingOptions: Readonly<CostingOptions>
  searchFilter: Readonly<SearchFilter> | null
  /** Whether FOSSGIS answers where the relay cannot; without it the question has no answer then. */
  publicFallback: boolean
}

/**
 * Locations one request carries: ten wherever it may end up at the public instance,
 * twenty at the TREK Valhalla asked alone and at an own one.
 */
function locationsPerRequest(base: string, publicFallback: boolean): number {
  const mayReachPublic = base === FOSSGIS_VALHALLA || (base === TREK_VALHALLA && publicFallback)
  return mayReachPublic ? MAX_LOCATIONS : VALHALLA_RELAY_MAX_LOCATIONS
}

async function chainRun(
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  signal: AbortSignal | undefined,
  ask: RunAsk,
): Promise<ValhallaRun | ValhallaNoPath | null> {
  const base = valhallaBase()
  if (!mayAsk(base, ask.publicFallback) || waypoints.length < 2) return null

  const legs: ValhallaLeg[] = []
  const chunks = chunkWaypoints(waypoints, locationsPerRequest(base, ask.publicFallback))
  for (const [index, chunk] of chunks.entries()) {
    if (signal?.aborted) return null
    if (index > 0) await pause(CHUNK_PAUSE_MS, signal)
    // Retried per piece rather than per day. The caller retries the whole task, so a
    // rate limit on the last piece of a split day would otherwise throw away the pieces
    // that already answered and ask for all of them again — three times over, against a
    // host that allows one request a second.
    const request = () => requestRun(base, chunk, profile, avoid, signal, ask)
    const run = await askWithRetry(base, request, signal, ask.publicFallback)
    // A day is one answer or none. Half a day of legs would be worse than no answer:
    // the schedule chains leg times blindly and cannot tell that it is missing some, so
    // it would print a complete, plausible, wrong timetable rather than a gap.
    if (!run) return null
    if ('noPath' in run) return run
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

/** Runs of at most `size` points, each starting on the one the previous ended at. */
function chunkWaypoints(waypoints: Waypoint[], size: number): Waypoint[][] {
  if (waypoints.length <= size) return [waypoints]
  const chunks: Waypoint[][] = []
  for (let start = 0; start < waypoints.length - 1; start += size - 1) {
    chunks.push(waypoints.slice(start, start + size))
  }
  return chunks
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
  })
}

/** When this tab last put a question to the public instance. */
let lastPublicAskAt = 0

/**
 * Waits for this tab's turn at the public instance, which allows about one request a
 * second per client. Every request to it goes through here, the route and the Tours
 * elevation alike, so a tour's route and the height question right behind it, or two
 * features asking at once, no longer reach it inside the same second and come back 429.
 * The pauses the callers keep themselves still stand; this only adds the wait they
 * cannot see, the one between unrelated callers.
 *
 * Another host is not paced: an operator's own Valhalla sets its own limits.
 */
export async function valhallaTurn(base: string, signal?: AbortSignal): Promise<void> {
  if (base !== FOSSGIS_VALHALLA) return
  for (let wait = lastPublicAskAt + CHUNK_PAUSE_MS - Date.now(); wait > 0; wait = lastPublicAskAt + CHUNK_PAUSE_MS - Date.now()) {
    await pause(wait, signal)
    if (signal?.aborted) return
  }
  // Taken in the same synchronous step as the check, so two callers woken together
  // cannot both see a free turn.
  lastPublicAskAt = Date.now()
}

/** Forget the last turn and a resting relay, for tests that start from a quiet host. */
export function resetValhallaTurns(): void {
  lastPublicAskAt = 0
  relayRestingUntil = 0
}

/**
 * Whether the relay's answer says it cannot answer for the TREK services right now: no
 * session (a shared page), no key, a body it does not take, a route this server does not
 * have yet, an allowance spent, a host that is down. A 400 that carries Valhalla's
 * `error_code` is its own refusal of the way and is read as such; one without is the
 * relay refusing the body.
 */
async function relayCannotAnswer(response: Response): Promise<boolean> {
  if (response.status === 400) {
    // A body that is not JSON cannot be Valhalla's own refusal, so it reads as the relay's.
    const data: unknown = await response.clone().json().catch(() => ({}))
    return typeof (data as { error_code?: unknown } | null)?.error_code !== 'number'
  }
  return [401, 403, 404, 405, 413, 429].includes(response.status) || response.status >= 500
}

/** The relay's Retry-After in milliseconds, as seconds or an HTTP date, or null without one. */
function relayWait(response: Response): number | null {
  const value = response.headers.get('Retry-After')?.trim()
  if (!value) return null
  if (/^\d+$/.test(value)) return Number(value) * 1000
  const at = Date.parse(value)
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now())
}

/** A route or a height question held to `ASK_TIMEOUT_MS`; a description brings its own deadline. */
function withDeadline(action: ValhallaRelayAction, signal?: AbortSignal): AbortSignal | undefined {
  if (action === 'trace_attributes') return signal
  const deadline = AbortSignal.timeout(ASK_TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, deadline]) : deadline
}

async function askRelay(action: ValhallaRelayAction, body: object, signal?: AbortSignal): Promise<Response | null> {
  let wait = RELAY_REST_MS
  try {
    const response = await valhallaRelayRepo.ask(action, body, withDeadline(action, signal))
    if (!(await relayCannotAnswer(response))) return response
    wait = Math.min(relayWait(response) ?? RELAY_REST_MS, RELAY_MAX_WAIT_MS)
  } catch (err) {
    if (signal?.aborted) throw err
  }
  relayRestingUntil = Date.now() + wait
  return null
}

/**
 * One question to a Valhalla, in its turn where the host is the public one. The relay
 * is asked first where it is the base; where it cannot answer, the same question goes
 * to FOSSGIS without a word, so a route never fails because of it. Without
 * `publicFallback` it does not: the answer is then a 503 of this tab's own, and the
 * caller asks OSRM.
 */
export async function valhallaPost(
  base: string,
  action: ValhallaRelayAction,
  body: object,
  signal?: AbortSignal,
  { publicFallback = true }: { publicFallback?: boolean } = {},
): Promise<Response> {
  if (base === TREK_VALHALLA && Date.now() >= relayRestingUntil) {
    const relayed = await askRelay(action, body, signal)
    if (relayed) return relayed
  }
  if (base === TREK_VALHALLA && !publicFallback) return new Response(null, { status: 503 })
  const host = base === TREK_VALHALLA ? FOSSGIS_VALHALLA : base
  await valhallaTurn(host, signal)
  return fetch(`${host}/${action}`, {
    method: 'POST',
    // A browser cannot set User-Agent, so this is the whole of what FOSSGIS asks a
    // client to identify itself with. It costs a preflight, which is answered.
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'trek' },
    body: JSON.stringify(body),
    // An own Valhalla routes every day, so one that hangs would hold each of them up.
    signal: host === FOSSGIS_VALHALLA ? signal : withDeadline(action, signal),
  })
}

/**
 * Waits out the host's one request a second before the next question is put.
 *
 * For a caller that asks this engine several things in a row on its own, such as the
 * offers for one leg: the same pause the pieces of a split day keep, so a picker cannot
 * fire at a pace the day routing was careful never to.
 */
export function valhallaSpacing(signal?: AbortSignal): Promise<void> {
  return pause(CHUNK_PAUSE_MS, signal)
}

/**
 * One question, and one more try after a pause when it earned no answer.
 *
 * Not when the host just proved it is not a Valhalla at all: that answer will not change
 * on a second ask, and asking anyway is the request the memo exists to save. Nor, where
 * nothing may stand in for this engine, when the relay now rests or the host used up its
 * whole deadline: the second ask would not leave this tab or would most likely wait as
 * long again, and OSRM is waiting for the day.
 */
async function askWithRetry<T>(
  base: string,
  ask: () => Promise<T | TooSlow | null>,
  signal: AbortSignal | undefined,
  publicFallback: boolean,
): Promise<T | null> {
  let answer = await ask()
  for (let attempt = 0; (!answer || tooSlow(answer)) && attempt < CHUNK_RETRIES && !signal?.aborted; attempt++) {
    if (notValhalla.has(base)) break
    if (!publicFallback && (tooSlow(answer) || (base === TREK_VALHALLA && Date.now() < relayRestingUntil))) break
    await pause(CHUNK_PAUSE_MS, signal)
    answer = await ask()
  }
  return tooSlow(answer) ? null : answer
}

/** The request body for a chain of waypoints, weighted away from `avoid`. */
function routeBody(
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  costingOptions: Readonly<CostingOptions> = {},
  searchFilter: Readonly<SearchFilter> | null = null,
): Record<string, unknown> {
  const costing = VALHALLA_COSTING[profile]
  // All of them in one request: the options are independent weightings, so asking to
  // leave out tolls and ferries together is one question rather than two routes to
  // reconcile. Measured Hamburg to Copenhagen: tolls, motorways and ferries weighted
  // away together answered 656.9 km against 339.2 km for the plain route.
  const options: CostingOptions = { ...costingOptions }
  for (const cls of avoid) options[AVOID_OPTION[cls]] = 0
  return {
    locations: waypoints.map(w => ({
      lat: w.lat,
      lon: w.lng,
      radius: SNAP_RADIUS_M,
      ...(searchFilter ? { search_filter: searchFilter } : {}),
    })),
    costing,
    costing_options: { [costing]: options },
    directions_options: { units: 'kilometers' },
  }
}

/**
 * The parsed answer to one POST, `NO_PATH` when the router found no way, `TOO_SLOW` when
 * it did not answer in time, or null for every other failure.
 */
async function postRoute(
  base: string,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
  publicFallback: boolean,
): Promise<unknown> {
  try {
    const response = await valhallaPost(base, 'route', body, signal, { publicFallback })
    if (!response.ok) {
      // 404 and 405 mean this URL is not a Valhalla — an OSRM pointed at by mistake,
      // or a proxy that swallowed the path. Every other status is about this request:
      // 400 carries the real refusals (unroutable point, over 1500 km apart) and 429
      // is the public instance's one-per-second.
      if (response.status === 404 || response.status === 405) notValhalla.add(base)
      if (response.status === 400 && (await refusesTheWay(response))) return NO_PATH
      return null
    }
    return await response.json()
  } catch (err) {
    return err instanceof DOMException && err.name === 'TimeoutError' ? TOO_SLOW : null
  }
}

async function refusesTheWay(response: Response): Promise<boolean> {
  try {
    const code = ((await response.json()) as { error_code?: unknown })?.error_code
    return typeof code === 'number' && NO_PATH_CODES.has(code)
  } catch {
    return false
  }
}

/** The most points a description of a line asks about; a longer line is thinned evenly, its ends kept. */
const TRACE_MAX_POINTS = 4000
/** How long a description may take before it counts as failed, so a router that hangs does not leave its card waiting. */
const TRACE_TIMEOUT_MS = 30_000

/**
 * How a line is matched to the ways under it: as a mountain bike rides, the
 * bicycle costing that refuses the fewest ways, so a road bike's route and a
 * gravel one are described alike; or on foot with every grade of path open,
 * since a hike's line (MAP-03) may run on a T6 ridge the matcher must not
 * refuse, and steps and mountain paths a run takes (RUN-02) stay on the line
 * (matched as a bike, a trail run over steps was described as the street
 * beside them). Matching is no routing: the limit a hike was planned with
 * plays no part. A hike and a run are matched alike; they differ in whether
 * the router's own hiking grade is asked for.
 */
const TRACE_COSTING = {
  bike: { costing: 'bicycle', costing_options: { bicycle: { bicycle_type: 'Mountain' } } },
  foot: { costing: 'pedestrian', costing_options: { pedestrian: { max_hiking_difficulty: 6 } } },
  run: { costing: 'pedestrian', costing_options: { pedestrian: { max_hiking_difficulty: 6 } } },
} as const

export type TraceMatching = keyof typeof TRACE_COSTING

const TRACE_ATTRIBUTES = ['shape', 'edge.surface', 'edge.use', 'edge.road_class', 'edge.cycle_lane', 'edge.length',
  'edge.way_id', 'edge.begin_shape_index', 'edge.end_shape_index']

/** The router's hiking grade is asked along a bike tour's and a run's line, never a hike's (MAP-03 reads OpenStreetMap). */
function traceAttributesFor(matching: TraceMatching): string[] {
  return matching === 'foot' ? TRACE_ATTRIBUTES : [...TRACE_ATTRIBUTES, 'edge.sac_scale']
}

/**
 * BIK-01, RUN-02 and MAP-03: how the router describes the ways under a line
 * (`trace_attributes`): the surface, the use and road class, the cycle lane,
 * the OpenStreetMap way of every edge and, but for a hike, the router's
 * hiking grade (`sac_scale`, 0 where the way has none), with the line as
 * matched. A run's grade shares (RUN-02) read the router's grade; the grade a
 * hike shows (MAP-03) comes from OpenStreetMap itself, since the router's
 * reading may be normalised or derived, so it is not asked for there. Null for
 * every failure: the description is an addition beside a route that already
 * exists.
 */
export async function valhallaTraceAttributes(
  line: readonly [number, number][],
  signal?: AbortSignal,
  matching: TraceMatching = 'bike'
): Promise<unknown> {
  const base = valhallaBase()
  if (!base || line.length < 2) return null
  const step = Math.max(1, Math.ceil(line.length / TRACE_MAX_POINTS))
  const shape = line.filter((_, index) => index % step === 0 || index === line.length - 1).map(([lat, lon]) => ({ lat, lon }))
  const bounded = signal ? AbortSignal.any([signal, AbortSignal.timeout(TRACE_TIMEOUT_MS)]) : AbortSignal.timeout(TRACE_TIMEOUT_MS)
  try {
    const response = await valhallaPost(base, 'trace_attributes', {
      shape,
      ...TRACE_COSTING[matching],
      shape_match: 'map_snap',
      filters: {
        attributes: traceAttributesFor(matching),
        action: 'include',
      },
    }, bounded)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/** One request, at most ten locations. */
async function requestRun(
  base: string,
  waypoints: Waypoint[],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  signal: AbortSignal | undefined,
  { costingOptions, searchFilter, publicFallback }: RunAsk,
): Promise<Omit<ValhallaRun, 'snapped'> | ValhallaNoPath | TooSlow | null> {
  const body = routeBody(waypoints, profile, avoid, costingOptions, searchFilter)
  const data = await postRoute(base, body, signal, publicFallback)
  if (data === NO_PATH || tooSlow(data)) return data
  return data === null ? null : runFrom(data)
}

/**
 * The ways of driving one leg this engine would offer, its preferred one first, or null.
 *
 * The offers for a trip that avoids something have to come from the engine that routes
 * that trip's days, or the list and the rail describe two different drives: OSRM's
 * quickest road beside a day Valhalla had routed was offered as the faster way, and
 * taking it changed nothing. Valhalla answers `alternates` between exactly two locations,
 * which is all one leg is, and weighs every one of them the way it weighed the day.
 * `costingOptions` carries the rest of how that day was weighed, such as a hike's limit
 * and preferences (RTE-02), so a section of a tour is offered ways under its own rules.
 */
export async function valhallaAlternates(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  count: number,
  signal?: AbortSignal,
  costingOptions: Readonly<CostingOptions> = {},
): Promise<ValhallaLeg[] | null> {
  const ask: RunAsk = { costingOptions, searchFilter: null, publicFallback: true }
  return alternates([from, to], profile, avoid, { count, signal, ask })
}

/**
 * The offers for one leg of a day `valhallaDayRun` routes, asked the way that day was:
 * a leg OSRM would otherwise drive is never asked of the public instance.
 */
export function valhallaDayAlternates(
  from: Waypoint,
  to: Waypoint,
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  { count, signal }: { count: number; signal?: AbortSignal },
): Promise<ValhallaLeg[] | null> {
  return alternates([from, to], profile, avoid, { count, signal, ask: dayAsk(avoid) })
}

async function alternates(
  [from, to]: [Waypoint, Waypoint],
  profile: 'driving' | 'walking' | 'cycling',
  avoid: readonly AvoidClass[],
  { count, signal, ask }: { count: number; signal: AbortSignal | undefined; ask: RunAsk },
): Promise<ValhallaLeg[] | null> {
  const { costingOptions, publicFallback } = ask
  const base = valhallaBase()
  if (!mayAsk(base, publicFallback)) return null
  const body = { ...routeBody([from, to], profile, avoid, costingOptions), ...(count > 0 ? { alternates: count } : {}) }
  return askWithRetry(base, async () => {
    const data = await postRoute(base, body, signal, publicFallback)
    if (tooSlow(data)) return data
    return data === null ? null : alternatesFrom(data)
  }, signal, publicFallback)
}

/**
 * Every way in an answer that asked for alternates: `trip` first, then each
 * `alternates[].trip`, read the way `runFrom` reads a single leg.
 *
 * Null when the preferred one cannot be read, because the others are offered against it.
 * An alternate that cannot be read is dropped on its own: one bad entry is no reason to
 * lose the leg's other ways.
 */
export function alternatesFrom(data: unknown): ValhallaLeg[] | null {
  const primary = runFrom(data)
  if (!primary) return null
  const extra = (data as { alternates?: unknown })?.alternates
  const others = Array.isArray(extra) ? extra.map(alt => runFrom(alt)?.total ?? null) : []
  return [primary.total, ...others.filter((leg): leg is ValhallaLeg => leg !== null)]
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
  const ferrySpans: FerrySpan[] = []
  for (const leg of legs) {
    const last = coordinates[coordinates.length - 1]
    const first = leg.coordinates[0]
    const continues = last && first && last[0] === first[0] && last[1] === first[1]
    // Where the leg's first point lands on the joined line, so its boat stretches keep pointing at their own points.
    const offset = continues ? coordinates.length - 1 : coordinates.length
    for (const span of leg.ferrySpans ?? []) ferrySpans.push({ ...span, from: span.from + offset, to: span.to + offset })
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
    ...(ferrySpans.length ? { ferrySpans } : {}),
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
    const ferrySpans = measure.hasFerry ? ferrySpansOf(leg.maneuvers, measure.coordinates.length) : []
    legs.push(ferrySpans.length ? { ...measure, ferrySpans } : measure)
  }
  return { legs, total: joinLegs(legs) }
}

interface ValhallaSummary { [key: string]: number | boolean | undefined }

interface ValhallaManeuver {
  type?: number
  ferry?: boolean
  begin_shape_index?: number
  end_shape_index?: number
  time?: number
  length?: number
}

function tripOf(data: unknown) {
  return (data as {
    trip?: {
      legs?: { shape?: string; summary?: ValhallaSummary; maneuvers?: ValhallaManeuver[] }[]
      summary?: ValhallaSummary
    }
  })?.trip
}

/** Valhalla's maneuver type for boarding a ferry; the maneuver also carries `ferry: true` for its crossing. */
const FERRY_ENTER = 28

/**
 * CW-12: the stretches of a leg the router takes by boat, read off its
 * maneuvers: a crossing is the maneuver that boards the ferry, from the point
 * it starts at to the one it ends at, with its own length and time. Measured
 * on Venice, the San Tomà to Ca' Rezzonico line came back as one maneuver of
 * type 28, ferry true, 1.236 km and 745 s over shape points 24 to 46, then the
 * walk off it. Crossings that touch are one. A leg the summary says has a
 * ferry but whose maneuvers do not say where is taken whole, without a time:
 * the crossing is somewhere on it, and none of it is counted as walked.
 */
function ferrySpansOf(maneuvers: ValhallaManeuver[] | undefined, points: number): FerrySpan[] {
  const spans: FerrySpan[] = []
  for (const maneuver of maneuvers ?? []) {
    if (maneuver.ferry !== true && maneuver.type !== FERRY_ENTER) continue
    const from = Number(maneuver.begin_shape_index)
    const to = Number(maneuver.end_shape_index)
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || to >= points) continue
    const metres = Number.isFinite(maneuver.length) ? Number(maneuver.length) * 1000 : 0
    const seconds = Number.isFinite(maneuver.time) ? Number(maneuver.time) : null
    const previous = spans[spans.length - 1]
    if (previous && previous.to === from) {
      previous.to = to
      previous.metres += metres
      previous.seconds = previous.seconds === null || seconds === null ? null : previous.seconds + seconds
    } else {
      spans.push({ from, to, metres, seconds })
    }
  }
  return spans.length || points < 2 ? spans : [{ from: 0, to: points - 1, metres: 0, seconds: null }]
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
