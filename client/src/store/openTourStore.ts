import { create } from 'zustand';

/** The saved tour open in the planner's editor, as the chat may take a found place into it. */
interface OpenTour {
  tripId: number;
  placeId: number;
  name: string;
}

interface OpenTourState {
  /** Null while no saved hike or city walk is open, or while its editor holds changes not yet saved. */
  open: OpenTour | null;
}

/**
 * P6: which saved tour the planner has open, for "+ Tour" on a place the
 * assistant found. The planner writes it (usePublishOpenTour), the chat's
 * place cards read it; nothing else is kept here.
 */
export const useOpenTourStore = create<OpenTourState>(() => ({ open: null }));

export function setOpenTour(open: OpenTour | null): void {
  const current = useOpenTourStore.getState().open;
  const same =
    current === open ||
    (!!current &&
      !!open &&
      current.tripId === open.tripId &&
      current.placeId === open.placeId &&
      current.name === open.name);
  if (!same) useOpenTourStore.setState({ open });
}
