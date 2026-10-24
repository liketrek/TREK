import { tourActivityAssignRequestSchema, tourActivitySchema } from './tour-activity.schema';
import { tourDetailResponseSchema, tourListItemSchema } from './tours.schema';

import { describe, expect, it } from 'vitest';

const activity = {
  id: 4,
  assignment_id: 12,
  day_id: 3,
  assigned_at: '2026-07-02T18:00:00Z',
  track: {
    place_id: 9,
    name: 'Watch export',
    origin: 'gpx',
    file_name: 'morning.gpx',
    imported_at: '2026-07-02 17:58:00',
  },
  metrics: {
    distance_km: 12.4,
    elevation_gain_m: 640,
    elevation_loss_m: 610,
    started_at: '2026-07-02T06:10:00Z',
    ended_at: '2026-07-02T11:40:00Z',
    elapsed_minutes: 330,
    point_count: 2,
  },
  geometry: [
    [47.1, 11.2, 900],
    [47.2, 11.3, 930],
  ],
};

describe('ACT-01 tour activity contract', () => {
  it('ACT-SCHEMA-001: reads an assignment with its recording, its measures and its line', () => {
    expect(tourActivitySchema.parse(activity)).toEqual(activity);
  });

  it('ACT-SCHEMA-002: keeps what a track lacks unknown instead of zero', () => {
    const bare = {
      ...activity,
      assignment_id: null,
      day_id: null,
      metrics: {
        distance_km: 3,
        elevation_gain_m: null,
        elevation_loss_m: null,
        started_at: null,
        ended_at: null,
        elapsed_minutes: null,
        point_count: 2,
      },
    };
    expect(tourActivitySchema.parse(bare).metrics.elapsed_minutes).toBeNull();
  });

  it('ACT-SCHEMA-003: an assignment names a recording and an execution, nothing else', () => {
    expect(tourActivityAssignRequestSchema.parse({ track_place_id: 9, assignment_id: null })).toEqual({
      track_place_id: 9,
      assignment_id: null,
    });
    expect(() => tourActivityAssignRequestSchema.parse({ track_place_id: 9 })).toThrow();
    expect(() => tourActivityAssignRequestSchema.parse({ track_place_id: 0, assignment_id: null })).toThrow();
    expect(() =>
      tourActivityAssignRequestSchema.parse({ track_place_id: 9, assignment_id: null, distance_km: 3 }),
    ).toThrow();
  });

  it('ACT-SCHEMA-004: a list item and a detail cached before ACT-01 still read', () => {
    const item = {
      place_id: 1,
      tour_type: 'hike',
      distance: 1,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      name: 'Ridge',
      planned: false,
      caution: false,
    };
    expect(tourListItemSchema.parse(item).activity_tracks).toBeUndefined();
    const detail = tourDetailResponseSchema.parse({ tour: item, waypoints: [], activities: [activity] });
    expect(detail.activities).toHaveLength(1);
    expect(
      tourListItemSchema.parse({ ...item, activity_tracks: [{ id: 4, track_place_id: 9, assignment_id: null }] })
        .activity_tracks,
    ).toEqual([{ id: 4, track_place_id: 9, assignment_id: null }]);
  });
});
