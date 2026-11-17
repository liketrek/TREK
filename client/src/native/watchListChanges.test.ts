import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offlineDb } from '../db/offlineDb';
import type { PackingItem, TodoItem } from '../types';
import { onWatchListsChange } from './watchListChanges';

// FE-NATIVE-WATCHSYNC-001 onwards: the watch hears of a list change at once, not on the next refresh.

const packing = (id: number, checked: number) =>
  ({ id, trip_id: 1, name: `Item ${id}`, checked }) as unknown as PackingItem;
const todo = (id: number, checked: number) => ({ id, trip_id: 1, name: `Task ${id}`, checked }) as unknown as TodoItem;

/** Long enough for the live query to answer and the settle window to pass. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 120));

describe('onWatchListsChange', () => {
  let stop: (() => void) | null = null;

  beforeEach(async () => {
    await offlineDb.packingItems.clear();
    await offlineDb.todoItems.clear();
    await offlineDb.packingItems.put(packing(1, 0));
    await offlineDb.todoItems.put(todo(2, 0));
  });

  afterEach(() => {
    stop?.();
    stop = null;
  });

  it('FE-NATIVE-WATCHSYNC-001: subscribing is no change, a tick on the packing list is', async () => {
    const run = vi.fn();
    stop = onWatchListsChange(run, 20);
    await settled();
    expect(run).not.toHaveBeenCalled();

    await offlineDb.packingItems.put(packing(1, 1));
    await settled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('FE-NATIVE-WATCHSYNC-002: a to-do ticked, here or by another member, counts as well', async () => {
    const run = vi.fn();
    stop = onWatchListsChange(run, 20);
    await settled();
    await offlineDb.todoItems.put(todo(2, 1));
    await settled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('FE-NATIVE-WATCHSYNC-003: a run of ticks settles into one refresh', async () => {
    const run = vi.fn();
    stop = onWatchListsChange(run, 60);
    await settled();
    await offlineDb.packingItems.put(packing(1, 1));
    await offlineDb.packingItems.put(packing(3, 0));
    await offlineDb.todoItems.put(todo(2, 1));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('FE-NATIVE-WATCHSYNC-004: after the unsubscribe nothing is called any more', async () => {
    const run = vi.fn();
    stop = onWatchListsChange(run, 20);
    await settled();
    stop();
    stop = null;
    await offlineDb.packingItems.put(packing(1, 1));
    await settled();
    expect(run).not.toHaveBeenCalled();
  });
});
