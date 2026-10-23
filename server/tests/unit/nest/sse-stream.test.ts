/**
 * The shared event-stream helpers: headers before the first byte (so the
 * compression middleware leaves the stream alone), writes dropped once the
 * stream ended, a keepalive while it is open, and the client's leaving told
 * apart from the response's own end.
 */
import { armKeepalive, onClientGone, openSseStream } from '../../../src/nest/common/sse-stream';

import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

class FakeResponse extends EventEmitter {
  writableEnded = false;
  destroyed = false;
  statusCode = 0;
  readonly written: string[] = [];
  readonly headers: Record<string, string> = {};
  flushed = false;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  flushHeaders(): void {
    this.flushed = true;
  }

  write(chunk: string): boolean {
    this.written.push(chunk);
    return true;
  }

  end(): void {
    this.writableEnded = true;
  }
}

const asResponse = (res: FakeResponse) => res as unknown as Response;

afterEach(() => {
  vi.useRealTimers();
});

describe('openSseStream', () => {
  it('SSE-001: sends the headers at once, then events and comments, and nothing after the end', () => {
    const res = new FakeResponse();
    const stream = openSseStream(asResponse(res));
    expect(res.statusCode).toBe(200);
    expect(res.flushed).toBe(true);
    expect(res.headers).toMatchObject({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
    stream.send('{"a":1}');
    stream.comment('keepalive');
    expect(stream.open).toBe(true);
    stream.end();
    stream.send('late');
    stream.end();
    expect(stream.open).toBe(false);
    expect(res.written).toEqual(['data: {"a":1}\n\n', ': keepalive\n\n']);
  });

  it('SSE-002: a destroyed socket takes no more writes', () => {
    const res = new FakeResponse();
    const stream = openSseStream(asResponse(res));
    res.destroyed = true;
    stream.send('x');
    expect(res.written).toEqual([]);
  });
});

describe('armKeepalive', () => {
  it('SSE-010: comments while open, stops on its own once the stream ended, or when told', () => {
    vi.useFakeTimers();
    const res = new FakeResponse();
    const stream = openSseStream(asResponse(res));
    armKeepalive(stream, 1_000);
    vi.advanceTimersByTime(2_500);
    expect(res.written).toEqual([': keepalive\n\n', ': keepalive\n\n']);
    stream.end();
    vi.advanceTimersByTime(5_000);
    expect(res.written).toHaveLength(2);

    const other = new FakeResponse();
    const stop = armKeepalive(openSseStream(asResponse(other)), 1_000);
    stop();
    vi.advanceTimersByTime(5_000);
    expect(other.written).toEqual([]);
  });
});

describe('onClientGone', () => {
  it('SSE-020: fires when the client leaves before the end, not after a finished response', () => {
    const left = new FakeResponse();
    const gone = vi.fn();
    onClientGone(asResponse(left), gone);
    left.emit('close');
    expect(gone).toHaveBeenCalledTimes(1);

    const finished = new FakeResponse();
    const notGone = vi.fn();
    onClientGone(asResponse(finished), notGone);
    finished.end();
    finished.emit('close');
    expect(notGone).not.toHaveBeenCalled();
  });
});
