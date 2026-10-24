// FE-STA2-HOOK-001 to FE-STA2-HOOK-009
// STA-02: the user's own tour activities are read when the tab is first shown,
// narrowed by period and type, and a tour left out shows at once and comes back
// with a message when the server refuses.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourActivityStatsEntry, TourActivityStatsResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourActivityStats } from './useTourActivityStats';

const repo = vi.hoisted(() => ({ get: vi.fn(), setExcluded: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/tourActivityStatsRepo', () => ({
  tourActivityStatsRepo: repo,
  TourActivityStatsOfflineError: class TourActivityStatsOfflineError extends Error {},
}));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

function entry(overrides: Partial<TourActivityStatsEntry> = {}): TourActivityStatsEntry {
  return {
    place_id: 1,
    name: 'Ridge',
    tour_type: 'hike',
    trip: { id: 5, title: 'Alps' },
    derived_from_place_id: null,
    date: '2026-07-02',
    basis: 'plan',
    track: null,
    day_count: 1,
    distance_km: 10,
    ascent_m: 500,
    descent_m: 400,
    excluded: false,
    ...overrides,
  };
}

const stats: TourActivityStatsResponse = {
  entries: [
    entry(),
    entry({ place_id: 2, name: 'Lake', tour_type: 'kayak', date: '2025-08-01', distance_km: 8 }),
    entry({ place_id: 3, name: 'Summit', date: '2026-11-01' }),
  ],
  uncounted: { unassigned: 0, undated: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 20, 12));
  repo.get.mockResolvedValue(stats);
});
afterEach(() => vi.useRealTimers());

describe('useTourActivityStats', () => {
  it('FE-STA2-HOOK-001: reads nothing until the tab is shown, then sums what is done', async () => {
    const { result, rerender } = renderHook(({ active }) => useTourActivityStats(active), {
      initialProps: { active: false },
    });
    expect(result.current.status).toBe('idle');
    expect(repo.get).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.summary?.totals.count).toBe(2);
    expect(result.current.summary?.totals.distanceKm.value).toBe(18);
    expect(result.current.summary?.upcoming).toBe(1);
    expect(result.current.periods).toEqual(['all', 'thisYear', 'last12', 'year:2025']);
    expect(result.current.types).toEqual(['all', 'hike', 'kayak']);
  });

  it('FE-STA2-HOOK-002: narrows by period and by type', async () => {
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.setPeriod('thisYear'));
    expect(result.current.summary?.done.map((item) => item.place_id)).toEqual([1]);
    act(() => {
      result.current.setPeriod('all');
      result.current.setType('kayak');
    });
    expect(result.current.summary?.done.map((item) => item.place_id)).toEqual([2]);
  });

  it('FE-STA2-HOOK-003: offline and failed reads are told apart, and a retry reads again', async () => {
    const { TourActivityStatsOfflineError } = await import('../../../repo/tourActivityStatsRepo');
    repo.get.mockRejectedValueOnce(new TourActivityStatsOfflineError());
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('offline'));

    repo.get.mockRejectedValueOnce(new Error('boom'));
    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(repo.get).toHaveBeenCalledTimes(3);
  });

  it('FE-STA2-HOOK-004: leaving a tour out shows at once and takes the server answer', async () => {
    let answer: (value: TourActivityStatsResponse) => void = () => undefined;
    repo.setExcluded.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let write: Promise<void> = Promise.resolve();
    act(() => {
      write = result.current.setExcluded(entry(), true);
    });
    expect(result.current.pending.has(1)).toBe(true);
    expect(result.current.summary?.totals.count).toBe(1);
    expect(repo.setExcluded).toHaveBeenCalledWith({ place_id: 1, excluded: true });

    await act(async () => {
      const entries = stats.entries.map((item) => (item.place_id === 1 ? { ...item, excluded: true } : item));
      answer({ ...stats, entries });
      await write;
    });
    expect(result.current.pending.size).toBe(0);
    expect(result.current.summary?.done.find((item) => item.place_id === 1)?.excluded).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-STA2-HOOK-005: a refused exclusion counts the tour again and says so', async () => {
    repo.setExcluded.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.setExcluded(entry(), true);
    });
    expect(result.current.summary?.totals.count).toBe(2);
    expect(result.current.pending.size).toBe(0);
    expect(toast.error).toHaveBeenCalledWith('tours.stats.excludeFailed');
  });

  it('FE-STA2-HOOK-006: a read answered after the tab went away is dropped', async () => {
    let answer: (value: TourActivityStatsResponse) => void = () => undefined;
    repo.get.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result, unmount } = renderHook(() => useTourActivityStats(true));
    expect(result.current.status).toBe('loading');
    unmount();
    await act(async () => answer(stats));
    expect(result.current.data).toBeNull();
  });

  it('FE-STA2-HOOK-007: a write before the first read leaves the empty state empty', async () => {
    repo.get.mockReturnValue(new Promise(() => undefined));
    repo.setExcluded.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTourActivityStats(true));
    await act(async () => {
      await result.current.setExcluded(entry(), true);
    });
    expect(result.current.data).toBeNull();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('FE-STA2-HOOK-008: an older exclusion answered last never puts a newer one back', async () => {
    const answers: Array<(value: TourActivityStatsResponse) => void> = [];
    repo.setExcluded.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const excludedOf = (placeId: number) =>
      result.current.data?.entries.find((item) => item.place_id === placeId)?.excluded;
    const withExcluded = (...ids: number[]) => ({
      ...stats,
      entries: stats.entries.map((item) => ({ ...item, excluded: ids.includes(item.place_id) })),
    });

    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.setExcluded(entry(), true);
    });
    act(() => {
      second = result.current.setExcluded(stats.entries[1] as TourActivityStatsEntry, true);
    });
    // The second answer comes first and carries both; the first, from before the second, only its own.
    await act(async () => {
      answers[1]?.(withExcluded(1, 2));
      await second;
    });
    await act(async () => {
      answers[0]?.(withExcluded(1));
      await first;
    });
    expect(excludedOf(1)).toBe(true);
    expect(excludedOf(2)).toBe(true);

    // The other way round: the first comes first, without the second still on its way, which stays left out.
    act(() => {
      first = result.current.setExcluded(entry(), false);
    });
    act(() => {
      second = result.current.setExcluded(stats.entries[1] as TourActivityStatsEntry, false);
    });
    await act(async () => {
      answers[2]?.(withExcluded(2));
      await first;
    });
    expect(excludedOf(1)).toBe(false);
    expect(excludedOf(2)).toBe(false);
    await act(async () => {
      answers[3]?.(withExcluded());
      await second;
    });
    expect(excludedOf(2)).toBe(false);
  });

  it('FE-STA2-HOOK-009: a read asked before an exclusion and answered after it does not undo it', async () => {
    const { result } = renderHook(() => useTourActivityStats(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    let read: (value: TourActivityStatsResponse) => void = () => undefined;
    repo.get.mockReturnValue(new Promise((resolve) => (read = resolve)));
    act(() => result.current.retry());
    repo.setExcluded.mockResolvedValue({
      ...stats,
      entries: stats.entries.map((item) => (item.place_id === 1 ? { ...item, excluded: true } : item)),
    });
    await act(async () => {
      await result.current.setExcluded(entry(), true);
    });
    await act(async () => read(stats));
    expect(result.current.status).toBe('ready');
    expect(result.current.data?.entries.find((item) => item.place_id === 1)?.excluded).toBe(true);
  });
});
