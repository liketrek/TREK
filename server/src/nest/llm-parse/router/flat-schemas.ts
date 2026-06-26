/**
 * Type-specific FLAT JSON Schemas for the extraction router.
 *
 * The router drives a local model with a small, flat, single-reservation schema and
 * lets Ollama's native `format` parameter constrain sampling to it (grammar-level —
 * see ollama-format.client.ts). Two findings shape this:
 *  - Enforcing the big nested `{reservations:[union of 8 types]}` schema makes small
 *    local models collapse (grammar compliance falls off a cliff on deep schemas), so
 *    we never enforce the monolith — only one flat object at a time.
 *  - A flat schema whose key fields are `required` forces the model to actually fill
 *    flightNumber / from / to / dates instead of leaving them null, which is the single
 *    biggest reliability win for a small model.
 *
 * The flat field names match NUEXTRACT_TEMPLATE so the existing flat→schema.org mapper
 * (`nuExtractToKiReservations`) maps the result straight into the kitinerary pipeline.
 */

export type FlatType = 'flight' | 'train' | 'bus' | 'ferry' | 'car' | 'hotel' | 'restaurant' | 'event';

export const FLAT_TYPES: FlatType[] = ['flight', 'train', 'bus', 'ferry', 'car', 'hotel', 'restaurant', 'event'];

/** A flat reservation as the model emits it, before mapping to schema.org. The named fields
 *  are the ones the router reads directly; the index signature carries the rest unchanged. */
export interface FlatLike {
  type: FlatType;
  booking_reference?: string;
  vehicle_number?: string;
  from_code?: string;
  to_code?: string;
  from_name?: string;
  to_name?: string;
  departure_time?: string;
  arrival_time?: string;
  checkin_time?: string;
  checkout_time?: string;
  [k: string]: unknown;
}

type JsonSchema = Record<string, unknown>;

const STR = { type: 'string' } as const;

/** Build a flat object schema from a field list, marking `required` the ones enforcement must guarantee. */
function flat(fields: string[], required: string[]): JsonSchema {
  const properties: Record<string, typeof STR> = {};
  for (const f of fields) properties[f] = STR;
  return { type: 'object', properties, required };
}

/**
 * One schema per reservation type. `required` names the fields the model MUST emit;
 * everything else is optional. The router knows the type up-front (from the classifier),
 * so the type token itself is not part of the extraction schema — it's set afterwards.
 */
export const FLAT_SCHEMA_BY_TYPE: Record<FlatType, JsonSchema> = {
  flight: flat(
    ['booking_reference', 'operator', 'vehicle_number', 'from_code', 'from_name', 'to_code', 'to_name', 'departure_time', 'arrival_time', 'seat', 'travel_class', 'price', 'currency'],
    // booking_reference (PNR) is REQUIRED: the mapper groups legs into one booking by
    // shared reservationNumber, so a missing PNR would split a round-trip into loose legs.
    // Enforcing it makes the small model actually copy it instead of leaving it null.
    ['vehicle_number', 'from_code', 'to_code', 'departure_time', 'booking_reference'],
  ),
  train: flat(
    ['booking_reference', 'operator', 'vehicle_number', 'from_name', 'to_name', 'departure_time', 'arrival_time', 'seat', 'travel_class', 'platform', 'price', 'currency'],
    ['from_name', 'to_name', 'departure_time'],
  ),
  bus: flat(
    ['booking_reference', 'operator', 'vehicle_number', 'from_name', 'to_name', 'departure_time', 'arrival_time', 'seat', 'price', 'currency'],
    ['from_name', 'to_name', 'departure_time'],
  ),
  ferry: flat(
    ['booking_reference', 'operator', 'name', 'from_name', 'to_name', 'departure_time', 'arrival_time', 'price', 'currency'],
    ['from_name', 'to_name', 'departure_time'],
  ),
  car: flat(
    ['booking_reference', 'operator', 'name', 'from_name', 'to_name', 'departure_time', 'arrival_time', 'price', 'currency'],
    // `operator` (rental company) is REQUIRED so the booking gets a real title instead of the
    // generic "Rental Car" fallback.
    ['operator', 'from_name', 'departure_time', 'arrival_time'],
  ),
  hotel: flat(
    ['name', 'booking_reference', 'address', 'checkin_time', 'checkout_time', 'telephone', 'website', 'price', 'currency'],
    // `address` is REQUIRED so the model actually emits the (often unlabeled) street address line
    // — without it small models skip it and the booking loses its location/place.
    ['name', 'address', 'checkin_time', 'checkout_time'],
  ),
  restaurant: flat(
    ['name', 'booking_reference', 'address', 'start_time', 'end_time', 'telephone', 'website', 'price', 'currency'],
    ['name'],
  ),
  event: flat(
    ['name', 'booking_reference', 'address', 'start_time', 'end_time', 'telephone', 'website', 'price', 'currency'],
    ['name'],
  ),
};

/**
 * All flight legs of a document in ONE shot: a flat array. A capable model (7b) fills
 * every leg reliably in a single call — far faster than one call per leg — and the
 * booking-wide fields (PNR, total price) are recovered deterministically afterwards.
 */
export const FLIGHTS_ARRAY_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    flights: {
      type: 'array',
      items: flat(
        ['vehicle_number', 'operator', 'from_code', 'from_name', 'to_code', 'to_name', 'departure_time', 'arrival_time', 'seat', 'travel_class'],
        ['vehicle_number', 'from_code', 'to_code', 'departure_time'],
      ),
    },
  },
  required: ['flights'],
};

/**
 * Single-reservation fallback when the document type isn't obvious from keywords:
 * one flat object the model fills, choosing the `type` itself. Used on the strong
 * model so the type pick is reliable.
 */
export const UNION_SINGLE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: FLAT_TYPES },
    name: STR, booking_reference: STR, operator: STR, vehicle_number: STR,
    from_name: STR, from_code: STR, to_name: STR, to_code: STR,
    departure_time: STR, arrival_time: STR, address: STR,
    checkin_time: STR, checkout_time: STR, start_time: STR, end_time: STR,
    telephone: STR, website: STR, price: STR, currency: STR,
  },
  required: ['type'],
};
