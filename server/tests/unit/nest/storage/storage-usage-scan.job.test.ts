/**
 * StorageUsageScanJob — the nightly 04:15 cron that drives
 * StorageStatsService.scan(). Registration gating follows the
 * CronRegistrarService idiom pinned in tests/unit/nest/admin-jobs.test.ts;
 * the tick error-containment mirrors VersionCheckJob/DemoResetJob there.
 */
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import type { StorageStatsService } from '../../../../src/nest/storage/storage-stats.service';
import { StorageUsageScanJob } from '../../../../src/nest/storage/storage-usage-scan.job';
import { Logger } from '@nestjs/common';

import { describe, it, expect, vi, beforeEach } from 'vitest';

function registrarStub(enabled = true) {
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn(
      (
        _name: string,
        _expression: string,
        _onTick: () => void | Promise<void>,
        _opts?: { timezone?: 'app' | 'none' },
      ) => enabled,
    ),
    unregister: vi.fn(),
  };
}

function statsStub(): StorageStatsService {
  return { scan: vi.fn().mockResolvedValue(undefined) } as unknown as StorageStatsService;
}

beforeEach(() => vi.restoreAllMocks());

describe('StorageUsageScanJob', () => {
  it('SCAN-001 registers the nightly 04:15 cron when the registrar gate is open', () => {
    const registrar = registrarStub();
    const job = new StorageUsageScanJob(registrar as unknown as CronRegistrarService, statsStub());
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('storage-usage-scan', '15 4 * * *', expect.any(Function));
  });

  it('SCAN-002 does not register under the test gate (registrar.isEnabled() false)', () => {
    const registrar = registrarStub(false);
    const job = new StorageUsageScanJob(registrar as unknown as CronRegistrarService, statsStub());
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('SCAN-003 the registered callback drives tick(), which calls stats.scan()', async () => {
    const registrar = registrarStub();
    const stats = statsStub();
    const job = new StorageUsageScanJob(registrar as unknown as CronRegistrarService, stats);
    job.onApplicationBootstrap();
    const onTick = registrar.register.mock.calls[0]![2] as () => void;
    onTick();
    await vi.waitFor(() => expect(stats.scan).toHaveBeenCalledTimes(1));
  });

  it('SCAN-004 tick() resolves and contains an Error rejection to the usage scan log line', async () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const stats = { scan: vi.fn().mockRejectedValue(new Error('disk full')) } as unknown as StorageStatsService;
    const job = new StorageUsageScanJob(registrarStub() as unknown as CronRegistrarService, stats);
    await expect(job.tick()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('usage scan failed: disk full');
  });

  it('SCAN-005 tick() stringifies a non-Error rejection rather than crashing', async () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const stats = { scan: vi.fn().mockRejectedValue('backend unreachable') } as unknown as StorageStatsService;
    const job = new StorageUsageScanJob(registrarStub() as unknown as CronRegistrarService, stats);
    await expect(job.tick()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('usage scan failed: backend unreachable');
  });
});
