import { tripAddonsResponseSchema, type TripAddon } from '@trek/shared';

import { tripAddonsApi } from '../api/tripAddons';
import { offlineDb } from '../db/offlineDb';
import { requireOnline } from './onlineOnly';
import { onlineThenCache } from './withOfflineFallback';

/** The trip's addons as the device last read them, or null while it never did. */
export async function cachedTripAddons(tripId: number): Promise<TripAddon[] | null> {
  return (await offlineDb.tripAddons.get(tripId))?.addons ?? null;
}

/**
 * Keeps the list the server sent, unless the signed-in account changed while it
 * was on its way: the database is the account's own, and the list belongs to the
 * one that asked.
 */
async function keep(tripId: number, addons: TripAddon[], cacheName: string): Promise<void> {
  if (offlineDb.name !== cacheName) throw new Error('Account changed.');
  await offlineDb.tripAddons.put({ tripId, addons });
}

/**
 * The trip addons of one trip, each on or off for it. Reading works offline,
 * from the list the device last read. Switching one is online only, on purpose:
 * only the owner may do it, the server says whether they may, and a change
 * queued offline could switch a section on or off for every member long after
 * the owner forgot about it.
 */
export const tripAddonsRepo = {
  async list(tripId: number): Promise<TripAddon[]> {
    const cacheName = offlineDb.name;
    return onlineThenCache(
      async () => {
        const { addons } = tripAddonsResponseSchema.parse(await tripAddonsApi.list(tripId));
        await keep(tripId, addons, cacheName);
        return addons;
      },
      async () => {
        const cached = await cachedTripAddons(tripId);
        if (!cached) throw new Error('The addons of this trip are not available offline.');
        return cached;
      }
    );
  },

  /** `enabled: null` goes back to the instance setting. Answers the trip's whole list after the change. */
  async setOverride(tripId: number, addonId: string, enabled: boolean | null): Promise<TripAddon[]> {
    requireOnline();
    const cacheName = offlineDb.name;
    const { addons } = tripAddonsResponseSchema.parse(await tripAddonsApi.update(tripId, addonId, { enabled }));
    await keep(tripId, addons, cacheName);
    return addons;
  },

  /** A list another member's change sent along (`tripAddons:changed`), kept like a read. */
  async remember(tripId: number, addons: TripAddon[]): Promise<void> {
    await keep(tripId, addons, offlineDb.name);
  },
};
