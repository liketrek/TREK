import type { APIRequestContext, APIResponse } from '@playwright/test';
import { day } from '../dates';
import { disconnectDawarich, ensureDawarichConnection } from './external';

/**
 * What the journal guides about a recorded day need beyond the seed: the
 * Dawarich from `media.env` connected, a handful of stays on one day of the
 * trip, and those stays synced into TREK, so the day of the journal carries
 * its stay row, its route button and its take-over button.
 *
 * The recording itself is `dawarich-track.ts`, uploaded by
 * `ensureDawarichConnection`. Dawarich detects stays from points only in a
 * background job of its own, so the stays are put there here, as visits, on
 * the Arashiyama day: the times and places are the ones the recording dwells
 * at, so the stays sit on the route.
 *
 * Everything a guide leaves is taken back in `releaseJournalDawarich`: the
 * stays still waiting are dismissed (the trip planner lists waiting stays at
 * the head of its Places column), a kept route is removed, the automatic
 * preparation is switched off, entries the guide wrote are deleted and the
 * addon goes off again. The next guide's `connectJournalDawarich` brings the
 * dismissed stays back.
 */

/** The day the stays are on: the trip's sixth day, Arashiyama and Nishiki. */
export const STAY_DAY = day(-4);

const JST = '+09:00';
const STAYS = [
  { name: 'Togetsukyo Bridge', lat: 35.013, lng: 135.6776, from: '09:30', to: '10:00' },
  { name: 'Arashiyama Bamboo Grove', lat: 35.017, lng: 135.6716, from: '10:10', to: '11:10' },
  { name: 'Nishiki Market', lat: 35.005, lng: 135.7649, from: '12:30', to: '14:00' },
  { name: 'Gion', lat: 35.0037, lng: 135.7752, from: '14:20', to: '15:20' },
];

function env(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is not set; see client/e2e/help/README.md for the media.env the external guides need`);
  return value.replace(/\/+$/, '');
}

async function ok<T>(res: APIResponse, what: string): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

const instant = (time: string) => new Date(`${STAY_DAY}T${time}:00${JST}`).toISOString();

/** The stays on the day as visits in Dawarich; those already there by name are left alone. */
async function ensureDawarichStays(): Promise<void> {
  const base = env('HELP_MEDIA_DAWARICH_URL');
  const key = env('HELP_MEDIA_DAWARICH_API_KEY');
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const from = instant('00:00');
  const to = instant('23:59');
  const listed = await fetch(`${base}/api/v1/visits?start_at=${from}&end_at=${to}`, { headers });
  if (!listed.ok) throw new Error(`Dawarich visits ${STAY_DAY}: HTTP ${listed.status} ${await listed.text()}`);
  const body = (await listed.json()) as { name?: string }[] | { visits?: { name?: string }[] };
  const have = new Set((Array.isArray(body) ? body : (body.visits ?? [])).map((v) => v.name));
  for (const stay of STAYS) {
    if (have.has(stay.name)) continue;
    const created = await fetch(`${base}/api/v1/visits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        visit: {
          name: stay.name,
          latitude: stay.lat,
          longitude: stay.lng,
          started_at: instant(stay.from),
          ended_at: instant(stay.to),
        },
      }),
    });
    if (!created.ok) throw new Error(`Dawarich visit "${stay.name}": HTTP ${created.status} ${await created.text()}`);
  }
}

interface Suggestion {
  id: number;
  state: string;
}

async function suggestions(api: APIRequestContext, state: 'new' | 'dismissed'): Promise<Suggestion[]> {
  const body = await ok<{ suggestions: Suggestion[] }>(
    await api.get(`/api/integrations/dawarich/suggestions?state=${state}`),
    `list ${state} stays`
  );
  return body.suggestions;
}

async function setState(api: APIRequestContext, list: Suggestion[], state: 'new' | 'dismissed'): Promise<void> {
  for (const s of list) {
    await ok(
      await api.put(`/api/integrations/dawarich/suggestions/${s.id}/state`, { data: { state } }),
      `set stay ${s.id} ${state}`
    );
  }
}

/** The ids of the journal's written entries, for `releaseJournalDawarich` to keep. */
export async function writtenEntryIds(api: APIRequestContext, journeyId: number): Promise<Set<number>> {
  const { entries } = await ok<{ entries: { id: number; type: string }[] }>(
    await api.get(`/api/journeys/${journeyId}/entries`),
    'list entries'
  );
  return new Set(entries.filter((e) => e.type !== 'skeleton').map((e) => e.id));
}

/** The addon on, the user connected, the stays in Dawarich and synced into TREK, all waiting again. */
export async function connectJournalDawarich(api: APIRequestContext, journeyId: number): Promise<void> {
  await ensureDawarichConnection(api);
  await ensureDawarichStays();
  await ok(await api.post('/api/integrations/dawarich/sync'), 'sync Dawarich');
  await setState(api, await suggestions(api, 'dismissed'), 'new');
  await ok(
    await api.patch(`/api/journeys/${journeyId}`, { data: { auto_prepare_recordings: false } }),
    'switch the preparation off'
  );
}

/** Everything a recorded-day guide changed, put back; `keep` are the entries that were there before it. */
export async function releaseJournalDawarich(
  api: APIRequestContext,
  journeyId: number,
  keep: Set<number>
): Promise<void> {
  await setState(api, await suggestions(api, 'new'), 'dismissed');
  const { days } = await ok<{ days: { date: string }[] }>(
    await api.get(`/api/journeys/${journeyId}/recordings`),
    'list kept days'
  );
  for (const kept of days) {
    await ok(
      await api.delete(`/api/journeys/${journeyId}/recordings/${kept.date}`),
      `remove the route of ${kept.date}`
    );
  }
  await ok(
    await api.patch(`/api/journeys/${journeyId}`, { data: { auto_prepare_recordings: false } }),
    'switch the preparation off'
  );
  for (const id of await writtenEntryIds(api, journeyId)) {
    if (!keep.has(id)) await ok(await api.delete(`/api/journeys/entries/${id}`), `delete entry ${id}`);
  }
  await disconnectDawarich(api);
}
