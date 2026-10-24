// CW-03: the visits of a trip's city walks, read when the trip opens and when
// the connection changes, and kept current by its socket through the store.
import { act, renderHook } from '@testing-library/react';
import type { TourVisit } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addListener, removeListener } from '../../../api/websocket';
import { tourVisitRepo } from '../../../repo/tourVisitRepo';
import { useTourVisitStore } from '../../../store/tourVisitStore';
import { setForcedOffline } from '../../../sync/networkMode';
import { useTourVisitsSync } from './useTourVisitsSync';

const visit = (assignment_id: number, station_key: string): TourVisit => ({
  assignment_id,
  station_key,
  status: 'visited',
});

function later<T>() {
  let settle: (value: T) => void = () => undefined;
  let fail: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, settle, fail };
}

beforeEach(() => {
  useTourVisitStore.setState({ tripId: null, byAssignment: {} });
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  act(() => setForcedOffline(false));
});

describe('useTourVisitsSync', () => {
  it('reads nothing and listens to nothing while off, without a trip, or for a trip id that is no number', () => {
    const list = vi.spyOn(tourVisitRepo, 'list');

    renderHook(() => useTourVisitsSync(4, false));
    renderHook(() => useTourVisitsSync(undefined, true));
    renderHook(() => useTourVisitsSync('abc', true));

    expect(list).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
  });

  it("reads the trip's visits and listens to its socket, once", async () => {
    const list = vi.spyOn(tourVisitRepo, 'list').mockResolvedValue({ visits: [visit(9, 'stop-01')] });

    renderHook(() => useTourVisitsSync(4, true));

    await vi.waitFor(() => expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-01': 'visited' } }));
    expect(list).toHaveBeenCalledExactlyOnceWith(4);
    expect(addListener).toHaveBeenCalledOnce();
  });

  it('reads them again when the connection goes or comes back, without listening twice', async () => {
    const list = vi.spyOn(tourVisitRepo, 'list').mockResolvedValue({ visits: [] });
    renderHook(() => useTourVisitsSync(4, true));
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    act(() => setForcedOffline(true));
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    act(() => setForcedOffline(false));
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(3));

    expect(addListener).toHaveBeenCalledOnce();
    expect(removeListener).not.toHaveBeenCalled();
  });

  it('a read that fails forgets the visits, but not once the hook is gone', async () => {
    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-01': 'visited' } } });
    const answer = later<{ visits: TourVisit[] }>();
    vi.spyOn(tourVisitRepo, 'list')
      .mockRejectedValueOnce(new Error('No permission'))
      .mockReturnValueOnce(answer.promise);

    const first = renderHook(() => useTourVisitsSync(4, true));
    await vi.waitFor(() => expect(useTourVisitStore.getState().byAssignment).toEqual({}));
    first.unmount();

    useTourVisitStore.setState({ tripId: '4', byAssignment: { 9: { 'stop-01': 'visited' } } });
    const second = renderHook(() => useTourVisitsSync(4, true));
    second.unmount();
    answer.fail(new Error('Gone'));
    await expect(answer.promise).rejects.toThrow('Gone');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-01': 'visited' } });
  });

  it('stops listening when it goes, and listens to the next trip when the trip changes', () => {
    vi.spyOn(tourVisitRepo, 'list').mockResolvedValue({ visits: [] });
    const { rerender, unmount } = renderHook(({ trip }) => useTourVisitsSync(trip, true), {
      initialProps: { trip: 4 },
    });
    const [[firstListener]] = vi.mocked(addListener).mock.calls;

    rerender({ trip: 5 });
    expect(removeListener).toHaveBeenCalledWith(firstListener);
    expect(addListener).toHaveBeenCalledTimes(2);
    const secondListener = vi.mocked(addListener).mock.calls[1][0];

    unmount();
    expect(removeListener).toHaveBeenLastCalledWith(secondListener);
  });

  it('a read for the trip left before answers too late to show', async () => {
    const left = later<{ visits: TourVisit[] }>();
    vi.spyOn(tourVisitRepo, 'list')
      .mockReturnValueOnce(left.promise)
      .mockResolvedValueOnce({ visits: [visit(30, 'stop-02')] });
    const { rerender } = renderHook(({ trip }) => useTourVisitsSync(trip, true), { initialProps: { trip: 4 } });

    rerender({ trip: 5 });
    await vi.waitFor(() => expect(useTourVisitStore.getState().byAssignment).toEqual({ 30: { 'stop-02': 'visited' } }));
    left.settle({ visits: [visit(9, 'stop-01')] });
    await left.promise;

    expect(useTourVisitStore.getState()).toMatchObject({ tripId: '5', byAssignment: { 30: { 'stop-02': 'visited' } } });
  });
});
