import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The gateway's handshake, and the socket registry it writes into.
 *
 * The transport suites in tests/websocket drive real sockets end to end; these
 * cases go at the pieces directly, so the ways this can fail SILENTLY are
 * pinned by name rather than by whether a browser happened to work.
 */
vi.mock('../../../src/plugin-event-sink', () => ({
  emitPluginEvent: vi.fn(),
  pluginEventMeta: vi.fn(() => ({})),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { RealtimeGateway } from '../../../src/nest/realtime/realtime.gateway';
import { hostVersion } from '../../../src/nest/plugins/install/host-compat';
import { logError } from '../../../src/nest/audit/audit-log.logger';
import {
  bookPeers,
  broadcast,
  broadcastToBook,
  joinBook,
  leaveBook,
  broadcastToUser,
  getOnlineUserIds,
  joinRoom,
  registerSocket,
  setServer,
  userOf,
  type TrekWebSocket,
} from '../../../src/nest/realtime/ws-state';
import { emitPluginEvent } from '../../../src/plugin-event-sink';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { EphemeralTokenService } from '../../../src/nest/auth-core/ephemeral-token.service';
import type { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { User } from '../../../src/types';
import { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';

interface FakeSocket extends TrekWebSocket {
  sent: string[];
  closedWith: [number, string] | null;
}

function socket(): FakeSocket {
  const sent: string[] = [];
  const s = {
    readyState: 1,
    isAlive: false,
    sent,
    closedWith: null as [number, string] | null,
    send: (raw: string) => { sent.push(raw); },
    close: (code: number, reason: string) => { s.closedWith = [code, reason]; },
    on: vi.fn(),
    terminate: vi.fn(),
    ping: vi.fn(),
  };
  return s as unknown as FakeSocket;
}

const rows = new Map<string, unknown>();
const db = {
  findAccessible: (tripId: number) => tripId === 7,
} as unknown as TripsRepository;

const users = {
  findForWsHandshake: vi.fn(async () => rows.get('user') ?? null),
} as unknown as UsersRepository;

const appSettings = {
  getValue: vi.fn(async (key: string) =>
    key === 'require_mfa' ? ((rows.get('mfa') as { value: string } | undefined)?.value ?? null) : null,
  ),
} as unknown as AppSettingsRepository;

const consumeWithMeta = vi.fn();
const tokens = { consumeWithMeta } as unknown as EphemeralTokenService;

/** Everything is reachable except journey 4, which stands in for no access. */
const canAccessJourney = vi.fn((journeyId: number) => (journeyId === 4 ? null : { id: journeyId }));
const journeys = { canAccessJourney } as unknown as JourneyDomainService;

async function connect(url: string) {
  const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
  const ws = socket();
  await gw.handleConnection(ws, { url } as never);
  return { gw, ws };
}

beforeEach(() => {
  vi.clearAllMocks();
  rows.clear();
  rows.set('user', { id: 3, username: 'm', email: 'm@x.test', role: 'user', mfa_enabled: 0, password_version: 2 });
  consumeWithMeta.mockReturnValue({ userId: 3, pv: 2 });
});

describe('RealtimeGateway handshake', () => {
  it('WSGW-001: refuses a connect with no token before touching the store', async () => {
    const { ws } = await connect('/ws');
    expect(ws.closedWith).toEqual([4001, 'Authentication required']);
    expect(consumeWithMeta).not.toHaveBeenCalled();
  });

  it('WSGW-002: refuses an unknown or spent token', async () => {
    consumeWithMeta.mockReturnValue(null);
    expect((await connect('/ws?token=x')).ws.closedWith).toEqual([4001, 'Invalid or expired token']);
  });

  it('WSGW-003: rejects a token minted before a password change', async () => {
    // The pv gate. Same close reason as an unknown token on purpose: a client
    // must not be able to tell a stale token from a forged one.
    consumeWithMeta.mockReturnValue({ userId: 3, pv: 1 });
    expect((await connect('/ws?token=x')).ws.closedWith).toEqual([4001, 'Invalid or expired token']);
  });

  it('WSGW-004: treats a token minted without a pv as version 0', async () => {
    consumeWithMeta.mockReturnValue({ userId: 3 });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 0, password_version: 0 });
    expect((await connect('/ws?token=x')).ws.closedWith).toBeNull();
  });

  it('WSGW-005: enforces the MFA policy with its own close code', async () => {
    rows.set('mfa', { value: 'true' });
    expect((await connect('/ws?token=x')).ws.closedWith).toEqual([4403, 'MFA required']);
  });

  it('WSGW-006: admits an MFA-enabled user while the policy is on', async () => {
    rows.set('mfa', { value: 'true' });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 1, password_version: 2 });
    expect((await connect('/ws?token=x')).ws.closedWith).toBeNull();
  });

  it('WSGW-007: the welcome frame carries a NUMERIC socket id', async () => {
    // Load-bearing: the client echoes this back as X-Socket-Id and broadcast
    // excludes the originator with Number(excludeSid). A uuid would be NaN,
    // NaN === NaN is false, and every client would receive its own writes back.
    // Nothing throws; it shows up as drag-and-drop that jumps under the cursor.
    const { ws } = await connect('/ws?token=x');
    const welcome = JSON.parse(ws.sent[0]) as { type: string; socketId: unknown };
    expect(welcome.type).toBe('welcome');
    expect(Number.isInteger(welcome.socketId)).toBe(true);
  });

  it('WSGW-007d: the welcome frame names the version the server runs', async () => {
    // A client open across a deploy reconnects and compares this with the
    // build it runs, so it can offer the new one (NewVersionNotice).
    const { ws } = await connect('/ws?token=x');
    const welcome = JSON.parse(ws.sent[0]) as { type: string; version: unknown };
    expect(welcome.version).toBe(hostVersion());
    expect(welcome.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('WSGW-007b: survives an upgrade request with no url, rather than throwing at it', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    await expect(gw.handleConnection(ws, {} as never)).resolves.not.toThrow();
    expect(ws.closedWith).toEqual([4001, 'Authentication required']);
  });

  it('WSGW-007c: a user row with no password_version reads as version 0', async () => {
    // Legacy rows predate the column. Treating a missing value as 0 is what
    // makes a legacy token match a legacy row instead of being refused forever.
    consumeWithMeta.mockReturnValue({ userId: 3, pv: 0 });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 0 });
    expect((await connect('/ws?token=x')).ws.closedWith).toBeNull();
  });

  it('WSGW-007d: reads the user row and the require_mfa setting through the repositories, by the right keys (Plan 4 Task 1)', async () => {
    await connect('/ws?token=x');
    expect(users.findForWsHandshake).toHaveBeenCalledWith(3);
    expect(appSettings.getValue).toHaveBeenCalledWith('require_mfa');
  });

  it('WSGW-008: never leaks password_version past the handshake', async () => {
    // Asserted on what the socket registry HOLDS, not on the frames it sends.
    // The frames never carry the user object at all, so the earlier version of
    // this case passed with the strip deleted: it proved nothing. What matters
    // is that the retained identity is clean, because that object is what
    // getOnlineUserIds and the onlyUserId filter read.
    const { ws } = await connect('/ws?token=x');
    const held = userOf(ws) as unknown as Record<string, unknown> | undefined;
    expect(held).toBeDefined();
    expect(held).not.toHaveProperty('password_version');
    expect(held).toMatchObject({ id: 3, email: 'm@x.test' });
  });

  it('WSGW-009: an unexpected handshake error is logged and closes 4001, reason "connection setup failed"', async () => {
    // Anything thrown inside the try — here, the user-row lookup blowing up —
    // must still answer the callback rather than escape as an uncaught
    // exception (recipe R1.5's catch site).
    const throwingUsers = {
      findForWsHandshake: () => { throw new Error('db exploded'); },
    } as unknown as UsersRepository;
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, throwingUsers, appSettings);
    const ws = socket();

    await gw.handleConnection(ws, { url: '/ws?token=x' } as never);

    expect(ws.closedWith).toEqual([4001, 'connection setup failed']);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('db exploded'));
  });

  it('WSGW-009b: a non-Error thrown during the handshake is stringified rather than crashing the catch itself', async () => {
    const throwingUsers = {
      findForWsHandshake: () => { throw 'db string'; }, // non-Error throw, pinning the ternary's String(err) fallback
    } as unknown as UsersRepository;
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, throwingUsers, appSettings);
    const ws = socket();

    await gw.handleConnection(ws, { url: '/ws?token=x' } as never);

    expect(ws.closedWith).toEqual([4001, 'connection setup failed']);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('db string'));
  });
});

describe('RealtimeGateway rooms', () => {
  it('WSGW-010: join refuses a trip the user cannot reach', async () => {
    const { gw, ws } = await connect('/ws?token=x');
    expect(await gw.handleJoin({ tripId: 99 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
  });

  it('WSGW-011: join and leave answer flat, keyed by type', async () => {
    const { gw, ws } = await connect('/ws?token=x');
    expect(await gw.handleJoin({ tripId: 7 }, ws)).toEqual({ type: 'joined', tripId: 7 });
    expect(gw.handleLeave({ tripId: 7 }, ws)).toEqual({ type: 'left', tripId: 7 });
  });

  it('WSGW-012: a frame with no tripId is ignored rather than answered', async () => {
    const { gw, ws } = await connect('/ws?token=x');
    expect(await gw.handleJoin({}, ws)).toBeUndefined();
    expect(gw.handleLeave({}, ws)).toBeUndefined();
  });
});

describe('RealtimeGateway heartbeat', () => {
  it('WSGW-020: pings a live socket and terminates one that missed the last ping', () => {
    vi.useFakeTimers();
    try {
      const alive = socket();
      alive.isAlive = true;
      const stale = socket();
      stale.isAlive = false;
      const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
      gw.afterInit({ clients: new Set([alive, stale]) } as never);

      vi.advanceTimersByTime(30_000);

      // A socket that answered the last ping is asked again and marked pending.
      expect(alive.ping).toHaveBeenCalledTimes(1);
      expect(alive.isAlive).toBe(false);
      // One that never answered is dropped rather than pinged forever.
      expect(stale.terminate).toHaveBeenCalledTimes(1);
      expect(stale.ping).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('WSGW-021: the interval stops with the module, so a test process can exit', () => {
    vi.useFakeTimers();
    try {
      const ws = socket();
      ws.isAlive = true;
      const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
      gw.afterInit({ clients: new Set([ws]) } as never);
      gw.onModuleDestroy();

      vi.advanceTimersByTime(90_000);
      expect(ws.ping).not.toHaveBeenCalled();
      // Idempotent: shutdown can run twice without clearing a stale handle.
      expect(() => gw.onModuleDestroy()).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it('WSGW-022: a pong marks the socket live again', async () => {
    const { ws } = await connect('/ws?token=x');
    const pong = (ws.on as unknown as { mock: { calls: [string, () => void][] } }).mock.calls
      .find(([event]) => event === 'pong');
    expect(pong).toBeDefined();
    ws.isAlive = false;
    pong![1]();
    expect(ws.isAlive).toBe(true);
  });
});

describe('ws-state fan-out', () => {
  it('WSST-001: broadcast excludes the originating socket by its numeric id', () => {
    const a = socket();
    const b = socket();
    const sidA = registerSocket(a, { id: 1 } as User);
    registerSocket(b, { id: 2 } as User);
    joinRoom(a, 42);
    joinRoom(b, 42);

    broadcast(42, 'place:created' as never, { placeId: 9 } as never, sidA);

    expect(a.sent).toHaveLength(0);
    expect(JSON.parse(b.sent[0])).toMatchObject({ type: 'place:created', tripId: 42, placeId: 9 });
  });

  it('WSST-002: onlyUserId narrows delivery to one member', () => {
    const mine = socket();
    const theirs = socket();
    registerSocket(mine, { id: 1 } as User);
    registerSocket(theirs, { id: 2 } as User);
    joinRoom(mine, 43);
    joinRoom(theirs, 43);

    broadcast(43, 'packing:updated' as never, {} as never, undefined, 1);

    expect(mine.sent).toHaveLength(1);
    expect(theirs.sent).toHaveLength(0);
  });

  it('WSST-003: announces core events to plugins BEFORE the room check', () => {
    // No room, no viewers, and with a plugin subscribed the event still has to
    // fire. Ordering it after the early return would silence plugin events on
    // every trip nobody happens to be looking at.
    broadcast(9999, 'day:updated' as never, {} as never);
    expect(emitPluginEvent).toHaveBeenCalledWith(9999, 'day:updated', expect.anything());
  });

  it('WSST-004: does not re-announce a plugin broadcast, which would loop', () => {
    broadcast(9998, 'plugin:acme:ping' as never, {} as never);
    expect(emitPluginEvent).not.toHaveBeenCalled();
  });

  it('WSST-004b: a closing socket is skipped by both fan-outs', () => {
    const open = socket();
    const closing = socket();
    (closing as { readyState: number }).readyState = 2; // CLOSING
    registerSocket(open, { id: 1 } as User);
    registerSocket(closing, { id: 2 } as User);
    joinRoom(open, 44);
    joinRoom(closing, 44);
    setServer({ clients: new Set([open, closing]) } as never);

    broadcast(44, 'trip:updated' as never, {} as never);
    broadcastToUser(2, { type: 'trip:invite' });

    expect(open.sent).toHaveLength(1);
    expect(closing.sent).toHaveLength(0);
    // And it is not counted as online, which drives the admin presence dots.
    expect(getOnlineUserIds()).toEqual(new Set([1]));
  });

  it('WSST-004c: a socket with no registered user is not reported online', () => {
    const stray = socket();
    setServer({ clients: new Set([stray]) } as never);
    expect(getOnlineUserIds()).toEqual(new Set());
  });

  it('WSST-005: broadcastToUser and getOnlineUserIds answer empty with no server', () => {
    setServer(null);
    expect(() => broadcastToUser(1, { type: 'x' })).not.toThrow();
    expect(getOnlineUserIds()).toEqual(new Set());
  });
});

/**
 * ── Studio books (#1973) ────────────────────────────────────────────────
 *
 * Presence and pointers for people editing the same photo book. Nothing here
 * is written down: the room IS the state, and a socket that goes takes its
 * pointer with it.
 */
describe('book rooms', () => {
  let nextJourney = 100;

  async function joined(journeyId: number) {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);
    const reply = await gw.handleBookJoin({ journeyId }, ws);
    return { gw, ws, reply };
  }

  it('WSGW-BOOK-001: admits a socket to a journey it may see', async () => {
    const j = nextJourney++;
    const { reply } = await joined(j);
    expect(reply).toEqual({ type: 'book:joined', journeyId: j });
    expect(bookPeers(j).map(p => p.userId)).toEqual([3]);
  });

  /* Same shape as the trip room's refusal, and for the same reason. */
  it('WSGW-BOOK-002: refuses a journey the user cannot see, and adds nobody', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);

    expect(await gw.handleBookJoin({ journeyId: 4 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
    expect(bookPeers(4)).toEqual([]);
  });

  it('WSGW-BOOK-003: tells everyone in the book who is in it', async () => {
    const j = nextJourney++;
    const { ws: first } = await joined(j);
    first.sent.length = 0;
    await joined(j);

    const peers = first.sent.map(raw => JSON.parse(raw)).filter(m => m.type === 'journey:book:peers');
    expect(peers).toHaveLength(1);
    expect(peers[0].peers).toHaveLength(2);
    expect(peers[0].journeyId).toBe(j);
  });

  it('WSGW-BOOK-004: leaving empties the room and says so', async () => {
    const j = nextJourney++;
    const { gw, ws } = await joined(j);
    expect(gw.handleBookLeave({ journeyId: j }, ws)).toEqual({ type: 'book:left', journeyId: j });
    expect(bookPeers(j)).toEqual([]);
  });

  /*
   * The one that leaves a ghost if it is missed: a closed tab whose arrow stays
   * on everyone else's page, belonging to nobody.
   */
  it('WSGW-BOOK-005: a dropped connection leaves the book too', async () => {
    const j = nextJourney++;
    const { gw, ws } = await joined(j);
    const other = await joined(j);
    other.ws.sent.length = 0;
    expect(bookPeers(j)).toHaveLength(2);

    gw.handleDisconnect(ws);

    expect(bookPeers(j)).toHaveLength(1);
    const peers = other.ws.sent.map(raw => JSON.parse(raw)).filter(m => m.type === 'journey:book:peers');
    expect(peers[peers.length - 1].peers).toHaveLength(1);
  });
});

describe('book pointers', () => {
  let nextJourney = 200;

  async function pair() {
    const journeyId = nextJourney++;
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const mine = socket();
    const theirs = socket();
    registerSocket(mine, { id: 3, username: 'm' } as User);
    registerSocket(theirs, { id: 4, username: 'other' } as User);
    await gw.handleBookJoin({ journeyId }, mine);
    await gw.handleBookJoin({ journeyId }, theirs);
    mine.sent.length = 0;
    theirs.sent.length = 0;
    return { gw, mine, theirs, journeyId };
  }

  const cursorsIn = (ws: FakeSocket) =>
    ws.sent.map(raw => JSON.parse(raw)).filter(m => m.type === 'journey:book:cursor');

  it('WSGW-CUR-001: forwards a pointer to the others, not back to the sender', async () => {
    const { gw, mine, theirs, journeyId } = await pair();
    gw.handleBookCursor({ journeyId, spreadIndex: 2, x: 105.5, y: 60 }, mine);

    expect(cursorsIn(mine)).toEqual([]);
    expect(cursorsIn(theirs)).toHaveLength(1);
    expect(cursorsIn(theirs)[0]).toMatchObject({ journeyId, userId: 3, spreadIndex: 2, x: 105.5, y: 60 });
  });

  /*
   * The room is the authorisation. Nothing is checked against the database on
   * this path — it runs ten times a second — so a socket that never joined has
   * to reach nobody.
   */
  it('WSGW-CUR-002: a socket that never joined reaches nobody', async () => {
    const { gw, theirs, journeyId } = await pair();
    const stranger = socket();
    registerSocket(stranger, { id: 5, username: 'x' } as User);

    gw.handleBookCursor({ journeyId, spreadIndex: 0, x: 1, y: 1 }, stranger);
    expect(cursorsIn(theirs)).toEqual([]);
  });

  it('WSGW-CUR-003: a pointer leaving the page travels as null', async () => {
    const { gw, mine, theirs, journeyId } = await pair();
    gw.handleBookCursor({ journeyId, spreadIndex: 0, x: null, y: null }, mine);
    expect(cursorsIn(theirs)[0]).toMatchObject({ x: null, y: null });
  });

  it('WSGW-CUR-004: refuses nonsense coordinates rather than passing them on', async () => {
    const { gw, mine, theirs, journeyId } = await pair();
    gw.handleBookCursor({ journeyId, spreadIndex: -4, x: Number.NaN, y: Infinity }, mine);

    expect(cursorsIn(theirs)[0]).toMatchObject({ spreadIndex: 0, x: null, y: null });
  });
});

/*
 * ── The ways a book message is ignored ──────────────────────────────────
 *
 * Every one of these is a message that must produce nothing at all: no reply,
 * no room change, no broadcast. They are worth naming because the failure is
 * silent in each case — a handler that quietly did something with a missing
 * journey id would not throw, it would put a socket somewhere it does not
 * belong and nobody would see it until two strangers shared a page.
 */
describe('book messages that are refused', () => {
  let nextJourney = 300;

  it('WSGW-BOOK-006: a join without a journey id is ignored', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);

    expect(await gw.handleBookJoin({}, ws)).toBeUndefined();
    expect(ws.sent).toEqual([]);
  });

  /* An unauthenticated socket never got as far as the registry. */
  it('WSGW-BOOK-007: a join from a socket with no user is ignored', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const j = nextJourney++;

    expect(await gw.handleBookJoin({ journeyId: j }, socket())).toBeUndefined();
    expect(bookPeers(j)).toEqual([]);
  });

  it('WSGW-BOOK-008: a journey id that is not a number is refused, not joined', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);

    expect(await gw.handleBookJoin({ journeyId: 'not-a-journey' }, ws))
      .toEqual({ type: 'error', message: 'Access denied' });
  });

  it('WSGW-BOOK-009: a leave without a journey id is ignored', () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);

    expect(gw.handleBookLeave({}, ws)).toBeUndefined();
  });

  /* Leaving a room nobody is in must not create one on the way out. */
  it('WSGW-BOOK-010: leaving a book that was never joined does nothing', () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);
    const j = nextJourney++;

    expect(gw.handleBookLeave({ journeyId: j }, ws)).toEqual({ type: 'book:left', journeyId: j });
    expect(bookPeers(j)).toEqual([]);
  });

  it('WSGW-CUR-005: a pointer without a journey id reaches nobody', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const mine = socket();
    const theirs = socket();
    registerSocket(mine, { id: 3, username: 'm' } as User);
    registerSocket(theirs, { id: 4, username: 'o' } as User);
    const j = nextJourney++;
    await gw.handleBookJoin({ journeyId: j }, mine);
    await gw.handleBookJoin({ journeyId: j }, theirs);
    theirs.sent.length = 0;

    expect(gw.handleBookCursor({ x: 1, y: 1 }, mine)).toBeUndefined();
    expect(theirs.sent).toEqual([]);
  });

  it('WSGW-CUR-006: a pointer from a socket with no user reaches nobody', async () => {
    const gw = new RealtimeGateway(new TripAccessService(db), tokens, journeys, users, appSettings);
    const theirs = socket();
    registerSocket(theirs, { id: 4, username: 'o' } as User);
    const j = nextJourney++;
    await gw.handleBookJoin({ journeyId: j }, theirs);
    theirs.sent.length = 0;

    expect(gw.handleBookCursor({ journeyId: j, x: 1, y: 1 }, socket())).toBeUndefined();
    expect(theirs.sent).toEqual([]);
  });
});

/*
 * ── Sockets that are in a room but cannot be talked to ──────────────────
 *
 * A room holds sockets, and a socket can stop being usable without leaving:
 * the connection drops and the close handler has not run yet, or it was put in
 * a room without ever being registered. Both are states the peer list and the
 * broadcast have to walk past rather than trip over, because the alternative is
 * an editor whose peer list shows a ghost, or a throw on a path that runs ten
 * times a second.
 */
describe('book rooms with unusable sockets in them', () => {
  let nextJourney = 400;

  it('WSST-BOOK-001: a closed socket is not a peer', () => {
    const j = nextJourney++;
    const live = socket();
    const dead = socket();
    registerSocket(live, { id: 3, username: 'm' } as User);
    registerSocket(dead, { id: 9, username: 'gone' } as User);
    joinBook(live, j);
    joinBook(dead, j);
    (dead as { readyState: number }).readyState = 3;

    expect(bookPeers(j).map(p => p.userId)).toEqual([3]);
  });

  it('WSST-BOOK-002: a socket that was never registered is not a peer', () => {
    const j = nextJourney++;
    const known = socket();
    registerSocket(known, { id: 3, username: 'm' } as User);
    joinBook(known, j);
    joinBook(socket(), j);

    expect(bookPeers(j).map(p => p.userId)).toEqual([3]);
  });

  it('WSST-BOOK-003: a broadcast skips a closed socket instead of writing to it', () => {
    const j = nextJourney++;
    const live = socket();
    const dead = socket();
    registerSocket(live, { id: 3, username: 'm' } as User);
    registerSocket(dead, { id: 9, username: 'gone' } as User);
    joinBook(live, j);
    joinBook(dead, j);
    (dead as { readyState: number }).readyState = 3;

    broadcastToBook(j, { type: 'x' });

    expect(live.sent).toHaveLength(1);
    expect(dead.sent).toEqual([]);
  });

  it('WSST-BOOK-004: a broadcast to a book nobody is in goes nowhere', () => {
    expect(() => broadcastToBook(nextJourney++, { type: 'x' })).not.toThrow();
  });

  /*
   * One person, two tabs, two books: the second join must extend what the
   * socket is already in rather than replacing it, or leaving one book would
   * take the other with it.
   */
  it('WSST-BOOK-005: a socket can be in two books at once', () => {
    const a = nextJourney++;
    const b = nextJourney++;
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);
    joinBook(ws, a);
    joinBook(ws, b);

    leaveBook(ws, a);

    expect(bookPeers(a)).toEqual([]);
    expect(bookPeers(b).map(p => p.userId)).toEqual([3]);
  });

  it('WSST-BOOK-006: leaving a book that does not exist is not an error', () => {
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);
    expect(() => leaveBook(ws, nextJourney++)).not.toThrow();
  });
});
