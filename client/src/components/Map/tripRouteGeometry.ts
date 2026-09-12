import { calculateRouteWithLegs, type RouteProfileKey } from './RouteCalculator'
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
}

/** Neighbouring legs of one run that resolve to the same mode travel as one request,
 *  exactly as the single-day route builds them. */
interface Chunk { points: DayRoutePoint[]; mode: string }

/** A day reduced to the routing requests it needs, in the order they draw. */
export interface TripRoutePlanDay { day: Day; runs: Chunk[][] }

type Answer = { coordinates: [number, number][]; legs: RouteSegment[] } | null

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
    runs.forEach((chunks, r) => {
      const polyline: [number, number][] = []
      chunks.forEach((chunk, c) => {
        const answer = routed[d]?.[r]?.[c]
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
  }
}

/**
 * Ask the router for every leg of every day, a few at a time.
 *
 * A fortnight is dozens of legs and the routing host is usually a shared OSRM, so the
 * pool is deliberately small — the same one the sidebar connectors use. RouteCalculator's
 * cache is shared with the day route, so a day already drawn on screen costs nothing.
 *
 * A leg the router refuses keeps its straight line and contributes no distance, exactly
 * as a failed leg of a day route does. Nothing here throws.
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
          try {
            const answer = await calculateRouteWithLegs(
              chunk.points.map(p => ({ lat: p.lat, lng: p.lng })),
              { signal, profile: chunk.mode, tripId, dayId: day.id },
            )
            routed[d][r][c] = { coordinates: answer.coordinates, legs: answer.legs }
            onAnswer?.(routed)
          } catch {
            // Refused (usually a rate limit) — the straight line stands.
          }
        })
      })
    })
  })

  let next = 0
  const worker = async () => {
    while (next < tasks.length && !signal?.aborted) await tasks[next++]()
  }
  await Promise.all(Array.from({ length: Math.min(6, tasks.length) }, worker))
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
