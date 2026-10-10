import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { SessionPurgeJob } from '../../../../src/nest/sessions/session-purge.job';
import type { SessionsService } from '../../../../src/nest/sessions/sessions.service';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

function make(purgeInactive: (now: Date) => Promise<number>, enabled = true) {
  const registrar = { isEnabled: vi.fn(() => enabled), register: vi.fn() };
  const job = new SessionPurgeJob(
    { purgeInactive } as unknown as SessionsService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, registrar };
}

describe('SessionPurgeJob', () => {
  it('SESSPURGE-001: registers a nightly job through the registrar, and nothing under the test gate', async () => {
    const purge = vi.fn().mockResolvedValue(0);
    const { job, registrar } = make(purge);
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('session-purge', '45 3 * * *', expect.any(Function));

    // The registered callback is the tick.
    await (registrar.register.mock.calls[0][2] as () => Promise<void>)();
    expect(purge).toHaveBeenCalledTimes(1);

    const gated = make(vi.fn(), false);
    gated.job.onApplicationBootstrap();
    expect(gated.registrar.register).not.toHaveBeenCalled();
  });

  it('SESSPURGE-002: purges as of the tick time and logs what went', async () => {
    const purge = vi.fn().mockResolvedValue(3);
    const now = new Date('2026-10-08T03:45:00.000Z');
    await make(purge).job.tick(now);
    expect(purge).toHaveBeenCalledWith(now);
    expect(logMock.logInfo).toHaveBeenCalledWith('Session purge: removed 3 expired session(s)');
  });

  it('SESSPURGE-003: stays quiet when there was nothing to purge', async () => {
    logMock.logInfo.mockClear();
    await make(vi.fn().mockResolvedValue(0)).job.tick();
    expect(logMock.logInfo).not.toHaveBeenCalled();
  });

  it('SESSPURGE-004: a failing purge is logged, not thrown', async () => {
    await make(vi.fn().mockRejectedValue(new Error('database is locked'))).job.tick();
    expect(logMock.logError).toHaveBeenCalledWith('Session purge: database is locked');
    await make(vi.fn().mockRejectedValue('plain')).job.tick();
    expect(logMock.logError).toHaveBeenCalledWith('Session purge: plain');
  });
});
