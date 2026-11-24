import { describe, expect, it } from 'vitest';

import { buildDay } from '../../../tests/helpers/factories';
import type { Accommodation } from '../../types';
import { orderTransitStaysByDate } from './transitStayOrder';

const day = buildDay({ id: 500, date: '2027-03-21', day_number: 21 });
const stay = (id: number, start: number, end = start) =>
  ({ id, start_day_id: start, end_day_id: end }) as Accommodation;
const refs = [
  buildDay({ id: 900, date: '2027-03-01', day_number: 1 }),
  buildDay({ id: 700, date: '2027-03-19', day_number: 19 }),
  buildDay({ id: 600, date: '2027-03-20', day_number: 20 }),
  day,
  buildDay({ id: 400, date: '2027-03-22', day_number: 22 }),
  buildDay({ id: 300, date: '2027-03-23', day_number: 23 }),
];
const ids = (stays: Accommodation[]) => stays.map((a) => a.id);

describe('orderTransitStaysByDate', () => {
  it('uses the whole interval: an early check-in with a nearby checkout is close', () => {
    const spanning = stay(1, 900, 600);
    const future = stay(2, 400, 300);
    const farther = stay(3, 700);
    expect(ids(orderTransitStaysByDate(day, refs, [farther, future, spanning]))).toEqual([1, 2, 3]);
  });

  it('puts the earlier interval first at equal distance, then earlier checkout and stable stay id', () => {
    const list = [stay(90, 400, 300), stay(2, 600), stay(80, 400, 300), stay(100, 400)];
    expect(ids(orderTransitStaysByDate(day, refs, list))).toEqual([2, 100, 80, 90]);
    expect(ids(orderTransitStaysByDate(day, refs, list.slice().reverse()))).toEqual([2, 100, 80, 90]);
  });

  it('places missing, incomplete and invalid calendar dates after dated stays', () => {
    const dates = [
      ...refs,
      buildDay({ id: 10, date: null }),
      buildDay({ id: 11, date: '2027-02-30' }),
      buildDay({ id: 12, date: 'not-a-date' }),
    ];
    const list = [stay(4, 10), stay(3, 11), stay(2, 12), stay(5, 600, 10), stay(6, 99999), stay(9, 900)];
    expect(ids(orderTransitStaysByDate(day, dates, list))).toEqual([9, 2, 3, 4, 5, 6]);
  });

  it('handles leap days without accepting a normalized invalid date', () => {
    const selected = buildDay({ id: 1, date: '2028-03-01' });
    const dates = [selected, buildDay({ id: 2, date: '2028-02-29' }), buildDay({ id: 3, date: '2027-02-29' })];
    expect(ids(orderTransitStaysByDate(selected, dates, [stay(1, 3), stay(2, 2)]))).toEqual([2, 1]);
  });

  it('uses updated calendar dates after days are reordered, regardless of array order or numeric ids', () => {
    const before = stay(1, 600);
    const after = stay(2, 400);
    const reordered = refs
      .map((d) =>
        d.id === 600
          ? { ...d, date: '2027-03-22', day_number: 22 }
          : d.id === 400
            ? { ...d, date: '2027-03-20', day_number: 20 }
            : d
      )
      .reverse();
    expect(ids(orderTransitStaysByDate(day, refs, [after, before]))).toEqual([1, 2]);
    expect(ids(orderTransitStaysByDate(day, reordered, [before, after]))).toEqual([2, 1]);
  });

  it('counts calendar nights equally across the spring DST boundary', () => {
    const selected = buildDay({ id: 1, date: '2027-03-29' });
    const dates = [selected, buildDay({ id: 2, date: '2027-03-28' }), buildDay({ id: 3, date: '2027-03-30' })];
    expect(ids(orderTransitStaysByDate(selected, dates, [stay(1, 3), stay(2, 2)]))).toEqual([2, 1]);
  });

  it('normalizes reversed interval endpoints consistently with day-range membership', () => {
    expect(ids(orderTransitStaysByDate(day, refs, [stay(1, 700), stay(2, 300, 600)]))).toEqual([2, 1]);
  });

  it('keeps dated stays ahead of undated ones when the selected day has no usable date', () => {
    const selected = { ...day, date: null };
    expect(ids(orderTransitStaysByDate(selected, refs, [stay(1, 99999), stay(3, 300), stay(2, 900)]))).toEqual([
      2, 3, 1,
    ]);
  });

  it('does not mutate the caller list', () => {
    const list = Object.freeze([stay(1, 300), stay(2, 600)]);
    expect(ids(orderTransitStaysByDate(day, refs, list))).toEqual([2, 1]);
    expect(ids([...list])).toEqual([1, 2]);
  });
});
