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
import { InjectRepository } from '@mikro-orm/nestjs';
import { EphemeralTokenService } from '../auth-core/ephemeral-token.service';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { User } from '../../types';
import { logError } from '../audit/audit-log.logger';
import {
  bookPeers,
  broadcastToBook,
  registerSocket,
  RoomRegistry,
  roomsSlot,
  socketIdOf,
  userOf,
  type TrekWebSocket,
} from './ws-state';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { readAppSetting } from '../common/app-settings.registry';
import { runningVersion } from '../../app-config';

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
 * What did NOT move is the socket registry. It stays one process-wide
 * instance in ws-state.ts (the RoomRegistry port, installed in `roomsSlot` by
 * RealtimeGatewayModule) because out-of-container code (the no-Nest test
 * harnesses, the vi.mock'd src/websocket seam) must see the same rooms; see
 * the note there.
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
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripsRepository directly (same constructor slot) and
    // calls findAccessible from `handleJoin`.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly tokens: EphemeralTokenService,
    /*
     * For the book rooms, and injected rather than reimplemented: who may open
     * a journey is one question with one answer, and a second copy of it here
     * is a second thing to keep in step with the REST routes.
     */
    private readonly journeys: JourneyDomainService,
    @InjectRepository(Users) private readonly users: UsersRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    // Room membership, behind its port. The container's provider, which
    // RealtimeGatewayModule also installs for the broadcast functions in
    // ws-state.ts; a hand-built gateway takes the installed one.
    private readonly rooms: RoomRegistry = roomsSlot.get(),
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
   * password-version gate runs before the MFA one. An unexpected error anywhere
   * in the handshake is also closed as 4001, reason 'connection setup failed',
   * instead of escaping as an uncaught exception.
   */
  async handleConnection(socket: TrekWebSocket, request: IncomingMessage): Promise<void> {
    // TrekWsAdapter.bindClientConnect fires this from a plain 'connection'
    // listener and cannot await it, so a throw here would otherwise become an
    // unhandled rejection once the handshake goes async below (recipe R1.5).
    // Closed the same way every other rejected handshake already is.
    try {
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

      const row = await this.users.findForWsHandshake(consumed.userId);
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
      const requireMfa = (await readAppSetting(this.appSettings, 'require_mfa')) === 'true';
      const mfaOk = user.mfa_enabled === 1 || user.mfa_enabled === true;
      if (requireMfa && !mfaOk) {
        socket.close(4403, 'MFA required');
        return;
      }

      socket.isAlive = true;
      const sid = registerSocket(socket, user as User);
      // The version lets a client that stayed open across a deploy notice it
      // runs the previous build: a deploy restarts the server, so every open
      // client reconnects and reads this again.
      socket.send(JSON.stringify({ type: 'welcome', socketId: sid, version: runningVersion() }));
      socket.on('pong', () => { socket.isAlive = true; });
    } catch (err) {
      logError(`ws handshake failed: ${err instanceof Error ? err.message : String(err)}`);
      socket.close(4001, 'connection setup failed');
    }
  }

  handleDisconnect(socket: TrekWebSocket): void {
    this.rooms.leaveAll(socket);
    // Tell the books this socket was in, or its pointer stays on everyone
    // else's page forever.
    for (const journeyId of this.rooms.leaveAllBooks(socket)) this.announcePeers(journeyId);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() message: { tripId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): Promise<{ type: string; tripId?: number; message?: string } | undefined> {
    const user = userOf(socket);
    if (!user || !message?.tripId) return undefined;

    // Rule 22 / A-H1 (Task 9 fix wave): `Number.isFinite` first, the same
    // guard `handleBookJoin` below already carries — without it, a
    // non-numeric `tripId` (`'abc'`) becomes `NaN`, which used to reach
    // `TripsRepository.findAccessible`'s raw bind as the unquoted bareword
    // `NaN` and throw (`no such column: NaN`), leaving this handler's
    // promise unanswered instead of the legacy `Access denied` frame. The
    // platform now renders a bound `NaN` as `NULL` too (`NulSafeSqlitePlatform`),
    // so this guard is defence in depth, not the only fix.
    const tripId = Number(message.tripId);
    if (!Number.isFinite(tripId) || !(await this.trips.findAccessible(tripId, user.id))) {
      return { type: 'error', message: 'Access denied' };
    }
    this.rooms.join(socket, tripId);
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
  async handleBookJoin(
    @MessageBody() message: { journeyId?: number | string },
    @ConnectedSocket() socket: TrekWebSocket,
  ): Promise<{ type: string; journeyId?: number; message?: string } | undefined> {
    const user = userOf(socket);
    if (!user || !message?.journeyId) return undefined;

    const journeyId = Number(message.journeyId);
    if (!Number.isFinite(journeyId) || !(await this.journeys.canAccessJourney(journeyId, user.id))) {
      return { type: 'error', message: 'Access denied' };
    }

    this.rooms.joinBook(socket, journeyId);
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
    this.rooms.leaveBook(socket, journeyId);
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
    this.rooms.leave(socket, tripId);
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
