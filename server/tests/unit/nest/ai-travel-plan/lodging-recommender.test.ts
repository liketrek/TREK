/**
 * Lodging is recommended from real provider results around a scheduled stop.
 * It never quotes a rate and a failure is an info warning, not a draft blocker.
 */
import { isLodgingCandidate, recommendLodging } from '../../../../src/nest/ai-travel-plan/lodging-recommender';
import type { PlannerCandidate } from '../../../../src/nest/ai-travel-plan/planner-provider';

import { describe, expect, it, vi } from 'vitest';

const CHECKED_AT = '2026-05-01T00:00:00.000Z';

function candidate(
  id: string,
  name: string,
  category: string | null,
  lat = 30.25,
  lng = 120.16,
  rating: number | null = null,
): PlannerCandidate {
  return {
    place: {
      provider: 'amap',
      providerId: id,
      name,
      lat,
      lng,
      category,
      address: null,
      rating,
      hours: [],
      coordinateSystem: 'wgs84',
    },
    source: { provider: 'amap', sourceId: id, checkedAt: CHECKED_AT, freshness: 'live' },
    address: null,
    category,
    hours: [],
    rating,
  };
}

const anchor = (id: string, lat: number, lng: number) => candidate(id, `景点${id}`, '风景名胜;风景名胜', lat, lng);
const hotel = (id: string, lat: number, lng: number, rating: number | null = null, name = `${id}酒店`) =>
  candidate(id, name, '住宿服务;宾馆酒店', lat, lng, rating);

describe('isLodgingCandidate', () => {
  it('recognises the provider category and common lodging names', () => {
    expect(isLodgingCandidate(hotel('h1', 30, 120))).toBe(true);
    expect(isLodgingCandidate(candidate('h2', '西湖民宿', null, 30, 120))).toBe(true);
    expect(isLodgingCandidate(candidate('r1', '楼外楼', '餐饮服务;中餐厅', 30, 120))).toBe(false);
  });
});

describe('recommendLodging', () => {
  function run(anchors: PlannerCandidate[], searchLodging: ReturnType<typeof vi.fn>, destination = '杭州') {
    return recommendLodging({
      provider: { searchLodging } as never,
      userId: 7,
      destination,
      centre: { lat: 30, lng: 120 },
      anchors,
    });
  }

  it('keeps only lodging and never applies the visit-category filter', async () => {
    const searchLodging = vi.fn(async () => [
      hotel('h1', 30.251, 120.161, 4.5),
      candidate('r1', '楼外楼', '餐饮服务;中餐厅', 30.252, 120.162),
    ]);

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);

    expect(result.areas).toHaveLength(1);
    expect(result.areas[0]?.sampleHotels.map((sample) => sample.place.name)).toEqual(['h1酒店']);
  });

  it('sorts samples by rating then distance and keeps at most three', async () => {
    const searchLodging = vi.fn(async () => [
      hotel('h1', 30.251, 120.161, 4.2),
      hotel('h2', 30.252, 120.162, 4.8),
      hotel('h3', 30.253, 120.163, 3.9),
      hotel('h4', 30.2505, 120.1605, 4.8),
    ]);

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);
    const samples = result.areas[0]?.sampleHotels ?? [];

    expect(samples).toHaveLength(3);
    expect(samples.map((sample) => sample.place.name)).toEqual(['h4酒店', 'h2酒店', 'h1酒店']);
    expect(result.areas[0]?.hotelCount).toBe(4);
    expect(result.areas[0]?.avgRating).toBe(4.4);
  });

  it('takes the area centre from the hotel centroid', async () => {
    const searchLodging = vi.fn(async () => [hotel('h1', 30.1, 120.1, 4), hotel('h2', 30.3, 120.3, 5)]);

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);

    expect(result.areas[0]?.lat).toBeCloseTo(30.2, 5);
    expect(result.areas[0]?.lng).toBeCloseTo(120.2, 5);
  });

  it('falls back to the destination search below two hotels, at a wider radius', async () => {
    const searchLodging = vi.fn(async (_userId: number, query: string) => {
      if (query.startsWith('景点')) return [hotel('h1', 30.251, 120.161, 4.2)];
      return [hotel('h1', 30.251, 120.161, 4.2), hotel('h2', 30.26, 120.17, 4.6)];
    });

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);

    expect(result.areas[0]?.hotelCount).toBe(2);
    expect(searchLodging).toHaveBeenCalledWith(7, '景点a1 酒店', expect.objectContaining({ lat: 30.25 }), 5_000);
    expect(searchLodging).toHaveBeenCalledWith(7, '杭州 酒店', { lat: 30, lng: 120 }, 8_000);
  });

  it('dedupes the same hotel across an anchor result and the fallback', async () => {
    const shared = hotel('h1', 30.251, 120.161, 4.2);
    const searchLodging = vi.fn(async (_userId: number, query: string) =>
      query.startsWith('景点') ? [shared] : [shared, hotel('h2', 30.26, 120.17, 4.6)],
    );

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);

    expect(result.areas[0]?.hotelCount).toBe(2);
    expect(result.areas[0]?.sampleHotels.map((sample) => sample.place.providerId)).toEqual(['h2', 'h1']);
  });

  it('collapses anchors closer than 800m and issues at most four searches', async () => {
    const searchLodging = vi.fn(async () => [hotel('h1', 30.251, 120.161, 4.2)]);
    const anchors = [
      anchor('a1', 30.25, 120.16),
      anchor('a2', 30.2505, 120.1605),
      anchor('a3', 30.31, 120.22),
      anchor('a4', 30.42, 120.33),
    ];

    const result = await run(anchors, searchLodging);

    expect(result.areas.length).toBeLessThanOrEqual(3);
    expect(searchLodging.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('returns an info warning instead of inventing an area when the search fails', async () => {
    const searchLodging = vi.fn(async () => Promise.reject(new Error('quota')));

    const result = await run([anchor('a1', 30.25, 120.16)], searchLodging);

    expect(result.areas).toEqual([]);
    expect(result.warning).toMatchObject({ code: 'lodging_unavailable', severity: 'info' });
  });
});
