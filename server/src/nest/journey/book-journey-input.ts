import type { AutoEntry, AutoPhoto } from '@trek/shared';

/**
 * A journey's entries as the book engine reads them (`AutoEntry`), from the
 * rows `JourneyDomainService.listEntries` answers: what the Studio's Auto
 * layout and Travel panel build from the same journey, so the server's
 * design and travel elements see what the Studio sees.
 */

/** A photo of an entry as `listEntries` joins it. */
interface EntryPhotoRow {
  photo_id: number;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
}

/** An entry as `listEntries` answers it, as far as a book reads it. */
interface BookEntryRow {
  id: number;
  type?: string | null;
  title?: string | null;
  story?: string | null;
  location_name?: string | null;
  entry_date: string;
  mood?: string | null;
  weather?: string | null;
  dismissed: boolean;
  pros_cons: { pros: string[]; cons: string[] } | null;
  photos: readonly EntryPhotoRow[];
}

const photoOf = (p: EntryPhotoRow): AutoPhoto => ({
  photoId: p.photo_id,
  width: p.width ?? null,
  height: p.height ?? null,
  caption: p.caption ?? null,
});

/**
 * The entries a book is made of: none waved away, and no skeleton without a
 * title (a place pulled in from a trip nobody wrote about has nothing to put
 * on a page), as the Studio leaves them out.
 */
export function bookEntriesOf(rows: readonly BookEntryRow[]): AutoEntry[] {
  return rows
    .filter((e) => !e.dismissed && (e.type !== 'skeleton' || !!e.title))
    .map((e) => ({
      id: e.id,
      title: e.title ?? null,
      story: e.story ?? null,
      location: e.location_name ?? null,
      date: e.entry_date || null,
      photos: e.photos.map(photoOf),
      mood: e.mood ?? null,
      weather: e.weather ?? null,
      pros: e.pros_cons?.pros ?? [],
      cons: e.pros_cons?.cons ?? [],
    }));
}
