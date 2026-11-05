import { offlineDb } from '../db/offlineDb';

/** Roads change; an answer older than this is asked again. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** How many routes the device keeps before the oldest give way. */
const MAX_ROWS = 3000;
/** Pruning counts the table, so it runs every so many writes rather than on each one. */
const PRUNE_EVERY = 100;

let writes = 0;

async function prune(): Promise<void> {
  const extra = (await offlineDb.routeCache.count()) - MAX_ROWS;
  if (extra <= 0) return;
  const oldest = await offlineDb.routeCache.orderBy('savedAt').limit(extra).primaryKeys();
  await offlineDb.routeCache.bulkDelete(oldest);
}

/**
 * Road routes kept on the device, by RouteCalculator's cache key, so a trip that
 * shows its whole route opens with its roads instead of asking the router for
 * every leg again, one a second, on every visit (#2794). A convenience only:
 * anything this store cannot read or write is simply routed again.
 */
export const routeCacheRepo = {
  /** The route kept under `key`, unless it is missing or too old. */
  async get<T>(key: string): Promise<T | null> {
    try {
      const row = await offlineDb.routeCache.get(key);
      if (!row || Date.now() - row.savedAt > MAX_AGE_MS) return null;
      return row.route as T;
    } catch {
      // A closed or blocked database: the leg is routed again.
      return null;
    }
  },

  /** Keeps a route the router just answered. */
  async put(key: string, route: unknown): Promise<void> {
    try {
      await offlineDb.routeCache.put({ key, route, savedAt: Date.now() });
      writes += 1;
      if (writes % PRUNE_EVERY === 0) await prune();
    } catch {
      // A full or blocked database: the route still serves this visit from memory.
    }
  },
};
