import { renderHook, waitFor } from '@testing-library/react';
import type { TravelPlanDraftDay, TravelPlanDraftItem, TravelPlanLeg } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraftRoadRoutes } from './useDraftRoadRoutes';

const relay = vi.hoisted(() => ({ ask: vi.fn() }));
vi.mock('../../repo/valhallaRelayRepo', () => ({ valhallaRelayRepo: relay }));

/** Two stops about 15 km apart, encoded at precision 6 as the relay answers. */
const SHAPE = '_gvghAost_vE_vdGodeI';
const TWO_STOPS: [number, number][] = [
  [38.416, 112.733],
  [38.55, 112.9],
];

function item(lat: number, lng: number, mode: TravelPlanLeg['mode'] | null): TravelPlanDraftItem {
  return {
    place: {
      provider: 'amap',
      providerId: `${lat},${lng}`,
      name: '停靠点',
      lat,
      lng,
      category: null,
      address: null,
      rating: null,
      hours: [],
      coordinateSystem: 'wgs84',
    },
    arriveAt: null,
    leaveAt: null,
    activity: null,
    travelFromPrevious: mode ? { mode, minutes: 20, distanceMeters: 15_000 } : null,
    estimatedCostCny: null,
    source: { provider: 'amap', sourceId: null, checkedAt: '2026-11-19 00:00:00', freshness: 'live' },
  };
}

function day(items: TravelPlanDraftItem[]): TravelPlanDraftDay {
  return { date: '2026-11-20', items };
}

function routeAnswer(shape: string): Response {
  return new Response(JSON.stringify({ trip: { legs: [{ shape }] } }), { status: 200 });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDraftRoadRoutes', () => {
  it('DRAFTROAD-001: draws a drive along the answered road, not the straight hop', async () => {
    relay.ask.mockResolvedValue(routeAnswer(SHAPE));
    const days = [day([item(38.416, 112.733, null), item(38.55, 112.9, 'drive')])];

    const { result } = renderHook(() => useDraftRoadRoutes(days));

    await waitFor(() => expect(result.current.sketchOnly).toBe(false));
    expect(relay.ask).toHaveBeenCalledTimes(1);
    expect(relay.ask).toHaveBeenCalledWith(
      'route',
      {
        locations: [
          { lat: 38.416, lon: 112.733 },
          { lat: 38.55, lon: 112.9 },
        ],
        costing: 'auto',
      },
      expect.any(AbortSignal)
    );
    expect(result.current.lines).toEqual([TWO_STOPS]);
  });

  it('DRAFTROAD-002: a train leg is never asked of a road router and keeps its sketch', async () => {
    const days = [day([item(31.1, 121.1, null), item(31.2, 121.2, 'train'), item(31.3, 121.3, 'train')])];

    const { result } = renderHook(() => useDraftRoadRoutes(days));

    expect(result.current.sketchOnly).toBe(true);
    expect(result.current.lines).toEqual([
      [
        [31.1, 121.1],
        [31.2, 121.2],
        [31.3, 121.3],
      ],
    ]);
    expect(relay.ask).not.toHaveBeenCalled();
  });

  it('DRAFTROAD-003: a refused question leaves the straight sketch, asked once', async () => {
    relay.ask.mockResolvedValue(new Response('no way', { status: 502 }));
    const days = [day([item(32.1, 122.1, null), item(32.2, 122.2, 'walk')])];

    const { result, rerender } = renderHook(() => useDraftRoadRoutes(days));
    await waitFor(() => expect(relay.ask).toHaveBeenCalledTimes(1));

    rerender();
    expect(result.current.sketchOnly).toBe(true);
    expect(result.current.lines).toEqual([
      [
        [32.1, 122.1],
        [32.2, 122.2],
      ],
    ]);
    expect(relay.ask).toHaveBeenCalledTimes(1);
  });

  it('DRAFTROAD-004: the same stops seen again are drawn from the session cache, not asked again', () => {
    // The stops DRAFTROAD-001 asked for, so this mount finds the answer cached.
    const days = [day([item(38.416, 112.733, null), item(38.55, 112.9, 'drive')])];

    const { result } = renderHook(() => useDraftRoadRoutes(days));

    expect(result.current.sketchOnly).toBe(false);
    expect(result.current.lines).toEqual([TWO_STOPS]);
    expect(relay.ask).not.toHaveBeenCalled();
  });

  it('DRAFTROAD-005: each line carries the day it belongs to, so the map can colour days apart', () => {
    relay.ask.mockResolvedValue(new Response('no way', { status: 502 }));
    const days = [
      day([item(33.1, 123.1, null), item(33.2, 123.2, 'walk')]),
      day([item(34.1, 124.1, null), item(34.2, 124.2, 'train')]),
    ];

    const { result } = renderHook(() => useDraftRoadRoutes(days));

    expect(result.current.lineDays).toEqual([0, 1]);
  });
});
