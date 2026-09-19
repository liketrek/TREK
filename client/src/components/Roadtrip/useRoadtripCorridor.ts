import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCorridorPois, type CorridorPoi, type CorridorSearch } from './useCorridorPois'
import type { CorridorBudget } from './corridorSearchModel'
import { sectionAnchors, insertIndexForAlong } from './roadtripModel'
import type { SectionAnchor } from './roadtripModel'
import { projectOntoRoute, type LatLng } from './corridor'
import { useVehicleRange } from './useVehicleRange'
import type { RoadtripDay, RoadtripRoutes } from './useRoadtripRoutes'

// The categories come from the one table now, which is also the only place that knows
// a hotel is a category without being a stop kind.
export { CORRIDOR_CATEGORY_KEYS } from './stopKinds'

/** Corridor widths offered, in kilometres. */
export const CORRIDOR_WIDTHS_KM = [2, 5, 10]

/** How far either side of a chosen point the list is narrowed to, in kilometres. */
export const CORRIDOR_SECTION_KM = [25, 50, 100]

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
  /** The stops and leg midpoints a break can be planned around. */
  anchors: SectionAnchor[]
  /** Which of them the list is narrowed to, or null for the whole day. */
  section: { dayId: number; kind: 'stop' | 'leg'; index: number } | null
  setSection: (value: { dayId: number; kind: 'stop' | 'leg'; index: number } | null) => void
  /** How far either side of it, in kilometres. */
  sectionKm: number
  setSectionKm: (value: number) => void
  /** Socket family the charging hits are narrowed to, or empty for any. */
  socketFilter: string
  setSocketFilter: (value: string) => void
  /** Minimum kW for charging hits, or 0 for any. */
  minKw: number
  setMinKw: (value: number) => void
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
  insertIndexFor: (poi: Pick<CorridorPoi, 'alongKm'>) => number
  /** How far along the drive each of the day's stops sits, in the same units as a hit. */
  stopsAlongKm: number[]
  /**
   * Back to "nothing asked yet": the hits go, and with them the pins on the map.
   *
   * Both halves, deliberately. `search.clear()` alone leaves the four narrowing states
   * standing, so a plug type or a minimum power set for the last question would quietly
   * shrink the answer to the next one. The categories and the corridor width stay put:
   * they are the question rather than the answer, and clearing them would turn asking
   * the same thing again into a handful of clicks.
   */
  clear: () => void
}

/**
 * The corridor search as trip state rather than panel state.
 *
 * The map has to draw what the search found — a list of petrol stations is only half an
 * answer if you cannot see which one is on your side of the road — so the results have to
 * live above both the panel and the map rather than inside the panel.
 */
export function useRoadtripCorridor(
  routes: RoadtripRoutes,
  tripId?: number | string | null,
  /**
   * What one search may cost. Absent is the desktop's ceiling; the phone hands down a
   * smaller one. Not a window: which stretch of the day to ask about is decided per
   * search, by whoever presses the button, and travels as an argument to `search`.
   */
  options?: { budget?: CorridorBudget },
): RoadtripCorridor {
  const [dayId, setDayId] = useState<string>('')
  const [categories, setCategories] = useState<string[]>(['fuel'])
  const [widthKm, setWidthKm] = useState<number>(5)
  const [nameFilter, setNameFilter] = useState('')
  /**
   * Which point of the day the list is narrowed around, if any.
   *
   * Stored as the anchor's identity rather than as a distance, on purpose: `alongKm` is
   * measured against the thinned spine, whose length depends on the corridor width
   * (`useCorridorPois` thins with a tolerance derived from it). A kilometre figure kept
   * here would quietly shift when the width changes from 5 to 10; resolved through
   * `stopsAlongKm` it lands on the same stop again.
   */
  const [section, setSection] = useState<{ dayId: number; kind: 'stop' | 'leg'; index: number } | null>(null)
  const [sectionKm, setSectionKm] = useState(50)
  /** A socket family, or empty for any. Only ever applied to charging hits. */
  const [socketFilter, setSocketFilter] = useState('')
  /** Minimum kW, or 0 for any. */
  const [minKw, setMinKw] = useState(0)

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

  const search = useCorridorPois(line, categories, widthKm, options)

  /**
   * Whether what the panel looks for has been decided yet.
   *
   * The vehicle is a stored, trip-scoped preference, so it is not known at first render;
   * the default below therefore cannot be a `useState` initialiser. Once it has been
   * applied (or once the traveller has picked the kinds themselves) it is never
   * applied again: a category somebody switched off on purpose coming back by itself
   * would make the picker unusable.
   */
  const categoriesSeeded = useRef(false)

  const toggleCategory = useCallback((key: string) => {
    categoriesSeeded.current = true
    setCategories(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }, [])

  /**
   * An electric car looks for chargers, not for pumps.
   *
   * Only for `electric`. The preference has four stored states and `useVehicleRange`
   * folds three of them into null (a combustion sibling written as an empty string, no
   * answer at all, and the moment before the preference has loaded), and none of those
   * is a reason to change what a panel looks for. Every traveller who never opened the
   * driving settings keeps the fuel they have always had.
   */
  const { vehicleKind } = useVehicleRange(tripId)
  useEffect(() => {
    if (categoriesSeeded.current || vehicleKind !== 'electric') return
    categoriesSeeded.current = true
    // Never over a running or finished search. `useCorridorPois` drops its results
    // whenever the categories change, so a preference that lands a second after the
    // panel did would empty a list somebody is already reading.
    if (search.loading || search.results.length > 0) return
    setCategories(['charging'])
  }, [vehicleKind, search.loading, search.results.length])

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

  /**
   * The stops and leg midpoints of the current day, and the distance of the chosen one.
   *
   * Resolved here rather than stored: `section` names an anchor, and its kilometre figure
   * is looked up fresh, so changing the corridor width does not move the point the list
   * is narrowed around.
   */
  const anchors = useMemo(() => sectionAnchors(stopsAlongKm), [stopsAlongKm])
  const anchorKm = useMemo(() => {
    if (!section || !day || section.dayId !== day.dayId) return null
    return anchors.find(a => a.kind === section.kind && a.index === section.index)?.alongKm ?? null
  }, [section, day, anchors])

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
    // The same array when nothing narrows it, not a copy of it: the map redraws off this
    // reference, and handing it a fresh array on every render moves every pin.
    if (!needle && !socketFilter && !minKw && anchorKm === null) return search.results
    return search.results.filter(p => {
      // Around one point of the drive, when one has been picked. The two figures are
      // measured against the same thinned line, so this really is a subtraction and not
      // a second search.
      if (anchorKm !== null && Math.abs(p.alongKm - anchorKm) > sectionKm) return false
      if (needle && !(p.name.toLowerCase().includes(needle) || (p.brand ?? '').toLowerCase().includes(needle))) {
        return false
      }
      // The charging filters only ever hide charging hits. A rest area does not have a
      // socket and is not answering the question, so filtering the whole list by one
      // would empty it of everything the search also found.
      if (p.category !== 'charging') return true
      if (socketFilter && !p.charging?.sockets.some(s => s.type === socketFilter)) return false
      // A station that does not state its power is kept. Roughly two thirds of them do
      // not, and reading silence as "too slow" would throw away most of the map.
      if (minKw && p.charging?.sockets.some(s => s.kw != null) && !p.charging.sockets.some(s => (s.kw ?? 0) >= minKw)) {
        return false
      }
      return true
    })
  }, [search.results, nameFilter, socketFilter, minKw, anchorKm, sectionKm])

  const insertIndexFor = useCallback(
    (poi: Pick<CorridorPoi, 'alongKm'>) => {
      // A card can open with a drive that left from a stop on the day before: the one a
      // night carried over, or on connected days the road from where yesterday ended. A
      // hit on that stretch is passed before this card's first stop, so it goes in ahead
      // of it. `insertIndexForAlong` never answers 0, which is right for every other card,
      // whose line starts at its first stop.
      const arrivesFromEarlier = day?.spills?.find(sp => sp.at === 0)?.fromStop ?? day?.arrivingFrom
      if (arrivesFromEarlier && stopsAlongKm.length > 1 && poi.alongKm < stopsAlongKm[0]!) return 0
      return insertIndexForAlong(stopsAlongKm, poi.alongKm)
    },
    [day, stopsAlongKm],
  )

  /**
   * Throwing the answer away, which nothing could do before.
   *
   * A search that turned up the wrong thing left its hits in the list and its pins on
   * the map, and the only way out was switching to the day plan and back. The search's
   * own `clear` aborts what is in flight and empties the results (`visible` collapses
   * with them and the map re-merges, so no layer needs telling), and the four narrowing
   * states go too, because they were set for a question that no longer has an answer.
   *
   * Pulled out of `search` into its own name rather than depended on as `search.clear`:
   * the object is rebuilt on every publish of the hook below, so a dependency on it
   * would rebuild this callback on every box that answers, while the function itself
   * never changes.
   */
  const clearResults = search.clear
  const clear = useCallback(() => {
    clearResults()
    setNameFilter('')
    setSection(null)
    setSocketFilter('')
    setMinKw(0)
  }, [clearResults])

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
    anchors,
    section,
    setSection,
    sectionKm,
    setSectionKm,
    socketFilter,
    setSocketFilter,
    minKw,
    setMinKw,
    setNameFilter,
    visible,
    insertIndexFor,
    stopsAlongKm,
    clear,
  }
}
