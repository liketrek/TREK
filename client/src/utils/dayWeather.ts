import type { Accommodation, Assignment } from '../types';

/** Where a day's forecast is read, and the name the weather is captioned with. */
export interface DayWeatherAnchor {
  lat: number | null;
  lng: number | null;
  name: string | null;
}

/** A stop the day plan reads the weather at: both coordinates set and neither of them zero. */
export const hasWeatherCoords = (a: Assignment): boolean => !!(a.place?.lat && a.place?.lng);

/**
 * The day-local weather anchor (#2167): the day's first stop that `isLocated`
 * accepts, else the hotel you wake up in. Never a place from another day: on a
 * road trip that silently showed another city's weather with nothing naming the
 * place. The hotel is only looked up when no stop qualifies, and where you wake up
 * is a fact about the day, so callers look it up whatever the routing settings say.
 */
export function dayWeatherAnchor(
  stops: Assignment[],
  wakeUpHotel: () => Pick<Accommodation, 'place_lat' | 'place_lng' | 'place_name'> | undefined,
  isLocated: (a: Assignment) => boolean = hasWeatherCoords
): DayWeatherAnchor {
  const located = stops.find(isLocated)?.place;
  const hotel = located ? undefined : wakeUpHotel();
  return {
    lat: located?.lat ?? hotel?.place_lat ?? null,
    lng: located?.lng ?? hotel?.place_lng ?? null,
    name: located?.name ?? hotel?.place_name ?? null,
  };
}
