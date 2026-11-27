/**
 * WSREV-001 to WSREV-017: a socket is let into a room with one access check,
 * so the writes that end access ask the sockets already in again
 * (recheckTripAccess, recheckJourneyAccess), and the sockets of a user whose
 * sessions ended, or of every user once the database was replaced, are
 * closed (closeSockets). The end-to-end side is tests/websocket/room-revocation.test.ts.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { EphemeralTokenService } from '../../../src/nest/auth-core/ephemeral-token.service';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';
import { RealtimeGatewayModule } from '../../../src/nest/realtime/realtime-gateway.module';
import { RealtimeGateway } from '../../../src/nest/realtime/realtime.gateway';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import {
  bookPeers,
  closeSockets,
  InMemoryRoomRegistry,
  recheckJourneyAccess,
  recheckTripAccess,
  registerSocket,
  roomAccessSlot,
  roomsSlot,
  setServer,
  type RoomAccess,
  type TrekWebSocket,
} from '../../../src/nest/realtime/ws-state';
import type { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';
import type { User } from '../../../src/types';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/plugin-event-sink', () => ({ emitPluginEvent: vi.fn(), pluginEventMeta: vi.fn(() => ({})) }));

interface FakeSocket extends TrekWebSocket {
  sent: Array<Record<string, unknown>>;
  closedWith: [number, string] | null;
}

function socket(): FakeSocket {
  const s = {
    readyState: 1,
    sent: [] as Array<Record<string, unknown>>,
    closedWith: null as [number, string] | null,
    send: (raw: string) => s.sent.push(JSON.parse(raw) as Record<string, unknown>),
    close: (code: number, reason: string) => {
      s.closedWith = [code, reason];
    },
  };
  return s as unknown as FakeSocket;
}

let rooms: InMemoryRoomRegistry;
let clients: Set<FakeSocket>;

/** A socket of the user, open and registered, as the handshake leaves it. */
function open(userId: number, sessionId?: string): FakeSocket {
  const ws = socket();
  registerSocket(ws, { id: userId, username: `u${userId}` } as User, sessionId);
  clients.add(ws);
  return ws;
}

/** Who may be where: trip and book ids per user. */
function access(trips: Record<number, number[]>, books: Record<number, number[]> = {}): RoomAccess {
  return {
    trip: vi.fn(async (tripId: number, userId: number) => (trips[userId] ?? []).includes(tripId)),
    book: vi.fn(async (journeyId: number, userId: number) => (books[userId] ?? []).includes(journeyId)),
  };
}

beforeEach(() => {
  rooms = new InMemoryRoomRegistry();
  roomsSlot.install(rooms);
  clients = new Set();
  setServer({ clients } as never);
});

afterEach(() => {
  roomsSlot.release(rooms);
  roomAccessSlot.install(null);
  setServer(null);
});

describe('recheckTripAccess', () => {
  it('WSREV-001: does nothing before a gateway installed the checks', async () => {
    const ws = open(1);
    rooms.join(ws, 5);
    await recheckTripAccess({ tripId: 5 });
    expect(rooms.members(5)?.has(ws)).toBe(true);
  });

  it('WSREV-002: takes out the one user that lost the trip and leaves their other sockets elsewhere alone', async () => {
    const gone = open(1);
    const stays = open(2);
    const other = open(1);
    rooms.join(gone, 5);
    rooms.join(stays, 5);
    rooms.join(other, 6);
    const checks = access({ 1: [6], 2: [5] });
    roomAccessSlot.install(checks);

    await recheckTripAccess({ tripId: 5, userId: 1 });

    expect([...(rooms.members(5) ?? [])]).toEqual([stays]);
    expect(rooms.members(6)?.has(other)).toBe(true);
    // Only the named user was asked.
    expect(checks.trip).toHaveBeenCalledTimes(1);
  });

  it('WSREV-003: without a user it asks everybody in the room, and empties a deleted trip', async () => {
    const a = open(1);
    const b = open(2);
    rooms.join(a, 5);
    rooms.join(b, 5);
    roomAccessSlot.install(access({}));

    await recheckTripAccess({ tripId: 5 });

    expect(rooms.members(5)).toBeUndefined();
  });

  it('WSREV-004: a check that fails counts as no access', async () => {
    const ws = open(1);
    rooms.join(ws, 5);
    roomAccessSlot.install({ trip: vi.fn().mockRejectedValue(new Error('db down')), book: vi.fn() });

    await recheckTripAccess({ tripId: 5 });

    expect(rooms.members(5)).toBeUndefined();
  });

  it('WSREV-005: a socket in a room without a user is taken out', async () => {
    const stray = socket();
    rooms.register(stray);
    rooms.join(stray, 5);
    roomAccessSlot.install(access({}));

    await recheckTripAccess({ tripId: 5 });

    expect(rooms.members(5)).toBeUndefined();
  });

  it('WSREV-006: asks every open book again, since a book can be open through the trip', async () => {
    const ws = open(1);
    rooms.joinBook(ws, 9);
    roomAccessSlot.install(access({}, {}));

    await recheckTripAccess({ tripId: 5 });

    expect(rooms.bookMembers(9)).toBeUndefined();
  });

  it('WSREV-007: an empty room asks nobody', async () => {
    const checks = access({});
    roomAccessSlot.install(checks);
    await recheckTripAccess({ tripId: 5 });
    expect(checks.trip).not.toHaveBeenCalled();
  });
});

describe('recheckJourneyAccess', () => {
  it('WSREV-008: does nothing before a gateway installed the checks', async () => {
    const ws = open(1);
    rooms.joinBook(ws, 9);
    await recheckJourneyAccess(9);
    expect(rooms.bookMembers(9)?.has(ws)).toBe(true);
  });

  it('WSREV-009: takes out whoever lost the book and tells the ones who stay', async () => {
    const gone = open(1);
    const stays = open(2);
    rooms.joinBook(gone, 9);
    rooms.joinBook(stays, 9);
    roomAccessSlot.install(access({}, { 2: [9] }));

    await recheckJourneyAccess(9);

    expect(bookPeers(9).map((p) => p.userId)).toEqual([2]);
    expect(stays.sent).toContainEqual(
      expect.objectContaining({
        type: 'journey:book:peers',
        journeyId: 9,
        peers: [expect.objectContaining({ userId: 2 })],
      }),
    );
    expect(gone.sent).toEqual([]);
  });

  it('WSREV-010: without a book it asks every open book; a book nobody lost says nothing', async () => {
    const a = open(1);
    const b = open(2);
    rooms.joinBook(a, 9);
    rooms.joinBook(b, 10);
    roomAccessSlot.install(access({}, { 1: [9] }));

    await recheckJourneyAccess();

    expect(rooms.bookMembers(9)?.has(a)).toBe(true);
    expect(rooms.bookMembers(10)).toBeUndefined();
    expect(a.sent).toEqual([]);
  });
});

describe('closeSockets', () => {
  it('WSREV-011: closes one user’s sockets, out of every room first, and tells their books', async () => {
    const mine = open(1);
    const theirs = open(2);
    rooms.join(mine, 5);
    rooms.joinBook(mine, 9);
    rooms.joinBook(theirs, 9);

    new RealtimeService().closeUserSockets(1, 'Session ended');

    expect(mine.closedWith).toEqual([4001, 'Session ended']);
    expect(theirs.closedWith).toBeNull();
    expect(rooms.members(5)).toBeUndefined();
    expect(bookPeers(9).map((p) => p.userId)).toEqual([2]);
    expect(theirs.sent).toContainEqual(expect.objectContaining({ type: 'journey:book:peers' }));
  });

  it('WSREV-017: one ended session closes its own sockets and those of no known session, never another device', async () => {
    const ended = open(1, 'sess-a');
    const otherDevice = open(1, 'sess-b');
    const unknown = open(1);
    const theirs = open(2, 'sess-a');
    rooms.join(otherDevice, 5);

    new RealtimeService().closeSessionSockets(1, 'sess-a', 'Session ended');

    expect(ended.closedWith).toEqual([4001, 'Session ended']);
    expect(unknown.closedWith).toEqual([4001, 'Session ended']);
    expect(otherDevice.closedWith).toBeNull();
    expect(theirs.closedWith).toBeNull();
    expect(rooms.members(5)?.has(otherDevice)).toBe(true);
  });

  it('WSREV-012: without a user closes every socket, which a replaced database asks for', async () => {
    const a = open(1);
    const b = open(2);
    closeSockets(1012, 'Database replaced');
    expect([a.closedWith, b.closedWith]).toEqual([
      [1012, 'Database replaced'],
      [1012, 'Database replaced'],
    ]);
  });

  it('WSREV-013: the gateway module closes every socket after the database is reopened', async () => {
    const listeners: Array<() => Promise<void>> = [];
    const lifecycle = { onReopened: (listener: () => Promise<void>) => listeners.push(listener) };
    const module = new RealtimeGatewayModule(rooms, lifecycle as unknown as DatabaseLifecycle);
    const ws = open(1);

    await Promise.all(listeners.map((listener) => listener()));

    expect(ws.closedWith).toEqual([1012, 'Database replaced']);
    module.onModuleDestroy();
  });

  it('WSREV-014: the facade asks the trip rooms and the books again', async () => {
    const ws = open(1);
    rooms.join(ws, 5);
    rooms.joinBook(ws, 9);
    roomAccessSlot.install(access({}, {}));
    const facade = new RealtimeService();

    await facade.recheckJourneyAccess(9);
    expect(rooms.bookMembers(9)).toBeUndefined();
    await facade.recheckTripAccess({ tripId: 5, userId: 1 });
    expect(rooms.members(5)).toBeUndefined();
  });
});

describe('the gateway asks again from inside the room', () => {
  const tokens = { consumeWithMeta: vi.fn() } as unknown as EphemeralTokenService;
  const users = {} as UsersRepository;
  const appSettings = {} as AppSettingsRepository;

  it('WSREV-015: a trip join whose access ended while the first answer was on its way is refused', async () => {
    const findAccessible = vi.fn().mockResolvedValueOnce({ id: 5 }).mockResolvedValueOnce(undefined);
    const trips = { findAccessible } as unknown as TripAccessService;
    const gw = new RealtimeGateway(trips, tokens, { canAccessJourney: vi.fn() }, users, appSettings, rooms);
    const ws = open(1);

    expect(await gw.handleJoin({ tripId: 5 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
    expect(rooms.members(5)).toBeUndefined();
  });

  it('WSREV-016: so is a book join', async () => {
    const canAccessJourney = vi.fn().mockResolvedValueOnce({ id: 9 }).mockResolvedValueOnce(null);
    const trips = { findAccessible: vi.fn() } as unknown as TripAccessService;
    const gw = new RealtimeGateway(trips, tokens, { canAccessJourney }, users, appSettings, rooms);
    const ws = open(1);

    expect(await gw.handleBookJoin({ journeyId: 9 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
    expect(rooms.bookMembers(9)).toBeUndefined();
    gw.onModuleDestroy();
  });
});
