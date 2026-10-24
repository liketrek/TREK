/**
 * FE-AI-HINT-001 to FE-AI-HINT-019
 *
 * The plan hints, worked out from the trip alone: each rule on both sides of
 * its threshold, the data that silences it, and the order, ids and clock
 * helpers they rest on.
 */
import type { PlaceOpeningHours } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { buildAssignment, buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories';
import type { Accommodation, Assignment, Day, Place, Reservation } from '../../types';
import { formatClockTime } from '../../utils/formatters';
import { type AssistantHint, GAP_MIN_MINUTES, LONG_LEG_KM, tripHints, type TripHintsInput } from './assistantHintRules';
import {
  bookingSpan,
  clockMinutes,
  clockText,
  noteMinutes,
  spansOverlap,
  stopSpan,
  weekdayMondayFirst,
} from './assistantHintsTime';

const TODAY = '2026-06-10';
/** A Friday. */
const FRIDAY = '2026-06-12';
/** One kilometre north, in degrees of latitude on the sphere haversineKm uses. */
const KM = 1 / ((2 * Math.PI * 6371) / 360);

function day(id: number, date: string | null = FRIDAY, extra: Partial<Day> = {}): Day {
  return buildDay({ id, date, ...extra });
}

interface StopOptions {
  time?: string;
  end?: string;
  duration?: number;
  lat?: number;
  place?: Partial<Place>;
}

function stop(id: number, dayId: number, opts: StopOptions = {}, extra: Partial<Assignment> = {}): Assignment {
  const place = buildPlace({
    id: 1000 + id,
    name: `Stop ${id}`,
    place_time: opts.time ?? null,
    end_time: opts.end ?? null,
    duration_minutes: opts.duration ?? null,
    lat: opts.lat ?? 0,
    lng: 0,
    ...opts.place,
  });
  return buildAssignment({ id, day_id: dayId, place_id: place.id, order_index: id, place, ...extra });
}

function input(over: Partial<TripHintsInput> & { stops?: Assignment[] }): TripHintsInput {
  const { stops = [], ...rest } = over;
  const assignments: TripHintsInput['assignments'] = {};
  for (const a of stops) (assignments[String(a.day_id)] ??= []).push(a);
  return {
    today: TODAY,
    days: [day(1)],
    assignments,
    places: stops.map((a) => a.place as Place),
    reservations: [],
    dayNotes: {},
    accommodations: [],
    distanceUnit: 'metric',
    is12h: false,
    ...rest,
  };
}

function booking(over: Partial<Reservation>): Reservation {
  return buildReservation({ day_id: 1, ...over });
}

function stay(start: number, end: number): Accommodation {
  return { id: start * 100 + end, trip_id: 1, start_day_id: start, end_day_id: end };
}

function hours(closedOn: number | null, open = '09:00', close = '17:00'): string {
  const week: PlaceOpeningHours = Array.from({ length: 7 }, (_, i) =>
    i === closedOn ? { closed: true } : { closed: false, open, close }
  );
  return JSON.stringify(week);
}

const only = (hints: AssistantHint[], rule: AssistantHint['rule']) => hints.filter((h) => h.rule === rule);

describe('overlap', () => {
  it('FE-AI-HINT-001: names two stops of a day that share time, once per day, as a warning', () => {
    const hints = tripHints(
      input({
        stops: [
          stop(1, 1, { time: '10:00', end: '12:00' }),
          stop(2, 1, { time: '11:00', duration: 60 }),
          stop(3, 1, { time: '11:30', end: '12:30' }),
        ],
      })
    );
    const overlaps = only(hints, 'overlap');
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]).toMatchObject({
      level: 'warn',
      dayId: 1,
      textKey: 'assistant.hint.overlap',
      promptKey: 'assistant.hint.overlap.prompt',
      params: { a: 'Stop 1', b: 'Stop 2' },
      focus: { dayId: 1, placeIds: [1001, 1002] },
    });
  });

  it('FE-AI-HINT-002: stops that only touch, two bare starts, and a stop timed apart by its own assignment do not overlap', () => {
    const overlaps = (stops: Assignment[]) => only(tripHints(input({ stops })), 'overlap').length;
    const ten = () => stop(1, 1, { time: '10:00', end: '11:00' });
    expect(overlaps([ten(), stop(2, 1, { time: '11:00' })])).toBe(0);
    expect(overlaps([stop(1, 1, { time: '10:00' }), stop(2, 1, { time: '10:00' })])).toBe(0);
    expect(overlaps([ten(), stop(2, 1, { time: '10:30', duration: 30 }, { assignment_time: '14:00' })])).toBe(0);
    expect(overlaps([ten(), stop(2, 1, { time: '10:30' })])).toBe(1);
  });

  it('FE-AI-HINT-003: collides a stop with a booking that keeps the traveller busy, but not with its own booking', () => {
    const lunch = booking({
      id: 7,
      title: 'Lunch',
      reservation_time: `${FRIDAY}T12:30`,
      reservation_end_time: `${FRIDAY}T14:00`,
    });
    const museum = stop(1, 1, { time: '13:00', duration: 60 });
    const [hint] = only(tripHints(input({ stops: [museum], reservations: [lunch] })), 'overlap');
    expect(hint.params).toEqual({ a: 'Lunch', b: 'Stop 1' });
    expect(hint.focus).toEqual({ dayId: 1, placeIds: [1001] });

    const quiet = [
      { ...lunch, assignment_id: 1 },
      { ...lunch, type: 'parking' },
      { ...lunch, status: 'cancelled' },
      { ...lunch, ingest_state: 'staged' },
      { ...lunch, reservation_time: '2026-06-13T12:30' },
    ];
    for (const r of quiet) {
      expect(only(tripHints(input({ stops: [museum], reservations: [r] })), 'overlap')).toEqual([]);
    }
  });
});

describe('opening hours', () => {
  it('FE-AI-HINT-004: warns about a place that is closed on the weekday of its day, and only on a dated day', () => {
    const closed = stop(1, 1, { place: { opening_hours: hours(4) } });
    const [hint] = tripHints(input({ stops: [closed] }));
    expect(hint).toMatchObject({
      rule: 'closed',
      level: 'warn',
      textKey: 'assistant.hint.closed',
      params: { place: 'Stop 1' },
      focus: { dayId: 1, placeIds: [1001] },
    });
    expect(tripHints(input({ days: [day(1, null)], stops: [closed] }))).toEqual([]);
    expect(tripHints(input({ days: [day(1, '2026-06-15')], stops: [closed] }))).toEqual([]);
  });

  it('FE-AI-HINT-005: says when a visit starts before opening or runs past closing, and leaves hours past midnight alone', () => {
    const early = stop(1, 1, { time: '08:00', duration: 60, place: { opening_hours: hours(null) } });
    expect(tripHints(input({ stops: [early] }))[0]).toMatchObject({
      rule: 'outsideHours',
      textKey: 'assistant.hint.opensLate',
      promptKey: 'assistant.hint.outsideHours.prompt',
      params: { place: 'Stop 1', time: '09:00' },
    });
    const late = stop(1, 1, { time: '16:00', duration: 120, place: { opening_hours: hours(null) } });
    expect(tripHints(input({ stops: [late] }))[0]).toMatchObject({
      textKey: 'assistant.hint.closesEarly',
      params: { time: '17:00' },
    });
    const fits = stop(1, 1, { time: '10:00', duration: 120, place: { opening_hours: hours(null) } });
    const night = stop(1, 1, { time: '08:00', place: { opening_hours: hours(null, '20:00', '02:00') } });
    expect(tripHints(input({ stops: [fits] }))).toEqual([]);
    expect(tripHints(input({ stops: [night] }))).toEqual([]);
  });
});

describe('gaps', () => {
  const morning = () => stop(1, 1, { time: '09:00', end: '10:00' });

  it('FE-AI-HINT-006: points at three free hours between two timed stops, in the user clock', () => {
    const [hint] = tripHints(input({ stops: [morning(), stop(2, 1, { time: '13:00' })] }));
    expect(hint).toMatchObject({
      rule: 'gap',
      level: 'info',
      focus: { dayId: 1 },
      params: { count: 3, from: '10:00', to: '13:00' },
    });
    const twelve = tripHints(input({ stops: [morning(), stop(2, 1, { time: '13:00' })], is12h: true }))[0];
    expect(twelve.params.from).toBe(formatClockTime('10:00', true));
    expect(GAP_MIN_MINUTES).toBe(180);
    expect(tripHints(input({ stops: [morning(), stop(2, 1, { time: '12:59' })] }))).toEqual([]);
  });

  it('FE-AI-HINT-007: a timed note, a booking in between or an unknown end fills the gap; a day without a date still has one', () => {
    const later = stop(2, 1, { time: '14:00' });
    const note = { id: 1, day_id: 1, text: 'Picnic', time: '11:30' };
    expect(tripHints(input({ stops: [morning(), later], dayNotes: { '1': [note] } }))).toEqual([]);
    const tour = booking({ type: 'tour', reservation_time: `${FRIDAY}T11:00` });
    expect(tripHints(input({ stops: [morning(), later], reservations: [tour] }))).toEqual([]);
    expect(tripHints(input({ stops: [stop(1, 1, { time: '09:00' }), later] }))).toEqual([]);
    const undated = tripHints(input({ days: [day(1, null)], stops: [morning(), later] }));
    expect(undated.map((h) => h.rule)).toEqual(['gap']);
  });
});

describe('legs', () => {
  it('FE-AI-HINT-008: calls a walk of more than 4 km as the crow flies far, and a ride by bike only past 20 km', () => {
    const near = [stop(1, 1), stop(2, 1, { lat: 4 * KM - 1e-9 })];
    const far = [stop(1, 1), stop(2, 1, { lat: 4.01 * KM })];
    expect(LONG_LEG_KM.walking).toBe(4);
    expect(tripHints(input({ stops: near }))).toEqual([]);
    expect(tripHints(input({ stops: far }))[0]).toMatchObject({
      rule: 'longLeg',
      level: 'info',
      params: { from: 'Stop 1', to: 'Stop 2', distance: '4 km' },
      focus: { dayId: 1, placeIds: [1001, 1002] },
    });
    const byBike = [stop(1, 1, {}, { leg_transport_mode: 'cycling' }), stop(2, 1, { lat: 15 * KM })];
    expect(tripHints(input({ stops: byBike }))).toEqual([]);
    const byCar = [stop(1, 1), stop(2, 1, { lat: 100 * KM })];
    const driving = day(1, FRIDAY, { default_transport_mode: 'driving' });
    expect(tripHints(input({ days: [driving], stops: byCar }))).toEqual([]);
  });

  it('FE-AI-HINT-009: leaves out stops off the route, road trip and tour stops, and days with a flight', () => {
    const far = (extra: Partial<Assignment>, place: Partial<Place> = {}) => [
      stop(1, 1),
      stop(2, 1, { lat: 10 * KM, place }, extra),
    ];
    expect(tripHints(input({ stops: far({ route_excluded: true }) }))).toEqual([]);
    expect(tripHints(input({ stops: far({ tour_place_id: 9 }) }))).toEqual([]);
    expect(tripHints(input({ stops: far({}, { stop_type: 'fuel' }) }))).toEqual([]);
    const flight = booking({ type: 'flight' });
    expect(tripHints(input({ stops: far({}), reservations: [flight] }))).toEqual([]);
  });

  it('FE-AI-HINT-010: warns when the time between two stops is too short for the way, naming the minutes there are', () => {
    const first = stop(1, 1, { time: '10:00', end: '11:00' });
    const tight = tripHints(input({ stops: [first, stop(2, 1, { time: '11:30', lat: 3 * KM })] }));
    expect(tight[0]).toMatchObject({
      rule: 'tightLeg',
      level: 'warn',
      textKey: 'assistant.hint.tightLeg',
      params: { count: 30, from: 'Stop 1', to: 'Stop 2' },
    });
    expect(tripHints(input({ stops: [first, stop(2, 1, { time: '11:45', lat: 3 * KM })] }))).toEqual([]);
  });
});

describe('nights', () => {
  const days = [day(1, '2026-06-11'), day(2, FRIDAY), day(3, '2026-06-13'), day(4, '2026-06-14')];

  it('FE-AI-HINT-011: joins nights in a row without a stay into one hint, from their first day', () => {
    const hints = only(tripHints(input({ days, accommodations: [stay(1, 2)] })), 'noStay');
    expect(hints).toHaveLength(1);
    expect(hints[0]).toMatchObject({ dayId: 2, dayIndex: 1, params: { count: 2 }, focus: { dayId: 2 } });
    expect(only(tripHints(input({ days, accommodations: [stay(1, 4)] })), 'noStay')).toEqual([]);
  });

  it('FE-AI-HINT-012: a ride through the night covers it; unknown stays, one-day trips and past nights say nothing', () => {
    const train = booking({ type: 'train', day_id: 2, end_day_id: 3 });
    const hints = only(tripHints(input({ days, accommodations: [stay(1, 2)], reservations: [train] })), 'noStay');
    expect(hints.map((h) => [h.dayId, h.params.count])).toEqual([[3, 1]]);
    expect(only(tripHints(input({ days, accommodations: null })), 'noStay')).toEqual([]);
    expect(only(tripHints(input({ days: [day(1)], accommodations: [] })), 'noStay')).toEqual([]);
    const past = [day(1, '2026-06-08'), day(2, '2026-06-09'), day(3, TODAY)];
    expect(only(tripHints(input({ days: past, accommodations: [] })), 'noStay')).toEqual([]);
  });
});

describe('bookings without a day', () => {
  it('FE-AI-HINT-013: names one loose booking and its day, or counts several', () => {
    const ferry = booking({ id: 5, title: 'Ferry', day_id: null, reservation_time: `${FRIDAY}T08:00` });
    expect(tripHints(input({ reservations: [ferry] }))[0]).toMatchObject({
      rule: 'unplacedBooking',
      textKey: 'assistant.hint.unplacedBookingDay',
      dayId: 1,
      focus: { dayId: 1 },
      params: { title: 'Ferry' },
    });
    const undated = { ...ferry, reservation_time: null };
    expect(tripHints(input({ reservations: [undated] }))[0]).toMatchObject({
      textKey: 'assistant.hint.unplacedBooking',
      dayId: null,
      focus: null,
    });
    const two = tripHints(input({ reservations: [ferry, { ...undated, id: 6 }] }));
    expect(two[0]).toMatchObject({ textKey: 'assistant.hint.unplacedBookings', params: { count: 2 } });
    expect(two[0].id).toBe('unplacedBooking:trip:5,6');
  });

  it('FE-AI-HINT-014: leaves hotels, cancelled, staged, past and stop-bound bookings alone', () => {
    const loose = { day_id: null, reservation_time: null };
    const quiet = [
      booking({ ...loose, type: 'hotel' }),
      booking({ ...loose, status: 'cancelled' }),
      booking({ ...loose, ingest_state: 'staged' }),
      booking({ ...loose, reservation_time: '2026-06-01T10:00' }),
      booking({ ...loose, assignment_id: 3 }),
    ];
    expect(tripHints(input({ reservations: quiet }))).toEqual([]);
  });
});

describe('the list', () => {
  it('FE-AI-HINT-015: puts warnings first, then by day; past days and stay stops are not read', () => {
    const hints = tripHints(
      input({
        days: [day(1, '2026-06-09'), day(2, '2026-06-11'), day(3, FRIDAY)],
        stops: [
          stop(1, 1, { time: '10:00', end: '12:00' }),
          stop(2, 1, { time: '11:00', end: '12:00' }),
          stop(3, 2, { time: '09:00', end: '10:00' }),
          stop(4, 2, { time: '14:00' }),
          stop(5, 3, { time: '10:00', end: '12:00' }),
          stop(6, 3, { time: '11:00', end: '12:00' }, { accommodation_id: 1 }),
          stop(7, 3, { time: '11:30', end: '13:00' }),
        ],
        accommodations: [stay(1, 3)],
      })
    );
    expect(hints.map((h) => [h.rule, h.dayId])).toEqual([
      ['overlap', 3],
      ['gap', 2],
    ]);
    expect(hints[0].params).toEqual({ a: 'Stop 5', b: 'Stop 7' });
  });

  it('FE-AI-HINT-016: keeps an id while the plan stays the same and changes it with the times', () => {
    const plan = (end: string) =>
      input({ stops: [stop(1, 1, { time: '10:00', end }), stop(2, 1, { time: '11:00', end: '12:00' })] });
    expect(tripHints(plan('12:00'))[0].id).toBe(tripHints(plan('12:00'))[0].id);
    expect(tripHints(plan('12:00'))[0].id).not.toBe(tripHints(plan('11:30'))[0].id);
  });
});

describe('the clock', () => {
  it('FE-AI-HINT-017: reads HH:MM only, and a note by the time it starts with', () => {
    expect(clockMinutes('9:05')).toBe(545);
    expect(clockMinutes(' 23:59 ')).toBe(1439);
    for (const value of ['24:00', '10:60', '09:30:00', null]) expect(clockMinutes(value)).toBeNull();
    expect(noteMinutes('14:30 dinner')).toBe(870);
    expect(noteMinutes('dinner at 14:30')).toBeNull();
    expect(clockText(545)).toBe('09:05');
  });

  it('FE-AI-HINT-018: reads the weekday from the date alone, Monday first', () => {
    expect(weekdayMondayFirst('2026-06-15')).toBe(0);
    expect(weekdayMondayFirst(`${FRIDAY}T23:30:00`)).toBe(4);
    expect(weekdayMondayFirst('2026-06-14')).toBe(6);
    expect(weekdayMondayFirst('soon')).toBeNull();
  });

  it('FE-AI-HINT-019: spans stops and bookings, and overlaps them', () => {
    expect(stopSpan(stop(1, 1, { time: '10:00', end: '09:00', duration: 30 }))).toEqual({ start: 600, end: 630 });
    expect(stopSpan(stop(1, 1, { time: '23:30', duration: 90 }))).toEqual({ start: 1410, end: 1440 });
    expect(stopSpan(stop(1, 1))).toBeNull();
    const overnight = booking({ reservation_time: `${FRIDAY}T22:00`, end_day_id: 2 });
    expect(bookingSpan(overnight, FRIDAY)).toEqual({ start: 1320, end: 1440 });
    expect(bookingSpan(booking({ reservation_time: '21:00' }), FRIDAY)).toEqual({ start: 1260, end: null });
    expect(bookingSpan(overnight, '2026-06-13')).toBeNull();
    expect(spansOverlap({ start: 600, end: null }, { start: 540, end: 660 })).toBe(true);
    expect(spansOverlap({ start: 540, end: 660 }, { start: 660, end: null })).toBe(false);
  });
});
