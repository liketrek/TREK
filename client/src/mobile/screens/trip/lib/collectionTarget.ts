import type { SaveToCollectionTarget } from '../../../../store/saveToCollectionStore'
import type { Place } from '../../../../types'

/** The save-to-collection picker payload for a trip pool place (provenance + maps identity). */
export function collectionTargetFromPlace(place: Place): SaveToCollectionTarget {
  return {
    name: place.name,
    source_trip_id: place.trip_id ?? null,
    source_place_id: place.id,
    description: place.description ?? null,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    address: place.address ?? null,
    category_id: place.category_id ?? null,
    price: place.price ?? null,
    currency: place.currency ?? null,
    notes: place.notes ?? null,
    image_url: place.image_url ?? null,
    google_place_id: place.google_place_id ?? null,
    google_ftid: place.google_ftid ?? null,
    osm_id: place.osm_id ?? null,
    website: place.website ?? null,
    phone: place.phone ?? null,
  }
}
