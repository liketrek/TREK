// FE-PLANNER-BKTIMELINE-001 to FE-PLANNER-BKTIMELINE-026
import { describe, it, expect } from 'vitest';
import { buildDay, buildReservation } from '../../../../tests/helpers/factories';
import type { Day, ReservationEndpoint } from '../../../types';
import { absHour, buildAxis, dayWindow, packBars, placeReservation, type Moment } from './timelineModel';

function ep(over: Partial<ReservationEndpoint>): ReservationEndpoint {
  return { role: 'from', sequence: 0, name: 'Stop', code: null, lat: 1, lng: 1, timezone: null, local_time: null, local_date: null, ...over };
}

const d1 = buildDay({ id: 601, day_number: 1, date: '2025-06-01', title: 'One' });
const d2 = buildDay({ id: 602, day_number: 2, date: '2025-06-02', title: null });
const d3 = buildDay({ id: 603, day_number: 3, date: '2025-06-03' });
const days: Day[] = [d3, d1, d2];
const axis = buildAxis(days);

describe('buildAxis', () => {
  it('FE-PLANNER-BKTIMELINE-001: dated days in calendar order', () => {
    expect(axis).toEqual([
      { date: '2025-06-01', dayNumber: 1, dayId: 601, title: 'One' },
      { date: '2025-06-02', dayNumber: 2, dayId: 602, title: null },
      { date: '2025-06-03', dayNumber: 3, dayId: 603, title: null },
    ]);
  });

  it('FE-PLANNER-BKTIMELINE-002: a trip with some dated days leaves the undated ones off the axis', () => {
    const loose = buildDay({ id: 604, day_number: 4, date: null });
    expect(buildAxis([loose, d2, d1]).map(a => a.dayId)).toEqual([601, 602]);
  });

  it('FE-PLANNER-BKTIMELINE-003: without any dates the axis is day 1..N', () => {
    const a = buildDay({ id: 611, day_number: 2, date: null, title: 'Second' });
    const b = buildDay({ id: 612, day_number: 1, date: null });
    expect(buildAxis([a, b])).toEqual([
      { date: null, dayNumber: 1, dayId: 612, title: null },
      { date: null, dayNumber: 2, dayId: 611, title: 'Second' },
    ]);
  });

  it('FE-PLANNER-BKTIMELINE-004: two days on the same date keep their order', () => {
    const twin = buildDay({ id: 605, day_number: 5, date: '2025-06-01' });
    expect(buildAxis([d1, twin]).map(a => a.dayId)).toEqual([601, 605]);
  });
});

describe('placeReservation', () => {
  it('FE-PLANNER-BKTIMELINE-005: a booking with start and end sits between them', () => {
    const r = buildReservation({ type: 'train', reservation_time: '2025-06-02T10:30', reservation_end_time: '2025-06-02T12:00' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 1, hour: 10.5 }, end: { day: 1, hour: 12 } });
  });

  it('FE-PLANNER-BKTIMELINE-006: without an end it gets one hour', () => {
    const r = buildReservation({ type: 'restaurant', reservation_time: '2025-06-03T19:00' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 2, hour: 19 }, end: { day: 2, hour: 20 } });
  });

  it('FE-PLANNER-BKTIMELINE-007: a date without a time starts at nine', () => {
    const r = buildReservation({ type: 'tour', reservation_time: '2025-06-01' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 0, hour: 9 }, end: { day: 0, hour: 10 } });
  });

  it('FE-PLANNER-BKTIMELINE-008: a hotel runs from check-in to check-out across its stay', () => {
    const r = buildReservation({ type: 'hotel', accommodation_start_day_id: 601, accommodation_end_day_id: 603, metadata: JSON.stringify({ check_in_time: '14:00', check_out_time: '10:30' }) });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 0, hour: 14 }, end: { day: 2, hour: 10.5 } });
  });

  it('FE-PLANNER-BKTIMELINE-009: a hotel without times takes 15:00 and 11:00, one night when the end is unknown', () => {
    const r = buildReservation({ type: 'hotel', day_id: 602 });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 1, hour: 15 }, end: { day: 2, hour: 11 } });
  });

  it('FE-PLANNER-BKTIMELINE-010: a hotel checked into on the last day runs to the end of that day', () => {
    const r = buildReservation({ type: 'hotel', day_id: 603 });
    // Its night lies past the axis, so the bar fills the rest of the last day instead of pointing back before check-in.
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 2, hour: 15 }, end: { day: 2, hour: 24 } });
  });

  it('FE-PLANNER-BKTIMELINE-011: a transport reads its endpoints\' local dates and times', () => {
    const r = buildReservation({
      type: 'flight',
      endpoints: [
        ep({ role: 'to', sequence: 1, local_date: '2025-06-02', local_time: '09:15' }),
        ep({ role: 'from', sequence: 0, local_date: '2025-06-01', local_time: '07:00' }),
      ],
    });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 0, hour: 7 }, end: { day: 1, hour: 9.25 } });
  });

  it('FE-PLANNER-BKTIMELINE-012: a transport without dates falls back to its linked days', () => {
    const r = buildReservation({ type: 'car', day_id: 601, end_day_id: 603 });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 0, hour: 9 }, end: { day: 2, hour: 10 } });
  });

  it('FE-PLANNER-BKTIMELINE-013: before and after the trip are said, not drawn', () => {
    expect(placeReservation(buildReservation({ reservation_time: '2025-05-20T10:00' }), axis, days)).toEqual({ kind: 'before' });
    expect(placeReservation(buildReservation({ reservation_time: '2025-06-20T10:00' }), axis, days)).toEqual({ kind: 'after' });
  });

  it('FE-PLANNER-BKTIMELINE-014: no date, an empty axis or a date between the axis days is undated', () => {
    expect(placeReservation(buildReservation({}), axis, days)).toEqual({ kind: 'undated' });
    expect(placeReservation(buildReservation({ reservation_time: '2025-06-02T10:00' }), [], days)).toEqual({ kind: 'undated' });
    const gappy = buildAxis([d1, d3]);
    expect(placeReservation(buildReservation({ reservation_time: '2025-06-02T10:00' }), gappy, [d1, d3])).toEqual({ kind: 'undated' });
  });

  it('FE-PLANNER-BKTIMELINE-015: an end past the trip runs to the end of the last day', () => {
    const r = buildReservation({ type: 'car', reservation_time: '2025-06-02T08:00', reservation_end_time: '2025-06-30T18:00' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 1, hour: 8 }, end: { day: 2, hour: 24 } });
  });

  it('FE-PLANNER-BKTIMELINE-016: an end before the trip keeps one hour', () => {
    const r = buildReservation({ type: 'car', reservation_time: '2025-06-02T08:00', reservation_end_time: '2025-05-01T18:00' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 1, hour: 8 }, end: { day: 1, hour: 9 } });
  });

  it('FE-PLANNER-BKTIMELINE-017: an arrival earlier than the departure keeps a small bar', () => {
    const r = buildReservation({ type: 'flight', reservation_time: '2025-06-02T22:00', reservation_end_time: '2025-06-01T06:00' });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 1, hour: 22 }, end: { day: 1, hour: 23 } });
  });

  it('FE-PLANNER-BKTIMELINE-018: an end date missing from the axis stays on the start day', () => {
    const gappy = buildAxis([d1, d3]);
    const r = buildReservation({ type: 'train', reservation_time: '2025-06-01T10:00', reservation_end_time: '2025-06-02T12:00' });
    expect(placeReservation(r, gappy, [d1, d3])).toEqual({ kind: 'on', start: { day: 0, hour: 10 }, end: { day: 0, hour: 12 } });
  });

  it('FE-PLANNER-BKTIMELINE-019: a garbled time falls back to the default hour', () => {
    const r = buildReservation({ type: 'hotel', day_id: 601, end_day_id: 602, metadata: JSON.stringify({ check_in_time: 'late', check_out_time: '10' }) });
    expect(placeReservation(r, axis, days)).toEqual({ kind: 'on', start: { day: 0, hour: 15 }, end: { day: 1, hour: 10 } });
  });

  it('FE-PLANNER-BKTIMELINE-020: on a trip without dates the linked day places the booking', () => {
    const a = buildDay({ id: 621, day_number: 1, date: null });
    const b = buildDay({ id: 622, day_number: 2, date: null });
    const undatedAxis = buildAxis([a, b]);
    const r = buildReservation({ type: 'bus', reservation_time: '11:00', day_id: 622 });
    expect(placeReservation(r, undatedAxis, [a, b])).toEqual({ kind: 'on', start: { day: 1, hour: 11 }, end: { day: 1, hour: 12 } });
    expect(placeReservation(buildReservation({ type: 'bus' }), undatedAxis, [a, b])).toEqual({ kind: 'undated' });
    expect(placeReservation(buildReservation({ type: 'bus', day_id: 999 }), undatedAxis, [a, b])).toEqual({ kind: 'undated' });
  });
});

describe('absHour and dayWindow', () => {
  it('FE-PLANNER-BKTIMELINE-021: absHour counts hours from the first day', () => {
    expect(absHour({ day: 2, hour: 6.5 })).toBe(54.5);
  });

  it('FE-PLANNER-BKTIMELINE-022: an empty day shows 06:00 to 22:00', () => {
    expect(dayWindow([], 0)).toEqual({ from: 6, to: 22 });
  });

  it('FE-PLANNER-BKTIMELINE-023: widens to fit what starts or ends early or late, within 0..24', () => {
    const at = (day: number, hour: number): Moment => ({ day, hour });
    expect(dayWindow([{ start: at(0, 4.5), end: at(0, 5.5) }], 0)).toEqual({ from: 4, to: 22 });
    expect(dayWindow([{ start: at(0, 21), end: at(0, 23.5) }], 0)).toEqual({ from: 6, to: 24 });
    expect(dayWindow([{ start: at(0, 23.5), end: at(1, 0.5) }], 1)).toEqual({ from: 0, to: 22 });
    // An item on another day changes nothing.
    expect(dayWindow([{ start: at(3, 1), end: at(3, 23) }], 0)).toEqual({ from: 6, to: 22 });
  });
});

describe('packBars', () => {
  const r1 = buildReservation({ id: 8101 });
  const r2 = buildReservation({ id: 8102 });
  const r3 = buildReservation({ id: 8103 });
  const toX = (m: Moment) => absHour(m) * 10;
  const at = (hour: number): Moment => ({ day: 0, hour });

  it('FE-PLANNER-BKTIMELINE-024: overlapping bars get their own lanes, a later one reuses a free lane', () => {
    const { bars, lanes } = packBars([
      { r: r1, start: at(0), end: at(10) },
      { r: r2, start: at(5), end: at(8) },
      { r: r3, start: at(12), end: at(14) },
    ], toX, 240);
    expect(lanes).toBe(2);
    const byId = Object.fromEntries(bars.map(b => [b.r.id, b]));
    expect(byId[8101]).toMatchObject({ lane: 0, x: 0, w: 100, cutStart: false, cutEnd: false });
    expect(byId[8102]).toMatchObject({ lane: 1, x: 50, w: 30 });
    expect(byId[8103]).toMatchObject({ lane: 0, x: 120, w: 26 });
  });

  it('FE-PLANNER-BKTIMELINE-025: bars reaching past either edge are cut there and say so', () => {
    const { bars } = packBars([{ r: r1, start: { day: -1, hour: 20 }, end: at(30) }], toX, 240);
    expect(bars[0]).toMatchObject({ x: 0, w: 240, cutStart: true, cutEnd: true });
  });

  it('FE-PLANNER-BKTIMELINE-026: nothing to pack is still one lane, and a short bar at the edge stays inside', () => {
    expect(packBars([], toX, 240)).toEqual({ bars: [], lanes: 1 });
    const { bars } = packBars([{ r: r2, start: at(23.9), end: at(24) }], toX, 240, 26, 4);
    expect(bars[0]).toMatchObject({ x: 214, w: 26 });
  });
});
