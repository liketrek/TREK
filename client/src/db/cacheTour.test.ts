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
});
