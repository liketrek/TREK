import { walkRemainderOf, type WalkFerryLeg, type WalkRemainder, type WalkStationRef } from '@trek/shared';
import { useMemo } from 'react';
import type { useTranslation } from '../../../i18n';
import type { VisitsByStation } from '../../../store/tourVisitStore';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { formatPlannedTourDuration } from '../tourPresentation';
import type { LinkedPlaceOf } from './walkSchedule';

type Translate = ReturnType<typeof useTranslation>['t'];

export interface WalkRemainingInput {
  /** The walk's stations in order, null while they load. */
  stations: readonly TourPlannerWaypoint[] | null;
  /** The day's status of each station by its key. */
  visits: VisitsByStation | undefined;
  route: ReadonlyArray<readonly [number, number]> | null;
  walkingMinutes: number | null;
  placeOf: LinkedPlaceOf;
  /**
   * CW-12: the walk's ferry legs, read off all its points as the server reads
   * them, so one from a shaping point counts too.
   */
  ferries?: readonly WalkFerryLeg[];
}

const NO_FERRIES: readonly WalkFerryLeg[] = [];

/**
 * CW-13: what is left of a walk on the day it was opened from, by the same
 * rule the assistant reads over MCP (`walk-remaining.ts` in `@trek/shared`),
 * from the stations and visits this device holds, so it answers offline too.
 * Null without stations.
 */
export function walkRemainingOf({
  stations,
  visits,
  route,
  walkingMinutes,
  placeOf,
  ferries = NO_FERRIES,
}: WalkRemainingInput): WalkRemainder | null {
  if (!stations || stations.length === 0) return null;
  return walkRemainderOf({
    stations: stations.map((station) => ({
      lat: station.lat,
      lng: station.lng,
      stayMinutes: station.stayMinutes ?? null,
      key: station.key ?? null,
      name: station.name ?? placeOf(station)?.name ?? null,
      status: (station.key && visits?.[station.key]) || 'planned',
      importance: station.importance ?? null,
    })),
    line: route,
    walkingMinutes,
    // CW-12: a ferry leg is crossed by boat and takes none of the walking time.
    crossings: ferries.flatMap((leg) => leg.crossings),
  });
}

export function useWalkRemaining({
  stations,
  visits,
  route,
  walkingMinutes,
  placeOf,
  ferries = NO_FERRIES,
}: WalkRemainingInput): WalkRemainder | null {
  return useMemo(
    () => walkRemainingOf({ stations, visits, route, walkingMinutes, placeOf, ferries }),
    [ferries, placeOf, route, stations, visits, walkingMinutes]
  );
}

/** What the pill shows: its value, the words of its tooltip, and whether it is dimmed for a time not known. */
export interface WalkRemainingText {
  value: string;
  label: string;
  known: boolean;
}

function stationName(station: WalkStationRef, t: Translate): string {
  return station.name ?? t('tours.walk.stationNumbered', { number: station.position });
}

/** The stays still open, as the tooltip names them after the walking time. */
function staysText({ stays }: WalkRemainder, t: Translate): string[] {
  const parts: string[] = [];
  if (stays.remaining_known_minutes > 0) {
    parts.push(t('tours.walk.remaining.stays', { time: formatPlannedTourDuration(stays.remaining_known_minutes) }));
  }
  if (stays.unknown.length > 0) parts.push(t('tours.walk.remaining.staysUnknown', { count: stays.unknown.length }));
  return parts;
}

function unknownText(remainder: WalkRemainder, t: Translate): WalkRemainingText {
  const { reference, walking } = remainder;
  if (reference.kind === 'ambiguous') {
    const names = reference.open_before.map((station) => stationName(station, t)).join(', ');
    return {
      value: t('tours.walk.remaining.unclear'),
      label: [
        t('tours.walk.remaining.unclearHint', { names, last: stationName(reference.last_visited, t) }),
        ...staysText(remainder, t),
      ].join(' '),
      known: false,
    };
  }
  const reason =
    walking.unknown_because === 'no_walking_time'
      ? t('tours.walk.remaining.noWalkingTime')
      : t('tours.walk.remaining.routePending');
  return {
    value: t('tours.walk.remaining.unknown'),
    label: [reason, ...staysText(remainder, t)].join(' '),
    known: false,
  };
}

/**
 * CW-13: the remaining time as the pill says it: the walking time still
 * ahead, an upper bound while a stop ahead is skipped, and in its tooltip what
 * it counts from, the part after the last stop and the stays still open, which
 * are never added to it. Once every stop is done, what is left is the way to
 * the end of the walk. A time not known says why, and an unclear order names
 * the stops that make it so.
 */
export function walkRemainingText(remainder: WalkRemainder, t: Translate): WalkRemainingText {
  const { reference, walking } = remainder;
  if (walking.remaining_minutes === null || reference.kind === 'ambiguous') return unknownText(remainder, t);
  const time = formatPlannedTourDuration(walking.remaining_minutes);
  if (remainder.finished && walking.remaining_minutes === 0) {
    return { value: t('tours.walk.remaining.pill', { time }), label: t('tours.walk.remaining.done'), known: true };
  }
  const after = walking.after_last_station_minutes ?? 0;
  const parts = [
    remainder.finished
      ? t('tours.walk.remaining.wayBack')
      : reference.kind === 'start'
        ? t('tours.walk.remaining.fromStart')
        : t('tours.walk.remaining.fromStation', { name: stationName(reference.station, t) }),
    walking.upper_bound ? t('tours.walk.remaining.upperBound') : null,
    after > 0 && after < walking.remaining_minutes
      ? t('tours.walk.remaining.afterLast', { time: formatPlannedTourDuration(after) })
      : null,
    ...staysText(remainder, t),
  ].filter((part): part is string => part !== null);
  return {
    value: t(walking.upper_bound ? 'tours.walk.remaining.pillUpTo' : 'tours.walk.remaining.pill', { time }),
    label: parts.join(' '),
    known: true,
  };
}
