/**
 * AirtrailSyncJob (AIRTRAIL-JOB-001..010): the scheduling shell around the
 * AirTrail poller, built with `new`, collaborators as plain mocks, no Nest
 * container and no timer. Mirrors dawarich-sync.job.test.ts's shape — the
 * two jobs are structurally identical siblings with different numbers (floor
 * 1 vs 5, default 5 vs 15) and a different setting key.
 *
 * task-6-review-parity.md C1 / task-6-fix-brief.md item 7: the boot-time
 * interval read now goes through CronRegistrarService.runOnBoot instead of
 * running inline in onApplicationBootstrap — AIRTRAIL-JOB-009/010 pin that.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import { AirtrailSyncJob } from '../../../src/nest/integrations/airtrail-sync.job';
import type { AirtrailSyncService } from '../../../src/nest/integrations/airtrail-sync.service';
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

const SETTING_KEY = 'airtrail_poll_interval_minutes';

function makeJob(intervalSetting?: string, enabled = true) {
  let onTick: (() => void | Promise<void>) | undefined;
  const registrar = {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn((_name: string, _expression: string, cb: () => void | Promise<void>) => {
      onTick = cb;
      return enabled;
    }),
    unregister: vi.fn(),
    runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
      await fn();
    }),
  };
  const appSettings = {
    getValue: vi.fn((_key: string) => Promise.resolve(intervalSetting === undefined ? null : intervalSetting)),
  };
  const airtrail = {
    runAirtrailSync: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const job = new AirtrailSyncJob(
    appSettings as unknown as AppSettingsRepository,
    airtrail as unknown as AirtrailSyncService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, registrar, appSettings, airtrail, takeTick: () => onTick };
}

beforeEach(() => vi.clearAllMocks());

describe('AirtrailSyncJob bootstrap', () => {
  it('AIRTRAIL-JOB-001: registers */N under the job name the scheduler reports, and logs the banner', async () => {
    const { job, registrar } = makeJob('20');
    await job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('airtrail-sync', '*/20 * * * *', expect.any(Function));
    expect(logMock.logInfo).toHaveBeenCalledWith('AirTrail sync: scheduled every 20m');
  });

  it('AIRTRAIL-JOB-002: reads its own setting key, not the Dawarich one', async () => {
    const { job, appSettings } = makeJob('10');
    await job.onApplicationBootstrap();
    expect(appSettings.getValue).toHaveBeenCalledWith(SETTING_KEY);
  });

  it('AIRTRAIL-JOB-003: clamps the interval to 1-59 minutes and falls back to 5 on anything else', async () => {
    for (const [setting, minutes] of [
      [undefined, 5],
      ['', 5],
      ['not-a-number', 5],
      ['0', 5],
      ['60', 5],
      ['1', 1], // the floor itself is allowed
      ['59', 59], // and so is the ceiling
    ] as const) {
      vi.clearAllMocks();
      const { job, registrar } = makeJob(setting);
      await job.onApplicationBootstrap();
      expect(registrar.register).toHaveBeenCalledWith('airtrail-sync', `*/${minutes} * * * *`, expect.any(Function));
    }
  });

  it('AIRTRAIL-JOB-004: the test gate stops the job before it registers, reads or logs anything', async () => {
    const { job, registrar, appSettings } = makeJob('5', false);
    await job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(appSettings.getValue).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
    expect(registrar.runOnBoot).not.toHaveBeenCalled();
  });

  it('AIRTRAIL-JOB-005: the callback handed to the registrar is the tick, so a fired cron reaches runAirtrailSync', async () => {
    const { job, airtrail, takeTick } = makeJob('5');
    await job.onApplicationBootstrap();
    const onTick = takeTick();
    expect(onTick).toBeTypeOf('function');
    await onTick?.();
    expect(airtrail.runAirtrailSync).toHaveBeenCalledTimes(1);
  });

  it('AIRTRAIL-JOB-009: the boot-time interval read goes through CronRegistrarService.runOnBoot (task-6-review-parity.md C1 — the boot-sweep choke point)', async () => {
    const { job, registrar } = makeJob('5');
    await job.onApplicationBootstrap();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('airtrail-sync-boot', expect.any(Function));
  });

  it('AIRTRAIL-JOB-010: registers at the default 5m cadence if runOnBoot declines to run fn (no ORM available)', async () => {
    const { job, registrar, appSettings } = makeJob('30');
    registrar.runOnBoot.mockImplementationOnce(async () => {
      /* simulates no ORM available — fn never runs */
    });
    await job.onApplicationBootstrap();
    expect(appSettings.getValue).not.toHaveBeenCalled();
    expect(registrar.register).toHaveBeenCalledWith('airtrail-sync', '*/5 * * * *', expect.any(Function));
  });
});

describe('AirtrailSyncJob tick', () => {
  it('AIRTRAIL-JOB-006: delegates to runAirtrailSync and stays quiet on success', async () => {
    const { job, airtrail } = makeJob('5');
    await expect(job.tick()).resolves.toBeUndefined();
    expect(airtrail.runAirtrailSync).toHaveBeenCalledTimes(1);
    expect(logMock.logError).not.toHaveBeenCalled();
  });

  it('AIRTRAIL-JOB-007: an unreachable instance becomes one log line and a resolved promise, never an unhandled rejection in the scheduler', async () => {
    const { job, airtrail } = makeJob('5');
    airtrail.runAirtrailSync.mockRejectedValue(new Error('fetch failed'));
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('AirTrail sync tick failed: fetch failed');
  });

  it('AIRTRAIL-JOB-008: a non-Error rejection is logged by value instead of as an empty message', async () => {
    const { job, airtrail } = makeJob('5');
    airtrail.runAirtrailSync.mockRejectedValue('ECONNREFUSED');
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('AirTrail sync tick failed: ECONNREFUSED');
  });
});
