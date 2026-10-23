import type { TourRouteCard } from '@trek/shared';
import { Check, Loader2, MapPin, Plus } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import { useAssistantView } from '../../assistantViewContext';
import { CardOpenButton } from '../parts/CardOpen';
import { tourTarget } from './tourLook';
import { useTakeProposal } from './useTourRouteCard';

/** What "Open" says: the phone opens the tour's place on the plan, the desktop the Tours tab. */
const OPEN_LABEL = { phoneKey: 'assistant.card.tour.openPhone', desktopKey: 'assistant.card.tour.open' } as const;

/** Where a tapped "Plan this" stands: being planned, added, or (held without the tap) waiting below. */
function TakenPill({ deciding, applied }: { deciding: boolean; applied: boolean }) {
  const { t } = useTranslation();
  if (deciding) {
    return (
      <SoftPill icon={<Loader2 size={10} className="animate-spin" aria-hidden="true" />}>
        {t('assistant.card.tour.adding')}
      </SoftPill>
    );
  }
  return (
    <SoftPill tone="success" icon={<Check size={10} strokeWidth={2.4} aria-hidden="true" />}>
      {applied ? t('assistant.card.tour.added') : t('assistant.card.tour.taken')}
    </SoftPill>
  );
}

/**
 * The foot of a route card: "On map" always; "Plan this" on a proposed hike
 * or city walk for someone who may add to the trip, off with its reason said
 * while it cannot be taken, and once taken a note that the tour waits below
 * for a decision (or, once applied, that it was added); "Open in Tours" on a saved tour. Taller on the phone, as
 * tall as the card's own "Open"; the phone has no Tours tab, so there a
 * saved tour opens as the place it is on the plan.
 */
export default function TourRouteActions({
  toolCallId,
  card,
  letter,
  onShow,
}: {
  toolCallId: string;
  card: TourRouteCard;
  /** The chosen way's letter in a ways card: "Plan way B". */
  letter?: string;
  onShow: () => void;
}) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const take = useTakeProposal(toolCallId, card);
  const phone = variant === 'fullscreen';
  const tall = phone ? 'h-10' : 'h-7';
  const planLabel = letter ? t('assistant.card.tour.planWay', { letter }) : t('assistant.card.tour.plan');
  let caption: string | null = null;
  if (take.state === 'failed') caption = t('assistant.card.tour.askAgain');
  else if (take.state !== 'taken' && take.reasonKey) caption = t(take.reasonKey);
  return (
    <div className="mt-2.5 flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onShow}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 text-caption font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content ${tall}`}
        >
          <MapPin size={12} aria-hidden="true" />
          {t('assistant.place.showOnMap')}
        </button>
        {card.source === 'saved' && card.placeId !== null && (
          <CardOpenButton
            target={phone ? { kind: 'map', placeId: card.placeId, dayId: null } : tourTarget(card.placeId)}
            labelKey={phone ? OPEN_LABEL.phoneKey : OPEN_LABEL.desktopKey}
          />
        )}
        {take.visible && take.state === 'taken' && <TakenPill deciding={take.deciding} applied={take.applied} />}
        {take.visible && take.state !== 'taken' && (
          <button
            type="button"
            disabled={take.disabled}
            onClick={() => void take.take()}
            className={`inline-flex items-center gap-1 rounded-full bg-accent px-3 text-caption font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40 ${tall}`}
          >
            {take.state === 'busy' ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus size={12} aria-hidden="true" />
            )}
            {planLabel}
          </button>
        )}
      </div>
      {take.visible && caption && (
        <p className="m-0 text-end text-caption text-content-muted" role="status">
          {caption}
        </p>
      )}
    </div>
  );
}
