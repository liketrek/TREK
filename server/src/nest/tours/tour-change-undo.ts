/**
 * MCP-T04: what taking back a saved step (MCP-T03) does and whether it may,
 * worked out without writing anything. A step is taken back only while it is
 * the tour's latest change: once anything else was saved on top of it, the
 * tour it kept as before is no longer the one under the current plan, and
 * restoring it would throw the later edits away unseen. Taking back restores
 * the tour exactly as the step kept it, so it never removes a station that
 * was visited or skipped since and never drops the link to a place of the
 * trip: such a step is refused with every reason, and the tour stays as it is.
 */
import type { TourChangeStepBefore } from '../../db/json-columns';
import type { StationDone } from './tour-change-apply';
import { walkStationsOf, type TourWaypoint } from '@trek/shared';

/** Where a step stands: still the tour's latest change, or why it cannot be taken back any more. */
export type StepStanding = 'latest' | 'undone' | 'later_change' | 'no_earlier_state';

/** The standing of a step, the latest one carrying the tour as it kept it before. */
export type Standing = { kind: 'latest'; before: TourChangeStepBefore } | { kind: Exclude<StepStanding, 'latest'> };

/** What a recorded step says of itself for its standing. */
interface StepFacts {
  revision: number;
  undone_revision: number | null;
}

/**
 * The standing of a step on a tour at `tourRevision`. A step taken back says
 * so first, since taking it back moved the tour on too; a broken record of the
 * tour before reads as no earlier state, so nothing is restored from a guess.
 */
export function standingOf(
  step: StepFacts,
  before: TourChangeStepBefore | null,
  tourRevision: number | null,
): Standing {
  if (step.undone_revision !== null) return { kind: 'undone' };
  if (step.revision !== tourRevision) return { kind: 'later_change' };
  if (before === null) return { kind: 'no_earlier_state' };
  return { kind: 'latest', before };
}

/** Why the stations of a step refuse taking it back. */
export type UndoRefusal =
  | { why: 'station_done'; key: string; name: string | null; days: StationDone[] }
  | { why: 'place_gone'; key: string | null; name: string | null; linked_place_id: number };

/** The tour now and as the step kept it, with what the travellers did since and the places still there. */
export interface UndoBasis {
  now: readonly TourWaypoint[];
  before: TourChangeStepBefore;
  done: ReadonlyMap<string, StationDone[]>;
  linkable: ReadonlySet<number>;
}

const keysOf = (points: readonly TourWaypoint[]) => new Set(points.flatMap((point) => (point.key ? [point.key] : [])));

/** The stations of the tour now that taking the step back removes, with the stations they are. */
function goingOf(now: readonly TourWaypoint[], before: readonly TourWaypoint[]) {
  const kept = keysOf(before);
  return walkStationsOf(now)
    .map((station, index) => ({ station, position: index + 1 }))
    .filter(({ station }) => !station.key || !kept.has(station.key));
}

/**
 * Every reason taking the step back would lose something: a station it
 * removes that was visited or skipped on a day since, and a station it
 * brings back that stands for a place of the trip no longer there.
 */
export function undoRefusals({ now, before, done, linkable }: UndoBasis): UndoRefusal[] {
  const stationsDone = goingOf(now, before.waypoints).flatMap(({ station }) => {
    const days = station.key ? done.get(station.key) : undefined;
    return station.key && days
      ? [{ why: 'station_done' as const, key: station.key, name: station.name ?? null, days }]
      : [];
  });
  const placesGone = before.waypoints.flatMap((point) =>
    point.linked_place_id && !linkable.has(point.linked_place_id)
      ? [
          {
            why: 'place_gone' as const,
            key: point.key ?? null,
            name: point.name ?? null,
            linked_place_id: point.linked_place_id,
          },
        ]
      : [],
  );
  return [...stationsDone, ...placesGone];
}

/** The refusal as the error text gives it, one reason a line. */
export function undoRefusalText(refusals: readonly UndoRefusal[]): string {
  const lines = refusals.map((refusal) =>
    refusal.why === 'station_done'
      ? `Station ${refusal.key} (${refusal.name ?? 'no name'}) would be removed, but it was visited or skipped since.`
      : `Station ${refusal.key ?? 'without key'} (${refusal.name ?? 'no name'}) stands for place ${refusal.linked_place_id}, which is no longer a place of the trip.`,
  );
  return ['Taking this step back would lose what was done since. Nothing changed.', ...lines].join('\n');
}

/** The stations of the tour now, each with whether it was visited or skipped on any day. */
function stationsNow(now: readonly TourWaypoint[], done: ReadonlyMap<string, StationDone[]>) {
  return walkStationsOf(now).map((station, index) => ({
    position: index + 1,
    key: station.key ?? null,
    name: station.name ?? null,
    done: station.key ? done.has(station.key) : false,
  }));
}

/** The stations as taking back restores them, each kept from now (and where it stands now) or coming back. */
function stationsRestored(now: readonly TourWaypoint[], before: readonly TourWaypoint[]) {
  const nowAt = new Map(
    walkStationsOf(now).flatMap((station, index) => (station.key ? [[station.key, index + 1] as const] : [])),
  );
  return walkStationsOf(before).map((station, index) => {
    const nowPosition = station.key ? (nowAt.get(station.key) ?? null) : null;
    return {
      position: index + 1,
      key: station.key ?? null,
      name: station.name ?? null,
      change: nowPosition === null ? ('back' as const) : ('kept' as const),
      now_position: nowPosition,
    };
  });
}

/** The measures of the tour now, as stored with it. */
export interface MeasuresNow {
  distance_km: number | null;
  walking_minutes: number | null;
  route_pending: boolean;
}

/**
 * The tour now set against the tour as taking the step back restores it: the
 * stations of each, the ones it removes and the ones it brings back, and the
 * measures stored with each, never worked out anew.
 */
export function describeUndo(basis: UndoBasis, measures: MeasuresNow) {
  const { now, before, done } = basis;
  return {
    now: { ...measures, stations: stationsNow(now, done) },
    restored: {
      distance_km: before.distance,
      walking_minutes: before.duration,
      route_pending: before.route_geometry === null,
      stations: stationsRestored(now, before.waypoints),
    },
    removed: goingOf(now, before.waypoints).map(({ station, position }) => ({
      key: station.key ?? null,
      name: station.name ?? null,
      position,
    })),
  };
}
