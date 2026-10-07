/**
 * `airtrail-sync` cron tick request-context ratchet (Plan 3d Task 0,
 * deliverable 4b — inventory §12, the Plan 3a `*-003` shape
 * `orm-request-context-seams.test.ts`'s SEAM-003 established for
 * `PlaceShadowRetentionJob`).
 *
 * `AirtrailSyncJob.tick` → `AirtrailSyncService.runAirtrailSync` →
 * `syncOwner` is the ONLY cron in the program that reaches a 3d service
 * (`ReservationsService.getReservation`/`.update`, inventory §12's boot/cron
 * table) — `airtrail-sync-boot` is already in BOOT-SWEEP-001's name list
 * (it reads `app_settings` only, raw), but nothing before this file drove
 * the TICK itself (not the boot sweep) through the real, production-wired
 * `CronRegistrarService` into `ReservationsService`. `register()` already
 * wraps every registered tick in `withRequestContext` unconditionally, fail
 * closed on a missing ORM (`cron-registrar.service.ts`) — this pins that the
 * wrap is actually reached from THIS job's tick, the same way SEAM-003 pins
 * it for `PlaceShadowRetentionJob`'s.
 *
 * `ReservationsService` is not yet repository-backed (Plan 3d Tasks 2/4
 * convert it) — the wrap around `getReservation` below performs a REAL
 * repository read from exactly the point in the tick where the real,
 * converted implementation will sit, proving the context is live now, ready
 * for that conversion, the same technique `feeds-request-context.test.ts`'s
 * SEAM-FEED-001 uses for the anonymous ICS routes.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { Users } from '../../src/db/entities/Users.entity';
import { AirtrailLinkService } from '../../src/nest/integrations/airtrail-link.service';
import { AirtrailSyncJob } from '../../src/nest/integrations/airtrail-sync.job';
import { AirtrailClient, type AirtrailFlightRaw } from '../../src/nest/integrations/airtrail.client';
import { AirtrailService } from '../../src/nest/integrations/airtrail.service';
import { ReservationsService } from '../../src/nest/reservations/reservations.service';
import { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import { createTrip, createUser } from '../helpers/factories';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

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

describe('airtrail-sync cron tick runs inside a request context', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('AIRTRAIL-CTX-001: firing the real registered tick reaches ReservationsService.getReservation with a live request context, against the SAME MikroORM app.get(MikroORM) does', async () => {
    const orm = app.get(MikroORM);
    const registrar = app.get(CronRegistrarService);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = testDb
      .prepare(
        `INSERT INTO reservations (trip_id, title, type, status, external_source, external_id, external_owner_user_id, sync_enabled, external_hash)
         VALUES (?, 'AirTrail Flight', 'flight', 'confirmed', 'airtrail', '999', ?, 1, 'stale-hash')`,
      )
      .run(trip.id, user.id);
    const reservationId = result.lastInsertRowid as number;

    const flight: AirtrailFlightRaw = {
      id: 999,
      from: null,
      to: null,
      date: '2026-01-01',
      datePrecision: 'day',
      departure: null,
      arrival: null,
      departureScheduled: null,
      arrivalScheduled: null,
      airline: null,
      flightNumber: null,
      aircraft: null,
      aircraftReg: null,
      note: null,
    };

    const link = app.get(AirtrailLinkService);
    const airtrail = app.get(AirtrailService);
    const client = app.get(AirtrailClient);
    const reservations = app.get(ReservationsService);

    const syncEnabledSpy = vi.spyOn(link, 'syncGloballyEnabled').mockResolvedValue(true);
    const credsSpy = vi.spyOn(airtrail, 'getAirtrailCredentials').mockResolvedValue({
      baseUrl: 'https://airtrail.test',
      apiKey: 'test-key',
      allowInsecureTls: false,
    });
    const flightsSpy = vi.spyOn(client, 'listFlights').mockResolvedValue([flight]);

    let repoRead: unknown;
    let caught: unknown;
    const originalGetReservation = reservations.getReservation.bind(reservations);
    const getReservationSpy = vi.spyOn(reservations, 'getReservation').mockImplementation(async (id, tripId) => {
      try {
        repoRead = await orm.em.getRepository(Users).findOne({ id: user.id });
      } catch (e) {
        caught = e;
      }
      return originalGetReservation(id, tripId);
    });
    // Item 10 (Plan 3d Task 7 review): the tick's own request-context proof
    // stopped at `getReservation` — `syncOwner` only calls `update` AFTER
    // that read, when the incoming flight's hash actually differs from the
    // stored `external_hash` (it does here, 'stale-hash' vs anything real),
    // so a context regression that only showed up on the WRITE half of this
    // same tick was invisible to this test. `update` is real here (not
    // re-mocked), so this also proves it runs to completion without itself
    // throwing `cannotUseGlobalContext`.
    const updateSpy = vi.spyOn(reservations, 'update');

    const isEnabledSpy = vi.spyOn(registrar, 'isEnabled').mockReturnValue(true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // Real onApplicationBootstrap: registers the tick for real through
      // CronRegistrarService.register (task-6's withRequestContext wrap),
      // the same choke point SEAM-003 pins for PlaceShadowRetentionJob.
      await app.get(AirtrailSyncJob).onApplicationBootstrap();
      const job = app.get(SchedulerRegistry).getCronJob('airtrail-sync');
      await job.fireOnTick();
      // cron's CronJob.fireOnTick() only awaits its callback with
      // `waitForCompletion: true` (SEAM-003's own docstring) — register()
      // does not set that option either, so give the awaited
      // withRequestContext(orm, tick) promise a chance to actually settle.
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setImmediate(resolve));

      expect(caught).toBeUndefined();
      expect(repoRead).toBeTruthy();
      expect(getReservationSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalled();

      const suspicious = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);
    } finally {
      registrar.unregister('airtrail-sync');
      isEnabledSpy.mockRestore();
      errSpy.mockRestore();
      getReservationSpy.mockRestore();
      updateSpy.mockRestore();
      flightsSpy.mockRestore();
      credsSpy.mockRestore();
      syncEnabledSpy.mockRestore();
      testDb.prepare('DELETE FROM reservations WHERE id = ?').run(reservationId);
    }
  });
});
