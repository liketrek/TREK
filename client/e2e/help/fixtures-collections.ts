import { request as apiRequest, type APIRequestContext } from '@playwright/test';
import { E2E_BASE_URL } from '../../playwright.config';
import { SPARE_TRIP } from './fixtures';

/**
 * What the Collections guides need beyond the seed and the shared fixtures:
 * a trip a kept tour can go into, a second list for the duplicate guide and a
 * list another user invites the demo account to. Every helper reads first and
 * only writes what is missing, so a retried guide finds the same state.
 */

type Row = { id: number; title?: string; name?: string };

const rows = <T>(body: unknown, key: string): T[] =>
  Array.isArray(body) ? (body as T[]) : (((body as Record<string, unknown>)?.[key] as T[] | undefined) ?? []);

/** The trip the kept tour is taken into: the Alps trip the Journey guides use as well. */
export const TOUR_TARGET_TRIP = SPARE_TRIP.title;

export async function ensureTourTargetTrip(api: APIRequestContext): Promise<number> {
  const res = await api.get('/api/trips');
  const trips = rows<Row>(await res.json(), 'trips');
  const have = trips.find((t) => t.title === SPARE_TRIP.title);
  if (have) return have.id;
  const created = await api.post('/api/trips', { data: SPARE_TRIP });
  if (!created.ok())
    throw new Error(`could not create "${SPARE_TRIP.title}": ${created.status()} ${await created.text()}`);
  const body = (await created.json()) as { trip?: { id: number }; id?: number };
  const id = body.trip?.id ?? body.id;
  if (id == null) throw new Error(`"${SPARE_TRIP.title}" came back without an id`);
  return id;
}

// ── Lists over the API ─────────────────────────────────────────────────────────

export async function listIdOf(api: APIRequestContext, name: string): Promise<number | null> {
  const res = await api.get('/api/addons/collections');
  if (!res.ok()) throw new Error(`GET collections: ${res.status()}`);
  const lists = rows<Row>(await res.json(), 'collections');
  return lists.find((l) => l.name === name)?.id ?? null;
}

export async function createList(
  api: APIRequestContext,
  name: string,
  color: string,
  description?: string
): Promise<number> {
  const res = await api.post('/api/addons/collections', { data: { name, color, description } });
  if (!res.ok()) throw new Error(`could not create the list "${name}": ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as { id?: number; collection?: { id: number } };
  const id = body.id ?? body.collection?.id;
  if (id == null) throw new Error(`the list "${name}" came back without an id`);
  return id;
}

export async function deleteList(api: APIRequestContext, name: string): Promise<void> {
  const id = await listIdOf(api, name);
  if (id == null) return;
  const res = await api.delete(`/api/addons/collections/${id}`);
  if (!res.ok() && res.status() !== 404) throw new Error(`DELETE list "${name}": ${res.status()}`);
}

/** The empty list the duplicate guide copies two temples into; removed again in its cleanup. */
export const SECOND_LIST = { name: 'Kyoto temples', color: '#0ea5e9' };

export async function ensureSecondList(api: APIRequestContext): Promise<void> {
  if ((await listIdOf(api, SECOND_LIST.name)) == null) await createList(api, SECOND_LIST.name, SECOND_LIST.color);
}

// ── An invite from another user ───────────────────────────────────────────────

/** The seeded member who shares a list with the demo account. */
const INVITER = { email: 'mira@example.com', password: 'DemoSeed12345!' };

/** Mira's list, with two places, so the accepted invite opens on something real. */
export const INVITED_LIST = {
  name: 'Osaka street food',
  color: '#ef4444',
  description: 'Takoyaki, okonomiyaki and the stalls of Kuromon.',
  places: [
    { name: 'Kuromon Market', lat: 34.6655, lng: 135.5068, address: '2 Chome-4-1 Nipponbashi, Chuo Ward, Osaka' },
    { name: 'Dotonbori', lat: 34.6687, lng: 135.5013, address: 'Dotonbori, Chuo Ward, Osaka' },
  ],
};

/**
 * A request context acting as the inviter. Its own context with a bearer
 * token: a login on the shared one would set the session cookie there, and
 * every later request would be hers.
 */
async function asInviter(): Promise<APIRequestContext> {
  const anon = await apiRequest.newContext({ baseURL: E2E_BASE_URL, storageState: undefined });
  const login = await anon.post('/api/auth/login', { data: INVITER });
  const token = login.ok() ? ((await login.json()) as { token?: string }).token : undefined;
  await anon.dispose();
  if (!token) throw new Error(`could not log in as ${INVITER.email}`);
  return apiRequest.newContext({
    baseURL: E2E_BASE_URL,
    storageState: undefined,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Mira makes her list afresh and invites the demo account as an editor. A list
 * left over from an earlier attempt is deleted first, so the invite is always
 * pending when the guide starts.
 */
export async function sendInviteToMe(api: APIRequestContext): Promise<void> {
  const me = await api.get('/api/auth/me');
  const myId = ((await me.json()) as { user: { id: number } }).user.id;
  const mira = await asInviter();
  try {
    await deleteList(mira, INVITED_LIST.name);
    const id = await createList(mira, INVITED_LIST.name, INVITED_LIST.color, INVITED_LIST.description);
    for (const place of INVITED_LIST.places) {
      const res = await mira.post('/api/addons/collections/places', { data: { collection_id: id, ...place } });
      if (!res.ok())
        throw new Error(`could not add "${place.name}" to "${INVITED_LIST.name}": ${res.status()} ${await res.text()}`);
    }
    const invite = await mira.post('/api/addons/collections/invite', {
      data: { collection_id: id, user_id: myId, role: 'editor' },
    });
    if (!invite.ok()) throw new Error(`could not invite the demo account: ${invite.status()} ${await invite.text()}`);
  } finally {
    await mira.dispose();
  }
}

/** The inviter deletes her list again, which takes it off the demo account's rail. */
export async function withdrawInvitedList(): Promise<void> {
  const mira = await asInviter();
  try {
    await deleteList(mira, INVITED_LIST.name);
  } finally {
    await mira.dispose();
  }
}
