import type { LocationPoint } from './LocationSelect'

/** A trip place as far as a location field can offer it. */
interface PlaceLike {
  name?: string | null
  lat?: number | string | null
  lng?: number | string | null
  address?: string | null
}

/**
 * The trip's places as ready-made picks for a location field.
 *
 * Only a place with a name and a real coordinate is offered. A place without one would
 * be picked as 0,0 (`Number(null)` is a finite 0), which puts the endpoint of a booking
 * in the Gulf of Guinea. The same place added twice is offered once.
 */
export function toLocationPicks(places: readonly PlaceLike[] | null | undefined): LocationPoint[] {
  const picks: LocationPoint[] = []
  const seen = new Set<string>()
  for (const place of places ?? []) {
    const name = place.name?.trim()
    if (!name || place.lat == null || place.lng == null || place.lat === '' || place.lng === '') continue
    const lat = Number(place.lat)
    const lng = Number(place.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const key = `${name}:${lat}:${lng}`
    if (seen.has(key)) continue
    seen.add(key)
    picks.push({ name, lat, lng, address: place.address ?? null })
  }
  return picks
}
