import { describe, expect, it } from 'vitest';
import { heroTrip, sortTripsByRelevance } from './heroTrip';

const trip = (id: number, start_date: string | null, end_date: string | null) => ({ id, start_date, end_date });

describe('heroTrip', () => {
  const today = '2026-11-06';
  const trips = [
    trip(1, '2026-01-01', '2026-01-05'),
    trip(2, '2026-12-01', '2026-12-05'),
    trip(3, '2026-11-04', '2026-11-12'),
    trip(4, '2026-10-20', '2026-11-18'),
    trip(5, null, null),
  ];

  it('orders running trips first, then the ones coming up, then the rest, latest first', () => {
    expect(sortTripsByRelevance(trips, today).map((t) => t.id)).toEqual([4, 3, 2, 1, 5]);
  });

  it('features the running trip that started first, else the next to come', () => {
    expect(heroTrip(sortTripsByRelevance(trips, today), today)?.id).toBe(4);
    expect(heroTrip(sortTripsByRelevance([trips[0], trips[1]], today), today)?.id).toBe(2);
    expect(heroTrip(sortTripsByRelevance([trips[0], trips[4]], today), today)).toBeNull();
  });
});
