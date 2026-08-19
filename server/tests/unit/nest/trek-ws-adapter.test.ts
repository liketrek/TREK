import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const adapter = new TrekWsAdapter({} as HttpServer);
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

  it('WSAD-030: attaches to the http server it was given, on the gateway path', () => {
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: Record<string, unknown> };
    try {
      expect(server.options.path).toBe('/ws');
      // The registry has to see the live server, or every bridge broadcast
      // silently goes nowhere.
      expect(getServer()).toBe(server);
    } finally {
      void ad.close(server as never);
    }
  });

  it('WSAD-031: with no allowlist configured, ws gets no verifyClient at all', () => {
    // Rather than one that always says yes: an always-true hook is a hook that
    // can be broken into a false later without anyone noticing.
    wsOrigins.value = null;
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' }) as { options: { verifyClient?: unknown } };
    try {
      expect(typeof server.options.verifyClient).not.toBe('function');
    } finally {
      void ad.close(server as never);
    }
  });

  it('WSAD-031b: with an allowlist, a foreign origin is refused 403 before a socket exists', () => {
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
      void ad.close(server as never);
    }
  });

  it('WSAD-030b: falls back to /ws when the gateway declares no path', () => {
    wsOrigins.value = null;
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, {}) as { options: Record<string, unknown> };
    try {
      expect(server.options.path).toBe('/ws');
    } finally {
      void ad.close(server as never);
    }
  });

  it('WSAD-031c: a server-level error is LOGGED, never swallowed', () => {
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
      void ad.close(server as never);
    }
  });

  it('WSAD-032: closing clears the registry, so a stale server is never broadcast to', async () => {
    const ad = new TrekWsAdapter(httpServer);
    const server = ad.create(0, { path: '/ws' });
    await ad.close(server as never);
    expect(getServer()).toBeNull();
  });
});
