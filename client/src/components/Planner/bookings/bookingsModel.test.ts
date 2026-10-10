// FE-PLANNER-BKMODEL-001 to FE-PLANNER-BKMODEL-043
import { describe, it, expect } from 'vitest';
import { Plane, TramFront, FileText, Hotel } from 'lucide-react';
import { buildAssignment, buildDay, buildPlace, buildReservation } from '../../../../tests/helpers/factories';
import type { Day, Reservation, ReservationEndpoint } from '../../../types';
import {
  BOOKING_TYPE_COLOR,
  TRANSPORT_TYPE_COLOR,
  TYPE_ORDER,
  applyFilters,
  buildAssignmentLookup,
  costsFor,
  daySpan,
  displayTitle,
  groupReservations,
  groupTransports,
  onTravelers,
  parseMeta,
  phaseOf,
  searchText,
  sortReservations,
  startKey,
  typeInfo,
  type BookingFilters,
  type GroupLabels,
} from './bookingsModel';

const label = (type: string) => `L:${type}`;

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Somewhere', code: null, lat: 1, lng: 1, timezone: null, local_time: null, local_date: null, ...over };
}

function filters(over: Partial<BookingFilters> = {}): BookingFilters {
  return { types: new Set(), status: 'all', travelers: new Set(), query: '', ...over };
}

const labels: GroupLabels = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  transit: 'Transit',
  before: 'Before the trip',
  after: 'After the trip',
  undated: 'No date',
  dayN: n => `Day ${n}`,
  typeLabel: t => `Type ${t}`,
  dayDate: d => `on ${d}`,
};

const d1 = buildDay({ id: 501, day_number: 1, date: '2025-06-01', title: 'Arrival' });
const d2 = buildDay({ id: 502, day_number: 2, date: '2025-06-02', title: null });
const d3 = buildDay({ id: 503, day_number: 3, date: '2025-06-03', title: 'Hike' });
const days: Day[] = [d1, d2, d3];

describe('typeInfo', () => {
  it('FE-PLANNER-BKMODEL-001: a known type gets its icon, label key and the phone colour', () => {
    const info = typeInfo('flight');
    expect(info.Icon).toBe(Plane);
    expect(info.labelKey).toBe('reservations.type.flight');
    expect(info.chipKey).toBe('reservations.type.flight');
    expect(info.color).toBe('#3b82f6');
  });

  it('FE-PLANNER-BKMODEL-002: transit carries a shorter chip label than its full name', () => {
    const info = typeInfo('transit');
    expect(info.Icon).toBe(TramFront);
    expect(info.labelKey).toBe('reservations.type.transit');
    expect(info.chipKey).toBe('reservations.typeShort.transit');
  });

  it('FE-PLANNER-BKMODEL-003: a booking type takes its colour from the bookings palette', () => {
    const info = typeInfo('hotel');
    expect(info.Icon).toBe(Hotel);
    expect(info.color).toBe('#8b5cf6');
  });

  it('FE-PLANNER-BKMODEL-004: an unknown type reads as "other"', () => {
    const info = typeInfo('spaceship');
    expect(info.Icon).toBe(FileText);
    expect(info.labelKey).toBe('reservations.type.other');
    expect(info.chipKey).toBe('reservations.type.other');
    expect(info.color).toBe('#6b7280');
  });

  it('FE-PLANNER-BKMODEL-005: every type in the pill order resolves to itself', () => {
    for (const type of TYPE_ORDER) expect(typeInfo(type).labelKey).toBe(`reservations.type.${type}`);
  });
});

describe('parseMeta', () => {
  it('FE-PLANNER-BKMODEL-006: reads plain and double-encoded metadata, and nothing from garbage', () => {
    expect(parseMeta(buildReservation({ metadata: '{"airline":"LH"}' }))).toEqual({ airline: 'LH' });
    expect(parseMeta(buildReservation({ metadata: JSON.stringify('{"seat":"12A"}') }))).toEqual({ seat: '12A' });
    expect(parseMeta(buildReservation({ metadata: 'not json' }))).toEqual({});
    expect(parseMeta(buildReservation({ metadata: null }))).toEqual({});
  });
});

describe('buildAssignmentLookup', () => {
  it('FE-PLANNER-BKMODEL-007: names each assignment by its day, place and times', () => {
    const place = buildPlace({ name: 'Louvre', place_time: '10:00', end_time: '12:00' });
    const a = buildAssignment({ id: 9001, day_id: d1.id, place });
    const lookup = buildAssignmentLookup(days, { [String(d1.id)]: [a] });
    expect(lookup[9001]).toEqual({ dayNumber: 1, dayTitle: 'Arrival', dayDate: '2025-06-01', placeName: 'Louvre', startTime: '10:00', endTime: '12:00' });
  });

  it('FE-PLANNER-BKMODEL-008: skips assignments without a place and survives missing inputs', () => {
    const a = buildAssignment({ id: 9002, day_id: d2.id });
    const orphan = { ...buildAssignment({ id: 9003, day_id: d2.id }), place: undefined } as unknown as typeof a;
    const lookup = buildAssignmentLookup(days, { [String(d2.id)]: [orphan, a] });
    expect(Object.keys(lookup)).toEqual(['9002']);
    expect(lookup[9002].dayTitle).toBeNull();
    expect(lookup[9002].startTime).toBeNull();
    expect(buildAssignmentLookup(days, undefined)).toEqual({});
    expect(buildAssignmentLookup(undefined as unknown as Day[], {})).toEqual({});
  });

  it('FE-PLANNER-BKMODEL-009: a day without a date or title leaves both null', () => {
    const bare = buildDay({ id: 504, day_number: 4, date: null, title: undefined });
    const a = buildAssignment({ id: 9004, day_id: 504 });
    expect(buildAssignmentLookup([bare], { '504': [a] })[9004]).toMatchObject({ dayDate: null, dayTitle: null });
  });
});

describe('daySpan and startKey', () => {
  it('FE-PLANNER-BKMODEL-010: a hotel reads its range from the accommodation', () => {
    const r = buildReservation({ type: 'hotel', day_id: d1.id, accommodation_start_day_id: d2.id, accommodation_end_day_id: d3.id });
    expect(daySpan(r, days)).toEqual({ start: d2, end: d3 });
  });

  it('FE-PLANNER-BKMODEL-011: anything else reads its own day and end day', () => {
    const r = buildReservation({ type: 'train', day_id: d1.id, end_day_id: d2.id });
    expect(daySpan(r, days)).toEqual({ start: d1, end: d2 });
    expect(daySpan(buildReservation({ type: 'hotel', day_id: d3.id }), days)).toEqual({ start: d3, end: undefined });
  });

  it('FE-PLANNER-BKMODEL-012: startKey uses the booking date and time', () => {
    expect(startKey(buildReservation({ reservation_time: '2025-06-02T14:30' }), days)).toBe('2025-06-02T14:30');
  });

  it('FE-PLANNER-BKMODEL-013: a time without a date takes the linked day, a hotel its first stay day', () => {
    expect(startKey(buildReservation({ reservation_time: '08:15', day_id: d2.id }), days)).toBe('2025-06-02T08:15');
    expect(startKey(buildReservation({ type: 'hotel', accommodation_start_day_id: d3.id, day_id: d1.id }), days)).toBe('2025-06-03T00:00');
    expect(startKey(buildReservation({ type: 'hotel', day_id: d1.id }), days)).toBe('2025-06-01T00:00');
  });

  it('FE-PLANNER-BKMODEL-014: without any date there is no key', () => {
    expect(startKey(buildReservation({ reservation_time: null }), days)).toBeNull();
    expect(startKey(buildReservation({ day_id: 99999 }), days)).toBeNull();
  });
});

describe('phaseOf', () => {
  it('FE-PLANNER-BKMODEL-015: places a key before, during or after the trip', () => {
    expect(phaseOf(null, '2025-06-01', '2025-06-03')).toBe('undated');
    expect(phaseOf('2025-05-30T10:00', '2025-06-01', '2025-06-03')).toBe('before');
    expect(phaseOf('2025-06-04T10:00', '2025-06-01', '2025-06-03')).toBe('after');
    expect(phaseOf('2025-06-02T10:00', '2025-06-01', '2025-06-03')).toBe('during');
    expect(phaseOf('1999-01-01T00:00', null, null)).toBe('during');
  });
});

describe('searchText and applyFilters', () => {
  const flight = buildReservation({
    id: 7001,
    type: 'flight',
    title: 'To Tokyo',
    status: 'confirmed',
    confirmation_number: 'ABC123',
    metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH716', legs: [{ confirmation_number: 'LEG9', flight_number: 'NH1' }] }),
    endpoints: [ep({ name: 'Frankfurt', code: 'FRA' }), ep({ role: 'to', sequence: 1, name: 'Haneda', code: 'HND' })],
    travelers: [{ user_id: 11, username: 'Maria' }],
  });
  const dinner = buildReservation({ id: 7002, type: 'restaurant', title: 'Dinner', status: 'pending', location: 'Gion', travelers: [{ user_id: 12, username: 'Ken' }] });
  const ride = buildReservation({ id: 7003, type: 'transit', title: 'Metro', status: 'pending' });
  const list = [flight, dinner, ride];

  it('FE-PLANNER-BKMODEL-016: search text holds title, type label, codes, carrier, legs and travelers in lower case', () => {
    const text = searchText(flight, 'Flight');
    for (const word of ['to tokyo', 'flight', 'abc123', 'lufthansa', 'lh716', 'fra', 'haneda', 'leg9', 'nh1', 'maria']) {
      expect(text).toContain(word);
    }
  });

  it('FE-PLANNER-BKMODEL-017: search text ignores metadata legs that are not a list', () => {
    const r = buildReservation({ title: 'Bus', metadata: JSON.stringify({ legs: 'nope' }) });
    expect(searchText(r, 'Bus')).toBe('bus bus');
  });

  it('FE-PLANNER-BKMODEL-018: with no filter every booking stays', () => {
    expect(applyFilters(list, filters(), label)).toEqual(list);
  });

  it('FE-PLANNER-BKMODEL-019: the type filter keeps only the picked types', () => {
    expect(applyFilters(list, filters({ types: new Set(['restaurant']) }), label)).toEqual([dinner]);
  });

  it('FE-PLANNER-BKMODEL-020: a status filter leaves transit out, pending keeps everything unconfirmed', () => {
    expect(applyFilters(list, filters({ status: 'confirmed' }), label)).toEqual([flight]);
    expect(applyFilters(list, filters({ status: 'pending' }), label)).toEqual([dinner]);
  });

  it('FE-PLANNER-BKMODEL-021: the traveler filter keeps bookings for one of the picked people', () => {
    expect(applyFilters(list, filters({ travelers: new Set([12]) }), label)).toEqual([dinner]);
  });

  it('FE-PLANNER-BKMODEL-022: the query matches case-insensitively, the type label included', () => {
    expect(applyFilters(list, filters({ query: '  GION ' }), label)).toEqual([dinner]);
    expect(applyFilters(list, filters({ query: 'l:transit' }), label)).toEqual([ride]);
  });
});

describe('sortReservations', () => {
  const early = buildReservation({ id: 7101, title: 'Bravo', type: 'train', status: 'pending', reservation_time: '2025-06-01T09:00', created_at: '2025-01-02' });
  const late = buildReservation({ id: 7102, title: 'Alpha', type: 'flight', status: 'confirmed', reservation_time: '2025-06-03T09:00', created_at: '2025-01-01' });
  const undatedA = buildReservation({ id: 7103, title: 'Charlie', type: 'transit', status: 'pending', created_at: '2025-01-01' });
  const undatedB = buildReservation({ id: 7104, title: 'Delta', type: 'bus', status: 'confirmed', created_at: '2025-01-05' });
  const sameTime = buildReservation({ id: 7105, title: 'Echo', type: 'bus', status: 'confirmed', reservation_time: '2025-06-01T09:00', created_at: '2025-01-01' });
  const ids = (list: Reservation[]) => list.map(r => r.id);

  it('FE-PLANNER-BKMODEL-023: by date: chronological, creation order on a tie, undated last', () => {
    expect(ids(sortReservations([undatedB, late, undatedA, early, sameTime], days, 'date', 'asc', label))).toEqual([7105, 7101, 7102, 7103, 7104]);
  });

  it('FE-PLANNER-BKMODEL-024: by date descending keeps the undated entries at the bottom', () => {
    expect(ids(sortReservations([undatedB, early, undatedA, late], days, 'date', 'desc', label))).toEqual([7102, 7101, 7103, 7104]);
  });

  it('FE-PLANNER-BKMODEL-025: by title in both directions', () => {
    expect(ids(sortReservations([early, late, undatedA], days, 'title', 'asc', label))).toEqual([7102, 7101, 7103]);
    expect(ids(sortReservations([early, late, undatedA], days, 'title', 'desc', label))).toEqual([7103, 7101, 7102]);
  });

  it('FE-PLANNER-BKMODEL-026: by type uses the translated label and falls back to date on a tie', () => {
    expect(ids(sortReservations([undatedB, sameTime, late], days, 'type', 'asc', label))).toEqual([7105, 7104, 7102]);
  });

  it('FE-PLANNER-BKMODEL-027: by status puts confirmed first and transit last while it is apart', () => {
    expect(ids(sortReservations([undatedA, early, late], days, 'status', 'asc', label))).toEqual([7102, 7101, 7103]);
  });

  it('FE-PLANNER-BKMODEL-028: with transit not apart it sorts as if confirmed', () => {
    expect(ids(sortReservations([early, undatedA, late], days, 'status', 'asc', label, false))).toEqual([7102, 7103, 7101]);
  });

  it('FE-PLANNER-BKMODEL-029: a missing creation date still sorts', () => {
    const a = buildReservation({ id: 7106, created_at: undefined });
    const b = buildReservation({ id: 7107, created_at: '2025-01-01' });
    expect(ids(sortReservations([b, a], days, 'date', 'asc', label))).toEqual([7106, 7107]);
  });
});

describe('groupReservations', () => {
  const confirmed = buildReservation({ id: 7201, type: 'train', status: 'confirmed', day_id: d1.id });
  const pending = buildReservation({ id: 7202, type: 'restaurant', status: 'pending', day_id: d2.id });
  const transit = buildReservation({ id: 7203, type: 'transit', status: 'pending', day_id: d2.id });
  const sorted = [confirmed, pending, transit];

  it('FE-PLANNER-BKMODEL-030: none puts everything in one unnamed group', () => {
    expect(groupReservations(sorted, 'none', days, null, null, labels)).toEqual([{ id: 'all', label: '', items: sorted }]);
  });

  it('FE-PLANNER-BKMODEL-031: by status: confirmed, pending, transit, empty groups dropped', () => {
    const groups = groupReservations(sorted, 'status', days, null, null, labels);
    expect(groups.map(g => [g.id, g.label, g.items.map(r => r.id)])).toEqual([
      ['confirmed', 'Confirmed', [7201]],
      ['pending', 'Pending', [7202]],
      ['transit', 'Transit', [7203]],
    ]);
    expect(groupReservations([pending], 'status', days, null, null, labels).map(g => g.id)).toEqual(['pending']);
  });

  it('FE-PLANNER-BKMODEL-032: by status without transit apart, transit sits among the confirmed', () => {
    const groups = groupReservations(sorted, 'status', days, null, null, labels, false);
    expect(groups.map(g => [g.id, g.items.map(r => r.id)])).toEqual([
      ['confirmed', [7201, 7203]],
      ['pending', [7202]],
    ]);
  });

  it('FE-PLANNER-BKMODEL-033: by type keeps the order types first appear in', () => {
    const groups = groupReservations([pending, confirmed, buildReservation({ id: 7204, type: 'restaurant' })], 'type', days, null, null, labels);
    expect(groups.map(g => [g.id, g.label, g.items.map(r => r.id)])).toEqual([
      ['type-restaurant', 'Type restaurant', [7202, 7204]],
      ['type-train', 'Type train', [7201]],
    ]);
  });

  it('FE-PLANNER-BKMODEL-034: by day: the day with its date and title, then after the trip, then undated', () => {
    const before = buildReservation({ id: 7205, reservation_time: '2025-05-20T10:00' });
    const after = buildReservation({ id: 7206, reservation_time: '2025-07-01T10:00' });
    const undated = buildReservation({ id: 7207 });
    const groups = groupReservations([undated, after, confirmed, pending, before], 'day', days, '2025-06-01', '2025-06-03', labels);
    expect(groups.map(g => [g.id, g.label, g.sub, g.items.map(r => r.id)])).toEqual([
      ['before', 'Before the trip', undefined, [7205]],
      ['day-501', 'Day 1', 'on 2025-06-01  Arrival', [7201]],
      ['day-502', 'Day 2', 'on 2025-06-02', [7202]],
      ['after', 'After the trip', undefined, [7206]],
      ['undated', 'No date', undefined, [7207]],
    ]);
  });

  it('FE-PLANNER-BKMODEL-035: by day finds the day from the date, or groups by the bare date when no day matches', () => {
    const onDay = buildReservation({ id: 7208, reservation_time: '2025-06-03T08:00' });
    const offDays = buildReservation({ id: 7209, reservation_time: '2025-06-10T08:00' });
    const groups = groupReservations([onDay, offDays], 'day', days, null, null, labels);
    expect(groups.map(g => [g.id, g.label, g.sub])).toEqual([
      ['day-503', 'Day 3', 'on 2025-06-03  Hike'],
      ['date-2025-06-10', 'on 2025-06-10', undefined],
    ]);
  });

  it('FE-PLANNER-BKMODEL-036: a day without date or title has no second part', () => {
    const bare = buildDay({ id: 505, day_number: 5, date: null, title: null });
    const r = buildReservation({ id: 7210, day_id: 505, reservation_time: '2025-06-02T10:00' });
    expect(groupReservations([r], 'day', [bare], null, null, labels)[0]).toMatchObject({ id: 'day-505', label: 'Day 5', sub: undefined });
  });
});

describe('costsFor', () => {
  it('FE-PLANNER-BKMODEL-037: sums the linked expenses per currency and never across currencies', () => {
    const items = [
      { reservation_id: 1, total_price: 10.1, currency: 'eur' },
      { reservation_id: 1, total_price: 0.2, currency: 'EUR' },
      { reservation_id: 1, total_price: 5, currency: 'USD' },
      { reservation_id: 2, total_price: 99, currency: 'EUR' },
      { reservation_id: 1, total_price: 1, currency: null },
    ];
    expect(costsFor(1, items, 'jpy')).toEqual([
      { currency: 'EUR', amount: 10.3 },
      { currency: 'USD', amount: 5 },
      { currency: 'JPY', amount: 1 },
    ]);
  });

  it('FE-PLANNER-BKMODEL-038: without any currency it falls back to EUR, and nothing linked is an empty list', () => {
    expect(costsFor(3, [{ reservation_id: 3, total_price: 4 }], '')).toEqual([{ currency: 'EUR', amount: 4 }]);
    expect(costsFor(4, [{ reservation_id: 3, total_price: 4 }], 'EUR')).toEqual([]);
  });
});

describe('displayTitle', () => {
  it('FE-PLANNER-BKMODEL-039: a title wins; without one the route in sequence order, codes before names', () => {
    expect(displayTitle(buildReservation({ title: 'Named' }))).toBe('Named');
    const r = buildReservation({
      title: '  ',
      endpoints: [ep({ role: 'to', sequence: 2, name: 'Kyoto', code: null }), ep({ role: 'from', sequence: 1, name: 'Tokyo', code: 'TYO' })],
    });
    expect(displayTitle(r)).toBe('TYO → Kyoto');
  });

  it('FE-PLANNER-BKMODEL-040: without a route the place, then the location, then nothing', () => {
    expect(displayTitle(buildReservation({ title: '', place_name: 'Hotel Sakura', location: 'Kyoto' }))).toBe('Hotel Sakura');
    expect(displayTitle(buildReservation({ title: '', location: 'Kyoto', endpoints: [ep({})] }))).toBe('Kyoto');
    expect(displayTitle(buildReservation({ title: '' }))).toBe('');
  });
});

describe('onTravelers and the shared type colours', () => {
  it('FE-PLANNER-BKMODEL-041: with nobody chosen every booking passes, otherwise one chosen traveller has to be on it', () => {
    const shared = buildReservation({ travelers: [{ user_id: 1, username: 'ann' }, { user_id: 2, username: 'bob' }] } as Partial<Reservation>);
    const nobody = buildReservation({ travelers: undefined });
    expect(onTravelers(shared, new Set())).toBe(true);
    expect(onTravelers(nobody, new Set())).toBe(true);
    expect(onTravelers(shared, new Set([2, 9]))).toBe(true);
    expect(onTravelers(shared, new Set([9]))).toBe(false);
    expect(onTravelers(nobody, new Set([1]))).toBe(false);
  });

  it('FE-PLANNER-BKMODEL-042: the type colours are the ones the type info and the phone tabs paint with', () => {
    expect(BOOKING_TYPE_COLOR.hotel).toBe('#8b5cf6');
    expect(BOOKING_TYPE_COLOR.parking).toBe('#2563eb');
    expect(TRANSPORT_TYPE_COLOR.cable_car).toBe('#dc2626');
    expect(typeInfo('hotel').color).toBe(BOOKING_TYPE_COLOR.hotel);
    expect(typeInfo('ferry').color).toBe(TRANSPORT_TYPE_COLOR.ferry);
  });

  it('FE-PLANNER-BKMODEL-043: groupTransports orders like the date sort and splits confirmed, pending and transit', () => {
    const transit = buildReservation({ id: 1, type: 'transit', status: 'pending', reservation_time: '2025-06-01T07:00' });
    const later = buildReservation({ id: 2, type: 'train', status: 'confirmed', reservation_time: '2025-06-02T09:00' });
    const sooner = buildReservation({ id: 3, type: 'bus', status: 'confirmed', reservation_time: '2025-06-01T09:00' });
    const open = buildReservation({ id: 4, type: 'car', status: 'pending', reservation_time: null, day_id: null });
    const groups = groupTransports([later, transit, open, sooner], days);
    expect(groups.confirmed.map(r => r.id)).toEqual([3, 2]);
    expect(groups.pending.map(r => r.id)).toEqual([4]);
    expect(groups.transit.map(r => r.id)).toEqual([1]);
    expect(sortReservations([later, transit, open, sooner], days, 'date', 'asc', label).map(r => r.id)).toEqual([1, 3, 2, 4]);
  });
});
