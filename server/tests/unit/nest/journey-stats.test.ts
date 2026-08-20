/**
 * The journey-stats arithmetic (#1973).
 *
 * Pure module, so these run against literal arrays rather than a fixture
 * database — which is the whole reason the arithmetic lives apart from the
 * service that fetches the rows.
 */
import { describe, it, expect } from 'vitest';
import {
  collectCountries,
  computeJourneyStats,
  daysBetween,
  furthestFromStart,
  haversine,
  isoDay,
  routeDistance,
  thinRoute,
  MAX_ROUTE_POINTS,
  type StatsInputPoint,
} from '../../../src/nest/journey/journey-stats';

const point = (over: Partial<StatsInputPoint> = {}): StatsInputPoint => ({
  lat: 0, lng: 0, label: '', date: null, country: null, ...over,
});

describe('haversine', () => {
  it('is zero for a point against itself', () => {
    expect(haversine({ lat: 64.14, lng: -21.94 }, { lat: 64.14, lng: -21.94 })).toBe(0);
  });

  it('matches a known great-circle distance', () => {
    // Reykjavík to Akureyri, ~250km as the crow flies.
    const d = haversine({ lat: 64.1466, lng: -21.9426 }, { lat: 65.6885, lng: -18.1262 });
    expect(d).toBeGreaterThan(240_000);
    expect(d).toBeLessThan(260_000);
  });

  it('is symmetric', () => {
    const a = { lat: 48.85, lng: 2.35 };
    const b = { lat: 52.52, lng: 13.4 };
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 6);
  });

  it('handles antipodal points without NaN', () => {
    const d = haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(Number.isFinite(d)).toBe(true);
    // Half the circumference, give or take the radius model.
    expect(d).toBeGreaterThan(20_000_000);
  });
});

describe('routeDistance', () => {
  it('is zero for fewer than two points', () => {
    expect(routeDistance([])).toBe(0);
    expect(routeDistance([{ lat: 1, lng: 1 }])).toBe(0);
  });

  it('sums the legs in order', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    const c = { lat: 0, lng: 2 };
    expect(routeDistance([a, b, c])).toBeCloseTo(haversine(a, b) + haversine(b, c), 3);
  });

  it('counts a there-and-back route twice, not zero', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    expect(routeDistance([a, b, a])).toBeCloseTo(haversine(a, b) * 2, 3);
  });
});

describe('furthestFromStart', () => {
  it('is zero for fewer than two points', () => {
    expect(furthestFromStart([])).toBe(0);
    expect(furthestFromStart([{ lat: 5, lng: 5 }])).toBe(0);
  });

  it('measures from the first stop, not between the extremes', () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 3 },
      { lat: 0, lng: 1 },
    ];
    expect(furthestFromStart(points)).toBeCloseTo(haversine(points[0], points[1]), 3);
  });

  it('finds the furthest even when it is not the last stop', () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 0, lng: 2 },
    ];
    expect(furthestFromStart(points)).toBeCloseTo(haversine(points[0], points[1]), 3);
  });
});

describe('isoDay', () => {
  it('takes the date out of a datetime', () => {
    expect(isoDay('2026-06-02T14:30:00Z')).toBe('2026-06-02');
  });

  it('passes a plain date through', () => {
    expect(isoDay('2026-06-02')).toBe('2026-06-02');
  });

  it('is null for nothing and for nonsense', () => {
    expect(isoDay(null)).toBeNull();
    expect(isoDay(undefined)).toBeNull();
    expect(isoDay('')).toBeNull();
    expect(isoDay('sometime last summer')).toBeNull();
  });
});

describe('daysBetween', () => {
  it('counts a single day as one, not zero', () => {
    expect(daysBetween('2026-06-02', '2026-06-02')).toBe(1);
  });

  it('is inclusive at both ends', () => {
    expect(daysBetween('2026-06-02', '2026-06-04')).toBe(3);
  });

  it('spans a month boundary', () => {
    expect(daysBetween('2026-05-28', '2026-06-02')).toBe(6);
  });

  it('spans a leap day', () => {
    expect(daysBetween('2028-02-27', '2028-03-01')).toBe(4);
  });

  it('is zero when either end is missing', () => {
    expect(daysBetween(null, '2026-06-02')).toBe(0);
    expect(daysBetween('2026-06-02', null)).toBe(0);
    expect(daysBetween(null, null)).toBe(0);
  });

  it('is zero rather than negative when the dates are the wrong way round', () => {
    expect(daysBetween('2026-06-04', '2026-06-02')).toBe(1);
  });
});

describe('thinRoute', () => {
  it('leaves a route within budget alone', () => {
    const points = Array.from({ length: 10 }, (_, i) => i);
    expect(thinRoute(points, 20)).toBe(points);
  });

  it('thins down to exactly the budget', () => {
    const points = Array.from({ length: 1000 }, (_, i) => i);
    expect(thinRoute(points, 50)).toHaveLength(50);
  });

  it('keeps both ends, because they are the start and the end of the trip', () => {
    const points = Array.from({ length: 1000 }, (_, i) => i);
    const thinned = thinRoute(points, 50);
    expect(thinned[0]).toBe(0);
    expect(thinned[thinned.length - 1]).toBe(999);
  });

  it('spaces what it keeps evenly rather than dropping a run', () => {
    const thinned = thinRoute(Array.from({ length: 100 }, (_, i) => i), 5);
    expect(thinned).toEqual([0, 25, 50, 74, 99]);
  });
});

describe('collectCountries', () => {
  it('orders by first visit, so the list retells the route', () => {
    const points = [
      point({ country: 'GT', date: '2026-03-10' }),
      point({ country: 'MX', date: '2026-03-01' }),
      point({ country: 'BZ', date: '2026-03-05' }),
    ];
    expect(collectCountries(points, {}).map(c => c.code)).toEqual(['MX', 'BZ', 'GT']);
  });

  it('counts the stops in each country', () => {
    const points = [
      point({ country: 'IS', date: '2026-06-02' }),
      point({ country: 'IS', date: '2026-06-03' }),
      point({ country: 'FO', date: '2026-06-09' }),
    ];
    const [iceland, faroes] = collectCountries(points, {});
    expect(iceland.places).toBe(2);
    expect(faroes.places).toBe(1);
  });

  it('takes the earliest date as the first visit, whatever order the stops arrive in', () => {
    const points = [
      point({ country: 'FR', date: '2026-07-08' }),
      point({ country: 'FR', date: '2026-05-28' }),
    ];
    expect(collectCountries(points, {})[0].firstVisit).toBe('2026-05-28');
  });

  it('uppercases the code so a lowercase row cannot become a second country', () => {
    const points = [point({ country: 'is' }), point({ country: 'IS' })];
    const countries = collectCountries(points, {});
    expect(countries).toHaveLength(1);
    expect(countries[0].code).toBe('IS');
  });

  it('ignores stops with no country', () => {
    expect(collectCountries([point(), point({ country: null })], {})).toEqual([]);
  });

  it('puts undated countries after dated ones, in the order they appeared', () => {
    const points = [
      point({ country: 'NO' }),
      point({ country: 'SE', date: '2026-01-02' }),
      point({ country: 'DK' }),
    ];
    expect(collectCountries(points, {}).map(c => c.code)).toEqual(['SE', 'NO', 'DK']);
  });

  it('uses the supplied name and falls back to the code', () => {
    const points = [point({ country: 'IS' }), point({ country: 'XX' })];
    const countries = collectCountries(points, { IS: 'Iceland' });
    expect(countries[0].name).toBe('Iceland');
    expect(countries[1].name).toBe('XX');
  });
});

describe('computeJourneyStats', () => {
  const base = {
    journeyId: 7,
    entries: 3,
    photos: 12,
    places: 9,
    tripDates: [],
    countryNames: { IS: 'Iceland' },
  };

  it('carries the counts through untouched', () => {
    const stats = computeJourneyStats({ ...base, points: [] });
    expect(stats.journeyId).toBe(7);
    expect(stats.steps).toBe(3);
    expect(stats.photos).toBe(12);
    expect(stats.places).toBe(9);
  });

  it('takes its dates from the stops when they have them', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [
        point({ lat: 64, lng: -22, date: '2026-06-02' }),
        point({ lat: 65, lng: -18, date: '2026-06-15' }),
      ],
    });
    expect(stats.start).toBe('2026-06-02');
    expect(stats.end).toBe('2026-06-15');
    expect(stats.days).toBe(14);
  });

  /*
   * The case this exists for: a journey assembled from trips that nobody has
   * written entries for still lasted a fortnight, and printing "0 DAYS" over it
   * would be worse than using the trip's own dates.
   */
  it('falls back to the trips dates when no stop is dated', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [point({ lat: 64, lng: -22 })],
      tripDates: [{ start: '2026-06-01', end: '2026-06-10' }],
    });
    expect(stats.start).toBe('2026-06-01');
    expect(stats.end).toBe('2026-06-10');
    expect(stats.days).toBe(10);
  });

  it('takes the widest span across several trips', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [],
      tripDates: [
        { start: '2026-06-05', end: '2026-06-08' },
        { start: '2026-05-28', end: '2026-07-08' },
      ],
    });
    expect(stats.start).toBe('2026-05-28');
    expect(stats.end).toBe('2026-07-08');
  });

  it('has no dates at all when nothing carries one', () => {
    const stats = computeJourneyStats({ ...base, points: [point({ lat: 1, lng: 1 })] });
    expect(stats.start).toBeNull();
    expect(stats.end).toBeNull();
    expect(stats.days).toBe(0);
  });

  it('rounds distance and furthest to whole metres', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [point({ lat: 0, lng: 0 }), point({ lat: 0.1234, lng: 0.4321 })],
    });
    expect(Number.isInteger(stats.distance)).toBe(true);
    expect(Number.isInteger(stats.furthest)).toBe(true);
    expect(stats.distance).toBeGreaterThan(0);
  });

  it('caps the route and reports the capped points', () => {
    const many = Array.from({ length: 900 }, (_, i) => point({ lat: i * 0.01, lng: 0 }));
    const stats = computeJourneyStats({ ...base, points: many });
    expect(stats.points).toHaveLength(MAX_ROUTE_POINTS);
  });

  it('measures distance over the thinned route, so the figure matches the drawn line', () => {
    const many = Array.from({ length: 900 }, (_, i) => point({ lat: i * 0.01, lng: 0 }));
    const stats = computeJourneyStats({ ...base, points: many });
    const drawn = routeDistance(stats.points);
    expect(stats.distance).toBe(Math.round(drawn));
  });

  it('drops stops with unusable coordinates from the arithmetic but keeps the counts', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [
        point({ lat: 0, lng: 0, date: '2026-01-01' }),
        point({ lat: Number.NaN, lng: 5, date: '2026-01-02' }),
        point({ lat: 0, lng: 1, date: '2026-01-03' }),
      ],
    });
    expect(stats.distance).toBe(Math.round(haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })));
    expect(stats.points).toHaveLength(3);
  });

  it('keeps each stop label and date on the route it returns', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [point({ lat: 64, lng: -22, label: 'Reykjavík', date: '2026-06-02', country: 'IS' })],
    });
    expect(stats.points[0]).toEqual({
      // `tripId` is null when the stop came from an entry nobody linked to a
      // trip, which is every stop here — the field is what lets a book print a
      // map of one trip out of several.
      lat: 64, lng: -22, label: 'Reykjavík', date: '2026-06-02', country: 'IS', tripId: null, photoId: null,
    });
  });

  it('names the countries from the map it was given', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [point({ lat: 64, lng: -22, country: 'IS', date: '2026-06-02' })],
    });
    expect(stats.countries).toEqual([
      { code: 'IS', name: 'Iceland', places: 1, firstVisit: '2026-06-02' },
    ]);
  });

  it('is all zeroes and empty lists for a journey with nothing in it', () => {
    const stats = computeJourneyStats({
      journeyId: 1, points: [], entries: 0, photos: 0, places: 0, tripDates: [], countryNames: {},
    });
    expect(stats).toEqual({
      journeyId: 1,
      distance: 0,
      days: 0,
      steps: 0,
      photos: 0,
      places: 0,
      furthest: 0,
      countries: [],
      points: [],
      trips: [],
      start: null,
      end: null,
    });
  });
});
