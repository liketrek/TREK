import type { APIRequestContext } from '@playwright/test';
import { seededTrip } from './fixtures';

/**
 * What the two note guides of the Collab tab need beyond `ensureCollabFixtures`.
 * Kept apart from the shared fixtures because nothing outside
 * `trip-collab.guide.ts` reads it.
 */

/**
 * The note `manage-notes` opens, pins, edits and finally deletes. It is made
 * fresh at the start of that guide rather than in the seed, so no other picture
 * of the tab (the hero among them) carries a note that is about to go.
 */
export const MANAGE_NOTE = {
  title: 'Onsen etiquette',
  category: 'Accommodation',
  color: '#ef4444',
  content:
    'Wash at the stools **before** you get into the bath.\n\n- The small towel stays out of the water\n- No swimwear\n- Ask at the front desk about tattoos',
  website: 'https://www.japan.travel/en/guide/onsen/',
};

/** The line the edit step adds to it. */
export const MANAGE_NOTE_EDIT = '- Drink water afterwards, the baths run hot';

/**
 * The category and colour every seeded note had before `note-categories` renames
 * and recolours them (`e2e/screenshots/seed.ts`, step 11b), by title.
 */
export const SEEDED_NOTE_CATEGORIES: Record<string, { category: string; color: string }> = {
  'Rail passes': { category: 'Transport', color: '#3b82f6' },
  'Ryokan etiquette': { category: 'Accommodation', color: '#ef4444' },
  'Rainy-day alternatives': { category: 'Ideas', color: '#22c55e' },
};

const collab = (): string => `/api/trips/${seededTrip().tripId}/collab`;

async function notesOf(
  api: APIRequestContext
): Promise<{ id: number; title: string; category: string | null; color: string | null }[]> {
  const res = await api.get(`${collab()}/notes`);
  const body = (await res.json()) as {
    notes?: { id: number; title: string; category: string | null; color: string | null }[];
  };
  return body.notes ?? [];
}

/** Removes every note of that title. */
export async function removeNotes(api: APIRequestContext, title: string): Promise<void> {
  for (const note of (await notesOf(api)).filter((n) => n.title === title)) {
    await api.delete(`${collab()}/notes/${note.id}`);
  }
}

/** One open, unpinned MANAGE_NOTE; a copy left by a run that stopped short is thrown away first. */
export async function ensureManageNote(api: APIRequestContext): Promise<void> {
  await removeNotes(api, MANAGE_NOTE.title);
  const created = await api.post(`${collab()}/notes`, { data: MANAGE_NOTE });
  if (!created.ok())
    throw new Error(`could not write the note "${MANAGE_NOTE.title}": ${created.status()} ${await created.text()}`);
}

/** Puts every seeded note back into its seeded category and colour. Safe to run when nothing changed. */
export async function restoreNoteCategories(api: APIRequestContext): Promise<void> {
  for (const note of await notesOf(api)) {
    const seeded = SEEDED_NOTE_CATEGORIES[note.title];
    if (!seeded || (note.category === seeded.category && note.color === seeded.color)) continue;
    const res = await api.put(`${collab()}/notes/${note.id}`, { data: seeded });
    if (!res.ok()) throw new Error(`could not restore the note "${note.title}": ${res.status()} ${await res.text()}`);
  }
}
