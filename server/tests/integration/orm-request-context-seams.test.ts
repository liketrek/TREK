/**
 * ORM request-context seam ratchet (task-6-fix-brief.md item 2;
 * task-6-review-template.md's Important 4 / M-E). task-6-fix-brief.md item 1
 * made the three D6 choke points — CronRegistrarService.register/runOnBoot,
 * PluginSupervisor.onMessage's dispatch, TrekWsAdapter.bindMessageHandlers —
 * THROW when their ORM/thunk is absent, and every unit suite (WSAD-040,
 * CRONREG-010, CTX-PLUGIN-001) asserts that throw. None of those tests can
 * tell a genuinely wired production seam apart from a hand-built double that
 * happens to pass no ORM — they'd pass either way. This is the one test that
 * pins production wiring itself: that `buildApp()` actually populates
 * `CronRegistrarService`'s and `PluginRuntimeService`'s `@Optional()` ORM
 * params, `PluginSupervisor`'s `resolveOrm` thunk AND `TrekWsAdapter`'s `orm`
 * constructor argument with the SAME MikroORM instance `app.get(MikroORM)`
 * resolves — so a future refactor that quietly drops one of those FOUR
 * constructor arguments fails here, not silently in production.
 *
 * task-6-rereview.md I3: the fourth seam (`TrekWsAdapter`) had no ratchet at
 * all — `bootstrap.ts`'s `new TrekWsAdapter(boundHttpServer, orm)` could lose
 * its second argument and only WSAD-040 (which builds its own adapter, not
 * production's) would still pass, while every real WS frame would start
 * throwing synchronously inside a `ws` `'message'` listener — an
 * uncaughtException with no host-side net, i.e. process death, not one failed
 * request. `TrekWsAdapter`'s `orm` is a plain constructor param on a class
 * `bootstrap.ts` builds with `new` (never through Nest DI), so it is reached
 * the same way this file already reaches `PluginSupervisor.resolveOrm()` —
 * through the concrete object the app graph is actually holding, here
 * `NestApplication`'s own `private readonly config: ApplicationConfig`
 * (`app.useWebSocketAdapter` calls `this.config.setIoAdapter(adapter)`; see
 * `@nestjs/core`'s `nest-application.js`/`.d.ts` — the field is `config`, NOT
 * `applicationConfig`, despite the class's own name).
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { PlaceShadowPicks } from '../../src/db/entities/PlaceShadowPicks.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { PlaceShadowRetentionJob } from '../../src/nest/place-shadow/place-shadow.job';
import { PluginRuntimeService } from '../../src/nest/plugins/plugin-runtime.service';
import { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import { StorageService } from '../../src/nest/storage/storage.service';
import { generateToken } from '../helpers/auth';
import { createUser } from '../helpers/factories';
import { countRows, insertRow } from '../helpers/factories/rows';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('ORM request-context seams populated in production', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('SEAM-001: CronRegistrarService, PluginRuntimeService, PluginSupervisor.resolveOrm() and TrekWsAdapter all resolve the SAME MikroORM app.get(MikroORM) does', () => {
    const orm = app.get(MikroORM);

    const cronRegistrar = app.get(CronRegistrarService) as unknown as { orm?: MikroORM };
    expect(cronRegistrar.orm).toBe(orm);

    const runtime = app.get(PluginRuntimeService) as unknown as {
      orm?: MikroORM;
      supervisor: { resolveOrm?: () => unknown };
    };
    expect(runtime.orm).toBe(orm);
    expect(runtime.supervisor.resolveOrm?.()).toBe(orm);

    // task-6-rereview.md I3 — the fourth seam, with no ratchet before this test.
    const wsAdapter = (app as unknown as { config: { getIoAdapter(): { orm?: MikroORM } } }).config.getIoAdapter();
    expect(wsAdapter.orm).toBe(orm);
  });

  /**
   * SEAM-002 (Plan 3b Task 0): `applyPlatformUploads`'s `orm` parameter is a
   * NEW seam — `bootstrap.ts:117` now passes `app.get(MikroORM)` into it, and
   * unlike the four seams SEAM-001 pins, nothing keeps that reference on an
   * introspectable field (it's captured in `platform.routes.ts`'s closure
   * around the registered `/uploads/photos/:filename` handler). So this is a
   * behavioural identity proof instead of a structural one: drive the REAL
   * pre-init route through the REAL booted app, force a repository read at
   * the earliest point inside the handler, and confirm it resolves against
   * the exact `MikroORM` this app booted with — the same one every other row
   * in this file checks — by reading back a user this same test just created
   * through the SAME connection (a foreign/unwired ORM instance would not
   * see that row at all).
   */
  it('SEAM-002: the pre-init /uploads/photos/* route (applyPlatformUploads, bootstrap.ts) forks a request context off the SAME MikroORM app.get(MikroORM) does', async () => {
    const orm = app.get(MikroORM);
    const { user } = createUser(testDb);
    const storage = app.get(StorageService);
    let found: unknown;
    let caught: unknown;
    const spy = vi.spyOn(storage, 'exists').mockImplementation(async () => {
      try {
        found = await orm.em.getRepository(Users).findOne({ id: user.id });
      } catch (e) {
        caught = e;
      }
      return true;
    });
    try {
      const httpApp = app.getHttpAdapter().getInstance() as Application;
      // The file need not exist: storage.exists is stubbed above, and the
      // identity proof is the repository read, not the HTTP response body.
      await request(httpApp)
        .get('/uploads/photos/seam-002-does-not-need-to-exist.jpg')
        .set('Authorization', `Bearer ${generateToken(user.id)}`);
      expect(caught).toBeUndefined();
      expect(found).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
  });

  /**
   * Plan 3c Task 0b (R9, inventory §12b): `PlaceShadowRetentionJob` only
   * `register()`s a nightly tick — it has no `runOnBoot` sweep, so
   * `boot-sweeps-request-context.test.ts`'s BOOT-SWEEP-001 cannot see it at
   * all. `CronRegistrarService.register()` already wraps every registered
   * tick in `withRequestContext` unconditionally (fail-closed on a missing
   * `orm`, `cron-registrar.service.ts:87-92`) — but nothing before this task
   * drove THIS job's own `onApplicationBootstrap` against the real,
   * production-wired registrar to prove the whole path (register → a real
   * `cron` `CronJob` lands in `SchedulerRegistry` → firing its tick resolves
   * with no missing-context error) actually holds, the Plan 3a `*-003`
   * per-job pattern for a register-only job.
   */
  it('SEAM-003: PlaceShadowRetentionJob registers against the real CronRegistrarService, and firing its tick runs inside the same request context with no missing-context error', async () => {
    const orm = app.get(MikroORM);
    const registrar = app.get(CronRegistrarService);
    // 0b security review F-B4: a structural identity proof, matching
    // SEAM-001/002's shape, not just the behavioural one below — a future
    // refactor that quietly drops CronRegistrarService's ORM constructor arg
    // (but leaves SOME orm-shaped stub wired) would still pass the
    // behavioural half if that stub happened to work; this catches it
    // directly, the same way SEAM-001 already does for the OTHER three
    // choke points.
    expect((registrar as unknown as { orm?: MikroORM }).orm).toBe(orm);

    const isEnabledSpy = vi.spyOn(registrar, 'isEnabled').mockReturnValue(true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // 999 days old, in the `datetime('now')` text form the column defaults to.
      const expiredAt = new Date(Date.now() - 999 * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');
      await insertRow(orm, PlaceShadowPicks, {
        created_at: expiredAt,
        query: 'seam-003',
        source: 'nominatim',
        live_rank: 1,
        live_count: 1,
        picked_name: 'expired pick',
        picked_lat: 0,
        picked_lng: 0,
      });

      // Real bug found converting `purgeExpired` to a genuinely async
      // repository call (0b security review F-B4): the `cron` package's
      // `CronJob.fireOnTick()` only awaits its callback when the job is
      // constructed with `waitForCompletion: true`
      // (`node_modules/cron/dist/job.js`'s `fireOnTick`) — `cron-registrar
      // .service.ts`'s `CronJob.from({...})` never sets that option, so
      // `await job.fireOnTick()` resolves as soon as the SYNCHRONOUS part of
      // `wrappedTick` returns, before the awaited `withRequestContext(orm,
      // () => onTick())` promise (and therefore the repository delete
      // inside it) has actually settled. Verified directly: without the
      // spy below, `remaining.n` read `1`, not `0` — a race, not a context
      // failure (the previous, all-synchronous `better-sqlite3` DELETE never
      // exposed this gap). Spying on the job's own `tick()` and awaiting the
      // promise IT returns is the fix — the same promise `wrappedTick`
      // itself awaits, just observed from outside.
      const jobInstance = app.get(PlaceShadowRetentionJob);
      const tickSpy = vi.spyOn(jobInstance, 'tick');
      jobInstance.onApplicationBootstrap();
      const job = app.get(SchedulerRegistry).getCronJob('place-shadow-retention');
      await job.fireOnTick();
      await tickSpy.mock.results[0]?.value;

      const suspicious = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);

      // Plan 3c Task 1: `purgeExpired` is now `PlaceShadowPicksRepository`-backed
      // (a real ORM call, not raw `better-sqlite3`), so this outcome is now a
      // load-bearing mutation ratchet on its own — removing the
      // `withRequestContext` wrap in `cron-registrar.service.ts`'s `register()`
      // makes the repository call throw inside `PlaceShadowRetentionJob.tick`'s
      // own try/catch, and the row survives (verified by hand, reverted).
      expect(await countRows(orm, PlaceShadowPicks, { query: 'seam-003' })).toBe(0);
    } finally {
      registrar.unregister('place-shadow-retention');
      isEnabledSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});
