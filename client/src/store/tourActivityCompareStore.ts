import { create } from 'zustand';

/**
 * ACT-02: the actual track one tour is compared with on the plan map. Only
 * ids: the planned line and the recorded one are both places of the trip, so
 * the map reads them where they are kept and a changed recording or plan
 * shows changed. Comparing is looking; it writes nothing.
 */
interface ActivityComparison {
  /** The planned tour, whose detail is open. */
  tourPlaceId: number;
  /** The recording linked to it as its actual track. */
  trackPlaceId: number;
}

interface TourActivityCompareState {
  comparison: ActivityComparison | null;
  /**
   * Whether the plan map can draw a comparison right now. The map says so
   * itself: in road trip mode, with the trip overview open or on the phone it
   * draws other lines, and the detail then offers no switch that would do
   * nothing.
   */
  mapAvailable: boolean;
  show: (comparison: ActivityComparison | null) => void;
  clear: () => void;
  /** Set by the plan map; a map that can no longer compare ends the comparison too. */
  setMapAvailable: (available: boolean) => void;
}

export const useTourActivityCompareStore = create<TourActivityCompareState>((set) => ({
  comparison: null,
  mapAvailable: false,
  show: (comparison) => set({ comparison }),
  clear: () => set({ comparison: null }),
  setMapAvailable: (available) => set(available ? { mapAvailable: true } : { mapAvailable: false, comparison: null }),
}));
