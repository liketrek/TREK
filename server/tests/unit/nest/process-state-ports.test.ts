/**
 * The process-local state behind injectable ports: the rate-limit counters,
 * the OAuth pending codes, the OIDC login states and codes, the permissions
 * cache and the WebSocket rooms. Each has an in-memory implementation that
 * behaves exactly as the state did before, is provided by its module, and is
 * what a hand-built consumer falls back to; a shared store can replace it in
 * the module. The ports a shared store could back are async. The process-wide
 * ones are also read outside the container (the broadcasts, the backup
 * restore's cache flush, the pending-code sweep), so their module installs the
 * store the container resolved in a slot those readers use: swapping the
 * provider changes every reader. PORTS-001 through PORTS-020.
 */
import { ProcessStoreSlot } from '../../../src/nest/common/process-store-slot';
import { RateLimitModule } from '../../../src/nest/common/rate-limit.module';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { InMemoryRateLimitStore, RateLimitStore } from '../../../src/nest/common/rate-limit.store';
import { OauthModule } from '../../../src/nest/oauth/oauth.module';
import {
  InMemoryPendingCodeStore,
  MAX_PENDING_CODES,
  PendingCodeStore,
  pendingCodesSlot,
  processPendingCodes,
  runPendingCodeSweep,
  sweepPendingCodes,
  type PendingCode,
} from '../../../src/nest/oauth/oauth.pending-codes';
import { OauthService } from '../../../src/nest/oauth/oauth.service';
import { InMemoryOidcFlowStore, OidcFlowStore } from '../../../src/nest/oidc/oidc-flow.store';
import { OidcModule } from '../../../src/nest/oidc/oidc.module';
import {
  InMemoryPermissionsCacheStore,
  PermissionsCacheStore,
  getPermissionsCache,
  invalidatePermissionsCache,
  permissionsCacheSlot,
  processPermissionsCache,
} from '../../../src/nest/permissions/permissions-cache';
import { PermissionsModule } from '../../../src/nest/permissions/permissions.module';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeGatewayModule } from '../../../src/nest/realtime/realtime-gateway.module';
import {
  InMemoryRoomRegistry,
  RoomRegistry,
  bookPeers,
  broadcast,
  broadcastToBook,
  joinRoom,
  processRooms,
  roomsSlot,
  type TrekWebSocket,
} from '../../../src/nest/realtime/ws-state';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { Test } from '@nestjs/testing';

import { describe, it, expect, vi } from 'vitest';

const WINDOW = 60_000;

function code(over: Partial<PendingCode> = {}): PendingCode {
  return {
    clientId: 'c',
    userId: 1,
    redirectUri: 'https://app.example/cb',
    scopes: ['trips:read'],
    resource: null,
    codeChallenge: 'x',
    codeChallengeMethod: 'S256',
    expiresAt: Date.now() + 60_000,
    ...over,
  };
}

describe('rate limits', () => {
  it('PORTS-001: RateLimitService counts through the store it is given', async () => {
    const store = { hit: vi.fn(() => false), reset: vi.fn() } as unknown as RateLimitStore;
    const service = new RateLimitService(store);
    expect(await service.check('login', '1.2.3.4', 5, WINDOW, 1_000)).toBe(false);
    expect(store.hit).toHaveBeenCalledWith('login', '1.2.3.4', 5, WINDOW, 1_000);
    await service.reset('login');
    expect(store.reset).toHaveBeenCalledWith('login');
  });

  it('PORTS-002: RateLimitModule provides the in-memory store, and the service gets it', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RateLimitModule] }).compile();
    try {
      const service = moduleRef.get(RateLimitService);
      expect((service as unknown as { store: unknown }).store).toBeInstanceOf(InMemoryRateLimitStore);
      for (let i = 0; i < 3; i++) expect(await service.check('mfa', 'k', 3, WINDOW, 1_000)).toBe(true);
      expect(await service.check('mfa', 'k', 3, WINDOW, 1_000)).toBe(false);
    } finally {
      await moduleRef.close();
    }
  });

  it('PORTS-003: two hand-built services keep their own counters, as before', async () => {
    const a = new RateLimitService();
    const b = new RateLimitService();
    await a.check('login', 'k', 1, WINDOW, 1_000);
    expect(await a.check('login', 'k', 1, WINDOW, 1_000)).toBe(false);
    expect(await b.check('login', 'k', 1, WINDOW, 1_000)).toBe(true);
  });
});

describe('OAuth pending codes', () => {
  it('PORTS-004: a code is single use, and an expired one is burnt and refused', async () => {
    const store = new InMemoryPendingCodeStore();
    expect(await store.put('a', code())).toBe(true);
    expect((await store.take('a'))?.clientId).toBe('c');
    expect(await store.take('a')).toBeNull();
    await store.put('old', code({ expiresAt: Date.now() - 1 }));
    expect(await store.take('old')).toBeNull();
  });

  it('PORTS-005: the store refuses past its capacity and the sweep frees expired entries', async () => {
    const store = new InMemoryPendingCodeStore();
    for (let i = 0; i < MAX_PENDING_CODES; i++) await store.put(`c${i}`, code({ expiresAt: 10 }));
    expect(await store.put('one-more', code())).toBe(false);
    await store.sweep(11);
    expect(await store.put('one-more', code())).toBe(true);
  });

  it('PORTS-006: OauthService issues and redeems codes through the injected store', async () => {
    const store = new InMemoryPendingCodeStore();
    const service = new OauthService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      store,
    );
    const issued = await service.createAuthCode({
      clientId: 'c',
      userId: 1,
      redirectUri: 'https://app.example/cb',
      scopes: [],
      resource: null,
      codeChallenge: 'x',
      codeChallengeMethod: 'S256',
    });
    expect(issued).toMatch(/^[0-9a-f]{64}$/);
    expect(await processPendingCodes.take(issued!)).toBeNull();
    expect((await service.consumeAuthCode(issued!))?.clientId).toBe('c');
  });

  it('PORTS-007: OauthModule provides the process-wide store, the one a hand-built service defaults to', () => {
    expectRegisteredProvider(OauthModule, { provide: PendingCodeStore, useValue: processPendingCodes });
    const service = new OauthService({} as never, {} as never, {} as never, {} as never, {} as never, {} as never);
    expect((service as unknown as { pendingCodes: unknown }).pendingCodes).toBe(processPendingCodes);
  });

  it('PORTS-018: a swapped store reaches the sweep and a hand-built service until the module goes away', async () => {
    const fake = new InMemoryPendingCodeStore();
    const sweep = vi.spyOn(fake, 'sweep');
    const oauthModule = new OauthModule({} as never, {} as never, {} as never, fake);
    try {
      expect(pendingCodesSlot.get()).toBe(fake);
      await sweepPendingCodes(5);
      expect(sweep).toHaveBeenCalledWith(5);
      const service = new OauthService({} as never, {} as never, {} as never, {} as never, {} as never, {} as never);
      expect((service as unknown as { pendingCodes: unknown }).pendingCodes).toBe(fake);
    } finally {
      oauthModule.onModuleDestroy();
    }
    expect(pendingCodesSlot.get()).toBe(processPendingCodes);
  });

  it('PORTS-020: the interval body logs a failed sweep instead of throwing it into the timer', async () => {
    const fake = new InMemoryPendingCodeStore();
    vi.spyOn(fake, 'sweep').mockRejectedValue(new Error('store offline'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    pendingCodesSlot.install(fake);
    try {
      await expect(runPendingCodeSweep(5)).resolves.toBeUndefined();
      expect(error).toHaveBeenCalledWith(expect.stringContaining('OAuth pending-code sweep failed: store offline'));
    } finally {
      pendingCodesSlot.release(fake);
      error.mockRestore();
    }
  });
});

describe('OIDC login states and codes', () => {
  it('PORTS-008: states and codes are single use', async () => {
    const store = new InMemoryOidcFlowStore();
    await store.putState('s', { createdAt: 1, redirectUri: '/', codeVerifier: 'v' });
    expect((await store.takeState('s'))?.codeVerifier).toBe('v');
    expect(await store.takeState('s')).toBeNull();
    await store.putCode('c', { token: 't', created: 1, bindingHash: 'h' });
    expect((await store.takeCode('c'))?.token).toBe('t');
    expect(await store.takeCode('c')).toBeNull();
  });

  it('PORTS-009: the sweeps drop only what is past its TTL', async () => {
    const store = new InMemoryOidcFlowStore();
    await store.putState('old', { createdAt: 0, redirectUri: '/', codeVerifier: 'v' });
    await store.putState('new', { createdAt: 900, redirectUri: '/', codeVerifier: 'v' });
    await store.putCode('old', { token: 't', created: 0, bindingHash: 'h' });
    await store.putCode('new', { token: 't', created: 900, bindingHash: 'h' });
    await store.sweepStates(1_000, 500);
    await store.sweepCodes(1_000, 500);
    expect(await store.takeState('old')).toBeNull();
    expect(await store.takeState('new')).not.toBeNull();
    expect(await store.takeCode('old')).toBeNull();
    expect(await store.takeCode('new')).not.toBeNull();
  });

  it('PORTS-010: OidcModule provides the in-memory store', () => {
    expectRegisteredProvider(OidcModule, { provide: OidcFlowStore, useClass: InMemoryOidcFlowStore });
  });
});

describe('the permissions cache', () => {
  it('PORTS-011: PermissionsService reads, fills and drops the cache through the store it is given', async () => {
    const store = new InMemoryPermissionsCacheStore();
    const appSettings = { findByKeyPrefix: vi.fn(async () => [{ key: 'perm_trip_create', value: 'admin' }]) };
    const service = new PermissionsService(appSettings as never, {} as never, store);
    expect(await service.getPermissionLevel('trip_create')).toBe('admin');
    expect((await store.get())?.get('trip_create')).toBe('admin');
    await service.getPermissionLevel('trip_create');
    expect(appSettings.findByKeyPrefix).toHaveBeenCalledTimes(1);
    await service.invalidatePermissionsCache();
    expect(await store.get()).toBeNull();
  });

  it('PORTS-012: the module, a hand-built service and the restore path share the process-wide store', async () => {
    expectRegisteredProvider(PermissionsModule, { provide: PermissionsCacheStore, useValue: processPermissionsCache });
    const service = new PermissionsService({} as never, {} as never);
    expect((service as unknown as { cacheStore: unknown }).cacheStore).toBe(processPermissionsCache);
    await processPermissionsCache.set(new Map([['trip_create', 'admin']]));
    await invalidatePermissionsCache();
    expect(await processPermissionsCache.get()).toBeNull();
  });

  it('PORTS-016: a swapped store is the one the backup restore flushes, until the module goes away', async () => {
    const fake = new InMemoryPermissionsCacheStore();
    await fake.set(new Map([['trip_create', 'admin']]));
    const invalidate = vi.spyOn(fake, 'invalidate');
    await processPermissionsCache.set(new Map([['trip_edit', 'trip_member']]));
    const permissionsModule = new PermissionsModule(fake);
    try {
      expect(permissionsCacheSlot.get()).toBe(fake);
      // backup.impl.ts flushes through this free function after a restore.
      await invalidatePermissionsCache();
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(await getPermissionsCache()).toBeNull();
      // The default store was not the one flushed.
      expect(await processPermissionsCache.get()).not.toBeNull();
      const service = new PermissionsService({} as never, {} as never);
      expect((service as unknown as { cacheStore: unknown }).cacheStore).toBe(fake);
    } finally {
      permissionsModule.onModuleDestroy();
      await processPermissionsCache.invalidate();
    }
    expect(permissionsCacheSlot.get()).toBe(processPermissionsCache);
  });
});

describe('the WebSocket rooms', () => {
  const socket = () => ({}) as TrekWebSocket;

  it('PORTS-013: joins, leaves and per-socket bookkeeping behave as the module maps did', () => {
    const rooms = new InMemoryRoomRegistry();
    const a = socket();
    const b = socket();
    rooms.register(a);
    rooms.register(b);
    rooms.join(a, 1);
    rooms.join(b, 1);
    rooms.join(a, 2);
    expect([...rooms.members(1)!]).toEqual([a, b]);
    rooms.leaveAll(a);
    expect([...rooms.members(1)!]).toEqual([b]);
    expect(rooms.members(2)).toBeUndefined();
    rooms.joinBook(a, 7);
    rooms.joinBook(a, 8);
    expect(rooms.leaveAllBooks(a)).toEqual([7, 8]);
    expect(rooms.bookMembers(7)).toBeUndefined();
  });

  it('PORTS-014: RealtimeGatewayModule provides the process-wide registry the broadcasts read', () => {
    expectRegisteredProvider(RealtimeGatewayModule, { provide: RoomRegistry, useValue: processRooms });
    expect(roomsSlot.get()).toBe(processRooms);
  });

  it('PORTS-017: a swapped registry is the one the broadcasts join and deliver through, until the module goes away', () => {
    const fake = new InMemoryRoomRegistry();
    const members = vi.spyOn(fake, 'members');
    const bookMembers = vi.spyOn(fake, 'bookMembers');
    const send = vi.fn();
    const live = { readyState: 1, send } as unknown as TrekWebSocket;
    const gatewayModule = new RealtimeGatewayModule(fake);
    try {
      expect(roomsSlot.get()).toBe(fake);
      fake.register(live);
      joinRoom(live, 41);
      fake.joinBook(live, 9);

      broadcast(41, 'place:created', { place: { id: 1 } });
      expect(members).toHaveBeenCalledWith(41);
      expect(send).toHaveBeenCalledWith(JSON.stringify({ type: 'place:created', tripId: 41, place: { id: 1 } }));

      broadcastToBook(9, { type: 'book:pointer' });
      expect(bookMembers).toHaveBeenCalledWith(9);
      expect(send).toHaveBeenCalledWith(JSON.stringify({ journeyId: 9, type: 'book:pointer' }));
      // The socket was never registered with a user, so it is not listed as a peer.
      expect(bookPeers(9)).toEqual([]);

      // Nothing reached the default registry.
      expect(processRooms.members(41)).toBeUndefined();
    } finally {
      gatewayModule.onModuleDestroy();
    }
    expect(roomsSlot.get()).toBe(processRooms);
  });
});

describe('ProcessStoreSlot', () => {
  it('PORTS-015: install swaps the store, and release only restores the default for the store that is installed', () => {
    const fallback = { name: 'fallback' };
    const first = { name: 'first' };
    const second = { name: 'second' };
    const slot = new ProcessStoreSlot(fallback);
    expect(slot.get()).toBe(fallback);
    slot.install(first);
    slot.install(second);
    // A module torn down after a later one installed its own leaves that one in place.
    slot.release(first);
    expect(slot.get()).toBe(second);
    slot.release(second);
    expect(slot.get()).toBe(fallback);
  });
});

describe('the rate-limit store', () => {
  it('PORTS-019: the in-memory store answers through promises with the old counting', async () => {
    const store = new InMemoryRateLimitStore();
    await expect(store.hit('login', 'k', 1, WINDOW, 1_000)).resolves.toBe(true);
    await expect(store.hit('login', 'k', 1, WINDOW, 1_000)).resolves.toBe(false);
    await store.reset('login');
    await expect(store.hit('login', 'k', 1, WINDOW, 1_000)).resolves.toBe(true);
  });
});
