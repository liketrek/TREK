import { useTripJournalLinkStore } from '../../../../store/tripJournalLinkStore';
import { useAssistantView } from '../../assistantViewContext';
import { journalTarget } from './journeyCardModel';

/**
 * Opens an entry of a journal from a card, decided when it is clicked: in the
 * trip's Journal tab when the trip shows this journal (as the card saw it, or
 * as the trip's journal link says now), else on the journal's page. Null where
 * the shell around the chat cannot open anything.
 */
export function useJourneyOpen(journeyId: number, tripJournal: boolean): ((entryId: number | null) => void) | null {
  const { tripId, onOpen } = useAssistantView();
  const shown = useTripJournalLinkStore((s) => {
    const link = s.byTrip[String(tripId)]?.link;
    return !!link && link.my_role !== null && link.journey_id === journeyId;
  });
  if (!onOpen) return null;
  return (entryId) => onOpen(journalTarget(journeyId, entryId, tripJournal || shown));
}
