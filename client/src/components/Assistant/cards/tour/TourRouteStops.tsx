import type { TourRouteCard, TourRouteStop } from '@trek/shared';
import { AlertTriangle, Flag, MapPin, MountainSnow, type LucideIcon } from 'lucide-react';
import { createElement, type ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import {
  focusRouteProfileAtDistance,
  type DistanceIndexedProfileSample,
  type RouteProfileFocus,
} from '../../../../utils/routeGeometry';
import { TOUR_POI_LOOKS } from '../../../Map/poiCategories';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { StageEndCorner } from '../../../Tours/stages/StageParts';
import { useCardFormat } from '../parts/useCardFormat';
import { chipStops } from './tourRouteModel';
import { FLAG_LOOK, stopName } from './tourRouteWords';

/**
 * The stops of a route as a timeline in the order they lie along it: one row
 * per stop (the start and the end, the huts, summits and stations on the way
 * with their clock, what lies a little off the way quieter), joined by a line
 * that carries the walking time of the stretch between two stops, so a time
 * is never read as belonging to the stop beside it. Pointing at a chip or
 * tapping it moves the spot in focus there, on the profile and on the map
 * alike. Past eight the middle ones fold into a count that names them.
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

function StopChip({
  stop,
  samples,
  onFocus,
}: {
  stop: TourRouteStop;
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
  const label = [name, clock, off, stay].filter(Boolean).join(', ');
  const glyph = createElement(iconOf(stop), {
    size: 10,
    strokeWidth: 2.2,
    'aria-hidden': true,
    className: 'flex-none text-content-faint',
  });
  const body = (
    <>
      <bdi className="max-w-[10rem] truncate">{name}</bdi>
      {clock && <span className="tabular-nums text-content-muted">{clock}</span>}
      {off && <span className="text-content-faint">{off}</span>}
    </>
  );
  return (
    <span className="inline-flex items-center gap-1">
      <Tooltip label={label}>
        <button
          type="button"
          aria-label={label}
          onMouseEnter={() => onFocus(focusOf(stop, samples))}
          onMouseLeave={() => onFocus(null)}
          onFocus={() => onFocus(focusOf(stop, samples))}
          onBlur={() => onFocus(null)}
          onClick={() => onFocus(focusOf(stop, samples))}
          className="relative inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {along ? <WhiteBadge icon={glyph}>{body}</WhiteBadge> : <SoftPill icon={glyph}>{body}</SoftPill>}
          {stop.stageEnd && <StageEndCorner />}
        </button>
      </Tooltip>
      {stay && <span className="text-caption text-content-faint">{stay}</span>}
      {stop.flag && (
        <SoftPill tone="warning" icon={<AlertTriangle size={10} strokeWidth={2.2} aria-hidden="true" />}>
          {t(FLAG_LOOK[stop.flag].labelKey)}
        </SoftPill>
      )}
    </span>
  );
}

/** The walking time of the stretch from one stop to the next, on the line between them; null where it is not known. */
function legMinutes(from: TourRouteStop | undefined, to: TourRouteStop): number | null {
  if (!from || from.minutes === null || to.minutes === null || to.minutes <= from.minutes) return null;
  return to.minutes - from.minutes;
}

/** The line between two rows, with the stretch's walking time on it. */
function Leg({ minutes }: { minutes: number | null }) {
  const format = useCardFormat();
  return (
    // Read with the stop it leads to; a list holds only its rows.
    <span aria-hidden="true" className="flex min-h-[14px] items-stretch gap-2">
      <span className="flex w-2.5 flex-none justify-center">
        <span className="w-px bg-edge" />
      </span>
      {minutes !== null && (
        <span className="text-caption tabular-nums leading-tight text-content-faint">{format.minutes(minutes)}</span>
      )}
    </span>
  );
}

/** One row of the timeline: its dot on the line, then the stop, read after the walk that leads to it. */
function Row({ end, leg, children }: { end: boolean; leg?: number | null; children: ReactNode }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  return (
    <span role="listitem" className="flex items-center gap-2">
      {leg != null && (
        <span className="sr-only">{t('assistant.card.tour.legTime', { time: format.minutes(leg) })}</span>
      )}
      <span className="flex w-2.5 flex-none justify-center">
        <span
          className={`h-2 w-2 rounded-full ${end ? 'bg-content-muted' : 'border border-content-faint bg-surface-card'}`}
        />
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</span>
    </span>
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
  const names = folded.map((stop) => stopName(stop, t)).join(', ');
  // The time is walked from the last stop that has one: a place beside the way has none.
  let walked: TourRouteStop | undefined;
  const rows: ReactNode[] = [];
  const pushStop = (stop: TourRouteStop, key: string) => {
    const leg = legMinutes(walked, stop);
    if (rows.length > 0) rows.push(<Leg key={`${key}-leg`} minutes={leg} />);
    rows.push(
      <Row key={key} end={stop.role === 'start' || stop.role === 'end'} leg={leg}>
        <StopChip stop={stop} samples={samples} onFocus={onFocus} />
      </Row>
    );
    if (stop.minutes !== null) walked = stop;
  };
  head.forEach((stop, index) => pushStop(stop, `h-${index}`));
  if (folded.length > 0) {
    rows.push(<Leg key="f-leg" minutes={null} />);
    rows.push(
      <Row key="f" end={false}>
        <Tooltip label={names}>
          <span className="inline-flex">
            <WhiteBadge>
              {t('assistant.card.tour.stopsMore', { count: folded.length })}
              <span className="sr-only">{`: ${names}`}</span>
            </WhiteBadge>
          </span>
        </Tooltip>
      </Row>
    );
    // The folded stretch's time is not one leg; the next stop measures from the last folded one.
    walked = [...folded].reverse().find((stop) => stop.minutes !== null) ?? walked;
  }
  tail.forEach((stop, index) => pushStop(stop, `t-${index}`));
  return (
    <div className="mt-2 flex flex-col" role="list" aria-label={t('assistant.card.tour.stops')}>
      {rows}
    </div>
  );
}
