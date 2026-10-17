import type { Reservation } from '../../../types'

export interface ShowOnMapDeps {
  visibleConnections: number[]
  toggleConnection: (id: number) => void
  selectDay: (dayId: number | null) => void
  selectPlace: (placeId: number | null) => void
  openPlan: () => void
}

/** Whether a booking has a route the plan map can draw: two endpoints with coordinates. */
export function hasRoute(r: Reservation): boolean {
  return (r.endpoints || []).filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lng)).length >= 2
}

/**
 * The desktop half of the phone's "On map": a transport switches its route on and
 * the plan opens on its day; a booking with a place opens the plan on that place.
 * Pressed again while the route is drawn, it switches the route off, as on the phone.
 */
export function showReservationOnMap(r: Reservation, d: ShowOnMapDeps): void {
  if (hasRoute(r)) {
    if (d.visibleConnections.includes(r.id)) { d.toggleConnection(r.id); return }
    d.toggleConnection(r.id)
    d.selectDay(r.day_id ?? r.end_day_id ?? null)
    d.openPlan()
    return
  }
  const placeId = r.type === 'hotel' ? (r.accommodation_place_id ?? r.place_id) : r.place_id
  if (placeId == null) return
  d.selectDay(r.type === 'hotel' ? (r.accommodation_start_day_id ?? r.day_id ?? null) : (r.day_id ?? null))
  d.selectPlace(placeId)
  d.openPlan()
}

/** Whether "On map" can do anything for this booking. */
export function canShowOnMap(r: Reservation): boolean {
  return hasRoute(r) || (r.type === 'hotel' ? (r.accommodation_place_id ?? r.place_id) : r.place_id) != null
}
