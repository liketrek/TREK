import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'node:http';
import type { WebSocketServer } from 'ws';
import { DatabaseService } from '../database/database.service';
import { EphemeralTokenService } from '../auth/ephemeral-token.service';
import { User } from '../../types';
import {
  bookPeers,
  broadcastToBook,
  joinBook,
  joinRoom,
  leaveAllBooks,
  leaveAllRooms,
  leaveBook,
  leaveRoom,
  registerSocket,
  socketIdOf,
  userOf,
  type TrekWebSocket,
} from './ws-state';
import { JourneyDomainService } from '../journey/journey-domain.service';

const HEARTBEAT_INTERVAL = 30_000;

/**
 * The /ws transport, as a Nest gateway.
 *
 * It replaces the hand-rolled `setupWebSocket(server)` that index.ts kicked off
 * with a dynamic import after listen(). What moved is ownership: the handshake
 * reads its collaborators from the container instead of importing the db
 * singleton and the token store, and the heartbeat is a lifecycle hook rather
 * than an interval nobody stops.
 *
 * What did NOT move is the socket registry. It stays module-scoped in
 * ws-state.ts because out-of-container code (the no-Nest test harnesses,
 * the vi.mock'd src/websocket seam) must see the same rooms; see the note
 * there.
 *
 * The wire protocol is unchanged, down to the frame names. TrekWsAdapter maps
 * `{ type }` onto @SubscribeMessage, because the stock adapter dispatches on
 * `{ event, data }` and every deployed client speaks the former.
 */
@Injectable()
@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly tokens: EphemeralTokenService,
    /*
     * For the book rooms, and injected rather than reimplemented: who may open
     * a journey is one question with one answer, and a second copy of it here
     * is a second thing to keep in step with the REST routes.
     */
    private readonly journeys: JourneyDomainService,
  ) {}

  afterInit(server: WebSocketServer): void {
    this.heartbeat = setInterval(() => {
      server.clients.forEach((ws) => {
        const tws = ws as TrekWebSocket;
        if (tws.isAlive === false) return tws.terminate();
        tws.isAlive = false;
        tws.ping();
      });
    }, HEARTBEAT_INTERVAL);
    this.heartbeat.unref?.();
  }

  onModuleDestroy(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  /**
   * Authenticate the upgrade, then admit the socket.
   *
   * Every rejection closes with the code the client already handles: 4001 for
   * anything about identity, 4403 for the MFA policy. The order matters and is
   * unchanged — a missing token is refused before the store is touched, and the
   * password-version gate runs before the MFA one.
   */
  handleConnection(socket: TrekWebSocket, request: IncomingMessage): void {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      socket.close(4001, 'Authentication required');
      return;
    }

    const consumed = this.tokens.consumeWithMeta(token, 'ws');
    if (!consumed) {
      socket.close(4001, 'Invalid or expired token');
      return;
    }

    const row = this.db.get<User & { password_version?: number }>(
      'SELECT id, username, email, role, mfa_enabled, password_version FROM users WHERE id = ?',
      consumed.userId,
    );
    if (!row) {
      socket.close(4001, 'User not found');
      return;
    }

    // Session gate (defence-in-depth): reject a ws-token minted before a
    // password change. Tokens carry the pv they were issued with; tokens minted
    // without a pv (legacy) are treated as version 0, matching the JWT `pv`
    // claim semantics in verifyJwtAndLoadUser.
    const tokenPv = typeof consumed.pv === 'number' ? consumed.pv : 0;
    const currentPv = typeof row.password_version === 'number' ? row.password_version : 0;
    if (tokenPv !== currentPv) {
      socket.close(4001, 'Invalid or expired token');
      return;
    }

    // Don't leak password_version beyond the handshake.
    const { password_version: _pv, ...user } = row;
    const requireMfa =
      this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'require_mfa'")?.value === 'true';
    const mfaOk = user.mfa_enabled === 1 || user.mfa_enabled === true;
    if (requireMfa && !mfaOk) {
      socket.close(4403, 'MFA required');
      return;
    }

    socket.isAlive = true;
    const sid = registerSocket(socket, user as User);
    socket.send(JSON.stringify({ type: 'welcome', socketId: sid }));
    socket.on('pong', () => { socket.isAlive = true; });
  }

  handleDisconnect(socket: TrekWebSocket): void {
    leaveAllRooms(socket);
    // Tell the books this socket was in, or its pointer stays on everyone
    // else's page forever.
    for (const journeyId of leaveAllBooks(socket)) this.announcePeers(journeyId);
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() message: { tripId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): { type: string; tripId?: number; message?: string } | undefined {
    const user = userOf(socket);
    if (!user || !message?.tripId) return undefined;

    const tripId = Number(message.tripId);
    if (!this.db.canAccessTrip(tripId, user.id)) {
      return { type: 'error', message: 'Access denied' };
    }
    joinRoom(socket, tripId);
    return { type: 'joined', tripId };
  }

  /*
   * ── Studio books (#1973) ────────────────────────────────────────────────
   *
   * Presence and pointers for people editing the same photo book. Both are
   * ephemeral by design: nothing here is written down, and a socket that goes
   * away takes its pointer with it.
   */

  @SubscribeMessage('book:join')
  handleBookJoin(
    @MessageBody() message: { journeyId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): { type: string; journeyId?: number; message?: string } | undefined {
    const user = userOf(socket);
    if (!user || !message?.journeyId) return undefined;

    const journeyId = Number(message.journeyId);
    if (!Number.isFinite(journeyId) || !this.journeys.canAccessJourney(journeyId, user.id)) {
      return { type: 'error', message: 'Access denied' };
    }

    joinBook(socket, journeyId);
    this.announcePeers(journeyId);
    return { type: 'book:joined', journeyId };
  }

  @SubscribeMessage('book:leave')
  handleBookLeave(
    @MessageBody() message: { journeyId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): { type: string; journeyId?: number } | undefined {
    if (!message?.journeyId) return undefined;
    const journeyId = Number(message.journeyId);
    leaveBook(socket, journeyId);
    this.announcePeers(journeyId);
    return { type: 'book:left', journeyId };
  }

  /**
   * Forward a pointer to the others in the book.
   *
   * Nothing is checked against the database on this path, and that is the
   * point: it runs ten times a second per editor, and the socket already
   * proved it may be here when it joined. What it cannot do is send to a book
   * it never joined — the room is the authorisation, so a socket that is not
   * in it broadcasts to nobody.
   *
   * The coordinates are millimetres on the spread, not pixels on a screen. Two
   * people are at different zoom levels on different monitors; a pixel means
   * nothing to the other one.
   */
  @SubscribeMessage('book:cursor')
  handleBookCursor(
    @MessageBody() message: {
      journeyId?: number | string;
      spreadIndex?: number;
      x?: number | null;
      y?: number | null;
    },
    @ConnectedSocket() socket: TrekWebSocket,
  ): undefined {
    const user = userOf(socket);
    const sid = socketIdOf(socket);
    if (!user || sid == null || !message?.journeyId) return undefined;

    const journeyId = Number(message.journeyId);
    if (!bookPeers(journeyId).some((p) => p.socketId === sid)) return undefined;

    broadcastToBook(
      journeyId,
      {
        type: 'journey:book:cursor',
        socketId: sid,
        userId: user.id,
        spreadIndex: Math.max(0, Math.trunc(Number(message.spreadIndex) || 0)),
        x: finiteOrNull(message.x),
        y: finiteOrNull(message.y),
      },
      sid,
    );
    return undefined;
  }

  /** The whole list, to everyone in the book including whoever just changed it. */
  private announcePeers(journeyId: number): void {
    broadcastToBook(journeyId, { type: 'journey:book:peers', peers: bookPeers(journeyId) });
  }

  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() message: { tripId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): { type: string; tripId?: number; message?: string } | undefined {
    if (!message?.tripId) return undefined;
    const tripId = Number(message.tripId);
    leaveRoom(socket, tripId);
    return { type: 'left', tripId };
  }
}

/**
 * A coordinate, or null for a pointer that has left the page.
 *
 * The null check is explicit because `Number(null)` is 0, not NaN — leaving the
 * page would have parked everyone's arrow in the top-left corner of the spread
 * rather than taking it away.
 */
function finiteOrNull(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
