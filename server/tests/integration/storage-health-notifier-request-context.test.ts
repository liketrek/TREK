/**
 * Storage-health-notifier request-context ratchet (Plan 3f Task 4, R3).
 *
 * Task 0's emitter trace (`task-0-report.md`) found one ambiguous path: the
 * "Sync now" backfill sweep (`StorageJobsService.startBackfill`) detaches
 * from its originating admin request (`void driver.backfill(...)`,
 * fire-and-forget), so a `replica_failure` event it reports can reach
 * `StorageHealthNotifierService`'s listener long after the triggering
 * request's own EntityManager fork was meant to be done with. No emitter was
 * found with NO request context at all, but per Task 0's own recommendation
 * ("cheap insurance worth taking regardless"), the listener now forks its
 * OWN fresh request context on every invocation via `withRequestContext` —
 * the same shape `CronRegistrarService.register`'s wrapped tick uses.
 *
 * This test fires the event from a BARE context — plain top-level test code,
 * no HTTP request, no `withRequestContext` wrapper around the emit itself —
 * driving the REAL listener registration through a real `buildApp()` boot
 * (not a bare method call on a hand-built double), and asserts the listener
 * never logs `cannotUseGlobalContext` / "global EntityManager" — the same
 * regression class `boot-sweeps-request-context.test.ts` guards for the
 * seven cron boot sweeps.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { StorageEventsService } from '../../src/nest/storage/storage-events.service';

describe('StorageHealthNotifierService listener runs inside its own request context, outside any active one', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('STORAGE-HEALTH-CTX-001: emitting replica_failure from a bare (non-request) context never logs cannotUseGlobalContext', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // The listener is already registered for real, from buildApp()'s own
      // Nest lifecycle (onApplicationBootstrap runs during app.init()) — no
      // hand-called registration here, per rule 12/13 ("drive the real
      // listener registration, not a bare method call").
      const events = app.get(StorageEventsService);
      events.emitReplicaFailure({ backend: 'ctx-ratchet', key: 'k', op: 'put', error: 'timeout', at: Date.now() });

      // Let the fire-and-forget async dispatch (withRequestContext(...).then(...))
      // settle before asserting.
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setImmediate(resolve));

      const suspicious = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);
    } finally {
      errSpy.mockRestore();
    }
  });
});
