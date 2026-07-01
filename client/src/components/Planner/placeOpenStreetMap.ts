import type { AssignmentPlace, Place } from '../../types'

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'lat' | 'lng'>

// Open a place on openstreetmap.org — the same map source TREK renders — with a
// marker at its coordinates, so people who prefer OSM (or route it on into OrganicMaps
// / CoMaps) can jump straight there. Falls back to a name search when the place has no
// coordinates. Requested in discussion #880.
export function getOpenStreetMapUrlForPlace(place: PlaceLike | null | undefined): string | null {
  if (!place) return null
  if (place.lat != null && place.lng != null) {
    return `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`
  }
  const name = place.name?.trim()
  if (name) return `https://www.openstreetmap.org/search?query=${encodeURIComponent(name)}`
  return null
}
