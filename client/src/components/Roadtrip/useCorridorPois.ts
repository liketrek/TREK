import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roadtripSearchRepo } from '../../repo/roadtripSearchRepo'
import { useTranslation } from '../../i18n'
import { corridorTiles, projectOntoRoute, simplifyLine, sliceAtMeters, type Bbox, type LatLng } from './corridor'
import { DESKTOP_CORRIDOR_BUDGET, type CorridorBudget } from './corridorSearchModel'
import type { Poi } from '../Map/poiCategories'

/** A POI that is actually on the way, with the two numbers that make it one. */
export interface CorridorPoi extends Poi {
  offRouteKm: number
  alongKm: number
}

export interface CorridorSearch {
  results: CorridorPoi[]
  /** Areas answered so far, out of how many the route was cut into. */
  progress: { done: number; total: number }
  loading: boolean
  /** True when the route was longer than the request budget and the tail was left out. */
  capped: boolean
  /** Boxes the place search could not answer — a partial result is still shown. */
  failedSources?: string[]
  failedAreas: number
  /**
   * Boxes where the server hit its own per-request ceiling and dropped the rest.
   * Distinct from `capped`, which is about stretches never asked for at all: here the
   * stretch was searched and the answer came back short. Without saying so, filtering
   * the results cannot tell "nothing of that name on the way" from "cut off before it".
   */
  truncatedAreas: number
  error: boolean
  /** The thinned line every `alongKm` above is measured along. */
  spine: LatLng[]
  /**
   * Asks, optionally only about a stretch of the line.
   *
   * The window is an argument rather than hook state because it belongs to the question:
   * one traveller asks about the fifty kilometres ahead and the next about the whole day,
   * off the same route and the same categories, and neither should make the other's
   * answer disappear before it was read.
   */
  search: (window?: CorridorWindow | null) => void
  clear: () => void
}

/** A stretch of the drive, in kilometres along the spine. */
export interface CorridorWindow {
  fromKm: number
  toKm: number
}

/** Gap after a request before the same worker starts the next — the mirrors are shared. */
const REQUEST_SPACING_MS = 250
/** How many boxes are in flight at once. */
const CONCURRENT_REQUESTS = 5

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    if (signal.aborted) { resolve(); return }
    const timer = setTimeout(done, ms)
    function done(): void {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })

/**
 * "What is on the way" for a drawn route.
 *
 * Deliberately manual: the search runs when the user asks for it, never on pan or on
 * every route change, because each run is several Overpass requests and the mirrors are
 * shared. Results stay until the categories or the route change.
 */
export function useCorridorPois(
  line: LatLng[],
  categories: string[],
  widthKm: number,
  /**
   * What one search may cost.
   *
   * Absent means the desktop's behaviour, unchanged: every box of the whole day, every
   * failed box retried, no deadline. The phone passes a smaller ceiling, because a cell
   * is not a desk and a search that keeps the radio warm for a minute is a search that
   * costs battery somebody is navigating on.
   */
  options?: { budget?: CorridorBudget },
): CorridorSearch {
  const budget = options?.budget ?? DESKTOP_CORRIDOR_BUDGET
  const { locale } = useTranslation()
  const [results, setResults] = useState<CorridorPoi[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [capped, setCapped] = useState(false)
  const [failedAreas, setFailedAreas] = useState(0)
  const [truncatedAreas, setTruncatedAreas] = useState(0)
  const [failedSources, setFailedSources] = useState<string[]>([])
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)

  /**
   * The routed line, thinned. A corridor built from every vertex would make hundreds of
   * overlapping boxes out of what a handful describe just as well.
   *
   * Shared rather than local to the search, because every `alongKm` in the results is a
   * distance along THIS line. Anything comparing a hit against the day's own stops has to
   * project them onto the same one, or the two sets of numbers do not mean the same thing.
   */
  const spine = useMemo(() => simplifyLine(line, Math.max(1, widthKm / 3)), [line, widthKm])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setResults([])
    setProgress({ done: 0, total: 0 })
    setLoading(false)
    setCapped(false)
    setFailedSources([])
    setFailedAreas(0)
    setTruncatedAreas(0)
    setError(false)
  }, [])

  // A changed route or category set makes the old answers wrong, not stale — drop them.
  const routeKey = line.length ? `${line.length}:${line[0].lat.toFixed(3)},${line[0].lng.toFixed(3)}` : ''
  const catKey = categories.join(',')
  useEffect(() => { clear() }, [routeKey, catKey, widthKm, clear])

  const search = useCallback((window?: CorridorWindow | null) => {
    abortRef.current?.abort()
    if (spine.length < 2 || categories.length === 0) return
    const controller = new AbortController()
    abortRef.current = controller
    const runId = ++runIdRef.current

    // Only the TILE line is cut, never the spine: every `alongKm` in a result is a
    // distance along the spine, and so is every entry in `stopsAlongKm`. Cutting the
    // spine would renumber both the moment the window moved, and a hit would land at the
    // wrong position in the day's chain.
    const tileLine = window ? sliceAtMeters(spine, window.fromKm * 1000, window.toKm * 1000) : spine
    const allTiles = corridorTiles(tileLine, widthKm)
    const tiles = allTiles.slice(0, budget.maxTiles)
    const startedAt = Date.now()
    const outOfTime = (): boolean => budget.deadlineMs != null && Date.now() - startedAt > budget.deadlineMs

    setCapped(allTiles.length > tiles.length)
    setFailedSources([])
    setFailedAreas(0)
    setTruncatedAreas(0)
    setError(false)
    setResults([])
    setLoading(true)
    setProgress({ done: 0, total: tiles.length })

    // All the wanted kinds in one query per box. Asking per kind was the same answer for
    // four times the requests, and every extra request is another chance for a shared
    // mirror to time out — which is what made a search both slow and patchy.

    const jobs = [...tiles]

    void (async () => {
      const seen = new Map<string, CorridorPoi>()
      const unavailable = new Set<string>()
      let failures = 0
      let shortened = 0
      let done = 0
      let next = 0

      // Several at a time. Following the real road rather than the line between stops
      // means more boxes to cover the same drive, and asking for them one after another
      // made a search take the better part of a minute. The server races several
      // Overpass mirrors per request and caches what comes back, so the boxes overlap
      // cheaply; the small gap afterwards keeps one worker from queueing straight up.
      const collect = async (tile: Bbox): Promise<boolean> => {
        try {
          const data = await roadtripSearchRepo.search(categories, tile, locale, controller.signal)
          if (controller.signal.aborted || runId !== runIdRef.current) return false
          data.failedSources.forEach(source => unavailable.add(source))
          setFailedSources([...unavailable])
          // The server answers with at most a few hundred per box and says so. A hit
          // dropped there is invisible here, so the count has to reach the surface.
          if (data.truncated || data.clamped) setTruncatedAreas(++shortened)
          for (const poi of data.pois) {
            if (seen.has(poi.osm_id)) continue
            const hit = projectOntoRoute({ lat: poi.lat, lng: poi.lng }, spine)
            if (!hit || hit.offRouteKm > widthKm) continue
            seen.set(poi.osm_id, {
              ...poi, address: poi.address ?? null, website: poi.website ?? null, phone: poi.phone ?? null,
              opening_hours: poi.opening_hours ?? null, cuisine: poi.cuisine ?? null,
              charging: poi.charging ? {
                capacity: poi.charging.capacity ?? null, fee: poi.charging.fee ?? null,
                sockets: poi.charging.sockets.map(s => ({ type: s.type, count: s.count ?? null, kw: s.kw ?? null })),
              } : null,
              offRouteKm: hit.offRouteKm, alongKm: hit.alongKm,
            })
          }
          return true
        } catch {
          return false
        }
      }

      const publish = (): void => {
        setProgress({ done, total: jobs.length })
        setResults([...seen.values()].sort((a, b) => a.alongKm - b.alongKm))
      }

      const retryable: Bbox[] = []
      const worker = async (): Promise<void> => {
        while (next < jobs.length) {
          if (controller.signal.aborted || runId !== runIdRef.current) return
          // Out of time stops STARTING boxes; whatever answered stays on screen and the
          // rest reports itself as unsearched, the same way a failed box does.
          //
          // The remainder is claimed before it is counted, because every worker still alive
          // runs this line: each one used to add the whole rest, so a search that timed out
          // with three workers up reported three times the boxes it had left, which can be
          // more than there ever were. Taking `next` to the end also ends the others' loops.
          if (outOfTime()) {
            const unsearched = jobs.length - next
            next = jobs.length
            if (unsearched > 0) { failures += unsearched; setFailedAreas(failures) }
            return
          }
          const job = jobs[next++]
          if (!(await collect(job))) retryable.push(job)
          done++
          if (controller.signal.aborted || runId !== runIdRef.current) return
          publish()
          await sleep(REQUEST_SPACING_MS, controller.signal)
        }
      }

      await Promise.all(Array.from({ length: Math.min(CONCURRENT_REQUESTS, jobs.length) }, worker))
      if (controller.signal.aborted || runId !== runIdRef.current) return

      // One more pass over what did not answer. Overpass mirrors time out under load far
      // more often than they are truly empty, and reporting "4 stretches went unsearched"
      // when a second ask would have answered them is the wrong end of the trade.
      const retries = budget.maxRetries == null ? retryable : retryable.slice(0, budget.maxRetries)
      failures += retryable.length - retries.length
      for (const job of retries) {
        if (controller.signal.aborted || runId !== runIdRef.current) return
        if (outOfTime()) { failures += retries.length - retries.indexOf(job); break }
        if (await collect(job)) continue
        failures++
        setFailedAreas(failures)
      }
      publish()
      setError(failures === jobs.length && failures > 0)
      setLoading(false)
    })()
  }, [spine, categories, widthKm, locale, budget.maxTiles, budget.maxRetries, budget.deadlineMs])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { results, progress, loading, capped, failedAreas, failedSources, truncatedAreas, error, spine, search, clear }
}
