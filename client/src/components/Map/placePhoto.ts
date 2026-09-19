import { escapeHtml } from '@trek/shared'

const PHOTO_PROXY_PREFIX = '/api/maps/place-photo/'

/** The fields of a place that decide which picture its marker gets. */
interface PhotoSource {
  image_url?: string | null
  google_place_id?: string | null
  osm_id?: string | null
  lat?: number | null
  lng?: number | null
}

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
 * photo the user picked when there is one, else the provider id, otherwise the
 * coordinates. The picked photo comes first because picking another picture of the
 * same place leaves its provider id alone, and the thumb cached under that id
 * would go on answering for the new one. A place with none of these has no
 * identity to cache under, so it gets the empty string: callers skip it rather
 * than filing every coordinate-less place under one shared entry.
 */
export function photoCacheKey(place: PhotoSource): string {
  if (place.image_url?.startsWith(PHOTO_PROXY_PREFIX)) return place.image_url
  if (place.google_place_id) return place.google_place_id
  if (place.osm_id) return place.osm_id
  if (place.lat == null || place.lng == null) return ''
  return `${place.lat},${place.lng}`
}

/**
 * What the maps' thumb loading depends on, as one string to key the effect on.
 * Place ids alone missed every change of picture: taking an upload off a place or
 * picking another suggested photo changes no id, so the marker kept a category
 * dot or the old thumb until the page was reloaded.
 */
export function photoSourcesKey(places: Array<PhotoSource & { id: number }>): string {
  return places.map(p => `${p.id}:${isCustomPlaceImage(p.image_url) ? 'own' : photoCacheKey(p)}`).join('|')
}

/**
 * The picture inside a round place marker, for both the Leaflet and the GL map.
 *
 * Sized by its style and not by width/height attributes, because stylesheet rules
 * beat attributes: Tailwind's preflight gives every img `height: auto`, and
 * Leaflet's marker pane adds `width: auto`. The 48px square thumbs got away with
 * that. An uploaded photo kept its own proportions on the GL map and its full pixel
 * size on Leaflet, where only the rounded-off corner of a 4000px image lands inside
 * the circle, so the marker showed nothing but its category colour.
 */
export function markerPhotoHtml(url: string): string {
  return `<img src="${escapeHtml(url)}" alt="" style="display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
}
