import { calculateRouteWithLegs, RoutingRefusedError, type RouteProfileKey } from './RouteCalculator'
import { buildDayRouteRuns, type DayRouteInputs, type DayRoutePoint } from './dayRoutePlan'
import { resolveLegMode } from '../Planner/legMode'
import { dayColor } from '../Roadtrip/dayColors'
import type { Day, RouteSegment } from '../../types'

/** One travel day of the overview: the roads it covers, in its own colour. */
export interface TripOverviewDay {
  dayId: number
  dayNumber: number
  date: string | null
  title: string | null
  /** The core and casing this day is drawn in — the road trip's palette, so a day is
   *  the same colour whichever way the trip is being read. */
  color: { line: string; casing: string }
  /** One polyline per run of the day, `[lat, lng]`. */
  lines: [number, number][][]
  segments: RouteSegment[]
  /** Metres and seconds, summed over the day's legs. */
  distance: number
  duration: number
  /** The modes this day is actually travelled in, first use first. */
  modes: string[]
  /**
   * Legs drawn as a straight line because the router gave no road for them: not asked
   * yet while the round is running, refused or cut off by the deadline once it is over.
   * Those legs add nothing to `distance`, so a day with any of them reads too short.
   */
  unroutedLegs?: number
}

export interface TripRouteSummary {
  days: TripOverviewDay[]
  /** Every day's polylines flattened in trip order — what the map draws. */
  lines: [number, number][][]
  /** The colour of each entry of `lines`, same index. */
  lineColors: { line: string; casing: string }[]
  segments: RouteSegment[]
  /** Every drawn coordinate, so a map can frame the whole trip at once. */
  focusPoints: [number, number][]
  totalDistance: number
  totalDuration: number
  /** `unroutedLegs` over every day: above zero, `totalDistance` is a partial sum. */
  unroutedLegs?: number
}

/** Neighbouring legs of one run that resolve to the same mode travel as one request,
 *  exactly as the single-day route builds them. */
interface Chunk { points: DayRoutePoint[]; mode: string }

/** A day reduced to the routing requests it needs, in the order they draw. */
export interface TripRoutePlanDay { day: Day; runs: Chunk[][] }

type Answer = { coordinates: [number, number][]; legs: RouteSegment[] } | null
/** Every leg's answer so far, indexed like the plan: day, run, chunk. */
export type TripRouteAnswers = Answer[][][]

/** The palette entry a day keeps, whatever else is added to the trip around it. */
export const dayRouteColor = (day: Day): { line: string; casing: string } =>
  dayColor(day.day_number ?? 0)

function chunkRun(run: DayRoutePoint[], dayDefaultMode: string): Chunk[] {
  const chunks: Chunk[] = []
  let i = 0
  while (i < run.length - 1) {
    const mode = resolveLegMode(run[i], run[i + 1], dayDefaultMode)
    let end = i + 1
    while (end < run.length - 1 && resolveLegMode(run[end], run[end + 1], dayDefaultMode) === mode) end++
    chunks.push({ points: run.slice(i, end + 1), mode })
    i = end
  }
  return chunks
}

const straight = (points: DayRoutePoint[]): [number, number][] => points.map(p => [p.lat, p.lng])

/**
 * Every travel day of the trip reduced to the routing requests it needs.
 *
 * Pure and synchronous, so a caller can compare two plans (the map keys its routing
 * round on one) before spending a single request.
 */
export function planTripRoute(input: DayRouteInputs, profile: RouteProfileKey): TripRoutePlanDay[] {
  return [...input.days]
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    .map(day => ({ day, runs: buildDayRouteRuns(day.id, input) }))
    .filter(entry => entry.runs.length > 0)
    .map(({ day, runs }) => ({
      day,
      runs: runs.map(run => chunkRun(run, day.default_transport_mode || profile)),
    }))
}

/** What a plan looks like before any leg has answered: straight lines, no distances. */
export const emptyAnswers = (plan: TripRoutePlanDay[]): Answer[][][] =>
  plan.map(({ runs }) => runs.map(chunks => chunks.map(() => null)))

/** Stitch the routed answers back onto the plan, in the order the days are travelled. */
export function assembleTripRoute(plan: TripRoutePlanDay[], routed: Answer[][][]): TripOverviewDay[] {
  return plan.map(({ day, runs }, d) => {
    const lines: [number, number][][] = []
    const segments: RouteSegment[] = []
    let unroutedLegs = 0
    runs.forEach((chunks, r) => {
      const polyline: [number, number][] = []
      chunks.forEach((chunk, c) => {
        const answer = routed[d]?.[r]?.[c]
        if (!answer) unroutedLegs++
        const coords = answer && answer.coordinates.length >= 2 ? answer.coordinates : straight(chunk.points)
        for (const point of coords) {
          // Drop the point shared with the previous chunk so concatenated legs
          // don't leave a duplicate at each junction.
          const last = polyline[polyline.length - 1]
          if (last && last[0] === point[0] && last[1] === point[1]) continue
          polyline.push(point)
        }
        if (answer) for (const leg of answer.legs) segments.push({ ...leg, mode: chunk.mode })
      })
      if (polyline.length >= 2) lines.push(polyline)
    })
    const modes: string[] = []
    for (const chunk of runs.flat()) if (!modes.includes(chunk.mode)) modes.push(chunk.mode)
    return {
      dayId: day.id,
      dayNumber: day.day_number ?? 0,
      date: day.date ?? null,
      title: day.title ?? null,
      color: dayRouteColor(day),
      lines,
      segments,
      distance: segments.reduce((sum, s) => sum + s.distance, 0),
      duration: segments.reduce((sum, s) => sum + s.duration, 0),
      modes,
      unroutedLegs,
    }
  })
}

export function summariseTripRoute(days: TripOverviewDay[]): TripRouteSummary {
  const lines = days.flatMap(d => d.lines)
  return {
    days,
    lines,
    lineColors: days.flatMap(d => d.lines.map(() => d.color)),
    segments: days.flatMap(d => d.segments),
    focusPoints: lines.flat(),
    totalDistance: days.reduce((sum, d) => sum + d.distance, 0),
    totalDuration: days.reduce((sum, d) => sum + d.duration, 0),
    unroutedLegs: days.reduce((sum, d) => sum + (d.unroutedLegs ?? 0), 0),
  }
}

/**
 * Gap between two routing requests. The public OSRM hosts TREK ships with state one
 * request per second; the overview asks for every leg of every day, so without spacing
 * the first handful answer and the rest come back 429 (the road trip rail learnt this
 * first and paces itself the same way).
 */
const REQUEST_SPACING_MS = 1100
/** Anything answered faster than this came out of RouteCalculator's cache, not the network. */
const CACHE_HIT_MS = 60
/** How often a rate-limited leg is tried again, and how long after. */
const RETRY_DELAYS_MS = [1500, 4000]

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    if (signal?.aborted || ms <= 0) { resolve(); return }
    const timer = setTimeout(done, ms)
    function done(): void {
      clearTimeout(timer)
      signal?.removeEventListener('abort', done)
      resolve()
    }
    signal?.addEventListener('abort', done, { once: true })
  })

/**
 * Ask the router for every leg of every day, one at a time.
 *
 * A fortnight is dozens of legs and the routing host is usually a shared OSRM that
 * refuses a burst, so the legs go out one after another with a pause between them, and
 * a rate limit is waited out (for as long as the host asks, when it says) and asked
 * again. Only what actually went to the network is paced: RouteCalculator's cache is
 * shared with the day route, so a day already drawn on screen costs nothing and waits
 * for nothing.
 *
 * A leg the router still refuses keeps its straight line and contributes no distance,
 * exactly as a failed leg of a day route does; `assembleTripRoute` counts it so the
 * caller can say the total is short. A refusal the host meant (these coordinates, this
 * profile) is not repeated, because the same request earns the same answer. Nothing
 * here throws.
 */
export async function routeTripLegs(
  plan: TripRoutePlanDay[],
  { tripId, signal, onAnswer }: {
    tripId: number | null
    signal?: AbortSignal
    /** Called after each answer, for a caller that wants to draw as they arrive. */
    onAnswer?: (routed: Answer[][][]) => void
  },
): Promise<Answer[][][]> {
  const routed = emptyAnswers(plan)
  const tasks: (() => Promise<void>)[] = []
  plan.forEach(({ day, runs }, d) => {
    runs.forEach((chunks, r) => {
      chunks.forEach((chunk, c) => {
        tasks.push(async () => {
          const waypoints = chunk.points.map(p => ({ lat: p.lat, lng: p.lng }))
          for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            if (signal?.aborted) return
            try {
              const answer = await calculateRouteWithLegs(
                waypoints,
                { signal, profile: chunk.mode, tripId, dayId: day.id },
              )
              routed[d][r][c] = { coordinates: answer.coordinates, legs: answer.legs }
              onAnswer?.(routed)
              return
            } catch (err) {
              if (signal?.aborted) return
              const rateLimit = err instanceof RoutingRefusedError && err.isRateLimit ? err : null
              if (!rateLimit || attempt === RETRY_DELAYS_MS.length) return
              // When the host says how long to wait, waiting less is just a second refusal.
              await sleep(Math.max(RETRY_DELAYS_MS[attempt], rateLimit.retryAfterMs ?? 0), signal)
            }
          }
        })
      })
    })
  })

  for (let i = 0; i < tasks.length; i++) {
    if (signal?.aborted) break
    const startedAt = performance.now()
    await tasks[i]()
    const wasNetwork = performance.now() - startedAt > CACHE_HIT_MS
    if (wasNetwork && i < tasks.length - 1) await sleep(REQUEST_SPACING_MS, signal)
  }
  return routed
}

/**
 * The whole thing end to end, for a caller with no need to draw the intermediate state.
 *
 * `timeoutMs` stops waiting rather than stopping the work: legs that answered are kept
 * and the rest stay straight lines, which is what makes this usable from an export
 * somebody is standing in front of. A month-long trip with a cold cache is a few hundred
 * requests against a shared router, and no document is worth that wait.
 */
export async function routeTrip(
  input: DayRouteInputs,
  { profile, tripId, signal, timeoutMs }: {
    profile: RouteProfileKey
    tripId: number | null
    signal?: AbortSignal
    timeoutMs?: number
  },
): Promise<TripRouteSummary> {
  const plan = planTripRoute(input, profile)
  if (!plan.length) return summariseTripRoute([])
  const deadline = timeoutMs ? new AbortController() : null
  const timer = deadline ? setTimeout(() => deadline.abort(), timeoutMs) : null
  if (deadline && signal) signal.addEventListener('abort', () => deadline.abort(), { once: true })
  try {
    const routed = await routeTripLegs(plan, { tripId, signal: deadline?.signal ?? signal })
    return summariseTripRoute(assembleTripRoute(plan, routed))
  } finally {
    if (timer) clearTimeout(timer)
  }
}
