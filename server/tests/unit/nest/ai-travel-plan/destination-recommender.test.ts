/**
 * Discovery ranks the curated catalog, proves the shortlist on the map, and
 * returns at most three cities. It never invents a city outside the catalog.
 */
import { recommendDestinations } from '../../../../src/nest/ai-travel-plan/destination-recommender';
import type { PlannerCandidate } from '../../../../src/nest/ai-travel-plan/planner-provider';
import type { DestinationIdeaRequest } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const CHECKED_AT = '2026-05-01T00:00:00.000Z';

function placeAt(lat: number, lng: number, name = '景点'): PlannerCandidate {
  return {
    place: {
      provider: 'amap',
      providerId: `${name}:${lat}:${lng}`,
      name,
      lat,
      lng,
      category: '风景名胜',
      address: null,
      rating: null,
      hours: [],
      coordinateSystem: 'wgs84',
    },
    source: { provider: 'amap', sourceId: name, checkedAt: CHECKED_AT, freshness: 'live' },
    address: null,
    category: '风景名胜',
    hours: [],
    rating: null,
  };
}

function request(overrides: Partial<DestinationIdeaRequest> = {}): DestinationIdeaRequest {
  return { travelers: 2, days: 3, month: 11, interests: [], ...overrides };
}

function run(input: DestinationIdeaRequest, search: ReturnType<typeof vi.fn>) {
  return recommendDestinations({ userId: 7, request: input, provider: { search } as never });
}

describe('recommendDestinations', () => {
  it('puts an interest match first and explains why', async () => {
    const search = vi.fn(async (_userId: number, _query: string, bias: { lat: number; lng: number }) => [
      placeAt(bias.lat, bias.lng),
    ]);

    const ideas = await run(request({ interests: ['熊猫', '美食'] }), search);

    expect(ideas[0]?.name).toBe('成都');
    expect(ideas[0]?.reasons.join('')).toContain('兴趣匹配');
    expect(ideas[0]?.reasons.join('')).toContain('熊猫');
  });

  it('returns at most three ideas, each with a rule-based budget', async () => {
    const search = vi.fn(async (_userId: number, _query: string, bias: { lat: number; lng: number }) => [
      placeAt(bias.lat, bias.lng),
    ]);

    const ideas = await run(request({ days: 5 }), search);

    expect(ideas).toHaveLength(3);
    for (const idea of ideas) {
      expect(idea.suggestedDays).toBe(5);
      expect(idea.estimatedBudgetCny.min).toBeGreaterThan(0);
      expect(idea.estimatedBudgetCny.max).toBeGreaterThanOrEqual(idea.estimatedBudgetCny.min);
    }
  });

  it('drops a catalog city the map cannot confirm within 100 km', async () => {
    const search = vi.fn(async (_userId: number, query: string, bias: { lat: number; lng: number }) =>
      query.startsWith('北京') ? [placeAt(42, 120)] : [placeAt(bias.lat, bias.lng)],
    );

    const ideas = await run(request({ interests: ['历史'] }), search);

    expect(ideas).toHaveLength(3);
    expect(ideas.map((idea) => idea.id)).not.toContain('beijing');
  });

  it('fails open when the map provider errors, so an outage cannot empty the list', async () => {
    const search = vi.fn(async () => Promise.reject(new Error('quota')));

    const ideas = await run(request(), search);

    expect(ideas).toHaveLength(3);
  });
});
