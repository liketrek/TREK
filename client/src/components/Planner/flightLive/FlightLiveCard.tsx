import { Info, Radio } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { DelayTone } from '../../../utils/flightLiveModel';
import FlightArc from './FlightArc';
import { useFlightLiveCard, type FlightTimeCell } from './useFlightLiveCard';

const DELAY_CHIP: Record<DelayTone, string> = {
  ok: 'bg-success-soft text-success',
  minor: 'bg-warning-soft text-warning',
  major: 'bg-danger-soft text-danger',
};

interface FlightLiveCardProps {
  tripId: number;
  reservationId: number;
  legIndex: number;
  /** "Flight 2 of 3" above the card, for a booking with stopovers. */
  legLabel?: string;
}

function TimeBlock({
  code,
  city,
  cell,
  end,
}: {
  code: string;
  city: string | null;
  cell: FlightTimeCell;
  end?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${end ? 'items-end text-end' : 'items-start text-start'}`}>
      <span className="font-geist text-title font-bold leading-none tracking-[-0.02em] text-content">{code}</span>
      {city && (
        <span dir="auto" className="mt-1 max-w-full truncate text-caption text-content-faint">
          {city}
        </span>
      )}
      <span className="mt-2.5 flex items-baseline gap-1.5 tabular-nums">
        {cell.planned && <s className="text-caption text-content-faint">{cell.planned}</s>}
        <span className="text-subtitle font-semibold text-content">{cell.value}</span>
      </span>
      {cell.note && <span className="text-caption text-content-muted">{cell.note}</span>}
    </div>
  );
}

/**
 * A flight's live state in the booking dialog: what is happening now in one
 * line, both airports with their times, the route as an arc with the aircraft
 * on it, and the numbers of the moment. Renders nothing while TREK follows no
 * state for this leg, so the dialog keeps its plain schedule tiles.
 */
export default function FlightLiveCard({ tripId, reservationId, legIndex, legLabel }: FlightLiveCardProps) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card) return null;
  const { leg, view } = card;
  const quiet = view.stage === 'past' || view.stage === 'unknown';

  return (
    <section
      className="rounded-xl border border-edge bg-surface-card p-4"
      aria-label={`${leg.flight_number} ${card.headline}`}
    >
      {legLabel && (
        <div className="mb-2 font-geist text-caption font-semibold uppercase tracking-[0.06em] text-content-faint">
          {legLabel}
        </div>
      )}
      <header className="flex items-start gap-2.5">
        <span className="relative mt-[7px] flex h-2.5 w-2.5 flex-none">
          {card.live && (
            <span className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
          )}
          <span
            className={`relative h-2.5 w-2.5 rounded-full ${card.live ? 'bg-accent' : view.stage === 'landed' ? 'bg-success' : 'bg-content-faint'}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-subtitle font-semibold leading-snug text-content">{card.headline}</div>
          {card.detail && <div className="text-caption text-content-muted">{card.detail}</div>}
        </div>
        {card.delay && (
          <span
            className={`flex-none rounded-full px-2.5 py-1 text-caption font-semibold tabular-nums ${DELAY_CHIP[card.delay.tone]}`}
          >
            {card.delay.text}
          </span>
        )}
      </header>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-3">
        <TimeBlock code={leg.origin.code} city={leg.origin.name} cell={card.dep} />
        <div className="flex flex-col items-center pt-1">
          <FlightArc
            progress={view.progress}
            showPlane={!quiet}
            dimPlane={view.stale}
            track="var(--text-faint)"
            flown="var(--accent)"
            plane={view.stage === 'landed' ? 'var(--text-muted)' : 'var(--accent)'}
            className="max-w-[260px]"
          />
          <span className="mt-1 font-geist text-caption font-semibold tracking-[0.04em] text-content-muted">
            {leg.flight_number}
          </span>
        </div>
        <TimeBlock code={leg.destination.code} city={leg.destination.name} cell={card.arr} end />
      </div>

      {card.stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {card.stats.map((s) => (
            <div key={s.label} className="min-w-0 rounded-lg bg-surface-tertiary px-2.5 py-2">
              <div className="truncate text-caption text-content-faint">{s.label}</div>
              <div className="truncate text-body font-semibold tabular-nums text-content">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {card.gateHint && (
        <p className="mt-3 flex items-start gap-1.5 text-caption text-content-faint">
          <Info size={13} strokeWidth={2} className="mt-px flex-none" />
          {t('flightLive.noGateHint')}
        </p>
      )}

      {card.footnote && (
        <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-content-faint">
          <span className="inline-flex items-center gap-1.5">
            <Radio size={12} strokeWidth={2} className={view.stale ? 'text-warning' : ''} />
            {card.footnote}
          </span>
          {card.attribution && <span className="ms-auto">{card.attribution}</span>}
        </footer>
      )}
    </section>
  );
}
