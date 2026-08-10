import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import { WebSocketServer } from 'ws';

/**
 * A bind failure must stay loud after the ws server moved in front of listen().
 *
 * `ws` registers `error: this.emit.bind(this, 'error')` on the http server it
 * attaches to (websocket-server.js). Since buildApp now creates the ws server
 * BEFORE index.ts calls listen(), the http server already has an error listener
 * by the time the bind is attempted — which is exactly the condition under which
 * Node stops throwing on an unhandled one.
 *
 * The failure that hides behind that is not subtle: EADDRINUSE gets forwarded to
 * the WebSocketServer, and if its handler is a no-op the process survives, the
 * listen callback never runs, so the startup banner never prints and the
 * scheduler never starts. A container that looks healthy and serves nothing.
 *
 * These cases pin the mechanism rather than index.ts itself, because the module
 * calls process.exit and boots the whole app on import.
 */
async function occupyAPort(): Promise<{ port: number; release: () => void }> {
  const blocker = http.createServer();
  await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const { port } = blocker.address() as { port: number };
  return { port, release: () => blocker.close() };
}

describe('ws attached before listen()', () => {
  it('WSBIND-001: ws silences the http server, so a no-op handler loses EADDRINUSE entirely', async () => {
    const { port, release } = await occupyAPort();
    try {
      const server = http.createServer();
      const wss = new WebSocketServer({ server, path: '/ws' });
      const swallowed = vi.fn();
      wss.on('error', swallowed); // the shape this used to have

      let listenCallbackRan = false;
      server.listen(port, '127.0.0.1', () => { listenCallbackRan = true; });
      await new Promise((r) => setTimeout(r, 300));

      // The bind failed, and the only thing that heard about it was the ws
      // handler. Nothing threw, nothing exited.
      expect(swallowed).toHaveBeenCalledTimes(1);
      expect((swallowed.mock.calls[0][0] as NodeJS.ErrnoException).code).toBe('EADDRINUSE');
      expect(listenCallbackRan).toBe(false);

      wss.close();
      server.close();
    } finally {
      release();
    }
  });

  it('WSBIND-002: an explicit http-server error handler is what makes it fatal again', async () => {
    const { port, release } = await occupyAPort();
    try {
      const server = http.createServer();
      const wss = new WebSocketServer({ server, path: '/ws' });
      wss.on('error', () => {});

      // What index.ts registers. It has to sit on the HTTP server: by the time
      // ws re-emits, the process has already declined to throw.
      const fatal = vi.fn();
      server.on('error', fatal);

      server.listen(port, '127.0.0.1', () => {});
      await new Promise((r) => setTimeout(r, 300));

      expect(fatal).toHaveBeenCalledTimes(1);
      expect((fatal.mock.calls[0][0] as NodeJS.ErrnoException).code).toBe('EADDRINUSE');

      wss.close();
      server.close();
    } finally {
      release();
    }
  });
});
