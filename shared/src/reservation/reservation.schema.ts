import { z } from 'zod';

/**
 * Reservation + accommodation API contract — single source of truth for the
 * /api/trips/:tripId/reservations and /api/trips/:tripId/accommodations endpoints.
 *
 * Trip-scoped. Reservations use the 'reservation_edit' permission; accommodations
 * use 'day_edit' (they live in the day/accommodation service). The legacy routes
 * (server/src/routes/reservations.ts + the accommodations sub-router in
 * routes/days.ts) carry several side effects — auto-creating/updating/deleting a
 * linked budget item, accommodation broadcasts and booking notifications — which
 * the Nest service reproduces 1:1. Reservation bodies are wide and provider-ish,
 * so the create/update payloads stay mostly open with `title` pinned.
 */

const open = z.record(z.string(), z.unknown());

/**
 * A reservation endpoint (flight/train leg terminal) — row of the
 * reservation_endpoints table (server/src/services/reservationService.ts).
 */
export const reservationEndpointSchema = z.object({
  id: z.number().optional(),
  reservation_id: z.number().optional(),
  role: z.enum(['from', 'to', 'stop']),
  sequence: z.number(),
  name: z.string(),
  code: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  timezone: z.string().nullable(),
  local_time: z.string().nullable(),
  local_date: z.string().nullable(),
});
export type ReservationEndpoint = z.infer<typeof reservationEndpointSchema>;

/**
 * Reservation entity as returned by the reservation list endpoint
 * (server/src/services/reservationService.ts -> listReservations). Columns of
 * the `reservations` table plus the joined day_number / place_name / linked
 * accommodation fields and the computed `day_positions` + `endpoints`.
 * `accommodation_id` is stored as TEXT in the DB.
 */
export const reservationSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  day_id: z.number().nullable().optional(),
  end_day_id: z.number().nullable().optional(),
  place_id: z.number().nullable().optional(),
  assignment_id: z.number().nullable().optional(),
  title: z.string(),
  reservation_time: z.string().nullable().optional(),
  reservation_end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  confirmation_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string(),
  type: z.string(),
  accommodation_id: z.union([z.number(), z.string()]).nullable().optional(),
  metadata: z.string().nullable().optional(),
  needs_review: z.number().optional(),
  day_plan_position: z.number().nullable().optional(),
  created_at: z.string().optional(),
  // AirTrail (or future provider) linkage — drives the "synced" badge (#214).
  external_source: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  external_owner_user_id: z.number().nullable().optional(),
  external_synced_at: z.string().nullable().optional(),
  sync_enabled: z.number().nullable().optional(),
  // joined / computed in listReservations
  day_number: z.number().nullable().optional(),
  place_name: z.string().nullable().optional(),
  accommodation_place_id: z.number().nullable().optional(),
  accommodation_name: z.string().nullable().optional(),
  accommodation_start_day_id: z.number().nullable().optional(),
  accommodation_end_day_id: z.number().nullable().optional(),
  day_positions: z.record(z.string(), z.number()).nullable().optional(),
  endpoints: z.array(reservationEndpointSchema).optional(),
});
export type Reservation = z.infer<typeof reservationSchema>;

/**
 * Accommodation entity as returned by listAccommodations / getAccommodationWithPlace
 * (server/src/services/dayService.ts). Columns of the day_accommodations table
 * plus the joined place fields and (on list) the linked reservation_title.
 */
export const accommodationSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  place_id: z.number().nullable().optional(),
  start_day_id: z.number(),
  end_day_id: z.number(),
  check_in: z.string().nullable().optional(),
  check_in_end: z.string().nullable().optional(),
  check_out: z.string().nullable().optional(),
  confirmation: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  // joined in listAccommodations / getAccommodationWithPlace
  place_name: z.string().nullable().optional(),
  place_address: z.string().nullable().optional(),
  place_image: z.string().nullable().optional(),
  place_lat: z.number().nullable().optional(),
  place_lng: z.number().nullable().optional(),
  reservation_title: z.string().nullable().optional(),
});
export type Accommodation = z.infer<typeof accommodationSchema>;

/** Reservation create: title is required; the many optional fields stay open. */
export const reservationCreateRequestSchema = open.and(z.object({ title: z.string().min(1) }));
export type ReservationCreateRequest = z.infer<typeof reservationCreateRequestSchema>;

export const reservationUpdateRequestSchema = open;
export type ReservationUpdateRequest = z.infer<typeof reservationUpdateRequestSchema>;

export const reservationPositionsRequestSchema = z.object({
  positions: z.array(z.object({ id: z.number(), day_plan_position: z.number() })),
  day_id: z.union([z.number(), z.string()]).nullable().optional(),
});
export type ReservationPositionsRequest = z.infer<typeof reservationPositionsRequestSchema>;

export const accommodationCreateRequestSchema = z.object({
  place_id: z.union([z.number(), z.string()]),
  start_day_id: z.union([z.number(), z.string()]),
  end_day_id: z.union([z.number(), z.string()]),
  check_in: z.string().nullable().optional(),
  check_in_end: z.string().nullable().optional(),
  check_out: z.string().nullable().optional(),
  confirmation: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type AccommodationCreateRequest = z.infer<typeof accommodationCreateRequestSchema>;

export const accommodationUpdateRequestSchema = open;
export type AccommodationUpdateRequest = z.infer<typeof accommodationUpdateRequestSchema>;

// ---------------------------------------------------------------------------
// Booking import (KItinerary)
// ---------------------------------------------------------------------------

const bookingImportEndpointSchema = z.object({
  role: z.enum(['from', 'to', 'stop']),
  sequence: z.number(),
  name: z.string(),
  code: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  timezone: z.string().nullable(),
  local_time: z.string().nullable(),
  local_date: z.string().nullable(),
});

const bookingImportVenueSchema = z.object({
  name: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
});

const bookingImportAccommodationSchema = z.object({
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  confirmation: z.string().optional(),
});

export const bookingImportPreviewItemSchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  reservation_time: z.string().nullable().optional(),
  reservation_end_time: z.string().nullable().optional(),
  confirmation_number: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  endpoints: z.array(bookingImportEndpointSchema).optional(),
  needs_review: z.boolean().optional(),
  _venue: bookingImportVenueSchema.optional(),
  _accommodation: bookingImportAccommodationSchema.optional(),
  source: z.object({ fileName: z.string(), index: z.number() }),
});
export type BookingImportPreviewItem = z.infer<typeof bookingImportPreviewItemSchema>;

export const bookingImportPreviewResponseSchema = z.object({
  items: z.array(bookingImportPreviewItemSchema),
  warnings: z.array(z.string()),
});
export type BookingImportPreviewResponse = z.infer<typeof bookingImportPreviewResponseSchema>;

export const bookingImportConfirmRequestSchema = z.object({
  items: z.array(bookingImportPreviewItemSchema).min(1),
});
export type BookingImportConfirmRequest = z.infer<typeof bookingImportConfirmRequestSchema>;

export const bookingImportConfirmResponseSchema = z.object({
  created: z.array(reservationSchema),
});
export type BookingImportConfirmResponse = z.infer<typeof bookingImportConfirmResponseSchema>;
