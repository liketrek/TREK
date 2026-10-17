import { act, renderHook } from '@testing-library/react';
import type { TourListItem, TourSourceCheckResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSourceCheck } from './useSourceCheck';

const repo = vi.hoisted(() => ({ checkSource: vi.fn(), importTrail: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/wandererRepo', () => ({
  wandererRepo: repo,
  wandererErrorCode: (error: unknown) => (error as { code?: string })?.code ?? 'unknown',
}));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const changed: TourSourceCheckResponse = {
  state: 'changed',
  changes: ['route'],
  externalUpdated: '2026-10-14',
  importedUpdated: '2026-10-01',
  editedLocally: false,
  reimport: { trailId: 't1', contentHash: 'h' },
};
const newTour = { place_id: 99, name: 'Ridge' } as TourListItem;

beforeEach(() => {
  vi.clearAllMocks();
  repo.checkSource.mockResolvedValue(changed);
  repo.importTrail.mockResolvedValue({ tour: newTour });
});

describe('useSourceCheck (MF-03)', () => {
  it('asks only on purpose, and offers the reimport for a change when someone takes it in', async () => {
    const onReimported = vi.fn();
    const { result } = renderHook(() => useSourceCheck({ tripId: 1, placeId: 7, onReimported }));
    expect(repo.checkSource).not.toHaveBeenCalled();
    expect(result.current.result).toBeNull();

    await act(async () => {
      await result.current.check();
    });
    expect(repo.checkSource).toHaveBeenCalledWith(1, 7);
    expect(result.current.result).toEqual(changed);
    expect(result.current.canReimport).toBe(true);

    act(() => result.current.askReimport());
    expect(result.current.confirming).toBe(true);
    await act(async () => {
      await result.current.reimport();
    });
    expect(repo.importTrail).toHaveBeenCalledWith(1, { trailId: 't1', contentHash: 'h' });
    expect(onReimported).toHaveBeenCalledWith(newTour);
    expect(toast.success).toHaveBeenCalled();
    expect(result.current.result).toBeNull();
    expect(result.current.confirming).toBe(false);
  });

  it('without anyone to take the new snapshot in, or for an unchanged trail, offers no reimport', async () => {
    repo.checkSource.mockResolvedValue({ ...changed, state: 'unchanged', changes: [], reimport: null });
    const unchanged = renderHook(() => useSourceCheck({ tripId: 1, placeId: 7, onReimported: vi.fn() }));
    await act(async () => {
      await unchanged.result.current.check();
    });
    expect(unchanged.result.current.canReimport).toBe(false);

    repo.checkSource.mockResolvedValue(changed);
    const nobody = renderHook(() => useSourceCheck({ tripId: 1, placeId: 7 }));
    await act(async () => {
      await nobody.result.current.check();
    });
    expect(nobody.result.current.canReimport).toBe(false);
  });

  it('a failed check or reimport says so and changes nothing', async () => {
    repo.checkSource.mockRejectedValueOnce({ code: 'unreachable' });
    const onReimported = vi.fn();
    const { result } = renderHook(() => useSourceCheck({ tripId: 1, placeId: 7, onReimported }));
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.result).toBeNull();
    expect(toast.error).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.check();
    });
    repo.importTrail.mockRejectedValueOnce({ code: 'preview_stale' });
    await act(async () => {
      await result.current.reimport();
    });
    expect(onReimported).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it('another tour in the same dialog starts unchecked', async () => {
    const { result, rerender } = renderHook(({ placeId }) => useSourceCheck({ tripId: 1, placeId }), {
      initialProps: { placeId: 7 },
    });
    await act(async () => {
      await result.current.check();
    });
    rerender({ placeId: 8 });
    expect(result.current.result).toBeNull();
  });
});
