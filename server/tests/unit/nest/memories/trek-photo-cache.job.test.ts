/**
 * TrekPhotoCacheJob boot sweep (task-6-review-parity.md C1's "scanned for
 * siblings" list: sweepExpired is raw SQL today, safe, but the boot-time
 * one-off call now goes through CronRegistrarService.runOnBoot at the
 * entrypoint anyway, so it stays safe once this dependency graph goes
 * repository-backed too).
 */
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { TrekPhotoCacheJob } from '../../../../src/nest/memories/trek-photo-cache.job';
import type { TrekPhotoCacheService } from '../../../../src/nest/memories/trek-photo-cache.service';
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

describe('TrekPhotoCacheJob boot sweep', () => {
  it('TPCACHE-001: onApplicationBootstrap delegates the boot-time sweep through CronRegistrarService.runOnBoot, not a bare inline IIFE', async () => {
    const cache = { sweepExpired: vi.fn(async () => {}) } as unknown as TrekPhotoCacheService;
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
        await fn();
      }),
    };
    const job = new TrekPhotoCacheJob(cache, registrar as unknown as CronRegistrarService);
    job.onApplicationBootstrap();
    await Promise.resolve();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('trek-photo-cache-boot', expect.any(Function));
    expect(cache.sweepExpired).toHaveBeenCalledTimes(1);
  });

  it("TPCACHE-002: a missing cache dir at boot is still swallowed by the job's OWN catch, inside runOnBoot's wrapper", async () => {
    const cache = {
      sweepExpired: vi.fn(async () => {
        throw new Error('ENOENT');
      }),
    } as unknown as TrekPhotoCacheService;
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
        await fn();
      }),
    };
    const job = new TrekPhotoCacheJob(cache, registrar as unknown as CronRegistrarService);
    expect(() => job.onApplicationBootstrap()).not.toThrow();
    await Promise.resolve();
    expect(logMock.logError).not.toHaveBeenCalled(); // the inline try/catch around sweepExpired() still swallows it
  });

  it("TPCACHE-003: without MikroORM, the boot-time sweep never runs — logged with runOnBoot's own distinct message", async () => {
    const cache = { sweepExpired: vi.fn(async () => {}) } as unknown as TrekPhotoCacheService;
    const registrar = new CronRegistrarService(new SchedulerRegistry(), { isTest: () => false } as RuntimeEnvService); // no orm
    await registrar.runOnBoot('trek-photo-cache-boot', async () => {
      try {
        await cache.sweepExpired();
      } catch {
        /* cache dir may not exist yet — harmless */
      }
    });
    expect(cache.sweepExpired).not.toHaveBeenCalled();
    expect(logMock.logError).toHaveBeenCalledWith(
      expect.stringMatching(/runOnBoot: no MikroORM available.*trek-photo-cache-boot/),
    );
  });
});
