import { useEffect, useMemo, useRef, useState } from 'react'
import { type RouteProfileKey } from './RouteCalculator'
import {
  assembleTripRoute, emptyAnswers, planTripRoute, routeTripLegs, summariseTripRoute,
  type TripRouteAnswers, type TripRouteSummary,
} from './tripRouteGeometry'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import type { Accommodation, AssignmentsMap, Day, Place, Reservation } from '../../types'

export type { TripOverviewDay, TripRouteSummary } from './tripRouteGeometry'

export interface TripRouteOverview extends TripRouteSummary {
  /** True until every leg has answered — the totals are a partial sum until then. */
  loading: boolean
}

const EMPTY: TripRouteOverview = { ...summariseTripRoute([]), loading: false }
const EMPTY_PLACES: Place[] = []

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
  places: Place[] = EMPTY_PLACES,
): TripRouteOverview {
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)
  const toursEnabled = useAddonStore(s => s.isEnabled('tours'))
  // Leg text is formatted at compute time, so a km↔mi switch has to re-run (#1300).
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [result, setResult] = useState<TripRouteOverview>(EMPTY)
  const abortRef = useRef<AbortController | null>(null)
  // The map refits its camera whenever a NEW focusPoints array arrives, so the
  // array's identity is a camera command. A content edit — a place dropped onto
  // a day — re-plans the route, and if that published a fresh frame the map
  // would yank itself out from under the edit every time. A new frame is only
  // published when the overview is (re)activated or another trip loads; edits
  // while it is on reuse the reference and the camera stays where the user put it.
  const frameRef = useRef<{ tripId: number | null; points: [number, number][] } | null>(null)
  const wasEnabled = useRef(false)

  const plan = useMemo(
    () => (enabled
      ? planTripRoute({ days, assignments, reservations, accommodations, optimizeFromAccommodation, toursEnabled, places }, profile)
      : []),
    [enabled, days, assignments, reservations, accommodations, optimizeFromAccommodation, profile, toursEnabled, places],
  )

  // Only geometry and mode decide whether legs have to be fetched again: renaming a
  // place or editing its notes must not fire a routing round.
  const planKey = useMemo(
    () => plan.map(({ day, runs, tourLines }) => `${day.id}@${day.default_transport_mode ?? ''}:${runs
      .map(chunks => chunks.map(c => `${c.mode}>${c.points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')}`).join('+'))
      .join('/')}:tours=${JSON.stringify(tourLines ?? [])}`).join(';'),
    [plan],
  )

  useEffect(() => {
    abortRef.current?.abort()
    if (!plan.length) {
      setResult(EMPTY)
      // Off (or nothing to draw): the next activation publishes a fresh frame.
      wasEnabled.current = false
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    // Straight lines first so the shape of the trip is on screen immediately, then the
    // real roads replace them — the same two-step the single-day route draws with.
    const first = summariseTripRoute(assembleTripRoute(plan, emptyAnswers(plan)))
    // Reframe only on activation or a trip switch, never on a content edit (see
    // frameRef above).
    const reframe = frameRef.current === null || frameRef.current.tripId !== tripId || !wasEnabled.current
    if (reframe) frameRef.current = { tripId, points: first.focusPoints }
    wasEnabled.current = true
    const frame = frameRef.current!.points
    setResult({ ...first, focusPoints: frame, loading: true })

    // Published leg by leg: the legs go to the router one at a time with a pause between
    // them, so a cold trip takes a second per leg, and roads that fill in as they answer
    // read as progress where straight lines that all flip at once read as a hang.
    //
    // The frame is the exception. A fresh `focusPoints` array is what tells the map to
    // fit the camera, and a fit every second would take the map back from wherever the
    // reader has panned to. The frame set on the straight lines therefore holds while
    // the round answers; a reframe round ends on the routed roads (the two fits the
    // overview has always made on activation), an edit round ends on the frame it
    // started with and the camera never moves.
    const publish = (routed: TripRouteAnswers, loading: boolean): void => {
      if (controller.signal.aborted) return
      const next = summariseTripRoute(assembleTripRoute(plan, routed))
      if (!loading && reframe) frameRef.current = { tripId, points: next.focusPoints }
      setResult({ ...next, focusPoints: loading ? frame : frameRef.current!.points, loading })
    }
    void routeTripLegs(plan, { tripId, signal: controller.signal, onAnswer: routed => publish(routed, true) })
      .then(routed => publish(routed, false))

    return () => controller.abort()
    // planKey is derived from the same inputs as plan, so keying on the string is
    // equivalent while staying stable across unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, tripId, distanceUnit])

  return result
}
