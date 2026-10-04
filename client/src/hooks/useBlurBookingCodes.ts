import { useSettingsStore } from '../store/settingsStore'

/**
 * Whether booking codes are drawn blurred for the signed-in user (the
 * "Blur booking codes" preference, blur_booking_codes). An unset preference
 * reads as off. The pieces in `components/shared/BookingCode` build on it;
 * reach for it directly only where a surface has to lay out a code
 * differently while it is hidden.
 */
export function useBlurBookingCodes(): boolean {
  return useSettingsStore(s => !!s.settings.blur_booking_codes)
}
