/**
 * The admin domain's cron providers — VersionCheckJob and DemoResetJob
 * (moved from src/scheduler.ts). Registration, gating, and tick error
 * containment; the version-check end-to-end path is VCJOB-001 in
 * admin.service.test.ts.
 */
import type { AdminService } from '../../../src/nest/admin/admin.service';
import { DemoResetJob } from '../../../src/nest/admin/demo-reset.job';
import { VersionCheckJob } from '../../../src/nest/admin/version-check.job';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { DatabaseBackupStrategy } from '../../../src/nest/database/database-backup.interface';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import type { EntityManager } from '@mikro-orm/core';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
const { resetDemoUserMock, saveBaselineMock, hasBaselineMock, takeExampleTripsSeededMock } = vi.hoisted(() => ({
  resetDemoUserMock: vi.fn(),
  saveBaselineMock: vi.fn(async () => {}),
  hasBaselineMock: vi.fn(() => true),
  takeExampleTripsSeededMock: vi.fn(() => false),
}));

vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);
vi.mock('../../../src/demo/demo-reset', () => ({
  resetDemoUser: resetDemoUserMock,
  saveBaseline: saveBaselineMock,
  hasBaseline: hasBaselineMock,
  takeExampleTripsSeeded: takeExampleTripsSeededMock,
}));

function registrarStub(enabled = true) {
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn(() => enabled),
    unregister: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  hasBaselineMock.mockReturnValue(true);
  takeExampleTripsSeededMock.mockReturnValue(false);
});

describe('VersionCheckJob', () => {
  it('AJOB-001 — registers the daily 9 AM cron, with no boot log (parity)', () => {
    const registrar = registrarStub();
    new VersionCheckJob(
      {} as AdminService,
      registrar as unknown as CronRegistrarService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    ).onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('version-check', '0 9 * * *', expect.any(Function));
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('AJOB-002 — does not register under the test gate', () => {
    const registrar = registrarStub(false);
    new VersionCheckJob(
      {} as AdminService,
      registrar as unknown as CronRegistrarService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    ).onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('AJOB-003 — a throwing check is contained to the Version check log line', async () => {
    const admin = {
      checkAndNotifyVersion: vi.fn().mockRejectedValue(new Error('github down')),
    } as unknown as AdminService;
    const job = new VersionCheckJob(
      admin,
      registrarStub() as unknown as CronRegistrarService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    );
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Version check: github down');
  });
});

describe('DemoResetJob', () => {
  // The injected backup port is only handed through to demo-reset (mocked
  // above), so a sentinel is enough. The EntityManager is what the first
  // baseline's request context forks from.
  const database = { __sentinel: 'database' } as unknown as DatabaseBackupStrategy;
  const em = { fork: vi.fn(() => ({})) } as unknown as EntityManager;

  function make(demo: boolean, enabled = true) {
    const registrar = registrarStub(enabled);
    const runtimeEnv = { isDemoMode: () => demo } as RuntimeEnvService;
    const reopenListeners: Array<() => Promise<void>> = [];
    const lifecycle = {
      onReopened: vi.fn((listener: () => Promise<void>) => {
        reopenListeners.push(listener);
      }),
    };
    const job = new DemoResetJob(
      runtimeEnv,
      registrar as unknown as CronRegistrarService,
      database,
      em,
      lifecycle as unknown as DatabaseLifecycle,
    );
    // What DatabaseLifecycle does after a reopen's schema bootstrap.
    const reopen = async () => {
      for (const listener of reopenListeners) await listener();
    };
    return { job, registrar, lifecycle, reopen };
  }

  it('AJOB-004 — registers the hourly server-local cron and logs the banner when demo mode is on', async () => {
    const { job, registrar } = make(true);
    await job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('demo-reset', '0 * * * *', expect.any(Function), {
      timezone: 'none',
    });
    expect(logMock.logInfo).toHaveBeenCalledWith('Demo hourly reset scheduled');
  });

  it('AJOB-005 — stays silent when demo mode is off or the gate is closed', async () => {
    const off = make(false);
    await off.job.onApplicationBootstrap();
    expect(off.registrar.register).not.toHaveBeenCalled();

    const gated = make(true, false);
    await gated.job.onApplicationBootstrap();
    expect(gated.registrar.register).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('AJOB-006 — the tick runs resetDemoUser and contains a throw to the Demo reset log line', async () => {
    const { job } = make(true);
    await job.tick();
    expect(resetDemoUserMock).toHaveBeenCalledTimes(1);
    expect(resetDemoUserMock).toHaveBeenCalledWith(database);

    resetDemoUserMock.mockImplementation(() => {
      throw new Error('baseline gone');
    });
    expect(() => job.tick()).not.toThrow();
    expect(logMock.logError).toHaveBeenCalledWith('Demo reset: baseline gone');
  });

  it('AJOB-007: the boot that seeded the example trips saves the first baseline through the port, gate or not', async () => {
    takeExampleTripsSeededMock.mockReturnValue(true);
    hasBaselineMock.mockReturnValue(false);
    const { job } = make(true, false);
    await job.onApplicationBootstrap();
    expect(saveBaselineMock).toHaveBeenCalledWith(database);
  });

  it('AJOB-008: an existing baseline is left alone, and so is a non-demo boot', async () => {
    takeExampleTripsSeededMock.mockReturnValue(true);
    await make(true).job.onApplicationBootstrap();
    hasBaselineMock.mockReturnValue(false);
    await make(false).job.onApplicationBootstrap();
    expect(saveBaselineMock).not.toHaveBeenCalled();
  });

  it('AJOB-009: a first baseline that cannot be saved is logged, not thrown into the boot', async () => {
    takeExampleTripsSeededMock.mockReturnValue(true);
    hasBaselineMock.mockReturnValue(false);
    saveBaselineMock.mockRejectedValueOnce(new Error('database or disk is full'));
    await expect(make(true).job.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Demo baseline: database or disk is full');
  });

  it('AJOB-010: a demo boot that seeded nothing saves no baseline, even with none on disk', async () => {
    // A database that already holds data (possibly user edits) and has no
    // baseline must not become the reset target behind the admin's back.
    hasBaselineMock.mockReturnValue(false);
    await make(true).job.onApplicationBootstrap();
    expect(saveBaselineMock).not.toHaveBeenCalled();
  });

  it('AJOB-011: a reopen whose re-bootstrap seeded the example trips saves the first baseline', async () => {
    // A restore onto a demo instance with no baseline: the boot seeded nothing,
    // the restored archive had no admin trips, so the reopen's demo seed did.
    hasBaselineMock.mockReturnValue(false);
    const { job, reopen } = make(true, false);
    await job.onApplicationBootstrap();
    expect(saveBaselineMock).not.toHaveBeenCalled();

    takeExampleTripsSeededMock.mockReturnValueOnce(true);
    await reopen();
    expect(saveBaselineMock).toHaveBeenCalledTimes(1);
    expect(saveBaselineMock).toHaveBeenCalledWith(database);
  });

  it('AJOB-012: a reopen that seeded nothing, or found a baseline, saves none, and each reopen clears the mark', async () => {
    const { job, reopen } = make(true);
    await job.onApplicationBootstrap();
    takeExampleTripsSeededMock.mockClear();

    hasBaselineMock.mockReturnValue(false);
    await reopen();
    takeExampleTripsSeededMock.mockReturnValueOnce(true);
    hasBaselineMock.mockReturnValue(true);
    await reopen();

    expect(takeExampleTripsSeededMock).toHaveBeenCalledTimes(2);
    expect(saveBaselineMock).not.toHaveBeenCalled();
  });

  it('AJOB-013: a baseline save that fails after a reopen is logged, not turned into a failed reopen', async () => {
    hasBaselineMock.mockReturnValue(false);
    const { job, reopen } = make(true);
    await job.onApplicationBootstrap();

    takeExampleTripsSeededMock.mockReturnValueOnce(true);
    saveBaselineMock.mockRejectedValueOnce(new Error('database or disk is full'));
    await expect(reopen()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Demo baseline: database or disk is full');
  });

  it('AJOB-014: a non-demo boot does not listen for reopens', async () => {
    const { job, lifecycle } = make(false);
    await job.onApplicationBootstrap();
    expect(lifecycle.onReopened).not.toHaveBeenCalled();
  });
});
