import type { BookingImportPreviewItem, Reservation, ReservationEndpoint } from '@trek/shared'

/**
 * A pre-fill draft for the reservation/transport edit modals built from a parsed
 * booking-import item. Carries the normal reservation fields the modals read for
 * their form, plus the import-only `_venue`/`_accommodation` the hotel path needs
 * to suggest a place and a day range. It has no `id` — the modal stays in
 * "create" mode and the user reviews/edits before it is ever persisted.
 */
export interface BookingReviewDraft extends Omit<Partial<Reservation>, 'metadata' | 'endpoints'> {
  /** Type-specific extras (airline, flight_number, check_in_time, price, …) as an object. */
  metadata?: Record<string, unknown> | null
  endpoints?: ReservationEndpoint[]
  /** Parsed venue (auto-created place candidate) — hotel/restaurant/event. */
  _venue?: BookingImportPreviewItem['_venue']
  /** Parsed check-in/out + confirmation — hotels only. */
  _accommodation?: BookingImportPreviewItem['_accommodation']
  /** The uploaded source file(s) the item was parsed from — attached to the booking on save. */
  _sourceFiles?: File[]
}

/**
 * Map a parsed booking item onto the shape the edit modals pre-fill from. Pure
 * (no I/O). Transport items keep their geocoded endpoints; venue/accommodation
 * ride along untouched so the hotel modal can match a place by name (or create
 * one from the reviewed address on save).
 */
export function parsedItemToDraft(item: BookingImportPreviewItem): BookingReviewDraft {
  return {
    type: item.type,
    title: item.title,
    status: 'pending',
    reservation_time: item.reservation_time ?? null,
    reservation_end_time: item.reservation_end_time ?? null,
    location: item.location ?? item._venue?.address ?? item._venue?.name ?? null,
    confirmation_number: item.confirmation_number ?? null,
    notes: null,
    metadata: (item.metadata as Record<string, unknown> | undefined) ?? null,
    endpoints: (item.endpoints ?? []) as ReservationEndpoint[],
    _venue: item._venue,
    _accommodation: item._accommodation,
  }
}

/** Transport types route to the TransportModal; everything else to the ReservationModal. */
const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other'])
export function isTransportItem(item: BookingImportPreviewItem): boolean {
  return TRANSPORT_TYPES.has(item.type)
}
