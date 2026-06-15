/**
 * requestPersistentStorage (H8 / M6) — best-effort persistent storage request
 * so prefetched tiles / file blobs / IndexedDB aren't evicted under pressure.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { requestPersistentStorage } from '../../../src/sync/persistentStorage';

const original = (navigator as Navigator & { storage?: StorageManager }).storage;

afterEach(() => {
  Object.defineProperty(navigator, 'storage', { value: original, configurable: true });
  vi.restoreAllMocks();
});

function stubStorage(storage: unknown) {
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });
}

describe('requestPersistentStorage', () => {
  it('requests persistence when not already granted', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(false);
    stubStorage({ persist, persisted });

    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('skips the prompt when already persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(true);
    stubStorage({ persist, persisted });

    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('returns false (no throw) when the API is unavailable', async () => {
    stubStorage(undefined);
    expect(await requestPersistentStorage()).toBe(false);
  });

  it('returns false (no throw) when persist rejects', async () => {
    stubStorage({ persist: vi.fn().mockRejectedValue(new Error('denied')) });
    expect(await requestPersistentStorage()).toBe(false);
  });
});
