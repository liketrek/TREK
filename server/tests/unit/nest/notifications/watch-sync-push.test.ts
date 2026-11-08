/**
 * The watch sync (WSYNC-*): list changes on a trip become one silent push per
 * member a moment later (WatchSyncPushService), sent to the iPhone app only and
 * marked for the relay as a background push (WebPushService.sendWatchSync), and
 * every trip broadcast reaches its listeners (RealtimeService.onTripBroadcast).
 */
import type { PushSubscriptionRow } from '../../../../src/db/repositories/PushSubscriptions.repository';
import type { TripMembersRepository } from '../../../../src/db/repositories/TripMembers.repository';
import type { PushSubscriptionsService } from '../../../../src/nest/notifications/push/push-subscriptions.service';
import type { VapidKeysService } from '../../../../src/nest/notifications/push/vapid-keys.service';
import {
  WATCH_SYNC_SETTLE_MS,
  WatchSyncPushService,
} from '../../../../src/nest/notifications/push/watch-sync-push.service';
import { generateVapidKeyPair } from '../../../../src/nest/notifications/push/web-push-crypto';
import {
  BACKGROUND_PUSH_HEADER,
  WebPushService,
  isAppleRelayEndpoint,
} from '../../../../src/nest/notifications/transports/web-push.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import type { MikroORM } from '@mikro-orm/core';

import { createECDH, randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { logError, safeFetchFollow } = vi.hoisted(() => ({ logError: vi.fn(), safeFetchFollow: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError,
  logWarn: vi.fn(),
}));
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  SsrfBlockedError: class SsrfBlockedError extends Error {},
  safeFetchFollow,
}));
// The repository's read runs inside a request context; the fake repository needs none.
vi.mock('../../../../src/nest/database/request-context', () => ({
  withRequestContext: (_orm: unknown, fn: () => unknown) => fn(),
}));
// The socket registry has no rooms here; only the listeners matter.
vi.mock('../../../../src/nest/realtime/ws-state', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: () => new Set<number>(),
}));

const APNS = 'https://push.liketrek.com/v1/apns/production/' + 'ab'.repeat(32);
const FCM = 'https://push.liketrek.com/v1/fcm/' + 'x'.repeat(140);
const BROWSER = 'https://fcm.googleapis.com/fcm/send/abc';

describe('WatchSyncPushService', () => {
  let realtime: RealtimeService;
  let sendWatchSync: ReturnType<typeof vi.fn>;
  let rosterUserIds: ReturnType<typeof vi.fn>;
  let service: WatchSyncPushService;

  beforeEach(() => {
    vi.useFakeTimers();
    logError.mockClear();
    realtime = new RealtimeService();
    sendWatchSync = vi.fn().mockResolvedValue(true);
    rosterUserIds = vi.fn().mockResolvedValue(new Set([1, 2, 3]));
    service = new WatchSyncPushService(
      realtime,
      { sendWatchSync } as unknown as WebPushService,
      { rosterUserIds } as unknown as TripMembersRepository,
      {} as MikroORM,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
  });

  it('WSYNC-001: a run of list changes on a trip becomes one sync to every member, once it settled', async () => {
    realtime.broadcast(12, 'packing:updated', { item: {} } as never);
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    realtime.broadcast(12, 'packing:deleted', { itemId: 4 } as never);
    expect(sendWatchSync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(rosterUserIds).toHaveBeenCalledTimes(1);
    expect(rosterUserIds).toHaveBeenCalledWith('12');
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
    expect(rosterUserIds).not.toHaveBeenCalled();
    expect(sendWatchSync.mock.calls).toEqual([[2]]);

    sendWatchSync.mockClear();
    realtime.broadcast(12, 'packing:updated', { item: {} } as never, undefined, 2);
    realtime.broadcast(12, 'todo:created', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(sendWatchSync.mock.calls.map(([id]) => id).sort()).toEqual([1, 2, 3]);
  });

  it('WSYNC-004: each trip gathers on its own', async () => {
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    realtime.broadcast(13, 'todo:updated', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(rosterUserIds.mock.calls).toEqual([['12'], ['13']]);
  });

  it('WSYNC-005: a failed read is logged and never thrown into the broadcast', async () => {
    rosterUserIds.mockRejectedValue(new Error('db gone'));
    realtime.broadcast(12, 'todo:updated', { item: {} } as never);
    await vi.advanceTimersByTimeAsync(WATCH_SYNC_SETTLE_MS);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('Watch sync failed trip=12: db gone'));
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

describe('WebPushService.sendWatchSync', () => {
  const keys = generateVapidKeyPair();

  function row(id: number, endpoint: string): PushSubscriptionRow {
    const device = createECDH('prime256v1');
    device.generateKeys();
    return {
      id,
      user_id: 5,
      endpoint,
      p256dh: device.getPublicKey().toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
      vapid_public_key: keys.publicKey,
      user_agent: null,
      created_at: '2026-11-08T00:00:00Z',
      last_success_at: null,
      failure_count: 0,
    };
  }

  function service(rows: PushSubscriptionRow[], available = true) {
    const vapid = {
      isAvailable: vi.fn().mockResolvedValue(available),
      getKeys: vi.fn().mockResolvedValue({ ...keys, source: 'database' }),
      getSubject: () => 'mailto:admin@trek.example.test',
    } as unknown as VapidKeysService;
    const subscriptions = {
      listForUser: vi.fn().mockResolvedValue(rows),
      recordSuccess: vi.fn(),
      recordFailure: vi.fn().mockResolvedValue(1),
      deleteById: vi.fn(),
    } as unknown as PushSubscriptionsService;
    return new WebPushService(vapid, subscriptions);
  }

  beforeEach(() => {
    safeFetchFollow.mockReset().mockResolvedValue(new Response(null, { status: 201 }));
  });

  it('WSYNC-008: only the iPhone app gets it, as a short-lived background push the relay recognises', async () => {
    const sent = await service([row(1, APNS), row(2, FCM), row(3, BROWSER)]).sendWatchSync(5);
    expect(sent).toBe(true);
    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
    const [endpoint, init] = safeFetchFollow.mock.calls[0];
    expect(endpoint).toBe(APNS);
    expect(init.headers).toMatchObject({
      [BACKGROUND_PUSH_HEADER]: 'background',
      Topic: 'trek-watch-sync',
      Urgency: 'low',
      TTL: '600',
      'Content-Encoding': 'aes128gcm',
    });
  });

  it('WSYNC-009: a user without the iPhone app, or a server without keys, sends nothing', async () => {
    expect(await service([row(2, FCM), row(3, BROWSER)]).sendWatchSync(5)).toBe(false);
    expect(await service([row(1, APNS)], false).sendWatchSync(5)).toBe(false);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WSYNC-010: an ordinary notification still goes out without the background mark', async () => {
    await service([row(1, APNS)]).sendToUser(5, {
      event: 'collab_message',
      title: 'Hi',
      body: 'there',
      navigateTarget: '/trips/1',
      url: 'https://trek.example.test/trips/1',
    });
    const [, init] = safeFetchFollow.mock.calls[0];
    expect(init.headers[BACKGROUND_PUSH_HEADER]).toBeUndefined();
    expect(init.headers.TTL).toBe(String(24 * 60 * 60));
  });

  it("WSYNC-011: only the relay's APNs endpoints count as an iPhone", () => {
    expect(isAppleRelayEndpoint(APNS)).toBe(true);
    expect(isAppleRelayEndpoint(FCM)).toBe(false);
    expect(isAppleRelayEndpoint(BROWSER)).toBe(false);
    expect(isAppleRelayEndpoint('http://push.liketrek.com/v1/apns/production/ab')).toBe(false);
    expect(isAppleRelayEndpoint('not a url')).toBe(false);
  });
});
