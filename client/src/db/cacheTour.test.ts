// A tour answer written to the cache (PAD-06): its control points, and where it
// came from and its checklist kept from the cached row when the answer lacks them.
import type { TourListItem, TourProvenance } from '@trek/shared';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';

import { obstacleCheck } from '../../tests/helpers/paddleCheck';
import { cacheTourAnswer } from './cacheTour';
import { clearAll, offlineDb } from './offlineDb';

function tour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 40,
    name: 'Regen',
    tour_type: 'kayak',
    distance: 8,
    elevation_gain: null,
    elevation_loss: null,
    duration: 120,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    has_waypoints: true,
    ...overrides,
  };
}

const waypoints = [
  { lat: 49.2, lng: 12, role: 'start' as const, sequence: 0 },
  { lat: 49.2, lng: 12.01, role: 'end' as const, sequence: 1 },
];
const provenance: TourProvenance = {
  origin: 'trek',
  createdAt: null,
  source: { kind: 'trek' },
  derivedFrom: null,
  plannedOver: false,
  editedLocally: null,
};

beforeEach(async () => {
  await clearAll();
});

describe('cacheTourAnswer', () => {
  it('CT-001: writes the tour with its trip, control points, provenance and checklist', async () => {
    const check = obstacleCheck();
    const row = await cacheTourAnswer(3, { tour: tour(), waypoints, provenance, obstacle_check: check });
    expect(row).toMatchObject({ place_id: 40, trip_id: 3, waypoints, provenance, obstacle_check: check });
    expect(await offlineDb.tours.get(40)).toEqual(row);
  });

  it('CT-ACT-001: the actual tracks of a detail are cached, and kept by an answer without them (ACT-01)', async () => {
    const activities = [
      {
        id: 5,
        assignment_id: null,
        day_id: null,
        assigned_at: null,
        track: { place_id: 41, name: 'Watch', origin: 'gpx' as const, file_name: null, imported_at: null },
        metrics: {
          distance_km: 2,
          elevation_gain_m: null,
          elevation_loss_m: null,
          started_at: null,
          ended_at: null,
          elapsed_minutes: null,
          point_count: 2,
        },
        geometry: [] as Array<[number, number]>,
      },
    ];
    await cacheTourAnswer(3, { tour: tour({ tour_type: 'hike' }), waypoints, activities });
    const row = await cacheTourAnswer(3, { tour: tour({ tour_type: 'hike', name: 'Again' }), waypoints });
    expect(row.activities).toEqual(activities);
  });

  it('CT-002: an answer without provenance or checklist keeps the cached ones', async () => {
    const check = obstacleCheck();
    await cacheTourAnswer(3, { tour: tour(), waypoints, provenance, obstacle_check: check });
    const row = await cacheTourAnswer(3, { tour: tour({ name: 'Regen again' }), waypoints });
    expect(row).toMatchObject({ name: 'Regen again', provenance, obstacle_check: check });
  });

  it('CT-003: a tour that is no paddle tour any more drops its checklist', async () => {
    await cacheTourAnswer(3, { tour: tour(), waypoints, obstacle_check: obstacleCheck() });
    const row = await cacheTourAnswer(3, { tour: tour({ tour_type: 'hike' }), waypoints });
    expect(row).not.toHaveProperty('obstacle_check');
  });

  it('CT-004: a packing link answer is kept, null lets it go, and an answer without one keeps the cached one', async () => {
    const link = { category: 'Hiking gear', linked_at: '2026-10-20 09:00:00' };
    expect(await cacheTourAnswer(3, { tour: tour(), waypoints, packing_link: link })).toMatchObject({
      packing_link: link,
    });
    expect(await cacheTourAnswer(3, { tour: tour({ name: 'Renamed' }), waypoints })).toMatchObject({
      packing_link: link,
    });
    expect((await cacheTourAnswer(3, { tour: tour(), waypoints, packing_link: null })).packing_link).toBeNull();
    const fresh = await cacheTourAnswer(4, { tour: tour({ place_id: 41 }), waypoints });
    expect(fresh).not.toHaveProperty('packing_link');
  });
});
