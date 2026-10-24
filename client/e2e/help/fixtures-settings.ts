import type { APIRequestContext, Page } from '@playwright/test';
import { toggleAddon } from './external';
import { pluginPackage, seededTrip } from './fixtures';

/**
 * What the settings guides need beyond the seed: a wanderer to connect to, a
 * plugin so the Plugins tab exists, and two parked offline changes so the
 * Sync conflicts card and the failed changes have something to show.
 *
 * The wanderer guides follow the pattern of `external.ts`: the address and the
 * token come from `e2e/help/media.env`, and without them those guides fail at
 * their start while every other guide runs as before.
 *
 *   # wanderer (Settings, Integrations: wanderer). A token from wanderer under
 *   # Settings, Account, API tokens; it starts with wanderer_key_.
 *   HELP_MEDIA_WANDERER_URL=http://192.168.1.10:3030
 *   HELP_MEDIA_WANDERER_TOKEN=wanderer_key_...
 *
 * TREK's wanderer connection takes a URL and an API token, nothing else (see
 * `wandererSettingsRequestSchema`), so no user name or password is needed. As
 * with the other services, the address has to be the machine's LAN address and
 * the media backend needs ALLOW_INTERNAL_NETWORK=true.
 */

export function mediaEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is not set; see client/e2e/help/README.md for the media.env the external guides need`);
  return value.replace(/\/+$/, '');
}

// ── wanderer ────────────────────────────────────────────────────────────────

export const wandererUrl = (): string => mediaEnv('HELP_MEDIA_WANDERER_URL');
export const wandererToken = (): string => mediaEnv('HELP_MEDIA_WANDERER_TOKEN');

/** The admin's wanderer switch under Tours, as it was before the guide turned it on. */
let wandererWasOn: boolean | null = null;

/**
 * The Tours addon on and wanderer allowed under it, so the wanderer card shows
 * in Integrations, with no connection yet. Remembers the admin switch, so
 * `disconnectWanderer` puts it back the way the seed had it.
 */
export async function allowWanderer(api: APIRequestContext): Promise<void> {
  // Both variables first: a missing one should fail here, not halfway into a picture.
  wandererUrl();
  wandererToken();
  await toggleAddon(api, 'tours', true);
  if (wandererWasOn === null) {
    const current = await api.get('/api/admin/tours-wanderer');
    wandererWasOn = current.ok() ? !!((await current.json()) as { enabled?: boolean }).enabled : false;
  }
  const res = await api.put('/api/admin/tours-wanderer', { data: { enabled: true } });
  if (!res.ok()) throw new Error(`could not allow wanderer under Tours: ${res.status()} ${await res.text()}`);
  await api.delete('/api/integrations/wanderer/settings');
}

/** Connected through the API and tested, loudly, for the guides that start from a connection. */
export async function ensureWandererConnection(api: APIRequestContext): Promise<void> {
  await allowWanderer(api);
  const saved = await api.put('/api/integrations/wanderer/settings', {
    data: { url: wandererUrl(), token: wandererToken(), allowInsecureTls: false },
  });
  if (!saved.ok()) throw new Error(`could not save the wanderer connection: ${saved.status()} ${await saved.text()}`);
  const test = await api.post('/api/integrations/wanderer/test', { data: {} });
  const body = (await test.json()) as { ok?: boolean; code?: string };
  if (!body.ok)
    throw new Error(
      `wanderer is not reachable from the media backend: ${body.code ?? test.status()} (is ALLOW_INTERNAL_NETWORK=true?)`
    );
  await api.put('/api/integrations/wanderer/watch', { data: { enabled: false } });
}

/** The watch off, the connection gone, and the admin switch back where it was. */
export async function disconnectWanderer(api: APIRequestContext): Promise<void> {
  await api.put('/api/integrations/wanderer/watch', { data: { enabled: false } });
  await api.delete('/api/integrations/wanderer/settings');
  if (wandererWasOn === false) await api.put('/api/admin/tours-wanderer', { data: { enabled: false } });
  wandererWasOn = null;
}

// ── Plugins ─────────────────────────────────────────────────────────────────

/**
 * The Plugins tab only exists while a plugin is active. The seed installs two
 * from the registry, which needs the network, and the admin file uninstalls
 * Trip Doctor in its cleanup; so when no plugin is active any more, the SDK's
 * Trip Doctor example is sideloaded and switched on. Answers whether it did,
 * so the caller can take it away again.
 */
export async function ensureActivePlugin(api: APIRequestContext): Promise<boolean> {
  const feed = await api.get('/api/plugins');
  const { plugins = [] } = (await feed.json()) as { plugins?: { id: string }[] };
  if (plugins.length > 0) return false;
  const upload = await api.post('/api/admin/plugins/upload', {
    multipart: { file: { name: 'trip-doctor.tar.gz', mimeType: 'application/gzip', buffer: pluginPackage() } },
  });
  if (!upload.ok()) throw new Error(`could not upload the plugin: ${upload.status()} ${await upload.text()}`);
  const active = await api.post('/api/admin/plugins/trip-doctor/activate', { data: { consent: true } });
  if (!active.ok()) throw new Error(`could not activate the plugin: ${active.status()} ${await active.text()}`);
  return true;
}

export async function removeSideloadedPlugin(api: APIRequestContext): Promise<void> {
  await api.post('/api/admin/plugins/trip-doctor/uninstall', { data: { deleteData: true } });
}

// ── Offline: parked changes ─────────────────────────────────────────────────

/** The two rows this file parks in the offline queue; their ids make them easy to take out again. */
const CONFLICT_ID = 'help-media-conflict-nishiki';
const FAILED_ID = 'help-media-failed-todaiji';
export const CONFLICT_PLACE = 'Nishiki Market';
export const FAILED_PLACE = 'Todai-ji';

async function placeId(api: APIRequestContext, tripId: number, name: string): Promise<number> {
  const res = await api.get(`/api/trips/${tripId}/places`);
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[];
  const place = (Array.isArray(body) ? body : (body.places ?? [])).find((p) => p.name === name);
  if (!place) throw new Error(`the seeded trip has no place "${name}"`);
  return place.id;
}

/**
 * A change that clashes with the server and one the server keeps refusing,
 * written straight into this browser's offline queue (Dexie table
 * `mutationQueue` of `trek-offline-u<userId>`), the way the mutation queue
 * parks them. Neither is ever replayed on its own: a parked row waits for
 * Keep mine, Keep theirs, Try again or Discard, none of which the guide
 * clicks. Needs the app loaded once, so the database exists.
 */
export async function parkOfflineChanges(page: Page): Promise<void> {
  const { tripId } = seededTrip();
  const me = (await (await page.request.get('/api/auth/me')).json()) as { user: { id: number } };
  const conflictPlace = await placeId(page.request, tripId, CONFLICT_PLACE);
  const failedPlace = await placeId(page.request, tripId, FAILED_PLACE);
  const now = Date.now();
  const rows = [
    {
      id: CONFLICT_ID,
      tripId,
      method: 'PUT',
      url: `/trips/${tripId}/places/${conflictPlace}`,
      body: { name: CONFLICT_PLACE, notes: 'Go before 10, the stalls open early.' },
      createdAt: now - 60_000,
      status: 'conflict',
      attempts: 1,
      lastError: 'conflict',
      resource: 'places',
      entityId: conflictPlace,
      baseUpdatedAt: null,
      conflictServer: { name: CONFLICT_PLACE },
      conflictAt: now - 30_000,
      schemaVersion: 1,
    },
    {
      id: FAILED_ID,
      tripId,
      method: 'PUT',
      url: `/trips/${tripId}/places/${failedPlace}`,
      body: { name: FAILED_PLACE, notes: 'Deer crackers at the gate.' },
      createdAt: now - 50_000,
      status: 'failed',
      attempts: 5,
      lastError: 'HTTP 500',
      resource: 'places',
      entityId: failedPlace,
      baseUpdatedAt: null,
      schemaVersion: 1,
    },
  ];
  await page.evaluate(
    async ({ name, rows }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open(name);
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      try {
        if (!db.objectStoreNames.contains('mutationQueue'))
          throw new Error(`${name} has no mutationQueue; was the app loaded?`);
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('mutationQueue', 'readwrite');
          for (const row of rows) tx.objectStore('mutationQueue').put(row);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    { name: `trek-offline-u${me.user.id}`, rows }
  );
}

/** Takes the two parked rows out again, whatever the guide did with them. */
export async function clearParkedChanges(page: Page): Promise<void> {
  const me = (await (await page.request.get('/api/auth/me')).json()) as { user: { id: number } };
  await page.evaluate(
    async ({ name, ids }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open(name);
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      try {
        if (!db.objectStoreNames.contains('mutationQueue')) return;
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('mutationQueue', 'readwrite');
          for (const id of ids) tx.objectStore('mutationQueue').delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    { name: `trek-offline-u${me.user.id}`, ids: [CONFLICT_ID, FAILED_ID] }
  );
}
