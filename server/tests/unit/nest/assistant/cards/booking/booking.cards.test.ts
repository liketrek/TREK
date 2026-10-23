/**
 * The booking cards: a ticket, a stay or a venue from every booking read and
 * write, as the planner shows them. The reference never travels, only that
 * one exists; times cross zones only where both ends know theirs.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { CORE_WRITE_TOOLS } from '../../../../../../src/nest/assistant/assistant-tools.constants';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import type { CardAirport, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  TOOL_CARDS,
} from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { MAX_CARD_CHARS, trekCardSchema, type BookingCard, type BookingItem, type TrekCard } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const FLIGHT = {
  id: 501,
  trip_id: 1,
  type: 'flight',
  status: 'confirmed',
  title: 'Frankfurt to New York',
  day_id: 31,
  end_day_id: 31,
  reservation_time: '2026-06-03T08:15',
  reservation_end_time: '2026-06-03T11:05',
  confirmation_number: 'ABC123',
  needs_review: 0,
  metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH 400', seat: '12A', price: '420' }),
  endpoints: [
    {
      role: 'from',
      sequence: 0,
      name: 'Frankfurt',
      code: 'fra',
      lat: 50.03,
      lng: 8.57,
      timezone: 'Europe/Berlin',
      local_time: '08:15',
      local_date: '2026-06-03',
    },
    {
      role: 'to',
      sequence: 1,
      name: 'New York',
      code: 'JFK',
      lat: 40.64,
      lng: -73.78,
      timezone: 'America/New_York',
      local_time: '11:05',
      local_date: '2026-06-03',
    },
  ],
  travelers: [{ user_id: 7, username: 'mia', avatar: 'mia.png', avatar_url: 'https://cdn.example/mia.png' }],
};

const HOTEL = {
  id: 502,
  trip_id: 1,
  type: 'hotel',
  status: 'pending',
  title: 'Mercure stay',
  accommodation_id: '601.0',
  accommodation_place_id: 12,
  accommodation_start_day_id: 31,
  accommodation_end_day_id: 33,
  needs_review: 1,
  metadata: null,
  endpoints: [],
  travelers: [],
};

const DINNER = {
  id: 503,
  trip_id: 1,
  type: 'restaurant',
  status: 'pending',
  title: 'Dinner at Borchardt',
  day_id: 32,
  reservation_time: '2026-06-04T19:00',
  reservation_end_time: '2026-06-04T21:30',
  assignment_id: 301,
  location: null,
  metadata: '{"price":"0"}',
  endpoints: [],
  travelers: [],
};

const STAY = {
  id: 601,
  trip_id: 1,
  place_id: 12,
  start_day_id: 31,
  end_day_id: 33,
  check_in: '15:00',
  check_in_end: '20:00',
  check_out: '11:00',
  confirmation: 'HOTEL-XYZ',
  place_name: 'Mercure Hotel Berlin City',
  place_address: 'Invalidenstraße 38',
  place_image: '/uploads/places/mercure.jpg',
  place_lat: 52.53,
  place_lng: 13.38,
  reservation_title: 'Mercure stay',
};

const SUMMARY = {
  trip: { title: 'Berlin', currency: 'EUR' },
  members: {
    owner: { id: 7, username: 'mia', avatar_url: '/uploads/avatars/mia.png' },
    collaborators: [{ id: 8, username: 'jon', avatar_url: null }],
  },
  days: [
    { id: 31, day_number: 1, date: '2026-06-03', assignments: [], notes: [] },
    {
      id: 32,
      day_number: 2,
      date: '2026-06-04',
      assignments: [{ id: 301, place: { id: 13, name: 'Borchardt', lat: 52.51, lng: 13.39 } }],
      notes: [],
    },
    { id: 33, day_number: 3, date: '2026-06-05', assignments: [], notes: [] },
  ],
  reservations: [FLIGHT, HOTEL, DINNER],
  accommodations: [STAY],
};

const PLACES = {
  places: [
    {
      id: 12,
      name: 'Mercure Hotel Berlin City',
      address: 'Invalidenstraße 38',
      lat: 52.53,
      lng: 13.38,
      google_place_id: 'ChIJmercure',
      image_url: 'https://maps.example/photo.jpg',
    },
    { id: 13, name: 'Borchardt', lat: 52.51, lng: 13.39 },
  ],
};

const card = buildTripCard(1, 7, SUMMARY, PLACES, null);

const AIRPORTS: Record<string, CardAirport> = {
  MUC: { city: 'Munich', lat: 48.35, lng: 11.79, tz: 'Europe/Berlin' },
  LIS: { city: 'Lisbon', lat: 38.77, lng: -9.13, tz: 'Europe/Lisbon' },
};

const ctx: PreviewContext = {
  card,
  categories: new Map([
    [2, 'Food'],
    [5, 'Hotel'],
  ]),
  locale: 'en-GB',
  today: '2026-05-01',
  airport: (code) => AIRPORTS[code] ?? null,
};

/** The card checked against the union, as the registry checks it before it streams. */
function parsed(value: TrekCard | null | undefined): BookingCard {
  const result = trekCardSchema.safeParse(value);
  expect(result.success).toBe(true);
  expect(value?.kind).toBe('booking');
  return value as BookingCard;
}

function answer(tool: string, value: unknown): BookingCard {
  return parsed(answerCardOf(tool, { toolCallId: 'tc-r', args: {}, value, card, today: '2026-05-01' }));
}

function changeCard(tool: string, args: Record<string, unknown>, context: PreviewContext = ctx) {
  const preview = describeToolCall(tool, 'tc-w', args, context);
  return { preview, card: preview.card ?? null };
}

function first(value: BookingCard): BookingItem {
  return value.items[0] as BookingItem;
}

/** Nothing secret or remote anywhere in a card's JSON. */
function expectClean(value: unknown): void {
  const json = JSON.stringify(value);
  for (const secret of ['ABC123', 'HOTEL-XYZ', 'LEG-REF', 'FILE-REF', 'http', '/uploads']) {
    expect(json).not.toContain(secret);
  }
}

describe('booking answer cards', () => {
  it('ASTBOOK-001: a flight is a ticket with codes, times, carrier, seat, price and 8 h 50 across zones', () => {
    const list = answer('list_reservations', { reservations: [FLIGHT, HOTEL, DINNER] });
    expect(list).toMatchObject({ kind: 'booking', change: 'none', more: 0 });
    expect(list.items).toHaveLength(3);
    const flight = first(list);
    expect(flight).toMatchObject({
      reservationId: 501,
      type: 'flight',
      status: 'confirmed',
      hasReference: true,
      price: { amount: 420, currency: 'EUR' },
      travelers: [{ id: 7, name: 'mia', avatarKey: 'mia.png' }],
    });
    expect(flight.body).toMatchObject({
      shape: 'ticket',
      stops: [
        { name: 'Frankfurt', code: 'FRA' },
        { name: 'New York', code: 'JFK' },
      ],
      legs: [
        {
          carrier: 'Lufthansa',
          number: 'LH 400',
          departs: '08:15',
          arrives: '11:05',
          departsDay: { id: 31, number: 1, date: '2026-06-03' },
          minutes: 530,
          seat: '12A',
        },
      ],
      minutes: 530,
      mappable: true,
    });
    expectClean(list);
  });

  it('ASTBOOK-002: a hotel is a stay with its nights, check-in window, check-out and the place photo key', () => {
    const stay = answer('list_reservations', { reservations: [HOTEL] });
    expect(first(stay)).toMatchObject({ type: 'hotel', status: 'pending', needsReview: true, hasReference: true });
    expect(first(stay).body).toEqual({
      shape: 'stay',
      accommodationId: 601,
      placeId: 12,
      address: 'Invalidenstraße 38',
      lat: 52.53,
      lng: 13.38,
      photoKey: 'ChIJmercure',
      checkIn: { day: { id: 31, number: 1, date: '2026-06-03' }, from: '15:00', until: '20:00' },
      checkOut: { day: { id: 33, number: 3, date: '2026-06-05' }, by: '11:00' },
      nights: 2,
    });
    const listed = answer('list_accommodations', { accommodations: [STAY, { ...STAY, reservation_title: 'Twice' }] });
    expect(listed.items).toHaveLength(1);
    expect(first(listed)).toMatchObject({ title: 'Mercure stay', reservationId: 502, status: 'pending' });
    expectClean([stay, listed]);
  });

  it('ASTBOOK-003: a table is a venue on its day with its time range and the planned place', () => {
    const dinner = answer('list_reservations', { reservations: [DINNER] });
    expect(first(dinner)).toMatchObject({ price: null, hasReference: false, needsReview: false });
    expect(first(dinner).body).toEqual({
      shape: 'venue',
      day: { id: 32, number: 2, date: '2026-06-04' },
      starts: '19:00',
      ends: '21:30',
      location: 'Borchardt',
      placeId: 13,
      lat: 52.51,
      lng: 13.39,
    });
  });

  it('ASTBOOK-004: without zones there is no duration; legs line up with the stops or fall back to one', () => {
    const unplaced = (name: string, code: string, sequence: number, time: string) => ({
      role: sequence === 0 ? 'from' : 'to',
      sequence,
      name,
      code,
      local_time: time,
      local_date: '2026-06-03',
    });
    const bare = {
      ...FLIGHT,
      endpoints: [unplaced('Frankfurt', 'FRA', 0, '08:15'), unplaced('New York', 'JFK', 1, '11:05')],
    };
    const noZone = first(answer('list_reservations', { reservations: [bare] }));
    expect(noZone.body).toMatchObject({ minutes: null, mappable: false, legs: [{ minutes: null }] });
    const stop = { role: 'stop', sequence: 1, name: 'Munich', code: 'MUC', lat: 48.35, lng: 11.79 };
    const via = [FLIGHT.endpoints[0], stop, { ...FLIGHT.endpoints[1], sequence: 2 }];
    const legs = [
      { flight_number: 'LH 101', dep_day_id: 31, dep_time: '08:15', arr_day_id: 31, arr_time: '09:10' },
      { flight_number: 'LH 410', dep_day_id: 31, dep_time: '10:30', arr_day_id: 31, arr_time: '13:05' },
    ];
    const twoLegs = { ...FLIGHT, endpoints: via, details: { legs } };
    const multi = first(answer('list_reservations', { reservations: [twoLegs] })).body;
    expect(multi).toMatchObject({
      legs: [
        { number: 'LH 101', departs: '08:15', arrives: '09:10', minutes: 55 },
        { number: 'LH 410', departs: '10:30', arrives: '13:05' },
      ],
    });
    const mismatch = { ...twoLegs, details: { legs: legs.slice(0, 1) } };
    expect(first(answer('list_reservations', { reservations: [mismatch] })).body).toMatchObject({
      legs: [{ departs: '08:15', arrives: '11:05' }],
    });
  });

  it('ASTBOOK-005: a train keeps number, platform and seat; a hire car without a route is one leg', () => {
    const train = {
      ...FLIGHT,
      id: 504,
      type: 'train',
      endpoints: [],
      details: { train_number: 'ICE 597', platform: '7', seat: '41' },
    };
    expect(first(answer('list_reservations', { reservations: [train] })).body).toMatchObject({
      stops: [],
      legs: [{ number: 'ICE 597', platform: '7', seat: '41', departs: '08:15', arrives: '11:05' }],
      mappable: false,
    });
    const car = { id: 505, trip_id: 1, type: 'car', title: 'Hire car', reservation_time: '09:00', endpoints: [] };
    expect(first(answer('list_reservations', { reservations: [car] })).body).toMatchObject({
      legs: [{ departs: '09:00', arrives: null, departsDay: null, carrier: null }],
    });
  });

  it('ASTBOOK-006: a price reads only when it is a positive amount; an odd currency takes the trip one', () => {
    const priced = (metadata: unknown) =>
      first(answer('list_reservations', { reservations: [{ ...DINNER, metadata: JSON.stringify(metadata) }] })).price;
    expect(priced({ price: 'abc' })).toBeNull();
    expect(priced({ price: '0' })).toBeNull();
    expect(priced({ price: 12.5, priceCurrency: 'usd' })).toEqual({ amount: 12.5, currency: 'EUR' });
    expect(priced({ price: '30', priceCurrency: 'CHF' })).toEqual({ amount: 30, currency: 'CHF' });
  });

  it('ASTBOOK-007: an upcoming row of another trip names that trip; a check-in is a stay; no picture travels', () => {
    const upcoming = answer('list_upcoming_reservations', {
      reservations: [
        {
          id: 900,
          trip_id: 2,
          title: 'Night train',
          type: 'train',
          status: 'confirmed',
          reservation_time: '2026-07-01T22:10',
          confirmation_number: 'ABC123',
          trip_title: 'Vienna',
          trip_cover: '/uploads/covers/vienna.jpg',
          day_date: '2026-07-01',
          place_name: null,
          place_image: 'https://maps.example/x.jpg',
        },
        {
          id: 601,
          trip_id: 1,
          title: 'Mercure stay',
          type: 'checkin',
          status: null,
          reservation_time: '15:00',
          trip_title: 'Berlin',
          day_date: '2026-06-03',
          place_name: 'Mercure Hotel Berlin City',
        },
      ],
    });
    const [train, checkIn] = upcoming.items as [BookingItem, BookingItem];
    expect(train).toMatchObject({ tripId: 2, tripTitle: 'Vienna', reservationId: 900, hasReference: true });
    expect(train.body).toMatchObject({ legs: [{ departs: '22:10', departsDay: { id: null, date: '2026-07-01' } }] });
    expect(checkIn).toMatchObject({ tripId: 1, tripTitle: null, type: 'hotel', status: null, reservationId: null });
    expect(checkIn.body).toMatchObject({
      shape: 'stay',
      accommodationId: 601,
      checkIn: { day: { id: 31, date: '2026-06-03' }, from: '15:00' },
      checkOut: null,
    });
    expectClean(upcoming);
  });

  it('ASTBOOK-008: ten bookings show eight and count the rest, well under the card size cap', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...FLIGHT, id: 700 + i }));
    const list = answer('list_reservations', { reservations: many });
    expect(list.items).toHaveLength(8);
    expect(list.more).toBe(2);
    expect(JSON.stringify(list).length).toBeLessThan(MAX_CARD_CHARS);
  });

  it('ASTBOOK-009: a reference kept only on a leg still counts, and a stay reads a review flag stored as true', () => {
    const legRef = {
      ...FLIGHT,
      confirmation_number: null,
      metadata: undefined,
      details: { airline: 'Lufthansa', has_leg_reference: true },
    };
    expect(first(answer('list_reservations', { reservations: [legRef] })).hasReference).toBe(true);
    const flagged = { ...SUMMARY, reservations: [FLIGHT, { ...HOTEL, needs_review: true }, DINNER] };
    const flaggedCard = buildTripCard(1, 7, flagged, PLACES, null);
    const stays = parsed(
      answerCardOf('list_accommodations', {
        toolCallId: 'tc-s',
        args: {},
        value: { accommodations: [STAY] },
        card: flaggedCard,
        today: '2026-05-01',
      }),
    );
    expect(first(stays)).toMatchObject({ reservationId: 502, needsReview: true });
  });
});

describe('booking change cards', () => {
  it('ASTBOOK-010: a transport places code-only stops at their airports and names its own action', () => {
    const { preview, card: drawn } = changeCard('create_transport', {
      type: 'flight',
      title: 'Munich to Lisbon',
      start_day_id: 32,
      endpoints: [
        { role: 'from', sequence: 0, name: 'Munich', code: 'MUC', local_time: '07:00' },
        { role: 'to', sequence: 1, name: 'Lisbon', code: 'LIS', local_time: '09:10' },
      ],
      confirmation_number: 'ABC123',
      price: 99,
    });
    expect(preview).toMatchObject({ verbKey: 'addReservation', tool: 'create_transport', subject: 'Munich to Lisbon' });
    const item = first(parsed(drawn));
    expect(parsed(drawn).change).toBe('create');
    expect(item).toMatchObject({ status: 'pending', reservationId: null, hasReference: true, price: { amount: 99 } });
    expect(item.body).toMatchObject({
      stops: [
        { code: 'MUC', lat: 48.35, lng: 11.79 },
        { code: 'LIS', lat: 38.77, lng: -9.13 },
      ],
      legs: [{ departs: '07:00', arrives: '09:10', departsDay: { id: 32 }, minutes: 190 }],
      mappable: false,
    });
    const unknown = changeCard('create_transport', {
      type: 'flight',
      title: 'Somewhere',
      endpoints: [
        { role: 'from', sequence: 0, name: 'Nowhere', code: 'ZZZ' },
        { role: 'to', sequence: 1, name: 'Lisbon', code: 'LIS' },
      ],
    });
    expect(first(parsed(unknown.card)).body).toMatchObject({ stops: [{ lat: null, lng: null }, { lat: 38.77 }] });
    expectClean([preview, drawn]);
  });

  it('ASTBOOK-011: a hotel booking with a place and both days draws the stay and puts it on its check-in day', () => {
    const { preview, card: drawn } = changeCard('create_reservation', {
      title: 'Mercure',
      type: 'hotel',
      place_id: 12,
      start_day_id: 31,
      end_day_id: 33,
      check_in: '15:00',
      check_out: '11:00',
    });
    expect(preview.effect).toEqual({
      kind: 'add',
      dayId: 31,
      fromDayId: null,
      placeId: 12,
      assignmentId: null,
      place: null,
    });
    expect(first(parsed(drawn)).body).toMatchObject({
      shape: 'stay',
      placeId: 12,
      photoKey: 'ChIJmercure',
      checkIn: { day: { id: 31 }, from: '15:00' },
      checkOut: { day: { id: 33 }, by: '11:00' },
      nights: 2,
    });
    const table = changeCard('create_reservation', { title: 'Table', type: 'restaurant', assignment_id: 301 });
    expect(table.preview.effect).toBeNull();
    expect(first(parsed(table.card)).body).toMatchObject({ shape: 'venue', placeId: 13, location: 'Borchardt' });
  });

  it('ASTBOOK-012: an update marks only the fields whose card value changes; an unknown booking draws none', () => {
    const { preview, card: drawn } = changeCard('update_reservation', { reservationId: 503, status: 'confirmed' });
    expect(preview).toMatchObject({ verbKey: 'updateReservation', tool: 'update_reservation' });
    expect(preview.rows).toEqual([
      { op: 'change', labelKey: 'field', field: 'status', before: 'pending', after: 'confirmed' },
    ]);
    expect(parsed(drawn)).toMatchObject({ change: 'update' });
    expect(first(parsed(drawn))).toMatchObject({ status: 'confirmed', changed: ['status'] });
    const same = changeCard('update_reservation', { reservationId: 503, title: 'Dinner at Borchardt' });
    expect(first(parsed(same.card)).changed).toEqual([]);
    const moved = changeCard('update_transport', {
      reservationId: 501,
      endpoints: [FLIGHT.endpoints[0], { role: 'to', sequence: 1, name: 'Lisbon', code: 'LIS' }],
    });
    expect(first(parsed(moved.card)).changed).toEqual(expect.arrayContaining(['route']));
    expect(first(parsed(moved.card)).changed).not.toContain('status');
    expect(changeCard('update_reservation', { reservationId: 999, status: 'confirmed' }).card).toBeNull();
  });

  it('ASTBOOK-013: a removal draws the booking as it is; new travellers leave out who is not on the trip', () => {
    expect(parsed(changeCard('delete_transport', { reservationId: 501 }).card)).toMatchObject({ change: 'remove' });
    expect(parsed(changeCard('delete_accommodation', { accommodationId: 601 }).card).change).toBe('remove');
    const { preview, card: drawn } = changeCard('set_reservation_travelers', { reservationId: 503, user_ids: [8, 99] });
    expect(preview).toMatchObject({ verbKey: 'updateReservation', tool: 'set_reservation_travelers' });
    expect(first(parsed(drawn))).toMatchObject({
      travelers: [{ id: 8, name: 'jon', avatarKey: null }],
      changed: ['travelers'],
    });
  });

  it('ASTBOOK-014: a stay names its verb, shows its place and lands on its check-in day', () => {
    const { preview, card: drawn } = changeCard('create_accommodation', {
      place_id: 12,
      start_day_id: 31,
      end_day_id: 32,
      check_in: '14:00',
      confirmation: 'HOTEL-XYZ',
    });
    expect(preview).toMatchObject({ verbKey: 'addStay', tool: 'create_accommodation', undoable: true });
    expect(preview.effect).toMatchObject({ kind: 'add', dayId: 31, placeId: 12 });
    expect(first(parsed(drawn))).toMatchObject({
      title: 'Mercure Hotel Berlin City',
      status: null,
      hasReference: true,
    });
    expect(changeCard('create_accommodation', { place_id: 404, start_day_id: 31, end_day_id: 32 }).card).toBeNull();
    const added = changeCard('create_place_accommodation', {
      name: 'Hotel Adlon',
      address: 'Unter den Linden 77',
      lat: 52.516,
      lng: 13.38,
      google_place_id: 'ChIJadlon',
      start_day_id: 32,
      end_day_id: 33,
      price: 840,
      currency: 'eur',
    });
    expect(added.preview.verbKey).toBe('addStay');
    expect(added.preview.effect).toMatchObject({
      kind: 'add',
      dayId: 32,
      place: { name: 'Hotel Adlon', lat: 52.516, lng: 13.38, categoryId: 5 },
    });
    expect(first(parsed(added.card))).toMatchObject({ price: { amount: 840, currency: 'EUR' } });
    expect(first(parsed(added.card)).body).toMatchObject({ placeId: null, photoKey: 'ChIJadlon', nights: 1 });
    // Without a position there is no pin, so no stop is previewed on the day.
    const unplaced = changeCard('create_place_accommodation', { name: 'Somewhere', start_day_id: 32, end_day_id: 33 });
    expect(unplaced.preview.effect).toBeNull();
  });

  it('ASTBOOK-015: moving a stay to another check-in day moves its stop; linking a hotel marks the stay', () => {
    const { preview, card: drawn } = changeCard('update_accommodation', { accommodationId: 601, start_day_id: 32 });
    expect(preview).toMatchObject({ verbKey: 'updateStay', subject: 'Mercure Hotel Berlin City' });
    expect(preview.effect).toMatchObject({ kind: 'move', dayId: 32, fromDayId: 31, placeId: 12 });
    expect(first(parsed(drawn)).changed).toContain('stay');
    const linked = changeCard('link_hotel_accommodation', {
      reservationId: 502,
      place_id: 12,
      start_day_id: 31,
      end_day_id: 32,
      check_in: '16:00',
    });
    expect(linked.preview).toMatchObject({ verbKey: 'updateStay', tool: 'link_hotel_accommodation' });
    expect(first(parsed(linked.card)).changed).toEqual(expect.arrayContaining(['stay', 'checkIn']));
  });

  it('ASTBOOK-016: a booking read from a file is drawn with its stay nights by date and no reference', () => {
    const { preview, card: drawn } = changeCard('import_booking', {
      type: 'hotel',
      title: 'Mercure Hotel Berlin City',
      confirmation_number: 'FILE-REF',
      _accommodation: { check_in: '2026-06-03T15:00', check_out: '2026-06-05T11:00', confirmation: 'FILE-REF' },
      _venue: { name: 'Mercure', address: 'Invalidenstraße 38', lat: 52.53, lng: 13.38 },
      source: { fileName: 'mercure.pdf', index: 0 },
    });
    expect(preview.verbKey).toBe('importBooking');
    expect(first(parsed(drawn))).toMatchObject({ hasReference: true, status: null });
    expect(first(parsed(drawn)).body).toMatchObject({
      checkIn: { day: { id: 31 }, from: '15:00' },
      checkOut: { day: { id: 33 }, by: '11:00' },
      nights: 2,
      lat: 52.53,
    });
    expect(JSON.stringify(drawn)).not.toContain('FILE-REF');
    // Applied, the import answers the id alone: the card is the preview's, saved under that id.
    const slim = { reservation: { id: 502, title: 'Mercure Hotel Berlin City', type: 'hotel', day_id: null } };
    const saved = parsed(appliedCardOf('import_booking', { args: {}, result: slim, preview }));
    expect(saved.change).toBe('none');
    expect(first(saved)).toMatchObject({ reservationId: 502, hasReference: true, changed: [] });
    expect(first(saved).body).toMatchObject({
      checkIn: { day: { id: 31 }, from: '15:00' },
      checkOut: { day: { id: 33 }, by: '11:00' },
      nights: 2,
    });
    expect(appliedCardOf('import_booking', { args: {}, result: 'Not added.', preview })).toBeNull();
  });

  it('ASTBOOK-018: an applied flight from a file keeps its route, times and price, and can show it on the map', () => {
    const args = {
      type: 'flight',
      title: 'Frankfurt to New York',
      reservation_time: '2026-06-03T08:15',
      reservation_end_time: '2026-06-03T11:05',
      confirmation_number: 'FILE-REF',
      metadata: { airline: 'Lufthansa', flight_number: 'LH 400', price: '420' },
      endpoints: FLIGHT.endpoints,
      source: { fileName: 'lh400.pdf', index: 0 },
    };
    const { preview, card: drawn } = changeCard('import_booking', args);
    expect(first(parsed(drawn)).body).toMatchObject({ mappable: false });
    const slim = { reservation: { id: 520, title: args.title, type: 'flight', day_id: 31 } };
    const saved = first(parsed(appliedCardOf('import_booking', { args: {}, result: slim, preview })));
    expect(saved).toMatchObject({ reservationId: 520, hasReference: true, price: { amount: 420, currency: 'EUR' } });
    expect(saved.body).toMatchObject({
      stops: [{ code: 'FRA' }, { code: 'JFK' }],
      legs: [{ departs: '08:15', arrives: '11:05', carrier: 'Lufthansa' }],
      minutes: 530,
      mappable: true,
    });
    expectClean(saved);
  });

  it('ASTBOOK-019: a hotel changed into another type reads as that type, not as the stay it still links', () => {
    const { card: drawn } = changeCard('update_reservation', { reservationId: 502, type: 'restaurant' });
    const item = first(parsed(drawn));
    expect(item.body.shape).toBe('venue');
    expect(item.changed).toEqual(expect.arrayContaining(['type']));
    const preview = describeToolCall('update_reservation', 'tc-w', { reservationId: 502, type: 'restaurant' }, ctx);
    const result = { reservation: { ...HOTEL, type: 'restaurant' } };
    const saved = parsed(appliedCardOf('update_reservation', { args: {}, result, preview }));
    expect(first(saved).body.shape).toBe('venue');
  });

  it('ASTBOOK-017: every curated booking write describes empty arguments with its own verb', () => {
    for (const tool of [
      'create_transport',
      'update_reservation',
      'update_transport',
      'set_reservation_travelers',
      'link_hotel_accommodation',
      'create_accommodation',
      'create_place_accommodation',
      'update_accommodation',
    ]) {
      expect(changeCard(tool, {}).preview.verbKey, tool).toBe(ASSISTANT_WRITE_TOOLS[tool].verbKey);
    }
  });

  it('ASTBOOK-034: a new booking and a booking from a file are described here, the core keeps no words of them', () => {
    expect(CORE_WRITE_TOOLS.create_reservation).toBeUndefined();
    expect(ASSISTANT_WRITE_TOOLS.create_reservation).toEqual({ verbKey: 'addReservation', entity: 'reservation' });
    expect(TOOL_CARDS.create_reservation?.describe).toBeDefined();
    // A booking from a file keeps the verb of the changes the server proposes itself.
    expect(TOOL_CARDS.import_booking?.describe).toBeDefined();
    expect(TOOL_CARDS.import_booking?.write).toBeUndefined();
    const { preview } = changeCard('create_reservation', {
      title: 'Mercure',
      type: 'hotel',
      place_id: 12,
      start_day_id: 31,
      end_day_id: 33,
      confirmation_number: 'ABC123',
      price: 0,
    });
    expect(preview).toMatchObject({ verbKey: 'addReservation', subject: 'Mercure', dayId: 31, placeIds: [12] });
    expect(preview.tool).toBeUndefined();
    expect(Object.fromEntries(preview.rows.map((row) => [row.labelKey, row.after]))).toEqual({
      type: 'hotel',
      stay: 'Mercure Hotel Berlin City, Wed 3 Jun → Fri 5 Jun',
      confirmation: 'ABC123',
      price: '€0.00',
    });
    // A bare date from a file reads as the day it names; a price that is no number shows none.
    const file = changeCard('import_booking', {
      type: 'train',
      title: 'ICE to Hamburg',
      reservation_time: '2026-06-04',
      endpoints: [
        { role: 'from', sequence: 0, name: 'Berlin Hbf' },
        { role: 'to', sequence: 1, name: 'Hamburg Hbf', code: 'Hamburg Hbf' },
      ],
      metadata: { price: 'free' },
      source: { fileName: 'ice.pdf', index: 0 },
    }).preview;
    expect(file).toMatchObject({ verbKey: 'importBooking', subject: 'ICE to Hamburg', dayId: 32, undoable: false });
    expect(Object.fromEntries(file.rows.map((row) => [row.labelKey, row.after]))).toEqual({
      type: 'train',
      route: 'Berlin Hbf → Hamburg Hbf',
      day: 'Thu 4 Jun',
      time: 'Thu 4 Jun',
    });
  });
});

describe('applied booking cards and receipts', () => {
  const previewOf = (tool: string, args: Record<string, unknown>) => describeToolCall(tool, 'tc-w', args, ctx);

  it('ASTBOOK-020: an applied booking is the saved row, its days named from the preview', () => {
    const args = { type: 'flight', title: 'Frankfurt to New York', start_day_id: 31, endpoints: FLIGHT.endpoints };
    const preview = previewOf('create_transport', args);
    const saved = parsed(appliedCardOf('create_transport', { args, result: { reservation: FLIGHT }, preview }));
    expect(saved.change).toBe('none');
    expect(first(saved)).toMatchObject({ reservationId: 501, status: 'confirmed', hasReference: true });
    expect(first(saved).body).toMatchObject({ mappable: true, legs: [{ departsDay: { id: 31, number: 1 } }] });
    expectClean(saved);
    expect(appliedCardOf('create_transport', { args, result: 'Transport not found.', preview })).toBeNull();
  });

  it('ASTBOOK-021: an applied stay keeps the times and photo the preview showed; travellers are replaced', () => {
    const args = {
      name: 'Hotel Adlon',
      google_place_id: 'ChIJadlon',
      start_day_id: 32,
      end_day_id: 33,
      check_in: '15:00',
      price: 840,
      currency: 'EUR',
    };
    const preview = previewOf('create_place_accommodation', args);
    const result = {
      place: {
        id: 77,
        name: 'Hotel Adlon',
        google_place_id: 'ChIJadlon',
        lat: 52.516,
        lng: 13.38,
        price: 840,
        currency: 'EUR',
      },
      accommodation: { id: 602, trip_id: 1, place_id: 77, start_day_id: 32, end_day_id: 33, check_in: null },
      assignment: { id: 9 },
    };
    const saved = parsed(appliedCardOf('create_place_accommodation', { args, result, preview }));
    // The price lives on the place the stay was created with.
    expect(first(saved).price).toEqual({ amount: 840, currency: 'EUR' });
    expect(first(saved).body).toMatchObject({
      accommodationId: 602,
      placeId: 77,
      photoKey: 'ChIJadlon',
      checkIn: { day: { id: 32, number: 2 }, from: '15:00' },
    });
    const travelers = previewOf('set_reservation_travelers', { reservationId: 503, user_ids: [8] });
    const set = parsed(
      appliedCardOf('set_reservation_travelers', {
        args: {},
        result: { travelers: [{ user_id: 7, username: 'mia', avatar: null }] },
        preview: travelers,
      }),
    );
    expect(first(set).travelers).toEqual([{ id: 7, name: 'mia', avatarKey: null }]);
  });

  it('ASTBOOK-022: a stay write files its receipt under the stay, a travellers write under the booking', () => {
    const result = { accommodation: { id: 601 }, assignment: { id: 9 }, place: { id: 12 } };
    expect(appliedChange('create_place_accommodation', 'tc-1', {}, result, 31, null)).toMatchObject({
      entity: 'accommodation',
      ids: [601],
    });
    expect(appliedChange('update_accommodation', 'tc-2', { accommodationId: 601 }, result, null, null)).toMatchObject({
      entity: 'accommodation',
      ids: [601],
    });
    expect(appliedChange('set_reservation_travelers', 'tc-3', { reservationId: 503 }, {}, null, null)).toMatchObject({
      entity: 'reservation',
      ids: [503],
    });
    expect(appliedChange('create_transport', 'tc-4', {}, { reservation: FLIGHT }, null, null)).toMatchObject({
      entity: 'reservation',
      ids: [501],
      dayId: 31,
    });
  });
});

describe('booking undo, naming and prompt', () => {
  const snapshot = (summary: Record<string, unknown> = SUMMARY, places: unknown = PLACES) => ({ summary, places });

  it('ASTBOOK-030: a created booking or stay is taken back by its own removal', () => {
    expect(ASSISTANT_UNDO_MAP.create_reservation.args({}, { reservation: { id: 503 } }, null)).toEqual({
      reservationId: 503,
    });
    expect(ASSISTANT_UNDO_MAP.create_transport.tool).toBe('delete_transport');
    expect(ASSISTANT_UNDO_MAP.create_accommodation.args({}, { accommodation: { id: 601 } }, null)).toEqual({
      accommodationId: 601,
    });
    expect(ASSISTANT_UNDO_MAP.create_place_accommodation.args({}, { place: { id: 12 } }, null)).toEqual({
      placeId: 12,
    });
    expect(ASSISTANT_UNDO_MAP.create_accommodation.args({}, 'Failed.', null)).toBeNull();
  });

  it('ASTBOOK-031: an undo holds while the booking or stay is as created, and stops once it changed', () => {
    expect(unchangedSinceApplied('create_reservation', { reservation: DINNER }, snapshot())).toBe(true);
    const confirmed = { ...SUMMARY, reservations: [FLIGHT, HOTEL, { ...DINNER, status: 'confirmed' }] };
    expect(unchangedSinceApplied('create_reservation', { reservation: DINNER }, snapshot(confirmed))).toBe(false);
    expect(unchangedSinceApplied('create_accommodation', { accommodation: STAY }, snapshot())).toBe(true);
    const later = { ...SUMMARY, accommodations: [{ ...STAY, check_in: '18:00' }] };
    expect(unchangedSinceApplied('create_accommodation', { accommodation: STAY }, snapshot(later))).toBe(false);
  });

  it('ASTBOOK-032: a place created with its stay can go while only that stay and its booking use it', () => {
    const place = { id: 12, name: 'Mercure Hotel Berlin City', lat: 52.53, lng: 13.38 };
    const result = { place, accommodation: STAY, assignment: { id: 301 } };
    expect(unchangedSinceApplied('create_place_accommodation', result, snapshot())).toBe(true);
    const booked = { ...SUMMARY, reservations: [...SUMMARY.reservations, { id: 510, place_id: 12, title: 'Spa' }] };
    expect(unchangedSinceApplied('create_place_accommodation', result, snapshot(booked))).toBe(false);
    const planned = {
      ...SUMMARY,
      days: [{ id: 33, day_number: 3, assignments: [{ id: 302, day_id: 33, place_id: 12 }] }],
    };
    expect(unchangedSinceApplied('create_place_accommodation', result, snapshot(planned))).toBe(false);
  });

  it('ASTBOOK-033: a generic stay removal names the stay; the prompt tells the model to leave the cards alone', () => {
    const preview = describeToolCall('delete_accommodation', 'tc-9', { accommodationId: 601 }, ctx);
    expect(JSON.stringify(preview.rows)).toContain('Mercure Hotel Berlin City');
    expect(CARD_PROMPT_LINES.some((line) => line.includes('list_reservations'))).toBe(true);
    expect(CARD_PROMPT_LINES.some((line) => line.includes('create_place_accommodation'))).toBe(true);
  });
});
