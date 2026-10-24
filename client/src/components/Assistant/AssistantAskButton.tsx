import { Sparkles } from 'lucide-react';
import { useMatch } from 'react-router';

import { useTranslation } from '../../i18n';
import type { Place } from '../../types';
import Tooltip from '../shared/Tooltip';
import { useAssistantAsk } from './useAssistantAsk';

/**
 * The place inspector's "Ask": a round button in its head, beside close, that
 * opens the assistant about this place. Only in the planner of the place's own
 * trip; a saved place in a collection has no trip to ask about.
 */
export default function AssistantAskButton({ place }: { place: Place }) {
  const { t } = useTranslation();
  const inTrip = useMatch('/trips/:id');
  const tripId = inTrip && Number(inTrip.params.id) === place.trip_id ? place.trip_id : null;
  const { available, askAbout } = useAssistantAsk(tripId);
  if (!available) return null;

  const label = t('assistant.context.ask');
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={() => askAbout(place.id)}
        aria-label={`${label}: ${place.name}`}
        className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content"
      >
        <Sparkles size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
