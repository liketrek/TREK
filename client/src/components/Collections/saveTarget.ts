import type { Place } from '../../types'
import { useSaveToCollectionStore, type SaveToCollectionTarget } from '../../store/saveToCollectionStore'

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

/**
 * Open the right "Save to Collection" flow for a trip place. A tour opens the
 * tour's own keep dialog, the one its card uses, so it is kept with its route;
 * any other place opens the place picker as before.
 */
export function openSaveToCollection(place: Place, isTour: boolean, tripId: number | string = place.trip_id): void {
  const store = useSaveToCollectionStore.getState()
  if (isTour) store.openTour({ tripId, placeId: place.id, name: place.name })
  else store.open(placeToSaveTarget(place))
}
