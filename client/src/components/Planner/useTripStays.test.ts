// FE-PLANNER-TRIPSTAYS-001 to -004: the planner's stays, read again for a stay
// written elsewhere, with the newest read winning over an older one.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { accommodationRepo } from '../../repo/accommodationRepo';
import { useTripStore } from '../../store/tripStore';
import type { Accommodation } from '../../types';
import { useTripStays } from './useTripStays';

type StayList = Awaited<ReturnType<typeof accommodationRepo.list>>;

const stay = (id: number): Accommodation => ({ id, trip_id: 3, place_id: 7, start_day_id: 1, end_day_id: 2 });
const answer = (...ids: number[]): StayList => ({ accommodations: ids.map(stay) });

/** A read whose answer the test hands over when it chooses. */
function deferredRead() {
  let settle: (value: StayList) => void = () => {};
  const promise = new Promise<StayList>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

let loadReservations: ReturnType<typeof vi.fn<(tripId: number | string) => Promise<void>>>;

beforeEach(() => {
  loadReservations = vi.fn(async () => {});
  useTripStore.setState({ loadReservations });
});

afterEach(() => {
  vi.restoreAllMocks();
  resetAllStores();
});

describe('useTripStays', () => {
  it('FE-PLANNER-TRIPSTAYS-001: a burst of stays booked elsewhere reads the stays and their bookings once more', async () => {
    const list = vi.spyOn(accommodationRepo, 'list').mockResolvedValueOnce(answer()).mockResolvedValue(answer(8, 9));
    const { result } = renderHook(() => useTripStays(3));
    act(() => result.current.loadAccommodations());
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    act(() => {
      useTripStore.getState().handleRemoteEvent({ type: 'accommodation:created', accommodation: stay(8) });
      useTripStore.getState().handleRemoteEvent({ type: 'accommodation:created', accommodation: stay(9) });
    });

    await waitFor(() => expect(result.current.tripAccommodations.map((a) => a.id)).toEqual([8, 9]));
    expect(list).toHaveBeenCalledTimes(2);
    expect(loadReservations).toHaveBeenCalledTimes(2);
    expect(loadReservations).toHaveBeenLastCalledWith(3);
  });

  it('FE-PLANNER-TRIPSTAYS-002: an older answer that lands last does not overwrite the newer one', async () => {
    const older = deferredRead();
    const newer = deferredRead();
    vi.spyOn(accommodationRepo, 'list').mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const { result } = renderHook(() => useTripStays(3));

    act(() => result.current.loadAccommodations());
    act(() => result.current.loadAccommodations());
    await act(async () => newer.settle(answer(8, 9)));
    await act(async () => older.settle(answer(8)));

    expect(result.current.tripAccommodations.map((a) => a.id)).toEqual([8, 9]);
  });

  it('FE-PLANNER-TRIPSTAYS-003: a read that fails keeps the stays on show', async () => {
    const list = vi.spyOn(accommodationRepo, 'list').mockResolvedValueOnce(answer(8));
    const { result } = renderHook(() => useTripStays(3));
    act(() => result.current.loadAccommodations());
    await waitFor(() => expect(result.current.tripAccommodations.map((a) => a.id)).toEqual([8]));

    list.mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.loadAccommodations());

    expect(list).toHaveBeenCalledTimes(2);
    expect(result.current.tripAccommodations.map((a) => a.id)).toEqual([8]);
  });

  it('FE-PLANNER-TRIPSTAYS-004: without a trip id nothing is read', () => {
    const list = vi.spyOn(accommodationRepo, 'list');
    const { result } = renderHook(() => useTripStays(Number.NaN));

    act(() => result.current.loadAccommodations());

    expect(list).not.toHaveBeenCalled();
    expect(loadReservations).not.toHaveBeenCalled();
  });
});
