import type { APIRequestContext } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { short } from '../dates';
import { drawPdf, seededTrip } from './fixtures';
import { TOUR_NAMES, tourDayOffset } from './tour-fixtures';

/**
 * What the tour card's guides need beyond `ensureToursFixtures`: a packing
 * category of the via ferrata gear for the ferrata tour to be linked to (two
 * of its items packed, so the bar is partly full), the hut booking a guide
 * uploads to the hut trek, and the small API helpers the guides clean up with.
 * Everything here is idempotent: it finds its rows by name before it makes them.
 */

/** The packing category the ferrata tour gets linked to in `tour-packing-link`. */
export const FERRATA_PACKING = {
  category: 'Via ferrata',
  items: ['Helmet', 'Climbing harness', 'Via ferrata set', 'Leather gloves', 'Head torch'],
  packed: ['Helmet', 'Climbing harness'],
};

/** The confirmation the files guide puts next to the hut trek. */
export const HUT_BOOKING_FILE = 'rifugio-puez-half-board.pdf';

type Res = { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> };

async function json<T>(res: Res, what: string): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 500)}`);
  return (await res.json()) as T;
}

interface TourRow {
  place_id: number;
  name: string;
}

export async function toursOf(api: APIRequestContext, tripId: number): Promise<TourRow[]> {
  return (await json<{ tours: TourRow[] }>(await api.get(`/api/trips/${tripId}/tours`), `tours of trip ${tripId}`))
    .tours;
}

/** A tour's place id by its name; throws when the fixtures did not make it. */
export async function tourIdOf(api: APIRequestContext, tripId: number, name: string): Promise<number> {
  const found = (await toursOf(api, tripId)).find((t) => t.name === name);
  if (!found) throw new Error(`no tour "${name}" in trip ${tripId}: ensureToursFixtures did not make it`);
  return found.place_id;
}

interface PackingItem {
  id: number;
  name: string;
  category: string | null;
  checked?: number | boolean;
}

async function packingOf(api: APIRequestContext, tripId: number): Promise<PackingItem[]> {
  const body = await json<{ items?: PackingItem[] } | PackingItem[]>(
    await api.get(`/api/trips/${tripId}/packing`),
    'packing'
  );
  return Array.isArray(body) ? body : (body.items ?? []);
}

/**
 * The via ferrata gear in the Dolomites packing list, two of it packed, and
 * the ferrata tour without a packing link, which is where the guide starts.
 */
export async function ensureTourDetailFixtures(api: APIRequestContext, tripId: number): Promise<void> {
  let items = await packingOf(api, tripId);
  for (const name of FERRATA_PACKING.items) {
    if (items.some((i) => i.name === name && i.category === FERRATA_PACKING.category)) continue;
    await json(
      await api.post(`/api/trips/${tripId}/packing`, {
        data: { name, category: FERRATA_PACKING.category, visibility: 'common' },
      }),
      `packing item ${name}`
    );
  }
  items = await packingOf(api, tripId);
  for (const name of FERRATA_PACKING.packed) {
    const item = items.find((i) => i.name === name && i.category === FERRATA_PACKING.category);
    if (item && !item.checked) {
      await json(await api.put(`/api/trips/${tripId}/packing/${item.id}`, { data: { checked: true } }), `pack ${name}`);
    }
  }
  await unlinkPacking(api, tripId, await tourIdOf(api, tripId, TOUR_NAMES.ferrata));
}

/** Take a tour's packing link away; a tour without one is left as it is. */
export async function unlinkPacking(api: APIRequestContext, tripId: number, placeId: number): Promise<void> {
  const res = await api.delete(`/api/trips/${tripId}/tours/${placeId}/packing-link`);
  if (!res.ok() && res.status() !== 404)
    throw new Error(`unlink packing: ${res.status()} ${(await res.text()).slice(0, 300)}`);
}

/** Delete every tour of the trip with this name (the copies a guide made). Tours are places. */
export async function deleteToursNamed(api: APIRequestContext, tripId: number, name: string): Promise<void> {
  for (const tour of (await toursOf(api, tripId)).filter((t) => t.name === name)) {
    await api.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
  }
}

/** Take the tours of this name out of a collection again. */
export async function unkeepTour(api: APIRequestContext, collectionId: number, name: string): Promise<void> {
  const res = await api.get(`/api/addons/collections/${collectionId}/tours`);
  if (!res.ok()) return;
  const { tours = [] } = (await res.json()) as { tours?: { id: number; name: string }[] };
  for (const kept of tours.filter((t) => t.name === name)) {
    await api.delete(`/api/addons/collections/${collectionId}/tours/${kept.id}`);
  }
}

/** Remove an uploaded file from the trip, out of the bin as well. */
export async function deleteTripFilesNamed(api: APIRequestContext, tripId: number, name: string): Promise<void> {
  const res = await api.get(`/api/trips/${tripId}/files`);
  if (!res.ok()) return;
  const { files = [] } = (await res.json()) as { files?: { id: number; original_name: string }[] };
  for (const file of files.filter((f) => f.original_name === name)) {
    await api.delete(`/api/trips/${tripId}/files/${file.id}`);
    await api.delete(`/api/trips/${tripId}/files/${file.id}/permanent`);
  }
}

/** The Fushimi Inari hike of the Japan trip and its linked recordings, as the tour detail reports them. */
async function inariActivities(
  api: APIRequestContext
): Promise<{ hikeId: number; activities: { id: number; track: { place_id: number } }[] }> {
  const { tripId } = seededTrip();
  const hikeId = await tourIdOf(api, tripId, TOUR_NAMES.inariHike);
  const detail = await json<{ activities?: { id: number; track: { place_id: number } }[] }>(
    await api.get(`/api/trips/${tripId}/tours/${hikeId}`),
    'the Fushimi Inari hike'
  );
  return { hikeId, activities: detail.activities ?? [] };
}

/**
 * Unlink the recording from the planned hike, so `tour-activity-link` starts
 * from a tour with no actual track. The recording itself stays in the trip as
 * an import, which is what the guide then picks.
 */
export async function unlinkInariRecording(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const { hikeId, activities } = await inariActivities(api);
  for (const activity of activities) {
    await json(
      await api.delete(`/api/trips/${tripId}/tours/${hikeId}/activities/${activity.id}`),
      'unlink the recording'
    );
  }
}

/**
 * Take the recording out of the Japan trip again once the activity guides are
 * done: `ensureTourRecording` is opt-in because the recording is one more
 * tour in a trip every other screen photographs.
 */
export async function removeInariRecording(api: APIRequestContext): Promise<void> {
  try {
    await unlinkInariRecording(api);
  } catch (err) {
    console.warn(`[tour-detail] the recording could not be unlinked before it is removed: ${String(err)}`);
  }
  await deleteToursNamed(api, seededTrip().tripId, TOUR_NAMES.inariRecording);
}

/** The hut's half-board confirmation, drawn on every call so its date follows the trip. */
export function hutBookingFixture(): string {
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, HUT_BOOKING_FILE);
  writeFileSync(
    file,
    drawPdf({
      issuer: 'Rifugio Puez',
      title: 'Booking confirmation, half board',
      reference: 'Booking PZ-2417, Puez-Odle Nature Park, 2475 m',
      fields: [
        ['Guests', '2 adults, alpine club members'],
        ['Night', `${short(tourDayOffset(4))}, one night`],
        ['Room', 'Dormitory, 6 beds, 2 places'],
        ['Board', 'Dinner at 18:30, breakfast from 06:30'],
        ['Deposit', 'EUR 40 paid, rest in cash at the hut'],
      ],
      footer: 'Cancel by phone up to 48 hours before arrival. No card payment at the hut.',
    })
  );
  return file;
}
