import type { JourneyEntryLook } from '@trek/shared';

import type { CoverEntry } from '../../../Journey/JourneyEntryCover';
import type { CardEntry, EntityTarget } from '../cardTypes';

/**
 * The pure side of the journal's cards: where an entry opens, how the cards
 * of one answer about one journal become one, and how an entry looks to the
 * journal's own tile.
 */

/**
 * Where an entry opens: the trip's own Journal tab when the journal is the
 * one the trip shows, else the journal's page, at that entry either way.
 */
export function journalTarget(journeyId: number, entryId: number | null, inTrip: boolean): EntityTarget {
  const entry = entryId === null ? null : String(entryId);
  if (inTrip) return { kind: 'tab', tab: 'journal', ...(entry === null ? {} : { params: { entry } }) };
  return { kind: 'page', path: entry === null ? `/journey/${journeyId}` : `/journey/${journeyId}?entry=${entry}` };
}

/** The cards of one journal in one answer, drawn as one. */
export interface JournalEntries {
  journeyId: number;
  journalTitle: string | null;
  tripJournal: boolean;
  entries: JourneyEntryLook[];
  more: number;
}

/** By day; the sort is stable, so a day keeps the order its read gave it (the journal's own). */
function byDay(a: JourneyEntryLook, b: JourneyEntryLook): number {
  if (a.date === b.date) return 0;
  return a.date < b.date ? -1 : 1;
}

/**
 * The entries with their day counted again over all of them: each read counts
 * its own days, and a lone entry's read counts none, so one card colours a
 * day the same wherever its entries came from.
 */
function withDays(entries: readonly JourneyEntryLook[]): JourneyEntryLook[] {
  const days = [...new Set(entries.map((look) => look.date))];
  return entries.map((look) => ({ ...look, dayIndex: days.indexOf(look.date) }));
}

/**
 * The cards of one answer about one journal as one: every entry once (a
 * later read of an entry wins), in the journal's order, its days counted over
 * the whole card, the most a read left out kept as `more`. Null when none is a
 * journal card.
 */
export function mergeJournalCards(cards: readonly CardEntry[]): JournalEntries | null {
  const own = cards.flatMap((entry) => (entry.card.kind === 'journeyEntries' ? [entry.card] : []));
  const first = own[0];
  if (!first) return null;
  const byId = new Map<string, JourneyEntryLook>();
  own.forEach((card, cardIndex) => {
    card.entries.forEach((look, index) => {
      byId.set(look.entryId === null ? `new-${cardIndex}-${index}` : String(look.entryId), look);
    });
  });
  return {
    journeyId: first.journeyId,
    journalTitle: own.map((card) => card.journalTitle).find((title) => title !== null) ?? null,
    tripJournal: own.some((card) => card.tripJournal),
    entries: withDays([...byId.values()].sort(byDay)),
    more: Math.max(0, ...own.map((card) => card.more)),
  };
}

/** An entry as the journal's own tile reads it. */
export function coverEntryOf(look: JourneyEntryLook): CoverEntry {
  return {
    id: look.entryId ?? 0,
    type: look.type,
    title: look.title,
    story: look.story,
    location_name: look.place,
    location_lat: look.point?.lat ?? null,
    location_lng: look.point?.lng ?? null,
    country_code: look.countryCode,
    entry_date: look.date,
    entry_time: look.time,
    mood: look.mood,
    weather: look.weather,
    // The server picked a photo that has a picture, so no clip here lacks its poster.
    photos: look.photoId === null ? [] : [{ photo_id: look.photoId, media_type: look.video ? 'video' : 'image' }],
  };
}

/** What `cardTitle` reads of an entry. */
export function titleSourceOf(look: JourneyEntryLook): Pick<CoverEntry, 'title' | 'type' | 'location_name'> {
  return { title: look.title, type: look.type, location_name: look.place };
}
