import { idSchema } from '../../common/primitives.schema';
import { RESERVATION_STATUSES } from '../../reservation/reservation-types';
import {
  cardClockSchema,
  cardCountSchema,
  cardDaySchema,
  cardLatSchema,
  cardLngSchema,
  cardMoneySchema,
  cardPersonSchema,
  cardPhotoKeySchema,
  cardText,
} from './card-parts';

import { z } from 'zod';

/**
 * Bookings in the assistant chat: a flight, a train, a hire car (a ticket), a
 * hotel or any stay (a stay), a table, a show, a tour or a car park (a
 * venue). One card per tool call holds the bookings it is about, at most
 * eight, with the rest counted; an e-ticket file with a flight, a hotel and a
 * flight back stays one itinerary. A booking's reference never travels, only
 * that it has one: the chat is stored and can be shared, and the planner
 * blurs it too.
 */

/** The type column is free text: any short key passes, the client draws an unknown one as `other`. */
const bookingTypeSchema = z.string().regex(/^[a-z_]{1,30}$/);

const lat = cardLatSchema.nullable();
const lng = cardLngSchema.nullable();

/** One end or stop of a route: the airport or station, its code where it has one. */
const bookingStopSchema = z.object({
  name: cardText(80),
  code: z
    .string()
    .regex(/^[A-Z0-9]{2,5}$/)
    .nullable(),
  lat,
  lng,
});

/** One segment; a stopover's arrival lives only here (a stop's endpoint carries the onward departure). */
const bookingLegSchema = z.object({
  carrier: cardText(60).nullable(),
  number: cardText(20).nullable(),
  departs: cardClockSchema.nullable(),
  departsDay: cardDaySchema.nullable(),
  arrives: cardClockSchema.nullable(),
  arrivesDay: cardDaySchema.nullable(),
  /** Only when both ends know their zone. */
  minutes: z.number().int().min(1).max(10_080).nullable(),
  seat: cardText(20).nullable(),
  platform: cardText(20).nullable(),
});

const ticketBodySchema = z.object({
  shape: z.literal('ticket'),
  /** From, the stops, to; empty when no route is known (a hire car, a taxi). */
  stops: z.array(bookingStopSchema).max(9),
  /** One per segment between the stops, else exactly one. */
  legs: z.array(bookingLegSchema).min(1).max(8),
  /** First departure to last arrival. */
  minutes: z.number().int().min(1).max(20_160).nullable(),
  /** A saved booking with two stops that have coordinates: the plan can draw it. */
  mappable: z.boolean(),
});

const stayBodySchema = z.object({
  shape: z.literal('stay'),
  /** Null while a create or a new place waits. */
  accommodationId: idSchema.nullable(),
  placeId: idSchema.nullable(),
  address: cardText(200).nullable(),
  lat,
  lng,
  /** A Google place id for TREK's photo proxy; never a picture address. */
  photoKey: cardPhotoKeySchema.nullable(),
  checkIn: z
    .object({ day: cardDaySchema, from: cardClockSchema.nullable(), until: cardClockSchema.nullable() })
    .nullable(),
  checkOut: z.object({ day: cardDaySchema, by: cardClockSchema.nullable() }).nullable(),
  nights: z.number().int().min(0).max(366).nullable(),
});

const venueBodySchema = z.object({
  shape: z.literal('venue'),
  day: cardDaySchema.nullable(),
  starts: cardClockSchema.nullable(),
  ends: cardClockSchema.nullable(),
  /** The location text, else the linked place's name. */
  location: cardText(200).nullable(),
  placeId: idSchema.nullable(),
  lat,
  lng,
});

/** What an update changes, as the card shows it (its derived values, not the raw arguments). */
export const BOOKING_CHANGED_FIELDS = [
  'title',
  'type',
  'status',
  'day',
  'time',
  'route',
  'stay',
  'checkIn',
  'checkOut',
  'location',
  'price',
  'travelers',
  'reference',
] as const;
export type BookingChangedField = (typeof BOOKING_CHANGED_FIELDS)[number];

export const bookingItemSchema = z.object({
  tripId: idSchema,
  /** Only on a row of another trip (the upcoming bookings across every trip). */
  tripTitle: cardText(120).nullable(),
  reservationId: idSchema.nullable(),
  type: bookingTypeSchema,
  title: cardText(200),
  /** Null for a transit journey, a bare stay, or a status not known. */
  status: z.enum(RESERVATION_STATUSES).nullable(),
  needsReview: z.boolean(),
  /** A confirmation number exists; the number itself never travels. */
  hasReference: z.boolean(),
  price: cardMoneySchema.nullable(),
  travelers: z.array(cardPersonSchema).max(8),
  moreTravelers: z.number().int().min(0).max(500),
  changed: z.array(z.enum(BOOKING_CHANGED_FIELDS)).max(BOOKING_CHANGED_FIELDS.length),
  body: z.discriminatedUnion('shape', [ticketBodySchema, stayBodySchema, venueBodySchema]),
});
export type BookingItem = z.infer<typeof bookingItemSchema>;
export type BookingBody = BookingItem['body'];
export type BookingTicket = Extract<BookingBody, { shape: 'ticket' }>;
export type BookingStay = Extract<BookingBody, { shape: 'stay' }>;
export type BookingVenue = Extract<BookingBody, { shape: 'venue' }>;
export type BookingLeg = BookingTicket['legs'][number];
export type BookingStop = BookingTicket['stops'][number];

/** What a held write does to its bookings; `none` on an answer and on an applied change. */
export const BOOKING_CHANGES = ['none', 'create', 'update', 'remove'] as const;

export const bookingCardSchema = z.object({
  kind: z.literal('booking'),
  change: z.enum(BOOKING_CHANGES),
  items: z.array(bookingItemSchema).min(1).max(8),
  /** Bookings the answer held past the eight shown. */
  more: cardCountSchema,
});
export type BookingCard = z.infer<typeof bookingCardSchema>;
