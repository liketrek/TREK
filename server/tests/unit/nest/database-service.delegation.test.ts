/**
 * Locks in the delegation direction: DatabaseService's trip-access helpers
 * must call the db/database exports (which e2e suites stub in their vi.mock
 * factories), never reimplement the SQL against the injected connection.
 */
import { describe, it, expect, vi } from 'vitest';

const { canAccessTrip, isOwner, getPlaceWithTags } = vi.hoisted(() => ({
  canAccessTrip: vi.fn(() => ({ id: -1, user_id: -2, currency: 'XXX' })),
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(() => null),
}));

vi.mock('../../../src/db/database', () => ({
  db: {},
  closeDb: () => {},
  reinitialize: () => {},
  canAccessTrip,
  isOwner,
  getPlaceWithTags,
}));

import { DatabaseService } from '../../../src/nest/database/database.service';

describe('DatabaseService (helper delegation)', () => {
  it('routes trip-access helpers through the db/database exports', async () => {
    const { db } = await import('../../../src/db/database');
    const svc = new DatabaseService(db);

    expect(svc.canAccessTrip(7, 8)).toEqual({ id: -1, user_id: -2, currency: 'XXX' });
    expect(canAccessTrip).toHaveBeenCalledWith(7, 8);

    expect(svc.isOwner(7, 8)).toBe(true);
    expect(isOwner).toHaveBeenCalledWith(7, 8);

    expect(svc.getPlaceWithTags(9)).toBeNull();
    expect(getPlaceWithTags).toHaveBeenCalledWith(9);
  });
});
