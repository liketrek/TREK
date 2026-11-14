import { Clock, Info } from 'lucide-react';
import FlightMiniMap, { FLIGHT_MAP_CREDIT } from '../../../../components/Planner/flightLive/FlightMiniMap';
import { useFlightLiveCard, type FlightTimeCell } from '../../../../components/Planner/flightLive/useFlightLiveCard';
import { useTranslation } from '../../../../i18n';
import type { DelayTone } from '../../../../utils/flightLiveModel';
import { INNER_CLS, StatBox } from './MTripSheetUi';

type CardTone = 'live' | 'done' | 'planned';

const DELAY_TONE: Record<DelayTone, string> = {
  ok: 'text-[color:var(--m-st-confirmed)]',
  minor: 'text-[color:var(--m-st-pending)]',
  major: 'text-[color:var(--m-st-danger)]',
};

/** The head band's tint and the status dot, in the stage's colour. */
const HEAD: Record<CardTone, { band: string; dot: string }> = {
  live: { band: 'bg-[color-mix(in_srgb,var(--m-st-info)_12%,transparent)]', dot: 'bg-[color:var(--m-st-info)]' },
  done: {
    band: 'bg-[color-mix(in_srgb,var(--m-st-confirmed)_12%,transparent)]',
    dot: 'bg-[color:var(--m-st-confirmed)]',
  },
  planned: { band: 'bg-[color:var(--m-ic)]', dot: 'bg-[color:var(--m-faint)]' },
};

const BADGE =
  'inline-flex flex-none items-center gap-[5px] rounded-full bg-[color:var(--m-inner)] px-[7px] py-[2px] font-geist text-caption font-bold shadow-sm';

/** The time that counts on a tile, the planned one struck beside it; both ends' tiles are the same size. */
function TimeTile({ cell, end }: { cell: FlightTimeCell; end?: boolean }) {
  return (
    <span
      className={`mt-auto flex w-full items-baseline gap-[5px] rounded-[10px] bg-[color:var(--m-inner)] px-[9px] py-[6px] tabular-nums shadow-sm ${end ? 'justify-end' : 'justify-start'}`}
    >
      {cell.planned && <s className="font-geist text-caption text-m-faint">{cell.planned}</s>}
      <span className="font-geist text-subtitle font-bold leading-tight text-m-ink">{cell.value}</span>
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
      <span className="font-geist text-caption font-bold uppercase tracking-[.08em] text-m-faint">{label}</span>
      <span className="mt-[3px] font-geist text-title font-bold leading-none tracking-[-0.03em] text-m-ink">
        {code}
      </span>
      {city && (
        <span
          dir="auto"
          className="mt-[3px] line-clamp-2 max-w-full break-words text-caption leading-snug text-m-muted"
        >
          {city}
        </span>
      )}
      <span className="h-[10px] flex-none" />
      <TimeTile cell={cell} end={end} />
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
 * The live flight card of the phone's transport sheet, laid out like the
 * desktop card (useFlightLiveCard) from the sheet's own parts: a tinted head
 * with badges (where the flight stands, what comes next, the delay), the pass
 * with the small route map behind it and both times on tiles, then the numbers
 * of the moment as the sheet's stat boxes. Nothing without live data.
 */
export default function MFlightLiveCard({ tripId, reservationId, legIndex, legLabel }: MFlightLiveCardProps) {
  const { t } = useTranslation();
  const card = useFlightLiveCard(tripId, reservationId, legIndex);
  if (!card) return null;
  const { leg, view } = card;
  const head = HEAD[card.tone];

  return (
    <section
      className={`mt-[14px] overflow-hidden rounded-[18px] ${INNER_CLS}`}
      aria-label={`${leg.flight_number} ${card.headline}`}
    >
      <div className={`flex items-center gap-[5px] px-[10px] py-[7px] ${head.band}`}>
        {legLabel && (
          <span className="me-[2px] font-geist text-caption font-bold uppercase tracking-[.08em] text-m-faint">
            {legLabel}
          </span>
        )}
        <span className={`${BADGE} text-m-ink`}>
          <span className={`h-[6px] w-[6px] flex-none rounded-full ${head.dot}`} />
          {card.headline}
        </span>
        {card.detail && (
          <span className={`${BADGE} min-w-0 flex-initial font-semibold text-m-muted`}>
            <Clock size={10} strokeWidth={2.2} className="flex-none" />
            <span className="truncate">{card.detail}</span>
          </span>
        )}
        {card.delay && (
          <span className={`${BADGE} ms-auto tabular-nums ${DELAY_TONE[card.delay.tone]}`}>{card.delay.text}</span>
        )}
      </div>

      <div className="px-[12px] pb-3 pt-[12px]">
        <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)] items-stretch gap-2 overflow-hidden rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[11px]">
          <FlightMiniMap
            leg={leg}
            progress={view.progress}
            showPlane={view.stage !== 'upcoming' && view.stage !== 'soon'}
            dimPlane={view.stale}
            credits={card.attribution ? [card.attribution, FLIGHT_MAP_CREDIT] : [FLIGHT_MAP_CREDIT]}
            inset={0.06}
            className="flight-mini-map--narrow !absolute inset-y-2 end-[25%] start-[25%] [--fm-ahead:var(--m-muted)] [--fm-code:var(--m-muted)] [--fm-end:var(--m-inner)] [--fm-flown:var(--m-st-info)] [--fm-halo:var(--m-inner)] [--fm-plane:var(--m-st-info)]"
          />
          <End label={t('reservations.span.departure')} code={leg.origin.code} city={leg.origin.name} cell={card.dep} />
          {/* The middle column keeps the map clear; the flight number is in the sheet's title already. */}
          <div aria-hidden="true" />
          <End
            label={t('reservations.span.arrival')}
            code={leg.destination.code}
            city={leg.destination.name}
            cell={card.arr}
            end
          />
        </div>

        {card.stats.length > 0 && (
          <div className="mt-[10px] grid grid-cols-2 gap-[6px]">
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
      </div>
    </section>
  );
}
