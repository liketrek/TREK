import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWritesInOrder } from './useWritesInOrder';

/** A write that only finishes when the test says so, and notes when it starts and ends. */
function heldWrite(log: string[], name: string) {
  let finish!: () => void;
  let fail!: (err: Error) => void;
  const done = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  const write = async () => {
    log.push(`${name} start`);
    await done;
    log.push(`${name} end`);
  };
  return { write, finish, fail };
}

describe('useWritesInOrder', () => {
  it('FE-HOOK-WRITES-001: a write starts only once the one before it has finished', async () => {
    const { result } = renderHook(() => useWritesInOrder());
    const log: string[] = [];
    const first = heldWrite(log, 'first');
    const second = heldWrite(log, 'second');

    const firstDone = result.current(first.write);
    const secondDone = result.current(second.write);
    await Promise.resolve();
    expect(log).toEqual(['first start']);

    second.finish();
    first.finish();
    await Promise.all([firstDone, secondDone]);
    expect(log).toEqual(['first start', 'first end', 'second start', 'second end']);
  });

  it('FE-HOOK-WRITES-002: a failed write does not hold up the next one, and its caller sees the failure', async () => {
    const { result } = renderHook(() => useWritesInOrder());
    const log: string[] = [];
    const first = heldWrite(log, 'first');
    const second = heldWrite(log, 'second');

    const firstDone = result.current(first.write);
    const secondDone = result.current(second.write);
    first.fail(new Error('offline'));
    await expect(firstDone).rejects.toThrow('offline');

    second.finish();
    await secondDone;
    expect(log).toEqual(['first start', 'second start', 'second end']);
  });

  it('FE-HOOK-WRITES-003: the order holds across renders of the component using it', async () => {
    const { result, rerender } = renderHook(() => useWritesInOrder());
    const log: string[] = [];
    const first = heldWrite(log, 'first');
    const second = heldWrite(log, 'second');

    const firstDone = result.current(first.write);
    rerender();
    const secondDone = result.current(second.write);
    await Promise.resolve();
    expect(log).toEqual(['first start']);

    first.finish();
    second.finish();
    await Promise.all([firstDone, secondDone]);
    expect(log).toEqual(['first start', 'first end', 'second start', 'second end']);
  });
});
