import { Clock, Info } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { DelayTone } from '../../../utils/flightLiveModel';
import { Field } from '../bookings/bookingParts';
import FlightMiniMap, { FLIGHT_MAP_CREDIT } from './FlightMiniMap';
import { useFlightLiveCard, type FlightTimeCell } from './useFlightLiveCard';

type CardTone = 'live' | 'done' | 'planned';

/** The dialog head's pill, one size down: this head sits inside the dialog, under the real one. */
const PILL =
  'inline-flex flex-none items-center gap-1 rounded-full bg-surface-card px-2 py-0.5 text-caption font-semibold text-content shadow-sm';

const DELAY_TONE: Record<DelayTone, string> = {
  ok: 'text-success',
  minor: 'text-warning',
  major: 'text-danger',
};

/** The head band's tint and the status dot, in the stage's colour like a booking dialog's head. */
const HEAD: Record<CardTone, { band: string; dot: string }> = {
  live: { band: 'bg-[color-mix(in_srgb,var(--info)_11%,transparent)]', dot: 'bg-info' },
  done: { band: 'bg-[color-mix(in_srgb,var(--success)_11%,transparent)]', dot: 'bg-success' },
  planned: { band: 'bg-surface-tertiary', dot: 'bg-content-faint' },
};

interface FlightLiveCardProps {
  tripId: number;
  reservationId: number;
  legIndex: number;
  /** "Flight 2 of 3" in the head, for a booking with stopovers. */
  legLabel?: string;
}

/** The time that counts on a white tile, the planned one struck beside it; both ends' tiles are the same size. */
function TimeTile({ cell, end }: { cell: FlightTimeCell; end?: boolean }) {
  return (
    <span
      className={`mt-auto flex w-full items-baseline gap-1.5 rounded-lg bg-surface-card px-2.5 py-1.5 tabular-nums shadow-sm ${end ? 'justify-end' : 'justify-start'}`}
    >
      {cell.planned && <s className="text-caption text-content-faint">{cell.planned}</s>}
      <span className="text-subtitle font-semibold leading-tight text-content">{cell.value}</span>
    </span>
  );
}

/** One end of the pass: its label, the airport code large, the city, and its time at the foot. */
function End({
  label,
  code,
  city,
  cell,
  end,
}: {
  label: string;
  code: string;
  city: string | null;
  cell: FlightTimeCell;
  end?: boolean;
}) {
  return (
    <div className={`relative z-[1] flex min-w-0 flex-col ${end ? 'items-end text-end' : 'items-start text-start'}`}>
      <span className="font-geist text-caption font-semibold uppercase tracking-[0.08em] text-content-faint">
        {label}
      </span>
      <span className="mt-1 font-geist text-title font-bold leading-none tracking-[-0.02em] text-content">{code}</span>
      {city && (
        <span
          dir="auto"
          className="mt-1 line-clamp-2 max-w-full break-words text-caption leading-snug text-content-muted"
        >
          {city}
        </span>
      )}
      <span className="h-3 flex-none" />
      <TimeTile cell={cell} end={end} />
    </div>
  );
}

/**
 * A flight's live state in the booking dialog, built from the dialog's own
 * parts: a tinted head with pills (where the flight stands, what comes next,
 * the delay) like the dialog's head; the pass with a small real map of the
 * route behind it and both times on tiles; then the numbers of the moment as
 * the dialog's fields. Renders nothing while TREK has no live state to show
 * for this leg, so the dialog keeps its plain schedule tiles.
 */
export default function FlightLiveCard({ tripId, reservationId, legIndex, legLabel }: FlightLiveCardProps) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card) return null;
  const { leg, view } = card;
  const head = HEAD[card.tone];

  return (
    <section
      className="overflow-hidden rounded-xl border border-edge bg-surface-card"
      aria-label={`${leg.flight_number} ${card.headline}`}
    >
      <header className={`flex flex-wrap items-center gap-1.5 px-3 py-2 ${head.band}`}>
        {legLabel && (
          <span className="me-1 font-geist text-caption font-semibold uppercase tracking-[0.08em] text-content-faint">
            {legLabel}
          </span>
        )}
        <span className={PILL}>
          <span className={`h-1.5 w-1.5 flex-none rounded-full ${head.dot}`} />
          {card.headline}
        </span>
        {card.detail && (
          <span className={PILL}>
            <Clock size={11} strokeWidth={2.2} className="text-content-faint" />
            <span className="font-medium text-content-muted">{card.detail}</span>
          </span>
        )}
        {card.delay && (
          <span className={`${PILL} ms-auto tabular-nums ${DELAY_TONE[card.delay.tone]}`}>{card.delay.text}</span>
        )}
      </header>

      <div className="p-4">
        <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-stretch gap-3 overflow-hidden rounded-lg bg-surface-tertiary px-4 py-3.5">
          <FlightMiniMap
            leg={leg}
            progress={view.progress}
            showPlane={view.stage !== 'upcoming' && view.stage !== 'soon'}
            dimPlane={view.stale}
            credits={card.attribution ? [card.attribution, FLIGHT_MAP_CREDIT] : [FLIGHT_MAP_CREDIT]}
            inset={0.36}
            className="!absolute inset-0 [--fm-ahead:var(--text-muted)] [--fm-code:var(--text-muted)] [--fm-end:var(--bg-card)] [--fm-flown:var(--info)] [--fm-halo:var(--bg-card)] [--fm-plane:var(--info)]"
          />
          <End label={t('reservations.span.departure')} code={leg.origin.code} city={leg.origin.name} cell={card.dep} />
          <div className="relative z-[1] flex items-end justify-center">
            <span className="rounded-full bg-surface-card px-2 py-0.5 font-geist text-caption font-semibold tracking-[0.04em] text-content-muted shadow-sm">
              {leg.flight_number}
            </span>
          </div>
          <End
            label={t('reservations.span.arrival')}
            code={leg.destination.code}
            city={leg.destination.name}
            cell={card.arr}
            end
          />
        </div>

        {card.stats.length > 0 && (
          <div className="mt-3 grid auto-cols-fr grid-flow-col gap-2">
            {card.stats.map((s) => (
              <Field key={s.label} label={s.label} tabular>
                {s.value}
              </Field>
            ))}
          </div>
        )}

        {card.gateHint && (
          <p className="mt-3 flex items-start gap-1.5 text-caption text-content-faint">
            <Info size={13} strokeWidth={2} className="mt-px flex-none" />
            {t('flightLive.noGateHint')}
          </p>
        )}
      </div>
    </section>
  );
}
