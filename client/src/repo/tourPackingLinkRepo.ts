import type { TourDetailResponse, TourPackingLink, TourPackingLinkRequest } from '@trek/shared';
import { tourPackingLinkApi, tourPackingLinkPath } from '../api/tourPackingLink';
import { cacheTourAnswer } from '../db/cacheTour';
import { offlineDb } from '../db/offlineDb';
import { generateUUID, mutationQueue } from '../sync/mutationQueue';
import { onlineThenCache } from './withOfflineFallback';

/** A link write is a write of its tour: it queues behind the tour's own writes and replays like them. */
const RESOURCE = 'tours';

/** The link as this device last read it: null for none, undefined while it never read one. */
async function cachedLink(placeId: number): Promise<TourPackingLink | null | undefined> {
  return (await offlineDb.tours.get(placeId))?.packing_link;
}

/** Keeps the link on the cached tour, where this device holds that tour. */
async function keepLink(placeId: number, link: TourPackingLink | null): Promise<void> {
  await offlineDb.tours.update(placeId, { packing_link: link });
}

/** Now, in the stored spelling the server's own link time has. */
function storedNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * A link write. Offline, for a tour that has not synced yet, or behind an
 * older write of the same tour still queued, the cached tour takes the link
 * at once and the write waits in the queue; otherwise it goes straight to the
 * server and its answer is cached like any tour write.
 */
async function write(
  tripId: number | string,
  placeId: number,
  request: { method: 'PUT'; body: TourPackingLinkRequest } | { method: 'DELETE' },
  local: TourPackingLink | null
): Promise<TourPackingLink | null> {
  const unsynced = placeId < 0;
  if (unsynced || (await mutationQueue.mustQueue(RESOURCE, placeId))) {
    await keepLink(placeId, local);
    await mutationQueue.enqueue({
      id: generateUUID(),
      tripId: Number(tripId),
      method: request.method,
      url: tourPackingLinkPath(tripId, unsynced ? '{id}' : placeId),
      body: request.method === 'PUT' ? request.body : undefined,
      resource: RESOURCE,
      entityId: placeId,
      ...(unsynced ? { tempEntityId: placeId } : {}),
    });
    mutationQueue.sendSoon();
    return local;
  }
  const answer: TourDetailResponse =
    request.method === 'PUT'
      ? await tourPackingLinkApi.link(tripId, placeId, request.body)
      : await tourPackingLinkApi.unlink(tripId, placeId);
  await cacheTourAnswer(Number(tripId), answer);
  return answer.packing_link ?? null;
}

/**
 * P2D-XD-01 through the offline core. The link is kept on the cached tour, so
 * it reads offline as last read, and a link made or let go offline waits in the
 * queue as a write of its tour. The items it shows are not kept here: they
 * come from the trip's packing list, which has an offline copy of its own.
 */
export const tourPackingLinkRepo = {
  async read(tripId: number | string, placeId: number, signal?: AbortSignal): Promise<TourPackingLink | null> {
    const known = await cachedLink(placeId);
    // A tour written here offline has no link but the one made here.
    if (placeId < 0) return known ?? null;
    // Behind a queued write of the tour (offline, every write is), this device's copy is the newer one.
    if (known !== undefined && (await mutationQueue.mustQueue(RESOURCE, placeId))) return known;
    return onlineThenCache(
      async () => {
        const { packing_link } = await tourPackingLinkApi.read(tripId, placeId, signal);
        await keepLink(placeId, packing_link);
        return packing_link;
      },
      async () => {
        // An aborted request is not a lost connection: the caller moved on.
        signal?.throwIfAborted();
        // Never read here: whether the tour points anywhere is unknown, not "nowhere".
        if (known === undefined) throw new Error('Packing link not available offline');
        return known;
      }
    );
  },

  /** Points the tour at the whole list (category null) or at one category. */
  async link(tripId: number | string, placeId: number, body: TourPackingLinkRequest): Promise<TourPackingLink | null> {
    return write(tripId, placeId, { method: 'PUT', body }, { category: body.category, linked_at: storedNow() });
  },

  /** Lets go of what the tour points at; the packing list stays as it is. */
  async unlink(tripId: number | string, placeId: number): Promise<TourPackingLink | null> {
    return write(tripId, placeId, { method: 'DELETE' }, null);
  },
};
