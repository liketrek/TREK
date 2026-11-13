import type { Reservation } from '../../../types';
import type { DelayTone } from '../../../utils/flightLiveModel';
import { useCurrentFlightLegIndex, useFlightLiveCard } from './useFlightLiveCard';

const DELAY_TEXT: Record<DelayTone, string> = { ok: 'text-success', minor: 'text-warning', major: 'text-danger' };

/** The status dot: pulsing accent while the aircraft moves, green once landed, faint otherwise. */
function Dot({ live, landed, size }: { live: boolean; landed: boolean; size: string }) {
  return (
    <span className={`relative flex flex-none ${size}`}>
      {live && <span className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping" />}
      <span
        className={`relative rounded-full ${size} ${live ? 'bg-accent' : landed ? 'bg-success' : 'bg-content-faint'}`}
      />
    </span>
  );
}

interface FlightLiveStripProps {
  tripId: number;
  reservationId: number;
  className?: string;
}

/**
 * A flight's live state on the booking cards: what is happening in one line
 * with the delay, and a thin bar across the card while it flies. The full
 * picture is one click away in the booking dialog. Nothing far ahead of the
 * flight (the card shows its date already), nothing once it is long over.
 */
export default function FlightLiveStrip({ tripId, reservationId, className = '' }: FlightLiveStripProps) {
  const legIndex = useCurrentFlightLegIndex(tripId, reservationId);
  if (legIndex == null) return null;
  return <Strip tripId={tripId} reservationId={reservationId} legIndex={legIndex} className={className} />;
}

function Strip({ tripId, reservationId, legIndex, className }: FlightLiveStripProps & { legIndex: number }) {
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card || card.view.stage === 'past' || card.view.stage === 'upcoming') return null;
  const { view } = card;
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 rounded-lg bg-surface-tertiary px-2.5 py-[7px] ${className}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Dot live={card.live} landed={view.stage === 'landed'} size="h-2 w-2" />
        <span className="min-w-0 flex-1 truncate text-caption font-semibold text-content">{card.line}</span>
        {card.delay && card.delay.tone !== 'ok' && (
          <span className={`flex-none text-caption font-semibold tabular-nums ${DELAY_TEXT[card.delay.tone]}`}>
            {card.delay.text}
          </span>
        )}
      </div>
      {view.stage === 'airborne' && (
        <span
          className="block h-1 w-full overflow-hidden rounded-full bg-[color:var(--border-primary)]"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${Math.round(view.progress * 100)}%` }}
          />
        </span>
      )}
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
  if (!card || stage === 'past' || stage === 'upcoming') return null;
  return (
    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-caption">
      <Dot live={card.live} landed={stage === 'landed'} size="h-1.5 w-1.5" />
      <span className={`min-w-0 truncate font-semibold ${card.live ? 'text-content' : 'text-content-muted'}`}>
        {card.line}
      </span>
      {card.delay && card.delay.tone !== 'ok' && (
        <span className={`flex-none font-semibold tabular-nums ${DELAY_TEXT[card.delay.tone]}`}>{card.delay.text}</span>
      )}
    </div>
  );
}
