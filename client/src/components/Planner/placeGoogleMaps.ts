import type { AssignmentPlace, Place } from '../../types'

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'address' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>
const GOOGLE_FTID_RE = /^0x[0-9a-f]+:0x[0-9a-f]+$/i

export function getGoogleMapsUrlForPlace(place: PlaceLike | null | undefined, detailsUrl?: string | null): string | null {
  if (!place) return null
  const ftid = place.google_ftid?.trim()
  if (ftid && GOOGLE_FTID_RE.test(ftid)) {
    return `https://www.google.com/maps/place/?q=${encodeURIComponent(place.name)}&ftid=${ftid}`
  }
  const placeId = place.google_place_id?.trim()
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(placeId)}`
  }
  if (detailsUrl) return detailsUrl

  // No Google identifier of any kind. Coordinates alone drop a pin on a spot
  // with no name attached, which is what #1278 reported: the map opens, but not
  // the place. Google documents `query=PLACE_NAME,ADDRESS` for exactly this
  // case, and an address is specific enough that the name cannot match the
  // wrong "Central Station" three cities over.
  const name = place.name?.trim()
  const address = place.address?.trim()
  if (name && address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`
  }
  if (place.lat == null || place.lng == null) return null
  // A name without an address is not safe to search on its own, so the position
  // wins: a pin in the right spot beats a confident link to the wrong place.
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
}
