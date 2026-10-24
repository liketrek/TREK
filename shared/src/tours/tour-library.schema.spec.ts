import {
  tourLibraryDetailResponseSchema,
  tourLibraryQuerySchema,
  tourLibraryResponseSchema,
  tourTakeOverRequestSchema,
} from './tour-library.schema';

import { describe, expect, it } from 'vitest';

const item = {
  place_id: 7,
  name: 'Kramerplateauweg',
  description: null,
  tour_type: 'hike',
  distance: 4.8,
  elevation_gain: 533,
  elevation_loss: 530,
  duration: 156,
  planned_duration_minutes: null,
  break_additional_minutes: null,
  max_hiking_difficulty: 1,
  has_waypoints: true,
  origin: 'trek',
  trip: { id: 2, title: 'Garmisch' },
};

describe('tour library contracts (LIB-02)', () => {
  it('reads the query from strings and refuses what it does not know', () => {
    expect(tourLibraryQuerySchema.parse({ q: ' ridge ', type: 'hike', trip_id: '3', exclude_trip_id: '1' })).toEqual({
      q: 'ridge',
      type: 'hike',
      trip_id: 3,
      exclude_trip_id: 1,
    });
    expect(tourLibraryQuerySchema.safeParse({ type: 'car' }).success).toBe(false);
    expect(tourLibraryQuerySchema.safeParse({ trip_id: '0' }).success).toBe(false);
    expect(tourLibraryQuerySchema.safeParse({ sort: 'name' }).success).toBe(false);
  });

  it('lists tours with the trip they are in, measures left unknown where unknown', () => {
    const answer = tourLibraryResponseSchema.parse({
      tours: [item, { ...item, place_id: 8, distance: null, elevation_gain: null }],
      trips: [{ id: 2, title: 'Garmisch', tour_count: 2 }],
      truncated: false,
    });
    expect(answer.tours[1]?.distance).toBeNull();
    expect(
      tourLibraryResponseSchema.safeParse({ tours: [{ ...item, trip: undefined }], trips: [], truncated: false })
        .success,
    ).toBe(false);
  });

  it('previews a line as plain points', () => {
    expect(
      tourLibraryDetailResponseSchema.parse({ tour: item, line: [[47.4, 11.1]], waypoint_count: 4 }).line,
    ).toHaveLength(1);
    expect(tourLibraryDetailResponseSchema.safeParse({ tour: item, line: [[47.4]], waypoint_count: 4 }).success).toBe(
      false,
    );
  });

  it('takes over by trip and tour, the name optional and trimmed', () => {
    expect(tourTakeOverRequestSchema.parse({ source_trip_id: 2, source_place_id: 7, name: ' Copy ' }).name).toBe(
      'Copy',
    );
    expect(tourTakeOverRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7 }).success).toBe(true);
    expect(tourTakeOverRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7, name: '' }).success).toBe(
      false,
    );
    expect(tourTakeOverRequestSchema.safeParse({ source_trip_id: '2', source_place_id: 7 }).success).toBe(false);
    expect(tourTakeOverRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7, day_id: 1 }).success).toBe(
      false,
    );
  });
});
