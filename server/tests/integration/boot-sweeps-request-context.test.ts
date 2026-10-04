/**
 * Boot-sweep request-context regression guard (task-6-review-parity.md
 * Critical C1; task-6-fix-brief.md item 7; rewritten per task-6-rereview.md
 * I2).
 *
 * `journey-thumbs.job.ts`'s `onApplicationBootstrap` used to call
 * `void this.sweep()` directly, bypassing `CronRegistrarService`'s
 * request-context wrapper entirely — the one place every SCHEDULED tick
 * gets it. Once `sweepOrphanThumbs` went repository-backed
 * (`AddonsService.isAddonEnabled`), that boot-time call threw
 * `cannotUseGlobalContext` on EVERY production boot, silently, because the
 * job's own try/catch swallowed it into a log line about the sweep itself.
 * The smoke boot reproduced it twice. Every `onApplicationBootstrap` boot
 * sweep across the seven job providers listed in the parity review now
 * routes through `CronRegistrarService.runOnBoot` instead.
 *
 * I2's finding: the first version of this file never actually invoked any
 * job's `onApplicationBootstrap` — it hand-called
 * `registrar.runOnBoot('journey-thumbs-boot', () => job.sweep())` for each
 * job, re-implementing the very routing under test. Reverting
 * `journey-thumbs.job.ts`'s boot call back to the bare `void this.sweep()` —
 * C1 verbatim — left that version green, because the mutation only changes
 * what `onApplicationBootstrap` does, and nothing here ever called it.
 *
 * This version drives the eight jobs for real: `CronRegistrarService`'s
 * `isEnabled()` (false under `NODE_ENV=test`, `SCHED-GATE`) is forced true so
 * each job's own `onApplicationBootstrap` doesn't return before reaching its
 * boot sweep, `register()` is stubbed to a no-op so no timer is armed (its
 * production behaviour is CRONREG's own suite, not this file's job), and
 * `runOnBoot` is wrapped with a spy that calls straight through to the real,
 * production-wired implementation (`orm` is `app.get(MikroORM)` — pinned by
 * orm-request-context-seams.test.ts) while collecting every promise it
 * returns. Four of the eight jobs (`JourneyThumbsJob`, `PlacePhotoCacheJob`,
 * `TrekPhotoCacheJob`, `PlaceRegionsRepairJob`) call `runOnBoot` fire-and-forget
 * (`void this.registrar.runOnBoot(...)`) rather than awaiting it, so a
 * mutation that routes one of them back to a bare `void this.sweep()` — i.e.
 * bypassing `runOnBoot` (and this spy) altogether — produces a promise this
 * file never captures either; the extra macrotask ticks after
 * `Promise.all(collected)` give that unawaited call a chance to run (and log)
 * before the assertion, so the regression still fails the test even though
 * its promise was never in `collected`.
 *
 * task-6-rereview2.md M2: the log-line assertion alone is timing-based, not
 * structural, and in practice only `journey-thumbs-boot` and
 * `place-regions-repair-boot` make it load-bearing — the other six sweeps are
 * raw SQL that never reaches the EM, so a job silently routed back to a bare
 * `void this.sweep()` (bypassing `runOnBoot` entirely) would fail here only for
 * those two; the per-job unit test is what actually catches the rest. This
 * file drives all eight jobs' REAL `onApplicationBootstrap`, each of which
 * routes through `runOnBoot` — but that routing itself was previously
 * unasserted here. The
 * second expectation below asserts it directly: every one of the eight boot
 * names was passed to `runOnBoot`, so a job re-routed around the registrar
 * fails HERE, not only in its own `*-00N` per-job suite. `journey-thumbs-boot`
 * and `place-regions-repair-boot` remain the sweeps whose bodies reach a
 * repository, so they are what the log-line assertion below is actually
 * exercising.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';

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
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn(), getOnlineUserIds: vi.fn(() => []) }));

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import { JourneyThumbsJob } from '../../src/nest/memories/journey-thumbs.job';
import { PlacePhotoCacheJob } from '../../src/nest/place-photos/place-photo-cache.job';
import { TrekPhotoCacheJob } from '../../src/nest/memories/trek-photo-cache.job';
import { ReminderJobsService } from '../../src/nest/notifications/reminder-jobs.service';
import { DocSyncJob } from '../../src/nest/doc-sync/doc-sync.job';
import { AirtrailSyncJob } from '../../src/nest/integrations/airtrail-sync.job';
import { DawarichSyncJob } from '../../src/nest/integrations/dawarich-sync.job';
import { AirportsService } from '../../src/nest/airports/airports.service';
import { PlaceRegionsRepairJob } from '../../src/nest/atlas/place-regions-repair.job';

describe('Every onApplicationBootstrap boot sweep runs inside a request context', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('BOOT-SWEEP-001: the eight jobs\' plus AirportsService\'s REAL onApplicationBootstrap, driven through the real production-wired CronRegistrarService, each routes through runOnBoot (structurally asserted), and journey-thumbs and place-regions-repair — the sweeps that reach a repository today — never log cannotUseGlobalContext / "global EntityManager"', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const registrar = app.get(CronRegistrarService);
    const isEnabledSpy = vi.spyOn(registrar, 'isEnabled').mockReturnValue(true);
    // No-op: this file is about what a fired boot sweep does, not about
    // arming a real cron timer on a shared registry (CRONREG's own suite
    // covers register() itself).
    const registerSpy = vi.spyOn(registrar, 'register').mockImplementation(() => true);
    const originalRunOnBoot = registrar.runOnBoot.bind(registrar);
    const collected: Promise<void>[] = [];
    const runOnBootSpy = vi.spyOn(registrar, 'runOnBoot').mockImplementation((name, fn) => {
      const p = originalRunOnBoot(name, fn);
      collected.push(p);
      return p;
    });
    try {
      // Real onApplicationBootstrap calls, not hand-called runOnBoot — the whole
      // point of I2's fix. Four are fire-and-forget (void return type); four are
      // awaited because the job's own onApplicationBootstrap awaits runOnBoot.
      app.get(JourneyThumbsJob).onApplicationBootstrap();
      app.get(PlacePhotoCacheJob).onApplicationBootstrap();
      app.get(TrekPhotoCacheJob).onApplicationBootstrap();
      app.get(PlaceRegionsRepairJob).onApplicationBootstrap();
      await app.get(ReminderJobsService).onApplicationBootstrap();
      await app.get(DocSyncJob).onApplicationBootstrap();
      await app.get(AirtrailSyncJob).onApplicationBootstrap();
      await app.get(DawarichSyncJob).onApplicationBootstrap();
      // Plan 3d Task 0: `AirportsService` is a service, not a `*.job.ts`
      // provider (it has no `register()`/cron tick of its own — no
      // `isEnabled()` gate either, inventory §12), so it sits outside the
      // eight-job loop above; its `onApplicationBootstrap` still routes its
      // raw-SQL flight-endpoint backfill through the same `runOnBoot` choke
      // point and belongs in this ratchet's name list.
      await app.get(AirportsService).onApplicationBootstrap();

      await Promise.all(collected);
      // Settle any pending microtasks/macrotasks a fire-and-forget boot call left
      // behind (see the file docstring: this is what still catches a job routed
      // back to a bare `void this.sweep()`, whose promise never lands in `collected`).
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setImmediate(resolve));

      const suspicious = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);

      // task-6-rereview2.md M2: structural, not timing-based — a job routed back
      // to a bare `void this.sweep()` (bypassing runOnBoot entirely) fails HERE
      // by name, regardless of whether its sweep body happens to touch a
      // repository yet.
      expect(runOnBootSpy.mock.calls.map((c) => c[0]).sort()).toEqual([
        'airports-flight-endpoints-boot',
        'airtrail-sync-boot',
        'dawarich-sync-boot',
        'docsync-boot',
        'journey-thumbs-boot',
        'place-photo-cache-boot',
        'place-regions-repair-boot',
        'reminder-jobs-boot',
        'trek-photo-cache-boot',
      ]);
    } finally {
      errSpy.mockRestore();
      isEnabledSpy.mockRestore();
      registerSpy.mockRestore();
      runOnBootSpy.mockRestore();
    }
  });
});
