import { describe, it, expect } from 'vitest';
import { computeJourneyStats, type StatsInputPoint } from '../../../src/nest/journey/journey-stats';

/**
 * Which trip each stop belongs to, and what that lets a book print (#1973).
 *
 * A journey is a collection of trips. Until now the route was one flat list, so
 * a book could only ever print a single map of everything — and on a journey
 * that went to Iceland in June and Portugal in September, "everything" means a
 * line across the Atlantic that nobody travelled, usually the longest one on
 * the page.
 *
 * The count per trip is the load-bearing part: a panel offers a map per trip
 * and has to know which of them would come out empty, and it has to count what
 * survives thinning rather than what went in.
 */

const point = (over: Partial<StatsInputPoint> = {}): StatsInputPoint => ({
  lat: 64, lng: -22, label: '', date: null, country: null, tripId: null, ...over,
});

const base = {
  journeyId: 1,
  entries: 0,
  photos: 0,
  places: 0,
  tripDates: [],
  countryNames: { IS: 'Iceland', PT: 'Portugal' },
};

describe('the trips behind a journey', () => {
  it('carries the trip onto every stop of the route', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [
        point({ lat: 64, lng: -22, tripId: 11 }),
        point({ lat: 38, lng: -9, tripId: 22 }),
      ],
    });
    expect(stats.points.map(p => p.tripId)).toEqual([11, 22]);
  });

  it('leaves the trip null for a stop nobody linked to one', () => {
    const stats = computeJourneyStats({ ...base, points: [point()] });
    expect(stats.points[0].tripId).toBeNull();
  });

  it('counts how many stops each trip put on the route', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [
        point({ lat: 64, lng: -22, tripId: 11 }),
        point({ lat: 65, lng: -18, tripId: 11 }),
        point({ lat: 38, lng: -9, tripId: 22 }),
      ],
      trips: [
        { id: 11, title: 'Iceland', start: '2026-06-02', end: '2026-06-14', points: 0 },
        { id: 22, title: 'Portugal', start: '2026-09-04', end: '2026-09-12', points: 0 },
      ],
    });
    expect(stats.trips.map(t => [t.title, t.points])).toEqual([['Iceland', 2], ['Portugal', 1]]);
  });

  /*
   * A linked trip whose places carry no coordinates contributes nothing to the
   * line, and a panel that offered a map of it would place an empty frame.
   */
  it('reports zero for a linked trip that put nothing on the route', () => {
    const stats = computeJourneyStats({
      ...base,
      points: [point({ tripId: 11 })],
      trips: [
        { id: 11, title: 'Iceland', start: null, end: null, points: 0 },
        { id: 33, title: 'A trip nobody wrote about', start: null, end: null, points: 0 },
      ],
    });
    expect(stats.trips.find(t => t.id === 33)!.points).toBe(0);
  });

  /*
   * Counted after thinning rather than before. A trip with four hundred and
   * one stops keeps four hundred, and a panel saying 401 would be counting
   * something the map does not draw.
   */
  it('counts the stops that survive the route budget, not the ones that went in', () => {
    const many = Array.from({ length: 500 }, (_, i) => point({ lat: 60 + i * 0.01, lng: -20, tripId: 11 }));
    const stats = computeJourneyStats({
      ...base,
      points: many,
      trips: [{ id: 11, title: 'A long one', start: null, end: null, points: 0 }],
    });
    expect(stats.points).toHaveLength(400);
    expect(stats.trips[0].points).toBe(400);
  });

  it('has an empty trip list when it was given none', () => {
    const stats = computeJourneyStats({ ...base, points: [point()] });
    expect(stats.trips).toEqual([]);
  });
});
