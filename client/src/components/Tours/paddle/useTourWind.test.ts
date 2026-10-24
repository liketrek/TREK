/**
 * FE-HOOK-TOURWIND-001 to FE-HOOK-TOURWIND-010: the wind forecast for a paddle
 * tour on its day, at its start (PAD-08).
 *
 * Pinned: without a day, a date or a start place it says which is missing and
 * asks nothing; one request per place, day and retry, loading until it
 * answers; offline and a failure each say so, and a retry asks again; the day
 * shown is the first still to come, else the first of the tour, or the one
 * chosen while the tour is on it; an answer for a day no longer shown is
 * dropped, and leaving the view aborts the request.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { WindForecastResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { WindOfflineError } from '../../../repo/windRepo';
import { useTripStore } from '../../../store/tripStore';
import type { AssignmentsMap, Day } from '../../../types';
import { useTourWind } from './useTourWind';

type Forecast = (lat: number, lng: number, date: string, signal?: AbortSignal) => Promise<WindForecastResponse>;

const repo = vi.hoisted(() => ({ forecast: vi.fn<Forecast>() }));
vi.mock('../../../repo/windRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../repo/windRepo')>()),
  windRepo: repo,
}));

const TODAY = '2026-07-01';
const START = { lat: 47.5, lng: 9.7 };
const tour = buildPlace({ name: 'Lake loop' });

function forecastFor(date: string): WindForecastResponse {
  return {
    status: 'forecast',
    date,
    lat: START.lat,
    lng: START.lng,
    timezone: 'Europe/Berlin',
    source: 'Open-Meteo',
    fetched_at: `${TODAY}T06:00:00Z`,
    horizon_days: 16,
    hours: [{ hour: 9, speed_kmh: 12, gusts_kmh: 25, direction_deg: 240 }],
    day: { speed_max_kmh: 18, gusts_max_kmh: 31, direction_dominant_deg: 250 },
  };
}

/** The trip's days, with the tour on the ones in `tourOn`. */
function seedTour(days: Day[], tourOn: Day[] = days): void {
  const assignments: AssignmentsMap = {};
  for (const day of tourOn) assignments[String(day.id)] = [buildAssignment({ day_id: day.id, place: tour })];
  seedStore(useTripStore, { days, assignments });
}

/** A request that answers only when the test says so. */
function deferred() {
  let resolve: (forecast: WindForecastResponse) => void = () => undefined;
  const promise = new Promise<WindForecastResponse>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** A request that, like the real one, fails as soon as its signal is aborted. */
function abortable(_lat: number, _lng: number, _date: string, signal?: AbortSignal): Promise<WindForecastResponse> {
  return new Promise((_resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
}

function signalOf(call: number): AbortSignal | undefined {
  return repo.forecast.mock.calls[call]?.[3];
}

/** Lets every pending promise reaction run, a late answer included. */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`));
  resetAllStores();
  repo.forecast.mockReset();
  repo.forecast.mockImplementation(async (_lat, _lng, date) => forecastFor(date));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTourWind (PAD-08)', () => {
  it('FE-HOOK-TOURWIND-001: without a day the tour is on, it says so and asks nothing', () => {
    seedStore(useTripStore, { days: undefined });
    const unloaded = renderHook(() => useTourWind(tour.id, START));
    expect(unloaded.result.current.state).toEqual({ kind: 'no_day' });
    unloaded.unmount();

    const day = buildDay({ date: '2026-07-04' });
    seedTour([day], []);
    const offDay = renderHook(() => useTourWind(tour.id, START));
    expect(offDay.result.current.state).toEqual({ kind: 'no_day' });
    expect(offDay.result.current.day).toBeNull();
    expect(offDay.result.current.tourDays).toEqual([]);
    offDay.unmount();

    seedTour([day]);
    const noTour = renderHook(() => useTourWind(null, START));
    expect(noTour.result.current.state).toEqual({ kind: 'no_day' });
    expect(repo.forecast).not.toHaveBeenCalled();
  });

  it('FE-HOOK-TOURWIND-002: a day without a date says so and asks nothing', () => {
    const day = buildDay({ date: null });
    seedTour([day]);
    const { result } = renderHook(() => useTourWind(tour.id, START));
    expect(result.current.state).toEqual({ kind: 'no_date' });
    expect(result.current.day).toEqual({ day, index: 0 });
    expect(repo.forecast).not.toHaveBeenCalled();
  });

  it('FE-HOOK-TOURWIND-003: without a start place it says so and asks nothing', () => {
    const day = buildDay({ date: '2026-07-04' });
    seedTour([day]);
    const { result } = renderHook(() => useTourWind(tour.id, null));
    expect(result.current.state).toEqual({ kind: 'no_place' });
    expect(result.current.day).toEqual({ day, index: 0 });
    expect(repo.forecast).not.toHaveBeenCalled();
  });

  it('FE-HOOK-TOURWIND-004: loads the forecast for the start on the tour day, once per place and day', async () => {
    seedTour([buildDay({ date: '2026-07-04' })]);
    const pending = deferred();
    repo.forecast.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ start }) => useTourWind(tour.id, start), {
      initialProps: { start: START },
    });
    expect(result.current.state).toEqual({ kind: 'loading' });
    expect(repo.forecast).toHaveBeenCalledWith(47.5, 9.7, '2026-07-04', expect.any(AbortSignal));

    await act(async () => {
      pending.resolve(forecastFor('2026-07-04'));
      await pending.promise;
    });
    expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') });

    rerender({ start: { ...START } });
    expect(repo.forecast).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') });

    rerender({ start: { lat: 47.6, lng: 9.8 } });
    expect(result.current.state).toEqual({ kind: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') }));
    expect(repo.forecast).toHaveBeenCalledTimes(2);
    expect(repo.forecast).toHaveBeenLastCalledWith(47.6, 9.8, '2026-07-04', expect.any(AbortSignal));
  });

  it('FE-HOOK-TOURWIND-005: offline it says so instead of failing', async () => {
    seedTour([buildDay({ date: '2026-07-04' })]);
    repo.forecast.mockRejectedValueOnce(new WindOfflineError());
    const { result } = renderHook(() => useTourWind(tour.id, START));
    expect(result.current.state).toEqual({ kind: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'offline' }));
  });

  it('FE-HOOK-TOURWIND-006: a failure says so, and a retry asks again', async () => {
    seedTour([buildDay({ date: '2026-07-04' })]);
    repo.forecast.mockRejectedValueOnce(new Error('Request failed with status code 502'));
    const { result } = renderHook(() => useTourWind(tour.id, START));
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'error' }));

    act(() => result.current.retry());
    expect(result.current.state).toEqual({ kind: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') }));
    expect(repo.forecast).toHaveBeenCalledTimes(2);
    expect(repo.forecast).toHaveBeenNthCalledWith(2, 47.5, 9.7, '2026-07-04', expect.any(AbortSignal));
  });

  it('FE-HOOK-TOURWIND-007: shows the first day still to come, else the first day of the tour', async () => {
    const past = buildDay({ date: '2026-06-20' });
    const undated = buildDay({ date: null });
    const today = buildDay({ date: TODAY });
    const later = buildDay({ date: '2026-07-04' });
    seedTour([past, undated, today, later]);
    const upcoming = renderHook(() => useTourWind(tour.id, START));
    expect(upcoming.result.current.day).toEqual({ day: today, index: 2 });
    expect(upcoming.result.current.tourDays.map(({ day }) => day.id)).toEqual([
      past.id,
      undated.id,
      today.id,
      later.id,
    ]);
    await waitFor(() => expect(upcoming.result.current.state).toEqual({ kind: 'ready', forecast: forecastFor(TODAY) }));
    upcoming.unmount();

    seedTour([past, undated, later], [past, undated]);
    const gone = renderHook(() => useTourWind(tour.id, START));
    expect(gone.result.current.day).toEqual({ day: past, index: 0 });
    await waitFor(() =>
      expect(gone.result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-06-20') })
    );
  });

  it('FE-HOOK-TOURWIND-008: a tour on two days shows the chosen one, and falls back once the tour leaves it', async () => {
    const first = buildDay({ date: '2026-07-04' });
    const second = buildDay({ date: '2026-07-05' });
    seedTour([first, second]);
    const { result } = renderHook(() => useTourWind(tour.id, START));
    expect(result.current.tourDays).toEqual([
      { day: first, index: 0 },
      { day: second, index: 1 },
    ]);
    expect(result.current.day).toEqual({ day: first, index: 0 });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') }));

    act(() => result.current.chooseDay(second.id));
    expect(result.current.day).toEqual({ day: second, index: 1 });
    expect(result.current.state).toEqual({ kind: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-05') }));
    expect(repo.forecast).toHaveBeenLastCalledWith(47.5, 9.7, '2026-07-05', expect.any(AbortSignal));

    act(() => seedTour([first, second], [first]));
    expect(result.current.day).toEqual({ day: first, index: 0 });
    await waitFor(() => expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-04') }));
    expect(repo.forecast).toHaveBeenCalledTimes(3);
  });

  it('FE-HOOK-TOURWIND-009: an answer for a day no longer shown is dropped', async () => {
    const first = buildDay({ date: '2026-07-04' });
    const second = buildDay({ date: '2026-07-05' });
    seedTour([first, second]);
    const slow = deferred();
    const fresh = deferred();
    repo.forecast.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fresh.promise);
    const { result } = renderHook(() => useTourWind(tour.id, START));

    act(() => result.current.chooseDay(second.id));
    expect(signalOf(0)?.aborted).toBe(true);
    expect(signalOf(1)?.aborted).toBe(false);

    await act(async () => {
      slow.resolve(forecastFor('2026-07-04'));
      await slow.promise;
    });
    expect(result.current.state).toEqual({ kind: 'loading' });

    await act(async () => {
      fresh.resolve(forecastFor('2026-07-05'));
      await fresh.promise;
    });
    expect(result.current.state).toEqual({ kind: 'ready', forecast: forecastFor('2026-07-05') });
  });

  it('FE-HOOK-TOURWIND-010: leaving the view aborts the request, and its late failure is dropped', async () => {
    seedTour([buildDay({ date: '2026-07-04' })]);
    repo.forecast.mockImplementationOnce(abortable);
    const { result, unmount } = renderHook(() => useTourWind(tour.id, START));
    expect(result.current.state).toEqual({ kind: 'loading' });
    expect(signalOf(0)?.aborted).toBe(false);

    unmount();
    expect(signalOf(0)?.aborted).toBe(true);
    // The rejection the abort causes reaches the hook after it is gone, and nothing is set from it.
    await settle();
    expect(repo.forecast).toHaveBeenCalledTimes(1);
  });
});
