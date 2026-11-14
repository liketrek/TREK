import { useTranslation } from '../../../i18n';
import type { Reservation } from '../../../types';
import type { DelayTone } from '../../../utils/flightLiveModel';
import { BOX, Eyebrow } from '../bookings/bookingParts';
import { useCurrentFlightLegIndex, useFlightLiveCard } from './useFlightLiveCard';

const DELAY_TEXT: Record<DelayTone, string> = { ok: 'text-success', minor: 'text-warning', major: 'text-danger' };

interface FlightLiveStripProps {
  tripId: number;
  reservationId: number;
  /** The booking's type: anything but a flight renders nothing, so a card can hand every booking in. */
  type: string;
  className?: string;
}

/**
 * A flight's live state on the booking cards, as one of the card's fields:
 * what is happening in one line with the delay, and a thin bar along the
 * field's foot while it flies. The full
 * picture is one click away in the booking dialog. Nothing far ahead of the
 * flight (the card shows its date already), nothing once it is long over.
 */
export default function FlightLiveStrip({ tripId, reservationId, type, className = '' }: FlightLiveStripProps) {
  const legIndex = useCurrentFlightLegIndex(tripId, reservationId);
  if (type !== 'flight' || legIndex == null) return null;
  return <Strip tripId={tripId} reservationId={reservationId} legIndex={legIndex} className={className} />;
}

function Strip({
  tripId,
  reservationId,
  legIndex,
  className,
}: Omit<FlightLiveStripProps, 'type'> & { legIndex: number }) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card || card.view.stage === 'upcoming') return null;
  const { view } = card;
  // The card's own field: the eyebrow over a framed value, like the booking code and the route under it.
  return (
    <div className={`min-w-0 ${className}`}>
      <Eyebrow className="mb-[3px]">{t('reservations.status')}</Eyebrow>
      <div className={`${BOX} relative overflow-hidden px-[10px] py-[7px]`}>
        <div className="flex min-w-0 items-center justify-center gap-2 text-body font-semibold text-content">
          <span className="min-w-0 truncate">{card.line}</span>
          {card.delay && card.delay.tone !== 'ok' && (
            <span className={`flex-none tabular-nums ${DELAY_TEXT[card.delay.tone]}`}>{card.delay.text}</span>
          )}
        </div>
        {view.stage === 'airborne' && (
          <span className="absolute inset-x-0 bottom-0 block h-[3px] bg-surface-tertiary" aria-hidden="true">
            <span
              className="block h-full bg-info transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${Math.round(view.progress * 100)}%` }}
            />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * A third line under a flight's row in the desktop day plan while something is
 * happening: the moment, a pulsing dot and the delay. Quiet days (departure
 * more than three hours away, long over) add nothing, and so does any booking
 * that is not a flight, so the plan can hand every transport row in.
 */
export function PlanFlightLiveLine({
  tripId,
  res,
}: {
  tripId: number;
  res: Reservation & { __leg?: { index: number } };
}) {
  if (res.type !== 'flight') return null;
  return <PlanLine tripId={tripId} reservationId={res.id} legIndex={res.__leg?.index ?? 0} />;
}

function PlanLine({ tripId, reservationId, legIndex }: { tripId: number; reservationId: number; legIndex: number }) {
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  const stage = card?.view.stage;
  if (!card || stage === 'upcoming') return null;
  return (
    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-caption">
      <span className={`min-w-0 truncate font-semibold ${card.live ? 'text-content' : 'text-content-muted'}`}>
        {card.line}
      </span>
      {card.delay && card.delay.tone !== 'ok' && (
        <span className={`flex-none font-semibold tabular-nums ${DELAY_TEXT[card.delay.tone]}`}>{card.delay.text}</span>
      )}
    </div>
  );
}
