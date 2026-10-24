import type { WalkRemainder, WalkStationRef } from './tour-walk.schema';
import type { StationImportance } from './tours.schema';
import { boatSpansOf } from './walk-ferry';
import { stationShares, type WalkStop } from './walk-hours';

/** A station of a walk with its status on one day; planned is a station nobody checked off. */
export interface WalkRemainderStop extends WalkStop {
  key: string | null;
  name: string | null;
  status: 'planned' | 'visited' | 'skipped';
  importance?: StationImportance | 'normal' | null;
}

export interface WalkRemainderInput {
  /** The walk's stations in order: no shaping point, no way back of a loop. */
  stations: readonly WalkRemainderStop[];
  /** The saved line; empty or null while the walk waits for its way. */
  line: ReadonlyArray<readonly [number, number, ...number[]]> | null;
  walkingMinutes: number | null;
  /** CW-12: the boat part of each ferry leg the walk takes; no walking time is shared out along them. */
  crossings?: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
}

function refOf(stations: readonly WalkRemainderStop[], index: number): WalkStationRef {
  const station = stations[index];
  return { position: index + 1, key: station?.key ?? null, name: station?.name ?? null };
}

/**
 * The last station visited, by its index, and the stations still planned
 * before it. A skip is a decision, not a place reached, so it moves nothing;
 * a station without a key cannot be checked off and is never in the way.
 */
function progressOf(stations: readonly WalkRemainderStop[]): { last: number; openBefore: number[] } {
  let last = -1;
  stations.forEach((station, index) => {
    if (station.status === 'visited') last = index;
  });
  const openBefore: number[] = [];
  for (let index = 0; index < last; index += 1) {
    const station = stations[index];
    if (station?.status === 'planned' && station.key) openBefore.push(index);
  }
  return { last, openBefore };
}

function gapOf({ stations, line, walkingMinutes }: WalkRemainderInput, ambiguous: boolean) {
  if (stations.length === 0) return 'no_stations' as const;
  if (!line || line.length < 2) return 'route_pending' as const;
  if (walkingMinutes === null) return 'no_walking_time' as const;
  return ambiguous ? ('progress_ambiguous' as const) : null;
}

/**
 * CW-13: what is left of a city walk on one of its days. The reference is the
 * last station visited, or the start before any is; the walking time left is
 * the walk's time shared out by how far along the saved line each station is
 * passed (as the arrivals of `walk-hours.ts` do), never by how many stations
 * are open. A station skipped ahead keeps the line through it, so the time is
 * an upper bound; a station planned before the last one visited leaves the
 * progress unclear and the time unknown. Stays are counted apart, an unknown
 * one listed rather than taken as nothing. A crossing by boat (CW-12) is no
 * walking and takes no share of the walking time.
 */
export function walkRemainderOf(input: WalkRemainderInput): WalkRemainder {
  const { stations, line, walkingMinutes } = input;
  const { last, openBefore } = progressOf(stations);
  const ambiguous = openBefore.length > 0;
  const gap = gapOf(input, ambiguous);
  const shares = gap === null && line ? stationShares(stations, line, boatSpansOf(line, input.crossings ?? [])) : null;
  const walking = walkingMinutes ?? 0;
  const passed = (index: number) => Math.round(walking * (shares?.[index] ?? 0));
  const fromReference = last < 0 ? 0 : passed(last);

  const ahead = stations.map((_, index) => index).filter((index) => index > last);
  const openIndices = [...openBefore, ...ahead.filter((index) => stations[index]?.status === 'planned')];
  const open = openIndices.map((index): WalkRemainder['open_stations'][number] => {
    const station = stations[index];
    return {
      ...refOf(stations, index),
      importance: station?.importance ?? 'normal',
      stay_minutes: station?.stayMinutes ?? null,
      walk_minutes_from_reference: shares ? passed(index) - fromReference : null,
    };
  });
  const knownStays = open.filter((station) => station.stay_minutes !== null);
  const skippedAhead = ahead.filter((index) => stations[index]?.status === 'skipped');

  return {
    reference: ambiguous
      ? {
          kind: 'ambiguous',
          last_visited: refOf(stations, last),
          open_before: openBefore.map((i) => refOf(stations, i)),
        }
      : last < 0
        ? { kind: 'start' }
        : { kind: 'last_visited', station: refOf(stations, last) },
    live_position: false,
    finished: stations.length > 0 && open.length === 0,
    walking: {
      total_minutes: walkingMinutes,
      remaining_minutes: shares ? walking - fromReference : null,
      unknown_because: gap,
      upper_bound: skippedAhead.length > 0,
      skipped_ahead: skippedAhead.map((index) => refOf(stations, index)),
      after_last_station_minutes: shares ? walking - passed(stations.length - 1) : null,
    },
    stays: {
      remaining_known_minutes: knownStays.reduce((sum, station) => sum + (station.stay_minutes ?? 0), 0),
      unknown: open
        .filter((station) => station.stay_minutes === null)
        .map(({ position, key, name }) => ({ position, key, name })),
      optional_known_minutes: knownStays
        .filter((station) => station.importance === 'optional')
        .reduce((sum, station) => sum + (station.stay_minutes ?? 0), 0),
    },
    open_stations: open,
  };
}
