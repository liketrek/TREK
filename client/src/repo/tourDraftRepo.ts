import { tourDraftPayloadSchema, tourDraftPutRequestSchema, tourDraftResponseSchema } from '@trek/shared';
import { tourDraftPath, tourDraftsApi } from '../api/tourDrafts';
import { cachedTourDraft, cacheTourDraft } from '../db/cacheTourDrafts';
import { offlineDb } from '../db/offlineDb';
import { generateUUID, mutationQueue } from '../sync/mutationQueue';
import { cacheAfterWrite } from './dayRepo';
import { isNetworkError, onlineThenCache } from './withOfflineFallback';

/** The queue's resource of a draft write; the entity is the trip, since a user keeps one draft per trip. */
const RESOURCE = 'tourDrafts';

/** How long the planner's edits settle before the draft is written; the newest one of that time is the one sent. */
export const TOUR_DRAFT_KEEP_DELAY_MS = 1000;

/** Where the planner kept its draft in this browser before drafts moved to the account. */
function legacyKey(tripId: number): string {
  return `tour-draft-${tripId}`;
}

/** The draft the old planner left in this browser: its text, or null for none; storage that is blocked holds none. */
function legacyDraft(tripId: number): string | null {
  try {
    return localStorage.getItem(legacyKey(tripId));
  } catch {
    return null;
  }
}

function dropLegacyDraft(tripId: number): void {
  try {
    localStorage.removeItem(legacyKey(tripId));
  } catch {
    // Blocked storage held nothing to drop.
  }
}

/**
 * The draft as the newest write still waiting in the queue says it: its text,
 * null for a discard, undefined when none waits. One that failed or waits as a
 * conflict is not laid over: the server did not take it.
 */
async function queuedDraft(tripId: number): Promise<string | null | undefined> {
  const queue = await offlineDb.mutationQueue.where('tripId').equals(tripId).sortBy('createdAt');
  let latest: string | null | undefined;
  for (const m of queue) {
    if (m.resource !== RESOURCE || (m.status !== 'pending' && m.status !== 'syncing')) continue;
    if (m.method === 'DELETE') {
      latest = null;
      continue;
    }
    const body = tourDraftPutRequestSchema.safeParse(m.body);
    if (body.success) latest = body.data.payload;
  }
  return latest;
}

/**
 * Queues a draft write behind whatever waits for the trip. The latest draft
 * wins, so an older write of it that has not gone out yet is dropped instead
 * of being sent first.
 */
async function queueWrite(tripId: number, method: 'PUT' | 'DELETE', body?: { payload: string }): Promise<void> {
  await offlineDb.transaction('rw', offlineDb.mutationQueue, async () => {
    await offlineDb.mutationQueue
      .where('tripId')
      .equals(tripId)
      .filter((m) => m.resource === RESOURCE && m.status === 'pending')
      .delete();
    await mutationQueue.enqueue({
      id: generateUUID(),
      tripId,
      method,
      url: tourDraftPath(tripId),
      body,
      resource: RESOURCE,
      entityId: tripId,
    });
  });
  mutationQueue.sendSoon();
}

/** Writes the draft: online straight to the account, offline (or behind an older queued write) through the queue. */
async function sendKeep(tripId: number, payload: string): Promise<void> {
  const body = { payload };
  if (!(await mutationQueue.mustQueue(RESOURCE, tripId))) {
    try {
      const { draft } = tourDraftResponseSchema.parse(await tourDraftsApi.keep(tripId, body));
      cacheAfterWrite(cacheTourDraft(tripId, draft), 'keeping the tour draft');
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }
  await queueWrite(tripId, 'PUT', body);
}

async function sendForget(tripId: number): Promise<void> {
  if (!(await mutationQueue.mustQueue(RESOURCE, tripId))) {
    try {
      await tourDraftsApi.forget(tripId);
      cacheAfterWrite(cacheTourDraft(tripId, null), 'discarding the tour draft');
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }
  await queueWrite(tripId, 'DELETE');
}

/** The draft writes of each trip, one after the other, so the order the planner made them in is the order they land. */
const chains = new Map<number, Promise<boolean>>();
/** A draft waiting for the planner's edits to settle, per trip. */
const waiting = new Map<number, { timer: ReturnType<typeof setTimeout>; payload: string }>();

function inOrder(tripId: number, write: () => Promise<void>): Promise<void> {
  const cacheName = offlineDb.name;
  const run = (chains.get(tripId) ?? Promise.resolve(true)).then(async () => {
    // Signed out or into another account meanwhile: the draft is not theirs to write.
    if (offlineDb.name === cacheName) await write();
  });
  const settled = run.then(
    () => true,
    () => false
  );
  chains.set(tripId, settled);
  void settled.then(() => {
    if (chains.get(tripId) === settled) chains.delete(tripId);
  });
  return run;
}

function sendWaiting(tripId: number): void {
  const draft = waiting.get(tripId);
  if (!draft) return;
  clearTimeout(draft.timer);
  waiting.delete(tripId);
  cacheAfterWrite(
    inOrder(tripId, () => sendKeep(tripId, draft.payload)),
    'keeping the tour draft'
  );
}

/**
 * The Tours planner's unsaved draft on the account, one per user and trip,
 * through the offline core. Dexie holds the draft as the account last said it,
 * and a draft written offline waits in the queue as the only copy of it; a
 * read lays the newest queued one over the cached row. Drafts carry no
 * version: the latest write wins. A draft the old planner kept in this
 * browser's local storage is read once, uploaded where the account holds none,
 * and removed.
 */
export const tourDraftRepo = {
  /** The trip's draft as JSON text, null for none; a draft still waiting to be written goes out first. */
  async read(tripId: number | string): Promise<string | null> {
    const id = Number(tripId);
    sendWaiting(id);
    await (chains.get(id) ?? Promise.resolve(true));
    const cacheName = offlineDb.name;
    const base = await onlineThenCache(
      async () => {
        const { draft } = tourDraftResponseSchema.parse(await tourDraftsApi.read(id));
        if (offlineDb.name === cacheName) cacheAfterWrite(cacheTourDraft(id, draft), 'reading the tour draft');
        return draft?.payload ?? null;
      },
      async () => (await cachedTourDraft(id))?.payload ?? null
    );
    const queued = await queuedDraft(id);
    const kept = queued === undefined ? base : queued;
    const legacy = legacyDraft(id);
    if (legacy === null) return kept;
    if (kept !== null || !tourDraftPayloadSchema.safeParse(legacy).success) {
      // The account's draft is the newer one, or the old one is no draft at all.
      dropLegacyDraft(id);
      return kept;
    }
    // Not taken this time, the old draft stays where it was: the planner restores it all
    // the same, and the next read uploads it again.
    const upload = inOrder(id, () => sendKeep(id, legacy)).then(() => dropLegacyDraft(id));
    cacheAfterWrite(upload, 'moving the tour draft to the account');
    await upload.then(
      () => true,
      () => false
    );
    return legacy;
  },

  /** Keeps the draft once the planner's edits have settled; a newer one before then replaces it. */
  keep(tripId: number | string, payload: string): void {
    const id = Number(tripId);
    const before = waiting.get(id);
    if (before) clearTimeout(before.timer);
    const timer = setTimeout(() => sendWaiting(id), TOUR_DRAFT_KEEP_DELAY_MS);
    waiting.set(id, { timer, payload });
  },

  /** Writes a draft still waiting for its delay at once, as the planner closes. */
  flush(tripId: number | string): void {
    sendWaiting(Number(tripId));
  },

  /** Forgets the trip's draft, a waiting one included, once it is saved or thrown away. */
  forget(tripId: number | string): Promise<void> {
    const id = Number(tripId);
    const before = waiting.get(id);
    if (before) clearTimeout(before.timer);
    waiting.delete(id);
    return inOrder(id, () => sendForget(id));
  },
};
