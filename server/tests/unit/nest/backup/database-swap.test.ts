/**
 * The restore step the two backup ports share (`database-swap.ts`): the swap,
 * then a reopen that always runs, and how the two failures surface.
 */
import { keepRestoreCopy, replaceThenReopen } from '../../../../src/nest/backup/database-swap';
import { DatabaseConnectionLostError } from '../../../../src/nest/database/database-backup.interface';

import { describe, expect, it, vi } from 'vitest';

const ok = async () => undefined;
const fails = (error: unknown) => async () => {
  throw error;
};

describe('replaceThenReopen', () => {
  it('SWAP-001: a swap that lands and a reopen that works resolves with no reopen error', async () => {
    const swap = vi.fn(ok);
    const reopen = vi.fn(ok);

    await expect(replaceThenReopen(swap, reopen)).resolves.toEqual({ reopenError: null });
    expect(swap).toHaveBeenCalledTimes(1);
    expect(reopen).toHaveBeenCalledTimes(1);
  });

  it('SWAP-002: a swap that lands and a reopen that fails resolves with the reopen error, so the caller says restart', async () => {
    const lost = new Error('reconnect failed');

    await expect(replaceThenReopen(ok, fails(lost))).resolves.toEqual({ reopenError: lost });
  });

  it('SWAP-003: a swap that fails still reopens, and its own error is rethrown', async () => {
    const reopen = vi.fn(ok);
    const swapError = new Error('rename failed');

    await expect(replaceThenReopen(fails(swapError), reopen)).rejects.toBe(swapError);
    expect(reopen).toHaveBeenCalledTimes(1);
  });

  it('SWAP-004: a swap and a reopen that both fail go up together, as DatabaseConnectionLostError', async () => {
    const swapError = new Error('rename failed');
    const reopenError = new Error('reconnect failed');

    const thrown = await replaceThenReopen(fails(swapError), fails(reopenError)).catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(DatabaseConnectionLostError);
    expect((thrown as DatabaseConnectionLostError).swapError).toBe(swapError);
    expect((thrown as DatabaseConnectionLostError).cause).toBe(reopenError);
  });

  it('SWAP-005: a step that throws undefined still counts as failed', async () => {
    // A reopen that throws undefined is a failure: with a swap that also failed, the two go up as the lost connection.
    await expect(replaceThenReopen(fails(new Error('rename failed')), fails(undefined))).rejects.toBeInstanceOf(
      DatabaseConnectionLostError,
    );
    // A swap that throws undefined rethrows undefined, the same value the step threw.
    await expect(replaceThenReopen(fails(undefined), ok)).rejects.toBeUndefined();
  });

  it('SWAP-006: a synchronous swap that throws is caught like an async one', async () => {
    const swapError = new Error('copy failed');
    const reopen = vi.fn(ok);

    await expect(
      replaceThenReopen(() => {
        throw swapError;
      }, reopen),
    ).rejects.toBe(swapError);
    expect(reopen).toHaveBeenCalledTimes(1);
  });
});

describe('keepRestoreCopy', () => {
  it('SWAP-007: resolves with the target once the copy is written', async () => {
    await expect(keepRestoreCopy('/data/pre-restore-1.db', ok)).resolves.toBe('/data/pre-restore-1.db');
  });

  it('SWAP-008: a copy that cannot be written resolves with null, so the restore goes on', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await expect(keepRestoreCopy('/data/pre-restore-2.db', fails(new Error('disk full')))).resolves.toBeNull();
    } finally {
      warn.mockRestore();
    }
  });
});
