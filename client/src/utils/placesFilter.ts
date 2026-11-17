import type { Place } from '../types'

/**
 * The trip's places filter, in one place: the pool (all / unplanned / planned /
 * tracks), the category set, which the tags filter through as well, and the
 * minimum rating. The desktop list, the phone list and the map markers of both
 * shells apply this same predicate to the same values, held in the trip store
 * (#1541). The map keeps two deliberate differences of its own: with a day
 * open, "planned" shows that day's plan only (#2024), and the stops of
 * collapsed days are left off the map (except under "planned").
 */

/** A minimum of average stars: 'all', or a floor that unrated places fall through. */
export type PlacesRatingFloor = number | 'all'

/** The floors offered by every rating picker, the same as the collections bar (#1435). */
export const RATING_FLOORS = ['all', 5, 4, 3, 2, 1] as const

/** The pseudo category id that stands for "no category". */
export const UNCATEGORIZED = 'uncategorized'

const TAG_KEY = 'tag:'

/** A tag's entry in the category filter set, which holds category ids, UNCATEGORIZED and these. */
export const tagFilterKey = (tagId: number): string => `${TAG_KEY}${tagId}`

/**
 * The ticked categories and the ticked tags are two questions with one answer each:
 * a place passes when it is in one of the ticked categories, if any is ticked, and
 * carries one of the ticked tags, if any is ticked.
 */
export function matchesCategoryFilter(place: Place, categoryFilters: ReadonlySet<string>): boolean {
  if (categoryFilters.size === 0) return true
  const tagsTicked = [...categoryFilters].filter(key => key.startsWith(TAG_KEY)).length
  if (tagsTicked > 0 && !carriesTickedTag(place, categoryFilters)) return false
  if (tagsTicked === categoryFilters.size) return true
  if (place.category_id == null) return categoryFilters.has(UNCATEGORIZED)
  return categoryFilters.has(String(place.category_id))
}

function carriesTickedTag(place: Place, ticked: ReadonlySet<string>): boolean {
  return (place.tags ?? []).some(tag => tag.id != null && ticked.has(tagFilterKey(tag.id)))
}

/** The filter set without the entries of tags that are gone; the same set when it held none of them. */
export function withoutTagFilters(categoryFilters: Set<string>, goneTagIds: Iterable<number>): Set<string> {
  const gone = [...goneTagIds].map(tagFilterKey).filter(key => categoryFilters.has(key))
  if (gone.length === 0) return categoryFilters
  return new Set([...categoryFilters].filter(key => !gone.includes(key)))
}

export function matchesRatingFloor(place: Place, floor: PlacesRatingFloor): boolean {
  if (floor === 'all') return true
  return place.rating_avg != null && place.rating_avg >= floor
}

export interface PoolFilterSets {
  /** Every place planned anywhere in the trip: what 'unplanned' leaves out. */
  plannedIds: ReadonlySet<number> | null
  /**
   * What 'planned' keeps. Defaults to `plannedIds`; the planner narrows it to the
   * open day (#2024) while 'unplanned' stays trip-wide.
   */
  plannedFilterIds?: ReadonlySet<number> | null
}

/** A null set means "not needed for this filter" and filters nothing out. */
export function matchesPoolFilter(place: Place, filter: string, { plannedIds, plannedFilterIds = plannedIds }: PoolFilterSets): boolean {
  if (filter === 'unplanned') return !plannedIds?.has(place.id)
  if (filter === 'planned') return !plannedFilterIds || plannedFilterIds.has(place.id)
  if (filter === 'tracks') return !!place.route_geometry
  return true
}

export interface PlacesFilterState {
  filter: string
  categoryFilters: ReadonlySet<string>
  ratingFilter: PlacesRatingFloor
}

/** Pool, categories and rating together — the whole filter the store holds. */
export function matchesPlacesFilter(place: Place, state: PlacesFilterState, sets: PoolFilterSets): boolean {
  return matchesPoolFilter(place, state.filter, sets)
    && matchesCategoryFilter(place, state.categoryFilters)
    && matchesRatingFloor(place, state.ratingFilter)
}

/**
 * How many of the three filters are narrowing the places (0 to 3): the pool, the
 * categories (however many are ticked) and the rating floor. Drives the badge on
 * the phone's filter buttons.
 */
export function countActivePlacesFilters({ filter, categoryFilters, ratingFilter }: PlacesFilterState): number {
  return (filter !== 'all' ? 1 : 0) + (categoryFilters.size > 0 ? 1 : 0) + (ratingFilter !== 'all' ? 1 : 0)
}
