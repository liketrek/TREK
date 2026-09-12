import type { RoadtripStopType } from '@trek/shared'

export interface PlaceFormData {
  name: string
  description: string
  address: string
  lat: string
  lng: string
  category_id: string
  place_time: string
  end_time: string
  notes: string
  transport_mode: string
  website: string
  // Populated from a maps-search pick (not part of the initial blank form).
  phone?: string
  google_place_id?: string
  google_ftid?: string
  osm_id?: string
  amap_poi_id?: string
  // Hero image picked from the detail column. Optional and absent from
  // DEFAULT_FORM on purpose: the mobile sheet shares this type and never sets
  // it, and places.service already writes image_url through on create/update.
  image_url?: string
  // Day-specific note on the in-context assignment (#2163). Only hydrated when
  // the form opened with an assignment in context; both forms drop it from the
  // submit payload when unchanged, and useTripPlanner strips it off the place
  // update and PUTs it per assignment instead.
  assignment_notes?: string
  // What kind of stop on a drive this is, if any (#1797). Optional and absent from
  // DEFAULT_FORM for the same reason as image_url: a missing key writes nothing, and a
  // place created outside a road trip has no opinion about fuel stops.
  stop_type?: RoadtripStopType | null
  // Offered only while creating, and only alongside a stop_type: the corridor popup
  // suggests how long that kind of pause usually takes, and the full form should not
  // throw the suggestion away on the way through. Editing a stay is the rail's job.
  duration_minutes?: number
}

export function isGoogleMapsUrl(input: string): boolean {
  try {
    const { hostname, pathname } = new URL(input.trim())
    const h = hostname.toLowerCase()
    // maps.app.goo.gl, goo.gl/maps
    if (h === 'maps.app.goo.gl') return true
    if (h === 'goo.gl' && pathname.startsWith('/maps')) return true
    // maps.google.* (e.g. maps.google.com, maps.google.co.uk)
    // Must be maps.google.<tld> or maps.google.<sld>.<tld> — reject maps.google.evil.com
    if (/^maps\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(h)) return true
    // google.*/maps (e.g. google.com/maps, www.google.co.uk/maps)
    const bare = h.startsWith('www.') ? h.slice(4) : h
    if (/^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(bare) && pathname.startsWith('/maps')) return true
    return false
  } catch {
    return false
  }
}

/**
 * Amap's own hosts, the same set the server resolves (amap.provider.ts). An
 * exact list rather than a shape: Amap has no ccTLD family, so a pattern would
 * only widen what the search box hands to the resolver.
 */
const AMAP_HOSTS = new Set(['amap.com', 'www.amap.com', 'uri.amap.com', 'wb.amap.com', 'surl.amap.com', 'gaode.com', 'www.gaode.com'])

export function isAmapUrl(input: string): boolean {
  try {
    return AMAP_HOSTS.has(new URL(input.trim()).hostname.toLowerCase())
  } catch {
    return false
  }
}

/** A pasted link the server can turn into a place, from either provider. */
export function isMapUrl(input: string): boolean {
  return isGoogleMapsUrl(input) || isAmapUrl(input)
}

export const DEFAULT_FORM: PlaceFormData = {
  name: '',
  description: '',
  address: '',
  lat: '',
  lng: '',
  category_id: '',
  place_time: '',
  end_time: '',
  notes: '',
  transport_mode: 'walking',
  website: '',
}

/**
 * The fields a maps result owns. Everything else in the form belongs to the
 * user and is never touched by picking a place.
 */
export const RESULT_FIELDS = [
  'name',
  'address',
  'lat',
  'lng',
  'google_place_id',
  'google_ftid',
  'osm_id',
  'amap_poi_id',
  'website',
  'phone',
] as const

export type ResultField = (typeof RESULT_FIELDS)[number]

/**
 * Folds a picked search result into the form.
 *
 * The obvious version is `result.x || prev.x`, and it has a bug that is easy to
 * miss and hard to spot as a user: that expression cannot tell "the user typed
 * this" from "the previous search result wrote this". Pick Hamburg Airport,
 * then pick Berlin Hauptbahnhof — which has no website in OpenStreetMap — and
 * the airport's website is still sitting in the field. Save it and the station
 * now links to an airport.
 *
 * So the caller tracks which fields it filled in itself. A field the last pick
 * wrote belongs to the last place and is cleared when the new one says nothing
 * about it; a field the user typed survives untouched. `autoFilled` is mutated
 * in place — it is the caller's record of what it owns.
 */
export function mergeResult(
  prev: PlaceFormData,
  result: Record<string, unknown>,
  autoFilled: Set<ResultField>,
): PlaceFormData {
  const next = { ...prev } as PlaceFormData & Record<string, string | undefined>

  for (const field of RESULT_FIELDS) {
    const raw = result[field]
    const value = raw == null ? '' : String(raw)

    if (value) {
      next[field] = value
      autoFilled.add(field)
    } else if (autoFilled.has(field)) {
      // Belonged to the place that is no longer selected.
      next[field] = ''
      autoFilled.delete(field)
    }
    // Otherwise the user put it there; leave it alone.
  }

  return next
}
