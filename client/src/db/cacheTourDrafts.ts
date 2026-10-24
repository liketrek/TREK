import type { TourDraft } from '@trek/shared';
import { offlineDb } from './offlineDb';

/** The trip's draft as the account last said it; null while none is cached. */
export async function cachedTourDraft(tripId: number): Promise<TourDraft | null> {
  return (await offlineDb.tourDrafts.get(tripId))?.draft ?? null;
}

/** Keeps the trip's draft as the account answered it, or forgets it for none. */
export async function cacheTourDraft(tripId: number, draft: TourDraft | null): Promise<void> {
  if (draft) await offlineDb.tourDrafts.put({ tripId, draft });
  else await offlineDb.tourDrafts.delete(tripId);
}
