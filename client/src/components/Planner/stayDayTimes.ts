interface StayRange {
  start_day_id: number | null
  end_day_id: number | null
  check_in?: string | null
  check_out?: string | null
}

export interface StayDayTimes {
  /** The check-in time belongs on this day: it is the arrival day and a time is set. */
  checkIn: boolean
  /** The check-out time belongs on this day: it is the departure day and a time is set. */
  checkOut: boolean
}

/**
 * Which of a stay's two times matter on a given day (#2393). The arrival day shows the
 * check-in, the departure day the check-out, a one-night stop on a single day both; a
 * night in the middle of the stay shows neither, since nothing happens at the desk then.
 */
export function stayDayTimes(stay: StayRange, dayId: number): StayDayTimes {
  return {
    checkIn: stay.start_day_id === dayId && !!stay.check_in,
    checkOut: stay.end_day_id === dayId && !!stay.check_out,
  }
}
