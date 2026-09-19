import { useEffect, useMemo, useRef, useState } from 'react'
import { type RouteProfileKey } from './RouteCalculator'
import {
  assembleTripRoute, emptyAnswers, planTripRoute, routeTripLegs, summariseTripRoute,
  type TripRouteSummary,
} from './tripRouteGeometry'
import { useSettingsStore } from '../../store/settingsStore'
import type { Accommodation, AssignmentsMap, Day, Reservation } from '../../types'

export type { TripOverviewDay, TripRouteSummary } from './tripRouteGeometry'

export interface TripRouteOverview extends TripRouteSummary {
  /** True until every leg has answered — the totals are a partial sum until then. */
  loading: boolean
}

const EMPTY: TripRouteOverview = { ...summariseTripRoute([]), loading: false }

/**
 * Every travel day's route at once, each day in its own colour, with the trip's total
 * distance (#1736).
 *
 * The geometry is the day view's own — `buildDayRouteRuns` is the same builder
 * `useRouteCalculation` draws the selected day from, so a day looks identical whether
 * you are looking at it alone or at the whole trip. This hook is the React wrapper:
 * the planning and routing themselves live in `tripRouteGeometry`, so the PDF export
 * can draw the same trip without a component to hang a hook on.
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

  const plan = useMemo(
    () => (enabled
      ? planTripRoute({ days, assignments, reservations, accommodations, optimizeFromAccommodation }, profile)
      : []),
    [enabled, days, assignments, reservations, accommodations, optimizeFromAccommodation, profile],
  )

  // Only geometry and mode decide whether legs have to be fetched again: renaming a
  // place or editing its notes must not fire a routing round.
  const planKey = useMemo(
    () => plan.map(({ day, runs }) => `${day.id}@${day.default_transport_mode ?? ''}:${runs
      .map(chunks => chunks.map(c => `${c.mode}>${c.points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')}`).join('+'))
      .join('/')}`).join(';'),
    [plan],
  )

  useEffect(() => {
    abortRef.current?.abort()
    if (!plan.length) { setResult(EMPTY); return }

    const controller = new AbortController()
    abortRef.current = controller

    // Straight lines first so the shape of the trip is on screen immediately, then the
    // real roads replace them — the same two-step the single-day route draws with.
    setResult({ ...summariseTripRoute(assembleTripRoute(plan, emptyAnswers(plan))), loading: true })

    routeTripLegs(plan, { tripId, signal: controller.signal }).then(routed => {
      if (controller.signal.aborted) return
      setResult({ ...summariseTripRoute(assembleTripRoute(plan, routed)), loading: false })
    })

    return () => controller.abort()
    // planKey is derived from the same inputs as plan, so keying on the string is
    // equivalent while staying stable across unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, tripId, distanceUnit])

  return result
}
