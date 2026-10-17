import { create } from 'zustand';

const STORAGE_PREFIX = 'trek:hidden-tours:';

/** The scope one person's choice belongs to: this user in this trip. */
export function tourVisibilityScope(userId: number, tripId: number): string {
  return `${userId}:${tripId}`;
}

function readHidden(scope: string): number[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + scope) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0) : [];
  } catch {
    // Storage blocked or the entry unreadable: every tour shows.
    return [];
  }
}

function writeHidden(scope: string, hidden: readonly number[]): void {
  try {
    if (hidden.length) window.localStorage.setItem(STORAGE_PREFIX + scope, JSON.stringify(hidden));
    else window.localStorage.removeItem(STORAGE_PREFIX + scope);
  } catch {
    // Storage blocked: the choice still holds while the page is up.
  }
}

interface TourMapVisibilityState {
  /** Whose choice is loaded, `user:trip`; null before a planner opened. */
  scope: string | null;
  /** The tours this person hid from the map of this trip. */
  hidden: readonly number[];
  load: (scope: string) => void;
  toggle: (placeId: number) => void;
  showAll: () => void;
}

/**
 * PR1-07: which tours one person hides from the map of one trip. A view
 * setting of that person on this device, like which bookings' routes the map
 * draws: it never changes the tour, its days or its colour, and nobody else
 * sees it. Kept per user and trip in the browser's storage, so a reload keeps
 * it. Ids of tours that are gone are dropped where the list is read, so they
 * cannot hide anything later.
 */
export const useTourMapVisibilityStore = create<TourMapVisibilityState>()((set, get) => ({
  scope: null,
  hidden: [],
  load: (scope) => {
    if (get().scope === scope) return;
    set({ scope, hidden: readHidden(scope) });
  },
  toggle: (placeId) => {
    const { scope, hidden } = get();
    if (!scope) return;
    const next = hidden.includes(placeId) ? hidden.filter((id) => id !== placeId) : [...hidden, placeId];
    writeHidden(scope, next);
    set({ hidden: next });
  },
  showAll: () => {
    const { scope } = get();
    if (!scope) return;
    writeHidden(scope, []);
    set({ hidden: [] });
  },
}));
