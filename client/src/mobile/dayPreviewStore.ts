import { create } from 'zustand';

/**
 * The day a swipe is heading for, before the pager has settled on it. The day
 * rail in the trip header lights that chip at once, the way a native tab strip
 * follows the finger, while the plan itself switches only when the snap lands
 * (MDayPager's onSelectDay). Null when no swipe is under way.
 */
interface DayPreviewState {
  dayId: number | null;
  setDayId: (dayId: number | null) => void;
}

export const useDayPreviewStore = create<DayPreviewState>((set) => ({
  dayId: null,
  setDayId: (dayId) => set((s) => (s.dayId === dayId ? s : { dayId })),
}));
