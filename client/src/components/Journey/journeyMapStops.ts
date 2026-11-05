/**
 * Which journal entries stand on a journey's map and the number each one carries.
 *
 * The owner's journal and the public share link both draw the same pins, and they
 * used to number them by two different rules: the share link counted through the
 * whole journey (#1962) while the owner's map restarted at 1 every day, so the
 * same stop read 66 on one and 6 on the other (#2886). Both views now take their
 * numbers from here.
 */

export interface JourneyStopEntry {
  id: number | string;
  entry_date: string;
  sort_order?: number | null;
  title?: string | null;
  type?: string | null;
  is_draft?: boolean | number | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

interface JourneyMapStop<E> {
  entry: E;
  /** The stop's place in the whole journey, or null for a draft the share link does not show. */
  stop: number | null;
}

/** Placeholder entries the old gallery model kept in the journal; a migration removes them, older caches may still hold them. */
const GALLERY_PLACEHOLDER_TITLES = new Set(['Gallery', '[Trip Photos]']);

export function isGalleryPlaceholder(entry: Pick<JourneyStopEntry, 'title'>): boolean {
  return GALLERY_PLACEHOLDER_TITLES.has(entry.title ?? '');
}

/** A skeleton is a suggestion taken from the trip, not a place anyone wrote about. */
export function isJourneyMapEntry(entry: JourneyStopEntry): boolean {
  return !!entry.location_lat && !!entry.location_lng && entry.type !== 'skeleton' && !isGalleryPlaceholder(entry);
}

/** The journal's reading order, the same one the server reads the entries in. */
export function compareJourneyEntries(a: JourneyStopEntry, b: JourneyStopEntry): number {
  if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? -1 : 1;
  const bySortOrder = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (bySortOrder !== 0) return bySortOrder;
  return Number(a.id) - Number(b.id);
}

/**
 * The located entries in reading order, each with its stop number. A draft keeps
 * its pin for the people writing the journal but takes no number, so every stop
 * after it reads the same as on the share link, which leaves drafts out.
 */
export function journeyMapStops<E extends JourneyStopEntry>(entries: readonly E[]): JourneyMapStop<E>[] {
  let stop = 0;
  return entries
    .filter(isJourneyMapEntry)
    .sort(compareJourneyEntries)
    .map((entry) => ({ entry, stop: entry.is_draft ? null : ++stop }));
}
