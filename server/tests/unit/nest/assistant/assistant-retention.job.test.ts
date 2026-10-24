import type { AssistantThreadsRepository } from '../../../../src/db/repositories/AssistantThreads.repository';
import type { AssistantToolCallsRepository } from '../../../../src/db/repositories/AssistantToolCalls.repository';
import type { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import type { AiUsageService } from '../../../../src/nest/ai-connections/ai-usage.service';
import {
  AssistantRetentionJob,
  ASSISTANT_USAGE_RETENTION_DAYS,
} from '../../../../src/nest/assistant/assistant-retention.job';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import type { AiRetention } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

function make(retention: AiRetention, enabled = true) {
  const threads = { deleteIdleBefore: vi.fn().mockResolvedValue(2), deleteWithoutAccess: vi.fn().mockResolvedValue(1) };
  const toolCalls = { expireBefore: vi.fn().mockResolvedValue([{ id: 'a', message_id: 1 }]) };
  const connections = { readSettings: vi.fn().mockResolvedValue({ policy: 'user', dailyTurns: 50, retention }) };
  const usage = { purgeOlderThan: vi.fn().mockResolvedValue(3) };
  const registrar = { isEnabled: vi.fn(() => enabled), register: vi.fn() };
  const job = new AssistantRetentionJob(
    threads as unknown as AssistantThreadsRepository,
    toolCalls as unknown as AssistantToolCallsRepository,
    connections as unknown as AiConnectionsService,
    usage as unknown as AiUsageService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, threads, toolCalls, usage, registrar };
}

const NOW = new Date('2026-10-21T03:45:00.000Z');

describe('AssistantRetentionJob', () => {
  it('ASTRET-001: registers a nightly job, and nothing under the test gate', () => {
    const { job, registrar } = make({ mode: 'days', days: 90 });
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('assistant-retention', '45 3 * * *', expect.any(Function));
    const gated = make({ mode: 'days', days: 90 }, false);
    gated.job.onApplicationBootstrap();
    expect(gated.registrar.register).not.toHaveBeenCalled();
  });

  it('ASTRET-002: drops idle and orphaned conversations, expires day-old changes, trims usage', async () => {
    const t = make({ mode: 'days', days: 90 });
    await t.job.tick(NOW);
    expect(t.threads.deleteIdleBefore).toHaveBeenCalledWith('2026-07-23 03:45:00');
    expect(t.threads.deleteWithoutAccess).toHaveBeenCalled();
    expect(t.toolCalls.expireBefore).toHaveBeenCalledWith('2026-10-20 03:45:00');
    expect(t.usage.purgeOlderThan).toHaveBeenCalledWith(ASSISTANT_USAGE_RETENTION_DAYS);
    expect(logMock.logInfo).toHaveBeenCalledWith('Assistant retention: removed 3 conversation(s)');
    expect(logMock.logInfo).toHaveBeenCalledWith('Assistant retention: 1 proposed change(s) expired');
  });

  it('ASTRET-003: keeps every conversation under "forever", still sweeping the rest', async () => {
    const t = make({ mode: 'forever' });
    await t.job.tick(NOW);
    expect(t.threads.deleteIdleBefore).not.toHaveBeenCalled();
    expect(t.threads.deleteWithoutAccess).toHaveBeenCalled();
    expect(t.toolCalls.expireBefore).toHaveBeenCalled();
  });

  it('ASTRET-004: a failing pass is logged, not thrown', async () => {
    const t = make({ mode: 'days', days: 30 });
    t.threads.deleteWithoutAccess.mockRejectedValue(new Error('database is locked'));
    await t.job.tick(NOW);
    expect(logMock.logError).toHaveBeenCalledWith('Assistant retention: database is locked');
  });
});
