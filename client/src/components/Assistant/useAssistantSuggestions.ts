import { useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { assistantScopeOf } from '../../store/assistantChatKey';
import { useJourneyStore } from '../../store/journeyStore';
import { useCanDo } from '../../store/permissionsStore';
import { useTripStore } from '../../store/tripStore';
import { localIsoDate } from '../../utils/localDate';
import { HOME_SUGGESTIONS, suggestionsFor, tripPhase } from './assistantModel';
import { useAssistantFocus } from './useAssistantFocus';

export interface ReadySuggestion {
  id: string;
  /** What the button says, and the question it sends. */
  prompt: string;
}

/**
 * The questions the empty chat offers, worded and ready to send, and whether
 * the user may change this trip at all. For a trip the planner is not showing
 * (one picked from the dashboard) neither its dates nor its rights are at
 * hand, so it gets the general questions and none that would change it. A
 * journey's chat in TREK Studio gets none, since they all ask about a trip,
 * and its rights are the journey's role, as the Studio itself reads it. The
 * home chat outside any one trip gets its own questions across the user's
 * trips; what it may change the server decides, so nothing is held back here.
 */
export function useAssistantSuggestions(tripId: number): { suggestions: ReadySuggestion[]; canEdit: boolean } {
  const { t } = useTranslation();
  const can = useCanDo();
  const trip = useTripStore((s) => (s.trip?.id === tripId ? s.trip : null));
  const hasPlaces = useTripStore((s) => s.places.length > 0);
  const { label, kind } = useAssistantFocus(tripId);
  const scope = assistantScopeOf(tripId);
  const tripChat = scope.kind === 'trip';
  // The Studio's own reading: an owner until the journey says otherwise, and only a viewer changes nothing.
  const journeyRole = useJourneyStore((s) =>
    scope.kind === 'journey' && s.current?.id === scope.journeyId ? s.current.my_role : undefined
  );
  const home = scope.kind === 'home';
  const canEdit = tripChat ? !!trip && can('place_edit', trip) : home || (journeyRole ?? 'owner') !== 'viewer';

  const suggestions = useMemo((): ReadySuggestion[] => {
    if (home) return HOME_SUGGESTIONS.map((s) => ({ id: s.id, prompt: t(s.labelKey) }));
    if (!tripChat) return [];
    const phase = trip
      ? tripPhase({
          startDate: trip.start_date ?? null,
          endDate: trip.end_date ?? null,
          hasPlaces,
          today: localIsoDate(),
        })
      : 'upcoming';
    return suggestionsFor({
      phase,
      canEdit,
      place: kind === 'place' ? label : null,
      day: kind === 'day' ? label : null,
    }).map((s) => ({ id: s.id, prompt: t(s.labelKey, s.params) }));
  }, [home, tripChat, trip, hasPlaces, canEdit, kind, label, t]);

  return { suggestions, canEdit };
}
