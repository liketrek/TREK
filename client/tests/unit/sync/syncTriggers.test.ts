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
const loadSettings = vi.fn(() => Promise.resolve());

let refetchCb: ((tripId: string) => void) | null = null;
let preReconnect: (() => Promise<void>) | null = null;
let settingsLoaded = false;
let authenticated = true;

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
vi.mock('../../../src/store/settingsStore', () => ({
  useSettingsStore: { getState: () => ({ isLoaded: settingsLoaded, loadSettings }) },
}));
vi.mock('../../../src/store/authStore', () => ({
  useAuthStore: { getState: () => ({ isAuthenticated: authenticated }) },
}));

import { registerSyncTriggers, unregisterSyncTriggers } from '../../../src/sync/syncTriggers';

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  flush.mockClear(); syncAll.mockClear(); hydrate.mockClear(); loadSettings.mockClear();
  refetchCb = null; preReconnect = null;
  settingsLoaded = false; authenticated = true;
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

  it('online event retries the settings load when it has not yet succeeded (#1618)', async () => {
    registerSyncTriggers();
    window.dispatchEvent(new Event('online'));
    await flushMicrotasks();

    expect(loadSettings).toHaveBeenCalled();
  });

  it('does not retry the settings load once it has loaded', async () => {
    settingsLoaded = true;
    registerSyncTriggers();
    window.dispatchEvent(new Event('online'));
    await flushMicrotasks();

    expect(loadSettings).not.toHaveBeenCalled();
  });

  it('does not retry the settings load while unauthenticated', async () => {
    authenticated = false;
    registerSyncTriggers();
    window.dispatchEvent(new Event('online'));
    await flushMicrotasks();

    expect(loadSettings).not.toHaveBeenCalled();
  });
});
