import type { FootWay } from '../../../src/nest/tours/city-walk-briefing.helpers';
import { applyChanges } from '../../../src/nest/tours/tour-change-apply';
import { describeChange } from '../../../src/nest/tours/tour-change-effects';
import type { TourChange, TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TCHG-EFFECTS-001 to TCHG-EFFECTS-004

const point = (key: string, sequence: number, extra: Partial<TourWaypoint> = {}): TourWaypoint => ({
  lat: 48 + sequence * 0.01,
  lng: 11,
  role: 'via',
  sequence,
  key,
  name: key.replace('stop-', ''),
  ...extra,
});

/** A walk from the gate past the museum (45 minutes, a must) and the park (stay unknown) to the end (passed). */
const saved: TourWaypoint[] = [
  point('stop-gate', 0, { role: 'start', stay_minutes: 0 }),
  point('stop-museum', 1, { stay_minutes: 45, importance: 'must' }),
  point('stop-park', 2),
  point('stop-end', 3, { role: 'end', stay_minutes: 0 }),
];

const cafe = { lat: 48.015, lng: 11.001, name: 'Cafe', stay_minutes: 20, opening_hours: 'Mo-Su 08:00-18:00' };

/** The walk with a cafe after the gate and the museum swapped for a gallery of unknown stay. */
function changed(points: TourWaypoint[] = saved) {
  const changes: TourChange[] = [
    { op: 'add', station: cafe, after_key: 'stop-gate' },
    { op: 'replace', key: 'stop-museum', station: { lat: 48.012, lng: 11, name: 'Gallery' } },
    { op: 'remove', key: 'stop-park' },
  ];
  const outcome = applyChanges(
    { tourType: 'walk', recorded: false, points, done: new Map(), linkable: new Set() },
    changes,
  );
  if (outcome.kind !== 'ready') throw new Error('refused');
  return outcome;
}

const routed = (metres: number[], seconds: number): FootWay => ({
  kind: 'routed',
  line: [],
  legs: metres.map((m) => ({ metres: m, minutes: Math.ceil(m / 75) })),
  seconds,
});

describe('what a prepared change does to a walk (MCP-T02)', () => {
  it('TCHG-EFFECTS-001: sets the stations, the way on foot and the stays after against before, from one router', () => {
    const outcome = changed();
    const described = describeChange({
      saved,
      after: outcome.points,
      removed: outcome.removed,
      replaced: outcome.replaced,
      shapingDropped: outcome.shapingDropped,
      wayBefore: routed([800, 900, 700], 1860),
      wayAfter: routed([300, 450, 1500], 1700),
      stored: { distance_km: 2.3, walking_minutes: 32 },
    });

    const after = described.stations_after;
    expect(after.map((s) => [s.position, s.key, s.name, s.change, s.by_change, s.was_position])).toEqual([
      [1, 'stop-gate', 'gate', 'kept', null, 1],
      [2, null, 'Cafe', 'added', 1, null],
      [3, null, 'Gallery', 'replaced', 2, null],
      [4, 'stop-end', 'end', 'kept', null, 4],
    ]);
    expect(after[2]?.replaces).toEqual({ key: 'stop-museum', name: 'museum' });
    expect(after[1]).toMatchObject({ stay_minutes: 20, opening_hours: 'Mo-Su 08:00-18:00' });
    expect(described.removed).toEqual([{ key: 'stop-park', name: 'park', was_position: 3, by_change: 3 }]);
    expect(described.effects.walking).toEqual({
      planned_by: 'router_on_foot',
      before: { planned: true, metres: 2400, minutes: 31 },
      after: { planned: true, metres: 2250, minutes: 28 },
      change: { metres: -150, minutes: -3 },
      stored: { distance_km: 2.3, walking_minutes: 32 },
    });
    expect(described.effects.stays).toEqual({
      before: { minutes_known: 45, unknown: 1 },
      after: { minutes_known: 20, unknown: 1 },
      change_minutes_known: -25,
      complete: false,
    });
    expect(described.effects.legs.map((leg) => [leg.from.name, leg.to.name, leg.metres, leg.new])).toEqual([
      ['gate', 'Cafe', 300, true],
      ['Cafe', 'Gallery', 450, true],
      ['Gallery', 'end', 1500, true],
    ]);
    expect(described.warnings).toEqual([{ change: 2, key: 'stop-museum', name: 'museum', why: 'must_station' }]);
    expect(described.for_later).toEqual([
      { change: 1, name: 'Cafe', lat: 48.015, lng: 11.001 },
      { change: 2, name: 'Gallery', lat: 48.012, lng: 11 },
    ]);
    expect(described.data_gaps).toEqual([
      { about: 'stays', why: 'stay_not_known', stations: [{ key: null, name: 'Gallery' }] },
      { about: 'arrival_times', why: 'no_start_time' },
    ]);
  });

  it('TCHG-EFFECTS-002: hands over the points as a save takes them, a new station without a key', () => {
    const outcome = changed();
    const { waypoints_after } = describeChange({
      saved,
      after: outcome.points,
      removed: outcome.removed,
      replaced: outcome.replaced,
      shapingDropped: outcome.shapingDropped,
      wayBefore: routed([1], 60),
      wayAfter: routed([1], 60),
      stored: { distance_km: null, walking_minutes: null },
    });
    expect(waypoints_after.map((p) => [p.key, p.name, p.role, p.sequence])).toEqual([
      ['stop-gate', 'gate', 'start', 0],
      [undefined, 'Cafe', 'via', 1],
      [undefined, 'Gallery', 'via', 2],
      ['stop-end', 'end', 'end', 3],
    ]);
    for (const waypoint of waypoints_after) {
      expect(['ref', 'origin', 'change', 'after', 'replaces'].some((field) => field in waypoint)).toBe(false);
    }
  });

  it('TCHG-EFFECTS-003: a way the router could not plan stays unknown with why, and a hand-drawn leg is named', () => {
    // A leg drawn by hand from the end, which no change here touches.
    const free = {
      kind: 'free',
      geometry: [
        [48.03, 11],
        [48.04, 11],
      ],
    };
    const withLeg = saved.map((p, i) => (i === 3 ? ({ ...p, fixed_leg: free } as TourWaypoint) : p));
    const outcome = changed(withLeg);
    const described = describeChange({
      saved: withLeg,
      after: outcome.points,
      removed: outcome.removed,
      replaced: outcome.replaced,
      shapingDropped: outcome.shapingDropped,
      wayBefore: { kind: 'unrouted', why: 'router_unavailable', position: null },
      wayAfter: { kind: 'unrouted', why: 'station_off_the_way', position: 2 },
      stored: { distance_km: 2.3, walking_minutes: null },
    });
    expect(described.effects.walking).toMatchObject({
      before: { planned: false, why: 'router_unavailable', position: null },
      after: { planned: false, why: 'station_off_the_way', position: 2 },
      change: null,
    });
    expect(described.effects.legs.every((leg) => leg.metres === null && leg.minutes === null)).toBe(true);
    expect(described.data_gaps.slice(0, 3)).toEqual([
      { about: 'walking', side: 'before', why: 'router_unavailable', position: null },
      { about: 'walking', side: 'after', why: 'station_off_the_way', position: 2 },
      { about: 'walking', why: 'hand_drawn_leg_routed' },
    ]);
  });

  it('TCHG-EFFECTS-004: names the shaping points a change dropped, and keeps a station already a place out of for_later', () => {
    const shaped = [...saved.slice(0, 2), point('shape-0001', 2, { shaping: true, name: null }), ...saved.slice(2)];
    const outcome = applyChanges(
      { tourType: 'walk', recorded: false, points: shaped, done: new Map(), linkable: new Set([7]) },
      [
        { op: 'add', station: { ...cafe, linked_place_id: 7 }, after_key: 'stop-museum' },
        { op: 'add', station: { lat: 48.03, lng: 11, name: 'Kiosk' }, after_key: 'stop-park' },
      ],
    );
    if (outcome.kind !== 'ready') throw new Error('refused');
    const described = describeChange({
      saved: shaped,
      after: outcome.points,
      removed: outcome.removed,
      replaced: outcome.replaced,
      shapingDropped: outcome.shapingDropped,
      wayBefore: routed([1], 60),
      wayAfter: routed([1], 60),
      stored: { distance_km: null, walking_minutes: null },
    });
    expect(described.data_gaps).toContainEqual({
      about: 'walking',
      why: 'shaping_dropped',
      shaping_points: [{ key: 'shape-0001', by_change: 1 }],
    });
    expect(described.waypoints_after.some((p) => p.shaping)).toBe(false);
    expect(described.for_later).toEqual([{ change: 2, name: 'Kiosk', lat: 48.03, lng: 11 }]);
    expect(described.stations_after.find((s) => s.name === 'Cafe')).toMatchObject({
      change: 'added',
      linked_place_id: 7,
    });
  });
});
