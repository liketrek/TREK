import { walkRemainderSchema } from './tour-walk.schema';
import { walkRemainderOf, type WalkRemainderStop } from './walk-remaining';

import { describe, expect, it } from 'vitest';

// Five stations, one every 0.001 degrees north: the line is four equal stretches.
const line: Array<[number, number]> = [
  [48, 11],
  [48.001, 11],
  [48.002, 11],
  [48.003, 11],
  [48.004, 11],
];
const NAMES = ['Station', 'Cathedral', 'Market', 'Museum', 'Park'];

function walk(
  statuses: Array<WalkRemainderStop['status']>,
  extra: Partial<WalkRemainderStop>[] = [],
): WalkRemainderStop[] {
  return statuses.map((status, index) => ({
    lat: 48 + index * 0.001,
    lng: 11,
    key: `stop-${index + 1}`,
    name: NAMES[index] ?? null,
    status,
    stayMinutes: 20,
    importance: null,
    ...extra[index],
  }));
}

const remainder = (stations: WalkRemainderStop[], minutes: number | null = 80) =>
  walkRemainderSchema.parse(walkRemainderOf({ stations, line, walkingMinutes: minutes }));

describe('walkRemainderOf (CW-13)', () => {
  it('reads the whole walking time from the start before anything is visited', () => {
    const result = remainder(walk(['planned', 'planned', 'planned', 'planned', 'planned']));
    expect(result.reference).toEqual({ kind: 'start' });
    expect(result.live_position).toBe(false);
    expect(result.walking).toEqual({
      total_minutes: 80,
      remaining_minutes: 80,
      unknown_because: null,
      upper_bound: false,
      skipped_ahead: [],
      after_last_station_minutes: 0,
    });
    expect(result.stays).toEqual({ remaining_known_minutes: 100, unknown: [], optional_known_minutes: 0 });
    expect(result.open_stations.map((station) => station.walk_minutes_from_reference)).toEqual([0, 20, 40, 60, 80]);
  });

  it('counts from the last station visited, never the stretches already walked or their stays', () => {
    const result = remainder(walk(['visited', 'visited', 'planned', 'planned', 'planned']));
    expect(result.reference).toEqual({
      kind: 'last_visited',
      station: { position: 2, key: 'stop-2', name: 'Cathedral' },
    });
    expect(result.walking.remaining_minutes).toBe(60);
    expect(result.walking.total_minutes).toBe(80);
    expect(result.stays.remaining_known_minutes).toBe(60);
    expect(result.open_stations.map((station) => [station.position, station.walk_minutes_from_reference])).toEqual([
      [3, 20],
      [4, 40],
      [5, 60],
    ]);
    expect(result.finished).toBe(false);
  });

  it('is an upper bound while a station ahead is skipped, and leaves its stay out', () => {
    const result = remainder(walk(['visited', 'planned', 'skipped', 'planned', 'planned']));
    expect(result.walking.remaining_minutes).toBe(80);
    expect(result.walking.upper_bound).toBe(true);
    expect(result.walking.skipped_ahead).toEqual([{ position: 3, key: 'stop-3', name: 'Market' }]);
    expect(result.open_stations.map((station) => station.position)).toEqual([2, 4, 5]);
    expect(result.stays.remaining_known_minutes).toBe(60);
  });

  it('moves nothing for a skip behind the last visit', () => {
    const result = remainder(walk(['skipped', 'visited', 'planned', 'planned', 'planned']));
    expect(result.reference).toMatchObject({ kind: 'last_visited', station: { position: 2 } });
    expect(result.walking).toMatchObject({ remaining_minutes: 60, upper_bound: false });
  });

  it('leaves the time unknown when a station is still planned before the last one visited', () => {
    const result = remainder(walk(['visited', 'planned', 'visited', 'planned', 'planned']));
    expect(result.reference).toEqual({
      kind: 'ambiguous',
      last_visited: { position: 3, key: 'stop-3', name: 'Market' },
      open_before: [{ position: 2, key: 'stop-2', name: 'Cathedral' }],
    });
    expect(result.walking).toMatchObject({
      remaining_minutes: null,
      unknown_because: 'progress_ambiguous',
      after_last_station_minutes: null,
    });
    expect(result.open_stations.map((station) => [station.position, station.walk_minutes_from_reference])).toEqual([
      [2, null],
      [4, null],
      [5, null],
    ]);
    // The stays are still what they are.
    expect(result.stays.remaining_known_minutes).toBe(60);
  });

  it('takes a station without a key behind the last visit as passed, not as a gap', () => {
    const result = remainder(walk(['visited', 'planned', 'visited', 'planned', 'planned'], [{}, { key: null }]));
    expect(result.reference).toMatchObject({ kind: 'last_visited', station: { position: 3 } });
    expect(result.walking.remaining_minutes).toBe(40);
    expect(result.open_stations.map((station) => station.position)).toEqual([4, 5]);
  });

  it("keeps a loop's way back after its last station, also once every station is done", () => {
    const loop: Array<[number, number]> = [...line, [48.002, 11.001], [48, 11]];
    const stations = walk(['visited', 'visited', 'visited', 'visited', 'visited']);
    const result = walkRemainderOf({ stations, line: loop, walkingMinutes: 120 });
    expect(result.finished).toBe(true);
    expect(result.walking.after_last_station_minutes).toBeGreaterThan(0);
    expect(result.walking.remaining_minutes).toBe(result.walking.after_last_station_minutes);
    expect(result.stays).toEqual({ remaining_known_minutes: 0, unknown: [], optional_known_minutes: 0 });
  });

  it('is nothing left once a walk that ends at its last station is done', () => {
    const result = remainder(walk(['visited', 'visited', 'skipped', 'visited', 'visited']));
    expect(result.finished).toBe(true);
    expect(result.walking).toMatchObject({ remaining_minutes: 0, upper_bound: false });
  });

  it('lists stays nobody entered instead of counting them as nothing, and sums the optional ones', () => {
    const result = remainder(
      walk(
        ['visited', 'planned', 'planned', 'planned', 'planned'],
        [{}, { stayMinutes: null }, { importance: 'optional', stayMinutes: 15 }, { stayMinutes: 0 }],
      ),
    );
    expect(result.stays).toEqual({
      remaining_known_minutes: 35,
      unknown: [{ position: 2, key: 'stop-2', name: 'Cathedral' }],
      optional_known_minutes: 15,
    });
    expect(result.open_stations[1]).toMatchObject({ importance: 'optional', stay_minutes: 15 });
  });

  it('says why the time is not known: no stations, no line yet, no walking time', () => {
    expect(walkRemainderOf({ stations: [], line, walkingMinutes: 80 }).walking.unknown_because).toBe('no_stations');
    const stations = walk(['visited', 'planned']);
    const pending = walkRemainderOf({ stations, line: null, walkingMinutes: null });
    expect(pending.walking).toMatchObject({ remaining_minutes: null, unknown_because: 'route_pending' });
    expect(walkRemainderOf({ stations, line: [[48, 11]], walkingMinutes: 80 }).walking.unknown_because).toBe(
      'route_pending',
    );
    const noTime = remainder(stations, null);
    expect(noTime.walking).toMatchObject({
      total_minutes: null,
      remaining_minutes: null,
      unknown_because: 'no_walking_time',
    });
    expect(noTime.open_stations[0]?.walk_minutes_from_reference).toBeNull();
    expect(noTime.stays.remaining_known_minutes).toBe(20);
  });

  it('shares no walking time out along a crossing by boat (CW-12)', () => {
    // The stretch from the Cathedral to the Market is crossed by boat: the walk is the other three stretches.
    const stations = walk(['visited', 'planned', 'planned', 'planned', 'planned']);
    const crossings = [[line[1], line[2]] as Array<[number, number]>];
    const result = walkRemainderSchema.parse(walkRemainderOf({ stations, line, walkingMinutes: 60, crossings }));
    expect(result.open_stations.map((station) => station.walk_minutes_from_reference)).toEqual([20, 20, 40, 60]);
    // Without the crossing every stretch counts alike.
    expect(remainder(stations, 60).open_stations.map((station) => station.walk_minutes_from_reference)).toEqual([
      15, 30, 45, 60,
    ]);
  });
});
