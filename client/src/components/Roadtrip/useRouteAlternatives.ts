import { useCallback, useMemo, useRef, useState } from 'react'
import { calculateAlternatives, sameRoad, type RouteAlternative, type RouteEngine } from '../Map/RouteCalculator'
import type { RailLegRoute, RailLegRouter } from './useRoadtripRoutes'

/** One offered way of driving a leg, with what it means for this trip. */
export interface OfferedRoute extends RouteAlternative {
  /** True for the road the rail drives on this leg now, whatever shaped it. */
  current?: boolean
  /** True for the router's own preference with no vias at all. */
  direct?: boolean
}

/**
 * Which drive on a card a picker is asked about: the leg from stop `index` to the next
 * one, or the drive `arriving` at the card's first stop from where the day before ended.
 *
 * A tagged union rather than a bare index, so the drive arriving at the head of a
 * connected card is a target of its own instead of borrowing an index no stop has.
 */
export type RailDrive = { kind: 'leg'; index: number } | { kind: 'arriving' }

/** The drive into a card from the day before. A card has one at most, so it needs no index. */
export const ARRIVING_DRIVE: RailDrive = { kind: 'arriving' }

/** Whether two drives are the same one of their card. */
export function sameDrive(a: RailDrive, b: RailDrive): boolean {
  if (a.kind === 'arriving' || b.kind === 'arriving') return a.kind === b.kind
  return a.index === b.index
}

/**
 * Whether the picker is open on this drive of this card. The one test the rail, the
 * planner and the phone ask, so a drive shows pressed exactly where the picker is.
 */
export function openOn(open: Pick<LegAlternatives, 'dayId' | 'drive'> | null | undefined, dayId: number, drive: RailDrive): boolean {
  return !!open && open.dayId === dayId && sameDrive(open.drive, drive)
}

/** Where the vias that shape a leg are stored: after stop `afterIndex` of day `dayId`. */
export interface ViaAnchor {
  dayId: number
  afterIndex: number
}

/** Which leg is being reconsidered, and what was offered for it. */
export interface LegAlternatives {
  /** The card the drive is drawn on. */
  dayId: number
  /** Which drive of that card: one of its legs, or the drive arriving at its head. */
  drive: RailDrive
  /** Where a choice is written. Read off the stop the leg leaves, when it was asked about. */
  anchor: ViaAnchor
  /**
   * The two stops the leg ran between when it was asked about, by assignment. A choice is
   * only written while the rail still has this leg at `anchor`, so a chain that re-flowed
   * in between cannot receive a road that was worked out for another one.
   */
  ends: { from: number; to: number }
  /** The engine the rail drives this leg with. Offers from another cannot be read against it. */
  engine: RouteEngine
  /**
   * True when the line the rail has for this leg came from OSRM standing in for `engine`,
   * which did not answer. Its own road is then not on the map, whatever the leg's vias say.
   */
  standIn: boolean
  /** Routes the leg through pins exactly as the rail does, to check a choice before saving it. */
  route: RailLegRouter['route']
  routes: OfferedRoute[]
  loading: boolean
  error: boolean
  /** The offer being checked against the rail's router and saved, or null while none is. */
  proving: number | null
  /** Why the last check saved nothing, for the bar to say beside the offers. Null otherwise. */
  notice: string | null
}

/** Everything a picker needs to know about the leg it is opened on. */
export interface AlternativesRequest {
  dayId: number
  drive: RailDrive
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  /** The leg as the rail drives it now: its line, its figures, and the engine behind them. */
  driven: Pick<RailLegRoute, 'coordinates' | 'distance' | 'duration'>
  anchor: ViaAnchor
  ends: { from: number; to: number }
  /** How the rail routes this leg: mode, avoided classes, engine, and the call itself. */
  router: RailLegRouter
}

export interface RouteAlternativesState {
  open: LegAlternatives | null
  /** Asks the rail's own router for the ways of driving this one leg. */
  ask: (request: AlternativesRequest) => void
  close: () => void
  /**
   * Marks offer `index` as being checked and saved. The signal aborts when the picker
   * closes, moves to another leg, or another check starts.
   */
  prove: (index: number) => AbortSignal
  /**
   * Ends a check that led to no save, leaving the picker open for another choice. `notice`
   * says why, for the bar to announce.
   */
  settle: (notice?: string) => void
}

/**
 * Other ways of driving one leg.
 *
 * One leg at a time, on demand, and never for the whole trip: the routers answer with
 * alternatives only between exactly two coordinates, so asking for a day would mean
 * breaking up the single request `splitIntoRuns` bundles it into, the optimisation that
 * makes a road trip appear at once rather than trickle in.
 *
 * The offers come from the engine that drives the leg on the rail, with the same mode and
 * the same avoided classes, and the road the rail is on heads the list as `current`,
 * always, taken from the rail itself rather than asked for again. Asked for again it came
 * from OSRM with nothing avoided while the rail drove Valhalla, so the list had no current
 * road at all, called a road the rail was not on the fastest, and choosing it did nothing.
 * An offer that is the current road is not listed a second time; if it was the router's
 * own preference, the current road says so.
 */
export function useRouteAlternatives(): RouteAlternativesState {
  const [open, setOpen] = useState<LegAlternatives | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const provingRef = useRef<AbortController | null>(null)

  const stopProving = useCallback(() => {
    provingRef.current?.abort()
    provingRef.current = null
  }, [])

  const close = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    stopProving()
    setOpen(null)
  }, [stopProving])

  const ask = useCallback((request: AlternativesRequest) => {
    abortRef.current?.abort()
    stopProving()
    const controller = new AbortController()
    abortRef.current = controller
    const { dayId, drive, from, to, driven, anchor, ends, router } = request
    const leg = { dayId, drive, anchor, ends, engine: router.engine, standIn: router.standIn, route: router.route, proving: null, notice: null }
    setOpen({ ...leg, routes: [], loading: true, error: false })

    // Marked with the engine that drew it. A line OSRM drew while the rail's engine did not
    // answer was marked as that engine's, so the list set it against the offers as if one
    // speed model had timed them all.
    const current: OfferedRoute = {
      coordinates: driven.coordinates,
      distance: driven.distance,
      duration: driven.duration,
      divergence: null,
      engine: router.standIn ? 'osrm' : router.engine,
      current: true,
    }
    // A plugin's mode means nothing to the routers asked here, so its leg is offered the
    // ways a car would take; the offers then carry OSRM's times, and the list says so.
    const profile: 'driving' | 'walking' | 'cycling' =
      router.mode === 'walking' ? 'walking' : router.mode === 'cycling' ? 'cycling' : 'driving'

    void calculateAlternatives(from, to, profile, { signal: controller.signal, avoid: router.avoid })
      .then(alternatives => {
        if (controller.signal.aborted) return
        const routes: OfferedRoute[] = [current]
        alternatives.forEach((offer, i) => {
          if (sameRoad(offer, current)) {
            // The rail is already on the router's own preference: one entry, and it says so.
            if (i === 0) current.direct = true
            return
          }
          routes.push({ ...offer, direct: i === 0 })
        })
        setOpen({ ...leg, routes, loading: false, error: false })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        // A router that will not answer is not worth a dialog; the leg keeps the route it
        // already has and the panel says so.
        setOpen({ ...leg, routes: [], loading: false, error: true })
      })
  }, [stopProving])

  const prove = useCallback((index: number) => {
    stopProving()
    const controller = new AbortController()
    provingRef.current = controller
    setOpen(o => (o ? { ...o, proving: index, notice: null } : o))
    return controller.signal
  }, [stopProving])

  const settle = useCallback((notice?: string) => {
    provingRef.current = null
    setOpen(o => (o ? { ...o, proving: null, notice: notice ?? null } : o))
  }, [])

  // One object for as long as nothing in it changes. The planner keys its close gate and
  // the callbacks that ask, choose and focus on this state as a whole, so a fresh object
  // per render re-ran that gate and rebuilt those callbacks on every render of the
  // planner, whatever had caused it. Whether the picker stays open is still the gate's own
  // condition to decide (a new `open` runs it either way); the memo only stops that work
  // from repeating on renders that changed nothing about the picker.
  return useMemo(() => ({ open, ask, close, prove, settle }), [open, ask, close, prove, settle])
}
