/**
 * Graceful shutdown sequence (#2193).
 *
 * The reported symptom was a container that exited 137 exactly ten seconds
 * after every `docker stop`. The cause was that nothing in the shutdown path
 * could release a WebSocket: `http.Server.close()` waits for open connections
 * and an upgraded socket never ends on its own, so the close callback — which
 * is where `closeDb()` and `process.exit(0)` lived — never ran, and the only
 * remaining exit was a fallback timer set to the very second Docker sends
 * SIGKILL.
 *
 * These tests pin the three things that fix required: the sockets are actively
 * released, the database is closed on BOTH exit paths, and the fallback timer
 * fires inside Docker's 10s grace rather than on top of it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runShutdown, SOCKET_DRAIN_MS, FORCED_EXIT_MS } from '../../src/shutdown';

type Deps = Parameters<typeof runShutdown>[1];

function makeSocket() {
  return { close: vi.fn(), terminate: vi.fn() };
}

/**
 * A server whose close callback only fires once told to — the whole point is
 * that the real one does not fire while a socket is still attached.
 */
function makeServer() {
  let done: (() => void) | undefined;
  return {
    close: vi.fn((cb: () => void) => { done = cb; }),
    closeIdleConnections: vi.fn(),
    closeAllConnections: vi.fn(),
    /** Stand-in for the last connection going away. */
    finishClose: () => done?.(),
  };
}

function makeDeps(over: Partial<Deps> = {}): Deps & { exit: ReturnType<typeof vi.fn>; closeDb: ReturnType<typeof vi.fn> } {
  const server = makeServer();
  return {
    server: server as unknown as Deps['server'],
    closeNestApp: vi.fn(async () => {}),
    getWsClients: () => null,
    closeMcpSessions: vi.fn(),
    closeDb: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
    exit: vi.fn(),
    ...over,
  } as never;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('runShutdown', () => {
  it('SHUTDOWN-001 asks every ws client to go away before Nest tears the adapter down', async () => {
    const a = makeSocket();
    const b = makeSocket();
    const order: string[] = [];
    const deps = makeDeps({
      getWsClients: () => { order.push('ws'); return [a, b]; },
      closeNestApp: vi.fn(async () => { order.push('nest'); }),
    });

    const run = runShutdown('SIGTERM', deps);
    (deps.server as unknown as ReturnType<typeof makeServer>).finishClose();
    await run;

    expect(a.close).toHaveBeenCalledWith(1001, 'Server shutting down');
    expect(b.close).toHaveBeenCalledWith(1001, 'Server shutting down');
    // The adapter's own close() drops the server reference, so the clients have
    // to be collected before Nest gets a chance to run.
    expect(order).toEqual(['ws', 'nest']);
  });

  it('SHUTDOWN-002 drops idle keep-alive sockets immediately', async () => {
    const deps = makeDeps();
    const server = deps.server as unknown as ReturnType<typeof makeServer>;

    const run = runShutdown('SIGTERM', deps);
    expect(server.closeIdleConnections).toHaveBeenCalled();
    // Nothing is destroyed yet — an in-flight request still has its drain window.
    expect(server.closeAllConnections).not.toHaveBeenCalled();

    server.finishClose();
    await run;
  });

  it('SHUTDOWN-003 destroys whatever is still attached after the drain window', async () => {
    const socket = makeSocket();
    const deps = makeDeps({ getWsClients: () => [socket] });
    const server = deps.server as unknown as ReturnType<typeof makeServer>;

    // Never resolves on its own: this is the hang #2193 died on.
    runShutdown('SIGTERM', deps);
    await vi.advanceTimersByTimeAsync(SOCKET_DRAIN_MS);

    expect(socket.terminate).toHaveBeenCalled();
    expect(server.closeAllConnections).toHaveBeenCalled();
  });

  it('SHUTDOWN-004 closes the database and exits 0 once the server is down', async () => {
    const deps = makeDeps();
    const run = runShutdown('SIGTERM', deps);
    (deps.server as unknown as ReturnType<typeof makeServer>).finishClose();
    await run;

    expect(deps.closeDb).toHaveBeenCalledTimes(1);
    expect(deps.exit).toHaveBeenCalledWith(0);
  });

  it('SHUTDOWN-005 still closes the database when it has to force the exit', async () => {
    // The close callback never fires — exactly the case that used to leave the
    // WAL behind for boot-time recovery on every restart.
    const deps = makeDeps({ closeNestApp: vi.fn(() => new Promise<void>(() => {})) });

    runShutdown('SIGTERM', deps);
    await vi.advanceTimersByTimeAsync(FORCED_EXIT_MS);

    expect(deps.closeDb).toHaveBeenCalledTimes(1);
    expect(deps.exit).toHaveBeenCalledWith(1);
  });

  it('SHUTDOWN-006 forces the exit inside Docker default 10s stop grace', () => {
    // The old value was exactly 10_000 — the same moment Docker sends SIGKILL,
    // and since Docker starts counting first that timer could never win.
    expect(FORCED_EXIT_MS).toBeLessThan(10_000);
    expect(SOCKET_DRAIN_MS).toBeLessThan(FORCED_EXIT_MS);
  });

  it('SHUTDOWN-007 exits once even if the forced timer and the clean path race', async () => {
    const deps = makeDeps();
    const run = runShutdown('SIGTERM', deps);
    (deps.server as unknown as ReturnType<typeof makeServer>).finishClose();
    await run;
    await vi.advanceTimersByTimeAsync(FORCED_EXIT_MS * 2);

    expect(deps.exit).toHaveBeenCalledTimes(1);
    expect(deps.closeDb).toHaveBeenCalledTimes(1);
  });

  it('SHUTDOWN-009 still exits when the signal beats the bootstrap', async () => {
    // An orchestrator stopping a container mid-boot: there is no http server yet.
    // The old path called server.close() on undefined, and the fire-and-forget
    // promise turned that into an unhandled rejection instead of an exit.
    const deps = makeDeps({ server: undefined as never });

    await runShutdown('SIGTERM', deps);

    expect(deps.closeDb).toHaveBeenCalledTimes(1);
    expect(deps.exit).toHaveBeenCalledWith(0);
  });

  it('SHUTDOWN-008 carries on when a teardown step throws', async () => {
    const deps = makeDeps({
      closeMcpSessions: vi.fn(() => { throw new Error('mcp boom'); }),
      getWsClients: () => { throw new Error('ws boom'); },
    });

    const run = runShutdown('SIGTERM', deps);
    (deps.server as unknown as ReturnType<typeof makeServer>).finishClose();
    await run;

    // A failing step is logged, never a reason to strand the process.
    expect(deps.logError).toHaveBeenCalled();
    expect(deps.exit).toHaveBeenCalledWith(0);
  });
});
