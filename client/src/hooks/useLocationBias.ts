import { useMemo } from 'react'
import { useTripStore, type PlanMapViewport } from '../store/tripStore'

/**
 * Where the user is planning right now, as a hint for the place search.
 *
 * Without it the search cannot tell which of a thousand identically named
 * places is meant: "Hase-dera" returns the temple in Nara rather than the one
 * in Kamakura, and a common single word is refused by the index as too
 * expensive to answer, which drops the search back to Nominatim alone.
 *
 * The hint has to be NARROW, and that is the part that is easy to get wrong.
 * Measured over 126 places of a real trip through Japan, searched against a
 * live instance:
 *
 *   no hint at all                      54.8% found, 38.1% at rank 1
 *   box around the WHOLE trip           57.1% found, 17.5% at rank 1
 *   box around the nearest few places   70.6% found, 34.9% at rank 1
 *
 * A box spanning a whole round trip has its centre somewhere between the
 * cities, points at nothing, and costs more rank-1 hits than it gains. It is
 * worse than no hint. So the day being planned comes first, and a hint that
 * ends up wider than a metropolitan area is dropped rather than sent.
 *
 * Ahead of both stands the part of the map the user is looking at (#2620). The
 * numbers above are about boxes guessed from saved places; a map zoomed in on
 * one city says where the next place goes without any guessing. It is held to
 * the same width, so a map pulled out to a whole country leaves the search to
 * the day and the trip as before.
 */

export interface LocationBiasBox {
  low: { lat: number; lng: number }
  high: { lat: number; lng: number }
}

export interface LocationBiasPoint {
  lat: number
  lng: number
  radius?: number
}

/**
 * Widest hint still worth sending, as a radius. Roughly a metropolitan area:
 * far enough to cover a city and its surroundings, narrow enough that its
 * centre still means something. The old value here was 500km of diagonal,
 * which is how the whole-trip box slipped through.
 */
const MAX_RADIUS_KM = 60

const KM_PER_DEGREE = 111

interface Coord { lat?: number | string | null; lng?: number | string | null }

export function boxFromCoords(coords: Coord[]): LocationBiasBox | undefined {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of coords) {
    // Number(null) is 0, and 0/0 is a real coordinate in the Gulf of Guinea.
    // A place without coordinates would otherwise stretch the box across half
    // the planet and the hint would be dropped for being too wide.
    if (p.lat == null || p.lng == null || p.lat === '' || p.lng === '') continue
    const lat = Number(p.lat), lng = Number(p.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  if (!Number.isFinite(minLat)) return undefined
  return { low: { lat: minLat, lng: minLng }, high: { lat: maxLat, lng: maxLng } }
}

/** Half the diagonal of a box, in kilometres — how far the hint reaches. */
export function radiusKm(box: LocationBiasBox): number {
  const lat = (box.low.lat + box.high.lat) / 2
  const dLat = box.high.lat - box.low.lat
  const dLng = box.high.lng - box.low.lng
  return Math.sqrt(
    (dLat * KM_PER_DEGREE) ** 2 + (dLng * KM_PER_DEGREE * Math.cos(lat * (Math.PI / 180))) ** 2,
  ) / 2
}

/**
 * The centre of a box, with the radius that covers it.
 *
 * Autocomplete takes a box, search takes a point — same hint, two shapes,
 * because the two upstream APIs were built years apart. The radius has a floor
 * so a day whose places sit on one street still biases toward the
 * neighbourhood rather than the doorstep.
 */
export function pointFromBox(box: LocationBiasBox | undefined): LocationBiasPoint | undefined {
  if (!box) return undefined
  return {
    lat: (box.low.lat + box.high.lat) / 2,
    lng: (box.low.lng + box.high.lng) / 2,
    // Google caps a Text Search bias circle at 50 km and rejects a wider one
    // outright, so the box for a trip spread over more than that is clamped
    // rather than sent and refused. A bias is a hint about where to look; the
    // hint is no worse for being drawn at the largest radius the API accepts.
    radius: Math.min(50_000, Math.round(Math.max(radiusKm(box), 5) * 1000)),
  }
}

/**
 * The plan map's viewport as a box, or nothing when it cannot be one. A view
 * across the antimeridian reports west east of east, and a world map scrolled
 * sideways reports longitudes past 180; neither is a box the search accepts.
 */
export function viewportBox(v: PlanMapViewport): LocationBiasBox | undefined {
  const { south, west, north, east } = v
  if (![south, west, north, east].every(Number.isFinite)) return undefined
  if (south < -90 || north > 90 || west < -180 || east > 180) return undefined
  if (south > north || west > east) return undefined
  return { low: { lat: south, lng: west }, high: { lat: north, lng: east } }
}

/**
 * The hint for the place search, in both shapes the two endpoints want.
 *
 * Preference order, narrowest first:
 *   1. the plan map's visible area, while it covers no more than one region
 *   2. the places of the day currently open — this is the area being planned
 *   3. the trip's places, but only if they still fit inside one region
 * Anything wider is dropped: no hint beats a hint pointing at open country.
 */
export function useLocationBias(): { box?: LocationBiasBox; point?: LocationBiasPoint } {
  const places = useTripStore((s) => s.places)
  const assignments = useTripStore((s) => s.assignments)
  const selectedDayId = useTripStore((s) => s.selectedDayId)
  const tripId = useTripStore((s) => s.trip?.id)
  const viewport = useTripStore((s) => s.planMapViewport)

  return useMemo(() => {
    // Only this trip's map: a viewport left over from another trip points elsewhere.
    if (viewport && tripId != null && viewport.tripId === Number(tripId)) {
      const sichtbar = viewportBox(viewport)
      if (sichtbar && radiusKm(sichtbar) <= MAX_RADIUS_KM) return { box: sichtbar, point: pointFromBox(sichtbar) }
    }

    const alle = places || []

    // The day being planned. Places reach a day through assignments, so the
    // ids come from there and the coordinates from the place pool.
    let quelle: Coord[] = []
    if (selectedDayId != null) {
      const desTages = new Set(
        (assignments?.[String(selectedDayId)] || []).map((a) => a.place_id),
      )
      if (desTages.size > 0) quelle = alle.filter((p) => desTages.has(Number(p.id)))
    }
    if (quelle.length === 0) quelle = alle

    const box = boxFromCoords(quelle)
    if (!box || radiusKm(box) > MAX_RADIUS_KM) return {}
    return { box, point: pointFromBox(box) }
  }, [places, assignments, selectedDayId, tripId, viewport])
}
