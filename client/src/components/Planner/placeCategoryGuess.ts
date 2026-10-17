import type { Category } from '../../types'

type Kind = 'lodging' | 'food' | 'drinks' | 'sight' | 'shopping' | 'transport' | 'beach' | 'nature' | 'activity'

/**
 * What a search result says it is, read from whichever vocabulary its source speaks:
 * Google `types`, the OpenStreetMap tag value, or the TREK Places (Overture) category.
 * Checked in order, first hit wins, so the specific kinds sit before the broad ones
 * ("bar" before "restaurant" would misfile a "restaurant_bar" otherwise).
 */
const KIND_TERMS: [Kind, string[]][] = [
  ['lodging', ['hotel', 'hostel', 'motel', 'guest_house', 'lodging', 'resort', 'camp_site', 'campground', 'campsite', 'chalet', 'bed_and_breakfast', 'alpine_hut', 'apartment', 'caravan_site']],
  ['beach', ['beach']],
  ['drinks', ['cafe', 'coffee', 'bar', 'pub', 'biergarten', 'night_club', 'nightclub', 'bakery', 'ice_cream', 'wine_bar', 'brewery', 'tea_house']],
  ['food', ['restaurant', 'fast_food', 'food', 'meal_', 'bistro', 'diner', 'pizzeria', 'steakhouse']],
  ['transport', ['station', 'airport', 'aerodrome', 'ferry_terminal', 'bus_stop', 'terminal', 'car_rental', 'parking']],
  ['shopping', ['shop', 'store', 'mall', 'supermarket', 'market', 'department_store', 'boutique']],
  ['sight', ['museum', 'attraction', 'viewpoint', 'monument', 'memorial', 'castle', 'artwork', 'gallery', 'church', 'cathedral', 'place_of_worship', 'historic', 'ruins', 'landmark', 'zoo', 'aquarium', 'palace', 'tower']],
  ['nature', ['park', 'nature_reserve', 'national_park', 'peak', 'waterfall', 'forest', 'garden', 'natural_feature', 'lake', 'hiking']],
  ['activity', ['amusement_park', 'theme_park', 'stadium', 'sports', 'spa', 'gym', 'cinema', 'theatre', 'theater', 'bowling', 'swimming', 'golf', 'climbing', 'ski']],
]

/** How a trip's category of that kind is recognised: words in its name, then its icon. */
const KIND_CATEGORY: Record<Kind, { names: string[]; icons: string[] }> = {
  lodging: { names: ['hotel', 'accommodation', 'lodging', 'unterkunft', 'hébergement', 'alojamiento', 'alloggio', 'stay', 'hostel', 'camping'], icons: ['🏨', '🛏️', '🏠', 'BedDouble', 'Home', 'Tent'] },
  food: { names: ['restaurant', 'food', 'essen', 'ristorante', 'restaurante', 'eat'], icons: ['🍽️', '🍴', 'UtensilsCrossed', 'Utensils'] },
  drinks: { names: ['cafe', 'café', 'bar', 'coffee', 'kaffee', 'pub', 'drinks'], icons: ['☕', '🍺', '🍸', 'Coffee', 'Beer', 'Wine'] },
  sight: { names: ['attraction', 'sight', 'sehenswürdigkeit', 'museum', 'attraktion', 'culture', 'kultur'], icons: ['🏛️', '📸', 'Landmark', 'Library', 'Camera', 'Church'] },
  shopping: { names: ['shopping', 'shop', 'einkauf', 'store', 'markt'], icons: ['🛍️', 'ShoppingBag', 'Store'] },
  transport: { names: ['transport', 'verkehr', 'transit', 'station'], icons: ['🚌', '🚆', '✈️', 'Bus', 'Train', 'Plane'] },
  beach: { names: ['beach', 'strand', 'plage', 'playa', 'spiaggia'], icons: ['🏖️', 'Waves'] },
  nature: { names: ['nature', 'natur', 'park', 'outdoor', 'hiking', 'wandern'], icons: ['🌿', '🌲', '⛰️', 'TreePine', 'Leaf', 'Mountain'] },
  activity: { names: ['activity', 'aktivität', 'activité', 'actividad', 'attività', 'sport'], icons: ['🎯', 'Activity', 'Dumbbell', 'Ticket'] },
}

/** The words a result carries about itself, lower-cased, whatever the source. */
function resultTerms(result: Record<string, unknown>): string[] {
  const terms: string[] = []
  if (Array.isArray(result.types)) for (const t of result.types) if (typeof t === 'string') terms.push(t.toLowerCase())
  if (typeof result.category === 'string') terms.push(result.category.toLowerCase())
  return terms
}

export function kindOfResult(result: Record<string, unknown>): Kind | null {
  const terms = resultTerms(result)
  if (terms.length === 0) return null
  for (const [kind, words] of KIND_TERMS) {
    if (terms.some(term => words.some(word => term.includes(word)))) return kind
  }
  return null
}

/**
 * The trip category a picked search result most likely belongs in (#2282), or null.
 *
 * Categories are the admin's own, freely named and freely iconed, so there is no key to
 * look up; they are recognised by their name, then by their icon. When nothing matches
 * the answer is null and the field stays empty, because a wrong category that looks
 * deliberate is worse than none.
 */
export function guessCategoryId(result: Record<string, unknown>, categories: Pick<Category, 'id' | 'name' | 'icon'>[]): number | null {
  const kind = kindOfResult(result)
  if (!kind) return null
  const { names, icons } = KIND_CATEGORY[kind]
  const byName = categories.find(c => {
    const name = (c.name || '').toLowerCase()
    return names.some(word => name.includes(word))
  })
  if (byName) return byName.id
  const byIcon = categories.find(c => c.icon != null && icons.includes(c.icon))
  return byIcon ? byIcon.id : null
}
