/**
 * The pure half of ACT-01: what a recording measures, read from its own line;
 * how long it took, only from times it carried; what the list says of the
 * assignments; and which imported place gets which times.
 */
import type { TourActivityRow } from '../../../src/db/repositories/TourActivities.repository';
import {
  activityFacts,
  elapsedMinutes,
  toActivity,
  trackTimesFor,
  withoutLine,
} from '../../../src/nest/tours/tour-activities.helpers';

import { describe, expect, it } from 'vitest';

const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
  [47.02, 11, 650],
]);

const row = (overrides: Partial<TourActivityRow> = {}): TourActivityRow => ({
  id: 4,
  place_id: 1,
  track_place_id: 9,
  assignment_id: 12,
  day_id: 3,
  assigned_at: '2026-07-02 18:00:00',
  track_name: 'Watch export',
  track_origin: 'gpx',
  track_file_name: 'morning.gpx',
  track_created_at: '2026-07-02 17:58:00',
  track_route_geometry: LINE,
  track_recorded_route_geometry: null,
  track_started_at: '2026-07-02 06:10:00',
  track_ended_at: '2026-07-02 11:40:30',
  ...overrides,
});

describe('elapsedMinutes', () => {
  it('ACT-HLP-001: counts from the first to the last time, to the minute', () => {
    expect(elapsedMinutes('2026-07-02 06:10:00', '2026-07-02 11:40:30')).toBe(331);
  });

  it('ACT-HLP-002: knows nothing without both times or with times out of order', () => {
    expect(elapsedMinutes(null, '2026-07-02 11:40:00')).toBeNull();
    expect(elapsedMinutes('2026-07-02 06:10:00', null)).toBeNull();
    expect(elapsedMinutes('2026-07-02 11:40:00', '2026-07-02 06:10:00')).toBeNull();
    expect(elapsedMinutes('garbage', '2026-07-02 06:10:00')).toBeNull();
  });
});

describe('toActivity', () => {
  it('ACT-HLP-003: answers the recording, its execution and what its own line measures', () => {
    const activity = toActivity(row());
    expect(activity).toMatchObject({
      id: 4,
      assignment_id: 12,
      day_id: 3,
      assigned_at: '2026-07-02T18:00:00Z',
      track: {
        place_id: 9,
        name: 'Watch export',
        origin: 'gpx',
        file_name: 'morning.gpx',
        imported_at: '2026-07-02T17:58:00Z',
      },
      metrics: {
        elevation_gain_m: 100,
        elevation_loss_m: 50,
        started_at: '2026-07-02T06:10:00Z',
        ended_at: '2026-07-02T11:40:30Z',
        elapsed_minutes: 331,
        point_count: 3,
      },
    });
    expect(activity.metrics.distance_km).toBeGreaterThan(2);
    expect(activity.geometry).toHaveLength(3);
  });

  it('ACT-HLP-004: reads the line a recording kept when it was planned over since, never the plan', () => {
    const kept = JSON.stringify([
      [48, 12],
      [48.01, 12],
    ]);
    const activity = toActivity(row({ track_recorded_route_geometry: kept }));
    expect(activity.geometry).toEqual([
      [48, 12],
      [48.01, 12],
    ]);
    expect(activity.metrics).toMatchObject({ elevation_gain_m: null, elevation_loss_m: null, point_count: 2 });
  });

  it('ACT-HLP-005: leaves what the recording does not carry unknown', () => {
    const activity = toActivity(
      row({ track_route_geometry: null, track_started_at: null, track_ended_at: null, track_created_at: null }),
    );
    expect(activity.metrics).toEqual({
      distance_km: null,
      elevation_gain_m: null,
      elevation_loss_m: null,
      started_at: null,
      ended_at: null,
      elapsed_minutes: null,
      point_count: 0,
    });
    expect(activity.track.imported_at).toBeNull();
  });

  it('ACT-HLP-006: an MCP answer leaves the line out', () => {
    const { geometry: _line, ...rest } = toActivity(row());
    expect(withoutLine(toActivity(row()))).toEqual(rest);
  });
});

describe('activityFacts', () => {
  const refs = [
    { id: 1, place_id: 10, track_place_id: 20, assignment_id: 5 },
    { id: 2, place_id: 10, track_place_id: 21, assignment_id: null },
  ];

  it('ACT-HLP-007: a tour lists its recordings, a recording names the tour it documents', () => {
    expect(activityFacts(10, refs)).toEqual({
      activity_tracks: [
        { id: 1, track_place_id: 20, assignment_id: 5 },
        { id: 2, track_place_id: 21, assignment_id: null },
      ],
      activity_of: null,
    });
    expect(activityFacts(21, refs)).toEqual({ activity_tracks: [], activity_of: 10 });
  });
});

describe('trackTimesFor', () => {
  const rows = [
    {
      name: 'Loop',
      lat: 47,
      lng: 11,
      description: null,
      trackTimes: { startedAt: '2026-07-02T06:10:00.000Z', endedAt: '2026-07-02T08:00:00.000Z' },
    },
    { name: 'Loop', lat: 47, lng: 11, description: null },
    { name: 'Route', lat: 46, lng: 10, description: null },
  ];

  it('ACT-HLP-008: gives each imported place the times of the row it was made from, in canonical text', () => {
    const times = trackTimesFor(rows, [
      { id: 1, name: 'Loop', lat: 47, lng: 11 },
      { id: 2, name: 'Loop', lat: 47, lng: 11 },
      { id: 3, name: 'Route', lat: 46, lng: 10 },
    ]);
    expect(times.get(1)).toEqual({ started: '2026-07-02 06:10:00', ended: '2026-07-02 08:00:00' });
    expect(times.get(2)).toEqual({ started: null, ended: null });
    expect(times.get(3)).toEqual({ started: null, ended: null });
  });

  it('ACT-HLP-009: a place without a row of its own stays without times', () => {
    expect(trackTimesFor(rows, [{ id: 7, name: 'Elsewhere', lat: null, lng: null }]).get(7)).toEqual({
      started: null,
      ended: null,
    });
  });
});
