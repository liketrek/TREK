import { broadcast, broadcastToUser, getOnlineUserIds } from '../../websocket';
import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsPluginEventName, TrekWsTripEventName, TrekWsUserEventName } from '@trek/shared';

/**
 * Injectable facade over the websocket module singleton (roadmap Phase 0 item 3).
 *
 * Migrated Nest services inject this instead of importing `broadcast`/
 * `broadcastToUser` module globals. The actual transport (rooms, auth,
 * heartbeat, rate limiting) stays in src/websocket.ts — a future
 * @WebSocketGateway swap happens behind this facade, invisibly.
 *
 * Both methods delegate to the live module exports *at call time* (same
 * pattern as DatabaseService.canAccessTrip): tests vi.mock src/websocket
 * per file, and the stubs must keep flowing through here. Never capture
 * the functions at construction, and never dereference an export the
 * method wasn't asked for — many test mocks provide `broadcast` only.
 *
 * The service is deliberately dependency-free so out-of-container code (the
 * auth.bridge graph, the no-Nest test harnesses) can construct it with a bare
 * `new RealtimeService()`.
 */
@Injectable()
export class RealtimeService {
  /**
   * Broadcast an event to all sockets in a trip room. Mirrors the
   * websocket.ts signature exactly: `excludeSid` is the X-Socket-Id
   * echo-suppression contract (the originating client is skipped);
   * `onlyUserId` narrows delivery to one user's sockets (#858 private
   * packing items).
   *
   * Compile-time contract (runtime is a pure pass-through): the event name
   * must be a key of the shared TREK_WS_EVENTS registry and the payload must
   * match its schema — a typo'd name or drifted payload fails `tsc`, never
   * ships silence. The `plugin:` overload is the deliberate escape hatch for
   * the host's force-namespaced `plugin:<id>:<event>` broadcasts.
   *
   * Rest-spread keeps the caller's exact argument arity — dozens of test
   * mocks assert the precise call shape (3, 4 or 5 args), so the facade
   * must not pad omitted optionals with explicit `undefined`s.
   */
  broadcast<E extends TrekWsTripEventName>(
    tripId: number | string,
    eventType: E,
    payload: TrekWsPayload<E>,
    excludeSid?: number | string,
    onlyUserId?: number,
  ): void;
  broadcast(
    tripId: number | string,
    eventType: TrekWsPluginEventName,
    payload: Record<string, unknown>,
    excludeSid?: number | string,
    onlyUserId?: number,
  ): void;
  broadcast(
    ...args: [
      tripId: number | string,
      eventType: string,
      payload: Record<string, unknown>,
      excludeSid?: number | string,
      onlyUserId?: number,
    ]
  ): void {
    broadcast(...args);
  }

  /**
   * Send a message to all sockets of one user; the payload carries its own
   * `type`, which must be a user-scoped registry event (or the reserved
   * `plugin:<id>` namespace) with the matching payload fields.
   */
  broadcastToUser<E extends TrekWsUserEventName>(
    userId: number,
    payload: { type: E } & TrekWsPayload<E>,
    excludeSid?: number | string,
  ): void;
  broadcastToUser(
    userId: number,
    payload: { type: TrekWsPluginEventName } & Record<string, unknown>,
    excludeSid?: number | string,
  ): void;
  broadcastToUser(...args: [userId: number, payload: Record<string, unknown>, excludeSid?: number | string]): void {
    broadcastToUser(...args);
  }

  /**
   * Which users currently hold an open socket.
   *
   * AdminService read this through a lazy `require('../../websocket')` inside a
   * try/catch, which is what the facade exists to avoid. Deliberately NOT
   * guarded here: a guard on the facade would swallow the failure for every
   * future caller, and the one caller that wants a degraded answer rather than
   * an error keeps its own catch. Delegates at call time, like its two
   * siblings, so per-file vi.mock stubs keep flowing through.
   */
  getOnlineUserIds(): Set<number> {
    return getOnlineUserIds();
  }
}
