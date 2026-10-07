/**
 * The shadow log's nightly retention provider: registration, the test gate, and
 * that a failing purge cannot take the scheduler down with it.
 */
import { PlaceShadowRetentionJob } from '../../../src/nest/place-shadow/place-shadow.job';
import type { PlaceShadowService } from '../../../src/nest/place-shadow/place-shadow.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

function registrarStub(enabled = true) {
  return { isEnabled: vi.fn(() => enabled), register: vi.fn(() => enabled), unregister: vi.fn() };
}

function makeJob(shadow: Partial<PlaceShadowService>, registrar = registrarStub()) {
  return {
    job: new PlaceShadowRetentionJob(shadow as PlaceShadowService, registrar as unknown as CronRegistrarService),
    registrar,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('PlaceShadowRetentionJob', () => {
  it('registers at 3:40, clear of the 3:00 idempotency purge', async () => {
    const { job, registrar } = makeJob({ purgeExpired: vi.fn(async () => 0) });
    await job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('place-shadow-retention', '40 3 * * *', expect.any(Function));
  });

  it('does not register under the test gate', async () => {
    const { job, registrar } = makeJob({ purgeExpired: vi.fn() }, registrarStub(false));
    await job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('logs only when it actually removed something', async () => {
    const { job } = makeJob({ purgeExpired: vi.fn(async () => 0) });
    await job.tick();
    expect(logMock.logInfo).not.toHaveBeenCalled();

    const loud = makeJob({ purgeExpired: vi.fn(async () => 12) });
    await loud.job.tick();
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringContaining('12'));
  });

  it('contains a failing purge instead of letting it escape into the scheduler', async () => {
    const { job } = makeJob({
      purgeExpired: vi.fn(() => {
        throw new Error('database is locked');
      }),
    });
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
  });

  it('runs the purge even while the log itself is switched off', async () => {
    // Switching collection off should let what it already gathered age out, so
    // the job must not consult `enabled()` before purging.
    const enabled = vi.fn(async () => false);
    const purgeExpired = vi.fn(async () => 3);
    await makeJob({ enabled, purgeExpired }).job.tick();
    expect(purgeExpired).toHaveBeenCalled();
    expect(enabled).not.toHaveBeenCalled();
  });
});
