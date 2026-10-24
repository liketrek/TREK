/**
 * The cache-sweep and poll cron providers moved from src/scheduler.ts:
 * TrekPhotoCacheJob (2-hourly, server-local, boot sweep with a swallow),
 * PlacePhotoCacheJob (nightly app-tz, boot sweep, removed>0 log condition) and
 * AirtrailSyncJob (every N minutes, N from the clamped app-setting). The
 * services they drive have their own suites; these cover the scheduling shell.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import { AirtrailSyncJob } from '../../../src/nest/integrations/airtrail-sync.job';
import type { AirtrailSyncService } from '../../../src/nest/integrations/airtrail-sync.service';
import { JourneyThumbsJob } from '../../../src/nest/memories/journey-thumbs.job';
import type { ThumbnailService } from '../../../src/nest/memories/thumbnail.service';
import { TrekPhotoCacheJob } from '../../../src/nest/memories/trek-photo-cache.job';
import type { TrekPhotoCacheService } from '../../../src/nest/memories/trek-photo-cache.service';
import { PlacePhotoCacheJob } from '../../../src/nest/place-photos/place-photo-cache.job';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
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
  return {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn(() => enabled),
    unregister: vi.fn(),
    // task-6-fix-brief.md item 7: every boot-time one-off sweep now goes
    // through CronRegistrarService.runOnBoot instead of running inline —
    // this double just runs fn immediately (synchronously reaching fn's own
    // first call, exactly the pre-fix `void this.sweep()` shape), so every
    // existing assertion below is unaffected.
    runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
      await fn();
    }),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('TrekPhotoCacheJob', () => {
  function make(sweep: () => void = vi.fn(), enabled = true) {
    const registrar = registrarStub(enabled);
    const cache = { sweepExpired: vi.fn(sweep) };
    const job = new TrekPhotoCacheJob(
      cache as unknown as TrekPhotoCacheService,
      registrar as unknown as CronRegistrarService,
    );
    return { job, registrar, cache };
  }

  it('CSJOB-001 — boot sweep runs immediately, then the 2-hourly server-local cron registers', async () => {
    const { job, registrar, cache } = make();
    await job.onApplicationBootstrap();
    expect(cache.sweepExpired).toHaveBeenCalledTimes(1);
    expect(registrar.register).toHaveBeenCalledWith('trek-photo-cache', '0 */2 * * *', expect.any(Function), {
      timezone: 'none',
    });
  });

  it('CSJOB-002 — a throwing boot sweep is swallowed (cache dir may not exist yet) and the cron still registers', async () => {
    const { job, registrar } = make(() => {
      throw new Error('ENOENT');
    });
    expect(() => job.onApplicationBootstrap()).not.toThrow();
    expect(registrar.register).toHaveBeenCalled();
    expect(logMock.logError).not.toHaveBeenCalled();
  });

  it('CSJOB-003 — the test gate skips the boot sweep entirely', async () => {
    const { job, registrar, cache } = make(vi.fn(), false);
    await job.onApplicationBootstrap();
    expect(cache.sweepExpired).not.toHaveBeenCalled();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('CSJOB-004 — a throwing tick is contained to the cleanup log line', async () => {
    const { job } = make(() => {
      throw new Error('disk gone');
    });
    expect(() => job.tick()).not.toThrow();
    expect(logMock.logError).toHaveBeenCalledWith('Trek photo cache cleanup: disk gone');
  });
});

describe('PlacePhotoCacheJob', () => {
  function make(removed: number | (() => number) = 0, enabled = true) {
    const registrar = registrarStub(enabled);
    const cache = { sweepOrphans: vi.fn(typeof removed === 'function' ? removed : () => removed) };
    const job = new PlacePhotoCacheJob(
      cache as unknown as PlacePhotoCacheService,
      registrar as unknown as CronRegistrarService,
    );
    return { job, registrar, cache };
  }

  it('CSJOB-005 — boot sweep runs immediately, then the nightly app-tz cron registers', async () => {
    const { job, registrar, cache } = make();
    await job.onApplicationBootstrap();
    expect(cache.sweepOrphans).toHaveBeenCalledTimes(1);
    expect(registrar.register).toHaveBeenCalledWith('place-photo-cache', '30 3 * * *', expect.any(Function));
  });

  it('CSJOB-006 — logs only when something was removed', async () => {
    await make(0).job.sweep();
    expect(logMock.logInfo).not.toHaveBeenCalled();
    await make(3).job.sweep();
    expect(logMock.logInfo).toHaveBeenCalledWith('Place-photo cache cleanup: removed 3 orphaned file(s)/row(s)');
  });

  it('CSJOB-007 — a throwing sweep is contained to the cleanup log line, and the gate skips the boot sweep', async () => {
    const { job } = make(() => {
      throw new Error('fs down');
    });
    expect(() => job.sweep()).not.toThrow();
    expect(logMock.logError).toHaveBeenCalledWith('Place-photo cache cleanup: fs down');

    const gated = make(0, false);
    gated.job.onApplicationBootstrap();
    expect(gated.cache.sweepOrphans).not.toHaveBeenCalled();
    expect(gated.registrar.register).not.toHaveBeenCalled();
  });
});

describe('JourneyThumbsJob', () => {
  function make(removed: number | (() => number) = 0, enabled = true) {
    const registrar = registrarStub(enabled);
    const thumbnails = {
      sweepOrphanThumbs: vi.fn(typeof removed === 'function' ? removed : () => Promise.resolve(removed)),
    };
    const job = new JourneyThumbsJob(
      thumbnails as unknown as ThumbnailService,
      registrar as unknown as CronRegistrarService,
    );
    return { job, registrar, thumbnails };
  }

  it('CSJOB-010 — boot sweep runs immediately, then the daily app-tz cron registers', async () => {
    const { job, registrar, thumbnails } = make();
    await job.onApplicationBootstrap();
    expect(thumbnails.sweepOrphanThumbs).toHaveBeenCalledTimes(1);
    expect(registrar.register).toHaveBeenCalledWith('journey-thumbs', '0 4 * * *', expect.any(Function));
  });

  it('CSJOB-011 — logs only when something was removed', async () => {
    await make(0).job.sweep();
    expect(logMock.logInfo).not.toHaveBeenCalled();
    await make(2).job.sweep();
    expect(logMock.logInfo).toHaveBeenCalledWith('Journey thumbnail cleanup: removed 2 orphaned thumbnail(s)');
  });

  it('CSJOB-012 — a throwing sweep is contained to the cleanup log line, and the gate skips the boot sweep', async () => {
    const { job } = make(() => {
      throw new Error('storage down');
    });
    await job.sweep();
    expect(logMock.logError).toHaveBeenCalledWith('Journey thumbnail cleanup: storage down');

    const gated = make(0, false);
    gated.job.onApplicationBootstrap();
    expect(gated.thumbnails.sweepOrphanThumbs).not.toHaveBeenCalled();
    expect(gated.registrar.register).not.toHaveBeenCalled();
  });
});

describe('AirtrailSyncJob', () => {
  function make(intervalSetting: string | undefined, enabled = true) {
    const registrar = registrarStub(enabled);
    const appSettings = {
      getValue: vi.fn(async () => (intervalSetting === undefined ? null : intervalSetting)),
    };
    const airtrail = { runAirtrailSync: vi.fn().mockResolvedValue(undefined) };
    const job = new AirtrailSyncJob(
      appSettings as unknown as AppSettingsRepository,
      airtrail as unknown as AirtrailSyncService,
      registrar as unknown as CronRegistrarService,
    );
    return { job, registrar, airtrail };
  }

  it('CSJOB-008 — registers */N from the app-setting and logs the banner', async () => {
    const { job, registrar } = make('10');
    await job.onApplicationBootstrap();
    expect(logMock.logInfo).toHaveBeenCalledWith('AirTrail sync: scheduled every 10m');
    expect(registrar.register).toHaveBeenCalledWith('airtrail-sync', '*/10 * * * *', expect.any(Function));
  });

  it('CSJOB-009 — clamps the interval to 1–59 and defaults to 5', async () => {
    for (const [setting, minutes] of [
      [undefined, 5],
      ['0', 5],
      ['60', 5],
      ['not-a-number', 5],
      ['1', 1],
      ['59', 59],
    ] as const) {
      vi.clearAllMocks();
      const { job, registrar } = make(setting);
      await job.onApplicationBootstrap();
      expect(registrar.register).toHaveBeenCalledWith('airtrail-sync', `*/${minutes} * * * *`, expect.any(Function));
      expect(logMock.logInfo).toHaveBeenCalledWith(`AirTrail sync: scheduled every ${minutes}m`);
    }
  });

  it('CSJOB-010 — the gate skips registration and the banner', async () => {
    const { job, registrar } = make('5', false);
    await job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('CSJOB-011 — the tick delegates to runAirtrailSync and contains a rejection', async () => {
    const { job, airtrail } = make('5');
    await job.tick();
    expect(airtrail.runAirtrailSync).toHaveBeenCalledTimes(1);

    airtrail.runAirtrailSync.mockRejectedValue(new Error('remote 500'));
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('AirTrail sync tick failed: remote 500');
  });
});
