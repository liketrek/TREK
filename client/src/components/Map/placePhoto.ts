/**
 * A place's image_url that is directly displayable on a map marker and should
 * win over the auto-fetched provider thumbnail — a custom uploaded image (#1136)
 * or an inline data URL. Provider proxy URLs (/api/maps/place-photo/…) are
 * deliberately excluded: those still go through the downscale/thumb path so many
 * markers don't lag on zoom.
 */
export function isCustomPlaceImage(url: string | null | undefined): boolean {
  return !!url && (url.startsWith('/uploads/') || url.startsWith('data:'))
}

/**
 * Cache key under which a place's auto-fetched thumbnail is stored: the provider
 * id when there is one, otherwise the coordinates. A place with neither has no
 * identity to cache under, so it gets the empty string — callers skip it rather
 * than filing every coordinate-less place under one shared entry.
 */
export function photoCacheKey(place: {
  google_place_id?: string | null
  osm_id?: string | null
  lat?: number | null
  lng?: number | null
}): string {
  if (place.google_place_id) return place.google_place_id
  if (place.osm_id) return place.osm_id
  if (place.lat == null || place.lng == null) return ''
  return `${place.lat},${place.lng}`
}
