/**
 * The two crons of the community enrichment: registration behind the test
 * gate, the log retention cut-off, that a failing run or sweep stays inside
 * its tick, the run a save starts at once, and the catch-up step before
 * every run.
 */
import type { PlaceContribLogRepository } from '../../../../src/db/repositories/PlaceContribLog.repository';
import { inOrder } from '../../../../src/nest/common/in-order';
import type { PlaceContribBackfill } from '../../../../src/nest/place-contrib/place-contrib-backfill.service';
import type { PlaceContribSender } from '../../../../src/nest/place-contrib/place-contrib-sender.service';
import { PlaceContribJob } from '../../../../src/nest/place-contrib/place-contrib.job';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

function make(enabled = true) {
  const sender = { run: vi.fn(async () => ({ skipped: null, places: 0, expired: 0 })) };
  const backfill = { step: vi.fn(async () => 0) };
  const log = { purgeBefore: vi.fn(async () => 0) };
  const registrar = { isEnabled: vi.fn(() => enabled), register: vi.fn(() => enabled) };
  const job = new PlaceContribJob(
    sender as unknown as PlaceContribSender,
    backfill as unknown as PlaceContribBackfill,
    log as unknown as PlaceContribLogRepository,
    registrar as unknown as CronRegistrarService,
  );
  return { job, sender, backfill, log, registrar };
}

beforeEach(() => vi.clearAllMocks());

describe('PlaceContribJob', () => {
  it('PCJ-001: registers the sender every two minutes and the retention at night', () => {
    const { job, registrar } = make();
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('place-contrib-send', '*/2 * * * *', expect.any(Function));
    expect(registrar.register).toHaveBeenCalledWith('place-contrib-log-retention', '50 3 * * *', expect.any(Function));
  });

  it('PCJ-002: registers nothing under the test gate', () => {
    const { job, registrar } = make(false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('PCJ-003: the registered ticks run the sender and the sweep', async () => {
    const { job, registrar, sender, log } = make();
    job.onApplicationBootstrap();
    const ticks = registrar.register.mock.calls.map((call) => (call as unknown[])[2] as () => Promise<void>);
    await inOrder(ticks, (tick) => tick());
    expect(sender.run).toHaveBeenCalledTimes(1);
    expect(log.purgeBefore).toHaveBeenCalledTimes(1);
  });

  it('PCJ-004: keeps 90 days of log and says so only when it removed something', async () => {
    const { job, log } = make();
    await job.retain(new Date('2026-10-30T03:50:00Z'));
    expect(log.purgeBefore).toHaveBeenCalledWith('2026-08-01');
    expect(logMock.logInfo).not.toHaveBeenCalled();
    log.purgeBefore.mockResolvedValueOnce(4);
    await job.retain(new Date('2026-10-30T03:50:00Z'));
    expect(logMock.logInfo).toHaveBeenCalledWith(expect.stringContaining('4'));
  });

  it('PCJ-005: a failing run or sweep is logged, never thrown into the scheduler', async () => {
    const { job, sender, log } = make();
    sender.run.mockRejectedValueOnce(new Error('database is locked'));
    log.purgeBefore.mockRejectedValueOnce(new Error('disk full'));
    await expect(job.send()).resolves.toBeUndefined();
    await expect(job.retain()).resolves.toBeUndefined();
    expect(logMock.logError).toHaveBeenCalledTimes(2);
  });
  it('PCJ-006: a save sends at once where the schedules run, and nowhere else', async () => {
    const off = make(false);
    off.job.onApplicationBootstrap();
    off.job.sendSoon();
    expect(off.sender.run).not.toHaveBeenCalled();

    const on = make();
    on.job.onApplicationBootstrap();
    on.job.sendSoon();
    await vi.waitFor(() => expect(on.sender.run).toHaveBeenCalledTimes(1));
  });

  it('PCJ-007: one run at a time, and a run asked for meanwhile follows right after it', async () => {
    const { job, sender } = make();
    let release: () => void = () => undefined;
    sender.run.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ skipped: null, places: 1, expired: 0 });
        }),
    );
    const first = job.send();
    const second = job.send();
    const third = job.send();
    // The catch-up step comes first, so the sender starts a moment later.
    await vi.waitFor(() => expect(sender.run).toHaveBeenCalledTimes(1));
    release();
    await Promise.all([first, second, third]);
    expect(sender.run).toHaveBeenCalledTimes(2);
  });

  it('PCJ-008: every run first tops the queue up from the catch-up, and a failed step still sends', async () => {
    const { job, sender, backfill } = make();
    await job.send();
    expect(backfill.step).toHaveBeenCalledTimes(1);
    expect(backfill.step.mock.invocationCallOrder[0]).toBeLessThan(sender.run.mock.invocationCallOrder[0]);

    backfill.step.mockRejectedValueOnce(new Error('database is locked'));
    await job.send();
    expect(sender.run).toHaveBeenCalledTimes(2);
    expect(logMock.logError).toHaveBeenCalledWith(expect.stringContaining('catch-up'));
  });
});
