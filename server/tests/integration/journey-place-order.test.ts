/**
 * Regression for the Task 11 fix-round finding: PlacesService.onDeleted wraps
 * a now-async JourneyDomainService.onPlaceDeleted call. The controller must
 * await it before the place row (and its `journey_entries.source_place_id`
 * FK, ON DELETE SET NULL) is actually deleted — otherwise the hook either
 * never runs, or races the delete and finds nothing left to annotate.
 *
 * Wires PlacesController → PlacesService → JourneyDomainService for real (no
 * journey mock), through the real buildApp() HTTP surface, and pins the
 * end-to-end detach-then-annotate behaviour that path produces. It is NOT by
 * itself a guard against a revert to fire-and-forget: the hook body today has
 * no internal await, so it still runs to completion inside the same
 * synchronous/microtask turn even if the controller stopped awaiting it, and
 * this test would not notice. It becomes a true regression guard once the
 * hook body awaits real async DB work of its own — see
 * tests/unit/nest/places.controller.test.ts for the unit-level ordering test
 * that stubs a macrotask hop and does catch a detached hook today.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { invalidatePermissionsCache } from '../../src/nest/permissions/permissions-cache';
import { authCookie } from '../helpers/auth';
import { createUser, createTrip, createPlace, createJourney, linkTripToJourney } from '../helpers/factories';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});
beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  invalidatePermissionsCache();
  // Enable the journey addon.
  testDb
    .prepare(
      "INSERT OR REPLACE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES ('journey', 'Journey', 'Travel journal', 'global', 'Compass', 1, 35)",
    )
    .run();
});
afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('deleting a place detaches its journey entry ahead of the FK cascade', () => {
  it('annotates a filled entry with the removal note instead of leaving it silently orphaned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Café de Flore' });
    const journey = createJourney(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    // A filled entry (not a bare skeleton) sourced from this place, the way
    // onPlaceDeleted documents: it survives the delete but gets detached and
    // annotated, rather than deleted outright (that path is for content-less
    // skeletons) or left dangling with a stale source_place_id.
    const now = Date.now();
    const entryId = testDb
      .prepare(
        `
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, story, entry_date, visibility, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'entry', ?, ?, '2026-01-15', 'private', 0, ?, ?)
    `,
      )
      .run(journey.id, trip.id, place.id, user.id, 'A café', 'Lovely coffee.', now, now).lastInsertRowid;

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, tourPlaceIds: [] });

    // The place is gone.
    expect(testDb.prepare('SELECT 1 FROM places WHERE id = ?').get(place.id)).toBeUndefined();

    // The entry survives, detached and annotated — the FK's ON DELETE SET
    // NULL alone would null source_place_id but would never touch story or
    // type; only onPlaceDeleted having actually run produces the note.
    const entry = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entryId) as {
      source_place_id: number | null;
      source_trip_id: number | null;
      type: string;
      story: string;
    };
    expect(entry.source_place_id).toBeNull();
    expect(entry.source_trip_id).toBeNull();
    expect(entry.type).toBe('entry');
    expect(entry.story).toContain('the original trip place was removed from the trip plan');
  });

  it('deletes a content-less skeleton outright rather than leaving an orphaned row behind', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Musée Rodin' });
    const journey = createJourney(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const now = Date.now();
    const entryId = testDb
      .prepare(
        `
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, entry_date, visibility, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'skeleton', ?, '2026-01-16', 'private', 0, ?, ?)
    `,
      )
      .run(journey.id, trip.id, place.id, user.id, place.name, now, now).lastInsertRowid;

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);

    // onPlaceDeleted ran (and completed) as part of the request: the
    // content-less skeleton is gone, not merely detached.
    expect(testDb.prepare('SELECT 1 FROM journey_entries WHERE id = ?').get(entryId)).toBeUndefined();
  });
});
