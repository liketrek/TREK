import {
  collectionTourDetailResponseSchema,
  collectionTourListResponseSchema,
  collectionTourSaveRequestSchema,
  collectionTourTakeOverRequestSchema,
} from './collection-tour.schema';

import { describe, expect, it } from 'vitest';

const item = {
  id: 4,
  collection_id: 9,
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
  wanderer_ref: null,
  origin: 'trek',
  has_line: true,
  waypoint_count: 3,
  source: { tripTitle: 'Garmisch', tourName: 'Kramer' },
  saved_by: 'maurice',
  saved_at: '2026-10-20 10:00:00',
};

describe('collection tour contracts (LIB-03)', () => {
  it('saves a tour of a trip under its own name or a new one, nothing else', () => {
    expect(collectionTourSaveRequestSchema.parse({ source_trip_id: 2, source_place_id: 7, name: ' Kept ' }).name).toBe(
      'Kept',
    );
    expect(collectionTourSaveRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7 }).success).toBe(true);
    expect(collectionTourSaveRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7, name: '' }).success).toBe(
      false,
    );
    expect(collectionTourSaveRequestSchema.safeParse({ source_trip_id: '2', source_place_id: 7 }).success).toBe(false);
    expect(
      collectionTourSaveRequestSchema.safeParse({ source_trip_id: 2, source_place_id: 7, collection_id: 1 }).success,
    ).toBe(false);
  });

  it('takes a kept tour into a trip only once the choice about its points is said', () => {
    const accepts = (body: unknown) => collectionTourTakeOverRequestSchema.safeParse(body).success;
    const body = { collection_id: 9, collection_tour_id: 4, include_waypoints: false };
    expect(collectionTourTakeOverRequestSchema.parse(body)).toEqual(body);
    expect(accepts({ collection_id: 9, collection_tour_id: 4 })).toBe(false);
    expect(accepts({ collection_tour_id: 4, include_waypoints: true })).toBe(false);
    expect(accepts({ ...body, include_waypoints: 'yes' })).toBe(false);
    expect(accepts({ ...body, day_id: 1 })).toBe(false);
  });

  it('lists kept tours with where they came from, unknown measures staying unknown', () => {
    const answer = collectionTourListResponseSchema.parse({
      tours: [item, { ...item, id: 5, distance: null, saved_by: null }],
    });
    expect(answer.tours[1]?.distance).toBeNull();
    expect(answer.tours[1]?.saved_by).toBeNull();
    expect(collectionTourListResponseSchema.safeParse({ tours: [{ ...item, source: undefined }] }).success).toBe(false);
    expect(collectionTourListResponseSchema.safeParse({ tours: [{ ...item, origin: 'komoot' }] }).success).toBe(false);
  });

  it('previews the line, the points in order and the trips it could go into', () => {
    const detail = collectionTourDetailResponseSchema.parse({
      tour: item,
      line: [[47.4, 11.1]],
      points: [
        { role: 'start', name: null, shaping: false },
        { role: 'end', name: 'Hut', shaping: false },
      ],
      trips: [{ id: 3, title: 'Alps', start_date: null, end_date: null, can_add: true }],
    });
    expect(detail.points[1]?.name).toBe('Hut');
    expect(
      collectionTourDetailResponseSchema.safeParse({
        ...detail,
        points: [{ role: 'middle', name: null, shaping: false }],
      }).success,
    ).toBe(false);
  });
});
