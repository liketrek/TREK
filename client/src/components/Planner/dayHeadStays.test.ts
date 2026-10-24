import { buildDay } from '../../../tests/helpers/factories';
import type { Accommodation } from '../../types';
import { dayHeadStays } from './dayHeadStays';

const days = [
  buildDay({ id: 10, day_number: 1, date: '2025-06-01' }),
  buildDay({ id: 11, day_number: 2, date: '2025-06-02' }),
  buildDay({ id: 12, day_number: 3, date: '2025-06-03' }),
];
const stay = (id: number, start: number, end: number) =>
  ({ id, trip_id: 1, start_day_id: start, end_day_id: end, place_id: id, place_name: `Stay ${id}` }) as Accommodation;

describe('dayHeadStays', () => {
  it('orders a day check-out first, the stays running through next, check-in last', () => {
    const accommodations = [stay(1, 11, 12), stay(2, 10, 12), stay(3, 10, 11)];
    expect(dayHeadStays(accommodations, days[1], days).map((a) => a.id)).toEqual([3, 2, 1]);
  });

  it('leaves out the stays that do not cover the day', () => {
    expect(dayHeadStays([stay(1, 11, 12)], days[0], days)).toEqual([]);
  });
});
