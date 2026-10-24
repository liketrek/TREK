import { ToursBikeProfile } from '../../../src/db/entities/Tours.entity';
import { BIKE_PROFILES } from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * BIK-01: the bike profile column holds a CHECK list (migration 045200) that
 * the entity carries as its enum, and the contract holds its own list. A
 * profile one side knows and the other refuses would be a tour the planner
 * can save and the database cannot store.
 */
describe('bike profile column matches the contract', () => {
  it('knows the same profiles as the bike contract', () => {
    expect(Object.values(ToursBikeProfile).sort()).toEqual([...BIKE_PROFILES].sort());
  });
});
