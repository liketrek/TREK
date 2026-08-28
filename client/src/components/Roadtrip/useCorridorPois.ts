import { useCallback, useEffect, useRef, useState } from 'react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { corridorTiles, projectOntoRoute, simplifyLine, type Bbox, type LatLng } from './corridor'
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
  error: boolean
  search: () => void
  clear: () => void
}

/**
 * How many bounding boxes one search may ask Overpass for. A German-to-Italian drive
 * would otherwise be dozens of requests against a shared public mirror; past this the
 * search stops and says so rather than quietly covering half the route.
 */
const MAX_TILES = 16
/** Gap after a request before the same worker starts the next — the mirrors are shared. */
const REQUEST_SPACING_MS = 400
/** How many boxes are in flight at once. */
const CONCURRENT_REQUESTS = 3

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
export function useCorridorPois(line: LatLng[], categories: string[], widthKm: number): CorridorSearch {
  const { locale } = useTranslation()
  const [results, setResults] = useState<CorridorPoi[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [capped, setCapped] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setResults([])
    setProgress({ done: 0, total: 0 })
    setLoading(false)
    setCapped(false)
    setError(false)
  }, [])

  // A changed route or category set makes the old answers wrong, not stale — drop them.
  const routeKey = line.length ? `${line.length}:${line[0].lat.toFixed(3)},${line[0].lng.toFixed(3)}` : ''
  const catKey = categories.join(',')
  useEffect(() => { clear() }, [routeKey, catKey, widthKm, clear])

  const search = useCallback(() => {
    abortRef.current?.abort()
    if (line.length < 2 || categories.length === 0) return
    const controller = new AbortController()
    abortRef.current = controller
    const runId = ++runIdRef.current

    // Thin the routed geometry first: a corridor built from every vertex would make
    // hundreds of overlapping boxes out of what a handful describe just as well.
    const spine = simplifyLine(line, Math.max(1, widthKm / 3))
    const allTiles = corridorTiles(spine, widthKm)
    const tiles = allTiles.slice(0, MAX_TILES)

    setCapped(allTiles.length > tiles.length)
    setError(false)
    setResults([])
    setLoading(true)
    setProgress({ done: 0, total: tiles.length * categories.length })

    const jobs: { tile: Bbox; category: string }[] = []
    for (const tile of tiles) for (const category of categories) jobs.push({ tile, category })

    void (async () => {
      const seen = new Map<string, CorridorPoi>()
      let failures = 0
      let done = 0
      let next = 0

      // A few at a time, staggered. Following the real road rather than the line between
      // stops means more boxes to cover the same drive, and asking for them strictly one
      // after another turned a search into half a minute of waiting. The server races
      // several Overpass mirrors and caches what comes back, so a small pool is fair use.
      const worker = async (): Promise<void> => {
        while (next < jobs.length) {
          if (controller.signal.aborted || runId !== runIdRef.current) return
          const { tile, category } = jobs[next++]
          try {
            const data = await mapsApi.pois(category, tile, locale, controller.signal)
            for (const poi of data.pois) {
              if (seen.has(poi.osm_id)) continue
              const hit = projectOntoRoute({ lat: poi.lat, lng: poi.lng }, spine)
              if (!hit || hit.offRouteKm > widthKm) continue
              seen.set(poi.osm_id, { ...poi, offRouteKm: hit.offRouteKm, alongKm: hit.alongKm })
            }
          } catch {
            // One dead mirror or one clamped box must not empty the whole search; the run
            // is only called a failure if every request failed.
            failures++
          }
          done++
          if (controller.signal.aborted || runId !== runIdRef.current) return
          setProgress({ done, total: jobs.length })
          setResults([...seen.values()].sort((a, b) => a.alongKm - b.alongKm))
          await sleep(REQUEST_SPACING_MS, controller.signal)
        }
      }

      await Promise.all(Array.from({ length: Math.min(CONCURRENT_REQUESTS, jobs.length) }, worker))
      if (controller.signal.aborted || runId !== runIdRef.current) return
      setError(failures === jobs.length && failures > 0)
      setLoading(false)
    })()
  }, [line, categories, widthKm, locale])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { results, progress, loading, capped, error, search, clear }
}
