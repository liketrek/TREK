import { renderHook, waitFor } from '@testing-library/react';
import type { TourSourceHint } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSourceHint } from './useSourceHint';

const repo = vi.hoisted(() => ({ sourceHint: vi.fn() }));
vi.mock('../../../repo/wandererRepo', () => ({ wandererRepo: repo }));

const hint: TourSourceHint = {
  state: 'possible_change',
  changes: [],
  reason: null,
  externalUpdated: '2026-10-14',
  checkedAt: '2026-10-20T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.sourceHint.mockResolvedValue(hint);
});

describe('useSourceHint (WAN-02)', () => {
  it('reads the hint of the tour it is asked for, and asks again for another tour', async () => {
    const { result, rerender } = renderHook(({ placeId }) => useSourceHint({ tripId: 1, placeId, enabled: true }), {
      initialProps: { placeId: 7 },
    });
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual(hint));
    expect(repo.sourceHint).toHaveBeenCalledWith(1, 7, expect.any(AbortSignal));

    repo.sourceHint.mockResolvedValue(null);
    rerender({ placeId: 8 });
    expect(result.current).toBeNull();
    await waitFor(() => expect(repo.sourceHint).toHaveBeenCalledWith(1, 8, expect.any(AbortSignal)));
  });

  it('asks nothing where the hint could lead nowhere, and shows none after a failed read', async () => {
    const off = renderHook(() => useSourceHint({ tripId: 1, placeId: 7, enabled: false }));
    expect(off.result.current).toBeNull();
    expect(repo.sourceHint).not.toHaveBeenCalled();

    repo.sourceHint.mockRejectedValue(new Error('down'));
    const failed = renderHook(() => useSourceHint({ tripId: 1, placeId: 7, enabled: true }));
    await waitFor(() => expect(repo.sourceHint).toHaveBeenCalled());
    expect(failed.result.current).toBeNull();
  });
});
