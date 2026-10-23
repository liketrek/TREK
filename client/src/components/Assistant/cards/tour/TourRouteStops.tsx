import type { TourRouteCard, TourRouteStop } from '@trek/shared';
import { AlertTriangle, Clock, Flag, MapPin, MountainSnow, type LucideIcon } from 'lucide-react';
import { createElement, type ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import {
  focusRouteProfileAtDistance,
  type DistanceIndexedProfileSample,
  type RouteProfileFocus,
} from '../../../../utils/routeGeometry';
import { TOUR_POI_LOOKS } from '../../../Map/poiCategories';
import { SoftPill } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { StageEndCorner } from '../../../Tours/stages/StageParts';
import { useCardFormat } from '../parts/useCardFormat';
import { chipStops } from './tourRouteModel';
import { FLAG_LOOK, stopName } from './tourRouteWords';

/**
 * The stops of a route as a timeline in the order they lie along it: one row
 * per stop on a line down the card (the start and the end filled, the huts,
 * summits and stations on the way with their glyph, what lies a little off
 * the way quieter), its name, how far off the way or how long the stay under
 * it, and its clock at the end; the walk between two stops sits on the line
 * between their rows, so a time is never read as a stop's own. Pointing at a
 * row or tapping it moves the spot in focus there, on the profile and on the
 * map alike. Past eight the middle ones fold into a row that names them.
 */

/** A stop's glyph: the flag at either end, the mountain at the highest point, the place's own for a kind. */
function iconOf(stop: TourRouteStop): LucideIcon {
  if (stop.kind === 'highest') return MountainSnow;
  if (stop.kind && stop.kind !== 'station') return TOUR_POI_LOOKS[stop.kind].Icon;
  return stop.role === 'start' || stop.role === 'end' ? Flag : MapPin;
}

/** The spot in focus for a stop: on the profile where it has one, else the stop itself at its distance. */
function focusOf(stop: TourRouteStop, samples: readonly DistanceIndexedProfileSample[]): RouteProfileFocus {
  return (
    focusRouteProfileAtDistance(samples, stop.atM) ?? {
      distanceMeters: stop.atM,
      elevationMeters: null,
      lat: stop.lat,
      lng: stop.lng,
      sampleIndex: 0,
    }
  );
}

/** A stop's mark on the line: filled at the start and the end, a ring with its glyph on the way, smaller off it. */
function Marker({ stop }: { stop: TourRouteStop }) {
  const end = stop.role === 'start' || stop.role === 'end';
  const along = stop.role === 'along';
  const glyph = createElement(iconOf(stop), { size: along ? 9 : 10, strokeWidth: 2.2, 'aria-hidden': true });
  let look = 'h-5 w-5 bg-surface-card text-content-muted ring-1 ring-inset ring-edge';
  if (end) look = 'h-5 w-5 bg-accent text-accent-text';
  else if (along) look = 'h-4 w-4 bg-surface-secondary text-content-faint ring-1 ring-inset ring-edge-faint';
  return (
    <span className="relative z-[1] flex w-5 flex-none justify-center">
      <span className={`grid place-items-center rounded-full ${look}`}>{glyph}</span>
      {stop.stageEnd && <StageEndCorner />}
    </span>
  );
}

function StopRow({
  stop,
  leg,
  samples,
  onFocus,
}: {
  stop: TourRouteStop;
  /** The walk from the last stop with a time to this one, read with it. */
  leg: number | null;
  samples: readonly DistanceIndexedProfileSample[];
  onFocus: (focus: RouteProfileFocus | null) => void;
}) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const name = stopName(stop, t);
  const along = stop.role === 'along';
  const off =
    along && stop.offM !== null
      ? t('assistant.card.tour.alongOff', { distance: format.distance(stop.offM / 1000) })
      : null;
  const stay = stop.stayMinutes ? t('assistant.card.tour.stay', { time: format.minutes(stop.stayMinutes) }) : null;
  const clock = stop.clock ? format.clock(stop.clock) : null;
  const walked = leg !== null ? t('assistant.card.tour.legTime', { time: format.minutes(leg) }) : null;
  const label = [name, clock, off, stay, walked].filter(Boolean).join(', ');
  const point = () => onFocus(focusOf(stop, samples));
  const under = [off, stay].filter((part): part is string => part !== null);
  return (
    <li className="flex">
      <button
        type="button"
        aria-label={label}
        onMouseEnter={point}
        onMouseLeave={() => onFocus(null)}
        onFocus={point}
        onBlur={() => onFocus(null)}
        onClick={point}
        className="-mx-1.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-1.5 py-1 text-start transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Marker stop={stop} />
        <span className="min-w-0 flex-1">
          <bdi
            className={`block truncate leading-tight ${along ? 'text-caption text-content-secondary' : 'text-body font-medium text-content'}`}
          >
            {name}
          </bdi>
          {(under.length > 0 || stop.flag) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-content-faint">
              {under.map((part) => (
                <span key={part}>{part}</span>
              ))}
              {stop.flag && (
                <SoftPill tone="warning" icon={<AlertTriangle size={10} strokeWidth={2.2} aria-hidden="true" />}>
                  {t(FLAG_LOOK[stop.flag].labelKey)}
                </SoftPill>
              )}
            </span>
          )}
        </span>
        {clock && <span className="flex-none text-caption tabular-nums text-content-muted">{clock}</span>}
      </button>
    </li>
  );
}

/** The walking time of the stretch from one stop to the next, on the line between them; null where it is not known. */
function legMinutes(from: TourRouteStop | undefined, to: TourRouteStop): number | null {
  if (!from || from.minutes === null || to.minutes === null || to.minutes <= from.minutes) return null;
  return to.minutes - from.minutes;
}

/** The walk between two rows, beside the line: read with the row it leads to, so hidden here. */
function Leg({ minutes }: { minutes: number | null }) {
  const format = useCardFormat();
  if (minutes === null) return <li aria-hidden="true" className="h-1.5" />;
  return (
    <li aria-hidden="true" className="flex items-center py-0.5 ps-[30px]">
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-caption tabular-nums text-content-muted">
        <Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />
        {format.minutes(minutes)}
      </span>
    </li>
  );
}

/** The middle stops folded into one row past eight, naming them in its tooltip. */
function FoldedRow({ stops }: { stops: readonly TourRouteStop[] }) {
  const { t } = useTranslation();
  const names = stops.map((stop) => stopName(stop, t)).join(', ');
  return (
    <li className="flex items-center gap-2.5 py-1">
      <span className="relative z-[1] flex w-5 flex-none justify-center">
        <span className="h-2 w-2 rounded-full border border-dashed border-content-faint bg-surface-card" />
      </span>
      <Tooltip label={names}>
        <span className="text-caption text-content-muted underline decoration-dotted underline-offset-2">
          {t('assistant.card.tour.stopsMore', { count: stops.length })}
          <span className="sr-only">{`: ${names}`}</span>
        </span>
      </Tooltip>
    </li>
  );
}

export default function TourRouteStops({
  card,
  samples,
  onFocus,
}: {
  card: TourRouteCard;
  samples: readonly DistanceIndexedProfileSample[];
  onFocus: (focus: RouteProfileFocus | null) => void;
}) {
  const { t } = useTranslation();
  const { head, folded, tail } = chipStops(card);
  if (head.length === 0) return null;
  // The time is walked from the last stop that has one: a place beside the way has none.
  let walked: TourRouteStop | undefined;
  const rows: ReactNode[] = [];
  const pushStop = (stop: TourRouteStop, key: string) => {
    const leg = legMinutes(walked, stop);
    if (rows.length > 0) rows.push(<Leg key={`${key}-leg`} minutes={leg} />);
    rows.push(<StopRow key={key} stop={stop} leg={leg} samples={samples} onFocus={onFocus} />);
    if (stop.minutes !== null) walked = stop;
  };
  head.forEach((stop, index) => pushStop(stop, `h-${index}`));
  if (folded.length > 0) {
    rows.push(<Leg key="f-leg" minutes={null} />);
    rows.push(<FoldedRow key="f" stops={folded} />);
    // The folded stretch's time is not one leg; the next stop measures from the last folded one.
    walked = [...folded].reverse().find((stop) => stop.minutes !== null) ?? walked;
  }
  tail.forEach((stop, index) => pushStop(stop, `t-${index}`));
  return (
    <div className="relative">
      {/* The line down the timeline, from the first mark to the last, under the marks. */}
      <span aria-hidden="true" className="absolute bottom-3 start-[9.5px] top-3 w-px bg-edge" />
      <ul className="relative m-0 flex list-none flex-col p-0" aria-label={t('assistant.card.tour.stops')}>
        {rows}
      </ul>
    </div>
  );
}
