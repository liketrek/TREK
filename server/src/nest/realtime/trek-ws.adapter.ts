import { WsAdapter } from '@nestjs/platform-ws';
import type { INestApplicationContext } from '@nestjs/common';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { MessageMappingProperties } from '@nestjs/websockets';
import { WebSocketServer } from 'ws';
import type { Observable } from 'rxjs';
import type { EntityManager } from '@mikro-orm/core';
import { readEnv } from '../../app-config';
import { setServer, type TrekWebSocket } from './ws-state';
import { logError } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { isSameHostOrigin } from '../common/same-origin';

// Per-connection message rate limiting. It lives in the adapter, not in the
// gateway's handlers, because the original counted EVERY inbound frame before
// parsing it: malformed JSON and unknown types count too. Counting only the
// frames that reach a @SubscribeMessage handler would leave a client free to
// flood the process with garbage.
const WS_MSG_LIMIT = 30; // max messages
const WS_MSG_WINDOW = 10_000; // per 10 seconds

/**
 * A second, looser ceiling that every frame counts against.
 *
 * Studio's pointers (#1973) move about ten times a second per editor, which is
 * three times what the limit above allows on its own — and that limit cannot
 * simply be raised, because it is what stops a client flooding the process with
 * frames nobody asked for.
 *
 * So the frames are counted twice. Everything counts against this ceiling,
 * before parsing, exactly as before; the tighter limit then applies to
 * everything except pointers. A client can send a lot of pointers and no more
 * of anything else than it ever could, and a client sending garbage is still
 * cut off — just at 200 frames per ten seconds rather than 30, which is a
 * trade worth naming: those frames are small, and the alternative is either no
 * live pointers or a limit high enough to be no limit.
 */
const WS_BURST_LIMIT = 200;

/** The one message type exempt from the tighter limit. */
const HIGH_RATE_TYPE = 'book:cursor';

const rates = new WeakMap<TrekWebSocket, { count: number; windowStart: number }>();
const bursts = new WeakMap<TrekWebSocket, { count: number; windowStart: number }>();

function within(
  store: WeakMap<TrekWebSocket, { count: number; windowStart: number }>,
  socket: TrekWebSocket,
  limit: number,
): boolean {
  let rate = store.get(socket);
  if (!rate) {
    rate = { count: 0, windowStart: Date.now() };
    store.set(socket, rate);
  }
  const now = Date.now();
  if (now - rate.windowStart > WS_MSG_WINDOW) {
    rate.count = 1;
    rate.windowStart = now;
    return true;
  }
  rate.count++;
  return rate.count <= limit;
}

function withinRate(socket: TrekWebSocket): boolean {
  return within(rates, socket, WS_MSG_LIMIT);
}

function withinBurst(socket: TrekWebSocket): boolean {
  return within(bursts, socket, WS_BURST_LIMIT);
}

/**
 * TREK's wire protocol, on Nest's gateway plumbing.
 *
 * The stock WsAdapter dispatches on `{ event, data }`. TREK's client has always
 * sent `{ type: 'join', tripId }` and expects `{ type: 'joined' }` back, and
 * changing that would break every deployed client and every offline queue that
 * has a frame parked in it. So the adapter translates: `type` names the handler,
 * and the whole message is the payload.
 *
 * It also owns two things the stock adapter has no concept of, both of which
 * predate this migration and neither of which may be dropped:
 *
 * - The origin check. `verifyClient` rejects a cross-origin upgrade with 403
 *   before a socket exists, which is cheaper and stricter than checking after.
 * - The per-socket `error` listener, attached FIRST. `ws` surfaces protocol
 *   violations (malformed frames, reserved close codes such as 1006) as an
 *   `error` event on the socket; unhandled, Node rethrows it and the process
 *   dies. That is #1576, and it only reproduces against a hostile client, so
 *   nothing in CI would catch its removal.
 *
 * All three per-connection lifecycle hooks the base adapter offers —
 * `bindClientConnect` (`OnGatewayConnection`), `bindMessageHandlers`
 * (`@SubscribeMessage`) and `bindClientDisconnect` (`OnGatewayDisconnect`) —
 * are overridden here to run their callback inside `withRequestContext`
 * (D6): none of the three has an HTTP request behind it, so none gets a
 * forked EntityManager unless this adapter forks one itself. `create`
 * above and `close` below are the only other overrides, and neither
 * dispatches into gateway/handler code, so neither needs the wrap.
 */
export class TrekWsAdapter extends WsAdapter {
  private readonly httpServerRef: HttpServer;

  /**
   * Takes the http.Server directly, not the app.
   *
   * The base adapter accepts either, but only the server form guarantees the ws
   * server lands on the socket this process actually listens on. Given the app,
   * it would reach for Nest's own internal server, which buildApp never uses.
   */
  constructor(
    httpServer: HttpServer,
    // D6 (task-2-review.md's controller ruling): a WS message handler has no HTTP
    // request behind it, so every `@SubscribeMessage` dispatch is wrapped here —
    // ONE wrapper at bindMessageHandlers below, not one per handler. Optional at
    // the type level only for hand-built test doubles — bootstrap.ts always
    // passes the real MikroORM, and any double that dispatches a matched
    // message through bindMessageHandlers (task-6-fix-brief.md item 1) must
    // pass one too, or the dispatch throws rather than running unwrapped.
    private readonly orm?: { em: EntityManager },
  ) {
    super(httpServer as unknown as INestApplicationContext);
    this.httpServerRef = httpServer;
  }

  /**
   * Builds the ws server directly rather than delegating to the base.
   *
   * The base's port-0 branch creates it with `noServer: true` and performs the
   * upgrade itself from its own registry. That path never consults
   * `verifyClient`, because ws only calls it when ws owns the upgrade — so
   * delegating would silently drop the origin check and answer 101 to any
   * origin. Attaching to the http server keeps ws in charge of the handshake,
   * which is where the 403 has always come from.
   */
  create(_port: number, options?: Record<string, unknown>): unknown {
    const allowedOrigins = readEnv().http.wsOrigins;
    const server = new WebSocketServer({
      server: this.httpServerRef,
      path: (options?.path as string) ?? '/ws',
      maxPayload: 64 * 1024, // 64 KB max message size
      ...(allowedOrigins
        ? {
            verifyClient: (
              { origin, req }: { origin: string; req: IncomingMessage },
              cb: (ok: boolean, code?: number, msg?: string) => void,
            ) => {
              // Same rule as the REST CORS check (#2543): the instance's own host
              // is never cross-origin, whatever ALLOWED_ORIGINS lists.
              if (!origin || allowedOrigins.includes(origin) || isSameHostOrigin(origin, req?.headers.host)) cb(true);
              else cb(false, 403, 'Origin not allowed');
            },
          }
        : {}),
    });

    // A server-level error is LOGGED, never swallowed.
    //
    // ws hangs its own `error: this.emit.bind(this, 'error')` on the http server
    // (websocket-server.js), so from the moment this runs the http server has a
    // listener and Node will not throw on one. Everything it forwards lands
    // here. An empty handler therefore eats the http server's failures too,
    // including EADDRINUSE at listen() — the process would stay up, serving
    // nothing, with no output at all. index.ts owns the fatal decision for bind
    // failures; this one keeps the transport's own errors visible.
    server.on('error', (err) => logError(`ws server error: ${err instanceof Error ? err.message : String(err)}`));

    // The fan-out primitives reach the live server through here, and so does
    // every out-of-container RealtimeService the test harnesses build.
    setServer(server);
    return server;
  }

  bindClientConnect(server: WebSocketServer, callback: (...args: unknown[]) => void): void {
    server.on('connection', (socket: TrekWebSocket, request: unknown) => {
      // Must stay above anything that can close early: a socket that never gets
      // this listener can still crash the process while it finishes closing.
      socket.on('error', () => socket.terminate());
      // D6 (Plan 3b Task 0): this dispatches Nest's OnGatewayConnection hook
      // (RealtimeGateway.handleConnection) exactly the way bindMessageHandlers
      // below dispatches a @SubscribeMessage handler — no HTTP request behind
      // it, so nothing forks an EntityManager for it unless this ONE wrapper
      // does. Confirmed unwrapped before this change (WSAD-050): a repository
      // read during the handshake threw cannotUseGlobalContext. Same
      // fail-closed shape as bindMessageHandlers: throw before calling rather
      // than run the connection handler unwrapped.
      if (!this.orm) {
        throw new Error('TrekWsAdapter: no MikroORM available to build a request context for this connection');
      }
      // The request rides along: the handshake reads the ws token off its query
      // string, so dropping it here would leave handleConnection with nothing
      // to authenticate.
      //
      // `handleConnection` is async and this listener is not — a rejection
      // inside it (or inside `withRequestContext` itself) would otherwise be
      // an unhandled rejection (T1-F7b; `applyPlatformUploads`'s `.catch(next)`
      // in `platform.routes.ts` is the sibling pattern for the pre-init HTTP
      // path). Logged through the adapter's own error path, not thrown —
      // there is no request/response here to propagate a failure to.
      Promise.resolve(withRequestContext(this.orm, () => callback(socket, request))).catch((err: unknown) =>
        logError(`ws connection handler error: ${err instanceof Error ? err.message : String(err)}`),
      );
    });
  }

  /**
   * Dispatches Nest's `OnGatewayDisconnect` hook (`RealtimeGateway.handleDisconnect`)
   * the same way `bindClientConnect` above dispatches `OnGatewayConnection` —
   * the base `WsAdapter.bindClientDisconnect` just does `client.on(CLOSE_EVENT,
   * callback)` with no context of any kind. `handleDisconnect` reads no
   * repository today (Task 0 review addendum, LOW item 2), but it is a
   * lifecycle hook with no HTTP request behind it exactly like the connect and
   * message hooks are, so it gets the same wrap NOW rather than becoming the
   * next "the adapter is done" surprise the moment a future change makes it
   * read one. Same fail-closed shape as the other two: throw before calling.
   */
  bindClientDisconnect(client: TrekWebSocket, callback: (...args: unknown[]) => void): void {
    client.on('close', (...args: unknown[]) => {
      if (!this.orm) {
        throw new Error('TrekWsAdapter: no MikroORM available to build a request context for this disconnect');
      }
      // Same T1-F7b shape as bindClientConnect above — handleDisconnect is
      // async and this listener is not, so an unhandled rejection here would
      // otherwise be silent.
      Promise.resolve(withRequestContext(this.orm, () => callback(...args))).catch((err: unknown) =>
        logError(`ws disconnect handler error: ${err instanceof Error ? err.message : String(err)}`),
      );
    });
  }

  bindMessageHandlers(
    socket: TrekWebSocket,
    handlers: MessageMappingProperties[],
    transform: (data: unknown) => Observable<unknown>,
  ): void {
    socket.on('message', (buffer: Buffer) => {
      const tooLoud = () => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }));
        }
      };

      // The outer ceiling, before parsing: this is what stops a client flooding
      // the process, and it counts every frame no matter what is in it.
      if (!withinBurst(socket)) return tooLoud();

      let message: { type?: unknown } | null = null;
      try {
        const parsed = JSON.parse(buffer.toString());
        if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') message = parsed;
      } catch {
        // Malformed JSON. Still counted below, exactly as before.
      }

      /*
       * The tighter limit, on everything a pointer is not — malformed JSON and
       * unknown types included, which is the point of counting them here rather
       * than only counting what reaches a handler.
       *
       * Parsing first costs a JSON.parse on a small frame that the ceiling
       * above has already let through. That is the price of telling a pointer
       * from everything else, and it buys the tight limit staying exactly as
       * tight as it was for every other frame.
       */
      if (message?.type !== HIGH_RATE_TYPE && !withinRate(socket)) return tooLoud();
      if (!message) return;

      const handler = handlers.find((h) => h.message === message.type);
      if (!handler) return; // An unknown type is ignored, not an error frame.

      // The whole message is the payload: TREK's frames are flat, so `tripId`
      // sits beside `type` rather than under a `data` key.
      //
      // The context has to wrap the CALL, not just the subscribe(): an async
      // handler's body runs synchronously up to its first await the instant it is
      // invoked (before transform()/subscribe() ever run), and RequestContext.create
      // is AsyncLocalStorage.run — it only covers what executes inside this
      // synchronous frame, after which the async chain carries it on its own.
      //
      // Fail closed (task-6-fix-brief.md item 1): a missing `orm` used to fall
      // through to an unwrapped call — silent degrade. `bootstrap.ts` always
      // passes the real MikroORM, so this only ever throws in a hand-built
      // test double that dispatches through bindMessageHandlers without one;
      // that double now passes an ORM from `sharedTestOrm`.
      if (!this.orm) {
        throw new Error('TrekWsAdapter: no MikroORM available to build a request context for this message handler');
      }
      const result = withRequestContext(this.orm, () => handler.callback(message, socket));
      transform(result).subscribe({
        next: (response) => {
          if (response !== undefined && socket.readyState === 1) {
            socket.send(JSON.stringify(response));
          }
        },
      });
    });
  }

  async close(server: WebSocketServer): Promise<void> {
    setServer(null);
    await super.close(server);
  }
}
