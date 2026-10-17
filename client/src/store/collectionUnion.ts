import type { CollectionPlace } from '@trek/shared';
import { collectionsApi } from '../api/collections';

/** Detail requests fired at once while building the union. A user with many
 *  lists would otherwise open "All saved" (or the trip's saved-places picker)
 *  with one full list read per list, all in parallel (#2559). */
const DETAIL_BATCH = 4;

/** Union of every list's places, in list order, without duplicates. A list
 *  that cannot be read is skipped. */
export async function loadUnionPlaces(ids: number[]): Promise<CollectionPlace[]> {
  const merged: CollectionPlace[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < ids.length; i += DETAIL_BATCH) {
    const batch = await Promise.all(
      ids.slice(i, i + DETAIL_BATCH).map((id) =>
        collectionsApi.get(id).catch(() => {
          // A list that cannot be read (left, deleted, unreachable) is skipped, so
          // the union still holds the places of every list that can be.
          return null;
        })
      )
    );
    for (const d of batch) {
      if (!d) continue;
      for (const p of d.places) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        merged.push(p);
      }
    }
  }
  return merged;
}
