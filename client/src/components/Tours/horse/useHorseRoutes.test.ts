import { act, renderHook } from '@testing-library/react';
import { HORSE_ROUTES_ATTRIBUTION, type HorseRoute } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { publishTourMapViewport } from '../../../store/tourMapViewportStore';
import { horseRouteBbox, useHorseRoutes } from './useHorseRoutes';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../../../repo/horseRouteRepo', () => ({ horseRouteRepo: repo }));

// FE-HORSE-ROUTES-HOOK-001 to FE-HORSE-ROUTES-HOOK-006

const VIEW = { south: 47.1, west: 11.2, north: 47.3, east: 11.5 };
const ROUTE: HorseRoute = {
  id: 'relation/42',
  name: 'Reitweg',
  ref: null,
  osmUrl: 'https://www.openstreetmap.org/relation/42',
  continues: false,
  sections: [
    {
      number: 1,
      geometry: [
        [47.15, 11.25],
        [47.16, 11.25],
      ],
      length_m: 1112,
      access: [],
      signposted: null,
    },
  ],
};
const answer = (routes: HorseRoute[], truncated = false) => ({
  routes,
  truncated,
  source: 'openstreetmap' as const,
  attribution: HORSE_ROUTES_ATTRIBUTION,
});

beforeEach(() => {
  repo.list.mockReset();
  publishTourMapViewport(VIEW);
});

describe('useHorseRoutes (HOR-01)', () => {
  it('FE-HORSE-ROUTES-HOOK-001: looks only when asked, in the view the map reported', async () => {
    repo.list.mockResolvedValue(answer([ROUTE], true));
    const { result } = renderHook(() => useHorseRoutes(7));
    expect(result.current.status).toBe('idle');
    expect(repo.list).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.search();
    });
    expect(repo.list).toHaveBeenCalledWith(7, '47.10000,11.20000,47.30000,11.50000', expect.any(AbortSignal));
    expect(result.current).toMatchObject({ status: 'ready', routes: [ROUTE], truncated: true, stale: false });
  });

  it('FE-HORSE-ROUTES-HOOK-002: asks to zoom in rather than send a view too wide, or none at all', async () => {
    const { result } = renderHook(() => useHorseRoutes(7));
    act(() => publishTourMapViewport({ south: 46, west: 11, north: 47, east: 11.4 }));
    await act(async () => {
      await result.current.search();
    });
    expect(result.current.status).toBe('zoom');
    act(() => publishTourMapViewport(null));
    await act(async () => {
      await result.current.search();
    });
    expect(result.current.status).toBe('zoom');
    expect(repo.list).not.toHaveBeenCalled();
  });

  it('FE-HORSE-ROUTES-HOOK-003: a failed search keeps the routes found before', async () => {
    repo.list.mockResolvedValueOnce(answer([ROUTE])).mockRejectedValueOnce(new Error('502'));
    const { result } = renderHook(() => useHorseRoutes(7));
    await act(async () => {
      await result.current.search();
    });
    await act(async () => {
      await result.current.search();
    });
    expect(result.current).toMatchObject({ status: 'failed', routes: [ROUTE] });
  });

  it('FE-HORSE-ROUTES-HOOK-004: offline it says so instead of failing', async () => {
    repo.list.mockRejectedValue(new OnlineOnlyError());
    const { result } = renderHook(() => useHorseRoutes(7));
    await act(async () => {
      await result.current.search();
    });
    expect(result.current.status).toBe('offline');
  });

  it('FE-HORSE-ROUTES-HOOK-005: says the routes shown are from another view once the map moved', async () => {
    repo.list.mockResolvedValue(answer([]));
    const { result } = renderHook(() => useHorseRoutes(7));
    await act(async () => {
      await result.current.search();
    });
    expect(result.current.stale).toBe(false);
    act(() => publishTourMapViewport({ ...VIEW, north: 47.31 }));
    expect(result.current.stale).toBe(true);
  });

  it('FE-HORSE-ROUTES-HOOK-006: an answer to a search given up on is dropped', async () => {
    let first: (value: unknown) => void = () => undefined;
    repo.list
      .mockReturnValueOnce(
        new Promise((resolve) => {
          first = resolve;
        })
      )
      .mockResolvedValueOnce(answer([]));
    const { result } = renderHook(() => useHorseRoutes(7));
    let earlier: Promise<void> = Promise.resolve();
    act(() => {
      earlier = result.current.search();
    });
    await act(async () => {
      await result.current.search();
    });
    await act(async () => {
      first(answer([ROUTE]));
      await earlier;
    });
    expect(result.current.routes).toEqual([]);
    expect(horseRouteBbox(VIEW)).toBe('47.10000,11.20000,47.30000,11.50000');
  });
});
