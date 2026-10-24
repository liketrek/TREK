/**
 * STA-02, the pure half of the user's activity sums: whose tours count, on
 * which day, on what basis, and what is never added up twice.
 */
import type { TourStatsExecutionRow, TourStatsTrackRow } from '../../../src/db/repositories/TourActivities.repository';
import { buildActivityStats, isOwnExecution } from '../../../src/nest/tours/tour-activity-stats.helpers';

import { describe, expect, it } from 'vitest';

function row(overrides: Partial<TourStatsExecutionRow> = {}): TourStatsExecutionRow {
  return {
    place_id: 10,
    name: 'Ridge',
    tour_type: 'hike',
    distance: 12.5,
    elevation_gain: 800,
    elevation_loss: 790,
    derived_from_place_id: null,
    trip_id: 5,
    trip_title: 'Alps',
    assignment_id: 100,
    date: '2026-07-02',
    tour_stage_key: null,
    participant_count: 0,
    joined: 0,
    ...overrides,
  };
}

const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
  [47.02, 11, 650],
]);

function track(overrides: Partial<TourStatsTrackRow> = {}): TourStatsTrackRow {
  return {
    place_id: 10,
    track_place_id: 20,
    assignment_id: 100,
    track_name: 'Watch export',
    track_route_geometry: LINE,
    track_recorded_route_geometry: null,
    ...overrides,
  };
}

function stats(executions: TourStatsExecutionRow[], tracks: TourStatsTrackRow[] = [], excluded: number[] = []) {
  return buildActivityStats({ executions, tracks, excluded: new Set(excluded) });
}

describe('isOwnExecution (STA-02)', () => {
  it('STA2-HELP-001: a day naming the user or nobody is theirs, one naming only others is not', () => {
    expect(isOwnExecution(row({ joined: 1, participant_count: 2 }))).toBe(true);
    expect(isOwnExecution(row({ participant_count: 0 }))).toBe(true);
    expect(isOwnExecution(row({ participant_count: 1, joined: 0 }))).toBe(false);
  });
});

describe('buildActivityStats (STA-02)', () => {
  it('STA2-HELP-002: a planned tour on a dated day of the own trip counts with its plan', () => {
    expect(stats([row()])).toEqual({
      entries: [
        {
          place_id: 10,
          name: 'Ridge',
          tour_type: 'hike',
          trip: { id: 5, title: 'Alps' },
          derived_from_place_id: null,
          date: '2026-07-02',
          basis: 'plan',
          track: null,
          day_count: 1,
          distance_km: 12.5,
          ascent_m: 800,
          descent_m: 790,
          excluded: false,
        },
      ],
      uncounted: { unassigned: 0, undated: 0 },
    });
  });

  it('STA2-HELP-003: a tour on several days counts once, on its last day, saying on how many', () => {
    const { entries } = stats([
      row({ assignment_id: 101, date: '2026-07-04' }),
      row({ assignment_id: 100, date: '2026-07-02' }),
      row({ assignment_id: 102, date: null }),
    ]);
    expect(entries).toHaveLength(1);
    // Dated on the last day, so it is not done while it is still under way.
    expect(entries[0]).toMatchObject({ date: '2026-07-04', day_count: 2 });
  });

  it('STA2-HELP-004: a linked recording replaces the plan and is no tour of its own', () => {
    const { entries } = stats(
      [row(), row({ place_id: 20, name: 'Watch export', assignment_id: null, date: null })],
      [track()],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      place_id: 10,
      basis: 'track',
      track: { place_id: 20, name: 'Watch export' },
      date: '2026-07-02',
      day_count: 1,
      ascent_m: 100,
      descent_m: 50,
    });
    expect(entries[0]?.distance_km).toBeCloseTo(2.22, 1);
  });

  it('STA2-HELP-005: a recording on no day counts on the last day; one recorded per day counts per day', () => {
    const executions = [row({ assignment_id: 100 }), row({ assignment_id: 101, date: '2026-07-03' })];
    const noDay = stats(executions, [track({ assignment_id: null })]);
    expect(noDay.entries.map((entry) => entry.date)).toEqual(['2026-07-03']);
    const twice = stats(executions, [track(), track({ track_place_id: 21, assignment_id: 101 })]);
    expect(twice.entries.map((entry) => [entry.date, entry.track?.place_id])).toEqual([
      ['2026-07-03', 21],
      ['2026-07-02', 20],
    ]);
  });

  it('STA2-HELP-006: a recording is measured on the line it kept when it was planned over since', () => {
    const kept = JSON.stringify([
      [47, 11],
      [47.1, 11],
    ]);
    const { entries } = stats([row()], [track({ track_recorded_route_geometry: kept })]);
    expect(entries[0]?.distance_km).toBeCloseTo(11.1, 0);
    expect(entries[0]).toMatchObject({ ascent_m: null, descent_m: null });
  });

  it('STA2-HELP-007: a recording without a line knows no distance', () => {
    const { entries } = stats([row()], [track({ track_route_geometry: null })]);
    expect(entries[0]).toMatchObject({ basis: 'track', distance_km: null, ascent_m: null });
  });

  it('STA2-HELP-008: the recording of somebody else’s day is theirs, so the plan stands for the user', () => {
    const executions = [
      row({ assignment_id: 100, participant_count: 0 }),
      row({ assignment_id: 101, date: '2026-07-03', participant_count: 1, joined: 0 }),
    ];
    const { entries } = stats(executions, [track({ assignment_id: 101 })]);
    expect(entries).toEqual([expect.objectContaining({ basis: 'plan', date: '2026-07-02' })]);
  });

  it('STA2-HELP-009: a day naming nobody counts for every member, on any trip the user can open', () => {
    const shared = { trip_id: 6, trip_title: 'Theirs' };
    expect(stats([row(shared)]).entries).toEqual([expect.objectContaining({ trip: { id: 6, title: 'Theirs' } })]);
    expect(stats([row({ ...shared, participant_count: 2, joined: 1 })]).entries).toHaveLength(1);
    const onNoDay = row({ ...shared, place_id: 11, assignment_id: null, date: null });
    expect(stats([onNoDay]).uncounted).toEqual({ unassigned: 1, undated: 0 });
  });

  it('STA2-HELP-010: a day naming only others leaves the user out, and says nothing about it', () => {
    expect(stats([row({ participant_count: 1, joined: 0 })])).toEqual({
      entries: [],
      uncounted: { unassigned: 0, undated: 0 },
    });
  });

  it('STA2-HELP-011: own tours on no day or only on undated days are named as not counting', () => {
    const result = stats([
      row({ place_id: 11, assignment_id: null, date: null }),
      row({ place_id: 12, assignment_id: 103, date: null }),
      row({ place_id: 13, assignment_id: 104, date: 'not a date' }),
    ]);
    expect(result).toEqual({ entries: [], uncounted: { unassigned: 1, undated: 2 } });
  });

  it('STA2-HELP-012: a whole route and the stages planned from it are all listed, each stage naming the route', () => {
    const route = row({ place_id: 30, name: 'Whole route', distance: 60, assignment_id: 300, date: '2026-07-01' });
    const stage1 = row({ place_id: 31, name: 'Stage 1', distance: 20, derived_from_place_id: 30, assignment_id: 301 });
    const stage2 = row({
      place_id: 32,
      name: 'Stage 2',
      distance: 40,
      derived_from_place_id: 30,
      assignment_id: 302,
      date: '2026-07-03',
    });
    // Every entry is kept, each stage naming its route: whether a stage counts takes the reader's today.
    const all = stats([route, stage1, stage2]).entries;
    expect(all.map((entry) => [entry.place_id, entry.derived_from_place_id])).toEqual([
      [32, 30],
      [31, 30],
      [30, null],
    ]);
    // A route on no day whose stages are planned is not named as uncounted: its stages stand for it.
    const routeOnNoDay = row({ ...route, assignment_id: null, date: null });
    expect(stats([routeOnNoDay, stage1, stage2]).uncounted).toEqual({ unassigned: 0, undated: 0 });
    // With no stage on a day, the route is what was done.
    const unplanned = row({ ...stage1, assignment_id: null, date: null });
    expect(stats([route, unplanned])).toMatchObject({
      entries: [expect.objectContaining({ place_id: 30 })],
      uncounted: { unassigned: 1, undated: 0 },
    });
  });

  it('STA2-HELP-013: a paddle tour carries no heights, planned or recorded', () => {
    const paddle = row({ tour_type: 'kayak', elevation_gain: 12, elevation_loss: 12 });
    expect(stats([paddle]).entries[0]).toMatchObject({ ascent_m: null, descent_m: null, distance_km: 12.5 });
    expect(stats([paddle], [track()]).entries[0]).toMatchObject({ ascent_m: null, descent_m: null });
  });

  it('STA2-HELP-014: an unknown or broken measure stays unknown, never zero or negative', () => {
    const { entries } = stats([row({ distance: null, elevation_gain: -5, elevation_loss: Number.NaN })]);
    expect(entries[0]).toMatchObject({ distance_km: null, ascent_m: null, descent_m: null });
  });

  it('STA2-HELP-015: an excluded tour stays listed, flagged, with every entry of it', () => {
    const { entries } = stats([row()], [track()], [10]);
    expect(entries).toEqual([expect.objectContaining({ place_id: 10, excluded: true, basis: 'track' })]);
  });

  it('STA2-HELP-016: the newest first, then by name; a timestamp on a day reads as its calendar day', () => {
    const { entries } = stats([
      row({ place_id: 1, name: 'Zugspitze', assignment_id: 1, date: '2026-07-02 00:00:00' }),
      row({ place_id: 2, name: 'Alpspitze', assignment_id: 2, date: '2026-07-02' }),
      row({ place_id: 3, name: 'Hochkalter', assignment_id: 3, date: '2026-08-01' }),
    ]);
    expect(entries.map((entry) => [entry.name, entry.date])).toEqual([
      ['Hochkalter', '2026-08-01'],
      ['Alpspitze', '2026-07-02'],
      ['Zugspitze', '2026-07-02'],
    ]);
  });

  describe('a multi-day tour with its stages on days of their own (MDT-02)', () => {
    const keys = new Map([[10, ['start', 'hut-1', 'hut-2']]]);
    const staged = (executions: TourStatsExecutionRow[], tracks: TourStatsTrackRow[] = []) =>
      buildActivityStats({ executions, tracks, excluded: new Set(), stageKeys: keys });
    const stage = (assignment_id: number, tour_stage_key: string, date: string | null) =>
      row({ assignment_id, tour_stage_key, date });

    it('STA2-HELP-017: counts the whole route once, on the last stage day, only once every stage is on a dated day', () => {
      const all = staged([
        stage(100, 'start', '2026-07-02'),
        stage(101, 'hut-1', '2026-07-03'),
        stage(102, 'hut-2', '2026-07-04'),
      ]);
      expect(all.entries).toHaveLength(1);
      expect(all.entries[0]).toMatchObject({ basis: 'plan', date: '2026-07-04', distance_km: 12.5, day_count: 3 });

      // One stage on no day: the route is not counted on the days of the other two.
      const partly = staged([stage(100, 'start', '2026-07-02'), stage(101, 'hut-1', '2026-07-03')]);
      expect(partly.entries).toEqual([]);
      expect(partly.uncounted).toEqual({ unassigned: 1, undated: 0 });

      const undated = staged([
        stage(100, 'start', '2026-07-02'),
        stage(101, 'hut-1', '2026-07-03'),
        stage(102, 'hut-2', null),
      ]);
      expect(undated.entries).toEqual([]);
      expect(undated.uncounted).toEqual({ unassigned: 0, undated: 1 });

      // A day that holds the whole tour covers every stage.
      const whole = staged([stage(100, 'start', '2026-07-02'), row({ assignment_id: 103, date: '2026-07-05' })]);
      expect(whole.entries).toMatchObject([{ basis: 'plan', date: '2026-07-05' }]);
    });

    it('STA2-HELP-018: a recording on one stage counts as what was done, never beside the whole route', () => {
      const result = staged(
        [stage(100, 'start', '2026-07-02'), stage(101, 'hut-1', '2026-07-03'), stage(102, 'hut-2', '2026-07-04')],
        [track({ assignment_id: 101 })],
      );
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toMatchObject({ basis: 'track', date: '2026-07-03', day_count: 1 });
      expect(result.entries.some((entry) => entry.basis === 'plan')).toBe(false);
    });

    it('STA2-HELP-019: a tour without stage keys, or with none of its days on a stage, is counted whole as before', () => {
      const plain = buildActivityStats({ executions: [row()], tracks: [], excluded: new Set(), stageKeys: keys });
      expect(plain.entries).toMatchObject([{ basis: 'plan', date: '2026-07-02' }]);
      const executions = [stage(100, 'start', '2026-07-02')];
      const noKeys = buildActivityStats({ executions, tracks: [], excluded: new Set() });
      expect(noKeys.entries).toMatchObject([{ basis: 'plan', date: '2026-07-02' }]);
    });
  });
});
