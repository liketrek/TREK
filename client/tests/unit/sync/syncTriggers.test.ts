/**
 * syncTriggers — reconnect/online wiring (H1).
 *
 * Verifies the previously-dead refetch path is wired: on WS reconnect and on the
 * `online` event the active trip's store is re-hydrated (after the queue flush).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const flush = vi.fn(() => Promise.resolve());
const syncAll = vi.fn(() => Promise.resolve());
const hydrate = vi.fn(() => Promise.resolve());

let refetchCb: ((tripId: string) => void) | null = null;
let preReconnect: (() => Promise<void>) | null = null;

vi.mock('../../../src/sync/mutationQueue', () => ({
  mutationQueue: { flush: () => flush() },
}));
vi.mock('../../../src/sync/tripSyncManager', () => ({
  tripSyncManager: { syncAll: () => syncAll() },
}));
vi.mock('../../../src/api/websocket', () => ({
  setPreReconnectHook: (fn: (() => Promise<void>) | null) => { preReconnect = fn; },
  setRefetchCallback: (fn: ((tripId: string) => void) | null) => { refetchCb = fn; },
  getActiveTrips: () => ['7'],
}));
vi.mock('../../../src/store/tripStore', () => ({
  useTripStore: { getState: () => ({ hydrateActiveTrip: hydrate }) },
}));

import { registerSyncTriggers, unregisterSyncTriggers } from '../../../src/sync/syncTriggers';

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  flush.mockClear(); syncAll.mockClear(); hydrate.mockClear();
  refetchCb = null; preReconnect = null;
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
});

afterEach(() => {
  unregisterSyncTriggers();
});

describe('syncTriggers', () => {
  it('registers a refetch callback that hydrates the active trip', () => {
    registerSyncTriggers();
    expect(refetchCb).toBeTypeOf('function');
    refetchCb!('7');
    expect(hydrate).toHaveBeenCalledWith('7');
  });

  it('also registers the pre-reconnect flush hook', () => {
    registerSyncTriggers();
    expect(preReconnect).toBeTypeOf('function');
  });

  it('clears both reconnect hooks on unregister', () => {
    registerSyncTriggers();
    unregisterSyncTriggers();
    expect(refetchCb).toBeNull();
    expect(preReconnect).toBeNull();
  });

  it('online event flushes, then re-seeds Dexie and re-hydrates active trips', async () => {
    registerSyncTriggers();
    window.dispatchEvent(new Event('online'));
    await flushMicrotasks();

    expect(flush).toHaveBeenCalled();
    expect(syncAll).toHaveBeenCalled();
    expect(hydrate).toHaveBeenCalledWith('7');
  });
});
