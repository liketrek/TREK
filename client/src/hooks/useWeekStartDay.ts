import { useSettingsStore } from '../store/settingsStore'
import { weekStartDay } from '../utils/calendarWeek'

/** The current user's first weekday as a Date#getDay() number (#2029). */
export function useWeekStartDay(): number {
  return weekStartDay(useSettingsStore(s => s.settings.week_start))
}
