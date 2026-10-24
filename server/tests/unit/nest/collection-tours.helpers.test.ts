/**
 * The pure halves of LIB-03 and the copy model it shares with P2C-07 and
 * LIB-02: where a copy starts, what a kept tour shows and what a tour made
 * from it carries.
 */
import type { CollectionTourRow } from '../../../src/db/repositories/CollectionTours.repository';
import {
  keptTourCopySource,
  keptTourItem,
  keptTourLine,
  keptTourPoints,
  keptTourSnapshot,
} from '../../../src/nest/tours/collection-tours.helpers';
import { copiedFacet, copyStart } from '../../../src/nest/tours/tour-copy.helpers';

import { describe, expect, it } from 'vitest';

const row: CollectionTourRow = {
  id: 4,
  collection_id: 9,
  saved_by: 1,
  saved_by_name: 'owner',
  name: 'Ridge',
  description: null,
  website: 'https://example.test/ridge',
  route_geometry: '[[47,11,600],[47.02,11.02,630]]',
  waypoints: [
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, name: 'Hut', shaping: true },
  ],
  tour_type: 'bike',
  distance: 12,
  elevation_gain: null,
  elevation_loss: null,
  duration: null,
  planned_duration_minutes: 120,
  break_additional_minutes: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  bike_profile: 'gravel',
  run_profile: null,
  run_pace_seconds_per_km: null,
  ski_discipline: null,
  ski_technique: null,
  ski_options: null,
  boat_type: null,
  water_context: null,
  paddle_speed_kmh: null,
  portage_speed_kmh: null,
  paddle_lake_style: null,
  track_marks: null,
  hiking_preferences: null,
  origin: 'gpx',
  origin_file_name: 'ridge.gpx',
  track_started_at: null,
  track_ended_at: null,
  source_trip_title: 'Alps',
  source_tour_name: 'Ridge',
  created_at: '2026-10-20 10:00:00',
};

describe('collection tour helpers (LIB-03)', () => {
  it('LIB3-HLP-001: a copy starts at the line, a walk without one at its first station, nothing without either', () => {
    expect(copyStart({ route_geometry: '[[47,11,600],[48,12]]', waypoints: [] })).toEqual([47, 11]);
    expect(copyStart({ route_geometry: null, waypoints: [{ lat: 1, lng: 2, role: 'start', sequence: 0 }] })).toEqual([
      1, 2,
    ]);
    expect(copyStart({ route_geometry: null, waypoints: [] })).toBeUndefined();
    expect(copyStart({ route_geometry: '[]', waypoints: [] })).toBeUndefined();
  });

  it('LIB3-HLP-002: lists a kept tour as it was saved, unknown measures staying unknown', () => {
    expect(keptTourItem(row)).toMatchObject({
      id: 4,
      tour_type: 'bike',
      distance: 12,
      elevation_gain: null,
      origin: 'gpx',
      has_line: true,
      waypoint_count: 3,
      station_count: null,
      source: { tripTitle: 'Alps', tourName: 'Ridge' },
      saved_by: 'owner',
      saved_at: '2026-10-20 10:00:00',
    });
    expect(keptTourItem({ ...row, route_geometry: null }).has_line).toBe(false);
  });

  it('LIB3-HLP-007: a kept tour carries what the trip list shows of its type, and its stages', () => {
    expect(keptTourItem(row)).toMatchObject({
      bike_profile: 'gravel',
      ski_discipline: null,
      run_pace_seconds_per_km: null,
      stage_count: null,
    });
    const ski = {
      ...row,
      tour_type: 'ski',
      bike_profile: null,
      ski_discipline: 'cross_country',
      ski_technique: 'skating',
    };
    expect(keptTourItem(ski)).toMatchObject({ ski_discipline: 'cross_country', ski_technique: 'skating' });
    const run = { ...row, tour_type: 'run', bike_profile: null, run_profile: 'trail', run_pace_seconds_per_km: 360 };
    expect(keptTourItem(run)).toMatchObject({ run_profile: 'trail', run_pace_seconds_per_km: 360 });
    const snowshoe = { ...row, tour_type: 'ski', bike_profile: null, ski_discipline: 'snowshoe' };
    expect(keptTourItem(snowshoe)).toMatchObject({ tour_type: 'ski', ski_discipline: 'snowshoe', ski_technique: null });
    expect(keptTourItem(snowshoe)).not.toHaveProperty('winter_activity');
    const hutToHut = {
      ...row,
      waypoints: [
        { lat: 47, lng: 11, role: 'start' as const, sequence: 0 },
        { lat: 47.01, lng: 11.01, role: 'via' as const, sequence: 1, stage_end: true },
        { lat: 47.015, lng: 11.015, role: 'via' as const, sequence: 2, stage_end: true },
        { lat: 47.02, lng: 11.02, role: 'end' as const, sequence: 3 },
      ],
    };
    expect(keptTourItem(hutToHut).stage_count).toBe(3);
  });

  it('LIB3-HLP-003: shows the points in route order and the line thinned for drawing', () => {
    expect(keptTourPoints(row)).toEqual([
      { role: 'start', name: null, shaping: false },
      { role: 'via', name: 'Hut', shaping: true },
      { role: 'end', name: null, shaping: false },
    ]);
    expect(keptTourLine(row)).toEqual([
      [47, 11],
      [47.02, 11.02],
    ]);
    const long = JSON.stringify(Array.from({ length: 900 }, (_, i) => [47 + i / 1000, 11]));
    expect(keptTourLine({ route_geometry: long })).toHaveLength(400);
    expect(keptTourLine({ route_geometry: null })).toEqual([]);
  });

  it('LIB3-HLP-004: a tour made from it carries everything, its points only when asked for', () => {
    const withPoints = keptTourCopySource(row, true);
    expect(withPoints).toMatchObject({ place_id: null, name: 'Ridge', website: 'https://example.test/ridge' });
    expect(withPoints.waypoints).toHaveLength(3);
    expect(keptTourCopySource(row, false).waypoints).toEqual([]);
    expect(keptTourCopySource(row, false).route_geometry).toBe(row.route_geometry);
    expect(copiedFacet(withPoints, 77, { derivedFrom: null, sameTrip: false })).toMatchObject({
      place_id: 77,
      tour_type: 'bike',
      bike_profile: 'gravel',
      planned_duration_minutes: 120,
      origin: 'gpx',
      origin_file_name: 'ridge.gpx',
      derived_from_place_id: null,
      taken_over_from_trip_title: 'Alps',
      taken_over_from_tour_name: 'Ridge',
    });
    expect(
      copiedFacet(withPoints, 77, {
        derivedFrom: null,
        sameTrip: false,
        takenOverFrom: { tripTitle: 'Coast', tourName: 'Cliffs' },
      }),
    ).toMatchObject({ taken_over_from_trip_title: 'Coast', taken_over_from_tour_name: 'Cliffs' });
  });

  it('LIB3-HLP-005: keeping one leaves its links to the trip behind and names where it came from', () => {
    const source = keptTourCopySource(
      {
        ...row,
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0, linked_place_id: 3 },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
        ],
      },
      true,
    );
    const snapshot = keptTourSnapshot(source, { collectionId: 9, userId: 1, name: 'Kept', tripTitle: 'Coast' });
    expect(snapshot).toMatchObject({
      collection_id: 9,
      saved_by: 1,
      name: 'Kept',
      bike_profile: 'gravel',
      origin_file_name: 'ridge.gpx',
      source_trip_title: 'Coast',
      source_tour_name: 'Ridge',
    });
    const kept = JSON.parse(snapshot.waypoints) as Array<{ linked_place_id?: number | null }>;
    expect(kept.map((point) => point.linked_place_id)).toEqual([null, null]);
  });

  it('LIB3-HLP-007: a kept ski tour keeps its piste router options and build, and a copy of it takes them along', () => {
    const skiOptions = JSON.stringify({ options: { max_difficulty: 'advanced' }, build: '2026-11-02' });
    const ski = { ...row, tour_type: 'ski', bike_profile: null, ski_discipline: 'alpine', ski_options: skiOptions };
    const snapshot = keptTourSnapshot(keptTourCopySource(ski, true), {
      collectionId: 9,
      userId: 1,
      name: 'Kept',
      tripTitle: 'Alps',
    });
    expect(snapshot).toMatchObject({ tour_type: 'ski', ski_discipline: 'alpine', ski_options: skiOptions });
    expect(keptTourCopySource(ski, false).facet.ski_options).toBe(skiOptions);
    expect(keptTourCopySource(row, false).facet.ski_options).toBeNull();
  });

  it('LIB3-HLP-006: a point that is no control point refuses the whole snapshot', () => {
    const broken = keptTourCopySource({ ...row, waypoints: [{ lat: 147, lng: 11, role: 'start', sequence: 0 }] }, true);
    expect(() => keptTourSnapshot(broken, { collectionId: 9, userId: 1, name: 'Kept', tripTitle: 'Coast' })).toThrow();
  });
});
