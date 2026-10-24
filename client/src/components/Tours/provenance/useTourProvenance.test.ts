import { renderHook, waitFor } from '@testing-library/react';
import type { TourListItem, TourProvenance } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourProvenance } from './useTourProvenance';

const repo = vi.hoisted(() => ({ detail: vi.fn() }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: repo }));

const provenance: TourProvenance = {
  origin: 'trek',
  createdAt: null,
  source: { kind: 'trek' },
  derivedFrom: null,
  plannedOver: false,
  editedLocally: null,
};
const tour = { place_id: 7, name: 'Ridge', distance: 4 } as TourListItem;

beforeEach(() => {
  vi.clearAllMocks();
  repo.detail.mockResolvedValue({ tour, waypoints: [], provenance });
});

describe('useTourProvenance (P2C-02)', () => {
  it('reads the provenance with the detail, and asks again when the tour changes', async () => {
    const { result, rerender } = renderHook(({ current }) => useTourProvenance(1, current), {
      initialProps: { current: tour },
    });
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual(provenance));
    expect(repo.detail).toHaveBeenCalledWith(1, 7, expect.any(AbortSignal));

    rerender({ current: { ...tour, name: 'Renamed' } });
    await waitFor(() => expect(repo.detail).toHaveBeenCalledTimes(2));
  });

  it('shows none when the detail cannot be had, or carries none', async () => {
    repo.detail.mockRejectedValueOnce(new Error('offline'));
    const failed = renderHook(() => useTourProvenance(1, tour));
    await waitFor(() => expect(repo.detail).toHaveBeenCalled());
    expect(failed.result.current).toBeNull();

    repo.detail.mockResolvedValueOnce({ tour, waypoints: [] });
    const none = renderHook(() => useTourProvenance(1, { ...tour, place_id: 8 }));
    await waitFor(() => expect(repo.detail).toHaveBeenCalledTimes(2));
    expect(none.result.current).toBeNull();
  });
});
