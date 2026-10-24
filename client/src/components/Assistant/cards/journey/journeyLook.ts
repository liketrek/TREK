import { BookOpen, BookOpenText, BookPlus, BookX } from 'lucide-react';

import type { PackLook } from '../cardTypes';
import { journalTarget } from './journeyCardModel';

/**
 * What the journeys bring to the chat's pure look: the verbs, tool names and
 * steps they add, what an applied change of theirs opens, and the look of each
 * of their kinds. A look stays pure, icons and literals only: the chat's main
 * chunk reads every look, so whatever a look imports ships with it.
 *
 * An applied entry opens in the journal: in the trip's Journal tab when the
 * card saw that the trip shows this journal, else on the journal's page.
 */
export const JOURNEY_LOOK = {
  verbs: {
    addJournalEntry: { Icon: BookPlus, tone: 'success', labelKey: 'assistant.change.verb.addJournalEntry' },
    updateJournalEntry: { Icon: BookOpenText, tone: 'info', labelKey: 'assistant.change.verb.updateJournalEntry' },
    removeJournalEntry: { Icon: BookX, tone: 'danger', labelKey: 'assistant.change.verb.removeJournalEntry' },
  },
  tools: {
    create_journey: { labelKey: 'assistant.tool.create_journey' },
    update_journey: { labelKey: 'assistant.tool.update_journey' },
    add_journey_trip: { labelKey: 'assistant.tool.add_journey_trip' },
    link_trip_journal: { labelKey: 'assistant.tool.link_trip_journal' },
    reorder_journey_entries: { labelKey: 'assistant.tool.reorder_journey_entries' },
  },
  steps: {
    get_trip_journal: { stepKey: 'assistant.step.readingJournal' },
    list_journey_entries: { stepKey: 'assistant.step.readingJournal' },
    get_journey: { stepKey: 'assistant.step.readingJournal' },
    get_journey_entry: { stepKey: 'assistant.step.readingJournal' },
  },
  entities: {
    journey_entry: {
      Icon: BookOpen,
      openLabelKey: 'assistant.card.journey.open',
      open: (applied, card) =>
        card?.kind === 'journeyEntries'
          ? journalTarget(card.journeyId, applied.ids[0] ?? card.entries[0]?.entryId ?? null, card.tripJournal)
          : null,
    },
  },
  cards: {
    journeyEntries: {
      entity: () => 'journey_entry',
      followUps: [
        { id: 'journalToday', labelKey: 'assistant.followUp.journalToday', edits: true },
        { id: 'journalSummary', labelKey: 'assistant.followUp.journalSummary' },
      ],
      // The reads of one journal in one answer draw as one card.
      group: (card) => `journey:${card.journeyId}`,
      // A read that looked up an entry gives way to the change it served: the change shows the entry already.
      // A read holding entries the change leaves alone stays, and a new entry has no read to replace.
      yieldsToChange: (answer, change) => {
        if (change.kind !== 'journeyEntries' || change.journeyId !== answer.journeyId) return false;
        const touched = new Set(change.entries.flatMap((look) => (look.entryId === null ? [] : [look.entryId])));
        const readIds = answer.entries.map((read) => read.entryId);
        return readIds.length > 0 && readIds.every((id) => id !== null && touched.has(id));
      },
    },
  },
} satisfies PackLook<'journeyEntries'>;
