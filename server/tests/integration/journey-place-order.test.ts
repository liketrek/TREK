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
import { Addons } from '../../src/db/entities/Addons.entity';
import { JourneyEntries } from '../../src/db/entities/JourneyEntries.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { invalidatePermissionsCache } from '../../src/nest/permissions/permissions-cache';
import { authCookie } from '../helpers/auth';
import { createUser, createTrip, createPlace, createJourney, linkTripToJourney } from '../helpers/factories';
import { findRow, insertRow, upsertRow } from '../helpers/factories/rows';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});
beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
  await invalidatePermissionsCache();
  // Enable the journey addon.
  await upsertRow(orm, Addons, {
    id: 'journey',
    name: 'Journey',
    description: 'Travel journal',
    type: 'global',
    icon: 'Compass',
    enabled: true,
    sort_order: 35,
  });
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
    const entryId = await insertRow(orm, JourneyEntries, {
      journey: journey.id,
      sourceTrip: trip.id,
      sourcePlace: place.id,
      author: user.id,
      type: 'entry',
      title: 'A café',
      story: 'Lovely coffee.',
      entry_date: '2026-01-15',
      visibility: 'private',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, tourPlaceIds: [] });

    // The place is gone.
    expect(await findRow(orm, Places, { id: place.id })).toBeNull();

    // The entry survives, detached and annotated — the FK's ON DELETE SET
    // NULL alone would null source_place_id but would never touch story or
    // type; only onPlaceDeleted having actually run produces the note.
    const entry = (await findRow(orm, JourneyEntries, { id: entryId }))!;
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
    const entryId = await insertRow(orm, JourneyEntries, {
      journey: journey.id,
      sourceTrip: trip.id,
      sourcePlace: place.id,
      author: user.id,
      type: 'skeleton',
      title: place.name,
      entry_date: '2026-01-16',
      visibility: 'private',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/places/${place.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);

    // onPlaceDeleted ran (and completed) as part of the request: the
    // content-less skeleton is gone, not merely detached.
    expect(await findRow(orm, JourneyEntries, { id: entryId })).toBeNull();
  });
});
