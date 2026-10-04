import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

/**
 * TrekWsAdapter: the wire protocol and the per-socket flood guard.
 *
 * Both are things the stock WsAdapter does differently, and both fail quietly
 * if this class regresses. A protocol slip means `join` is never handled, the
 * room stays empty, `broadcast` returns at its size check and every client
 * simply stops updating. A missing flood guard is only visible under a hostile
 * client.
 */
// The origin allowlist is env-driven and empty in the test environment, so the
// branch that builds verifyClient would never run. Driving readEnv lets both
// sides of it be asserted rather than assumed.
const { wsOrigins, logError } = vi.hoisted(() => ({
  wsOrigins: { value: null as string[] | null },
  logError: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({ logError, logInfo: vi.fn(), logDebug: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    readEnv: () => ({
      ...(actual.readEnv as () => { http: Record<string, unknown> })(),
      http: {
        ...((actual.readEnv as () => { http: Record<string, unknown> })().http),
        wsOrigins: wsOrigins.value,
      },
    }),
  };
});

import { TrekWsAdapter } from '../../../src/nest/realtime/trek-ws.adapter';
import { getServer } from '../../../src/nest/realtime/ws-state';
import type { Server as HttpServer } from 'node:http';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { Users } from '../../../src/db/entities/Users.entity';

const testDb = createSnapshotTestDb();

// task-6-fix-brief.md item 1: bindMessageHandlers now THROWS without an `orm`
// rather than dispatching a matched handler unwrapped (no more silent
// degrade), so every generic-behaviour test below — none of which cares
// about the D6 request-context property itself, only that a message reaches
// its handler — needs the shared adapter to carry a real (if otherwise
// unexercised) ORM. WSAD-040/041 build their OWN local adapter instances
// specifically to test the with/without-orm property and are unaffected.
let adapterOrm: TestOrm;
let adapter: TrekWsAdapter;
beforeAll(async () => {
  adapterOrm = await createTestOrm(testDb);
  adapter = new TrekWsAdapter({} as HttpServer, adapterOrm.orm);
});
afterAll(async () => {
  await adapterOrm.close();
  testDb.close();
});

type MessageListener = (buffer: Buffer) => void;

function fakeSocket() {
  const sent: string[] = [];
  const listeners: Record<string, MessageListener[]> = {};
  return {
    readyState: 1,
    sent,
    terminate: vi.fn(),
    send: (raw: string) => { sent.push(raw); },
    on: (event: string, fn: MessageListener) => {
      (listeners[event] ??= []).push(fn);
    },
    emit: (event: string, payload: Buffer) => {
      for (const fn of listeners[event] ?? []) fn(payload);
    },
    listenerCount: (event: string) => (listeners[event] ?? []).length,
  };
}

const frame = (o: unknown) => Buffer.from(JSON.stringify(o));
/** The adapter hands results to Nest's transform; here it is identity. */
const transform = (v: unknown) => ({ subscribe: (o: { next: (x: unknown) => void }) => o.next(v) }) as never;

let handled: unknown[];
let handlers: { message: string; callback: (data: unknown, socket: unknown) => unknown }[];

beforeEach(() => {
  handled = [];
  handlers = [
    { message: 'join', callback: (data) => { handled.push(data); return { type: 'joined' }; } },
    { message: 'leave', callback: (data) => { handled.push(data); return undefined; } },
    { message: 'book:cursor', callback: (data) => { handled.push(data); return undefined; } },
  ];
});

describe('TrekWsAdapter wire protocol', () => {
  it('WSAD-001: dispatches on `type`, and hands the WHOLE frame to the handler', () => {
    // TREK's frames are flat: tripId sits beside type, not under a `data` key.
    // The stock adapter reads `message.event` and passes `message.data`, which
    // would leave join unhandled and the payload undefined.
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);
    socket.emit('message', frame({ type: 'join', tripId: 7 }));
    expect(handled).toEqual([{ type: 'join', tripId: 7 }]);
    expect(JSON.parse(socket.sent[0])).toEqual({ type: 'joined' });
  });

  it('WSAD-001b: a socket that closed mid-dispatch is not written to', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);
    (socket as { readyState: number }).readyState = 3; // CLOSED
    socket.emit('message', frame({ type: 'join', tripId: 7 }));
    expect(handled).toHaveLength(1); // the handler still ran
    expect(socket.sent).toHaveLength(0); // the answer went nowhere
  });

  it('WSAD-002: a handler that answers undefined sends nothing', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);
    socket.emit('message', frame({ type: 'leave', tripId: 7 }));
    expect(socket.sent).toHaveLength(0);
  });

  it('WSAD-003: malformed JSON and unknown types are ignored, not answered', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);
    socket.emit('message', Buffer.from('{not json'));
    socket.emit('message', frame({ type: 'nope' }));
    socket.emit('message', frame({ tripId: 7 }));
    socket.emit('message', frame('a string'));
    expect(handled).toHaveLength(0);
    expect(socket.sent).toHaveLength(0);
  });
});

describe('TrekWsAdapter D6 request context (task-2-review.md C3 ruling)', () => {
  // Global context disallowed on purpose — the production setting, like
  // tests/unit/nest/database/request-context.test.ts — so a repository read
  // with no wrapper around it genuinely throws, the way it would outside any
  // HTTP request in production. A `@SubscribeMessage` handler has exactly that
  // shape: dispatched from bindMessageHandlers below, not from an Express
  // request, so nothing has forked an EntityManager for it unless the ONE
  // wrapper there (not per-handler) does it.
  it('WSAD-040: without MikroORM passed to the adapter, dispatch THROWS rather than running the handler unwrapped (task-6-fix-brief.md item 1: fail closed at the choke point, not just downstream)', () => {
    const ad = new TrekWsAdapter({} as HttpServer); // no orm
    const socket = fakeSocket();
    let handlerRan = false;
    ad.bindMessageHandlers(
      socket as never,
      [{ message: 'join', callback: async () => { handlerRan = true; } }] as never,
      () => ({ subscribe: () => {} }) as never,
    );
    expect(() => socket.emit('message', frame({ type: 'join', tripId: 1 }))).toThrow(/no MikroORM available/i);
    // The wrapper throws BEFORE calling the handler at all — the handler's
    // own repository read never even ran unwrapped.
    expect(handlerRan).toBe(false);
  });

  it('WSAD-041: with MikroORM passed to the adapter, the SAME repository read inside a handler succeeds — the wrapper is load-bearing', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      let result: unknown;
      let caught: unknown;
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      let captured: Promise<unknown> | undefined;
      const capture = (v: unknown) => {
        captured = v instanceof Promise ? v : Promise.resolve(v);
        return { subscribe: () => {} } as never;
      };
      ad.bindMessageHandlers(
        socket as never,
        [{ message: 'join', callback: async () => {
          try { result = await t.orm.em.find(Users, {}); } catch (e) { caught = e; }
        } }] as never,
        capture,
      );
      socket.emit('message', frame({ type: 'join', tripId: 1 }));
      await captured;
      expect(caught).toBeUndefined();
      expect(Array.isArray(result)).toBe(true);
    } finally {
      await t.close();
    }
  });
});

describe('TrekWsAdapter flood guard', () => {
  it('WSAD-010: counts EVERY frame, including the ones no handler wants', () => {
    // The guard sits before parsing on purpose. Counting only the frames that
    // reach a handler would let a client flood the process with garbage for
    // free, which is what the limit exists to stop.
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);

    for (let i = 0; i < 30; i++) socket.emit('message', Buffer.from('{not json'));
    expect(socket.sent).toHaveLength(0);

    socket.emit('message', frame({ type: 'join', tripId: 7 }));
    expect(JSON.parse(socket.sent[0])).toEqual({ type: 'error', message: 'Rate limit exceeded' });
    expect(handled).toHaveLength(0);
  });

  it('WSAD-010b: a socket that closed while flooding is not written to either', () => {
    // The refusal is still a write. A client that hangs up mid-flood would
    // otherwise take an ERR_HTTP_HEADERS-shaped error on the way out.
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);
    for (let i = 0; i < 30; i++) socket.emit('message', Buffer.from('{not json'));
    (socket as { readyState: number }).readyState = 3; // CLOSED
    socket.emit('message', frame({ type: 'join', tripId: 7 }));
    expect(socket.sent).toHaveLength(0);
  });

  it('WSAD-011: the window reopens, so a well-behaved client recovers', () => {
    vi.useFakeTimers();
    try {
      const socket = fakeSocket();
      adapter.bindMessageHandlers(socket as never, handlers as never, transform);
      for (let i = 0; i < 31; i++) socket.emit('message', frame({ type: 'join', tripId: 7 }));
      expect(socket.sent.some((s) => s.includes('Rate limit'))).toBe(true);

      vi.advanceTimersByTime(10_001);
      socket.sent.length = 0;
      socket.emit('message', frame({ type: 'join', tripId: 7 }));
      expect(JSON.parse(socket.sent[0])).toEqual({ type: 'joined' });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('TrekWsAdapter connection binding', () => {
  it('WSAD-020: attaches the error listener BEFORE handing the socket on', () => {
    // A protocol violation (a malformed frame, a reserved close code such as
    // 1006) arrives as an `error` event; unhandled, Node rethrows it and the
    // process dies. That is #1576, and it only reproduces against a hostile
    // client, so nothing in CI would notice this listener going missing.
    const socket = fakeSocket();
    const server = {
      on: (_event: string, cb: (s: unknown, r: unknown) => void) => cb(socket, { url: '/ws' }),
    };
    let listenersWhenCalled = -1;
    adapter.bindClientConnect(server as never, () => {
      listenersWhenCalled = socket.listenerCount('error');
    });
    expect(listenersWhenCalled).toBe(1);
  });

  it('WSAD-021: forwards the upgrade request, which carries the ws token', () => {
    const socket = fakeSocket();
    const request = { url: '/ws?token=abc' };
    const server = {
      on: (_event: string, cb: (s: unknown, r: unknown) => void) => cb(socket, request),
    };
    const seen: unknown[] = [];
    adapter.bindClientConnect(server as never, (...args: unknown[]) => seen.push(...args));
    expect(seen[1]).toBe(request);
  });
});

/**
 * D6 request context on the CONNECTION dispatch (Plan 3b Task 0), the same
 * property WSAD-040/041 above already pin for the MESSAGE dispatch.
 * `bindClientConnect` fires Nest's OnGatewayConnection hook
 * (RealtimeGateway.handleConnection) — no HTTP request behind it either, and
 * a different lifecycle hook than bindMessageHandlers, so its own wrapper (or
 * lack of one) had to be checked separately (plan3b-sql-inventory.md §5
 * flagged it unverified). Global context disallowed on purpose, same as
 * WSAD-040/041 — allowGlobalContext: false is the production setting.
 */
describe('TrekWsAdapter D6 request context on connect (Plan 3b Task 0)', () => {
  function connectServer(socket: ReturnType<typeof fakeSocket>, request: unknown) {
    return { on: (_event: string, cb: (s: unknown, r: unknown) => void) => cb(socket, request) };
  }

  it('WSAD-050: without MikroORM passed to the adapter, the connection dispatch THROWS rather than running handleConnection unwrapped', () => {
    const ad = new TrekWsAdapter({} as HttpServer); // no orm
    const socket = fakeSocket();
    let handlerRan = false;
    expect(() =>
      ad.bindClientConnect(connectServer(socket, { url: '/ws?token=abc' }) as never, () => {
        handlerRan = true;
      }),
    ).toThrow(/no MikroORM available/i);
    // Same fail-closed shape as WSAD-040: the wrapper throws BEFORE the
    // connection callback ever runs.
    expect(handlerRan).toBe(false);
  });

  it('WSAD-051: with MikroORM passed to the adapter, a repository read inside the connection callback succeeds — the wrapper is load-bearing', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      let result: unknown;
      let caught: unknown;
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      let captured: Promise<unknown> | undefined;
      ad.bindClientConnect(connectServer(socket, { url: '/ws?token=abc' }) as never, () => {
        captured = (async () => {
          try {
            result = await t.orm.em.find(Users, {});
          } catch (e) {
            caught = e;
          }
        })();
      });
      await captured;
      expect(caught).toBeUndefined();
      expect(Array.isArray(result)).toBe(true);
    } finally {
      await t.close();
    }
  });

  // Task 7 review, A-L2 (T1-F7b, open since Task 1): handleConnection is
  // async and the 'connection' listener is not — a rejection inside the
  // wrapped callback used to be an unhandled rejection with no trace.
  it('WSAD-054: a rejecting connection callback is caught and logged through the adapter\'s error path, not an unhandled rejection', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      logError.mockClear();
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      ad.bindClientConnect(connectServer(socket, { url: '/ws?token=abc' }) as never, async () => {
        throw new Error('handleConnection blew up');
      });
      // The listener itself must not throw synchronously (the rejection
      // surfaces asynchronously, through .catch(), not as a thrown error).
      await new Promise((resolve) => setImmediate(resolve));
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('handleConnection blew up'));
    } finally {
      await t.close();
    }
  });

  // Coverage: the `err instanceof Error ? … : String(err)` fallback branch,
  // never exercised by WSAD-054's real Error throw.
  it('WSAD-054b: a connection callback rejecting with a non-Error value is still caught and logged (String(err) fallback)', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      logError.mockClear();
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      ad.bindClientConnect(connectServer(socket, { url: '/ws?token=abc' }) as never, async () => {
        // Deliberately a non-Error throw, to prove the String(err) fallback.
        throw 'not-an-error-value';
      });
      await new Promise((resolve) => setImmediate(resolve));
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('not-an-error-value'));
    } finally {
      await t.close();
    }
  });
});

/**
 * D6 request context on the DISCONNECT dispatch (Task 0 review addendum,
 * LOW item 2) — the same property WSAD-050/051 pin for the connect dispatch,
 * now for `bindClientDisconnect` (`OnGatewayDisconnect` /
 * `RealtimeGateway.handleDisconnect`). The base `WsAdapter.bindClientDisconnect`
 * is a bare `client.on('close', callback)` with no context of any kind.
 */
describe('TrekWsAdapter D6 request context on disconnect (Task 0 review addendum)', () => {
  it('WSAD-052: without MikroORM passed to the adapter, the disconnect dispatch THROWS rather than running handleDisconnect unwrapped', () => {
    const ad = new TrekWsAdapter({} as HttpServer); // no orm
    const socket = fakeSocket();
    let handlerRan = false;
    ad.bindClientDisconnect(socket as never, () => {
      handlerRan = true;
    });
    expect(() => socket.emit('close', Buffer.from(''))).toThrow(/no MikroORM available/i);
    // Same fail-closed shape as WSAD-050: the wrapper throws BEFORE the
    // disconnect callback ever runs.
    expect(handlerRan).toBe(false);
  });

  it('WSAD-053: with MikroORM passed to the adapter, a repository read inside the disconnect callback succeeds — the wrapper is load-bearing', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      let result: unknown;
      let caught: unknown;
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      let captured: Promise<unknown> | undefined;
      ad.bindClientDisconnect(socket as never, () => {
        captured = (async () => {
          try {
            result = await t.orm.em.find(Users, {});
          } catch (e) {
            caught = e;
          }
        })();
      });
      socket.emit('close', Buffer.from(''));
      await captured;
      expect(caught).toBeUndefined();
      expect(Array.isArray(result)).toBe(true);
    } finally {
      await t.close();
    }
  });

  // Task 7 review, A-L2 (T1-F7b) — the disconnect twin of WSAD-054.
  it('WSAD-055: a rejecting disconnect callback is caught and logged through the adapter\'s error path, not an unhandled rejection', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      logError.mockClear();
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      ad.bindClientDisconnect(socket as never, async () => {
        throw new Error('handleDisconnect blew up');
      });
      socket.emit('close', Buffer.from(''));
      await new Promise((resolve) => setImmediate(resolve));
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('handleDisconnect blew up'));
    } finally {
      await t.close();
    }
  });

  // Coverage: the disconnect twin of WSAD-054b's String(err) fallback branch.
  it('WSAD-055b: a disconnect callback rejecting with a non-Error value is still caught and logged (String(err) fallback)', async () => {
    const t = await createTestOrm(testDb, { allowGlobalContext: false });
    try {
      logError.mockClear();
      const ad = new TrekWsAdapter({} as HttpServer, t.orm);
      const socket = fakeSocket();
      ad.bindClientDisconnect(socket as never, async () => {
        // Deliberately a non-Error throw, to prove the String(err) fallback.
        throw 'not-an-error-value-disconnect';
      });
      socket.emit('close', Buffer.from(''));
      await new Promise((resolve) => setImmediate(resolve));
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('not-an-error-value-disconnect'));
    } finally {
      await t.close();
    }
  });
});

/**
 * The pointer exemption (#1973).
 *
 * Studio's pointers move about ten times a second per editor, three times what
 * the tight limit allows on its own — and that limit cannot simply be raised,
 * because it is what stops a client flooding the process. So there are two
 * ceilings, and only pointers are exempt from the tight one.
 */
describe('TrekWsAdapter pointer budget', () => {
  it('WSAD-012: lets pointers past the tight limit', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);

    for (let i = 0; i < 60; i++) socket.emit('message', frame({ type: 'book:cursor', x: i }));

    expect(handled).toHaveLength(60);
    expect(socket.sent).toHaveLength(0);
  });

  /* Exempt from the tight limit, not from the ceiling. */
  it('WSAD-013: cuts a pointer flood off at the outer ceiling', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);

    for (let i = 0; i < 260; i++) socket.emit('message', frame({ type: 'book:cursor', x: i }));

    expect(handled.length).toBeLessThanOrEqual(200);
    expect(socket.sent.some((raw) => raw.includes('Rate limit'))).toBe(true);
  });

  /*
   * The exemption is for pointers alone. A client sending them cannot use them
   * to buy itself extra room for anything else.
   */
  it('WSAD-014: a pointer flood does not loosen the limit on everything else', () => {
    const socket = fakeSocket();
    adapter.bindMessageHandlers(socket as never, handlers as never, transform);

    for (let i = 0; i < 50; i++) socket.emit('message', frame({ type: 'book:cursor', x: i }));
    for (let i = 0; i < 31; i++) socket.emit('message', frame({ type: 'join', tripId: 7 }));

    expect(socket.sent.some((raw) => raw.includes('Rate limit'))).toBe(true);
  });
});

describe('TrekWsAdapter server creation', () => {
  /** A real http.Server is never listened on; ws only needs it to hang an upgrade handler. */
  const httpServer = { on: vi.fn(), once: vi.fn(), removeListener: vi.fn(), emit: vi.fn() } as unknown as HttpServer;

  it('WSAD-030: attaches to the http server it was given, on the gateway path', async () => {
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: Record<string, unknown> };
    try {
      expect(server.options.path).toBe('/ws');
      // The registry has to see the live server, or every bridge broadcast
      // silently goes nowhere.
      expect(getServer()).toBe(server);
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-031: with no allowlist configured, ws gets no verifyClient at all', async () => {
    // Rather than one that always says yes: an always-true hook is a hook that
    // can be broken into a false later without anyone noticing.
    wsOrigins.value = null;
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: { verifyClient?: unknown } };
    try {
      expect(typeof server.options.verifyClient).not.toBe('function');
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-031b: with an allowlist, a foreign origin is refused 403 before a socket exists', async () => {
    wsOrigins.value = ['https://trip.example'];
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: { verifyClient?: unknown } };
    try {
      const verify = server.options.verifyClient as (
        info: { origin: string },
        cb: (ok: boolean, code?: number, msg?: string) => void,
      ) => void;
      const seen: unknown[][] = [];
      verify({ origin: 'https://evil.example' }, (...args) => seen.push(args));
      verify({ origin: 'https://trip.example' }, (...args) => seen.push(args));
      // A same-origin upgrade sends no Origin header at all; refusing that would
      // lock out every non-browser client.
      verify({ origin: '' }, (...args) => seen.push(args));
      expect(seen).toEqual([[false, 403, 'Origin not allowed'], [true], [true]]);
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-031d: a same-host origin passes even when the allowlist names another (#2543)', async () => {
    // A browser always sends Origin on an upgrade. Reached at its LAN address or
    // under a second name, the instance is still talking to its own page, and
    // refusing that left the planner without live updates.
    wsOrigins.value = ['https://trip.example'];
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: { verifyClient?: unknown } };
    try {
      const verify = server.options.verifyClient as (
        info: { origin: string; req: { headers: { host?: string } } },
        cb: (ok: boolean, code?: number, msg?: string) => void,
      ) => void;
      const seen: unknown[][] = [];
      verify({ origin: 'http://192.168.1.20:3000', req: { headers: { host: '192.168.1.20:3000' } } }, (...args) => seen.push(args));
      // A foreign page cannot pick the Host header, so it still gets the 403.
      verify({ origin: 'https://evil.example', req: { headers: { host: '192.168.1.20:3000' } } }, (...args) => seen.push(args));
      expect(seen).toEqual([[true], [false, 403, 'Origin not allowed']]);
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-030b: falls back to /ws when the gateway declares no path', async () => {
    wsOrigins.value = null;
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, {}) as { options: Record<string, unknown> };
    try {
      expect(server.options.path).toBe('/ws');
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-031c: a server-level error is LOGGED, never swallowed', async () => {
    // ws forwards the http server's errors here, so an empty handler eats the
    // bind failure too and the process survives EADDRINUSE serving nothing.
    // index.ts owns the fatal decision; this handler owes a log line.
    wsOrigins.value = null;
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { emit: (e: string, err: unknown) => boolean };
    try {
      expect(() => server.emit('error', new Error('upstream reset'))).not.toThrow();
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('upstream reset'));

      // A non-Error rejection reads as itself rather than as [object Object].
      logError.mockClear();
      server.emit('error', 'ECONNRESET');
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('ECONNRESET'));
    } finally {
      await ad.close(server as never);
    }
  });

  it('WSAD-032: closing clears the registry, so a stale server is never broadcast to', async () => {
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' });
    await ad.close(server as never);
    expect(getServer()).toBeNull();
  });
});
