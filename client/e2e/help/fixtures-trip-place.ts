import type { APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { coverFixture, seededTrip } from './fixtures';

/**
 * What the place card's own guides need beyond the shared fixtures: a photo
 * already attached to a place, so the round picture offers From attached files.
 * The cover drawing is a mountain ridge at sunset, which is what an evening on
 * Mount Inari looks like, so it goes onto Fushimi Inari Taisha.
 */

export const PHOTO_PLACE = 'Fushimi Inari Taisha';
export const PHOTO_FILE = 'inari-evening.jpg';

type ApiFile = { id: number; original_name: string; place_id?: number | null };

async function tripFiles(api: APIRequestContext): Promise<ApiFile[]> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/files`);
  if (!res.ok()) throw new Error(`could not list the trip's files: ${res.status()}`);
  const body = (await res.json()) as { files?: ApiFile[] };
  return body.files ?? [];
}

async function placeId(api: APIRequestContext, name: string): Promise<number> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/places`);
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[];
  const places = Array.isArray(body) ? body : (body.places ?? []);
  const found = places.find((p) => p.name === name);
  if (!found) throw new Error(`the seeded place "${name}" is missing`);
  return found.id;
}

/** Attach the photo to the place, once. */
export async function ensurePlacePhoto(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const id = await placeId(api, PHOTO_PLACE);
  if ((await tripFiles(api)).some((f) => f.original_name === PHOTO_FILE && f.place_id === id)) return;
  const res = await api.post(`/api/trips/${tripId}/files`, {
    multipart: {
      file: { name: PHOTO_FILE, mimeType: 'image/jpeg', buffer: readFileSync(await coverFixture()) },
      place_id: String(id),
    },
  });
  if (!res.ok()) throw new Error(`could not attach ${PHOTO_FILE}: ${res.status()} ${await res.text()}`);
}

/** Take the photo off the trip again, trash included, and the picture made from it. */
export async function removePlacePhoto(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const id = await placeId(api, PHOTO_PLACE);
  await api.put(`/api/trips/${tripId}/places/${id}`, { data: { image_url: null } });
  for (const file of (await tripFiles(api)).filter((f) => f.original_name === PHOTO_FILE)) {
    await api.delete(`/api/trips/${tripId}/files/${file.id}`);
    await api.delete(`/api/trips/${tripId}/files/${file.id}/permanent`);
  }
}
