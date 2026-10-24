import type { APIRequestContext } from '@playwright/test';
import { ensureDawarichConnection, toggleAddon } from './external';

/**
 * What the places column's own guides need beyond the seed and `fixtures.ts`.
 * Not a `.guide.ts`, so importing it registers no tests.
 */

interface Suggestion {
  id: number;
  state: string;
  name: string;
  acceptedPlaceId: number | null;
}

async function tripSuggestions(api: APIRequestContext, tripId: number): Promise<Suggestion[]> {
  const res = await api.get(`/api/integrations/dawarich/suggestions?tripId=${tripId}`);
  if (!res.ok()) throw new Error(`could not list the Dawarich stays: ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as { suggestions?: Suggestion[] };
  return body.suggestions ?? [];
}

/**
 * Dawarich connected and its stays of the seeded trip read into TREK, at
 * least two of them waiting, so the guide can take one over and put another
 * aside. The connection keeps automatic checks off (`ensureDawarichConnection`);
 * this asks once, by hand, the way Check now does. What an earlier attempt
 * accepted or dismissed is taken back first, so a rerun starts from the same list.
 */
export async function ensureDawarichStays(api: APIRequestContext, tripId: number): Promise<void> {
  await ensureDawarichConnection(api);
  const synced = await api.post('/api/integrations/dawarich/sync');
  if (!synced.ok())
    throw new Error(`could not read the stays from Dawarich: ${synced.status()} ${await synced.text()}`);
  await undoDawarichStays(api, tripId);
  const waiting = (await tripSuggestions(api, tripId)).filter((s) => s.state === 'new');
  if (waiting.length < 2) {
    throw new Error(
      `Dawarich gave ${waiting.length} waiting stays for the trip; the guide needs two. ` +
        'Does the instance detect visits in the uploaded recording (Dawarich > Visits)?'
    );
  }
}

/** Puts every dismissed stay of the trip back into review. */
export async function resetDawarichStays(api: APIRequestContext, tripId: number): Promise<void> {
  for (const s of await tripSuggestions(api, tripId)) {
    if (s.state !== 'dismissed') continue;
    const res = await api.put(`/api/integrations/dawarich/suggestions/${s.id}/state`, { data: { state: 'new' } });
    if (!res.ok()) throw new Error(`could not put back the stay ${s.name}: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Tours is on for every install, and with it on the places column has no
 * Import file. The file guide pictures the column of an install that switched
 * it off, and switches it back on afterwards.
 */
export const setTours = (api: APIRequestContext, enabled: boolean): Promise<void> => toggleAddon(api, 'tours', enabled);

/**
 * Takes back what the Dawarich guide did: the places it accepted are deleted,
 * which returns their stays to review on the server, and the dismissed stays
 * are put back. By the ids the stays carry, never by name: a stay is often
 * named like a place of the seed, and deleting by name would take that one too.
 */
export async function undoDawarichStays(api: APIRequestContext, tripId: number): Promise<void> {
  for (const s of await tripSuggestions(api, tripId)) {
    if (s.state !== 'accepted' || s.acceptedPlaceId == null) continue;
    const res = await api.delete(`/api/trips/${tripId}/places/${s.acceptedPlaceId}`);
    if (!res.ok() && res.status() !== 404)
      throw new Error(`could not delete the place from ${s.name}: ${res.status()} ${await res.text()}`);
  }
  await resetDawarichStays(api, tripId);
}
