import type { DomainCards, ToolArgs, ToolCards } from '../card-types';
import { argId, idIn, recordOf } from '../card-values';
import {
  JOURNEY_DESCRIBERS,
  journalAppliedCard,
  journalChangeCard,
  loadJournal,
  type JournalLoaded,
} from './journey-change';
import { readCard } from './journey-look';
import { DELETE_CREATED_ENTRY } from './journey-undo';
import type { JourneyEntriesCard } from '@trek/shared';

/**
 * The travel journal in the assistant chat. A read of a journal's entries
 * shows them as a card beside the answer; a held write of an entry shows the
 * entry it will write, change or delete, and once applied the entry as it
 * was stored, its photo and country included. A created entry can be taken
 * back while nothing was written to it since.
 */

/** The entry a create or a change answered with, else the one a delete named. */
function entryIds(args: ToolArgs, result: unknown): number[] {
  const id = idIn(result, 'entry') ?? argId(args, 'entryId');
  return id === null ? [] : [id];
}

/**
 * The card of a read that answers `{ entries | entry, journey: { id, title } }`.
 * One entry read on its own has no day of the journal to colour it by.
 */
function readAnswer(journeyId: number | null, value: unknown, key: 'entries' | 'entry'): JourneyEntriesCard | null {
  const answer = recordOf(value);
  const title = recordOf(answer.journey).title;
  if (key === 'entry') return readCard(journeyId, title, [answer.entry], false);
  return readCard(journeyId, title, answer.entries);
}

/** A journal write's card entries: its words, its lookups, its card while held and once applied. */
function journalWrite(tool: string): ToolCards<JournalLoaded> {
  return {
    load: (args, read) => loadJournal(tool, args, read),
    change: (_ctx, args, loaded) => journalChangeCard(tool, args, loaded),
    applied: ({ result, preview }) => journalAppliedCard(tool, result, preview),
    appliedIds: entryIds,
  };
}

export const JOURNEY_CARDS: DomainCards = {
  id: 'journey',
  tools: {
    // A Studio conversation pins the journey, so its arguments hold no id: the answer names the journey too.
    list_journey_entries: {
      answer: ({ args, value }) => readAnswer(argId(args, 'journeyId') ?? idIn(value, 'journey'), value, 'entries'),
    },
    get_journey_entry: { answer: ({ value }) => readAnswer(idIn(value, 'journey'), value, 'entry') },
    get_journey: {
      answer: ({ value }) => {
        const journey = recordOf(recordOf(value).journey);
        return readCard(argId(journey, 'id'), journey.title, journey.entries);
      },
    },
    create_journey_entry: {
      write: { verbKey: 'addJournalEntry', entity: 'journey_entry' },
      describe: JOURNEY_DESCRIBERS.create_journey_entry,
      undo: DELETE_CREATED_ENTRY,
      ...journalWrite('create_journey_entry'),
    },
    update_journey_entry: {
      write: { verbKey: 'updateJournalEntry', entity: 'journey_entry' },
      describe: JOURNEY_DESCRIBERS.update_journey_entry,
      ...journalWrite('update_journey_entry'),
    },
    delete_journey_entry: {
      write: { verbKey: 'removeJournalEntry', entity: 'journey_entry' },
      describe: JOURNEY_DESCRIBERS.delete_journey_entry,
      ...journalWrite('delete_journey_entry'),
    },
  },
  prompt: [
    'Journal: get_trip_journal finds the journal this trip shows. To show entries, call list_journey_entries with from/to for the days asked: the app draws them as cards, so do not list them again in your answer.',
    "Photo book: a journey's photo book is laid out in its Studio, which has an assistant of its own. When asked to design or change the book, tell the user to open Studio from the journey; its tools are not offered here.",
  ],
};
