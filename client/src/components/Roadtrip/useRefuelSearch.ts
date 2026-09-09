import { useCallback, useRef, useState } from 'react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { boxAround, type LatLng } from './corridor'
import { reachableRefuels, outcomeOf, type RefuelCandidate, type RefuelOutcome } from './refuelSuggestion'

/**
 * Somewhere to fill up before the tank runs out, asked for once, when asked for.
 *
 * Deliberately NOT automatic, for the same reason the corridor search next door is not:
 * every run is a real request against a shared service. It is also not the corridor
 * search itself, although it looks like a smaller version of it. Three reasons, all
 * about behaviour rather than tidiness:
 *
 *  - that search is bound to the day the panel has selected, so it cannot answer a
 *    warning on day five while the panel shows day one;
 *  - starting it clears the panel's results and the traveller's own name filter;
 *  - it asks up to sixteen boxes along a whole day. This question needs one small circle.
 *
 * One request, one day, no shared state touched.
 */

/** How far around the dry point to look, in kilometres. */
const LOOK_KM = 25

export interface RefuelSearch {
  /** Which dry point is being answered, as `<dayId>:<legIndex>`, or null when idle. */
  openFor: string | null
  loading: boolean
  outcome: RefuelOutcome | null
  results: RefuelCandidate[]
  /** Runs the one request. `key` identifies the dry point, so only one is open at a time. */
  ask: (key: string, at: LatLng, line: LatLng[], dryAlongKm: number, existing: LatLng[]) => Promise<void>
  close: () => void
}

export function useRefuelSearch(): RefuelSearch {
  const { locale } = useTranslation()
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
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setOpenFor(key)
    setResults([])
    setOutcome(null)

    // Offline the answer would be a list of places that cannot be saved: the place write
    // queues offline but the day assignment does not, so accepting one would leave an
    // orphan. Say so instead of offering it.
    if (isEffectivelyOffline()) {
      setOutcome('failed')
      return
    }

    setLoading(true)
    try {
      const answer = await mapsApi.pois('fuel,charging', boxAround(at, LOOK_KM), locale, controller.signal)
      if (controller.signal.aborted) return
      const candidates = reachableRefuels(answer.pois, line, dryAlongKm, { existing })
      setResults(candidates)
      setOutcome(outcomeOf(candidates, answer))
    } catch {
      if (!controller.signal.aborted) setOutcome('failed')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [locale])

  return { openFor, loading, outcome, results, ask, close }
}
