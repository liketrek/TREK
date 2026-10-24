import type { AssistantMessage } from '@trek/shared';
import { CornerDownRight } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useCanDo } from '../../store/permissionsStore';
import { useTripStore } from '../../store/tripStore';
import { followUpsFor } from './assistantFollowUpRules';
import { hasUndecided } from './assistantParts';
import { useAssistantView } from './assistantViewContext';

/** Each chip comes in a moment after the one before it. */
const STAGGER_MS = 60;

/**
 * The next questions under the latest answer, one tap each. Only under the
 * last answer, once it is written, and not while changes wait for a decision:
 * then the cards are what to answer.
 */
export default function AssistantFollowUps({ message }: { message: AssistantMessage }) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const can = useCanDo();
  const trip = useTripStore((s) => (s.trip?.id === tripId ? s.trip : null));
  const send = useAssistantStore((s) => s.send);
  const shown = useAssistantStore((s) => {
    const chat = chatOf(s, tripId);
    const last = chat.messages[chat.messages.length - 1];
    return !chat.isRunning && !chat.error && last?.id === message.id && !hasUndecided(chat.messages);
  });
  if (!shown) return null;
  const chips = followUpsFor(message, !!trip && can('place_edit', trip));
  if (chips.length === 0) return null;

  return (
    <div role="group" aria-label={t('assistant.followUp.title')} className="flex flex-wrap gap-1.5 pt-0.5">
      {chips.map((chip, i) => {
        const text = chip.text ?? t(chip.labelKey);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => void send(tripId, text)}
            className="trek-assistant-enter group/chip inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-card px-3 py-1.5 text-caption font-medium text-content-secondary shadow-sm ring-1 ring-edge-faint transition-all hover:-translate-y-px hover:text-content hover:shadow-md hover:ring-edge active:translate-y-0"
            style={{ animationDelay: `${i * STAGGER_MS}ms` }}
          >
            <CornerDownRight
              size={12}
              aria-hidden="true"
              className="flex-shrink-0 text-content-faint transition-colors group-hover/chip:text-content rtl:-scale-x-100"
            />
            <span className="truncate">{text}</span>
          </button>
        );
      })}
    </div>
  );
}
