import { useCurrentFlightLegIndex, useFlightLiveCard } from '../../../components/Planner/flightLive/useFlightLiveCard';
import { useTranslation } from '../../../i18n';
import type { DelayTone } from '../../../utils/flightLiveModel';
import { Field } from './tabs/tabChrome';

const DELAY_COLOR: Record<DelayTone, string> = {
  ok: 'var(--m-st-confirmed)',
  minor: 'var(--m-st-pending)',
  major: 'var(--m-st-danger)',
};

const LIVE = 'var(--m-st-info)';

interface MFlightLiveStripProps {
  tripId: number;
  reservationId: number;
  /** Opens the transport sheet, where the full live card sits. */
  onOpen: () => void;
  className?: string;
}

/**
 * A flight's live state on the phone's transport cards, as one of the card's
 * fields: what is happening in one line with the delay, and a thin bar along
 * the field's foot while it flies. A
 * tap opens the transport sheet with the full card. Nothing far ahead of the
 * flight (the card shows its date already), nothing once it is long over.
 */
export default function MFlightLiveStrip({ tripId, reservationId, onOpen, className = '' }: MFlightLiveStripProps) {
  const legIndex = useCurrentFlightLegIndex(tripId, reservationId);
  if (legIndex == null) return null;
  return (
    <Strip tripId={tripId} reservationId={reservationId} legIndex={legIndex} onOpen={onOpen} className={className} />
  );
}

function Strip({ tripId, reservationId, legIndex, onOpen, className }: MFlightLiveStripProps & { legIndex: number }) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card || card.view.stage === 'upcoming') return null;
  const { view } = card;
  // One of the card's own fields, full width: the label over the framed value, like the booking code below it.
  return (
    <button type="button" onClick={onOpen} className={`block text-start ${className}`}>
      <Field label={t('reservations.status')} className="w-full">
        <span className="inline-flex max-w-full items-center gap-2 align-middle">
          <span className="min-w-0 truncate">{card.line}</span>
          {card.delay && card.delay.tone !== 'ok' && (
            <span className="flex-none tabular-nums" style={{ color: DELAY_COLOR[card.delay.tone] }}>
              {card.delay.text}
            </span>
          )}
        </span>
        {view.stage === 'airborne' && (
          <span className="-mx-[10px] -mb-[7px] mt-[6px] block h-[3px] bg-[color:var(--m-rowbr)]" aria-hidden="true">
            <span
              className="block h-full transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${Math.round(view.progress * 100)}%`, background: LIVE }}
            />
          </span>
        )}
      </Field>
    </button>
  );
}

/**
 * A flight's moment under its row in the phone's day plan while something is
 * happening ("In the air, lands in 1 h 5 min") with a pulsing dot and the
 * delay; below the route, like the desktop's third line. Nothing on quiet days.
 */
export function MPlanFlightLine({
  tripId,
  reservationId,
  legIndex,
}: {
  tripId: number;
  reservationId: number;
  legIndex: number;
}) {
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  const stage = card?.view.stage;
  if (!card || stage === 'upcoming') return null;
  return (
    <div className="mt-[2px] flex min-w-0 items-center gap-[6px] font-geist text-caption">
      <span className="min-w-0 truncate font-semibold" style={{ color: card.live ? LIVE : 'var(--m-muted)' }}>
        {card.line}
      </span>
      {card.delay && card.delay.tone !== 'ok' && (
        <span className="flex-none font-bold tabular-nums" style={{ color: DELAY_COLOR[card.delay.tone] }}>
          {card.delay.text}
        </span>
      )}
    </div>
  );
}
