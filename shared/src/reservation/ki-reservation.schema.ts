import { z } from 'zod';

/**
 * schema.org-style reservation JSON-LD — the shape the kitinerary binary emits
 * and the shape we ask an LLM fallback to produce, so both feed the SAME
 * `mapReservations()` mapper (server/src/nest/booking-import/kitinerary-mapper.ts).
 *
 * Two artifacts live here:
 *  - `kiReservationArraySchema` — a *lenient* Zod schema used server-side to
 *    validate/repair an LLM response before mapping. The mapper already tolerates
 *    missing fields, so validation only guarantees each node is an object with a
 *    string `@type`; everything else passes through untouched.
 *  - `KI_RESERVATION_JSON_SCHEMA` — the JSON Schema handed to the LLM providers
 *    (OpenAI-compatible `response_format`, Anthropic tool `input_schema`). It is
 *    descriptive guidance, kept deliberately permissive on `reservationFor` so the
 *    model can include type-specific fields; the prompt names the exact fields.
 */

/** The `@type` values `mapReservations()` recognises (its switch + flight grouping). */
export const KI_RESERVATION_TYPES = [
  'FlightReservation',
  'TrainReservation',
  'BusReservation',
  'BoatReservation',
  'LodgingReservation',
  'FoodEstablishmentReservation',
  'RentalCarReservation',
  'EventReservation',
  'TouristAttractionVisit',
] as const;

/** Lenient validator: require a string `@type`, allow any other keys through. */
export const kiReservationSchema = z.object({ '@type': z.string() }).catchall(z.unknown());
export type KiReservationDto = z.infer<typeof kiReservationSchema>;

/** Top-level wrapper the providers return: `{ reservations: KiReservation[] }`. */
export const kiReservationArraySchema = z.object({
  reservations: z.array(kiReservationSchema),
});
export type KiReservationArrayDto = z.infer<typeof kiReservationArraySchema>;

/**
 * JSON Schema for the providers' structured-output entry points. Object root
 * (both OpenAI and Anthropic want an object, not a bare array). `reservationFor`
 * is intentionally open (`additionalProperties: true`) so the model can fill the
 * type-specific sub-object; the prompt enumerates the field names per `@type`.
 */
export const KI_RESERVATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reservations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          '@type': { type: 'string', enum: [...KI_RESERVATION_TYPES] },
          reservationNumber: { type: 'string' },
          // Hotel check-in/out, car pickup/dropoff, event/restaurant start/end —
          // plain ISO 8601 strings (no KDE QDateTime wrapper).
          checkinTime: { type: 'string' },
          checkoutTime: { type: 'string' },
          pickupTime: { type: 'string' },
          dropoffTime: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          // Type-specific payload (Flight/Train/Lodging/…): open object.
          reservationFor: { type: 'object', additionalProperties: true },
          pickupLocation: { type: 'object', additionalProperties: true },
          dropoffLocation: { type: 'object', additionalProperties: true },
          seat: { type: 'string' },
          class: { type: 'string' },
          platform: { type: 'string' },
          price: { type: ['number', 'string'] },
          priceCurrency: { type: 'string' },
        },
        required: ['@type'],
      },
    },
  },
  required: ['reservations'],
} as const;
