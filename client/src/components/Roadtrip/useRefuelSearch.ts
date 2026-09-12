import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useCallback, useMemo, useRef, useState } from 'react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { refuelStopTypeFor, type VehicleKind } from './roadtripModel'
import { boxAround, pointAtMeters, type LatLng } from './corridor'
import { reachableRefuels, outcomeOf, type RefuelCandidate, type RefuelOutcome } from './refuelSuggestion'

/**
 * How far around the search point to look, in kilometres.
 *
 * Fourteen and not more, because the server turns a box into a circle of half its
 * diagonal and silently narrows anything past 20 km. A box of ±14 asks for 19.8, which
 * is the largest question it answers in full — ±25 asked for 35 and came back flagged
 * as narrowed every single time, which then read on screen as "we could not check".
 */
const LOOK_KM = 14

/**
 * How far BEFORE the dry point to centre that circle, in kilometres.
 *
 * Only the road already driven is any use: a station past the point is on the far side
 * of an empty tank. Centring on the dry point spends half the circle on road nobody can
 * reach, so it is pulled back far enough that the useful half becomes the whole of it.
 */
const LOOK_BACK_KM = 12
const SEARCH_STEP_KM = 20
const MAX_SEARCHES = 8

/** Nothing on offer, as one stable array, so an idle search never redraws the map. */
const NONE: RefuelCandidate[] = []

export interface RefuelSearch {
  /** Which dry point is being answered, as `<dayId>:<legIndex>`, or null when idle. */
  openFor: string | null
  loading: boolean
  outcome: RefuelOutcome | null
  results: RefuelCandidate[]
  /**
   * The ones on offer, for the map to draw.
   *
   * The same three the rail lists and no more: somebody is being asked to accept a stop,
   * and a stop that cannot be seen is not one that can be judged. Empty while nothing is
   * open, and the same array each time, because the map rebuilds every pin when this
   * reference changes.
   */
  offered: RefuelCandidate[]
  /** Searches backwards until an available stop is found. `key` identifies the dry point, so only one is open at a time. */
  ask: (key: string, at: LatLng, line: LatLng[], dryAlongKm: number, existing: LatLng[], fromAlongKm?: number) => Promise<void>
  close: () => void
}

export function useRefuelSearch(): RefuelSearch {
  const { locale } = useTranslation()
  // What to look for. Somebody who said they drive an electric car has no use for a
  // petrol station in the list, and the other way round; with nothing said, both.
  const vehicle = useRoadtripSettings(s => s.roadtrip_vehicle)
  const [openFor, setOpenFor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [outcome, setOutcome] = useState<RefuelOutcome | null>(null)
  const [results, setResults] = useState<RefuelCandidate[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const close = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setOpenFor(null)
    setResults([])
    setOutcome(null)
    setLoading(false)
  }, [])

  const ask = useCallback(async (
    key: string,
    at: LatLng,
    line: LatLng[],
    dryAlongKm: number,
    existing: LatLng[],
    fromAlongKm = 0,
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setOpenFor(key)
    setResults([])
    setOutcome(null)

    setLoading(false)
    // Offline the answer would be a list of places that cannot be saved: the place write
    // queues offline but the day assignment does not, so accepting one would leave an
    // orphan. Say so instead of offering it.
    if (isEffectivelyOffline()) {
      setOutcome('failed')
      return
    }

    setLoading(true)
    try {
      const kind: VehicleKind | null =
        vehicle === 'combustion' || vehicle === 'electric' ? vehicle : null
      const wanted = refuelStopTypeFor(kind).join(',')
      // Pulled back along the road, because only what lies before the dry point can be
      // reached. `at` stays the dry point itself: it is what the band names and what the
      // map is asked to show.
      let incomplete = false
      for (let attempt = 0; attempt < MAX_SEARCHES; attempt++) {
        const along = Math.max(fromAlongKm, dryAlongKm - LOOK_BACK_KM - attempt * SEARCH_STEP_KM)
        const centre = pointAtMeters(line, along * 1000) ?? at
        const answer = await mapsApi.pois(wanted, boxAround(centre, LOOK_KM), locale, controller.signal)
        if (controller.signal.aborted) return
        incomplete ||= !!answer.truncated
        const candidates = reachableRefuels(answer.pois, line, dryAlongKm, { existing }).filter(p => p.alongKm >= fromAlongKm)
        if (candidates.length) {
          setResults(candidates)
          setOutcome('found')
          return
        }
        if (along === fromAlongKm) {
          setOutcome(outcomeOf([], { truncated: incomplete }))
          return
        }
      }
      setOutcome('incomplete')
    } catch {
      if (!controller.signal.aborted) setOutcome('failed')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [locale, vehicle])

  const offered = useMemo(() => (openFor ? results.slice(0, 3) : NONE), [openFor, results])

  return { openFor, loading, outcome, results, offered, ask, close }
}
