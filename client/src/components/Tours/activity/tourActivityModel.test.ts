// FE-ACT-MODEL-001 to FE-ACT-MODEL-009
// ACT-01, the pure half of a tour's actual tracks: its executions, the
// recordings that can be linked, the GPX preset, the time and the refusals.
import type { TourActivity, TourListItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { Assignment, AssignmentsMap, Day } from '../../../types';
import { formatDate } from '../../../utils/formatters';
import {
  analysisOfLine,
  executionOf,
  executionsOf,
  importFieldsFor,
  inDayOrder,
  isRecording,
  recordedDay,
  recordedMinutes,
  refusalOf,
  trackCandidates,
} from './tourActivityModel';

const day = (id: number, date: string | null = null) => ({ id, date, title: null }) as unknown as Day;
const days = [day(1, '2026-07-01'), day(2, '2026-07-02'), day(3, '2026-07-03')];
const assignments: AssignmentsMap = {
  '1': [{ id: 11, place_id: 7 } as Assignment, { id: 12, place_id: 8 } as Assignment],
  '3': [{ id: 31, place_id: 7 } as Assignment],
};

function tour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 7,
    name: 'Ridge',
    tour_type: 'hike',
    distance: 8,
    elevation_gain: 600,
    elevation_loss: 600,
    duration: 180,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: 2,
    planned: true,
    caution: false,
    has_waypoints: true,
    origin: 'trek',
    ...overrides,
  };
}

const activity = (id: number, assignmentId: number | null) =>
  ({ id, assignment_id: assignmentId }) as unknown as TourActivity;

describe('executions', () => {
  it('FE-ACT-MODEL-001: lists the days the tour is on with their assignment, in trip order', () => {
    const executions = executionsOf(7, days, assignments);
    expect(executions.map((execution) => [execution.assignmentId, execution.day?.id, execution.index])).toEqual([
      [11, 1, 0],
      [31, 3, 2],
    ]);
    expect(executionOf(executions, 31).index).toBe(2);
    expect(executionOf(executions, null)).toEqual({ assignmentId: null, day: null, index: -1 });
    expect(executionOf(executions, 99).day).toBeNull();
  });

  it('FE-ACT-MODEL-002: orders the actual tracks by their days, the ones without a day last', () => {
    const executions = executionsOf(7, days, assignments);
    const ordered = inDayOrder([activity(1, null), activity(2, 31), activity(3, 11), activity(4, null)], executions);
    expect(ordered.map((item) => item.id)).toEqual([3, 2, 1, 4]);
  });
});

describe('candidates', () => {
  it('FE-ACT-MODEL-003: a recording is an import nobody planned over', () => {
    expect(isRecording(tour({ origin: 'gpx', has_waypoints: false }))).toBe(true);
    expect(isRecording(tour({ origin: 'wanderer', has_waypoints: false }))).toBe(true);
    expect(isRecording(tour({ origin: 'gpx', has_waypoints: true }))).toBe(false);
    expect(isRecording(tour({ origin: 'trek', has_waypoints: false }))).toBe(false);
    expect(isRecording(tour({ origin: undefined, has_waypoints: false }))).toBe(false);
  });

  it('FE-ACT-MODEL-004: offers the recordings, dims one taken by another tour and leaves out the rest', () => {
    const tours = [
      tour(),
      tour({ place_id: 20, name: 'Watch', origin: 'gpx', has_waypoints: false }),
      tour({ place_id: 21, name: 'Phone', origin: 'gpx', has_waypoints: false, activity_of: 30 }),
      tour({ place_id: 22, name: 'Mine', origin: 'gpx', has_waypoints: false, activity_of: 7 }),
      tour({
        place_id: 23,
        name: 'Plan',
        origin: 'gpx',
        has_waypoints: false,
        activity_tracks: [{ id: 1, track_place_id: 24, assignment_id: null }],
      }),
      tour({ place_id: 30, name: 'Lake' }),
    ];
    expect(trackCandidates(tours, 7).map(({ tour: item, takenBy }) => [item.place_id, takenBy])).toEqual([
      [20, null],
      [21, 'Lake'],
      [22, null],
    ]);
  });
});

describe('the GPX preset', () => {
  it('FE-ACT-MODEL-005: imports a recording as the tour’s own type', () => {
    expect(importFieldsFor(tour({ tour_type: 'bike', bike_profile: 'gravel' }))).toEqual({
      tour_type: 'bike',
      bike_profile: 'gravel',
    });
    expect(importFieldsFor(tour({ tour_type: 'bike', bike_profile: null }))).toEqual({
      tour_type: 'bike',
      bike_profile: 'touring',
    });
    expect(importFieldsFor(tour({ tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' }))).toEqual({
      tour_type: 'kayak',
      boat_type: 'sup',
      water_context: 'lake',
    });
    expect(importFieldsFor(tour({ tour_type: 'kayak', boat_type: null, water_context: null }))).toEqual({
      tour_type: 'kayak',
    });
    expect(importFieldsFor(tour({ tour_type: 'walk' }))).toEqual({ tour_type: 'walk' });
    expect(importFieldsFor(tour({ tour_type: 'ski' }))).toEqual({ tour_type: 'hike' });
    expect(importFieldsFor(tour({ tour_type: 'ski', ski_discipline: 'touring', ski_technique: null }))).toEqual({
      tour_type: 'ski',
      ski_discipline: 'touring',
    });
    const skating = { tour_type: 'ski', ski_discipline: 'cross_country', ski_technique: 'skating' } as const;
    expect(importFieldsFor(tour(skating))).toEqual(skating);
    expect(importFieldsFor(tour({ tour_type: 'ski', ski_discipline: 'cross_country', ski_technique: null }))).toEqual({
      tour_type: 'ski',
      ski_discipline: 'cross_country',
      ski_technique: 'unknown',
    });
    expect(importFieldsFor(tour({ tour_type: 'run', run_profile: 'trail' }))).toEqual({
      tour_type: 'run',
      run_profile: 'trail',
    });
    expect(importFieldsFor(tour({ tour_type: 'run', run_profile: null }))).toEqual({
      tour_type: 'run',
      run_profile: 'running',
    });
    expect(importFieldsFor(tour({ tour_type: 'horse' }))).toEqual({ tour_type: 'horse' });
  });

  it('FE-ACT-MODEL-010: the track of a planned snowshoe or winter hike tour comes in as ski with that discipline (SKI-02)', () => {
    for (const discipline of ['snowshoe', 'winter_hike'] as const) {
      expect(importFieldsFor(tour({ tour_type: 'ski', ski_discipline: discipline, ski_technique: null }))).toEqual({
        tour_type: 'ski',
        ski_discipline: discipline,
      });
    }
  });
});

describe('measures', () => {
  it('FE-ACT-MODEL-006: the time is only what the track’s times say', () => {
    expect(recordedMinutes('2026-07-02T06:10:00Z', '2026-07-02T09:25:00Z')).toBe(195);
    expect(recordedMinutes(null, '2026-07-02T09:25:00Z')).toBeNull();
    expect(recordedMinutes('2026-07-02T09:25:00Z', '2026-07-02T06:10:00Z')).toBeNull();
    expect(recordedMinutes('nonsense', undefined)).toBeNull();
  });

  it('FE-ACT-MODEL-007: analyses a line like the plan’s, and nothing of fewer than two points', () => {
    const analysis = analysisOfLine([
      [47, 11, 600],
      [47.01, 11, 700],
    ]);
    expect(analysis?.gain).toBe(100);
    expect(analysisOfLine([[47, 11]])).toBeNull();
  });

  it('FE-ACT-MODEL-008: reads the server’s reason for a refusal, and none from anything else', () => {
    expect(refusalOf({ response: { data: { code: 'activity_track_in_use' } } })).toBe('activity_track_in_use');
    expect(refusalOf({ response: { data: { code: 'tour_revision_conflict' } } })).toBeNull();
    expect(refusalOf(new Error('offline'))).toBeNull();
    expect(refusalOf(null)).toBeNull();
  });

  it('FE-ACT-MODEL-009: the day recorded is the viewer’s calendar day of the first time, not the UTC one', () => {
    // 22:30 UTC on the 1st is the morning of the 2nd in Tokyo and still the afternoon of the 1st in Los Angeles.
    expect(recordedDay('2026-07-01T22:30:00Z', 'en', 'Asia/Tokyo')).toBe(formatDate('2026-07-02', 'en'));
    expect(recordedDay('2026-07-01T22:30:00Z', 'en', 'America/Los_Angeles')).toBe(formatDate('2026-07-01', 'en'));
    // 01:30 UTC on the 2nd is still the evening of the 1st in New York.
    expect(recordedDay('2026-07-02T01:30:00Z', 'en', 'America/New_York')).toBe(formatDate('2026-07-01', 'en'));
    expect(recordedDay(null, 'en')).toBeNull();
    expect(recordedDay('nonsense', 'en')).toBeNull();
  });
});
