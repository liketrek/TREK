import type { APIRequestContext } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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
 * Tours is on for every install. No guide of the places column switches it off
 * any more; the run still switches it on after the file, in case an older
 * attempt left it off.
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

/** The pins of the file import: three Kyoto sights the seed does not have, as Google My Maps exports them. */
export const KML_PINS: [string, number, number][] = [
  ['Kiyomizu-dera', 34.9949, 135.785],
  ['Yasaka Shrine', 35.0037, 135.7785],
  ['Gion Shirakawa', 35.0059, 135.7748],
];

/** A KML layer of pins only, no line: the file the places column imports as places. Drawn once, on first use. */
export function pinsKmlFixture(): string {
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'kyoto-sights.kml');
  if (existsSync(file)) return file;
  const marks = KML_PINS.map(
    ([name, lat, lng]) =>
      `    <Placemark><name>${name}</name><Point><coordinates>${lng},${lat},0</coordinates></Point></Placemark>`
  ).join('\n');
  writeFileSync(
    file,
    `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Kyoto sights</name>
${marks}
  </Document>
</kml>
`
  );
  return file;
}

interface TripTag {
  id: number;
  name: string;
}

/** The tags the tag guide starts with, and the one it adds itself. */
export const GUIDE_TAGS = [
  { name: 'Must see', color: '#f97316' },
  { name: 'Rainy day', color: '#6366f1' },
  { name: 'Night view', color: '#ec4899' },
];
export const NEW_TAG = 'Photo spot';

async function tripTags(api: APIRequestContext, tripId: number): Promise<TripTag[]> {
  const res = await api.get(`/api/trips/${tripId}/tags`);
  if (!res.ok()) throw new Error(`could not list the trip's tags: ${res.status()} ${await res.text()}`);
  return ((await res.json()) as { tags: TripTag[] }).tags;
}

/** Deletes the guide's tags, which takes them off every place too. */
export async function removeGuideTags(api: APIRequestContext, tripId: number): Promise<void> {
  const names = new Set([...GUIDE_TAGS.map((tag) => tag.name), NEW_TAG].map((name) => name.toLowerCase()));
  for (const tag of await tripTags(api, tripId)) {
    if (!names.has(tag.name.toLowerCase())) continue;
    const res = await api.delete(`/api/trips/${tripId}/tags/${tag.id}`);
    if (!res.ok() && res.status() !== 404) throw new Error(`could not delete the tag ${tag.name}: ${res.status()}`);
  }
}

/**
 * The trip's tags for the tag guide, fresh: Must see, Rainy day and Night view,
 * with Must see already on two places, so the filter at the end has more than
 * the one place the guide tags itself.
 */
export async function ensureGuideTags(api: APIRequestContext, tripId: number, tagged: string[]): Promise<void> {
  await removeGuideTags(api, tripId);
  const ids: Record<string, number> = {};
  for (const tag of GUIDE_TAGS) {
    const res = await api.post(`/api/trips/${tripId}/tags`, { data: tag });
    if (!res.ok()) throw new Error(`could not add the tag ${tag.name}: ${res.status()} ${await res.text()}`);
    ids[tag.name] = ((await res.json()) as { tag: TripTag }).tag.id;
  }
  const list = await api.get(`/api/trips/${tripId}/places`);
  const body = (await list.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[];
  const places = Array.isArray(body) ? body : (body.places ?? []);
  for (const name of tagged) {
    const place = places.find((x) => x.name === name);
    if (!place) throw new Error(`no seeded place "${name}" to tag`);
    const res = await api.put(`/api/trips/${tripId}/places/${place.id}`, { data: { tags: [ids['Must see']] } });
    if (!res.ok()) throw new Error(`could not tag ${name}: ${res.status()} ${await res.text()}`);
  }
}
