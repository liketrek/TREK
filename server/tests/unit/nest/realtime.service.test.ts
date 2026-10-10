import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import {
  InMemoryRoomRegistry,
  joinRoom,
  registerSocket,
  roomsSlot,
  setServer,
  type TrekWebSocket,
} from '../../../src/nest/realtime/ws-state';
import type { User } from '../../../src/types';
import type { TrekWsPayload, TrekWsUserEventName } from '@trek/shared';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WebSocketServer } from 'ws';

/**
 * The facade over the socket registry, exercised against the real ws-state
 * functions with sockets that record what they are sent: what reaches a
 * socket is the contract, not which module function the facade calls.
 */

/**
 * These cases exercise delivery, not payload shape, so they hand the facade
 * only the fields their assertions read. The registry contract asks for more
 * (`vacay:invite` for a `from`, `notification:new` for a `notification`);
 * filling that in would put data on the wire that nothing here checks, so the
 * shortcut is named instead of padded out.
 */
function partialUserPayload<E extends TrekWsUserEventName>(
  payload: { type: E } & Partial<TrekWsPayload<E>>,
): { type: E } & TrekWsPayload<E> {
  return payload as { type: E } & TrekWsPayload<E>;
}

interface RecordingSocket {
  ws: TrekWebSocket;
  sent: () => unknown[];
  sid: number;
}

const clients = new Set<TrekWebSocket>();

function connect(userId: number, readyState = 1): RecordingSocket {
  const send = vi.fn();
  const ws = { readyState, send, isAlive: true } as unknown as TrekWebSocket;
  const sid = registerSocket(ws, { id: userId, username: `u${userId}` } as User);
  clients.add(ws);
  return { ws, sid, sent: () => send.mock.calls.map(([frame]) => JSON.parse(frame as string) as unknown) };
}

const svc = new RealtimeService();
let rooms: InMemoryRoomRegistry;

beforeEach(() => {
  clients.clear();
  rooms = new InMemoryRoomRegistry();
  roomsSlot.install(rooms);
  setServer({ clients } as unknown as WebSocketServer);
});

afterEach(() => {
  setServer(null);
  roomsSlot.release(rooms);
});

describe('RealtimeService', () => {
  it('RTSVC-001: broadcast delivers the event to every open socket in the trip room', () => {
    const a = connect(1);
    const b = connect(2);
    const outsider = connect(3);
    joinRoom(a.ws, 7);
    joinRoom(b.ws, 7);
    joinRoom(outsider.ws, 8);

    svc.broadcast('7', 'place:created', { place: { id: 1 } });

    expect(a.sent()).toEqual([{ type: 'place:created', tripId: 7, place: { id: 1 } }]);
    expect(b.sent()).toEqual([{ type: 'place:created', tripId: 7, place: { id: 1 } }]);
    expect(outsider.sent()).toEqual([]);
  });

  it('RTSVC-002: broadcast skips the originating socket named by excludeSid', () => {
    const origin = connect(1);
    const other = connect(1);
    joinRoom(origin.ws, 7);
    joinRoom(other.ws, 7);

    svc.broadcast(7, 'day:updated', { day: null }, String(origin.sid));

    expect(origin.sent()).toEqual([]);
    expect(other.sent()).toEqual([{ type: 'day:updated', tripId: 7, day: null }]);
  });

  it("RTSVC-003: broadcast with onlyUserId reaches only that user's sockets in the room", () => {
    const owner = connect(4);
    const member = connect(5);
    joinRoom(owner.ws, 7);
    joinRoom(member.ws, 7);

    svc.broadcast(7, 'day:updated', { day: null }, undefined, 4);

    expect(owner.sent()).toHaveLength(1);
    expect(member.sent()).toEqual([]);
  });

  it('RTSVC-004: broadcastToUser sends the payload as is to every open socket of that user', () => {
    const mine = connect(5);
    const closed = connect(5, 3);
    const someoneElse = connect(6);
    const payload = partialUserPayload({ type: 'vacay:invite', planId: 3 });

    svc.broadcastToUser(5, payload);

    expect(mine.sent()).toEqual([{ type: 'vacay:invite', planId: 3 }]);
    expect(closed.sent()).toEqual([]);
    expect(someoneElse.sent()).toEqual([]);
  });

  it('RTSVC-004b: broadcastToUser skips the socket named by excludeSid', () => {
    const origin = connect(5);
    const otherTab = connect(5);

    svc.broadcastToUser(5, partialUserPayload({ type: 'notification:new' }), origin.sid);

    expect(origin.sent()).toEqual([]);
    expect(otherTab.sent()).toEqual([{ type: 'notification:new' }]);
  });

  it('RTSVC-005: getOnlineUserIds answers the users holding an open socket, read at call time', () => {
    expect(svc.getOnlineUserIds()).toEqual(new Set());
    connect(3);
    connect(8);
    connect(9, 3);
    expect(svc.getOnlineUserIds()).toEqual(new Set([3, 8]));
  });

  it('RTSVC-006: getOnlineUserIds is not guarded, so a failure reaches the caller instead of reading as nobody online', () => {
    setServer({
      get clients(): Set<TrekWebSocket> {
        throw new Error('socket server not ready');
      },
    } as unknown as WebSocketServer);
    expect(() => svc.getOnlineUserIds()).toThrow('socket server not ready');
  });
});
