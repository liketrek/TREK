interface DatedEntry {
  id: number | string;
  entry_date: string;
}

/**
 * The entry a journey opens on, or null for its first one.
 *
 * Every load used to start at the first entry, so keeping a journal on a trip
 * meant scrolling past everything already written before you could add to it
 * (discussion #2299). "Today" means the last day at or before now: a rest day
 * with nothing written still lands you at yesterday rather than at the start.
 *
 * Only while the journey is running, though. A journey that ended last spring
 * is something you read, and reading starts at the beginning; opening it at the
 * last page would be the worse of the two mistakes.
 *
 * A link the owner published newest-first reads like a blog (#1614), so it
 * opens on the latest day whether or not the trip is still running (#2851).
 *
 * Always the first entry OF the chosen day, not the last one before now: a day
 * is read from its beginning.
 */
export function journeyOpenAtEntryId(
  entries: readonly DatedEntry[],
  { today, newestFirst = false }: { today: string; newestFirst?: boolean }
): string | null {
  const dated = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const first = dated[0];
  const last = dated[dated.length - 1];
  if (!first || !last) return null;
  let day = last.entry_date;
  if (!newestFirst) {
    if (today < first.entry_date || today > last.entry_date) return null;
    const reached = dated.filter((e) => e.entry_date <= today);
    day = reached[reached.length - 1]?.entry_date ?? first.entry_date;
  }
  const dayStart = dated.find((e) => e.entry_date === day) ?? first;
  return String(dayStart.id);
}
