import { WsAdapter } from '@nestjs/platform-ws';
import type { INestApplicationContext } from '@nestjs/common';
import type { Server as HttpServer } from 'node:http';
import type { MessageMappingProperties } from '@nestjs/websockets';
import { WebSocketServer } from 'ws';
import type { Observable } from 'rxjs';
import { readEnv } from '../../app-config';
import { setServer, type TrekWebSocket } from './ws-state';

// Per-connection message rate limiting. It lives in the adapter, not in the
// gateway's handlers, because the original counted EVERY inbound frame before
// parsing it: malformed JSON and unknown types count too. Counting only the
// frames that reach a @SubscribeMessage handler would leave a client free to
// flood the process with garbage.
const WS_MSG_LIMIT = 30; // max messages
const WS_MSG_WINDOW = 10_000; // per 10 seconds
const rates = new WeakMap<TrekWebSocket, { count: number; windowStart: number }>();

function withinRate(socket: TrekWebSocket): boolean {
  let rate = rates.get(socket);
  if (!rate) {
    rate = { count: 0, windowStart: Date.now() };
    rates.set(socket, rate);
  }
  const now = Date.now();
  if (now - rate.windowStart > WS_MSG_WINDOW) {
    rate.count = 1;
    rate.windowStart = now;
    return true;
  }
  rate.count++;
  return rate.count <= WS_MSG_LIMIT;
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
  constructor(httpServer: HttpServer) {
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
              { origin }: { origin: string },
              cb: (ok: boolean, code?: number, msg?: string) => void,
            ) => {
              if (!origin || allowedOrigins.includes(origin)) cb(true);
              else cb(false, 403, 'Origin not allowed');
            },
          }
        : {}),
    });

    // A server-level error must not reach the process. The base binds one on the
    // instances it creates; this one is ours, so it needs its own.
    server.on('error', () => {});

    // The fan-out primitives reach the live server through here, and so do the
    // out-of-container bridges.
    setServer(server);
    return server;
  }

  bindClientConnect(server: WebSocketServer, callback: (...args: unknown[]) => void): void {
    server.on('connection', (socket: TrekWebSocket, request: unknown) => {
      // Must stay above anything that can close early: a socket that never gets
      // this listener can still crash the process while it finishes closing.
      socket.on('error', () => socket.terminate());
      // The request rides along: the handshake reads the ws token off its query
      // string, so dropping it here would leave handleConnection with nothing
      // to authenticate.
      callback(socket, request);
    });
  }

  bindMessageHandlers(
    socket: TrekWebSocket,
    handlers: MessageMappingProperties[],
    transform: (data: unknown) => Observable<unknown>,
  ): void {
    socket.on('message', (buffer: Buffer) => {
      if (!withinRate(socket)) {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }));
        }
        return;
      }

      let message: { type?: unknown };
      try {
        message = JSON.parse(buffer.toString());
      } catch {
        return; // Malformed JSON, ignored exactly as before.
      }
      if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;

      const handler = handlers.find((h) => h.message === message.type);
      if (!handler) return; // An unknown type is ignored, not an error frame.

      // The whole message is the payload: TREK's frames are flat, so `tripId`
      // sits beside `type` rather than under a `data` key.
      transform(handler.callback(message, socket)).subscribe({
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
