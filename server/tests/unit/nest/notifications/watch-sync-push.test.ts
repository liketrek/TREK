/**
 * The watch sync (WSYNC-*): list changes on a trip become one silent push per
 * member a moment later (WatchSyncPushService), and every trip broadcast
 * reaches its listeners (RealtimeService.onTripBroadcast). The sending itself
 * (WebPushService.sendWatchSync) is tested with the rest of the transport in
 * web-push.service.test.ts.
 */
import {
  WATCH_SYNC_SETTLE_MS,
  WatchSyncPushService,
} from '../../../../src/nest/notifications/push/watch-sync-push.service';
import { WebPushService } from '../../../../src/nest/notifications/transports/web-push.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { TripMembershipService } from '../../../../src/nest/trip-membership/trip-membership.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();

describe('WatchSyncPushService', () => {
  let t: TestModule<RealtimeService>;
  let realtime: RealtimeService;
  let service: WatchSyncPushService;
  const sendWatchSync = vi.fn();
  const getOwnerId = vi.fn();
  const listMemberUserIds = vi.fn();

  beforeEach(async () => {
    sendWatchSync.mockReset().mockResolvedValue(true);
    getOwnerId.mockReset().mockResolvedValue(1);
    listMemberUserIds.mockReset().mockResolvedValue([2, 3]);
    realtime = new RealtimeService();
    t = await createTestModule({
      db,
      imports: [],
      realtime,
      providers: [
        WatchSyncPushService,
        { provide: WebPushService, useValue: { sendWatchSync } },
        { provide: TripMembershipService, useValue: { getOwnerId, listMemberUserIds } },
      ],
      init: true,
    });
    service = t.get(WatchSyncPushService);
    // Only now: the module compiles on real timers.
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await t.close();
  });

  it('WSYNC-001: a run of list changes on a trip becomes one sync to its owner and members, once it settled', async () => {
    realtime.broadcast(12, 'packing:updated', { item: {} } as never);
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    realtime.broadcast(12, 'packing:deleted', { itemId: 4 } as never);
    expect(sendWatchSync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(listMemberUserIds).toHaveBeenCalledTimes(1);
    expect(listMemberUserIds).toHaveBeenCalledWith('12');
    expect(sendWatchSync.mock.calls.map(([id]) => id).sort()).toEqual([1, 2, 3]);
  });

  it('WSYNC-002: what the watch does not show sends nothing', async () => {
    realtime.broadcast(12, 'place:updated' as never, {} as never);
    realtime.broadcast(12, 'collab:message:created' as never, {} as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(sendWatchSync).not.toHaveBeenCalled();
  });

  it('WSYNC-003: a private packing item syncs its owner alone, unless the trip changed for everyone too', async () => {
    realtime.broadcast(12, 'packing:updated', { item: {} } as never, undefined, 2);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(listMemberUserIds).not.toHaveBeenCalled();
    expect(sendWatchSync.mock.calls).toEqual([[2]]);

    sendWatchSync.mockClear();
    realtime.broadcast(12, 'packing:updated', { item: {} } as never, undefined, 2);
    realtime.broadcast(12, 'todo:created', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(sendWatchSync.mock.calls.map(([id]) => id).sort()).toEqual([1, 2, 3]);
  });

  it('WSYNC-004: each trip gathers on its own, and a trip without an owner row still reaches its members', async () => {
    getOwnerId.mockResolvedValueOnce(null);
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    realtime.broadcast(13, 'todo:updated', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(listMemberUserIds.mock.calls).toEqual([['12'], ['13']]);
    expect(sendWatchSync).toHaveBeenCalledTimes(5);
  });

  it('WSYNC-005: a failed read is swallowed with a log line and never thrown into the broadcast', async () => {
    listMemberUserIds.mockRejectedValue(new Error('db gone'));
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(sendWatchSync).not.toHaveBeenCalled();
  });

  it('WSYNC-006: shut down, it stops listening and drops what was waiting', async () => {
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    service.onModuleDestroy();
    realtime.broadcast(13, 'todo:updated', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS * 2);
    expect(sendWatchSync).not.toHaveBeenCalled();
    await service.flush('12');
    expect(sendWatchSync).not.toHaveBeenCalled();
  });
});

describe('RealtimeService.onTripBroadcast', () => {
  it('WSYNC-007: listeners hear every trip broadcast, one failing listener costs nothing, and can be removed', () => {
    const realtime = new RealtimeService();
    const heard = vi.fn();
    realtime.onTripBroadcast(() => {
      throw new Error('broken listener');
    });
    const stop = realtime.onTripBroadcast(heard);
    expect(() => realtime.broadcast(7, 'packing:updated', { item: {} } as never, 'sock', 3)).not.toThrow();
    expect(heard).toHaveBeenCalledWith(7, 'packing:updated', 3);
    stop();
    realtime.broadcast(7, 'packing:updated', { item: {} } as never);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
