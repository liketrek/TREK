import type { APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TOUR_GPX, TOUR_NAMES, tourGpxFixture } from './tour-fixtures';

/**
 * What the "getting tours in" guides (`trip-tour-import.guide.ts`) need on top
 * of `ensureToursFixtures`: a few API helpers to put the Dolomites tours back
 * after a guide imported, planned over or took one over, and the wanderer
 * instance the trail import is pictured against.
 *
 * wanderer is a service outside TREK, set up like the ones in `external.ts`:
 * its address and an API token come from `e2e/help/media.env`
 * (HELP_MEDIA_WANDERER_URL, HELP_MEDIA_WANDERER_TOKEN, and
 * HELP_MEDIA_WANDERER_INSECURE=true for a self-signed certificate). The
 * fixture uploads its own trails into that account, so the picture does not
 * depend on what happens to be in it. Without the variables only the wanderer
 * guide fails, loudly, at its start. The address has to be the machine's LAN
 * address and the media backend needs ALLOW_INTERNAL_NETWORK=true, as for the
 * other services (README, "The guides that show another service").
 */

// ── TREK ──────────────────────────────────────────────────────────────────────

export interface TourRowLite {
  place_id: number;
  name: string;
  has_waypoints?: boolean;
  has_recorded_track?: boolean;
}

async function ok<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 400)}`);
  return (await res.json()) as T;
}

export async function tripIdByTitle(api: APIRequestContext, title: string): Promise<number> {
  const { trips } = await ok<{ trips: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  const trip = trips.find((t) => t.title === title);
  if (!trip) throw new Error(`no trip "${title}": call ensureToursFixtures in beforeAll`);
  return trip.id;
}

export async function toursOfTrip(api: APIRequestContext, tripId: number): Promise<TourRowLite[]> {
  return (await ok<{ tours: TourRowLite[] }>(await api.get(`/api/trips/${tripId}/tours`), `tours of trip ${tripId}`))
    .tours;
}

export async function tourNamed(
  api: APIRequestContext,
  tripId: number,
  name: string
): Promise<TourRowLite | undefined> {
  return (await toursOfTrip(api, tripId)).find((t) => t.name === name);
}

/** Deletes every tour of the trip with one of these names; a tour is a place, so it goes the way of a place. */
export async function deleteToursNamed(api: APIRequestContext, tripId: number, ...names: string[]): Promise<void> {
  for (const tour of await toursOfTrip(api, tripId)) {
    if (!names.includes(tour.name)) continue;
    const res = await api.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
    if (!res.ok()) console.warn(`[tour-import] could not delete "${tour.name}": ${res.status()}`);
  }
}

/** The editor's draft is kept on the server per trip and user; a guide that left one behind would restore it into the next. */
export async function forgetTourDraft(api: APIRequestContext, tripId: number): Promise<void> {
  const res = await api.delete(`/api/trips/${tripId}/tour-draft`);
  if (!res.ok() && res.status() !== 404)
    console.warn(`[tour-import] could not drop the tour draft of trip ${tripId}: ${res.status()}`);
}

/**
 * Puts an import that was planned over in place back to its recorded track,
 * which is what the seed has. Nothing to do for a tour that is still as
 * imported.
 */
export async function restoreRecordedTrack(api: APIRequestContext, tripId: number, name: string): Promise<void> {
  const tour = await tourNamed(api, tripId, name);
  if (!tour?.has_recorded_track) return;
  const res = await api.post(`/api/trips/${tripId}/tours/${tour.place_id}/restore-recorded`);
  if (!res.ok())
    throw new Error(`could not restore the recorded track of "${name}": ${res.status()} ${await res.text()}`);
}

// ── wanderer ──────────────────────────────────────────────────────────────────

function env(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is not set; see client/e2e/help/README.md for the media.env the external guides need`);
  return value.replace(/\/+$/, '');
}

/**
 * The trails the fixture keeps in the wanderer account, by name, each drawn
 * from a recorded walk of `tour-fixtures.ts` near the Dolomites trip. The
 * guide imports the first; the second is there so the list is a list.
 */
export const WANDERER_TRAILS = [
  { name: TOUR_GPX.rasciesa.name, gpx: 'rasciesa' as const },
  { name: 'Seceda ridge from Col Raiser', gpx: 'seceda' as const },
];
/** The trail the guide imports into the Dolomites trip. */
export const WANDERER_TRAIL = WANDERER_TRAILS[0].name;

interface WandererHit {
  id: string;
  name: string;
}

async function wandererSearch(base: string, token: string, q: string): Promise<WandererHit[]> {
  const res = await fetch(`${base}/api/v1/search/trails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, options: { limit: 20 } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`wanderer search: HTTP ${res.status} ${await res.text()}`);
  return ((await res.json()) as { hits?: WandererHit[] }).hits ?? [];
}

/** The GPX under the trail's own name: wanderer names an uploaded trail after its track. */
function renamed(file: string, name: string): string {
  return readFileSync(file, 'utf8').replace(/<name>[^<]*<\/name>/g, `<name>${name}</name>`);
}

async function upload(base: string, token: string, name: string, gpx: string): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };
  // wanderer's documented upload takes the file as the request body.
  const raw = await fetch(`${base}/api/v1/trail/upload`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/gpx+xml' },
    body: gpx,
    signal: AbortSignal.timeout(60_000),
  });
  if (raw.ok) return;
  // Older instances read it as a form field instead.
  const form = new FormData();
  form.append('file', new Blob([gpx], { type: 'application/gpx+xml' }), `${name}.gpx`);
  const multipart = await fetch(`${base}/api/v1/trail/upload`, {
    method: 'PUT',
    headers,
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!multipart.ok)
    throw new Error(`wanderer upload of "${name}": HTTP ${raw.status} / ${multipart.status} ${await multipart.text()}`);
}

/** Puts the fixture's trails into the account the token belongs to, once, and waits until the search finds them. */
export async function ensureWandererTrails(): Promise<void> {
  const base = env('HELP_MEDIA_WANDERER_URL');
  const token = env('HELP_MEDIA_WANDERER_TOKEN');
  for (const trail of WANDERER_TRAILS) {
    if ((await wandererSearch(base, token, trail.name)).some((h) => h.name === trail.name)) continue;
    await upload(base, token, trail.name, renamed(await tourGpxFixture(trail.gpx), trail.name));
    // The search is an index the upload reaches a moment later.
    for (let i = 0; i < 30; i++) {
      if ((await wandererSearch(base, token, trail.name)).some((h) => h.name === trail.name)) break;
      if (i === 29) throw new Error(`wanderer never listed the uploaded trail "${trail.name}"`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/** The admin switch under Tours, then the signed-in user's connection, tested loudly. */
export async function ensureWandererConnection(api: APIRequestContext): Promise<void> {
  await ensureWandererTrails();
  await ok(await api.put('/api/admin/tours-wanderer', { data: { enabled: true } }), 'switch wanderer on');
  await ok(
    await api.put('/api/integrations/wanderer/settings', {
      data: {
        url: env('HELP_MEDIA_WANDERER_URL'),
        token: env('HELP_MEDIA_WANDERER_TOKEN'),
        allowInsecureTls: process.env.HELP_MEDIA_WANDERER_INSECURE === 'true',
      },
    }),
    'save the wanderer connection'
  );
  const test = await ok<{ ok: boolean; code?: string }>(
    await api.post('/api/integrations/wanderer/test', { data: {} }),
    'test the wanderer connection'
  );
  if (!test.ok)
    throw new Error(
      `wanderer is not reachable from the media backend: ${test.code ?? 'unknown'} (is ALLOW_INTERNAL_NETWORK=true?)`
    );
}

/** Takes the connection away and switches wanderer off again, as every other screen expects it. */
export async function disconnectWanderer(api: APIRequestContext): Promise<void> {
  await api.delete('/api/integrations/wanderer/settings');
  await api.put('/api/admin/tours-wanderer', { data: { enabled: false } });
}

/** The recorded walk the import guides pick in the file chooser. */
export const importFile = async (): Promise<string> => path.resolve(await tourGpxFixture('rasciesa'));
export const IMPORTED_NAME = TOUR_GPX.rasciesa.name;
export const RECORDED_NAME = TOUR_NAMES.recorded;
