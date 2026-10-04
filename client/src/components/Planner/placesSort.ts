/**
 * How the places list is ordered (#2093). List-only, like the rating floor: the
 * map has no order to keep. 'newest' is the order the trip always had.
 */
export const PLACES_SORTS = ['newest', 'oldest', 'name', 'rating', 'updated'] as const
export type PlacesSort = typeof PLACES_SORTS[number]

const STORAGE_KEY = 'trek:places-sort'

export function readPlacesSort(): PlacesSort {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (PLACES_SORTS as readonly string[]).includes(stored ?? '') ? stored as PlacesSort : 'newest'
  } catch {
    return 'newest'
  }
}

export function writePlacesSort(sort: PlacesSort): void {
  try {
    if (sort === 'newest') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, sort)
  } catch {
    // Private mode: the choice holds for this visit only.
  }
}

interface Sortable { id: number; name?: string | null; rating_avg?: number | null; created_at?: string; updated_at?: string }

/**
 * The places in the chosen order. Ties, and places missing the field sorted on,
 * fall back to the newest-first order, so unrated places sink under the rated
 * ones instead of scattering between them.
 */
export function sortPlaces<P extends Sortable>(places: P[], sort: PlacesSort, locale?: string): P[] {
  const newest = (a: P, b: P) => (b.created_at ?? '').localeCompare(a.created_at ?? '') || b.id - a.id
  if (sort === 'newest') return places
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true })
  const by: Record<Exclude<PlacesSort, 'newest'>, (a: P, b: P) => number> = {
    oldest: (a, b) => -newest(a, b),
    name: (a, b) => collator.compare((a.name ?? '').trim(), (b.name ?? '').trim()) || newest(a, b),
    rating: (a, b) => ((b.rating_avg ?? -1) - (a.rating_avg ?? -1)) || newest(a, b),
    updated: (a, b) => (b.updated_at ?? b.created_at ?? '').localeCompare(a.updated_at ?? a.created_at ?? '') || newest(a, b),
  }
  return [...places].sort(by[sort])
}
