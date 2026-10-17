// FE-PADDLE-REGION-LOAD-001 to 005: the planner fetches the water data of a place no region covers (PAD-11C).
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PaddleRegionLoadState } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const load = vi.fn();
vi.mock('../../../repo/paddleRegionLoadRepo', () => ({
  paddleRegionLoadRepo: { load: (...args: unknown[]) => load(...args) },
}));

const { usePaddleRegionLoad } = await import('./usePaddleRegionLoad');

const REF = { id: 'oberpfalz', name: 'Oberpfalz' };
const AT = { lat: 49.0123456, lng: 12.0987654 };
const failures = [
  { index: 0, code: 'no_region' as const, at: AT },
  { index: 1, code: 'no_region' as const, at: AT },
  { index: 2, code: 'no_water_path' as const, at: null },
];
const loading = (fraction: number): PaddleRegionLoadState => ({
  state: 'loading',
  region: REF,
  progress: { phase: 'download', fraction },
  ahead: 0,
});

describe('usePaddleRegionLoad', () => {
  beforeEach(() => load.mockReset());
  afterEach(() => vi.useRealTimers());

  it('FE-PADDLE-REGION-LOAD-001: asks once per place, and shows its state on every leg ending there', async () => {
    load.mockResolvedValue([loading(0.4)]);
    const { result } = renderHook(() => usePaddleRegionLoad(failures, vi.fn()));
    await waitFor(() => expect(result.current.byLeg.get(0)).toEqual(loading(0.4)));
    expect(load).toHaveBeenCalledWith([{ lat: 49.01235, lng: 12.09877 }], false, expect.any(AbortSignal));
    expect(result.current.byLeg.get(1)).toEqual(loading(0.4));
    expect(result.current.byLeg.has(2)).toBe(false);
  });

  it('FE-PADDLE-REGION-LOAD-002: follows a load and plans again once, when the data is there', async () => {
    vi.useFakeTimers();
    load.mockResolvedValueOnce([loading(0.2)]).mockResolvedValue([{ state: 'ready', region: REF }]);
    const onReady = vi.fn();
    const { rerender } = renderHook(() => usePaddleRegionLoad(failures, onReady));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onReady).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(onReady).toHaveBeenCalledTimes(1);
    rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-REGION-LOAD-003: asks for nothing without a leg that lacks the data', async () => {
    renderHook(() => usePaddleRegionLoad([{ index: 0, code: 'not_on_water', at: AT }], vi.fn()));
    renderHook(() => usePaddleRegionLoad(null, vi.fn()));
    await Promise.resolve();
    expect(load).not.toHaveBeenCalled();
  });

  it('FE-PADDLE-REGION-LOAD-004: reads a failed region again on request', async () => {
    load.mockResolvedValue([{ state: 'failed', region: REF }]);
    const { result } = renderHook(() => usePaddleRegionLoad(failures, vi.fn()));
    await waitFor(() => expect(result.current.byLeg.get(0)?.state).toBe('failed'));
    act(() => result.current.retry());
    await waitFor(() => expect(load).toHaveBeenLastCalledWith(expect.any(Array), true, expect.any(AbortSignal)));
  });

  it('FE-PADDLE-REGION-LOAD-005: keeps asking after a failed look, more slowly', async () => {
    vi.useFakeTimers();
    load.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ state: 'declined', region: REF }]);
    const { result } = renderHook(() => usePaddleRegionLoad(failures, vi.fn()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.byLeg.get(0)?.state).toBe('declined');
  });
});
