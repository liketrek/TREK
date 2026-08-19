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

import { RealtimeGateway } from '../../../src/nest/realtime/realtime.gateway';
import {
  bookPeers,
  broadcast,
  broadcastToUser,
  getOnlineUserIds,
  joinRoom,
  registerSocket,
  setServer,
  userOf,
  type TrekWebSocket,
} from '../../../src/nest/realtime/ws-state';
import { emitPluginEvent } from '../../../src/plugin-event-sink';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import type { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import type { User } from '../../../src/types';

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
  get: (sql: string) => (sql.includes('app_settings') ? rows.get('mfa') : rows.get('user')),
  canAccessTrip: (tripId: number) => tripId === 7,
} as unknown as DatabaseService;

const consumeWithMeta = vi.fn();
const tokens = { consumeWithMeta } as unknown as EphemeralTokenService;

/** Everything is reachable except journey 4, which stands in for no access. */
const canAccessJourney = vi.fn((journeyId: number) => (journeyId === 4 ? null : { id: journeyId }));
const journeys = { canAccessJourney } as unknown as JourneyDomainService;

function connect(url: string) {
  const gw = new RealtimeGateway(db, tokens, journeys);
  const ws = socket();
  gw.handleConnection(ws, { url } as never);
  return { gw, ws };
}

beforeEach(() => {
  vi.clearAllMocks();
  rows.clear();
  rows.set('user', { id: 3, username: 'm', email: 'm@x.test', role: 'user', mfa_enabled: 0, password_version: 2 });
  consumeWithMeta.mockReturnValue({ userId: 3, pv: 2 });
});

describe('RealtimeGateway handshake', () => {
  it('WSGW-001: refuses a connect with no token before touching the store', () => {
    const { ws } = connect('/ws');
    expect(ws.closedWith).toEqual([4001, 'Authentication required']);
    expect(consumeWithMeta).not.toHaveBeenCalled();
  });

  it('WSGW-002: refuses an unknown or spent token', () => {
    consumeWithMeta.mockReturnValue(null);
    expect(connect('/ws?token=x').ws.closedWith).toEqual([4001, 'Invalid or expired token']);
  });

  it('WSGW-003: rejects a token minted before a password change', () => {
    // The pv gate. Same close reason as an unknown token on purpose: a client
    // must not be able to tell a stale token from a forged one.
    consumeWithMeta.mockReturnValue({ userId: 3, pv: 1 });
    expect(connect('/ws?token=x').ws.closedWith).toEqual([4001, 'Invalid or expired token']);
  });

  it('WSGW-004: treats a token minted without a pv as version 0', () => {
    consumeWithMeta.mockReturnValue({ userId: 3 });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 0, password_version: 0 });
    expect(connect('/ws?token=x').ws.closedWith).toBeNull();
  });

  it('WSGW-005: enforces the MFA policy with its own close code', () => {
    rows.set('mfa', { value: 'true' });
    expect(connect('/ws?token=x').ws.closedWith).toEqual([4403, 'MFA required']);
  });

  it('WSGW-006: admits an MFA-enabled user while the policy is on', () => {
    rows.set('mfa', { value: 'true' });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 1, password_version: 2 });
    expect(connect('/ws?token=x').ws.closedWith).toBeNull();
  });

  it('WSGW-007: the welcome frame carries a NUMERIC socket id', () => {
    // Load-bearing: the client echoes this back as X-Socket-Id and broadcast
    // excludes the originator with Number(excludeSid). A uuid would be NaN,
    // NaN === NaN is false, and every client would receive its own writes back.
    // Nothing throws; it shows up as drag-and-drop that jumps under the cursor.
    const { ws } = connect('/ws?token=x');
    const welcome = JSON.parse(ws.sent[0]) as { type: string; socketId: unknown };
    expect(welcome.type).toBe('welcome');
    expect(Number.isInteger(welcome.socketId)).toBe(true);
  });

  it('WSGW-007b: survives an upgrade request with no url, rather than throwing at it', () => {
    const gw = new RealtimeGateway(db, tokens, journeys);
    const ws = socket();
    expect(() => gw.handleConnection(ws, {} as never)).not.toThrow();
    expect(ws.closedWith).toEqual([4001, 'Authentication required']);
  });

  it('WSGW-007c: a user row with no password_version reads as version 0', () => {
    // Legacy rows predate the column. Treating a missing value as 0 is what
    // makes a legacy token match a legacy row instead of being refused forever.
    consumeWithMeta.mockReturnValue({ userId: 3, pv: 0 });
    rows.set('user', { id: 3, email: 'm@x.test', role: 'user', mfa_enabled: 0 });
    expect(connect('/ws?token=x').ws.closedWith).toBeNull();
  });

  it('WSGW-008: never leaks password_version past the handshake', () => {
    // Asserted on what the socket registry HOLDS, not on the frames it sends.
    // The frames never carry the user object at all, so the earlier version of
    // this case passed with the strip deleted: it proved nothing. What matters
    // is that the retained identity is clean, because that object is what
    // getOnlineUserIds and the onlyUserId filter read.
    const { ws } = connect('/ws?token=x');
    const held = userOf(ws) as unknown as Record<string, unknown> | undefined;
    expect(held).toBeDefined();
    expect(held).not.toHaveProperty('password_version');
    expect(held).toMatchObject({ id: 3, email: 'm@x.test' });
  });
});

describe('RealtimeGateway rooms', () => {
  it('WSGW-010: join refuses a trip the user cannot reach', () => {
    const { gw, ws } = connect('/ws?token=x');
    expect(gw.handleJoin({ tripId: 99 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
  });

  it('WSGW-011: join and leave answer flat, keyed by type', () => {
    const { gw, ws } = connect('/ws?token=x');
    expect(gw.handleJoin({ tripId: 7 }, ws)).toEqual({ type: 'joined', tripId: 7 });
    expect(gw.handleLeave({ tripId: 7 }, ws)).toEqual({ type: 'left', tripId: 7 });
  });

  it('WSGW-012: a frame with no tripId is ignored rather than answered', () => {
    const { gw, ws } = connect('/ws?token=x');
    expect(gw.handleJoin({}, ws)).toBeUndefined();
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
      const gw = new RealtimeGateway(db, tokens, journeys);
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
      const gw = new RealtimeGateway(db, tokens, journeys);
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

  it('WSGW-022: a pong marks the socket live again', () => {
    const { ws } = connect('/ws?token=x');
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

  function joined(journeyId: number) {
    const gw = new RealtimeGateway(db, tokens, journeys);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);
    const reply = gw.handleBookJoin({ journeyId }, ws);
    return { gw, ws, reply };
  }

  it('WSGW-BOOK-001: admits a socket to a journey it may see', () => {
    const j = nextJourney++;
    const { reply } = joined(j);
    expect(reply).toEqual({ type: 'book:joined', journeyId: j });
    expect(bookPeers(j).map(p => p.userId)).toEqual([3]);
  });

  /* Same shape as the trip room's refusal, and for the same reason. */
  it('WSGW-BOOK-002: refuses a journey the user cannot see, and adds nobody', () => {
    const gw = new RealtimeGateway(db, tokens, journeys);
    const ws = socket();
    registerSocket(ws, { id: 3, username: 'm' } as User);

    expect(gw.handleBookJoin({ journeyId: 4 }, ws)).toEqual({ type: 'error', message: 'Access denied' });
    expect(bookPeers(4)).toEqual([]);
  });

  it('WSGW-BOOK-003: tells everyone in the book who is in it', () => {
    const j = nextJourney++;
    const { ws: first } = joined(j);
    first.sent.length = 0;
    joined(j);

    const peers = first.sent.map(raw => JSON.parse(raw)).filter(m => m.type === 'journey:book:peers');
    expect(peers).toHaveLength(1);
    expect(peers[0].peers).toHaveLength(2);
    expect(peers[0].journeyId).toBe(j);
  });

  it('WSGW-BOOK-004: leaving empties the room and says so', () => {
    const j = nextJourney++;
    const { gw, ws } = joined(j);
    expect(gw.handleBookLeave({ journeyId: j }, ws)).toEqual({ type: 'book:left', journeyId: j });
    expect(bookPeers(j)).toEqual([]);
  });

  /*
   * The one that leaves a ghost if it is missed: a closed tab whose arrow stays
   * on everyone else's page, belonging to nobody.
   */
  it('WSGW-BOOK-005: a dropped connection leaves the book too', () => {
    const j = nextJourney++;
    const { gw, ws } = joined(j);
    const other = joined(j);
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

  function pair() {
    const journeyId = nextJourney++;
    const gw = new RealtimeGateway(db, tokens, journeys);
    const mine = socket();
    const theirs = socket();
    registerSocket(mine, { id: 3, username: 'm' } as User);
    registerSocket(theirs, { id: 4, username: 'other' } as User);
    gw.handleBookJoin({ journeyId }, mine);
    gw.handleBookJoin({ journeyId }, theirs);
    mine.sent.length = 0;
    theirs.sent.length = 0;
    return { gw, mine, theirs, journeyId };
  }

  const cursorsIn = (ws: FakeSocket) =>
    ws.sent.map(raw => JSON.parse(raw)).filter(m => m.type === 'journey:book:cursor');

  it('WSGW-CUR-001: forwards a pointer to the others, not back to the sender', () => {
    const { gw, mine, theirs, journeyId } = pair();
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
  it('WSGW-CUR-002: a socket that never joined reaches nobody', () => {
    const { gw, theirs, journeyId } = pair();
    const stranger = socket();
    registerSocket(stranger, { id: 5, username: 'x' } as User);

    gw.handleBookCursor({ journeyId, spreadIndex: 0, x: 1, y: 1 }, stranger);
    expect(cursorsIn(theirs)).toEqual([]);
  });

  it('WSGW-CUR-003: a pointer leaving the page travels as null', () => {
    const { gw, mine, theirs, journeyId } = pair();
    gw.handleBookCursor({ journeyId, spreadIndex: 0, x: null, y: null }, mine);
    expect(cursorsIn(theirs)[0]).toMatchObject({ x: null, y: null });
  });

  it('WSGW-CUR-004: refuses nonsense coordinates rather than passing them on', () => {
    const { gw, mine, theirs, journeyId } = pair();
    gw.handleBookCursor({ journeyId, spreadIndex: -4, x: Number.NaN, y: Infinity }, mine);

    expect(cursorsIn(theirs)[0]).toMatchObject({ spreadIndex: 0, x: null, y: null });
  });
});
