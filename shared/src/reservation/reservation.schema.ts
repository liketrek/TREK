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
