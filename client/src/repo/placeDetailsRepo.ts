import { mapsApi } from '../api/client';
import { requireOnline } from './onlineOnly';

/**
 * A provider's details of a place, looked up fresh (Google, the TREK index or
 * OpenStreetMap, by the id the place carries). **Online-only, no Dexie table:**
 * the point of asking is the current answer, and a cached one would offer the
 * same values again as if they were new.
 */
export const placeDetailsRepo = {
  async details(placeId: string, lang: string): Promise<Record<string, unknown> | null> {
    requireOnline();
    const answer = (await mapsApi.details(placeId, lang)) as { place?: Record<string, unknown> | null } | null;
    return answer?.place ?? null;
  },
};
