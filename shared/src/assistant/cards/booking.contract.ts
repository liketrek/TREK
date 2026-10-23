import { bookingCardSchema } from './booking.card';

export * from './booking.card';

/**
 * What the bookings bring to the assistant chat: the kinds of card they draw,
 * the verbs of their change cards and what an applied change of theirs
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const BOOKING_CARD_SCHEMAS = [bookingCardSchema] as const;
/** addReservation and importBooking sit in the core list already. */
export const BOOKING_VERB_KEYS = ['addStay', 'updateStay', 'updateReservation'] as const;
/** 'reservation' is a core entity already; a stay is its own row. */
export const BOOKING_APPLIED_ENTITIES = ['accommodation'] as const;
