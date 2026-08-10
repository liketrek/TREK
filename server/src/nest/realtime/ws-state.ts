import { WebSocketServer, WebSocket } from 'ws';
import { emitPluginEvent, pluginEventMeta } from '../../plugin-event-sink';
import { User } from '../../types';

/**
 * The socket registry: rooms, per-socket identity, and the three fan-out
 * primitives.
 *
 * MODULE state, not provider state, and that is load-bearing. Seventeen
 * `*.bridge.ts` files and notifications.instance.ts build `new
 * RealtimeService()` by hand, outside the container, because they run outside
 * it. If the rooms lived on a provider instance, those broadcasts would go to
 * an empty map: no error, no log, just a client that stops updating. Same
 * reasoning as the geo throttle cursor and the permissions cache.
 *
 * The gateway next door owns the connection lifecycle and the handshake and
 * writes into here. This file deliberately knows nothing about auth.
 */

export interface TrekWebSocket extends WebSocket {
  isAlive: boolean;
}

const rooms = new Map<number, Set<TrekWebSocket>>();
const socketRooms = new WeakMap<TrekWebSocket, Set<number>>();
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
  socketRooms.set(ws, new Set());
  return sid;
}

export function userOf(ws: TrekWebSocket): User | undefined {
  return socketUser.get(ws);
}

export function joinRoom(ws: TrekWebSocket, tripId: number): void {
  if (!rooms.has(tripId)) rooms.set(tripId, new Set());
  rooms.get(tripId)!.add(ws);
  socketRooms.get(ws)?.add(tripId);
}

export function leaveRoom(ws: TrekWebSocket, tripId: number): void {
  const room = rooms.get(tripId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) rooms.delete(tripId);
  }
  socketRooms.get(ws)?.delete(tripId);
}

export function leaveAllRooms(ws: TrekWebSocket): void {
  const mine = socketRooms.get(ws);
  if (!mine) return;
  for (const tripId of mine) leaveRoom(ws, tripId);
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
  const room = rooms.get(tripId);
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
export function broadcastToUser(
  userId: number,
  payload: Record<string, unknown>,
  excludeSid?: number | string,
): void {
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
