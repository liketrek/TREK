/**
 * PaddleRegionsJob: the boot resume and the monthly refresh on the cron
 * registrar, and neither letting a failure out.
 */
import { PaddleRegionsJob } from '../../../../src/nest/paddle-obstacles/paddle-regions.job';
import type { PaddleRegionsService } from '../../../../src/nest/paddle-obstacles/paddle-regions.service';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  ...log,
}));

function registrarStub(enabled = true) {
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn(() => enabled),
    runOnBoot: vi.fn(async (_name: string, fn: () => Promise<void> | void) => {
      await fn();
    }),
  };
}

function regionsStub() {
  return {
    resumeAfterRestart: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    queueRefresh: vi.fn<() => Promise<number>>().mockResolvedValue(0),
  };
}

const job = (regions: ReturnType<typeof regionsStub>, registrar: ReturnType<typeof registrarStub>) =>
  new PaddleRegionsJob(regions as unknown as PaddleRegionsService, registrar as unknown as CronRegistrarService);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaddleRegionsJob', () => {
  it('PADJOB-001: resumes the reads on boot and registers the refresh for 04:20 on the 3rd of the month', async () => {
    const regions = regionsStub();
    const registrar = registrarStub();

    job(regions, registrar).onApplicationBootstrap();

    expect(registrar.runOnBoot).toHaveBeenCalledWith('paddle-regions-resume', expect.any(Function));
    expect(registrar.register).toHaveBeenCalledWith('paddle-regions-refresh', '20 4 3 * *', expect.any(Function));
    await vi.waitFor(() => expect(regions.resumeAfterRestart).toHaveBeenCalledOnce());
  });

  it('PADJOB-002: does nothing where crons are off (tests, a worker without the scheduler)', () => {
    const regions = regionsStub();
    const registrar = registrarStub(false);
    job(regions, registrar).onApplicationBootstrap();
    expect(registrar.runOnBoot).not.toHaveBeenCalled();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('PADJOB-003: the tick queues the regions and logs how many', async () => {
    const regions = regionsStub();
    regions.queueRefresh.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    const subject = job(regions, registrarStub());

    await subject.tick();
    expect(log.logInfo).toHaveBeenCalledWith('[Paddle] monthly refresh: 3 region(s) queued');
    log.logInfo.mockClear();
    await subject.tick();
    expect(log.logInfo).not.toHaveBeenCalled();
  });

  it('PADJOB-004: a failing tick or boot resume is logged and goes no further', async () => {
    const regions = regionsStub();
    regions.queueRefresh.mockRejectedValueOnce(new Error('database is locked'));
    regions.resumeAfterRestart.mockRejectedValueOnce(new Error('disk full'));
    const subject = job(regions, registrarStub());

    await expect(subject.tick()).resolves.toBeUndefined();
    await expect(subject.resume()).resolves.toBeUndefined();
    expect(log.logError).toHaveBeenCalledWith('[Paddle] monthly refresh: database is locked');
    expect(log.logError).toHaveBeenCalledWith('[Paddle] resuming the reads after a restart: disk full');
  });
});
