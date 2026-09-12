import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs, type RouteProfileKey } from './RouteCalculator'
import { buildDayRouteRuns, type DayRoutePoint } from './dayRoutePlan'
import { resolveLegMode } from '../Planner/legMode'
import { useSettingsStore } from '../../store/settingsStore'
import { dayColor } from '../Roadtrip/dayColors'
import type { Accommodation, AssignmentsMap, Day, Reservation, RouteSegment } from '../../types'

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

export interface TripRouteOverview {
  days: TripOverviewDay[]
  /** Every day's polylines flattened in trip order — what the map draws. */
  lines: [number, number][][]
  /** The colour of each entry of `lines`, same index. */
  lineColors: { line: string; casing: string }[]
  segments: RouteSegment[]
  /** Every drawn coordinate, so the map can frame the whole trip at once. */
  focusPoints: [number, number][]
  totalDistance: number
  totalDuration: number
  /** True until every leg has answered — the totals are a partial sum until then. */
  loading: boolean
}

const EMPTY: TripRouteOverview = {
  days: [], lines: [], lineColors: [], segments: [], focusPoints: [],
  totalDistance: 0, totalDuration: 0, loading: false,
}

/** Neighbouring legs of one run that resolve to the same mode travel as one request,
 *  exactly as the single-day route builds them. */
interface Chunk { points: DayRoutePoint[]; mode: string }

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
 * Every travel day's route at once, each day in its own colour, with the trip's total
 * distance (#1736).
 *
 * The geometry is the day view's own — `buildDayRouteRuns` is the same builder
 * `useRouteCalculation` draws the selected day from, so a day looks identical whether
 * you are looking at it alone or at the whole trip. Only the aggregation is new.
 *
 * Legs go out a few at a time rather than all at once: a fortnight is dozens of legs and
 * the routing host is usually a shared OSRM. RouteCalculator's cache is shared with the
 * day route and the sidebar connectors, so the day already on screen costs nothing.
 */
export function useTripRouteOverview(
  tripId: number | null,
  days: Day[],
  assignments: AssignmentsMap,
  reservations: Reservation[],
  accommodations: Accommodation[],
  profile: RouteProfileKey,
  enabled: boolean,
): TripRouteOverview {
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)
  // Leg text is formatted at compute time, so a km↔mi switch has to re-run (#1300).
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [result, setResult] = useState<TripRouteOverview>(EMPTY)
  const abortRef = useRef<AbortController | null>(null)

  const plan = useMemo(() => {
    if (!enabled) return []
    return [...days]
      .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
      .map(day => ({
        day,
        runs: buildDayRouteRuns(day.id, { days, assignments, reservations, accommodations, optimizeFromAccommodation }),
      }))
      .filter(entry => entry.runs.length > 0)
  }, [enabled, days, assignments, reservations, accommodations, optimizeFromAccommodation])

  // Only geometry and mode decide whether legs have to be fetched again: renaming a
  // place or editing its notes must not fire a routing round.
  const planKey = useMemo(
    () => plan.map(({ day, runs }) => `${day.id}@${day.default_transport_mode ?? ''}:${runs
      .map(run => run.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)},${p.leg_transport_mode ?? ''},${p.incoming_leg_transport_mode ?? ''}`).join('|'))
      .join('/')}`).join(';'),
    [plan],
  )

  useEffect(() => {
    abortRef.current?.abort()
    if (!plan.length) { setResult(EMPTY); return }

    const controller = new AbortController()
    abortRef.current = controller

    const colorFor = (day: Day) => dayColor(day.day_number ?? 0)

    // Chunk every day up front, so the routed answers can be filed by position and
    // reassembled in order however they come back.
    const chunked = plan.map(({ day, runs }) => {
      const dayDefaultMode = day.default_transport_mode || profile
      return { day, runs: runs.map(run => chunkRun(run, dayDefaultMode)) }
    })

    const assemble = (
      routed: (({ coordinates: [number, number][]; legs: RouteSegment[] }) | null)[][][],
    ): TripRouteOverview => {
      const overviewDays: TripOverviewDay[] = chunked.map(({ day, runs }, d) => {
        const lines: [number, number][][] = []
        const segments: RouteSegment[] = []
        runs.forEach((chunks, r) => {
          const polyline: [number, number][] = []
          chunks.forEach((chunk, c) => {
            const answer = routed[d][r][c]
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
          color: colorFor(day),
          lines,
          segments,
          distance: segments.reduce((sum, s) => sum + s.distance, 0),
          duration: segments.reduce((sum, s) => sum + s.duration, 0),
          modes,
        }
      })
      const lines = overviewDays.flatMap(d => d.lines)
      return {
        days: overviewDays,
        lines,
        lineColors: overviewDays.flatMap(d => d.lines.map(() => d.color)),
        segments: overviewDays.flatMap(d => d.segments),
        focusPoints: lines.flat(),
        totalDistance: overviewDays.reduce((sum, d) => sum + d.distance, 0),
        totalDuration: overviewDays.reduce((sum, d) => sum + d.duration, 0),
        loading: false,
      }
    }

    const routed = chunked.map(({ runs }) => runs.map(chunks => chunks.map(() => null as
      ({ coordinates: [number, number][]; legs: RouteSegment[] }) | null)))

    // Straight lines first so the shape of the trip is on screen immediately, then the
    // real roads replace them — the same two-step the single-day route draws with.
    setResult({ ...assemble(routed), loading: true })

    ;(async () => {
      const tasks: (() => Promise<void>)[] = []
      chunked.forEach(({ day, runs }, d) => {
        runs.forEach((chunks, r) => {
          chunks.forEach((chunk, c) => {
            tasks.push(async () => {
              try {
                const answer = await calculateRouteWithLegs(
                  chunk.points.map(p => ({ lat: p.lat, lng: p.lng })),
                  { signal: controller.signal, profile: chunk.mode, tripId, dayId: day.id },
                )
                routed[d][r][c] = { coordinates: answer.coordinates, legs: answer.legs }
              } catch {
                // Routing refused this leg (usually a rate limit) — it keeps its
                // straight line and contributes no distance, exactly as a day route's
                // failed leg does.
              }
            })
          })
        })
      })

      // Small pool on purpose, the same one the sidebar connectors use: a fortnight is
      // dozens of legs and the routing host is often a shared OSRM.
      let next = 0
      const worker = async () => {
        while (next < tasks.length && !controller.signal.aborted) await tasks[next++]()
      }
      await Promise.all(Array.from({ length: Math.min(6, tasks.length) }, worker))

      if (!controller.signal.aborted) setResult(assemble(routed))
    })()

    return () => controller.abort()
    // planKey is derived from the same inputs as plan, so keying on the string is
    // equivalent while staying stable across unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, profile, tripId, distanceUnit])

  return result
}
