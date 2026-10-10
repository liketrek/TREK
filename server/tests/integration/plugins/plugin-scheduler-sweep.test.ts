/**
 * Plan 3j Task 0 (R-scheduler, plan3j-sql-inventory.md §8 — "the plan's single
 * biggest finding"): `PluginRuntimeService`'s persistent per-plugin scheduler sweep
 * (`fireDueScheduled`) and its GDPR erasure drain (`drainUserErasures`) used to run
 * on a bare, unregistered `setInterval(fn, 30_000)` inside `onApplicationBootstrap`
 * — no `CronRegistrarService` registration, no `withRequestContext` wrap, no
 * test-mode no-op, and (per program rule 12) the one cron-shaped tick in this
 * codebase found bypassing the registrar entirely. Fixed by registering the SAME
 * two calls through `CronRegistrarService.register()` instead, at the same cadence
 * (a six-field, every-30-seconds cron expression — the `cron` package supports an
 * optional leading seconds field; confirmed by reading its README and pinned by the
 * cadence assertion below, PLUGIN_SCHEDULER_SWEEP_CRON in plugin-runtime.service.ts).
 * PR4–PR10 (the sweep/drain's own SQL) stay raw
 * better-sqlite3 in this task — only WHO calls them and WHETHER a request context
 * wraps the call changes here; Task 2 converts their statement bodies on top of
 * this landed registration.
 *
 * Two mandatory tests (task-0-brief.md deliverable 2):
 *
 *  (a) RATCHET (`SCHED-SWEEP-001`/`-002`) — the sweep is registered through
 *      `CronRegistrarService.register()`, not a bare `setInterval`: mocking `cron`'s
 *      `CronJob.from` the same way `cron-registrar.service.test.ts` does and
 *      asserting exactly one job was captured, with the expected name and cadence,
 *      is itself the first mutation-proof (revert to a bare `setInterval` and
 *      `CronJob.from` is never called for this sweep — `h.jobs` stays empty and the
 *      length assertion fails before this file gets anywhere near firing a tick).
 *      Firing that captured tick from a bare context — nothing this file's own test
 *      body sets up ahead of the call — must not log `cannotUseGlobalContext`/
 *      "global EntityManager" (the literal assertion task-0-brief.md deliverable
 *      2(a) asks for) AND must POSITIVELY show a request context was active when
 *      `fireDueScheduled`/`drainUserErasures` ran (`demo-seed-request-context.
 *      test.ts`'s own M2 lesson: a log-line-only check cannot distinguish a wrapped
 *      call from an unwrapped one when the wrapped body doesn't yet touch the ORM —
 *      true here today, since PR4–PR10 haven't converted). A second, harsher
 *      mutation-proof (`SCHED-SWEEP-002`): a `CronRegistrarService` built WITHOUT an
 *      ORM fails the SAME sweep's tick closed with the registrar's own distinct
 *      "no MikroORM available" error (`CRONREG-010`'s exact proof, reproduced here
 *      against `PluginRuntimeService`'s real registration) — proving this sweep
 *      genuinely routes through the registrar's one choke point rather than a
 *      bespoke wrapper of its own that might swallow the missing-context case.
 *
 *  (b) CADENCE/BEHAVIOUR PARITY (`SCHED-SWEEP-003`) — a due one-shot task, a due
 *      recurring task and a queued GDPR erasure are seeded; firing ONE tick through
 *      the REAL registered path (not the private methods called directly) proves:
 *      the one-shot row is deleted BEFORE its delivery is attempted, the recurring
 *      row is re-armed (a later `due_at`) BEFORE its delivery is attempted (crash-
 *      safety ordering — asserted AT THE MOMENT delivery fires, not just as an
 *      end-state, so a future reordering is caught even if delivery itself no-ops),
 *      and the queued erasure row drains once the plugin ACKs — the SAME
 *      assertions the legacy `setInterval`-driven sweep produced, now proven
 *      through `CronRegistrarService.register()`.
 *
 * A fourth case (`SCHED-SWEEP-004`) covers task-0-brief.md deliverable 3, the
 * `onApplicationBootstrap` pre-loop wrap decision: `discoverPlugins`+
 * `installedDepRows` (both raw SQL today, needing no context to run correctly —
 * option (a) wraps them together, ONLY when an ORM is available, rather than
 * gating the whole method body on one, which would have broken
 * `plugin-runtime.boot-no-orm.test.ts`'s already-pinned no-ORM boot behavior; see
 * plugin-runtime.service.ts's own comment at the wrap site) already ran inside a
 * request context by the time this file's shared `runtime` finished booting.
 */
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { NotificationChannelPreferences } from '../../../src/db/entities/NotificationChannelPreferences.entity';
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginEntityMetadata } from '../../../src/db/entities/PluginEntityMetadata.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginMetaMigrations } from '../../../src/db/entities/PluginMetaMigrations.entity';
import { PluginOauthState } from '../../../src/db/entities/PluginOauthState.entity';
import { PluginOauthTokens } from '../../../src/db/entities/PluginOauthTokens.entity';
import { PluginScheduledTasks } from '../../../src/db/entities/PluginScheduledTasks.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { PluginUserErasureQueue } from '../../../src/db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { Settings } from '../../../src/db/entities/Settings.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { createTestAddonsService } from '../../helpers/test-addons';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { RequestContext } from '@mikro-orm/core';
import { SchedulerRegistry } from '@nestjs/schedule';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const h = vi.hoisted(() => ({
  jobs: [] as Array<{
    cronTime: string;
    timeZone?: string;
    start?: boolean;
    onTick: () => unknown;
    stopped: boolean;
    stop(): void;
  }>,
}));
// Same mock shape as tests/unit/nest/cron-registrar.service.test.ts: capture what
// CronRegistrarService.register() hands CronJob.from (including the REAL wrappedTick,
// since register() itself is not mocked) without arming any real timer.
vi.mock('cron', () => ({
  CronJob: {
    from: (opts: { cronTime: string; timeZone?: string; start?: boolean; onTick: () => unknown }) => {
      const job = {
        ...opts,
        stopped: false,
        stop() {
          this.stopped = true;
        },
      };
      h.jobs.push(job);
      return job;
    },
  },
}));

const testDb = createSnapshotTestDb();
let t: TestOrm;
let runtime: PluginRuntimeService;

const prevEnabled = process.env.TREK_PLUGINS_ENABLED;
const prevDir = process.env.TREK_PLUGINS_DIR;
const prevDataDir = process.env.TREK_PLUGINS_DATA_DIR;
let codeRoot: string;
let dataRoot: string;
let preLoopContextSeen: boolean | undefined;

async function buildRuntime(registrar?: CronRegistrarService, orm?: TestOrm['orm']): Promise<PluginRuntimeService> {
  const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
  const addons = await createTestAddonsService(testDb);
  const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
  return new PluginRuntimeService(
    audit,
    addons,
    userSettings,
    t.repo(Plugins),
    t.repo(PluginErrorLog),
    t.repo(PluginScheduledTasks),
    t.repo(PluginUserErasureQueue),
    t.repo(PluginEgressHosts),
    t.repo(PluginSettingsFields),
    t.repo(PluginActions),
    t.repo(PluginUserConfig),
    t.repo(PluginEntityMetadata),
    t.repo(PluginOauthTokens),
    t.repo(PluginOauthState),
    t.repo(PluginMetaMigrations),
    t.repo(PluginCapabilityAudit),
    t.repo(Settings),
    t.repo(NotificationChannelPreferences),
    // Plan 4 Task 4: `uow` is no longer `@Optional()`.
    new UnitOfWork(t.em),
    undefined,
    undefined,
    orm,
    registrar,
  );
}

beforeAll(async () => {
  // Global context disallowed — the production setting (matches CRONREG's own D6
  // suite and plugin-runtime.boot-no-orm.test.ts), so a genuinely unwrapped call
  // really does throw rather than happening to work under a permissive default.
  t = await createTestOrm(testDb, { allowGlobalContext: false });
  process.env.TREK_PLUGINS_ENABLED = 'true';
  // No plugins on disk and none `enabled` in the seeded row set below — discovery
  // and the activate loop find nothing to do, so this file only exercises the
  // scheduler registration, never a real child spawn (plugin-runtime.test.ts /
  // dev-link.test.ts already cover the spawn path). Real (empty) temp dirs rather
  // than the server/data default, so discovery is deterministic across environments.
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-sweep-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-sweep-data-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;

  const registry = new SchedulerRegistry();
  const registrar = new CronRegistrarService(registry, { isTest: () => false } as RuntimeEnvService, t.orm);
  runtime = await buildRuntime(registrar, t.orm);

  // Plan 3j Task 0 deliverable 3 (the onApplicationBootstrap pre-loop wrap): spied
  // BEFORE the one onApplicationBootstrap call this file drives, so SCHED-SWEEP-004
  // can assert a request context was already active when installedDepRows (the
  // second of the two pre-loop reads discoverPlugins+installedDepRows share ONE
  // withRequestContext wrap around, option (a) — see plugin-runtime.service.ts)
  // ran, proving the wrap decision without needing either read to touch the ORM
  // yet (raw SQL until Task 2/3 convert them).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preLoopSpy = vi.spyOn(runtime as any, 'installedDepRows').mockImplementation(async function (
    this: PluginRuntimeService,
  ) {
    preLoopContextSeen = RequestContext.currentRequestContext() !== undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (Object.getPrototypeOf(runtime) as any).installedDepRows.apply(this);
  });
  await runtime.onApplicationBootstrap();
  preLoopSpy.mockRestore();
});

afterAll(async () => {
  if (prevEnabled === undefined) delete process.env.TREK_PLUGINS_ENABLED;
  else process.env.TREK_PLUGINS_ENABLED = prevEnabled;
  if (prevDir === undefined) delete process.env.TREK_PLUGINS_DIR;
  else process.env.TREK_PLUGINS_DIR = prevDir;
  if (prevDataDir === undefined) delete process.env.TREK_PLUGINS_DATA_DIR;
  else process.env.TREK_PLUGINS_DATA_DIR = prevDataDir;
  await runtime.onModuleDestroy();
  await t.close();
  testDb.close();
  fs.rmSync(codeRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});

const settle = async () => {
  // drainUserErasures is fire-and-forget from the tick's own body (parity with the
  // legacy `void this.drainUserErasures();`), so its awaited chain (runDrainOnce's
  // `await this.supervisor.deliverUserErasure(...)`) is still resolving after
  // `onTick()`'s own promise settles — same reasoning boot-sweeps-request-
  // context.test.ts's docstring gives for its own extra `setImmediate` waits.
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

describe('PluginRuntimeService scheduler sweep — registered through CronRegistrarService (Plan 3j Task 0, R-scheduler)', () => {
  it('SCHED-SWEEP-001: registered via CronJob.from (not a bare setInterval) at the exact legacy cadence; firing the captured tick from a bare context logs no cannotUseGlobalContext line and DOES run fireDueScheduled/drainUserErasures inside a live request context', async () => {
    expect(h.jobs).toHaveLength(1);
    expect(h.jobs[0].cronTime).toBe('*/30 * * * * *');
    expect(h.jobs[0].start).toBe(true);

    const contextSeen: Record<string, boolean> = {};
    // Positive proof (demo-seed-request-context.test.ts's own M2 lesson): a
    // log-line-only check can't distinguish "wrapped, body just doesn't touch the
    // ORM yet" from "never wrapped at all" — both produce zero error lines today,
    // since PR4-PR10 stay raw SQL in this task. Recording
    // RequestContext.currentRequestContext() at the instant each private method is
    // entered is the real signal (the same one MikroORM's allowGlobalContext gate
    // reads at query time), and it is what a genuine `withRequestContext` wrap
    // controls, independent of what the wrapped body happens to read.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fireSpy = vi.spyOn(runtime as any, 'fireDueScheduled').mockImplementation(async function (
      this: PluginRuntimeService,
      ...args: unknown[]
    ) {
      contextSeen.fireDueScheduled = RequestContext.currentRequestContext() !== undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Object.getPrototypeOf(runtime) as any).fireDueScheduled.apply(this, args);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drainSpy = vi.spyOn(runtime as any, 'drainUserErasures').mockImplementation(async function (
      this: PluginRuntimeService,
      ...args: unknown[]
    ) {
      contextSeen.drainUserErasures = RequestContext.currentRequestContext() !== undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Object.getPrototypeOf(runtime) as any).drainUserErasures.apply(this, args);
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await h.jobs[0].onTick();
      await settle();

      expect(fireSpy).toHaveBeenCalledTimes(1);
      expect(drainSpy).toHaveBeenCalledTimes(1);
      expect(contextSeen.fireDueScheduled).toBe(true);
      expect(contextSeen.drainUserErasures).toBe(true);

      const suspicious = errSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((line) => /cannotUseGlobalContext|global EntityManager/i.test(line));
      expect(suspicious).toEqual([]);
    } finally {
      fireSpy.mockRestore();
      drainSpy.mockRestore();
      errSpy.mockRestore();
    }
  });

  it('SCHED-SWEEP-002: without an ORM behind the registrar, the SAME sweep\'s tick throws the registrar\'s own "no MikroORM available" error rather than running unwrapped (CRONREG-010, reproduced against the real PluginRuntimeService registration)', async () => {
    const registry2 = new SchedulerRegistry();
    const registrar2 = new CronRegistrarService(registry2, { isTest: () => false } as RuntimeEnvService); // no orm arg
    const runtime2 = await buildRuntime(registrar2, undefined);
    const before = h.jobs.length;
    try {
      await runtime2.onApplicationBootstrap();
      expect(h.jobs).toHaveLength(before + 1);
      const job2 = h.jobs[before];
      let bodyRan = false;
      // Prove the fail-closed error comes from the registrar's own wrapper, not a
      // side effect of the tick body itself ever having run.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(runtime2 as any, 'fireDueScheduled').mockImplementation(async () => {
        bodyRan = true;
      });
      await expect(job2.onTick()).rejects.toThrow(/no MikroORM available/i);
      expect(bodyRan).toBe(false);
    } finally {
      await runtime2.onModuleDestroy();
    }
  });

  it('SCHED-SWEEP-003: a due one-shot task deletes-before-fires, a due recurring task re-arms-before-fires, and a queued GDPR erasure drains on ACK — fired through the REAL registered tick', async () => {
    const pluginId = 'sched-sweep-fixture';
    const now = Date.now();
    const oneShotSeedDueAt = now - 5_000;
    const recurringSeedDueAt = now - 5_000;
    // runDrainOnce's own first pass reaps a `plugin_user_erasure_queue` row as an
    // "orphan" once its plugin_id has no matching `plugins` row AND no data dir on
    // disk — a real installed plugin always has (at least) a `plugins` row, so this
    // fixture needs one too, or the erasure row would be reaped before ever
    // reaching the ACK-gated delivery path this test is actually proving.
    await insertRow(t, Plugins, { id: pluginId, name: pluginId });
    await insertRow(t, PluginScheduledTasks, {
      plugin_id: pluginId,
      name: 'oneshot',
      due_at: oneShotSeedDueAt,
      payload: 'null',
      every_ms: null,
    });
    await insertRow(t, PluginScheduledTasks, {
      plugin_id: pluginId,
      name: 'recurring',
      due_at: recurringSeedDueAt,
      payload: 'null',
      every_ms: 60_000,
    });
    await insertRow(t, PluginUserErasureQueue, { plugin_id: pluginId, user_id: 4242 });

    // Mark the plugin active without a real child spawn — the same technique
    // tests/unit/plugins/supervisor-lifecycle.test.ts already uses to drive
    // PluginSupervisor's status-gated methods directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supervisor = (runtime as any).supervisor;
    supervisor.running.set(pluginId, { id: pluginId, status: 'active' });

    const invokeCalls: Array<{ method: string; payload: unknown }> = [];
    const invokeSpy = vi.spyOn(supervisor, 'invoke').mockImplementation((...args: unknown[]) => {
      const [id, method, payload] = args as [string, string, unknown];
      invokeCalls.push({ method, payload });
      if (method === 'invoke.scheduled') {
        const name = (payload as { name: string }).name;
        // Crash-safety ordering, asserted AT delivery time (not just end-state):
        // the row's disposition write must already have landed by the moment
        // delivery is attempted, since a crash here must never double-fire.
        if (name === 'oneshot') {
          // test-sql-allow: read synchronously inside the delivery call, so it sees the row at that very moment.
          const row = testDb
            .prepare('SELECT id FROM plugin_scheduled_tasks WHERE plugin_id=? AND name=?')
            .get(id, 'oneshot');
          expect(row).toBeUndefined(); // already deleted before delivery
        } else if (name === 'recurring') {
          // test-sql-allow: read synchronously inside the delivery call, so it sees the row at that very moment.
          const row = testDb
            .prepare('SELECT due_at FROM plugin_scheduled_tasks WHERE plugin_id=? AND name=?')
            .get(id, 'recurring') as { due_at: number } | undefined;
          expect(row).toBeDefined();
          expect(row!.due_at).toBeGreaterThan(recurringSeedDueAt); // already re-armed before delivery
        }
      }
      return Promise.resolve({});
    });

    try {
      await h.jobs[0].onTick();
      await settle();

      // Same-shape delivery calls the legacy setInterval-driven sweep made.
      expect(
        invokeCalls
          .filter((c) => c.method === 'invoke.scheduled')
          .map((c) => (c.payload as { name: string }).name)
          .sort(),
      ).toEqual(['oneshot', 'recurring']);
      expect(invokeCalls).toContainEqual({ method: 'invoke.deleteUserData', payload: { userId: 4242 } });

      const oneShotRow = await findRow(t, PluginScheduledTasks, { plugin_id: pluginId, name: 'oneshot' });
      expect(oneShotRow).toBeNull();
      const recurringRow = await findRow(t, PluginScheduledTasks, { plugin_id: pluginId, name: 'recurring' });
      expect(recurringRow).not.toBeNull();
      // Re-armed to Date.now() (read fresh, at fire time — not the seed timestamp)
      // + every_ms: bounded rather than exact, since real wall-clock time elapses
      // between seeding the row and the tick firing it.
      expect(recurringRow!.due_at).toBeGreaterThanOrEqual(now + 60_000);
      expect(recurringRow!.due_at).toBeLessThan(now + 60_000 + 30_000);
      const erasureRow = await findRow(t, PluginUserErasureQueue, { plugin_id: pluginId, user_id: 4242 });
      expect(erasureRow).toBeNull(); // drained on ACK
    } finally {
      invokeSpy.mockRestore();
      supervisor.running.delete(pluginId);
    }
  });

  it('SCHED-SWEEP-004: the onApplicationBootstrap pre-loop reads (discoverPlugins + installedDepRows, option (a) — plugin-runtime.service.ts) already ran inside a request context', () => {
    // Recorded in beforeAll, before this file's one onApplicationBootstrap call —
    // see that block's own comment. A regression that drops the wrap (or narrows it
    // to only one of the two reads while calling them separately, unwrapped) fails
    // this assertion directly, independent of PR4-PR53's own conversion state.
    expect(preLoopContextSeen).toBe(true);
  });
});
