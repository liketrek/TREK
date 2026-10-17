/**
 * traceEntry (nest/audit/entry-trace.logger.ts): one correlation id and one
 * log line per call of a non-HTTP entry point, without changing what the call
 * returns or when it runs. TRACE-001 through TRACE-010.
 */
import { traceEntry, wasTraced } from '../../../src/nest/audit/entry-trace.logger';
import { currentCorrelation, runWithCorrelation } from '../../../src/nest/common/request-correlation';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const log = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => log);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('traceEntry', () => {
  it('TRACE-001: a plain value comes back as it is, synchronously, with one debug line', () => {
    const result = traceEntry('ws', 'join user=3', () => 42);
    expect(result).toBe(42);
    expect(log.logDebug).toHaveBeenCalledTimes(1);
    expect(log.logDebug.mock.calls[0][0]).toMatch(/^ws join user=3 ok \d+ms$/);
  });

  it('TRACE-002: the call runs under its own correlation, nested under the current one', () => {
    let inside: ReturnType<typeof currentCorrelation>;
    runWithCorrelation({ id: 'req-1', kind: 'http' }, () => {
      traceEntry('mcp', 'tool list_trips user=1', () => {
        inside = currentCorrelation();
      });
    });
    expect(inside!.kind).toBe('mcp');
    expect(inside!.parentId).toBe('req-1');
    expect(inside!.id).not.toBe('req-1');
    expect(log.logDebug.mock.calls[0][0]).toContain(' parent=req-1');
  });

  it('TRACE-003: a promise comes back as that same promise, and the line waits for it to settle', async () => {
    let resolve!: (value: string) => void;
    const pending = new Promise<string>((r) => {
      resolve = r;
    });
    const result = traceEntry('rpc', 'p1 trips.get', () => pending);
    expect(result).toBe(pending);
    expect(log.logDebug).not.toHaveBeenCalled();
    resolve('done');
    await expect(result).resolves.toBe('done');
    await vi.waitFor(() => expect(log.logDebug).toHaveBeenCalledTimes(1));
  });

  it('TRACE-004: a synchronous throw is logged at warn and rethrown', () => {
    expect(() =>
      traceEntry('ws', 'join', () => {
        throw new Error('nope');
      }),
    ).toThrow('nope');
    expect(log.logWarn.mock.calls[0][0]).toMatch(/^ws join failed \d+ms: nope$/);
  });

  it('TRACE-005: a rejection is logged with the configured level and wording, and marked as reported', async () => {
    const boom = new Error('disk full');
    const result = traceEntry('cron', 'auto-backup', () => Promise.reject(boom), {
      failureLevel: 'error',
      failureMessage: (error) => `Cron job "auto-backup" failed: ${(error as Error).message}`,
    });
    await expect(result).rejects.toBe(boom);
    await vi.waitFor(() => expect(log.logError).toHaveBeenCalledWith('Cron job "auto-backup" failed: disk full'));
    expect(wasTraced(boom)).toBe(true);
    expect(wasTraced(new Error('other'))).toBe(false);
    expect(wasTraced('a string')).toBe(false);
  });

  it('TRACE-006: a call that answers with a refusal is logged at warn with the reason', async () => {
    const answer = { ok: false as const, error: 'FORBIDDEN' };
    await traceEntry('rpc', 'p1 trips.update', () => Promise.resolve(answer), {
      refusal: (value) => (value.ok ? null : value.error),
    });
    await vi.waitFor(() => expect(log.logWarn).toHaveBeenCalledTimes(1));
    expect(log.logWarn.mock.calls[0][0]).toMatch(/^rpc p1 trips.update refused \d+ms: FORBIDDEN$/);
    expect(log.logDebug).not.toHaveBeenCalled();
  });

  it('TRACE-007: every line the call writes carries the same correlation', async () => {
    const seen: Array<string | undefined> = [];
    await traceEntry('cron', 'docsync', async () => {
      seen.push(currentCorrelation()?.id);
      await new Promise((resolve) => setTimeout(resolve, 1));
      seen.push(currentCorrelation()?.id);
    });
    expect(seen[0]).toBeDefined();
    expect(seen[1]).toBe(seen[0]);
  });

  it('TRACE-008: two calls never share an id', () => {
    const ids = [1, 2].map(() => traceEntry('ws', 'leave', () => currentCorrelation()?.id));
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('TRACE-009: a call that skips its work on purpose is logged at debug as skipped, not ok', async () => {
    const skipped = (outcome: string) => (outcome === 'skipped' ? 'lease held by another process' : null);
    await traceEntry('cron', 'auto-backup', () => Promise.resolve('skipped'), { skipped });
    await traceEntry('cron', 'auto-backup', () => Promise.resolve('ran'), { skipped });
    await vi.waitFor(() => expect(log.logDebug).toHaveBeenCalledTimes(2));
    expect(log.logDebug.mock.calls[0][0]).toMatch(/^cron auto-backup skipped \d+ms: lease held by another process$/);
    expect(log.logDebug.mock.calls[1][0]).toMatch(/^cron auto-backup ok \d+ms$/);
    expect(log.logWarn).not.toHaveBeenCalled();
  });
  it('TRACE-010: a rejection with a primitive is logged by its string form and cannot be marked as reported', async () => {
    const call = Promise.reject(404);
    const traced = traceEntry('rpc', 'plugin demo trips.get', () => call);
    await expect(traced).rejects.toBe(404);
    await vi.waitFor(() => expect(log.logWarn).toHaveBeenCalledTimes(1));
    expect(log.logWarn.mock.calls[0][0]).toMatch(/^rpc plugin demo trips\.get failed \d+ms: 404$/);
    // An outer handler cannot tell it was logged, so it may log it once more;
    // that is the price of a primitive, and the line it writes is still there.
    expect(wasTraced(404)).toBe(false);
  });
});
