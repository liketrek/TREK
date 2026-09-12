import { useCallback, useRef, useState } from 'react'
import { calculateAlternatives, calculateRoute, type RouteAlternative } from '../Map/RouteCalculator'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { RoadtripVia } from '@trek/shared'

/** One offered way of driving a leg, with what it means for this trip. */
export interface OfferedRoute extends RouteAlternative {
  /** True for the road currently driven — the one the vias on this leg produce. */
  current?: boolean
  /** True for the router's own preference with no vias at all. */
  direct?: boolean
}

/** Which leg is being reconsidered, and what was offered for it. */
export interface LegAlternatives {
  dayId: number
  /** Index of the leg within the day: the drive from stop `index` to `index + 1`. */
  index: number
  routes: OfferedRoute[]
  loading: boolean
  error: boolean
}

export interface RouteAlternativesState {
  open: LegAlternatives | null
  /** Asks the router for the ways of driving this one leg. */
  ask: (dayId: number, index: number, from: RoadtripStop, to: RoadtripStop, profile: string, vias: RoadtripVia[]) => void
  close: () => void
}

/** Two lines are the same road if their ends and their length agree closely enough. */
function sameRoute(a: RouteAlternative, b: RouteAlternative): boolean {
  return Math.abs(a.distance - b.distance) < 50 && Math.abs(a.duration - b.duration) < 30
}

/**
 * Other ways of driving one leg.
 *
 * One leg at a time, on demand, and never for the whole trip: OSRM answers with
 * alternatives only between exactly two coordinates, so asking for a day would mean
 * breaking up the single request `splitIntoRuns` bundles it into — the optimisation that
 * makes a road trip appear at once rather than trickle in.
 *
 * When the leg already carries vias, the road actually being driven is NOT among what the
 * router offers for the two bare endpoints — it was asked a different question. So it is
 * fetched separately and put at the top, marked as the current one. Without that, opening
 * the picker on a leg you have already reshaped shows you three roads, none of which is
 * the one you are on, and no way back to it.
 */
export function useRouteAlternatives(): RouteAlternativesState {
  const [open, setOpen] = useState<LegAlternatives | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setOpen(null)
  }, [])

  const ask = useCallback((
    dayId: number,
    index: number,
    from: RoadtripStop,
    to: RoadtripStop,
    profile: string,
    vias: RoadtripVia[],
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setOpen({ dayId, index, routes: [], loading: true, error: false })

    const osrmProfile: 'driving' | 'walking' | 'cycling' =
      profile === 'walking' ? 'walking' : profile === 'cycling' ? 'cycling' : 'driving'
    const ends = [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }]

    // The router's offers for the bare leg, plus — only when the leg is already bent —
    // the road that bend produces, so both are on the table together.
    const offers = calculateAlternatives(ends[0], ends[1], osrmProfile, { signal: controller.signal })
    const current = vias.length
      ? calculateRoute(
        [ends[0], ...vias.map(v => ({ lat: v.lat, lng: v.lng })), ends[1]],
        osrmProfile,
        { signal: controller.signal },
      ).then(r => ({
        coordinates: r.coordinates,
        distance: r.distance,
        duration: r.duration,
        divergence: null,
        current: true,
      } as OfferedRoute)).catch(() => null)
      : Promise.resolve(null)

    void Promise.all([offers, current])
      .then(([alternatives, driven]) => {
        if (controller.signal.aborted) return
        const routes: OfferedRoute[] = alternatives.map((r, i) => ({ ...r, direct: i === 0 }))
        // Only prepend the driven road when it really is a different one; with a via that
        // barely moves the route, the two are the same road and one entry is honest.
        if (driven && !routes.some(r => sameRoute(r, driven))) routes.unshift(driven)
        setOpen({ dayId, index, routes, loading: false, error: false })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        // A router that will not answer is not worth a dialog; the leg keeps the route it
        // already has and the panel says so.
        setOpen({ dayId, index, routes: [], loading: false, error: true })
      })
  }, [])

  return { open, ask, close }
}
