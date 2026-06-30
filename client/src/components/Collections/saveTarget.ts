import type { Place } from '../../types'
import type { SaveToCollectionTarget } from '../../store/saveToCollectionStore'

/**
 * Build a Save-to-Collection picker target from a trip pool place, carrying the
 * provenance ids so the saved copy remembers its origin trip/place.
 */
export function placeToSaveTarget(place: Place): SaveToCollectionTarget {
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
