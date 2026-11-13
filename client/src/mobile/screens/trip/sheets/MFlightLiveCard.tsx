import { Info, Radio } from 'lucide-react';
import FlightArc from '../../../../components/Planner/flightLive/FlightArc';
import { useFlightLiveCard, type FlightTimeCell } from '../../../../components/Planner/flightLive/useFlightLiveCard';
import { useTranslation } from '../../../../i18n';
import type { DelayTone } from '../../../../utils/flightLiveModel';
import { INNER_CLS, StatBox } from './MTripSheetUi';

const DELAY_CHIP: Record<DelayTone, string> = {
  ok: 'bg-[color-mix(in_srgb,var(--m-st-confirmed)_16%,transparent)] text-[color:var(--m-st-confirmed)]',
  minor: 'bg-[color-mix(in_srgb,var(--m-st-pending)_18%,transparent)] text-[color:var(--m-st-pending)]',
  major: 'bg-[color-mix(in_srgb,var(--m-st-danger)_16%,transparent)] text-[color:var(--m-st-danger)]',
};

const LIVE = 'var(--m-st-info)';

function Airport({
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
      <span className="font-geist text-title font-bold leading-none tracking-[-0.03em] text-m-ink">{code}</span>
      {city && (
        <span dir="auto" className="mt-[3px] max-w-full truncate text-caption text-m-faint">
          {city}
        </span>
      )}
      {cell.planned && <s className="mt-[7px] font-geist text-caption tabular-nums text-m-faint">{cell.planned}</s>}
      <span
        className={`${cell.planned ? '' : 'mt-[7px]'} font-geist text-subtitle font-bold tabular-nums leading-tight text-m-ink`}
      >
        {cell.value}
      </span>
      {cell.note && (
        <span className="text-caption font-medium uppercase tracking-[.05em] text-m-muted">{cell.note}</span>
      )}
    </div>
  );
}

interface MFlightLiveCardProps {
  tripId: number;
  reservationId: number;
  legIndex: number;
  legLabel?: string;
}

/**
 * The live flight card of the phone's transport sheet: the moment in one line,
 * the two airports large with their times, the route as an arc with the
 * aircraft on it, and the numbers of the moment as the sheet's own stat boxes.
 * Same data as the desktop card (useFlightLiveCard), laid out for a thumb.
 */
export default function MFlightLiveCard({ tripId, reservationId, legIndex, legLabel }: MFlightLiveCardProps) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card) return null;
  const { leg, view } = card;
  const quiet = view.stage === 'past' || view.stage === 'unknown';

  return (
    <section
      className={`mt-[14px] rounded-[18px] px-[14px] pb-3 pt-[13px] ${INNER_CLS}`}
      aria-label={`${leg.flight_number} ${card.headline}`}
    >
      {legLabel && (
        <div className="mb-[6px] font-geist text-caption font-bold uppercase tracking-[.08em] text-m-faint">
          {legLabel}
        </div>
      )}
      <div className="flex items-start gap-[9px]">
        <span className="relative mt-[7px] flex h-2 w-2 flex-none">
          {card.live && (
            <span
              className="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping"
              style={{ background: LIVE }}
            />
          )}
          <span
            className="relative h-2 w-2 rounded-full"
            style={{
              background: card.live ? LIVE : view.stage === 'landed' ? 'var(--m-st-confirmed)' : 'var(--m-faint)',
            }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-body font-semibold leading-snug text-m-ink">{card.headline}</div>
          {card.detail && <div className="mt-px text-caption text-m-muted">{card.detail}</div>}
        </div>
        {card.delay && (
          <span
            className={`flex-none rounded-full px-[9px] py-[3px] font-geist text-caption font-bold tabular-nums ${DELAY_CHIP[card.delay.tone]}`}
          >
            {card.delay.text}
          </span>
        )}
      </div>

      <div className="mt-[14px] grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-2">
        <Airport code={leg.origin.code} city={leg.origin.name} cell={card.dep} />
        <div className="flex flex-col items-center pt-[2px]">
          <FlightArc
            progress={view.progress}
            showPlane={!quiet}
            dimPlane={view.stale}
            track="var(--m-faint)"
            flown={view.stage === 'landed' ? 'var(--m-muted)' : LIVE}
            plane={view.stage === 'landed' ? 'var(--m-muted)' : 'var(--m-ink)'}
          />
          <span className="mt-[2px] font-geist text-caption font-bold tracking-[.06em] text-m-muted">
            {leg.flight_number}
          </span>
        </div>
        <Airport code={leg.destination.code} city={leg.destination.name} cell={card.arr} end />
      </div>

      {card.stats.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-[6px]">
          {card.stats.map((s) => (
            <StatBox key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      )}

      {card.gateHint && (
        <p className="mt-[10px] flex items-start gap-[6px] text-caption text-m-faint">
          <Info size={12} strokeWidth={2} className="mt-px flex-none" />
          {t('flightLive.noGateHint')}
        </p>
      )}

      {card.footnote && (
        <div className="mt-[10px] flex flex-wrap items-center gap-x-2 gap-y-[2px] font-geist text-caption text-m-faint">
          <span className="inline-flex items-center gap-1">
            <Radio size={11} strokeWidth={2} style={view.stale ? { color: 'var(--m-st-pending)' } : undefined} />
            {card.footnote}
          </span>
          {card.attribution && <span className="ms-auto">{card.attribution}</span>}
        </div>
      )}
    </section>
  );
}
