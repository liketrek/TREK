import type { AssistantApplied, BookingCard, BookingItem, BookingTicket } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { daysLater, isChanged, itemsOf, layoversOf, stopsOf, toneOfItem } from './bookingCardModel';
import { BOOKING_LOOK, bookingSpotOf, bookingTarget } from './bookingLook';

/**
 * FE-AI-BOOKLOOK-001 to FE-AI-BOOKLOOK-009
 *
 * The pure side of the booking cards: what an applied booking or stay opens,
 * where it sits on the map, which entity a card is about, the ticket
 * arithmetic (stops, stopovers, a later arrival) the card draws from, and
 * when confirming is offered as a follow-up.
 */

const day = (id: number | null, number: number | null, date: string | null) => ({ id, number, date });

const TICKET: BookingTicket = {
  shape: 'ticket',
  stops: [
    { name: 'Frankfurt', code: 'FRA', lat: 50, lng: 8 },
    { name: 'Munich', code: 'MUC', lat: 48, lng: 11 },
    { name: 'New York', code: 'JFK', lat: 40, lng: -73 },
  ],
  legs: [
    {
      carrier: null,
      number: 'LH 101',
      departs: '23:10',
      departsDay: day(31, 1, '2026-06-03'),
      arrives: '23:55',
      arrivesDay: day(31, 1, '2026-06-03'),
      minutes: 45,
      seat: null,
      platform: null,
    },
    {
      carrier: null,
      number: 'LH 410',
      departs: '01:05',
      departsDay: day(32, 2, '2026-06-04'),
      arrives: '05:00',
      arrivesDay: day(32, 2, '2026-06-04'),
      minutes: null,
      seat: null,
      platform: null,
    },
  ],
  minutes: null,
  mappable: true,
};

const BASE: Omit<BookingItem, 'body'> = {
  tripId: 4,
  tripTitle: null,
  reservationId: 501,
  type: 'flight',
  title: 'Frankfurt to New York',
  status: 'pending',
  needsReview: false,
  hasReference: false,
  price: null,
  travelers: [],
  moreTravelers: 0,
  changed: ['time'],
};

const FLIGHT: BookingItem = { ...BASE, body: TICKET };
const STAY: BookingItem = {
  ...BASE,
  reservationId: null,
  type: 'hotel',
  body: {
    shape: 'stay',
    accommodationId: 601,
    placeId: 12,
    address: null,
    lat: null,
    lng: null,
    photoKey: null,
    checkIn: { day: day(31, 1, '2026-06-03'), from: null, until: null },
    checkOut: null,
    nights: null,
  },
};

const card = (items: BookingItem[], change: BookingCard['change'] = 'none'): BookingCard => ({
  kind: 'booking',
  change,
  items,
  more: 0,
});

const applied = (entity: AssistantApplied['entity'], ids: number[]): AssistantApplied => ({
  toolCallId: 'tc-1',
  entity,
  ids,
  dayId: 33,
  undoUntil: null,
});

describe('booking look', () => {
  it('FE-AI-BOOKLOOK-001: an applied booking opens in its tab; one of another trip opens that trip', () => {
    const open = BOOKING_LOOK.entities.reservation.open;
    expect(open(applied('reservation', [501]), card([FLIGHT]))).toEqual({
      kind: 'tab',
      tab: 'transports',
      params: { booking: '501' },
    });
    expect(bookingTarget({ ...FLIGHT, type: 'restaurant', tripId: 9, tripTitle: 'Vienna' }, 7)).toEqual({
      kind: 'page',
      path: '/trips/9?tab=buchungen&booking=7',
    });
    expect(open(applied('reservation', [501]), null)).toBeNull();
  });

  it('FE-AI-BOOKLOOK-002: on the map a ticket shows its day, a stay its place, no card the day', () => {
    const onMap = BOOKING_LOOK.entities.reservation.onMap;
    expect(onMap(applied('reservation', [501]), card([FLIGHT]))).toEqual({ placeId: null, dayId: 31 });
    expect(onMap(applied('reservation', [502]), card([STAY]))).toEqual({ placeId: 12, dayId: null });
    expect(onMap(applied('reservation', [502]), null)).toEqual({ placeId: null, dayId: 33 });
    expect(bookingSpotOf({ ...FLIGHT, tripTitle: 'Vienna' })).toBeNull();
  });

  it('FE-AI-BOOKLOOK-003: an applied stay shows its place and opens on its check-in day', () => {
    const look = BOOKING_LOOK.entities.accommodation;
    expect(look.onMap(applied('accommodation', [601]), card([STAY]))).toEqual({ placeId: 12, dayId: null });
    expect(look.open(applied('accommodation', [601]), card([STAY]))).toEqual({
      kind: 'map',
      placeId: null,
      dayId: 31,
    });
    expect(look.open(applied('accommodation', [601]), null)).toEqual({ kind: 'map', placeId: null, dayId: 33 });
  });

  it('FE-AI-BOOKLOOK-004: a lone stay is a stay, anything else the booking; confirming needs edit rights', () => {
    const look = BOOKING_LOOK.cards.booking;
    expect(look.entity(card([STAY]))).toBe('accommodation');
    expect(look.entity(card([{ ...STAY, reservationId: 502 }]))).toBe('reservation');
    expect(look.entity(card([FLIGHT]))).toBe('reservation');
    expect(look.followUps.find((followUp) => followUp.id === 'bookingsConfirm')?.edits).toBe(true);
  });

  it('FE-AI-BOOKLOOK-005: a ticket counts stops, stopovers across midnight and a later arrival', () => {
    expect(stopsOf(TICKET)).toBe(1);
    expect(stopsOf({ ...TICKET, stops: [], legs: TICKET.legs.slice(0, 1) })).toBeNull();
    expect(layoversOf(TICKET)).toEqual([{ place: 'MUC', minutes: 70 }]);
    expect(layoversOf({ ...TICKET, stops: TICKET.stops.slice(0, 2) })).toEqual([]);
    expect(daysLater(day(31, 1, '2026-06-03'), day(32, 2, '2026-06-04'))).toBe(1);
    expect(daysLater(day(null, 1, null), day(null, 3, null))).toBe(2);
    expect(daysLater(day(31, 1, '2026-06-03'), day(31, 1, '2026-06-03'))).toBeNull();
  });

  it('FE-AI-BOOKLOOK-006: only an update marks what it changes', () => {
    expect(isChanged(card([FLIGHT], 'update'), FLIGHT, 'time')).toBe(true);
    expect(isChanged(card([FLIGHT], 'update'), FLIGHT, 'status')).toBe(false);
    expect(isChanged(card([FLIGHT], 'create'), FLIGHT, 'time')).toBe(false);
  });

  it("FE-AI-BOOKLOOK-007: an answer's booking cards read as one list with what they left out counted", () => {
    const entries = [
      { toolCallId: 'a', card: { ...card([FLIGHT]), more: 2 } },
      { toolCallId: 'b', card: card([STAY]) },
    ];
    expect(itemsOf(entries)).toEqual({ items: [FLIGHT, STAY], more: 2 });
  });

  it("FE-AI-BOOKLOOK-008: the dot takes the planner's tones: transit info, confirmed green, the rest amber", () => {
    expect(toneOfItem({ type: 'transit', status: null })).toBe('transit');
    expect(toneOfItem({ type: 'flight', status: 'confirmed' })).toBe('confirmed');
    expect(toneOfItem({ type: 'flight', status: 'pending' })).toBe('pending');
    expect(toneOfItem({ type: 'restaurant', status: 'cancelled' })).toBe('pending');
    expect(toneOfItem({ type: 'hotel', status: null })).toBeNull();
  });

  it('FE-AI-BOOKLOOK-009: confirming is offered only beside a booking of this trip that waits for it', () => {
    const when = BOOKING_LOOK.cards.booking.followUps.find((followUp) => followUp.id === 'bookingsConfirm')?.when;
    expect(when?.(card([FLIGHT]))).toBe(true);
    expect(
      when?.(
        card([
          { ...FLIGHT, status: 'confirmed' },
          { ...STAY, status: null },
        ])
      )
    ).toBe(false);
    expect(when?.(card([{ ...FLIGHT, tripId: 9, tripTitle: 'Vienna' }]))).toBe(false);
  });
});
