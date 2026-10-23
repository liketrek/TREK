// FE-PLANNER-USEDAYDETAIL-001 to -009: the forecast, the in-place rename and the
// stay write the desktop day panel and the phone day and stay sheets share.
// FE-PLANNER-USEDAYDETAIL-010 to -014: the desktop day panel's own stays follow
// a stay written elsewhere without a reload, and the stay open in its editor is
// never swapped for another one to save over.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { WeatherResult } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildDay } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { accommodationsApi, weatherApi } from '../../api/client';
import { accommodationRepo } from '../../repo/accommodationRepo';
import { useTripStore } from '../../store/tripStore';
import type { Accommodation } from '../../types';
import { useDayDetail, useDayForecast, useDayRename, writeStay } from './useDayDetail';

const SUNNY = { temp: 21, main: 'Clear', description: 'clear sky' } as WeatherResult;

/** A promise this test settles itself, to look at the hook while a request is out. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

afterEach(() => {
  vi.restoreAllMocks();
  resetAllStores();
});

describe('useDayForecast', () => {
  it('FE-PLANNER-USEDAYDETAIL-001: asks for nothing while not ready', () => {
    const spy = vi.spyOn(weatherApi, 'getDetailed');
    const { result } = renderHook(() => useDayForecast(false, '2026-05-01', 48.1, 11.5, 'en'));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current).toEqual({ weather: null, loading: false });
  });

  it('FE-PLANNER-USEDAYDETAIL-002: loads the day at the place and stops loading with the answer', async () => {
    const answer = deferred<WeatherResult>();
    const spy = vi.spyOn(weatherApi, 'getDetailed').mockReturnValue(answer.promise);
    const { result } = renderHook(() => useDayForecast(true, '2026-05-01', 48.1, 11.5, 'de'));
    expect(spy).toHaveBeenCalledWith(48.1, 11.5, '2026-05-01', 'de');
    expect(result.current.loading).toBe(true);

    await act(async () => answer.resolve(SUNNY));
    await waitFor(() => expect(result.current).toEqual({ weather: SUNNY, loading: false }));
  });

  it('FE-PLANNER-USEDAYDETAIL-003: an error answer or a failed request leaves no forecast', async () => {
    vi.spyOn(weatherApi, 'getDetailed').mockResolvedValueOnce({ ...SUNNY, error: 'no data' } as WeatherResult);
    const errorAnswer = renderHook(() => useDayForecast(true, '2026-05-01', 1, 2, 'en'));
    await waitFor(() => expect(errorAnswer.result.current.loading).toBe(false));
    expect(errorAnswer.result.current.weather).toBeNull();

    vi.spyOn(weatherApi, 'getDetailed').mockRejectedValueOnce(new Error('offline'));
    const failed = renderHook(() => useDayForecast(true, '2026-05-01', 1, 2, 'en'));
    await waitFor(() => expect(failed.result.current.loading).toBe(false));
    expect(failed.result.current.weather).toBeNull();
  });

  it('FE-PLANNER-USEDAYDETAIL-004: a late answer for the previous day is dropped', async () => {
    const first = deferred<WeatherResult>();
    const second = deferred<WeatherResult>();
    vi.spyOn(weatherApi, 'getDetailed').mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ date }) => useDayForecast(true, date, 1, 2, 'en'), {
      initialProps: { date: '2026-05-01' },
    });
    rerender({ date: '2026-05-02' });

    await act(async () => second.resolve(SUNNY));
    await waitFor(() => expect(result.current.weather).toEqual(SUNNY));
    await act(async () => {
      first.resolve({ ...SUNNY, temp: 5 });
      await first.promise;
    });
    expect(result.current.weather).toEqual(SUNNY);
  });

  it('FE-PLANNER-USEDAYDETAIL-005: no longer ready clears the forecast', async () => {
    vi.spyOn(weatherApi, 'getDetailed').mockResolvedValue(SUNNY);
    const { result, rerender } = renderHook(({ ready }) => useDayForecast(ready, '2026-05-01', 1, 2, 'en'), {
      initialProps: { ready: true },
    });
    await waitFor(() => expect(result.current.weather).toEqual(SUNNY));
    rerender({ ready: false });
    expect(result.current.weather).toBeNull();
  });
});

describe('useDayRename', () => {
  it('FE-PLANNER-USEDAYDETAIL-006: opens on the current title, takes the focus and commits it trimmed', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useDayRename(onCommit));
    const input = document.createElement('input');
    document.body.appendChild(input);
    result.current.titleInputRef.current = input;

    act(() => result.current.startRename('Arrival'));
    expect(result.current.editingTitle).toBe(true);
    expect(result.current.titleDraft).toBe('Arrival');
    expect(document.activeElement).toBe(input);

    act(() => result.current.setTitleDraft('  Old town  '));
    act(() => result.current.commitRename());
    expect(result.current.editingTitle).toBe(false);
    expect(onCommit).toHaveBeenCalledWith('Old town');
    input.remove();
  });

  it('FE-PLANNER-USEDAYDETAIL-007: closing the field by hand commits nothing', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useDayRename(onCommit));
    act(() => result.current.startRename(''));
    act(() => result.current.setEditingTitle(false));
    expect(result.current.editingTitle).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('writeStay', () => {
  const body = { place_id: 7, start_day_id: 1, end_day_id: 2, check_in: null };

  it('FE-PLANNER-USEDAYDETAIL-008: creates a new stay and applies the stop the server added for it', async () => {
    const handleRemoteEvent = vi.fn();
    useTripStore.setState({ handleRemoteEvent } as never);
    const assignment = { id: 5, day_id: 1 };
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue({ accommodation: { id: 9 }, assignment });
    const update = vi.spyOn(accommodationsApi, 'update');

    await expect(writeStay(3, null, body)).resolves.toEqual({ accommodation: { id: 9 }, assignment });
    expect(create).toHaveBeenCalledWith(3, body);
    expect(update).not.toHaveBeenCalled();
    expect(handleRemoteEvent).toHaveBeenCalledWith({ type: 'assignment:created', assignment });
  });

  it('FE-PLANNER-USEDAYDETAIL-009: updates the given stay, and a refused write throws', async () => {
    const update = vi.spyOn(accommodationsApi, 'update').mockResolvedValueOnce({ accommodation: { id: 4 } });
    await writeStay(3, 4, body);
    expect(update).toHaveBeenCalledWith(3, 4, body);

    update.mockRejectedValueOnce(new Error('overlap'));
    await expect(writeStay(3, 4, body)).rejects.toThrow('overlap');
  });
});

describe('useDayDetail stays', () => {
  const arrival = buildDay({ id: 1 });
  const departure = buildDay({ id: 2 });
  const days = [arrival, departure];
  const stay = (id: number, startDayId: number, endDayId: number): Accommodation => ({
    id,
    trip_id: 3,
    place_id: 7,
    start_day_id: startDayId,
    end_day_id: endDayId,
  });
  /** A stay written by someone else, as the trip room hands it to the store. */
  const writtenElsewhere = (type: 'accommodation:created' | 'accommodation:updated', accommodation: Accommodation) =>
    act(() => useTripStore.getState().handleRemoteEvent({ type, accommodation }));

  it('FE-PLANNER-USEDAYDETAIL-010: stays booked elsewhere show in the day panel after one reload', async () => {
    const tonight = stay(8, 1, 2);
    const later = stay(9, 2, 2);
    const list = vi
      .spyOn(accommodationRepo, 'list')
      .mockResolvedValueOnce({ accommodations: [] })
      .mockResolvedValue({ accommodations: [tonight, later] });
    const { result } = renderHook(() => useDayDetail(arrival, days, 3, null, null, 'en'));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    writtenElsewhere('accommodation:created', tonight);
    writtenElsewhere('accommodation:created', later);

    await waitFor(() => expect(result.current.dayAccommodations).toEqual([tonight]));
    expect(result.current.accommodations).toEqual([tonight, later]);
    expect(result.current.accommodation).toEqual(tonight);
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-USEDAYDETAIL-011: the stay open for editing stays selected through that reload', async () => {
    const first = stay(8, 1, 1);
    const second = stay(9, 1, 2);
    const list = vi.spyOn(accommodationRepo, 'list').mockResolvedValue({ accommodations: [first, second] });
    const { result } = renderHook(() => useDayDetail(arrival, days, 3, null, null, 'en'));
    await waitFor(() => expect(result.current.accommodation).toEqual(first));
    act(() => result.current.setAccommodation(second));

    const moved = { ...second, check_in: '15:00' };
    list.mockResolvedValue({ accommodations: [first, moved] });
    writtenElsewhere('accommodation:updated', moved);

    await waitFor(() => expect(result.current.accommodation).toEqual(moved));
    expect(result.current.dayAccommodations).toEqual([first, moved]);
  });

  /**
   * Opens the editor on the day's second stay, lets someone else take it off the
   * day, and hands back what the panel shows afterwards.
   */
  async function editedStayLeavesTheDay(
    afterwards: Accommodation[],
    event: 'accommodation:updated' | 'accommodation:deleted'
  ) {
    const first = stay(8, 1, 1);
    const second = stay(9, 1, 2);
    const list = vi.spyOn(accommodationRepo, 'list').mockResolvedValue({ accommodations: [first, second] });
    const update = vi.spyOn(accommodationRepo, 'update');
    const view = renderHook(() => useDayDetail(arrival, days, 3, null, null, 'en'));
    await waitFor(() => expect(view.result.current.dayAccommodations).toEqual([first, second]));
    act(() => {
      view.result.current.setAccommodation(second);
      view.result.current.setShowHotelPicker('edit');
    });

    list.mockResolvedValue({ accommodations: afterwards });
    if (event === 'accommodation:deleted') {
      act(() => useTripStore.getState().handleRemoteEvent({ type: event, accommodationId: second.id }));
    } else {
      writtenElsewhere(event, afterwards[1] ?? second);
    }
    await waitFor(() => expect(view.result.current.dayAccommodations).toEqual([first]));
    return { ...view, update };
  }

  it('FE-PLANNER-USEDAYDETAIL-012: the stay open in the editor, cancelled elsewhere, closes the editor and leaves none to save over', async () => {
    const { result, update } = await editedStayLeavesTheDay([stay(8, 1, 1)], 'accommodation:deleted');

    expect(result.current.accommodation).toBeNull();
    expect(result.current.showHotelPicker).toBe(false);
    await act(() => result.current.handleUpdateAccommodation());
    expect(update).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-USEDAYDETAIL-013: the stay open in the editor, moved to another day elsewhere, closes the editor too', async () => {
    const { result } = await editedStayLeavesTheDay([stay(8, 1, 1), stay(9, 2, 2)], 'accommodation:updated');

    expect(result.current.accommodation).toBeNull();
    expect(result.current.showHotelPicker).toBe(false);
  });

  it("FE-PLANNER-USEDAYDETAIL-014: saving the stay open in the editor keeps it picked, not the day's first", async () => {
    const first = stay(8, 1, 1);
    const second = stay(9, 1, 2);
    const saved = { ...second, check_in: '15:00' };
    const list = vi.spyOn(accommodationRepo, 'list').mockResolvedValue({ accommodations: [first, second] });
    const update = vi.spyOn(accommodationRepo, 'update').mockResolvedValue({ accommodation: saved });
    const { result } = renderHook(() => useDayDetail(arrival, days, 3, null, null, 'en'));
    await waitFor(() => expect(result.current.dayAccommodations).toEqual([first, second]));
    act(() => {
      result.current.setAccommodation(second);
      result.current.setShowHotelPicker('edit');
    });

    list.mockResolvedValue({ accommodations: [first, saved] });
    await act(() => result.current.handleUpdateAccommodation());

    expect(update).toHaveBeenCalledWith(3, second.id, expect.any(Object));
    expect(result.current.accommodation).toEqual(saved);
    expect(result.current.showHotelPicker).toBe(false);
  });
});
