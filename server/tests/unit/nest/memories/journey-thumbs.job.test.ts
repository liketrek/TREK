/**
 * JourneyThumbsJob boot sweep (task-6-review-parity.md C1 — this is the
 * exact regression the smoke boot reproduced: `onApplicationBootstrap` used
 * to call `void this.sweep()` directly, bypassing CronRegistrarService's
 * request-context wrapper entirely, so once `sweepOrphanThumbs` went
 * repository-backed (`AddonsService.isAddonEnabled`), the boot-time call
 * threw `cannotUseGlobalContext` — silently, swallowed by the job's own
 * try/catch — on every production boot).
 */
import { Addons } from '../../../../src/db/entities/Addons.entity';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { JourneyThumbsJob } from '../../../../src/nest/memories/journey-thumbs.job';
import type { ThumbnailService } from '../../../../src/nest/memories/thumbnail.service';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { SchedulerRegistry } from '@nestjs/schedule';

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  // Global context disallowed — the production setting — so a repository
  // read with no wrapper around it genuinely throws.
  t = await createTestOrm(testDb, { allowGlobalContext: false });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => vi.clearAllMocks());

/**
 * A `sweepOrphanThumbs` double that reaches a real `AddonsRepository` read —
 * the same repository-backed dependency `ThumbnailService.sweepOrphanThumbs`
 * has in production — rather than mocking the property away, so this test
 * actually exercises the request-context property the real chain depends on.
 */
function makeThumbnails(): Pick<ThumbnailService, 'sweepOrphanThumbs'> {
  const addonsRepo = t.repo(Addons);
  return {
    sweepOrphanThumbs: async () => {
      await addonsRepo.isEnabled('journey');
      return 0;
    },
  };
}

describe('JourneyThumbsJob boot sweep', () => {
  it('JTHUMB-001: onApplicationBootstrap delegates the boot-time sweep through CronRegistrarService.runOnBoot, not a bare void this.sweep()', async () => {
    const registered: Array<[string, () => void | Promise<void>]> = [];
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async (name: string, fn: () => void | Promise<void>) => {
        registered.push([name, fn]);
        await fn();
      }),
    };
    const job = new JourneyThumbsJob(
      makeThumbnails() as ThumbnailService,
      registrar as unknown as CronRegistrarService,
    );
    job.onApplicationBootstrap();
    await Promise.resolve(); // flush the fire-and-forget void runOnBoot(...) call
    expect(registrar.runOnBoot).toHaveBeenCalledWith('journey-thumbs-boot', expect.any(Function));
  });

  it("JTHUMB-002: with MikroORM wired into the registrar, the boot-time sweep's repository read succeeds — no cannotUseGlobalContext", async () => {
    const registrar = new CronRegistrarService(
      new SchedulerRegistry(),
      { isTest: () => false } as RuntimeEnvService,
      t.orm,
    );
    const job = new JourneyThumbsJob(makeThumbnails() as ThumbnailService, registrar);
    await registrar.runOnBoot('journey-thumbs-boot', () => job.sweep());
    expect(logMock.logError).not.toHaveBeenCalled();
  });

  it('JTHUMB-003: without MikroORM, the boot-time sweep never runs at all — the failure is logged with runOnBoot\'s own distinct message, never swallowed into "Journey thumbnail cleanup: ..."', async () => {
    const registrar = new CronRegistrarService(new SchedulerRegistry(), { isTest: () => false } as RuntimeEnvService); // no orm
    let ran = false;
    const job = new JourneyThumbsJob(
      {
        sweepOrphanThumbs: async () => {
          ran = true;
          return 0;
        },
      } as ThumbnailService,
      registrar,
    );
    await registrar.runOnBoot('journey-thumbs-boot', () => job.sweep());
    expect(ran).toBe(false);
    expect(logMock.logError).toHaveBeenCalledWith(
      expect.stringMatching(/runOnBoot: no MikroORM available.*journey-thumbs-boot/),
    );
    expect(logMock.logError).not.toHaveBeenCalledWith(expect.stringContaining('Journey thumbnail cleanup'));
  });
});
