import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';

/** "HH:MM" (seconds ignored) as minutes past midnight, or null for anything else. */
function minutesOf(time: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time?.trim() ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/**
 * Where an entry at `time` belongs among its day's entries, given in their
 * current order: right before the first one that starts later. Entries
 * without a time are no anchor either way, and an unreadable `time` goes last.
 */
export function chronologicalSlot(day: readonly { entry_time: string | null }[], time: string): number {
  const at = minutesOf(time);
  if (at == null) return day.length;
  const later = day.findIndex((e) => {
    const other = minutesOf(e.entry_time);
    return other != null && other > at;
  });
  return later === -1 ? day.length : later;
}

/**
 * Makes room for a timed entry in its day and returns the sort_order it takes.
 *
 * A new entry used to go to the end of its day whatever its time, so writing
 * up the morning after the evening left the morning last (#2679). It now lands
 * before the first entry that starts later; the order of everything else,
 * dragged by hand or not, stays as it was. Run it inside the write's
 * transaction, so the room and the entry that takes it land together.
 */
export async function makeRoomAtTime(
  entries: JourneyEntriesRepository,
  journeyId: number,
  date: string,
  time: string,
  now: number,
  exceptId?: number,
): Promise<number> {
  const day = (await entries.listDayOrder(journeyId, date)).filter((e) => e.id !== exceptId);
  const slot = chronologicalSlot(day, time);
  const moves = day
    .map((e, index) => ({ id: e.id, from: e.sort_order, to: index < slot ? index : index + 1 }))
    .filter((m) => m.from !== m.to);
  await Promise.all(moves.map((m) => entries.updateSortOrder(m.id, m.to, now)));
  return slot;
}

/** The sort_order a new entry takes: where its time puts it in its day, last when it has none. */
export async function newEntrySortOrder(
  entries: JourneyEntriesRepository,
  journeyId: number,
  date: string,
  time: string | null | undefined,
  now: number,
): Promise<number> {
  if (time) return await makeRoomAtTime(entries, journeyId, date, time, now);
  return ((await entries.maxSortOrderForDate(journeyId, date)) ?? -1) + 1;
}

/**
 * Moves an edited entry to where its new time or day puts it, by giving the patch
 * the sort_order it takes. Left alone when neither changed, so a save keeps an
 * entry where it was dragged, and when the caller sent a sort_order of its own.
 */
export async function placeMovedEntry(
  entries: JourneyEntriesRepository,
  entry: { id: number; journey_id: number; entry_date: string; entry_time?: string | null },
  patch: { entry_date?: string; entry_time?: string | null; sort_order?: number },
  now: number,
): Promise<void> {
  if (patch.sort_order !== undefined) return;
  const date = patch.entry_date ?? entry.entry_date;
  const time = patch.entry_time !== undefined ? patch.entry_time : entry.entry_time;
  if (!time || (date === entry.entry_date && time === entry.entry_time)) return;
  patch.sort_order = await makeRoomAtTime(entries, entry.journey_id, date, time, now, entry.id);
}
