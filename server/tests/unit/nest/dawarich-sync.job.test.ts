/**
 * DawarichSyncJob (DAWARICH-JOB-001..012): the scheduling shell around the
 * Dawarich poller, built with `new`, collaborators as plain mocks, no Nest
 * container and no timer. DawarichSyncService has its own suite; what is pinned
 * here is only what the job itself decides, and every one of those decisions is
 * the kind that regresses silently rather than loudly:
 *
 *  - **the test gate.** `registrar.isEnabled()` is the single reason the suites
 *    never grow a live cron. A job that registered past it would have every
 *    integration boot start polling whatever Dawarich URL sits in the fixture
 *    database.
 *  - **the interval clamp.** `dawarich_poll_interval_minutes` is typed by an
 *    admin, so '0', '600' and a stray word all have to land on the 15-minute
 *    default instead of producing a cron expression the scheduler would reject
 *    or, worse, one that fires every minute. The numbers differ from the
 *    AirTrail job next door on purpose (floor 5 against its 1, default 15
 *    against its 5), which is exactly the kind of difference a later
 *    copy-paste flattens: a flight lands once, while a visit detector emits
 *    continuously, and a minute-by-minute poll would hammer a self-hosted box
 *    for suggestions nobody is waiting on.
 *  - **the single read.** The setting is resolved once at bootstrap and the
 *    cron registered once, which is what the job's docblock promises. A tick
 *    that re-read app_settings would put a query on a timer for a value it
 *    could not act on anyway without re-registering.
 *  - **the swallow.** `tick` is the cron callback, so an escaping rejection is
 *    an unhandled rejection inside the scheduler, not a failed sync. Whatever
 *    was thrown (an Error, or the bare value an HTTP layer sometimes rejects
 *    with) has to end as one log line and a resolved promise.
 *  - **the addon gate's absence here.** It lives per tick inside `runSync`,
 *    which is what lets an admin switch the addon off without a restart. A copy
 *    of it in the job would freeze that decision at bootstrap, and the bug
 *    would look like "the toggle needs a restart", not like a failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

import { DawarichSyncJob } from '../../../src/nest/integrations/dawarich-sync.job';
import type { DawarichSyncService } from '../../../src/nest/integrations/dawarich-sync.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';

const SETTING_KEY = 'dawarich_poll_interval_minutes';

/**
 * `undefined` for the interval stands for "no app_settings row at all" (the
 * shape the optional chain in the job handles), while '' stands for a row
 * someone blanked, which only the `|| '15'` fallback catches. Two different
 * paths to the same default, and both have shipped as bugs elsewhere.
 */
function makeJob(intervalSetting?: string, enabled = true) {
  let onTick: (() => void | Promise<void>) | undefined;
  const registrar = {
    isEnabled: vi.fn(() => enabled),
    register: vi.fn((_name: string, _expression: string, cb: () => void | Promise<void>) => {
      onTick = cb;
      return enabled;
    }),
    unregister: vi.fn(),
  };
  // Shaped like the real `get<T>(sql, ...params)` rather than a bare `vi.fn()`
  // so the stub cannot quietly drift from the signature the job calls; the
  // statement and the key are the whole point of DAWARICH-JOB-002.
  const db = {
    get: vi.fn((_sql: string, ..._params: unknown[]) => (intervalSetting === undefined ? undefined : { value: intervalSetting })),
  };
  const sync = {
    runSync: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    syncGloballyEnabled: vi.fn(() => false),
  };
  const job = new DawarichSyncJob(
    db as unknown as DatabaseService,
    sync as unknown as DawarichSyncService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, registrar, db, sync, takeTick: () => onTick };
}

beforeEach(() => vi.clearAllMocks());

describe('DawarichSyncJob bootstrap', () => {
  it('DAWARICH-JOB-001: registers */N under the job name the scheduler reports, and logs the banner', () => {
    const { job, registrar } = makeJob('30');
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('dawarich-sync', '*/30 * * * *', expect.any(Function));
    expect(logMock.logInfo).toHaveBeenCalledWith('Dawarich sync: scheduled every 30m');
  });

  it('DAWARICH-JOB-002: reads its own setting key, not the AirTrail one', () => {
    // Both jobs run the identical statement against app_settings; a copy-paste
    // that kept 'airtrail_poll_interval_minutes' would silently inherit the
    // other integration's cadence and nothing anywhere would fail.
    const { job, db } = makeJob('20');
    job.onApplicationBootstrap();
    expect(db.get).toHaveBeenCalledWith('SELECT value FROM app_settings WHERE key = ?', SETTING_KEY);
  });

  it('DAWARICH-JOB-003: clamps the interval to 5-59 minutes and falls back to 15 on anything else', () => {
    for (const [setting, minutes] of [
      [undefined, 15], // no row at all
      ['', 15], // row present but blank
      ['not-a-number', 15], // parseInt -> NaN
      ['0', 15], // below the floor
      ['4', 15], // one under the floor
      ['60', 15], // one over the ceiling
      ['5', 5], // the floor itself is allowed
      ['59', 59], // and so is the ceiling
    ] as const) {
      vi.clearAllMocks();
      const { job, registrar } = makeJob(setting);
      job.onApplicationBootstrap();
      expect(registrar.register).toHaveBeenCalledWith('dawarich-sync', `*/${minutes} * * * *`, expect.any(Function));
      expect(logMock.logInfo).toHaveBeenCalledWith(`Dawarich sync: scheduled every ${minutes}m`);
    }
  });

  it('DAWARICH-JOB-004: takes the leading integer of a sloppy value rather than refusing it', () => {
    // parseInt is lenient and the clamp is what makes that safe: '20 minutes'
    // out of a hand-edited setting is still a usable 20, and everything the
    // clamp dislikes has already gone to the default in the case above.
    const { job, registrar } = makeJob('20 minutes');
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('dawarich-sync', '*/20 * * * *', expect.any(Function));
  });

  it('DAWARICH-JOB-005: the test gate stops the job before it registers, logs or even touches the database', () => {
    const { job, registrar, db } = makeJob('15', false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('DAWARICH-JOB-006: the callback handed to the registrar is the tick, so a fired cron reaches runSync', async () => {
    const { job, sync, takeTick } = makeJob('15');
    job.onApplicationBootstrap();
    const onTick = takeTick();
    expect(onTick).toBeTypeOf('function');
    await onTick?.();
    expect(sync.runSync).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-JOB-012: resolves the interval once at bootstrap, so a tick neither re-reads the setting nor re-registers', async () => {
    // Reading it per tick would be invisible in behaviour (the cadence would
    // still be right) and would put an app_settings SELECT on a timer forever.
    // Unregistering is the registrar's own business inside register(); the job
    // calling it would leave a window where no cron exists at all.
    const { job, db, registrar, takeTick } = makeJob('15');
    job.onApplicationBootstrap();
    await takeTick()?.();
    expect(db.get).toHaveBeenCalledTimes(1);
    expect(registrar.register).toHaveBeenCalledTimes(1);
    expect(registrar.unregister).not.toHaveBeenCalled();
  });
});

describe('DawarichSyncJob tick', () => {
  it('DAWARICH-JOB-007: delegates to runSync and stays quiet on success', async () => {
    const { job, sync } = makeJob('15');
    await expect(job.tick()).resolves.toBeUndefined();
    expect(sync.runSync).toHaveBeenCalledTimes(1);
    expect(logMock.logError).not.toHaveBeenCalled();
  });

  it('DAWARICH-JOB-008: an unreachable instance becomes one log line and a resolved promise, never an unhandled rejection in the scheduler', async () => {
    const { job, sync } = makeJob('15');
    sync.runSync.mockRejectedValue(new Error('fetch failed'));
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Dawarich sync tick failed: fetch failed');
  });

  it('DAWARICH-JOB-009: a non-Error rejection is logged by value instead of as an empty message', async () => {
    // Rejecting with a bare string is what a couple of fetch/abort paths do;
    // reading .message off that would have logged "undefined" and buried the
    // one piece of information the operator needs.
    const { job, sync } = makeJob('15');
    sync.runSync.mockRejectedValue('ECONNREFUSED');
    await expect(job.tick()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledWith('Dawarich sync tick failed: ECONNREFUSED');
  });

  it('DAWARICH-JOB-010: a failed tick does not poison the next one', async () => {
    // The job keeps no state across ticks, so the cron recovers on its own
    // after an outage instead of needing a restart.
    const { job, sync } = makeJob('15');
    sync.runSync.mockRejectedValueOnce(new Error('down'));
    await job.tick();
    await job.tick();
    expect(sync.runSync).toHaveBeenCalledTimes(2);
    expect(logMock.logError).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-JOB-011: does not re-check the addon gate itself, leaving the per-tick check inside runSync as the only one', async () => {
    // Copying the gate up here would make an admin toggle need a restart, the
    // exact behaviour the job's docblock says it avoids.
    const { job, sync } = makeJob('15');
    await job.tick();
    expect(sync.runSync).toHaveBeenCalledTimes(1);
    expect(sync.syncGloballyEnabled).not.toHaveBeenCalled();
  });
});
