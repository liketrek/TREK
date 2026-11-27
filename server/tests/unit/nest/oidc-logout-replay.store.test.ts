/**
 * The in-memory store of logout tokens already acted on: a key is refused
 * while its entry lives, accepted again once it expired or was released, and the map never
 * holds more than its cap.
 */
import {
  InMemoryOidcLogoutReplayStore,
  OIDC_LOGOUT_REPLAY_MAX_ENTRIES,
} from '../../../src/nest/oidc/oidc-logout-replay.store';

import { describe, expect, it } from 'vitest';

describe('InMemoryOidcLogoutReplayStore', () => {
  it('BCL-REPLAY-001: the first claim wins, a second one while the entry lives is a replay', async () => {
    const store = new InMemoryOidcLogoutReplayStore();
    expect(await store.claim('iss\nj1', 2000, 1000)).toBe(true);
    expect(await store.claim('iss\nj1', 2000, 1500)).toBe(false);
    expect(await store.claim('iss\nj2', 2000, 1500)).toBe(true);
  });

  it('BCL-REPLAY-002: an expired entry no longer refuses its key', async () => {
    const store = new InMemoryOidcLogoutReplayStore();
    expect(await store.claim('k', 2000, 1000)).toBe(true);
    expect(await store.claim('k', 3000, 2000)).toBe(true);
    expect(await store.claim('k', 3000, 2500)).toBe(false);
  });

  it('BCL-REPLAY-003: at the cap the expired entries go first', async () => {
    const store = new InMemoryOidcLogoutReplayStore(3);
    await store.claim('old', 1100, 1000);
    await store.claim('live-a', 9000, 1000);
    await store.claim('live-b', 9000, 1000);
    expect(await store.claim('new', 9000, 2000)).toBe(true);
    expect(store.size).toBe(3);
    // The live ones are still held, the expired one made the room.
    expect(await store.claim('live-a', 9000, 2000)).toBe(false);
    expect(await store.claim('live-b', 9000, 2000)).toBe(false);
  });

  it('BCL-REPLAY-004: with nothing expired the oldest entry goes, so memory stays bounded', async () => {
    const store = new InMemoryOidcLogoutReplayStore(2);
    await store.claim('first', 9000, 1000);
    await store.claim('second', 9000, 1000);
    await store.claim('third', 9000, 1000);
    expect(store.size).toBe(2);
    expect(await store.claim('second', 9000, 1000)).toBe(false);
    expect(await store.claim('third', 9000, 1000)).toBe(false);
  });

  it('BCL-REPLAY-005: the default cap is the documented one', () => {
    expect(OIDC_LOGOUT_REPLAY_MAX_ENTRIES).toBe(10_000);
  });

  it('BCL-REPLAY-006: a released key is accepted again, and the other keys stay held', async () => {
    const store = new InMemoryOidcLogoutReplayStore();
    expect(await store.claim('a', 9000, 1000)).toBe(true);
    expect(await store.claim('b', 9000, 1000)).toBe(true);
    await store.release('a');
    expect(store.size).toBe(1);
    expect(await store.claim('a', 9000, 1500)).toBe(true);
    expect(await store.claim('b', 9000, 1500)).toBe(false);
    await expect(store.release('never-held')).resolves.toBeUndefined();
  });
});
