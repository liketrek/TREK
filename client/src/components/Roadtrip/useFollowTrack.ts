import { useCallback, useMemo, useRef, useState } from 'react'
import { calculateRouteWithLegs } from '../Map/RouteCalculator'
import { lineLengthKm, parseTrack, planTrack, trackGapKm, type FollowTrackPlan } from './followTrack'
import type { LatLng } from './corridor'
import type { RoadtripRoutes } from './useRoadtripRoutes'
import type { RoadtripVias } from './useRoadtripVias'

/**
 * The dialog state behind "this day follows that track".
 *
 * Kept out of the dialog because applying one is a long job — a round trip to the routing
 * host per refinement — and a component that unmounts halfway would leave the day with
 * half a chain of vias on it. Here it can be aborted, and here it can say how far it has
 * got while it runs.
 */

/** A track of this trip, ready to be offered. */
export interface TrackChoice {
  id: number
  name: string
  /** The colour the map already draws it in, so the list and the line agree. */
  color: string | null
  points: LatLng[]
  lengthKm: number
  /** How far the track runs from the open day at its closest — what orders the list. */
  gapKm: number
}

/** What became of an applied track. */
export interface FollowTrackOutcome {
  vias: number
  strayKm: number
  capped: boolean
}

export interface FollowTrack {
  /** The day the dialog is open for, or null when it is closed. */
  dayId: number | null
  open: (dayId: number) => void
  close: () => void
  /** The trip's tracks, nearest to this day first. Empty until the dialog opens. */
  tracks: TrackChoice[]
  busy: boolean
  /** Which refinement round is running, for a dialog that has to say something. */
  round: number
  error: 'route' | 'save' | null
  outcome: FollowTrackOutcome | null
  apply: (trackId: number) => Promise<void>
  /** Drops every via of the open day, so it drives the way the router would. */
  clear: () => Promise<void>
  /** How many vias the open day carries — what makes clearing worth offering. */
  viaCount: number
  /**
   * Whether the trip holds a track at all.
   *
   * Read off the column rather than off `tracks`, which is empty until the dialog opens
   * and would therefore never let it be opened. It is what keeps the rail from offering
   * a control whose only possible answer is "no tracks in this trip".
   */
  available: boolean
}

/** A place is a track when it carries a line. */
export interface TrackPlace {
  id: number
  name?: string | null
  route_geometry?: string | null
  route_color?: string | null
}

/** Waiting a beat between rounds: the public routing hosts allow about one call a second. */
export const ROUND_PAUSE_MS = 400

/** How long to wait before the one retry a round gets. */
export const RETRY_PAUSE_MS = 1500

const sleep = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms) })

export function useFollowTrack(
  tripId: number | string | null,
  places: TrackPlace[],
  routes: RoadtripRoutes,
  vias: RoadtripVias,
): FollowTrack {
  const [dayId, setDayId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [round, setRound] = useState(0)
  const [error, setError] = useState<'route' | 'save' | null>(null)
  const [outcome, setOutcome] = useState<FollowTrackOutcome | null>(null)
  const abort = useRef<AbortController | null>(null)

  const day = useMemo(() => routes.days.find(d => d.dayId === dayId), [routes.days, dayId])
  const stops = useMemo<LatLng[]>(() => (day?.stops ?? []).map(s => ({ lat: s.lat, lng: s.lng })), [day])

  /**
   * Parsed only while the dialog is open.
   *
   * A track runs to tens of thousands of points and a trip can hold a dozen of them, so
   * parsing them to render a rail nobody opened would cost more than the rail does. The
   * memo hangs off `dayId` as well as `places` for exactly that reason.
   */
  const tracks = useMemo<TrackChoice[]>(() => {
    if (dayId === null) return []
    const found: TrackChoice[] = []
    for (const place of places) {
      const points = parseTrack(place.route_geometry)
      if (points.length < 2) continue
      found.push({
        id: place.id,
        name: place.name || '',
        color: place.route_color ?? null,
        points,
        lengthKm: lineLengthKm(points),
        gapKm: trackGapKm(points, stops),
      })
    }
    // Nearest first: a trip carrying every track of a three-week tour should still open
    // on the one that runs along today's drive.
    return found.sort((a, b) => a.gapKm - b.gapKm)
  }, [dayId, places, stops])

  const open = useCallback((next: number) => {
    setDayId(next)
    setOutcome(null)
    setError(null)
    setRound(0)
  }, [])

  const close = useCallback(() => {
    abort.current?.abort()
    abort.current = null
    setDayId(null)
    setBusy(false)
    setRound(0)
  }, [])

  const apply = useCallback(async (trackId: number) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track || dayId === null || stops.length < 2 || busy) return

    const controller = new AbortController()
    abort.current = controller
    setBusy(true)
    setError(null)
    setOutcome(null)
    setRound(0)

    let plan: FollowTrackPlan
    let spent = 0
    try {
      plan = await planTrack({
        track: track.points,
        stops,
        signal: controller.signal,
        onRound: n => { setRound(n) },
        route: async waypoints => {
          // Paced before the call rather than after it, so a plan that fits on its first
          // round costs nothing in waiting — and given one second chance, because a
          // refinement is several calls in a row against a host that allows about one a
          // second, and losing the whole loop to a single 429 would restart it at nothing.
          if (spent > 0) await sleep(ROUND_PAUSE_MS)
          spent += 1
          for (let attempt = 0; ; attempt++) {
            try {
              const r = await calculateRouteWithLegs(waypoints, {
                signal: controller.signal,
                profile: 'driving',
                tripId,
                dayId,
              })
              return r.coordinates.map(([lat, lng]) => ({ lat, lng }))
            } catch (err) {
              if (attempt >= 1 || controller.signal.aborted) throw err
              await sleep(RETRY_PAUSE_MS)
            }
          }
        },
      })
    } catch {
      if (!controller.signal.aborted) setError('route')
      setBusy(false)
      return
    }

    if (controller.signal.aborted) { setBusy(false); return }

    try {
      await vias.addMany(dayId, plan.vias, plan.legs)
      setOutcome({ vias: plan.vias.length, strayKm: plan.strayKm, capped: plan.capped })
    } catch {
      setError('save')
    } finally {
      setBusy(false)
    }
  }, [tracks, dayId, stops, busy, tripId, vias])

  const viaCount = dayId === null ? 0 : (vias.byDay[dayId]?.length ?? 0)
  // A cheap look at the column, not a parse: this runs on every planner render, and the
  // question is only whether anything at all was ever imported.
  const available = useMemo(() => places.some(p => (p.route_geometry?.length ?? 0) > 2), [places])

  const clear = useCallback(async () => {
    if (dayId === null || busy) return
    setBusy(true)
    setError(null)
    try {
      // Every leg of the day, so nothing is left behind on a leg the track never reached.
      const legs = Array.from({ length: Math.max(0, stops.length - 1) }, (_, i) => i)
      await vias.addMany(dayId, [], legs)
      setOutcome({ vias: 0, strayKm: 0, capped: false })
    } catch {
      setError('save')
    } finally {
      setBusy(false)
    }
  }, [dayId, busy, stops.length, vias])

  return { dayId, open, close, tracks, busy, round, error, outcome, apply, clear, viaCount, available }
}
