import type { Response } from 'express';

/** How often an idle stream sends a comment, below the 60 s most reverse proxies wait for a byte. */
const SSE_KEEPALIVE_MS = 15_000;

/**
 * A server-sent event stream a handler writes through `@Res()`. Writes after
 * the stream ended, or after the client went away, are dropped: whoever
 * produces the events never has to ask first.
 */
export interface SseStream {
  /** One `data:` event. */
  send(data: string): void;
  /** One comment line, which a client ignores and a proxy counts as traffic. */
  comment(text: string): void;
  end(): void;
  readonly open: boolean;
}

/**
 * Opens `res` as an event stream: status and headers go out at once, so the
 * client sees the stream start before the first event. The content type is set
 * before anything is written, which is what keeps the compression middleware
 * from buffering it (its filter reads that header), and `X-Accel-Buffering`
 * does the same for nginx.
 */
export function openSseStream(res: Response): SseStream {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  const writable = () => !res.writableEnded && !res.destroyed;
  return {
    send(data) {
      if (writable()) res.write(`data: ${data}\n\n`);
    },
    comment(text) {
      if (writable()) res.write(`: ${text}\n\n`);
    },
    end() {
      if (writable()) res.end();
    },
    get open() {
      return writable();
    },
  };
}

/**
 * Sends a keepalive comment every `intervalMs` while the stream is open. The
 * answer stops it; it also stops on its own once the stream ended.
 */
export function armKeepalive(stream: SseStream, intervalMs = SSE_KEEPALIVE_MS): () => void {
  const timer = setInterval(() => {
    if (stream.open) stream.comment('keepalive');
    else clearInterval(timer);
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

/**
 * Calls `onGone` once if the client disconnects before the response ended.
 * The response's `close` is the signal, not the request's: on Node 22 the
 * request closes as soon as its body has been read, which is long before a
 * streamed answer is done.
 */
export function onClientGone(res: Response, onGone: () => void): void {
  res.once('close', () => {
    if (!res.writableEnded) onGone();
  });
}
