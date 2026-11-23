import { tripAddonListSchema, type TripAddon } from '@trek/shared';
import { create } from 'zustand';

import { addListener, removeListener } from '../api/websocket';
import { tripAddonsRepo } from '../repo/tripAddonsRepo';
import { tripAddonEnabled } from '../utils/tripAddons';
import { instanceAddonOn, useAddonStore } from './addonStore';
import { useAuthStore } from './authStore';

/**
 * The trip addons of each trip the app looked at, each on or off for that trip
 * (GET /trips/:id/addons, then the `tripAddons:changed` pushes). Kept apart from
 * the trip store because readers outside the open trip need it too: the share
 * dialog on the dashboard, the offline sync, the widgets.
 *
 * Keyed by account and trip, like the driving settings, so a list read for one
 * account is never shown to the next one signed in on the same tab.
 */

type Status = 'loading' | 'ready' | 'failed';

interface TripAddonsEntry {
  /** The trip's list, or null while none was read (still loading, or offline with nothing kept). */
  addons: TripAddon[] | null;
  status: Status;
  /** Counts the lists put in, so a read that started before a newer list arrived does not lay its older answer over it. */
  rev: number;
}

interface TripAddonsState {
  trips: Record<string, TripAddonsEntry>;
  /**
   * Reads the trip's list into the store; one read per trip at a time. Answers
   * the list the store holds afterwards, null while it holds none. Never throws.
   */
  load: (tripId: number) => Promise<TripAddon[] | null>;
  /** Puts a list the server sent (an answer or a push) in place. */
  publish: (tripId: number, addons: TripAddon[]) => void;
  /** The owner switches one addon for the trip (null: back to the instance setting). Online only; throws on refusal. */
  setOverride: (tripId: number, addonId: string, enabled: boolean | null) => Promise<TripAddon[]>;
}

function keyOf(tripId: number): string {
  return `${useAuthStore.getState().user?.id ?? 'anon'}:${tripId}`;
}

// The read running per trip, so a second caller waits for its answer instead of taking the older list.
const reading = new Map<string, Promise<TripAddon[] | null>>();

export const useTripAddonsStore = create<TripAddonsState>((set, get) => ({
  trips: {},

  load: (tripId) => {
    if (!Number.isSafeInteger(tripId) || tripId < 1) return Promise.resolve(null);
    const key = keyOf(tripId);
    const before = get().trips[key];
    if (before?.status === 'loading') return reading.get(key) ?? Promise.resolve(before.addons);
    const read = (async () => {
      const rev = (before?.rev ?? 0) + 1;
      set((state) => ({
        trips: { ...state.trips, [key]: { addons: before?.addons ?? null, status: 'loading', rev } },
      }));
      let addons: TripAddon[] | null = null;
      try {
        addons = await tripAddonsRepo.list(tripId);
      } catch {
        // Offline with nothing kept, or the server refused: the readers fall back to the instance switches.
      }
      const current = get().trips[key];
      // A push that landed meanwhile is newer than this answer and stays, in the
      // store and in the device's copy the answer was written over.
      if (current && current.rev !== rev) {
        if (addons && current.addons) void tripAddonsRepo.remember(tripId, current.addons).catch(() => {});
        return current.addons;
      }
      const entry: TripAddonsEntry = addons
        ? { addons, status: 'ready', rev }
        : { addons: current?.addons ?? null, status: 'failed', rev };
      set((state) => ({ trips: { ...state.trips, [key]: entry } }));
      return entry.addons;
    })().finally(() => {
      if (reading.get(key) === read) reading.delete(key);
    });
    reading.set(key, read);
    return read;
  },

  publish: (tripId, addons) => {
    const key = keyOf(tripId);
    set((state) => ({
      trips: { ...state.trips, [key]: { addons, status: 'ready', rev: (state.trips[key]?.rev ?? 0) + 1 } },
    }));
  },

  setOverride: async (tripId, addonId, enabled) => {
    const addons = await tripAddonsRepo.setOverride(tripId, addonId, enabled);
    get().publish(tripId, addons);
    return addons;
  },
}));

/**
 * Applies `tripAddons:changed`: the trip owner switched an addon on or off, or
 * back to the instance setting, and the push carries the trip's whole list,
 * which goes into the store and the device's copy alike. Returns the function
 * that stops listening.
 */
export function watchTripAddons(): () => void {
  const onEvent = (event: Record<string, unknown>) => {
    if (event?.type !== 'tripAddons:changed') return;
    const tripId = Number(event.tripId);
    const parsed = tripAddonListSchema.safeParse(event.addons);
    if (!parsed.success || !Number.isSafeInteger(tripId) || tripId < 1) return;
    useTripAddonsStore.getState().publish(tripId, parsed.data);
    // The screen already follows. Should the copy for offline use not take the list,
    // it is read again, which writes that copy on its way.
    void tripAddonsRepo.remember(tripId, parsed.data).catch(() => useTripAddonsStore.getState().load(tripId));
  };
  addListener(onEvent);
  return () => removeListener(onEvent);
}

/** The trip's entry for the signed-in account, if the store holds one. */
export function tripAddonsEntry(
  state: TripAddonsState,
  tripId: number | null | undefined
): TripAddonsEntry | undefined {
  return tripId == null ? undefined : state.trips[keyOf(tripId)];
}

/**
 * Whether an addon applies to the trip, read once, outside React: the trip's own
 * list when the store holds it, else the instance switch (`whenUnknown` while
 * that is not known either).
 */
export function tripAddonEnabledNow(tripId: number | null | undefined, addonId: string, whenUnknown = false): boolean {
  const own = tripAddonsEntry(useTripAddonsStore.getState(), tripId)?.addons;
  return tripAddonEnabled(own, addonId, instanceAddonOn(useAddonStore.getState(), addonId, whenUnknown));
}

/**
 * Whether an addon applies to the trip, for a component inside a trip view: the
 * trip's own list once read, the instance switch before. Reads only; the trip
 * planner (useTripAddons) loads the list and the live sync keeps it current.
 */
export function useTripAddonEnabled(tripId: number | null | undefined, addonId: string): boolean {
  const own = useTripAddonsStore(
    (state) => tripAddonsEntry(state, tripId)?.addons?.find((a) => a.id === addonId)?.enabled
  );
  const instance = useAddonStore((state) => state.isEnabled(addonId));
  return own ?? instance;
}
