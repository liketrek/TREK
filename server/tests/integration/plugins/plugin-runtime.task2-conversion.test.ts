/**
 * Plan 3j Task 2 — mutation/parity proofs the brief names explicitly, on top of the
 * pre-existing (and still-green) `plugin-runtime.test.ts`/`plugins-service.test.ts`
 * suites: R-install-gates' three named accept+refuse pairs (PR17/PR26/PR28), the
 * uninstall cascade's all-or-nothing rollback (R-uninstall, one transaction since
 * the transaction sweep), the egress-host DELETE+loop-INSERT's transaction rollback proof
 * (R-uninstall's ONE named exception), PS7/PS9/PS11's triple-duplicate SELECT
 * collapsing onto one `PluginUserConfigRepository.findConfig` method, and a two-tick
 * race for the scheduler sweep + the GDPR erasure drain.
 *
 * Full migrated schema (`createSnapshotTestDb`) — the same real-schema harness
 * `plugin-scheduler-sweep.test.ts`/`plugin-runtime.boot-no-orm.test.ts` already use —
 * so every one of the 14 repositories this task injects reads/writes real columns,
 * not a hand-slimmed fixture table.
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
import { PluginRuntimeService, PluginDependencyError } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { createTestAddonsService } from '../../helpers/test-addons';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { SchedulerRegistry } from '@nestjs/schedule';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let codeRoot: string;
let dataRoot: string;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  process.env.TREK_PLUGINS_ENABLED = 'true';
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-t2-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-t2-data-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
});

afterAll(async () => {
  delete process.env.TREK_PLUGINS_ENABLED;
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  await t.close();
  testDb.close();
  fs.rmSync(codeRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});

async function buildRuntime(registrar?: CronRegistrarService): Promise<PluginRuntimeService> {
  const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
  const addons = await createTestAddonsService(testDb);
  const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
  const uow = new UnitOfWork(t.em);
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
    // Plan 4 Task 4: `uow` is no longer `@Optional()` — ordered ahead of
    // `registry?`/`hostFactory?`, matching the real constructor's own order.
    uow,
    undefined,
    undefined,
    t.orm,
    registrar,
  );
}

function buildPluginsService(): PluginsService {
  return new PluginsService(
    // A real AddonsService is not needed by any method this file calls.
    { isAddonEnabled: async () => true } as never,
    t.repo(Plugins),
    t.repo(PluginEgressHosts),
    t.repo(PluginSettingsFields),
    t.repo(PluginActions),
    t.repo(PluginUserConfig),
    t.repo(PluginErrorLog),
    t.repo(PluginCapabilityAudit),
  );
}

async function seedPlugin(
  id: string,
  overrides: Partial<{
    enabled: number;
    granted_permissions: string;
    permissions: string;
    trek_range: string;
    api_version: number;
    version: string;
    author_pubkey: string;
  }> = {},
): Promise<void> {
  await insertRow(t, Plugins, {
    id,
    name: id,
    status: 'inactive',
    enabled: overrides.enabled ?? 0,
    version: overrides.version ?? '1.0.0',
    trek_range: overrides.trek_range ?? '>=3.0.0',
    api_version: overrides.api_version ?? 1,
    permissions: overrides.permissions ?? '["db:own"]',
    granted_permissions: overrides.granted_permissions ?? '["db:own"]',
    capabilities: '{}',
    config: '{}',
    author_pubkey: overrides.author_pubkey ?? null,
  });
}

/** The plugin's stored row; fails the case when there is none. */
async function pluginRow(id: string) {
  const row = await findRow(t, Plugins, { id });
  if (!row) throw new Error(`no plugins row for ${id}`);
  return row;
}

describe('Plan 3j Task 2 — R-install-gates named accept+refuse pairs (PR17/PR26/PR28)', () => {
  let rt: PluginRuntimeService;
  beforeAll(async () => {
    rt = await buildRuntime();
  });

  describe('PR17 — version-range + permission-grant gate (assertActivatable)', () => {
    it('INSTALL-GATE-PR17-ACCEPT: a plugin whose declared range admits this host, with no permission widening, passes the gate (activate resolves, never PluginDependencyError)', async () => {
      await seedPlugin('pr17-accept', { trek_range: '>=3.0.0 <99.0.0' });
      // The gate itself (assertActivatable, reading PR17's row through
      // PluginsRepository.findActivationGate) is the thing under test — the actual
      // child spawn is stubbed out (already covered end to end by
      // plugin-runtime.test.ts's own activation suite, real code on disk, real spawn).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supervisorSpy = vi.spyOn((rt as any).supervisor, 'activate').mockResolvedValue(undefined);
      await expect(rt.activate('pr17-accept')).resolves.toBeUndefined();
      expect(supervisorSpy).toHaveBeenCalledTimes(1); // the gate let it through to the spawn call
      supervisorSpy.mockRestore();
    });

    it('INSTALL-GATE-PR17-REFUSE: a plugin whose declared range excludes this host is refused, never spawned', async () => {
      await seedPlugin('pr17-refuse', { trek_range: '>=99.0.0' });
      const err = await rt.activate('pr17-refuse').catch((e) => e);
      expect(err).toBeInstanceOf(PluginDependencyError);
      expect(err).toMatchObject({ code: 'TREK_VERSION_INCOMPATIBLE' });
      expect(rt.isActive('pr17-refuse')).toBe(false);
    });
  });

  describe("PR26 — update()'s pre-update snapshot feeding the permission-widening diff", () => {
    const fakeRegistry = (perms: string[]) =>
      ({
        resolveVersion: vi.fn(async () => ({ version: '2.0.0' })),
        install: vi.fn(async (id: string) => {
          await updateRows(t, Plugins, { id }, { permissions: JSON.stringify(perms) });
          return { id, version: '2.0.0' };
        }),
      }) as unknown as import('../../../src/nest/plugins/registry/registry.service').PluginRegistryService;

    it('INSTALL-GATE-PR26-ACCEPT: no new permissions on update -> activated: true, PR26 snapshot read via the repository', async () => {
      await seedPlugin('pr26-accept2', { enabled: 1, permissions: '["db:own"]', granted_permissions: '["db:own"]' });
      const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
      const addons = await createTestAddonsService(testDb);
      const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
      const rtU = new PluginRuntimeService(
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
        new UnitOfWork(t.em),
        fakeRegistry(['db:own']),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtU as any).supervisor, 'activate').mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtU as any).supervisor, 'disable').mockResolvedValue(undefined);
      await rtU.activate('pr26-accept2');
      const res = await rtU.update('pr26-accept2');
      expect(res).toMatchObject({ activated: true, newPermissions: [], newEgress: [] });
    });

    it('INSTALL-GATE-PR26-REFUSE: a widened permission set on update leaves the plugin inactive with the delta reported', async () => {
      await seedPlugin('pr26-refuse', { enabled: 1, permissions: '["db:own"]', granted_permissions: '["db:own"]' });
      const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
      const addons = await createTestAddonsService(testDb);
      const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
      const rtU = new PluginRuntimeService(
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
        new UnitOfWork(t.em),
        fakeRegistry(['db:own', 'db:read:trips']),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtU as any).supervisor, 'activate').mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtU as any).supervisor, 'disable').mockResolvedValue(undefined);
      await rtU.activate('pr26-refuse');
      const res = await rtU.update('pr26-refuse');
      expect(res.activated).toBe(false);
      expect(res.newPermissions).toEqual(['db:read:trips']);
    });
  });

  describe("PR28 — retrust()'s signing-key TOFU comparison", () => {
    const registryFor = (id: string) =>
      ({
        assertRetrustable: vi.fn(async (_id: string, key: string) => ({ authorPublicKey: key })),
        install: vi.fn(async (_id: string, opts?: { retrustKey?: string }) => {
          await updateRows(t, Plugins, { id }, { author_pubkey: opts?.retrustKey, version: '2.0.0' });
          return { id, version: '2.0.0' };
        }),
      }) as unknown as import('../../../src/nest/plugins/registry/registry.service').PluginRegistryService;

    it('INSTALL-GATE-PR28-ACCEPT: a genuinely rotated key is pinned, read through PluginsRepository.findAuthorPubkey', async () => {
      await seedPlugin('pr28-accept', { enabled: 1, author_pubkey: 'OLDKEY' });
      const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
      const addons = await createTestAddonsService(testDb);
      const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
      const registry = registryFor('pr28-accept');
      const rtR = new PluginRuntimeService(
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
        new UnitOfWork(t.em),
        registry,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtR as any).supervisor, 'activate').mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((rtR as any).supervisor, 'disable').mockResolvedValue(undefined);
      await rtR.retrust('pr28-accept', '2.0.0', 'NEWKEY', { userId: 1 });
      expect(registry.assertRetrustable).toHaveBeenCalledWith('pr28-accept', 'NEWKEY');
      const row = await pluginRow('pr28-accept');
      expect(row.author_pubkey).toBe('NEWKEY');
    });

    it('INSTALL-GATE-PR28-REFUSE: an invalid signature is not re-trustable — the pinned key is untouched', async () => {
      await seedPlugin('pr28-refuse', { enabled: 1, author_pubkey: 'OLDKEY' });
      const audit = new AuditService(t.repo(AuditLog), t.repo(Users));
      const addons = await createTestAddonsService(testDb);
      const userSettings = new PluginUserSettingsService(t.repo(PluginSettingsFields), t.repo(PluginUserConfig));
      const registry = registryFor('pr28-refuse');
      vi.mocked(registry.assertRetrustable).mockRejectedValue(new Error('nothing to re-trust'));
      const rtR = new PluginRuntimeService(
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
        new UnitOfWork(t.em),
        registry,
      );
      await expect(rtR.retrust('pr28-refuse', '2.0.0', 'NEWKEY', { userId: 1 })).rejects.toThrow(/nothing to re-trust/);
      expect(registry.install).not.toHaveBeenCalled();
      const row = await pluginRow('pr28-refuse');
      expect(row.author_pubkey).toBe('OLDKEY');
    });
  });
});

describe('R-uninstall: the cascade is one transaction', () => {
  it('CASCADE-PARTIAL-001: a failure partway through the cascade rolls every earlier delete back, and the data directory stays', async () => {
    const rt = await buildRuntime();
    const id = 'cascade-partial';
    await seedPlugin(id);
    await insertRow(t, PluginSettingsFields, { plugin_id: id, field_key: 'k', scope: 'instance' });
    await insertRow(t, PluginScheduledTasks, { plugin_id: id, name: 'poll', due_at: 0 });
    await insertRow(t, PluginErrorLog, { plugin_id: id, level: 'error', message: 'x' });
    await insertRow(t, PluginEntityMetadata, {
      plugin_id: id,
      entity_type: 'place',
      entity_id: 1,
      key: 'k',
      value: 'v',
    });

    // Simulate a crash INSIDE the cascade, between plugin_scheduled_tasks (deletes
    // cleanly, unconditional, no try/catch) and plugin_error_log (the next
    // unconditional delete, inside the deleteData branch).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorLogRepo = (rt as any).pluginErrorLog;
    const spy = vi
      .spyOn(errorLogRepo, 'deleteAllForPlugin')
      .mockRejectedValueOnce(new Error('simulated mid-cascade crash'));

    const dataDir = path.join(dataRoot, id);
    fs.mkdirSync(dataDir, { recursive: true });

    await expect(rt.uninstall(id, true)).rejects.toThrow(/simulated mid-cascade crash/);
    spy.mockRestore();

    // Everything before the simulated crash point was rolled back with it: a half
    // uninstall used to leave settings, tasks and metadata for a later plugin that
    // reuses the id to inherit.
    expect(await countRows(t, PluginSettingsFields, { plugin_id: id })).toBe(1);
    expect(await countRows(t, PluginScheduledTasks, { plugin_id: id })).toBe(1);
    expect(await countRows(t, PluginErrorLog, { plugin_id: id })).toBe(1);
    expect(await countRows(t, PluginEntityMetadata, { plugin_id: id })).toBe(1);
    expect(await countRows(t, Plugins, { id })).toBe(1);
    // The data directory goes only after the rows commit.
    expect(fs.existsSync(dataDir)).toBe(true);
  });
});

describe("Plan 3j Task 2 — R-uninstall's ONE named transaction: PR22/PR23 egress-host replace", () => {
  it('EGRESS-TX-ROLLBACK-001: a simulated failure mid-write leaves the OLD egress-host set intact, not partially cleared', async () => {
    const rt = await buildRuntime();
    const id = 'egress-tx';
    await seedPlugin(id, { permissions: '["http:outbound"]', granted_permissions: '["http:outbound"]' });
    await updateRows(t, Plugins, { id }, { operator_egress: 1 });
    await rt.setOperatorEgressHosts(id, ['old-a.example.com', 'old-b.example.com']);
    expect((await rt.operatorEgressHosts(id)).sort()).toEqual(['old-a.example.com', 'old-b.example.com']);

    // Plan 3j Task 7 fix (must-land 4a, task-7-review.md): mocking the WHOLE
    // `replaceAllForPlugin` call (the old shape of this test) throws before the real
    // DELETE ever runs, so it proves nothing about the transaction — M13 (deleting the
    // `uow.transactional` wrapper entirely) still passed against it. Spy on the per-host
    // `upsert` call INSIDE `replaceAllForPlugin` instead, and only throw on the SECOND
    // host: the real DELETE and the real first-host INSERT both already happened by the
    // time this throws, so the assertion below can only pass if the transaction actually
    // rolled both of them back, not just skipped a write that was never attempted.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const egressRepo = (rt as any).pluginEgressHosts;
    const originalUpsert = egressRepo.upsert.bind(egressRepo);
    const spy = vi
      .spyOn(egressRepo, 'upsert')
      .mockImplementation(async (data: { plugin_id: string; host: string }, ...rest: unknown[]) => {
        if (data.host === 'boom') throw new Error('simulated mid-write failure');
        return originalUpsert(data, ...rest);
      });

    await expect(rt.setOperatorEgressHosts(id, ['new-a.example.com', 'boom'])).rejects.toThrow(
      /simulated mid-write failure/,
    );
    spy.mockRestore();

    // The OLD set survives untouched — the transaction rolled the DELETE AND the
    // already-succeeded 'new-a.example.com' insert back too, not a partially-cleared or
    // partially-replaced allow-list.
    expect((await rt.operatorEgressHosts(id)).sort()).toEqual(['old-a.example.com', 'old-b.example.com']);
  });
});

describe('Plan 3j Task 2 — PS7/PS9/PS11: the triple-duplicate SELECT collapses onto ONE PluginUserConfigRepository.findConfig call', () => {
  it("PS-USERCONFIG-PARITY-001: getUserConfig, setUserConfig's pre-write check and getUserConfigDecrypted all read the SAME stored row identically", async () => {
    const svc = buildPluginsService();
    const id = 'ps-parity';
    await seedPlugin(id);
    await insertRow(t, PluginSettingsFields, { plugin_id: id, field_key: 'apiKey', scope: 'user', secret: 1 });
    await insertRow(t, PluginSettingsFields, { plugin_id: id, field_key: 'units', scope: 'user', secret: 0 });

    await svc.updateUserConfig(id, 7, { apiKey: 'sk-live', units: 'metric' });

    // PS7 (getUserConfig, masked) and PS11 (getUserConfigDecrypted, plaintext) both
    // resolve through the SAME repository method (`findConfig`) as PS9's pre-write
    // check inside updateUserConfig above — all three must agree on what is stored.
    const masked = await svc.getUserConfig(id, 7);
    const decrypted = await svc.getUserConfigDecrypted(id, 7);
    expect(masked.units).toBe('metric');
    expect(masked.apiKey).toBe('••••••••'); // PS7: secret masked
    expect(decrypted.units).toBe('metric');
    expect(decrypted.apiKey).toBe('sk-live'); // PS11: secret decrypted, host-only
  });
});

describe('Plan 3j Task 2 — two racing ticks (scheduler claim/re-arm + erasure drain)', () => {
  let registry: SchedulerRegistry;
  let registrar: CronRegistrarService;
  let rt: PluginRuntimeService;

  beforeAll(async () => {
    registry = new SchedulerRegistry();
    registrar = new CronRegistrarService(registry, { isTest: () => false } as RuntimeEnvService, t.orm);
    rt = await buildRuntime(registrar);
    await rt.onApplicationBootstrap();
  });
  afterAll(async () => {
    await rt.onModuleDestroy();
  });

  it('RACE-SCHED-001: two concurrent fireDueScheduled passes deliver a due one-shot task exactly once', async () => {
    const pluginId = 'race-sched';
    await seedPlugin(pluginId, { enabled: 1 });
    await insertRow(t, PluginScheduledTasks, { plugin_id: pluginId, name: 'once', due_at: Date.now() - 1000 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supervisor = (rt as any).supervisor;
    supervisor.running.set(pluginId, { id: pluginId, status: 'active' });
    let delivered = 0;
    const invokeSpy = vi.spyOn(supervisor, 'invoke').mockImplementation(async () => {
      delivered += 1;
      // Yield, so the second concurrent pass's own claim-read genuinely overlaps
      // this one's window rather than running strictly after it.
      await new Promise((r) => setTimeout(r, 5));
      return {};
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.all([(rt as any).fireDueScheduled(), (rt as any).fireDueScheduled()]);
      expect(delivered).toBe(1); // claimed (re-armed/deleted) by exactly one pass
      const row = await findRow(t, PluginScheduledTasks, { plugin_id: pluginId, name: 'once' });
      expect(row).toBeNull(); // deleted, not left dangling or double-inserted
    } finally {
      invokeSpy.mockRestore();
      supervisor.running.delete(pluginId);
    }
  });

  it('RACE-SCHED-002: two concurrent fireDueScheduled passes deliver a due RECURRING task exactly once (the re-arm claim guard, unproven by RACE-SCHED-001)', async () => {
    // Plan 3j Task 7 fix (must-land 4b, task-7-review.md): RACE-SCHED-001 above only
    // exercises the ONE-SHOT branch (`deleteById`'s claim guard) — the recurring branch
    // (`rearm`'s claim guard) went untested, and both mutations dropping IT survived
    // (M6/M6b). Same shape as RACE-SCHED-001, on a task with `every_ms` set instead.
    const pluginId = 'race-sched-recur';
    await seedPlugin(pluginId, { enabled: 1 });
    const everyMs = 60_000;
    await insertRow(t, PluginScheduledTasks, {
      plugin_id: pluginId,
      name: 'recurring',
      due_at: Date.now() - 1000,
      every_ms: everyMs,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supervisor = (rt as any).supervisor;
    supervisor.running.set(pluginId, { id: pluginId, status: 'active' });
    let delivered = 0;
    const invokeSpy = vi.spyOn(supervisor, 'invoke').mockImplementation(async () => {
      delivered += 1;
      // Yield, so the second concurrent pass's own claim-read genuinely overlaps
      // this one's window rather than running strictly after it.
      await new Promise((r) => setTimeout(r, 5));
      return {};
    });
    const before = Date.now();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.all([(rt as any).fireDueScheduled(), (rt as any).fireDueScheduled()]);
      // Without the `due_at <= now` guard on `rearm`, BOTH concurrent passes would read
      // `claimed = true` and both invoke — this is the assertion RACE-SCHED-001's own
      // shape proves for the one-shot branch, now proven for the recurring one.
      expect(delivered).toBe(1);
      const row = await findRow(t, PluginScheduledTasks, { plugin_id: pluginId, name: 'recurring' });
      expect(row).not.toBeNull(); // a recurring task is re-armed, never deleted
      expect(row?.due_at).toBeGreaterThanOrEqual(before + everyMs); // moved forward, not left due in the past
    } finally {
      invokeSpy.mockRestore();
      supervisor.running.delete(pluginId);
    }
  });

  it("RACE-ERASURE-001: two concurrent drains coalesce onto the SAME in-flight pass (drainUserErasures' own promise-sharing) — one ACK, one drop", async () => {
    const pluginId = 'race-erasure';
    await seedPlugin(pluginId, { enabled: 1 });
    await insertRow(t, PluginUserErasureQueue, { plugin_id: pluginId, user_id: 99 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supervisor = (rt as any).supervisor;
    supervisor.running.set(pluginId, { id: pluginId, status: 'active' });
    let delivered = 0;
    const deliverSpy = vi.spyOn(supervisor, 'deliverUserErasure').mockImplementation(async () => {
      delivered += 1;
      await new Promise((r) => setTimeout(r, 5));
      return true;
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.all([(rt as any).drainUserErasures(), (rt as any).drainUserErasures()]);
      expect(delivered).toBe(1); // drainUserErasures' own in-flight coalescing, unchanged by this task's conversion
      expect(await findRow(t, PluginUserErasureQueue, { plugin_id: pluginId, user_id: 99 })).toBeNull();
    } finally {
      deliverSpy.mockRestore();
      supervisor.running.delete(pluginId);
    }
  });
});
