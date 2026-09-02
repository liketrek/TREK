import type { Server as HttpServer } from 'node:http';

/**
 * A ws client, as much of one as the shutdown sequence needs.
 *
 * Typed structurally rather than as `ws`'s WebSocket so the sequence can be
 * tested with plain objects — the point of this module is that the thing that
 * kept #2193 alive is finally reachable from a test.
 */
export interface ClosableSocket {
  close(code: number, reason: string): void;
  terminate(): void;
}

/** Everything a shutdown touches, handed in rather than imported. */
export interface ShutdownDeps {
  /**
   * The http.Server this process listens on (bootstrap's, via getHttpServer).
   *
   * Undefined when the signal beats the bootstrap — an orchestrator that stops a
   * container mid-boot, which is exactly the kind of deployment #2193 came from.
   * There is nothing to drain in that case, and the shutdown must still reach
   * process.exit rather than throwing into a fire-and-forget promise.
   */
  server: Pick<HttpServer, 'close' | 'closeIdleConnections' | 'closeAllConnections'> | undefined;
  /** Runs every onModuleDestroy hook — crons, plugin supervisor, ws adapter. */
  closeNestApp: () => Promise<void>;
  /** The live ws clients, or null once the adapter has torn the server down. */
  getWsClients: () => Iterable<ClosableSocket> | null;
  closeMcpSessions: () => void;
  closeDb: () => void;
  logInfo: (message: string) => void;
  logError: (message: string) => void;
  exit: (code: number) => void;
  /** How long a socket may take the polite way out before it is destroyed. */
  drainMs?: number;
  /** Last-resort exit, deliberately below Docker's 10s stop grace. */
  forcedMs?: number;
}

/**
 * How long a client gets to answer the closing handshake before its socket is
 * destroyed. Long enough for a browser on a bad connection to reply, short
 * enough to leave the forced exit below plenty of room.
 */
export const SOCKET_DRAIN_MS = 2_000;

/**
 * The fallback exit, at half of Docker's default 10s stop grace.
 *
 * The old value was exactly 10_000 — the same moment Docker sends SIGKILL.
 * Docker starts counting when it sends the signal and Node only once the
 * handler is dispatched, so that timer started strictly later and could never
 * win. It was unreachable code in every default deployment, which is why #2193
 * saw exit 137 rather than "Forced shutdown after timeout".
 */
export const FORCED_EXIT_MS = 5_000;

/**
 * Shut the process down in the order the runtime actually requires.
 *
 * #2193: every `docker stop` of a TREK instance with a browser attached ended
 * in SIGKILL and exit 137. `http.Server.close()` stops NEW connections and then
 * waits for the open ones to end by themselves — and a WebSocket never does.
 * Node's own `closeAllConnections()` does not help either: an upgraded socket
 * is no longer the http server's to destroy. So the close callback stayed
 * pending forever, `closeDb()` (which lived inside it) never ran, and the only
 * remaining exit was a timer set to the very second Docker fires SIGKILL.
 *
 * Waiting for Nest to do it does not work either: `WsAdapter.close()` is the
 * one place that terminates clients, and Nest reaches it only after every
 * `onModuleDestroy` hook has resolved — including the plugin supervisor's own
 * SIGTERM grace for its forked children. The sockets holding the server open
 * would be hostage to the slowest hook in the container.
 *
 * Hence this order, and it is the whole fix:
 *
 *  1. ws clients get 1001 "going away" first, so a browser sees a real close
 *     frame and reconnects the quiet way. The client ignores the code and
 *     reconnects on any close (client/src/api/websocket.ts), so this is a
 *     nicety, not a contract change.
 *  2. `closeIdleConnections()` drops keep-alive sockets parked between
 *     requests — a reverse proxy always holds a few.
 *  3. After `drainMs`, anything still attached is destroyed: `terminate()` for
 *     the ws clients that never answered the handshake, `closeAllConnections()`
 *     for requests still in flight. A shutdown that waits on an unbounded
 *     upload is the same hang somewhere else.
 *
 * Nest is closed alongside that, and the DB is closed exactly once on BOTH exit
 * paths rather than only on the one that used to be unreachable.
 */
export async function runShutdown(signal: string, deps: ShutdownDeps): Promise<void> {
  const {
    server, closeNestApp, getWsClients, closeMcpSessions, closeDb,
    logInfo, logError, exit,
    drainMs = SOCKET_DRAIN_MS, forcedMs = FORCED_EXIT_MS,
  } = deps;

  logInfo(`${signal} received — shutting down gracefully...`);

  const guard = (what: string, fn: () => void): void => {
    try {
      fn();
    } catch (err) {
      // One step failing must not strand the process in a half-shutdown: log it
      // and carry on to the next, because the alternative is the SIGKILL again.
      logError(`${what} failed during shutdown: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  let finished = false;
  /** The single exit path, so the DB is closed exactly once and never skipped. */
  const finish = (code: number, message: string): void => {
    if (finished) return;
    finished = true;
    // WAL-mode SQLite recovers on the next boot, so a DB that refuses to close
    // is worth a line in the log and nothing more — never a reason to hang.
    guard('closeDb', closeDb);
    logInfo(message);
    exit(code);
  };

  // Armed first, so a hang anywhere below still ends in OUR exit rather than in
  // Docker's SIGKILL. unref'd: it must never be why the loop stays alive.
  const forced = setTimeout(() => {
    logError('Forced shutdown after timeout');
    finish(1, 'Shutdown complete (forced)');
  }, forcedMs);
  forced.unref?.();

  guard('closeMcpSessions', closeMcpSessions);

  // Before Nest closes: its adapter's close() drops the server reference, and
  // after that there is nothing left to say goodbye to.
  const clients: ClosableSocket[] = [];
  guard('ws teardown', () => {
    for (const client of getWsClients() ?? []) clients.push(client);
  });
  for (const client of clients) {
    guard('ws close', () => client.close(1001, 'Server shutting down'));
  }

  const httpClosed = server
    ? new Promise<void>((resolve) => {
        server.close(() => {
          logInfo('HTTP server closed');
          resolve();
        });
      })
    : Promise.resolve();
  if (server) guard('closeIdleConnections', () => server.closeIdleConnections());

  const drain = setTimeout(() => {
    // Whatever is still holding the server open at this point is not going to
    // let go on its own.
    for (const client of clients) guard('ws terminate', () => client.terminate());
    if (server) guard('closeAllConnections', () => server.closeAllConnections());
  }, drainMs);
  drain.unref?.();

  const [, nestResult] = await Promise.allSettled([httpClosed, closeNestApp()]);
  // allSettled never rejects, so a throwing onModuleDestroy would otherwise
  // vanish and the process would report a clean exit while the crons and the
  // plugin children were never torn down. This bug class is diagnosed from
  // container logs; that is the one line worth having.
  if (nestResult.status === 'rejected') {
    const err: unknown = nestResult.reason;
    logError(`nest shutdown failed during shutdown: ${err instanceof Error ? err.message : String(err)}`);
  }
  clearTimeout(drain);
  clearTimeout(forced);
  finish(0, 'Shutdown complete');
}
