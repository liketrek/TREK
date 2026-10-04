import { hotelBookendsOn } from '@trek/shared/roadtrip'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'

/** The preference the switch is stored under, spelled once for both surfaces. */
export const HOTEL_BOOKENDS_KEY = 'roadtrip_hotel_bookends'

/** Whether a trip's days start and end at the stay, and the way to flip it. */
export interface HotelBookendsSwitch {
  on: boolean
  /** Absent for a reader who may not change it, or while the trip's settings are not in. */
  toggle?: () => void
}

/**
 * The switch that seats a booked night at both ends of its days, as the desktop settings
 * and the phone's driving figures both offer it.
 *
 * One hook so the two cannot disagree about what "on" means or where it is written. The
 * value is the shared rule's own reading (`hotelBookendsOn`: missing is off), the one the
 * drive is planned with, and the write is the save the caller holds. On both surfaces that
 * is the planner's `saveRoadtripLimit`, so a flip on the phone goes through the same repo,
 * the same offline queue and the same broadcast as one on the desktop.
 */
export function useHotelBookends(
  save: ((key: string, value: boolean) => void) | undefined,
  tripId?: number | string | null,
): HotelBookendsSwitch {
  const on = useRoadtripSettings(hotelBookendsOn, tripId)
  return { on, toggle: save ? () => save(HOTEL_BOOKENDS_KEY, !on) : undefined }
}
