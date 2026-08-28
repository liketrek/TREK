import { useCallback, useMemo, useState } from 'react'
import { useCorridorPois, type CorridorSearch } from './useCorridorPois'
import type { LatLng } from './corridor'
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

  return {
    dayId: day ? String(day.dayId) : '',
    setDayId,
    day,
    categories,
    toggleCategory,
    widthKm,
    setWidthKm,
    search,
  }
}
