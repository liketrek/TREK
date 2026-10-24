// FE-PLANNER-STAYSREFRESH-001 to -007: a stay written elsewhere reaches the
// planner's and the day panel's page-local stays as one reload per burst, and
// never as two reloads at once.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import { STAYS_REFRESH_SETTLE_MS, useStaysRefresh } from './useStaysRefresh';

/** An event from the trip room, as the socket hands it to the store. */
const remote = (event: { type: string; [key: string]: unknown }) =>
  act(() => useTripStore.getState().handleRemoteEvent(event));

/** Lets the given time pass on the faked clock. */
const elapse = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  resetAllStores();
});

describe('useStaysRefresh', () => {
  it('FE-PLANNER-STAYSREFRESH-001: a burst of stay events from elsewhere is served by exactly one reload', () => {
    const reload = vi.fn();
    renderHook(() => useStaysRefresh(reload));

    remote({ type: 'accommodation:created', accommodation: { id: 8 } });
    remote({ type: 'accommodation:updated', accommodation: { id: 8 } });
    remote({ type: 'accommodation:deleted', accommodationId: 7 });
    elapse(STAYS_REFRESH_SETTLE_MS - 1);
    expect(reload).not.toHaveBeenCalled();

    elapse(1);
    expect(reload).toHaveBeenCalledTimes(1);
    elapse(STAYS_REFRESH_SETTLE_MS * 4);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-STAYSREFRESH-002: an event that cannot touch a stay asks for nothing', () => {
    const reload = vi.fn();
    renderHook(() => useStaysRefresh(reload));

    remote({ type: 'reservation:deleted', reservationId: 3 });
    remote({ type: 'todo:deleted', itemId: 4 });
    elapse(STAYS_REFRESH_SETTLE_MS * 2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-STAYSREFRESH-003: a stay event after the reload went out starts the next one', () => {
    const reload = vi.fn();
    renderHook(() => useStaysRefresh(reload));

    remote({ type: 'accommodation:created', accommodation: { id: 8 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    remote({ type: 'accommodation:created', accommodation: { id: 9 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-STAYSREFRESH-004: the reload handed in last is the one that runs', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ reload }) => useStaysRefresh(reload), { initialProps: { reload: first } });

    remote({ type: 'accommodation:updated', accommodation: { id: 8 } });
    rerender({ reload: second });
    elapse(STAYS_REFRESH_SETTLE_MS);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-STAYSREFRESH-005: unmounting drops a pending reload and stops listening', () => {
    const reload = vi.fn();
    const { unmount } = renderHook(() => useStaysRefresh(reload));

    remote({ type: 'accommodation:created', accommodation: { id: 8 } });
    unmount();
    remote({ type: 'accommodation:created', accommodation: { id: 9 } });
    elapse(STAYS_REFRESH_SETTLE_MS * 2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-STAYSREFRESH-006: a burst that ends while a reload reads waits for it, then gets one more', async () => {
    let land: () => void = () => {};
    const reload = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          land = resolve;
        })
    );
    renderHook(() => useStaysRefresh(reload));

    remote({ type: 'accommodation:created', accommodation: { id: 8 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    remote({ type: 'accommodation:updated', accommodation: { id: 8 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    remote({ type: 'accommodation:deleted', accommodationId: 8 });
    elapse(STAYS_REFRESH_SETTLE_MS);
    expect(reload).toHaveBeenCalledTimes(1);

    await act(async () => land());
    expect(reload).toHaveBeenCalledTimes(2);
    await act(async () => land());
    elapse(STAYS_REFRESH_SETTLE_MS * 4);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-STAYSREFRESH-007: a reload that fails does not hold back the next burst', async () => {
    const reload = vi.fn(() => Promise.reject(new Error('offline')));
    renderHook(() => useStaysRefresh(reload));

    remote({ type: 'accommodation:created', accommodation: { id: 8 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    await act(async () => {});
    remote({ type: 'accommodation:created', accommodation: { id: 9 } });
    elapse(STAYS_REFRESH_SETTLE_MS);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
