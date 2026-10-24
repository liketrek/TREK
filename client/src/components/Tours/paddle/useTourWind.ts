import type { WindForecastResponse } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WindOfflineError, windRepo } from '../../../repo/windRepo';
import { useTripStore } from '../../../store/tripStore';
import type { Day } from '../../../types';
import { useTourDays, type TourDay } from '../tourDays';

export type TourWindState =
  | { kind: 'no_day' }
  | { kind: 'no_date' }
  | { kind: 'no_place' }
  | { kind: 'loading' }
  | { kind: 'offline' }
  | { kind: 'error' }
  | { kind: 'ready'; forecast: WindForecastResponse };

const NO_DAYS: Day[] = [];

/** The day to show first: the first one still to come, else the first of the tour. */
function firstDayOf(tourDays: readonly TourDay[], today: string): TourDay | null {
  return tourDays.find(({ day }) => !!day.date && day.date >= today) ?? tourDays[0] ?? null;
}

/**
 * PAD-08: the wind forecast for a paddle tour on the day it is planned for,
 * at its start. A tour on several days shows one at a time, the one chosen,
 * never another day without saying so. Without a day, a date, a place or a
 * connection it says which is missing; nothing here changes the tour.
 */
export function useTourWind(placeId: number | null, start: { lat: number; lng: number } | null) {
  const days = useTripStore((state) => state.days) ?? NO_DAYS;
  const tourDays = useTourDays(placeId ?? -1, days);
  const today = new Date().toISOString().slice(0, 10);
  const [chosenDayId, setChosenDayId] = useState<number | null>(null);
  const day = useMemo(
    () => tourDays.find((entry) => entry.day.id === chosenDayId) ?? firstDayOf(tourDays, today),
    [chosenDayId, today, tourDays]
  );
  const [attempt, setAttempt] = useState(0);
  const lat = start?.lat ?? null;
  const lng = start?.lng ?? null;
  const date = day?.day.date ?? null;
  // One request per place, day and retry; the answer is kept with the key it was asked for.
  const key = date && lat !== null && lng !== null ? `${lat},${lng},${date},${attempt}` : null;
  const [result, setResult] = useState<{ key: string; state: TourWindState } | null>(null);

  useEffect(() => {
    if (!key || !date || lat === null || lng === null) return;
    const controller = new AbortController();
    windRepo
      .forecast(lat, lng, date, controller.signal)
      .then((forecast) => {
        if (!controller.signal.aborted) setResult({ key, state: { kind: 'ready', forecast } });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key, state: { kind: err instanceof WindOfflineError ? 'offline' : 'error' } });
      });
    return () => controller.abort();
  }, [date, key, lat, lng]);

  const state: TourWindState = !day
    ? { kind: 'no_day' }
    : !date
      ? { kind: 'no_date' }
      : lat === null || lng === null
        ? { kind: 'no_place' }
        : result && result.key === key
          ? result.state
          : { kind: 'loading' };

  return {
    state,
    day,
    tourDays,
    chooseDay: setChosenDayId,
    retry: useCallback(() => setAttempt((value) => value + 1), []),
  };
}

export type TourWind = ReturnType<typeof useTourWind>;
