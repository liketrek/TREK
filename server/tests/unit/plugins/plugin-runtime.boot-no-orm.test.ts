/**
 * task-6-rereview2.md I-A: `PluginRuntimeService.onApplicationBootstrap`'s
 * absent-ORM branch (`plugin-runtime.service.ts:~296-300`) was dead
 * suite-wide — every existing construction of the service that reaches
 * `onApplicationBootstrap` (boot-registry-order.test.ts, plugin-host.ts) hands
 * it a real MikroORM. That branch is the half of the boot RULING
 * (task-6-rereview.md §2) that makes "skip loudly, never abort app.init()"
 * defensible: dropping the `logError` call, or falling through to `activate`
 * anyway, would ship green with no test failing. This file pins it directly.
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
import { AuditService } from '../../../src/nest/audit/audit.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlugin } from '../../helpers/factories/plugins';
import { createTestAddonsService } from '../../helpers/test-addons';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  // Global context disallowed — the production setting — so the WITH-orm
  // sibling case genuinely proves activation runs through a request context,
  // the same reasoning airports.service.test.ts and BOOT-REG-002 use.
  t = await createTestOrm(testDb, { allowGlobalContext: false });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => vi.clearAllMocks());

/** installedDepRows() reads the `plugins` table directly — no discovery needed. */
async function installEnabledPlugin(id: string): Promise<void> {
  await makePlugin(t, id, {
    status: 'inactive',
    enabled: 1,
    api_version: 1,
    permissions: '[]',
    granted_permissions: '[]',
    capabilities: '{}',
    config: '{}',
    dependencies: '{}',
  });
}

async function buildRuntime(withOrm: boolean): Promise<PluginRuntimeService> {
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
    // Plan 4 Task 4: `uow` is no longer `@Optional()` — ordered ahead of
    // `registry?`/`hostFactory?`, matching the real constructor's own order.
    new UnitOfWork(t.em),
    undefined,
    undefined,
    withOrm ? t.orm : undefined,
  );
}

describe('PluginRuntimeService.onApplicationBootstrap — absent-ORM boot branch (task-6-rereview2.md I-A)', () => {
  it('RT-BOOT-NOORM-001: without an ORM, boot logs the skip line and never calls activate', async () => {
    await installEnabledPlugin('rtboot-noorm');
    const rt = await buildRuntime(false);
    const activateSpy = vi.spyOn(rt, 'activate');

    await rt.onApplicationBootstrap();

    // Plan 3j Task 2 (deviation, task-2-report.md): `installedDepRows` is now a
    // repository read that needs a request context this branch cannot provide, so
    // it is skipped rather than attempted unwrapped — the log line can no longer
    // name which plugin(s) it skipped, only that it skipped activation entirely.
    // Still fail-closed (never throws out of onApplicationBootstrap, never abandons
    // app.init()), still logged exactly once, still never calls activate.
    expect(logMock.logError).toHaveBeenCalledTimes(1);
    const [message] = logMock.logError.mock.calls[0] as [string];
    expect(message).toMatch(/PluginRuntimeService\.onApplicationBootstrap: no MikroORM available/);
    expect(activateSpy).not.toHaveBeenCalled();
  });

  it('RT-BOOT-NOORM-002: WITH an ORM, the same arrangement activates the plugin — proves case 001 is not vacuous', async () => {
    await installEnabledPlugin('rtboot-withorm');
    const rt = await buildRuntime(true);
    const activateSpy = vi.spyOn(rt, 'activate').mockResolvedValue(undefined);

    await rt.onApplicationBootstrap();

    expect(activateSpy).toHaveBeenCalledWith('rtboot-withorm');
    expect(logMock.logError).not.toHaveBeenCalled();
  });
});
