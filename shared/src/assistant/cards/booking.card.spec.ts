import {
  BOOKING_CHANGED_FIELDS,
  bookingCardSchema,
  type BookingItem,
  type BookingLeg,
  type BookingStay,
  type BookingTicket,
} from './booking.card';
import { BOOKING_APPLIED_ENTITIES, BOOKING_VERB_KEYS } from './booking.contract';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

const day = { id: 31, number: 1, date: '2026-06-03' };

const LEG: BookingLeg = {
  carrier: 'Lufthansa',
  number: 'LH 400',
  departs: '08:15',
  departsDay: day,
  arrives: '11:05',
  arrivesDay: day,
  minutes: 530,
  seat: '12A',
  platform: null,
};

const TICKET: BookingTicket = {
  shape: 'ticket',
  stops: [
    { name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.57 },
    { name: 'New York', code: 'JFK', lat: 40.64, lng: -73.78 },
  ],
  legs: [LEG],
  minutes: 530,
  mappable: true,
};

const STAY: BookingStay = {
  shape: 'stay',
  accommodationId: 601,
  placeId: 12,
  address: 'Invalidenstraße 38',
  lat: 52.53,
  lng: 13.38,
  photoKey: 'ChIJmercure',
  checkIn: { day, from: '15:00', until: '20:00' },
  checkOut: { day: { id: 33, number: 3, date: '2026-06-05' }, by: '11:00' },
  nights: 2,
};

const ticket: BookingItem = {
  tripId: 4,
  tripTitle: null,
  reservationId: 501,
  type: 'flight',
  title: 'Frankfurt to New York',
  status: 'confirmed',
  needsReview: false,
  hasReference: true,
  price: { amount: 420, currency: 'EUR' },
  travelers: [{ id: 7, name: 'mia', avatarKey: 'mia.png' }],
  moreTravelers: 0,
  changed: [],
  body: TICKET,
};

const stay: BookingItem = {
  ...ticket,
  reservationId: null,
  type: 'hotel',
  status: null,
  body: STAY,
};

const card = (items: unknown[], extra: Record<string, unknown> = {}) => ({
  kind: 'booking',
  change: 'none',
  items,
  more: 0,
  ...extra,
});

describe('bookingCardSchema', () => {
  it('CARDBOOK-001: takes a ticket, a stay and a venue in one card, and the union reads it', () => {
    const body = { shape: 'venue', day, starts: '19:00', ends: null, location: 'Borchardt', placeId: 13 };
    const venue = { ...ticket, body: { ...body, lat: null, lng: null } };
    expect(bookingCardSchema.safeParse(card([ticket, stay, venue])).success).toBe(true);
    expect(trekCardSchema.safeParse(card([ticket], { change: 'update' })).success).toBe(true);
  });

  it('CARDBOOK-002: holds one to eight bookings and counts the rest', () => {
    expect(bookingCardSchema.safeParse(card([])).success).toBe(false);
    expect(bookingCardSchema.safeParse(card(Array.from({ length: 9 }, () => ticket))).success).toBe(false);
    expect(bookingCardSchema.safeParse(card([ticket], { more: -1 })).success).toBe(false);
  });

  it('CARDBOOK-003: refuses a picture address or a coordinate key as photo key, and a clock past 23:59', () => {
    const photo = (photoKey: string) => card([{ ...stay, body: { ...STAY, photoKey } }]);
    expect(bookingCardSchema.safeParse(photo('https://maps.example/x.jpg')).success).toBe(false);
    expect(bookingCardSchema.safeParse(photo('coords:52.5,13.4')).success).toBe(false);
    const late = { ...ticket, body: { ...TICKET, legs: [{ ...LEG, departs: '24:00' }] } };
    expect(bookingCardSchema.safeParse(card([late])).success).toBe(false);
  });

  it('CARDBOOK-004: refuses a ticket without a leg, an unknown shape, a lowercase code and a currency in words', () => {
    expect(bookingCardSchema.safeParse(card([{ ...ticket, body: { ...TICKET, legs: [] } }])).success).toBe(false);
    expect(bookingCardSchema.safeParse(card([{ ...ticket, body: { shape: 'cruise' } }])).success).toBe(false);
    const code = { ...ticket, body: { ...TICKET, stops: [{ name: 'Frankfurt', code: 'fra', lat: null, lng: null }] } };
    expect(bookingCardSchema.safeParse(card([code])).success).toBe(false);
    const words = { ...ticket, price: { amount: 5, currency: 'euro' } };
    expect(bookingCardSchema.safeParse(card([words])).success).toBe(false);
  });

  it('CARDBOOK-005: a changed field must be one the card knows; a broken card reads as none, never the message', () => {
    expect(bookingCardSchema.safeParse(card([{ ...ticket, changed: [...BOOKING_CHANGED_FIELDS] }])).success).toBe(true);
    expect(bookingCardSchema.safeParse(card([{ ...ticket, changed: ['seat'] }])).success).toBe(false);
    expect(storedTrekCardSchema.parse(card([{ ...ticket, title: '' }]))).toBeNull();
  });

  it('CARDBOOK-006: the bookings add their verbs and the stay as an applied entity', () => {
    expect(BOOKING_VERB_KEYS).toEqual(['addStay', 'updateStay', 'updateReservation']);
    expect(BOOKING_APPLIED_ENTITIES).toEqual(['accommodation']);
  });
});
