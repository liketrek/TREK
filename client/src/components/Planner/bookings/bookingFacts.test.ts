// FE-PLANNER-BKFACTS-001 to FE-PLANNER-BKFACTS-020
import { describe, it, expect } from 'vitest';
import { buildDay, buildReservation } from '../../../../tests/helpers/factories';
import type { ReservationEndpoint } from '../../../types';
import { bookingFacts, formatDay, type FactsContext } from './bookingFacts';

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Stop', code: null, lat: 1, lng: 1, timezone: null, local_time: null, local_date: null, ...over };
}

const t: FactsContext['t'] = (key, params) => (params && 'n' in params ? `${key}#${params.n}` : key);

const d1 = buildDay({ id: 701, day_number: 1, date: '2025-06-01', title: 'Arrival' });
const d2 = buildDay({ id: 702, day_number: 2, date: '2025-06-02', title: null });
const d3 = buildDay({ id: 703, day_number: 3, date: null, title: null });

function ctx(over: Partial<FactsContext> = {}): FactsContext {
  return { t, locale: 'en-US', timeFormat: '24h', days: [d1, d2, d3], assignmentLookup: {}, tripCurrency: 'EUR', hasLinkedCost: false, ...over };
}

const cell = (facts: ReturnType<typeof bookingFacts>, label: string) => facts.cells.find(c => c.label === label)?.value;

describe('formatDay', () => {
  it('FE-PLANNER-BKFACTS-001: prints a date with or without its weekday, in UTC', () => {
    expect(formatDay('2025-06-02', 'en-US')).toBe('Mon, Jun 2');
    expect(formatDay('2025-06-02', 'en-US', false)).toBe('Jun 2');
  });
});

describe('bookingFacts: day', () => {
  it('FE-PLANNER-BKFACTS-002: one linked day gives its title and the date with a weekday', () => {
    const f = bookingFacts(buildReservation({ day_id: 701 }), ctx());
    expect(f.day).toEqual({ label: 'Arrival', date: 'Sun, Jun 1', range: false });
  });

  it('FE-PLANNER-BKFACTS-003: a day range names both days and both dates without weekdays', () => {
    const f = bookingFacts(buildReservation({ day_id: 701, end_day_id: 702 }), ctx());
    expect(f.day).toEqual({ label: 'Arrival → dayplan.dayN#2', date: 'Jun 1 → Jun 2', range: true });
  });

  it('FE-PLANNER-BKFACTS-004: a day without a date has no date beside it', () => {
    const f = bookingFacts(buildReservation({ day_id: 703, end_day_id: 703 }), ctx());
    expect(f.day).toEqual({ label: 'dayplan.dayN#3', date: null, range: false });
  });

  it('FE-PLANNER-BKFACTS-005: without a day the booking dates stand in, a range when they differ', () => {
    expect(bookingFacts(buildReservation({ reservation_time: '2025-06-02T10:00' }), ctx()).day)
      .toEqual({ label: 'Mon, Jun 2', date: null, range: false });
    expect(bookingFacts(buildReservation({ reservation_time: '2025-06-02T10:00', reservation_end_time: '2025-06-04T10:00' }), ctx()).day)
      .toEqual({ label: 'Mon, Jun 2 → Wed, Jun 4', date: null, range: true });
    expect(bookingFacts(buildReservation({ reservation_time: '2025-06-02T10:00', reservation_end_time: '2025-06-02T12:00' }), ctx()).day?.range).toBe(false);
  });

  it('FE-PLANNER-BKFACTS-006: without day or date there is no day', () => {
    expect(bookingFacts(buildReservation({}), ctx()).day).toBeNull();
  });

  it('FE-PLANNER-BKFACTS-007: a hotel takes its range from the accommodation', () => {
    const f = bookingFacts(buildReservation({ type: 'hotel', accommodation_start_day_id: 701, accommodation_end_day_id: 702 }), ctx());
    expect(f.day?.label).toBe('Arrival → dayplan.dayN#2');
    expect(f.isHotel).toBe(true);
  });
});

describe('bookingFacts: time', () => {
  it('FE-PLANNER-BKFACTS-008: start and end time with an arrow', () => {
    const f = bookingFacts(buildReservation({ reservation_time: '2025-06-01T09:05', reservation_end_time: '2025-06-01T11:30' }), ctx());
    expect(f.time).toBe('09:05 → 11:30');
    expect(f.startTime).toBe('09:05');
    expect(f.endTime).toBe('11:30');
  });

  it('FE-PLANNER-BKFACTS-009: follows the 12 hour setting', () => {
    const f = bookingFacts(buildReservation({ reservation_time: '2025-06-01T15:00' }), ctx({ timeFormat: '12h' }));
    expect(f.time).toMatch(/^3:00\s?PM$/);
  });

  it('FE-PLANNER-BKFACTS-010: only an end time still reads as one', () => {
    const f = bookingFacts(buildReservation({ reservation_end_time: '2025-06-01T11:30' }), ctx());
    expect(f.time).toBe('→ 11:30');
  });

  it('FE-PLANNER-BKFACTS-011: the endpoints\' local times stand in for a transport', () => {
    const r = buildReservation({
      type: 'flight',
      endpoints: [ep({ role: 'from', sequence: 0, local_time: '07:10', local_date: '2025-06-01' }), ep({ role: 'to', sequence: 1, local_time: '09:40', local_date: '2025-06-02' })],
    });
    const f = bookingFacts(r, ctx());
    expect(f.time).toBe('07:10 → 09:40');
    expect(f.startDate).toBe('2025-06-01');
    expect(f.endDate).toBe('2025-06-02');
    expect(f.endpoints).toHaveLength(2);
  });

  it('FE-PLANNER-BKFACTS-012: a stay backed by an accommodation shows no time of its own', () => {
    const r = buildReservation({ type: 'hotel', reservation_time: '2025-06-01T15:00', accommodation_start_day_id: 701 });
    expect(bookingFacts(r, ctx()).time).toBeNull();
  });

  it('FE-PLANNER-BKFACTS-013: without times nothing is shown and the dates fall back to the days', () => {
    const f = bookingFacts(buildReservation({ day_id: 701, end_day_id: 702 }), ctx());
    expect(f.time).toBeNull();
    expect(f.startDate).toBe('2025-06-01');
    expect(f.endDate).toBe('2025-06-02');
    expect(bookingFacts(buildReservation({}), ctx())).toMatchObject({ startDate: null, endDate: null, endpoints: [] });
  });
});

describe('bookingFacts: cells', () => {
  it('FE-PLANNER-BKFACTS-014: flight facts, the airports only when there is no route', () => {
    const meta = { airline: 'ANA', flight_number: 'NH204', departure_airport: 'FRA', arrival_airport: 'HND', seat: '12A', class: 'Economy', platform: '7' };
    const bare = bookingFacts(buildReservation({ type: 'flight', metadata: JSON.stringify(meta) }), ctx());
    expect(cell(bare, 'reservations.meta.airline')).toBe('ANA');
    expect(cell(bare, 'reservations.meta.flightNumber')).toBe('NH204');
    expect(cell(bare, 'reservations.meta.from')).toBe('FRA');
    expect(cell(bare, 'reservations.meta.to')).toBe('HND');
    expect(cell(bare, 'reservations.meta.seat')).toBe('12A, Economy');
    expect(cell(bare, 'reservations.meta.platform')).toBe('7');

    const routed = bookingFacts(buildReservation({
      type: 'flight', metadata: JSON.stringify(meta),
      endpoints: [ep({ role: 'from' }), ep({ role: 'to', sequence: 1 })],
    }), ctx());
    expect(cell(routed, 'reservations.meta.from')).toBeUndefined();
    expect(cell(routed, 'reservations.meta.to')).toBeUndefined();
  });

  it('FE-PLANNER-BKFACTS-015: a seat without a class, and the train number', () => {
    const f = bookingFacts(buildReservation({ type: 'train', metadata: JSON.stringify({ seat: '44', train_number: 'ICE 71' }) }), ctx());
    expect(cell(f, 'reservations.meta.seat')).toBe('44');
    expect(cell(f, 'reservations.meta.trainNumber')).toBe('ICE 71');
  });

  it('FE-PLANNER-BKFACTS-016: the stored price shows only while no expense is linked', () => {
    const r = buildReservation({ metadata: JSON.stringify({ price: '120', priceCurrency: 'usd' }) });
    const price = cell(bookingFacts(r, ctx()), 'reservations.price');
    expect(price).toContain('120');
    expect(price).toContain('$');
    expect(cell(bookingFacts(r, ctx({ hasLinkedCost: true })), 'reservations.price')).toBeUndefined();
    expect(cell(bookingFacts(buildReservation({ metadata: JSON.stringify({ price: '' }) }), ctx()), 'reservations.price')).toBeUndefined();
  });

  it('FE-PLANNER-BKFACTS-017: check-in with its window and check-out', () => {
    const f = bookingFacts(buildReservation({ type: 'hotel', metadata: JSON.stringify({ check_in_time: '15:00', check_in_end_time: '22:00', check_out_time: '11:00' }) }), ctx({ locale: 'de-DE' }));
    expect(cell(f, 'reservations.meta.checkIn')).toBe('15:00 Uhr → 22:00 Uhr');
    expect(cell(f, 'reservations.meta.checkOut')).toBe('11:00 Uhr');
    const open = bookingFacts(buildReservation({ type: 'hotel', metadata: JSON.stringify({ check_in_time: '15:00' }) }), ctx());
    expect(cell(open, 'reservations.meta.checkIn')).toBe('15:00');
  });
});

describe('bookingFacts: codes, links and places', () => {
  it('FE-PLANNER-BKFACTS-018: per-segment codes only on a booking with more than one leg', () => {
    const legs = [
      { from: 'FRA', to: 'MUC', confirmation_number: 'SEG1' },
      { from: 'MUC', to: null, confirmation_number: 'SEG2' },
      { from: 'X', to: 'Y' },
    ];
    const flight = bookingFacts(buildReservation({ type: 'flight', metadata: JSON.stringify({ legs }) }), ctx());
    expect(flight.legCodes).toEqual([{ route: 'FRA → MUC', code: 'SEG1' }, { route: 'MUC', code: 'SEG2' }]);
    const train = bookingFacts(buildReservation({ type: 'train', metadata: JSON.stringify({ legs }) }), ctx());
    expect(train.legCodes).toHaveLength(2);
    const single = bookingFacts(buildReservation({ type: 'flight', metadata: JSON.stringify({ legs: [legs[0]] }) }), ctx());
    expect(single.legCodes).toEqual([]);
    const bus = bookingFacts(buildReservation({ type: 'bus', metadata: JSON.stringify({ legs }) }), ctx());
    expect(bus.legCodes).toEqual([]);
  });

  it('FE-PLANNER-BKFACTS-019: a booking linked to a plan stop names the day, place and time', () => {
    const lookup = {
      11: { dayNumber: 2, dayTitle: null, dayDate: '2025-06-02', placeName: 'Louvre', startTime: '10:00', endTime: '12:00' },
      12: { dayNumber: 1, dayTitle: 'Arrival', dayDate: '2025-06-01', placeName: 'Hotel', startTime: '18:00', endTime: null },
      13: { dayNumber: 1, dayTitle: 'Arrival', dayDate: null, placeName: 'Park', startTime: null, endTime: null },
    };
    expect(bookingFacts(buildReservation({ assignment_id: 11 }), ctx({ assignmentLookup: lookup })).linked).toBe('dayplan.dayN#2, Louvre, 10:00 → 12:00');
    expect(bookingFacts(buildReservation({ assignment_id: 12 }), ctx({ assignmentLookup: lookup })).linked).toBe('Arrival, Hotel, 18:00');
    expect(bookingFacts(buildReservation({ assignment_id: 13 }), ctx({ assignmentLookup: lookup })).linked).toBe('Arrival, Park');
    expect(bookingFacts(buildReservation({ assignment_id: 99 }), ctx({ assignmentLookup: lookup })).linked).toBeNull();
    expect(bookingFacts(buildReservation({}), ctx()).linked).toBeNull();
  });

  it('FE-PLANNER-BKFACTS-020: place, accommodation and a link made safe for an href', () => {
    const f = bookingFacts(buildReservation({ location: 'Gion', place_name: 'Kikunoi', accommodation_name: 'Ryokan', url: 'www.kikunoi.jp' }), ctx());
    expect(f.place).toBe('Gion');
    expect(f.accommodation).toBe('Ryokan');
    expect(f.url).toEqual({ href: 'https://www.kikunoi.jp', text: 'www.kikunoi.jp' });
    expect(bookingFacts(buildReservation({ place_name: 'Kikunoi' }), ctx()).place).toBe('Kikunoi');
    const plain = bookingFacts(buildReservation({}), ctx());
    expect(plain).toMatchObject({ place: null, accommodation: null, url: null });
    expect(bookingFacts(buildReservation({ url: 'javascript:alert(1)' }), ctx()).url?.href).toBeNull();
  });
});
