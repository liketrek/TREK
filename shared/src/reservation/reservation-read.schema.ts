import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * The trip reads of the bookings an assistant makes over MCP. `get_trip_summary`
 * carries every booking with its metadata, which the provider never sees (a
 * flight number or a seat lives there); these two answer the bookings and the
 * stays alone, with the readable details pulled out of the metadata.
 */

/** What a booking is, as a filter: getting there (a flight, a train, a hire car) or anything booked on the way. */
export const RESERVATION_READ_KINDS = ['transport', 'booking'] as const;
export type ReservationReadKind = (typeof RESERVATION_READ_KINDS)[number];

/** `list_reservations`: the trip's bookings, of one kind or both, on one day or all of them. */
export const listReservationsRequestSchema = z.object({
  tripId: idSchema,
  kinds: z
    .array(z.enum(RESERVATION_READ_KINDS))
    .min(1)
    .max(RESERVATION_READ_KINDS.length)
    .optional()
    .describe(
      'Only these kinds: "transport" (flights, trains, hire cars and other rides) or "booking" (hotels, tables, tickets). Both when left out.',
    ),
  dayId: idSchema
    .optional()
    .describe(
      'Only the bookings on this day: those that start or end on it, a stopover leg on it, or a stay checking in on it.',
    ),
});
export type ListReservationsRequest = z.infer<typeof listReservationsRequestSchema>;

/** `list_accommodations`: where the trip sleeps, stay by stay. */
export const listAccommodationsRequestSchema = z.object({ tripId: idSchema });
export type ListAccommodationsRequest = z.infer<typeof listAccommodationsRequestSchema>;
