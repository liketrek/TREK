/**
 * The admin domain's cron providers — VersionCheckJob and DemoResetJob
 * (moved from src/scheduler.ts). Registration, gating, and tick error
 * containment; the version-check end-to-end path is VCJOB-001 in
 * admin.service.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
const { resetDemoUserMock } = vi.hoisted(() => ({ resetDemoUserMock: vi.fn() }));

vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);
vi.mock('../../../src/demo/demo-reset', () => ({ resetDemoUser: resetDemoUserMock, saveBaseline: vi.fn(), hasBaseline: vi.fn() }));

import { VersionCheckJob } from '../../../src/nest/admin/version-check.job';
import { DemoResetJob } from '../../../src/nest/admin/demo-reset.job';
import type { AdminService } from '../../../src/nest/admin/admin.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';

function registrarStub(enabled = true) {
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn(() => enabled),
    unregister: vi.fn(),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('VersionCheckJob', () => {
  it('AJOB-001 — registers the daily 9 AM cron, with no boot log (parity)', () => {
    const registrar = registrarStub();
    new VersionCheckJob({} as AdminService, registrar as unknown as CronRegistrarService, { isManaged: () => false } as unknown as RuntimeEnvService).onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('version-check', '0 9 * * *', expect.any(Function));
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('AJOB-002 — does not register under the test gate', () => {
    const registrar = registrarStub(false);
    new VersionCheckJob({} as AdminService, registrar as unknown as CronRegistrarService, { isManaged: () => false } as unknown as RuntimeEnvService).onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('AJOB-003 — a throwing check is contained to the Version check log line', async () => {
    const admin = { checkAndNotifyVersion: vi.fn().mockRejectedValue(new Error('github down')) } as unknown as AdminService;
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
  function make(demo: boolean, enabled = true) {
    const registrar = registrarStub(enabled);
    const runtimeEnv = { isDemoMode: () => demo } as RuntimeEnvService;
    return { job: new DemoResetJob(runtimeEnv, registrar as unknown as CronRegistrarService), registrar };
  }

  it('AJOB-004 — registers the hourly server-local cron and logs the banner when demo mode is on', () => {
    const { job, registrar } = make(true);
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('demo-reset', '0 * * * *', expect.any(Function), { timezone: 'none' });
    expect(logMock.logInfo).toHaveBeenCalledWith('Demo hourly reset scheduled');
  });

  it('AJOB-005 — stays silent when demo mode is off or the gate is closed', () => {
    const off = make(false);
    off.job.onApplicationBootstrap();
    expect(off.registrar.register).not.toHaveBeenCalled();

    const gated = make(true, false);
    gated.job.onApplicationBootstrap();
    expect(gated.registrar.register).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('AJOB-006 — the tick runs resetDemoUser and contains a throw to the Demo reset log line', () => {
    const { job } = make(true);
    job.tick();
    expect(resetDemoUserMock).toHaveBeenCalledTimes(1);

    resetDemoUserMock.mockImplementation(() => { throw new Error('baseline gone'); });
    expect(() => job.tick()).not.toThrow();
    expect(logMock.logError).toHaveBeenCalledWith('Demo reset: baseline gone');
  });
});
