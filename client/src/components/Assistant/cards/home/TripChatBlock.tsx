import type { TripChatCard, TripChatPhase } from '@trek/shared';
import { ArrowRight, Luggage, MessageSquareText } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { type PillTone, SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { useCardFormat } from '../parts/useCardFormat';

/**
 * The home chat's way into one trip's own chat: the trip under its head (its
 * dates, where it stands, how many places it holds), the question that waits
 * there ready to send, and the button that goes on in that chat. The button
 * shows only where a chat can be switched to; the window switches in place,
 * the phone opens the trip with its chat.
 */

/** Where the trip stands, as a pill; a trip without dates says so on its line instead. */
const PHASE: Readonly<Record<Exclude<TripChatPhase, 'undated'>, { labelKey: string; tone: PillTone }>> = {
  now: { labelKey: 'assistant.card.tripChat.phase.now', tone: 'success' },
  next: { labelKey: 'assistant.card.tripChat.phase.next', tone: 'accent' },
  upcoming: { labelKey: 'assistant.card.tripChat.phase.upcoming', tone: 'info' },
  past: { labelKey: 'assistant.card.tripChat.phase.past', tone: 'neutral' },
};

function TripChatSection({ card, first }: { card: TripChatCard; first: boolean }) {
  const { t } = useTranslation();
  const { onOpenTripChat, variant } = useAssistantView();
  const format = useCardFormat();
  const { trip, question } = card;
  const start = trip.startDate ?? trip.endDate;
  const end = trip.endDate ?? trip.startDate;
  let dates = t('assistant.card.tripChat.noDates');
  if (start && end) {
    dates =
      start === end
        ? format.date(start)
        : t('assistant.card.tripChat.dates', { start: format.date(start), end: format.date(end) });
  }
  const phase = trip.phase === 'undated' ? null : PHASE[trip.phase];
  return (
    <div className={first ? '' : 'mt-3 border-t border-edge-faint pt-3'}>
      {first ? (
        <CardHeader
          icon={Luggage}
          tone="info"
          eyebrow={t('assistant.card.tripChat.eyebrow')}
          title={trip.title}
          meta={dates}
        >
          <TripFacts phase={phase} placeCount={trip.placeCount} />
        </CardHeader>
      ) : (
        <div className="mb-2.5">
          <bdi className="block truncate text-body font-bold text-content">{trip.title}</bdi>
          <div className="mt-0.5 text-caption text-content-muted">{dates}</div>
          <TripFacts phase={phase} placeCount={trip.placeCount} />
        </div>
      )}
      {question && (
        <p className="m-0 flex items-start gap-2 rounded-lg bg-surface-secondary px-3 py-2 text-body text-content">
          <MessageSquareText size={14} aria-hidden="true" className="mt-0.5 flex-none text-content-muted" />
          <span className="sr-only">{t('assistant.card.tripChat.question')}</span>
          <bdi className="min-w-0 flex-1 break-words">{question}</bdi>
        </p>
      )}
      {onOpenTripChat && (
        <button
          type="button"
          onClick={() => onOpenTripChat({ id: trip.id, title: trip.title }, question)}
          className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-body font-semibold text-accent-text transition-colors hover:bg-accent-hover ${
            variant === 'fullscreen' ? 'h-11' : 'h-9'
          }`}
        >
          {t('assistant.card.tripChat.open')}
          <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
      )}
    </div>
  );
}

/** The pills under the trip's name: where it stands and how many places it holds. */
function TripFacts({
  phase,
  placeCount,
}: {
  phase: { labelKey: string; tone: PillTone } | null;
  placeCount: number | null;
}) {
  const { t } = useTranslation();
  if (!phase && !placeCount) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {phase && <SoftPill tone={phase.tone}>{t(phase.labelKey)}</SoftPill>}
      {!!placeCount && <WhiteBadge>{t('collections.placeCount', { count: placeCount })}</WhiteBadge>}
    </div>
  );
}

export function TripChatBlock({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const trips = cards.flatMap((entry) => (entry.card.kind === 'tripChat' ? [entry.card] : []));
  if (trips.length === 0) return null;
  return (
    <CardFrame label={t('assistant.card.tripChat.label')}>
      {trips.map((card, index) => (
        <TripChatSection key={`${card.trip.id}-${index}`} card={card} first={index === 0} />
      ))}
    </CardFrame>
  );
}
