/**
 * MCP-T02: what a prepared change does to a city walk, set against the saved
 * walk. The way on foot before and after is planned by the same router, so
 * the two are compared on one source; the distance and walking time stored
 * with the walk come from the planner and are given apart, never mixed in.
 * Stays are counted where they are known and an unknown one stays unknown.
 * Whatever cannot be worked out is named in `data_gaps` instead of guessed.
 */
import type { FootWay } from './city-walk-briefing.helpers';
import { savedPoint, type DraftPoint } from './tour-change-apply';
import { walkStationsOf, type TourWaypoint } from '@trek/shared';

/** Everything the description of a prepared change reads. */
interface ChangeEffectsInput {
  saved: readonly TourWaypoint[];
  after: readonly DraftPoint[];
  removed: readonly DraftPoint[];
  replaced: readonly DraftPoint[];
  /** The shaping points dropped with a leg a change took apart. */
  shapingDropped: readonly DraftPoint[];
  wayBefore: FootWay;
  wayAfter: FootWay;
  /** As stored with the walk when it was last saved: kilometres and minutes, null when not known. */
  stored: { distance_km: number | null; walking_minutes: number | null };
}

type StationChange = 'kept' | 'added' | 'replaced' | 'moved' | 'edited';

const CHANGE_OF: Record<DraftPoint['origin'], StationChange> = {
  saved: 'kept',
  added: 'added',
  replacing: 'replaced',
  moved: 'moved',
  edited: 'edited',
  // The way back a close_loop adds is no station, so no station row ever names it.
  loop: 'added',
};

/** The key a point is saved under; null for a station a change brings in, which gets one when saved. */
function keyOf(point: DraftPoint): string | null {
  return point.key ?? null;
}

/** The names of the saved points by ref, for the station a replacing one stands in for. */
type Names = ReadonlyMap<string, string | null>;

/** One station of the changed walk, with where it stood before and what changed it. */
function stationAfter(point: DraftPoint, index: number, wasAt: ReadonlyMap<string, number>, names: Names) {
  return {
    position: index + 1,
    key: keyOf(point),
    name: point.name ?? null,
    change: CHANGE_OF[point.origin],
    by_change: point.change,
    was_position: wasAt.get(point.ref) ?? null,
    replaces: point.replaces ? { key: point.replaces, name: names.get(point.replaces) ?? null } : null,
    stay_minutes: point.stay_minutes ?? null,
    importance: point.importance ?? null,
    protected: point.protected === true,
    opening_hours: point.opening_hours ?? null,
    linked_place_id: point.linked_place_id ?? null,
  };
}

/** The way on foot through all points, its whole length and walking time, or why there is none. */
function wayTotal(way: FootWay) {
  if (way.kind === 'unrouted') return { planned: false as const, why: way.why, position: way.position };
  return {
    planned: true as const,
    metres: way.legs.reduce((sum, leg) => sum + leg.metres, 0),
    minutes: Math.round(way.seconds / 60),
  };
}

function walkingOf(input: ChangeEffectsInput) {
  const before = wayTotal(input.wayBefore);
  const after = wayTotal(input.wayAfter);
  return {
    planned_by: 'router_on_foot' as const,
    before,
    after,
    change:
      before.planned && after.planned
        ? { metres: after.metres - before.metres, minutes: after.minutes - before.minutes }
        : null,
    stored: input.stored,
  };
}

/** The stays of the stations as far as entered, and how many are not known. */
function staysOf(stations: readonly DraftPoint[]) {
  return {
    minutes_known: stations.reduce((sum, station) => sum + (station.stay_minutes ?? 0), 0),
    unknown: stations.filter((station) => station.stay_minutes == null).length,
  };
}

function staysChange(before: readonly DraftPoint[], after: readonly DraftPoint[]) {
  const was = staysOf(before);
  const now = staysOf(after);
  return {
    before: was,
    after: now,
    change_minutes_known: now.minutes_known - was.minutes_known,
    complete: was.unknown === 0 && now.unknown === 0,
  };
}

/** Every leg of the changed walk from one point to the next, the way on foot gives it, and whether it is new. */
function legsOf(saved: readonly DraftPoint[], after: readonly DraftPoint[], way: FootWay) {
  const kept = new Set(saved.slice(1).map((to, index) => `${saved[index]?.ref}>${to.ref}`));
  return after.slice(1).map((to, index) => {
    const from = after[index] as DraftPoint;
    const leg = way.kind === 'routed' ? way.legs[index] : undefined;
    return {
      from: { key: keyOf(from), name: from.name ?? null },
      to: { key: keyOf(to), name: to.name ?? null },
      metres: leg?.metres ?? null,
      minutes: leg?.minutes ?? null,
      new: !kept.has(`${from.ref}>${to.ref}`),
    };
  });
}

/** What could not be worked out, each with why, so nothing missing reads as nothing. */
function gapsOf(input: ChangeEffectsInput, stationsAfter: readonly DraftPoint[]) {
  const unrouted = (side: 'before' | 'after', way: FootWay) =>
    way.kind === 'unrouted' ? [{ about: 'walking' as const, side, why: way.why, position: way.position }] : [];
  const unknownStays = stationsAfter.filter((station) => station.stay_minutes == null);
  return [
    ...unrouted('before', input.wayBefore),
    ...unrouted('after', input.wayAfter),
    ...(input.saved.some((point) => point.fixed_leg)
      ? [{ about: 'walking' as const, why: 'hand_drawn_leg_routed' as const }]
      : []),
    ...(input.shapingDropped.length > 0
      ? [
          {
            about: 'walking' as const,
            why: 'shaping_dropped' as const,
            shaping_points: input.shapingDropped.map((point) => ({ key: keyOf(point), by_change: point.change })),
          },
        ]
      : []),
    ...(unknownStays.length > 0
      ? [
          {
            about: 'stays' as const,
            why: 'stay_not_known' as const,
            stations: unknownStays.map((station) => ({ key: keyOf(station), name: station.name ?? null })),
          },
        ]
      : []),
    { about: 'arrival_times' as const, why: 'no_start_time' as const },
  ];
}

/** A station of importance must that the change removes or replaces, for the traveller to confirm on purpose. */
function warningsOf(gone: readonly DraftPoint[]) {
  return gone
    .filter((point) => point.importance === 'must')
    .map((point) => ({ change: point.change, key: point.key ?? null, name: point.name ?? null, why: 'must_station' }));
}

/** The points as a save takes them: a kept point with its key, a new one without, the server gives it one. */
export function asWaypoint(draft: DraftPoint): TourWaypoint {
  const { ref: _ref, origin: _origin, change: _change, after: _after, replaces: _replaces, ...point } = draft;
  return point;
}

/**
 * A new station as create_place takes it, to keep it as a place of the trip
 * instead of putting it in the walk. A station linked to a place of the trip
 * already is one, so it is left out rather than offered as a second copy.
 */
function forLater(after: readonly DraftPoint[]) {
  return after
    .filter((point) => (point.origin === 'added' || point.origin === 'replacing') && point.linked_place_id == null)
    .map((point) => ({ change: point.change, name: point.name ?? null, lat: point.lat, lng: point.lng }));
}

/** The changed walk set against the saved one: its stations, what went, the effects and the gaps. */
export function describeChange(input: ChangeEffectsInput) {
  const saved = input.saved.map(savedPoint);
  const stationsBefore = walkStationsOf(saved);
  const stationsAfter = walkStationsOf(input.after);
  const wasAt = new Map(stationsBefore.map((station, index) => [station.ref, index + 1]));
  const names: Names = new Map(saved.map((point) => [point.ref, point.name ?? null]));
  return {
    stations_after: stationsAfter.map((station, index) => stationAfter(station, index, wasAt, names)),
    removed: input.removed.map((point) => ({
      key: point.key ?? null,
      name: point.name ?? null,
      was_position: wasAt.get(point.ref) ?? null,
      by_change: point.change,
    })),
    effects: {
      walking: walkingOf(input),
      stays: staysChange(stationsBefore, stationsAfter),
      legs: legsOf(saved, input.after, input.wayAfter),
    },
    data_gaps: gapsOf(input, stationsAfter),
    warnings: warningsOf([...input.removed, ...input.replaced]),
    for_later: forLater(input.after),
    waypoints_after: input.after.map(asWaypoint),
  };
}
