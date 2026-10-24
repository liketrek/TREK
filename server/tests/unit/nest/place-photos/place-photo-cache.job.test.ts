/**
 * PlacePhotoCacheJob boot sweep (task-6-review-parity.md C1's "scanned for
 * siblings" list: sweepOrphans is raw SQL today, safe, but the boot-time
 * one-off call now goes through CronRegistrarService.runOnBoot at the
 * entrypoint anyway, so it stays safe once this dependency graph goes
 * repository-backed too, without a second review having to rediscover it).
 */
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { PlacePhotoCacheJob } from '../../../../src/nest/place-photos/place-photo-cache.job';
import type { PlacePhotoCacheService } from '../../../../src/nest/place-photos/place-photo-cache.service';
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
  t = await createTestOrm(testDb, { allowGlobalContext: false });
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => vi.clearAllMocks());

describe('PlacePhotoCacheJob boot sweep', () => {
  it('PPCACHE-001: onApplicationBootstrap delegates the boot-time sweep through CronRegistrarService.runOnBoot, not a bare void this.sweep()', async () => {
    const cache = { sweepOrphans: vi.fn(async () => 0) } as unknown as PlacePhotoCacheService;
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
        await fn();
      }),
    };
    const job = new PlacePhotoCacheJob(cache, registrar as unknown as CronRegistrarService);
    job.onApplicationBootstrap();
    await Promise.resolve();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('place-photo-cache-boot', expect.any(Function));
  });

  it('PPCACHE-002: with MikroORM wired into the registrar, the boot-time sweep runs and completes', async () => {
    const cache = { sweepOrphans: vi.fn(async () => 3) } as unknown as PlacePhotoCacheService;
    const registrar = new CronRegistrarService(
      new SchedulerRegistry(),
      { isTest: () => false } as RuntimeEnvService,
      t.orm,
    );
    const job = new PlacePhotoCacheJob(cache, registrar);
    await registrar.runOnBoot('place-photo-cache-boot', () => job.sweep());
    expect(cache.sweepOrphans).toHaveBeenCalledTimes(1);
    expect(logMock.logError).not.toHaveBeenCalled();
  });

  it('PPCACHE-003: without MikroORM, the boot-time sweep never runs — logged with runOnBoot\'s own distinct message, not swallowed into "Place-photo cache cleanup: ..."', async () => {
    const cache = { sweepOrphans: vi.fn(async () => 0) } as unknown as PlacePhotoCacheService;
    const registrar = new CronRegistrarService(new SchedulerRegistry(), { isTest: () => false } as RuntimeEnvService); // no orm
    const job = new PlacePhotoCacheJob(cache, registrar);
    await registrar.runOnBoot('place-photo-cache-boot', () => job.sweep());
    expect(cache.sweepOrphans).not.toHaveBeenCalled();
    expect(logMock.logError).toHaveBeenCalledWith(
      expect.stringMatching(/runOnBoot: no MikroORM available.*place-photo-cache-boot/),
    );
    expect(logMock.logError).not.toHaveBeenCalledWith(expect.stringContaining('Place-photo cache cleanup'));
  });
});
