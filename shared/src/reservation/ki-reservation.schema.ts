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
 *    (OpenAI-compatible `response_format`, Anthropic tool `input_schema`). It
 *    declares every field the prompt names and still lets anything else through,
 *    so a model is steered but never refused for adding a field of its own.
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

/** Coordinates as schema.org `GeoCoordinates`. */
const GEO_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: { latitude: { type: 'number' }, longitude: { type: 'number' } },
} as const;

/** A station, a bus stop or a boat terminal. */
const STOP_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: { name: { type: 'string' }, geo: GEO_JSON_SCHEMA },
} as const;

const AIRPORT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: { iataCode: { type: 'string' }, name: { type: 'string' }, geo: GEO_JSON_SCHEMA },
} as const;

/** A place somebody goes to: an event location, a car pickup or return desk. */
const VENUE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
    address: { type: 'string' },
    geo: GEO_JSON_SCHEMA,
    telephone: { type: 'string' },
    url: { type: 'string' },
  },
} as const;

/**
 * The type-specific payload, one union of what the prompt asks for per `@type`.
 *
 * It used to be an open object with no properties at all, and a provider that
 * decodes against the schema (Gemini through its OpenAI-compatible endpoint)
 * fills declared properties only. It answered with every root field it could
 * see and no `reservationFor`, so a hotel arrived without its name and the
 * mapper had to drop it (#1638, #2477). Each field is optional, since a flight
 * has no venue name and a hotel has no flight number, and nothing is nested
 * deeper than two objects below this one.
 */
const RESERVATION_FOR_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    // The venue itself: lodging, restaurant, event, boat, rental car.
    name: { type: 'string' },
    address: { type: 'string' },
    telephone: { type: 'string' },
    url: { type: 'string' },
    geo: GEO_JSON_SCHEMA,
    // Flight.
    flightNumber: { type: 'string' },
    airline: {
      type: 'object',
      additionalProperties: true,
      properties: { name: { type: 'string' }, iataCode: { type: 'string' } },
    },
    departureAirport: AIRPORT_JSON_SCHEMA,
    arrivalAirport: AIRPORT_JSON_SCHEMA,
    departureTime: { type: 'string' },
    arrivalTime: { type: 'string' },
    // Train, bus and boat.
    trainNumber: { type: 'string' },
    trainName: { type: 'string' },
    departureStation: STOP_JSON_SCHEMA,
    arrivalStation: STOP_JSON_SCHEMA,
    busNumber: { type: 'string' },
    busName: { type: 'string' },
    departureBusStop: STOP_JSON_SCHEMA,
    arrivalBusStop: STOP_JSON_SCHEMA,
    departureBoatTerminal: STOP_JSON_SCHEMA,
    arrivalBoatTerminal: STOP_JSON_SCHEMA,
    // Event and rental car.
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    location: VENUE_JSON_SCHEMA,
    model: { type: 'string' },
    make: { type: 'string' },
    rentalCompany: { type: 'object', additionalProperties: true, properties: { name: { type: 'string' } } },
  },
} as const;

/**
 * JSON Schema for the providers' structured-output entry points. Object root
 * (both OpenAI and Anthropic want an object, not a bare array). `reservationFor`
 * is required and spells out its fields (see above); `additionalProperties`
 * stays open on every object, so a field the prompt does not name still passes.
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
          reservationFor: RESERVATION_FOR_JSON_SCHEMA,
          pickupLocation: VENUE_JSON_SCHEMA,
          dropoffLocation: VENUE_JSON_SCHEMA,
          seat: { type: 'string' },
          class: { type: 'string' },
          platform: { type: 'string' },
          price: { type: ['number', 'string'] },
          priceCurrency: { type: 'string' },
        },
        required: ['@type', 'reservationFor'],
      },
    },
  },
  required: ['reservations'],
} as const;
