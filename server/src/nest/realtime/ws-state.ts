import { emitPluginEvent, pluginEventMeta } from '../../plugin-event-sink';
import { User } from '../../types';
import { ProcessStoreSlot } from '../common/process-store-slot';

import { WebSocketServer, WebSocket } from 'ws';

/**
 * The socket registry: rooms, per-socket identity, and the three fan-out
 * primitives.
 *
 * MODULE state, not provider state, and that is load-bearing: the rooms live
 * in the registry `roomsSlot` holds, which the container's provider replaces
 * when RealtimeGatewayModule is built and nothing else does. Hand-built
 * RealtimeService instances (the no-Nest test harnesses, out-of-container
 * consumers) deliver through these same functions. If the rooms lived on a
 * provider instance, an out-of-container broadcast would go to an empty map: no error, no log, just a client that
 * stops updating. Same reasoning as the geo throttle cursor and the
 * permissions cache.
 *
 * The gateway next door owns the connection lifecycle and the handshake and
 * writes into here. This file deliberately knows nothing about auth.
 */

export interface TrekWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * Who is in which room: the trip rooms, and the Studio book rooms.
 *
 * A book carries pointers and a presence list, and both are only of interest
 * to the people actually looking at it, so book rooms are separate from trip
 * rooms and from "is a contributor online": fanning them out to every
 * contributor's sockets would send a pointer moving at ten frames a second to
 * someone reading the journey on their phone.
 *
 * An injectable port: RealtimeGatewayModule provides it (`processRooms`
 * unless overridden) and installs whatever the container resolved in
 * `roomsSlot`, which the broadcast functions below read, so the gateway that
 * joins sockets and the broadcasts that deliver to them always use one
 * registry.
 *
 * Unlike the other process-state ports this one stays synchronous on purpose.
 * Membership holds live sockets, which cannot be kept anywhere but the process
 * that owns the connection, and `broadcast()` is a synchronous call every
 * domain makes after a write. Running several processes needs a fan-out
 * between them (each delivering to its own sockets), which is a port in front
 * of `broadcast()`, not a different place to keep these sets.
 */
export abstract class RoomRegistry {
  /** Start tracking a new connection's rooms. */
  abstract register(ws: TrekWebSocket): void;
  abstract join(ws: TrekWebSocket, tripId: number): void;
  abstract leave(ws: TrekWebSocket, tripId: number): void;
  abstract leaveAll(ws: TrekWebSocket): void;
  /** The sockets in a trip room; undefined when nobody is in it. */
  abstract members(tripId: number): ReadonlySet<TrekWebSocket> | undefined;
  abstract joinBook(ws: TrekWebSocket, journeyId: number): void;
  abstract leaveBook(ws: TrekWebSocket, journeyId: number): void;
  /** Every book this socket had open, left in one go. */
  abstract leaveAllBooks(ws: TrekWebSocket): number[];
  /** The sockets looking at a book; undefined when nobody is. */
  abstract bookMembers(journeyId: number): ReadonlySet<TrekWebSocket> | undefined;
}

/** The current behaviour: the rooms in this process's memory. */
export class InMemoryRoomRegistry extends RoomRegistry {
  private readonly rooms = new Map<number, Set<TrekWebSocket>>();
  private readonly bookRooms = new Map<number, Set<TrekWebSocket>>();
  private readonly socketBooks = new WeakMap<TrekWebSocket, Set<number>>();
  private readonly socketRooms = new WeakMap<TrekWebSocket, Set<number>>();

  register(ws: TrekWebSocket): void {
    this.socketRooms.set(ws, new Set());
  }

  join(ws: TrekWebSocket, tripId: number): void {
    if (!this.rooms.has(tripId)) this.rooms.set(tripId, new Set());
    this.rooms.get(tripId)!.add(ws);
    this.socketRooms.get(ws)?.add(tripId);
  }

  leave(ws: TrekWebSocket, tripId: number): void {
    const room = this.rooms.get(tripId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) this.rooms.delete(tripId);
    }
    this.socketRooms.get(ws)?.delete(tripId);
  }

  leaveAll(ws: TrekWebSocket): void {
    const mine = this.socketRooms.get(ws);
    if (!mine) return;
    for (const tripId of mine) this.leave(ws, tripId);
  }

  members(tripId: number): ReadonlySet<TrekWebSocket> | undefined {
    return this.rooms.get(tripId);
  }

  joinBook(ws: TrekWebSocket, journeyId: number): void {
    if (!this.bookRooms.has(journeyId)) this.bookRooms.set(journeyId, new Set());
    this.bookRooms.get(journeyId)!.add(ws);
    if (!this.socketBooks.has(ws)) this.socketBooks.set(ws, new Set());
    this.socketBooks.get(ws)!.add(journeyId);
  }

  leaveBook(ws: TrekWebSocket, journeyId: number): void {
    const room = this.bookRooms.get(journeyId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) this.bookRooms.delete(journeyId);
    }
    this.socketBooks.get(ws)?.delete(journeyId);
  }

  leaveAllBooks(ws: TrekWebSocket): number[] {
    const mine = this.socketBooks.get(ws);
    if (!mine) return [];
    const left = [...mine];
    for (const journeyId of left) this.leaveBook(ws, journeyId);
    return left;
  }

  bookMembers(journeyId: number): ReadonlySet<TrekWebSocket> | undefined {
    return this.bookRooms.get(journeyId);
  }
}

/** The in-memory registry this process starts with, and what RealtimeGatewayModule provides unless overridden. */
export const processRooms: RoomRegistry = new InMemoryRoomRegistry();

/** The registry the free functions below use; RealtimeGatewayModule installs the one the container resolved. */
export const roomsSlot = new ProcessStoreSlot<RoomRegistry>(processRooms);

const socketUser = new WeakMap<TrekWebSocket, User>();
const socketId = new WeakMap<TrekWebSocket, number>();

/**
 * A monotonic integer, NOT a uuid.
 *
 * The client echoes it back as the X-Socket-Id header and `broadcast` excludes
 * the originator with `Number(excludeSid)`. `Number(<uuid>)` is NaN, and
 * `NaN === NaN` is false, so every client would receive its own writes back.
 * Nothing throws; it shows up as drag-and-drop that jumps back under your
 * cursor.
 */
let nextSocketId = 1;

let wss: WebSocketServer | null = null;

export function setServer(server: WebSocketServer | null): void {
  wss = server;
}

export function getServer(): WebSocketServer | null {
  return wss;
}

export function registerSocket(ws: TrekWebSocket, user: User): number {
  const sid = nextSocketId++;
  socketId.set(ws, sid);
  socketUser.set(ws, user);
  roomsSlot.get().register(ws);
  return sid;
}

export function userOf(ws: TrekWebSocket): User | undefined {
  return socketUser.get(ws);
}

export function joinRoom(ws: TrekWebSocket, tripId: number): void {
  roomsSlot.get().join(ws, tripId);
}

// ── Studio books ──────────────────────────────────────────────────────────

export interface BookPeer {
  socketId: number;
  userId: number;
  username: string;
  avatar?: string | null;
}

export function joinBook(ws: TrekWebSocket, journeyId: number): void {
  roomsSlot.get().joinBook(ws, journeyId);
}

export function leaveBook(ws: TrekWebSocket, journeyId: number): void {
  roomsSlot.get().leaveBook(ws, journeyId);
}

/**
 * Who is in a book, by socket rather than by user.
 *
 * One person with two tabs open is two entries on purpose: they have two
 * pointers, and a list keyed by user could not say which one moved.
 */
export function bookPeers(journeyId: number): BookPeer[] {
  const room = roomsSlot.get().bookMembers(journeyId);
  if (!room) return [];
  const peers: BookPeer[] = [];
  for (const ws of room) {
    if (ws.readyState !== 1) continue;
    const user = socketUser.get(ws);
    const sid = socketId.get(ws);
    if (!user || sid == null) continue;
    peers.push({ socketId: sid, userId: user.id, username: user.username, avatar: user.avatar ?? null });
  }
  return peers;
}

/**
 * Send to everyone looking at a book.
 *
 * No plugin event sink here, unlike the trip broadcast: a pointer is not
 * something that happened to the trip, and announcing ten of them a second to
 * every subscribed plugin would be a firehose of nothing.
 */
export function broadcastToBook(journeyId: number, payload: Record<string, unknown>, excludeSid?: number): void {
  const room = roomsSlot.get().bookMembers(journeyId);
  if (!room || room.size === 0) return;
  for (const ws of room) {
    if (ws.readyState !== 1) continue;
    if (excludeSid != null && socketId.get(ws) === excludeSid) continue;
    ws.send(JSON.stringify({ journeyId, ...payload }));
  }
}

/** The socket's own id, so a handler can name the pointer it is forwarding. */
export function socketIdOf(ws: TrekWebSocket): number | undefined {
  return socketId.get(ws);
}

/**
 * Broadcast an event to all sockets in a trip room, optionally excluding a
 * socket.
 *
 * When `onlyUserId` is given the event is delivered only to that user's sockets
 * in the room — used to keep private packing items (#858) off other members'
 * screens while still syncing the owner's own tabs.
 */
export function broadcast(
  tripId: number | string,
  eventType: string,
  payload: Record<string, unknown>,
  excludeSid?: number | string,
  onlyUserId?: number,
): void {
  tripId = Number(tripId);
  // Announce every CORE trip event (name only, never the payload) to subscribed
  // plugins — before the room check so it fires even with no connected viewers
  // and with no ws server at all, and skipping plugin:* re-broadcasts so a
  // plugin's own events can't loop back.
  if (!eventType.startsWith('plugin:')) emitPluginEvent(tripId, eventType, pluginEventMeta(eventType, payload));
  const room = roomsSlot.get().members(tripId);
  if (!room || room.size === 0) return;

  const excludeNum = excludeSid ? Number(excludeSid) : null;

  for (const ws of room) {
    if (ws.readyState !== 1) continue; // WebSocket.OPEN === 1
    if (excludeNum && socketId.get(ws) === excludeNum) continue;
    if (onlyUserId != null && socketUser.get(ws)?.id !== onlyUserId) continue;
    ws.send(JSON.stringify({ type: eventType, tripId, ...payload }));
  }
}

/** Send a message to all sockets belonging to a specific user (e.g. trip invitations). */
export function broadcastToUser(userId: number, payload: Record<string, unknown>, excludeSid?: number | string): void {
  if (!wss) return;
  const excludeNum = excludeSid ? Number(excludeSid) : null;
  for (const ws of wss.clients) {
    const tws = ws as TrekWebSocket;
    if (tws.readyState !== 1) continue;
    if (excludeNum && socketId.get(tws) === excludeNum) continue;
    if (socketUser.get(tws)?.id === userId) tws.send(JSON.stringify(payload));
  }
}

export function getOnlineUserIds(): Set<number> {
  const ids = new Set<number>();
  if (!wss) return ids;
  for (const ws of wss.clients) {
    const tws = ws as TrekWebSocket;
    if (tws.readyState !== 1) continue;
    const user = socketUser.get(tws);
    if (user) ids.add(user.id);
  }
  return ids;
}
