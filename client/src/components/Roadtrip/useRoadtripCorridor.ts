import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCorridorPois, type CorridorPoi, type CorridorSearch } from './useCorridorPois'
import { insertIndexForAlong } from './roadtripModel'
import { projectOntoRoute, type LatLng } from './corridor'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'

/** The road-trip categories, in the order the panel shows them. */
export const CORRIDOR_CATEGORY_KEYS = ['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights'] as const

/** Corridor widths offered, in kilometres. */
export const CORRIDOR_WIDTHS_KM = [2, 5, 10]

export interface RoadtripCorridor {
  /** Which day's drive is being searched. */
  dayId: string
  setDayId: (value: string) => void
  day: RoadtripDay | undefined
  categories: string[]
  toggleCategory: (key: string) => void
  widthKm: number
  setWidthKm: (km: number) => void
  search: CorridorSearch
  /** Narrows what was found by name or brand. Empty means everything. */
  nameFilter: string
  setNameFilter: (value: string) => void
  /**
   * What both the panel and the map show: the hits that match `nameFilter`.
   * Read this, never `search.results`, or the two drift apart.
   */
  visible: CorridorPoi[]
  /**
   * Which position in the day's chain a hit belongs at, so adding one lands it in the
   * order it will actually be driven past rather than at the end of the day.
   */
  insertIndexFor: (poi: CorridorPoi) => number
  /** How far along the drive each of the day's stops sits, in the same units as a hit. */
  stopsAlongKm: number[]
}

/**
 * The corridor search as trip state rather than panel state.
 *
 * The map has to draw what the search found — a list of petrol stations is only half an
 * answer if you cannot see which one is on your side of the road — so the results have to
 * live above both the panel and the map rather than inside the panel.
 */
export function useRoadtripCorridor(routes: RoadtripRoutes): RoadtripCorridor {
  const [dayId, setDayId] = useState<string>('')
  const [categories, setCategories] = useState<string[]>(['fuel'])
  const [widthKm, setWidthKm] = useState<number>(5)
  const [nameFilter, setNameFilter] = useState('')

  // Falls back to the first day with a drive, so the panel is useful before the user
  // has picked anything — and follows along when that day disappears.
  const day = routes.days.find(d => String(d.dayId) === dayId) ?? routes.days[0]

  const line = useMemo<LatLng[]>(() => {
    if (!day) return []
    // The roads driven, not the straight lines between stops. A corridor built from the
    // stops searches beside a line the car never takes — between two cities that is open
    // country, which is why everything it found sat at the stops themselves.
    if (day.geometry.length > 1) return day.geometry.map(([lat, lng]) => ({ lat, lng }))
    // Until the day has routed there is nothing else to go on.
    return day.stops.map(s => ({ lat: s.lat, lng: s.lng }))
  }, [day])

  const search = useCorridorPois(line, categories, widthKm)

  const toggleCategory = useCallback((key: string) => {
    setCategories(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }, [])

  // A filter kept across a new search would hide the fresh answer behind the old question.
  // Cleared when a search STARTS, not whenever results change: hits arrive box by box and
  // publish as they land, so resetting on every batch wiped out anything typed while the
  // search was still running.
  const searching = search.loading
  const wasSearching = useRef(false)
  useEffect(() => {
    if (searching && !wasSearching.current) setNameFilter('')
    wasSearching.current = searching
  }, [searching])

  /**
   * Memoised on purpose, not filtered where it is drawn: both map renderers tear down and
   * rebuild every POI marker whenever the array's identity changes, so a `.filter()` in a
   * render body would make the pins flicker on each keystroke and on every unrelated
   * re-render.
   *
   * Brand counts as a name here because the server folds `operator` into `brand`, and
   * "Shell" is what someone types when the OSM name is "Shell Autohof Nord".
   */
  const visible = useMemo(() => {
    const needle = nameFilter.trim().toLowerCase()
    if (!needle) return search.results
    return search.results.filter(p =>
      p.name.toLowerCase().includes(needle) || (p.brand ?? '').toLowerCase().includes(needle))
  }, [search.results, nameFilter])

  /**
   * Where a hit belongs in the day's chain, as an index among its stops.
   *
   * The stops are projected onto the same thinned line the hits were measured against, so
   * both sides are distances along one drive and the comparison is simply "which stops has
   * the car passed by then". A stop the projection cannot place (nowhere near the routed
   * line) keeps its neighbours' order rather than jumping to the front.
   */
  const stopsAlongKm = useMemo(() => {
    if (!day || search.spine.length < 2) return []
    let last = 0
    return day.stops.map(s => {
      const hit = projectOntoRoute({ lat: s.lat, lng: s.lng }, search.spine)
      if (hit) last = hit.alongKm
      return last
    })
  }, [day, search.spine])

  const insertIndexFor = useCallback(
    (poi: CorridorPoi) => insertIndexForAlong(stopsAlongKm, poi.alongKm),
    [stopsAlongKm],
  )

  return {
    dayId: day ? String(day.dayId) : '',
    setDayId,
    day,
    categories,
    toggleCategory,
    widthKm,
    setWidthKm,
    search,
    nameFilter,
    setNameFilter,
    visible,
    insertIndexFor,
    stopsAlongKm,
  }
}
