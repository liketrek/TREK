import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * What the offline cache is allowed to keep of another member's packing list
 * (#1976).
 *
 * The server scopes these events now, so in ordinary running nothing here has
 * anything to refuse. It refuses anyway, because a leak on the wire used to
 * become permanent on this side: the write is a `put`, the offline read hands
 * back every cached row for the trip without a privacy filter, and nothing ever
 * prunes. One stray event put another member's item into this browser for good,
 * and it surfaced every time a read fell back to the cache — offline, captive
 * portal, dropped connection.
 *
 * So the interesting case is not that the item is skipped. It is that a row
 * which arrived before any of this existed gets deleted when the next event
 * about it comes past, which is what makes an already-leaked list heal itself.
 */

const { packingItems } = vi.hoisted(() => ({
  packingItems: { put: vi.fn(async () => undefined), delete: vi.fn(async () => undefined) },
}));

vi.mock('../../../src/db/offlineDb', () => ({
  offlineDb: {
    packingItems,
    // The handler module touches these at import time only.
    trips: {}, days: {}, places: {}, assignments: {},
  },
}));

import { useTripStore } from '../../../src/store/tripStore';
import { useAuthStore } from '../../../src/store/authStore';
import { resetAllStores } from '../../helpers/store';
import { buildPackingItem } from '../../helpers/factories';

const ME = 7;
const SOMEONE_ELSE = 99;

beforeEach(() => {
  resetAllStores();
  packingItems.put.mockClear();
  packingItems.delete.mockClear();
  useAuthStore.setState({ user: { id: ME, username: 'me', email: 'me@example.test' } as never });
});

const send = (item: unknown) =>
  useTripStore.getState().handleRemoteEvent({ type: 'packing:updated', item } as never);

describe('a packing item arriving over the wire', () => {
  it('is cached when it is shared with the whole trip', async () => {
    send(buildPackingItem({ id: 1, is_private: 0 }));
    expect(packingItems.put).toHaveBeenCalledTimes(1);
    expect(packingItems.delete).not.toHaveBeenCalled();
  });

  it('is cached when it is my own private one', async () => {
    send(buildPackingItem({ id: 2, is_private: 1, owner_id: ME }));
    expect(packingItems.put).toHaveBeenCalledTimes(1);
  });

  it('is cached when it is private but shared with me', async () => {
    send(buildPackingItem({
      id: 3, is_private: 1, owner_id: SOMEONE_ELSE,
      recipients: [{ user_id: ME, username: 'me' }],
    }));
    expect(packingItems.put).toHaveBeenCalledTimes(1);
  });

  /* The assertion that would have caught the leak. */
  it('is not cached when it is somebody else s private one', async () => {
    send(buildPackingItem({ id: 4, is_private: 1, owner_id: SOMEONE_ELSE }));
    expect(packingItems.put).not.toHaveBeenCalled();
  });

  it('removes a copy that an earlier leak already left behind', async () => {
    send(buildPackingItem({ id: 5, is_private: 1, owner_id: SOMEONE_ELSE }));
    expect(packingItems.delete).toHaveBeenCalledWith(5);
  });

  /*
   * A signed-out or not-yet-loaded session has no id to compare against.
   * Refusing is the safe answer: there is no user whose list this could be.
   */
  it('keeps a restricted item out when nobody is signed in', async () => {
    useAuthStore.setState({ user: null });
    send(buildPackingItem({ id: 6, is_private: 1, owner_id: SOMEONE_ELSE }));
    expect(packingItems.put).not.toHaveBeenCalled();
  });
});
