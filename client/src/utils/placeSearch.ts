import type { Place } from '../types'

type Searchable = Pick<Place, 'name' | 'address' | 'description' | 'notes'>

/**
 * Whether a place matches the search box of the places list (#2252). Name and
 * address as before, and also the description and the notes, so a place found
 * by what was written about it ("vegan", "book ahead") turns up too. One helper
 * for the desktop list, its filter counts and the phone's browser, so the three
 * can never disagree about what a search finds.
 */
export function placeMatchesSearch(place: Searchable, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [place.name, place.address, place.description, place.notes].some(
    field => !!field && field.toLowerCase().includes(q),
  )
}
