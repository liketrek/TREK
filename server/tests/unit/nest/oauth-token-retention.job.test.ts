import type { OauthTokensRepository } from '../../../src/db/repositories/OauthTokens.repository';
import { OauthTokenRetentionJob, OAUTH_TOKEN_RETENTION_DAYS } from '../../../src/nest/oauth/oauth-token-retention.job';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

function make(deleteExpiredBefore: (cutoff: string) => Promise<number>, enabled = true) {
  const registrar = { isEnabled: vi.fn(() => enabled), register: vi.fn() };
  const job = new OauthTokenRetentionJob(
    { deleteExpiredBefore } as unknown as OauthTokensRepository,
    registrar as unknown as CronRegistrarService,
  );
  return { job, registrar };
}

describe('OauthTokenRetentionJob', () => {
  it('OAUTHRET-001: registers a nightly job, and nothing under the test gate', () => {
    const { job, registrar } = make(vi.fn());
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('oauth-token-retention', '30 3 * * *', expect.any(Function));

    const gated = make(vi.fn(), false);
    gated.job.onApplicationBootstrap();
    expect(gated.registrar.register).not.toHaveBeenCalled();
  });

  it('OAUTHRET-002: deletes what expired more than the retention period ago and logs the count', async () => {
    const del = vi.fn().mockResolvedValue(4);
    await make(del).job.tick(new Date('2026-10-07T00:00:00.000Z'));
    expect(OAUTH_TOKEN_RETENTION_DAYS).toBe(30);
    expect(del).toHaveBeenCalledWith('2026-09-07 00:00:00');
    expect(logMock.logInfo).toHaveBeenCalledWith('OAuth token retention: removed 4 expired token(s)');
  });

  it('OAUTHRET-003: a failing purge is logged, not thrown', async () => {
    await make(vi.fn().mockRejectedValue(new Error('database is locked'))).job.tick();
    expect(logMock.logError).toHaveBeenCalledWith('OAuth token retention: database is locked');
  });
});
