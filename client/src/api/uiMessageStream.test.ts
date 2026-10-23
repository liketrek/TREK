/**
 * FE-AI-STREAM-001 to FE-AI-STREAM-011
 *
 * The parser reads the server's assistant stream, so its contract is the
 * shared fixture: the same file the server's writer is tested against. What
 * the network does to that stream (cutting it at any byte, CRLF from a proxy,
 * keep-alive comments) must not change what comes out.
 */
import { uiStreamChunkSchema, type UiStreamChunk } from '@trek/shared';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { MAX_EVENT_CHARS, parseUiMessageStream, STALL_MS } from './uiMessageStream';

const FIXTURE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../shared/src/assistant/__fixtures__/ui-stream.v1.txt'),
  'utf8'
);

/** A response body that hands out the given pieces one read at a time. */
function bodyOf(pieces: (string | Uint8Array)[]) {
  const encoder = new TextEncoder();
  let i = 0;
  const cancel = vi.fn(async () => {});
  const body = {
    getReader: () => ({
      read: async () => {
        if (i >= pieces.length) return { done: true, value: undefined };
        const piece = pieces[i++];
        return { done: false, value: typeof piece === 'string' ? encoder.encode(piece) : piece };
      },
      cancel,
    }),
  } as unknown as ReadableStream<Uint8Array>;
  return { body, cancel };
}

async function collect(body: ReadableStream<Uint8Array>): Promise<UiStreamChunk[]> {
  const chunks: UiStreamChunk[] = [];
  for await (const chunk of parseUiMessageStream(body)) chunks.push(chunk);
  return chunks;
}

/** The fixture's chunks as plain JSON, the way a reader of the file sees them. */
function fixtureChunks(): UiStreamChunk[] {
  return FIXTURE.split('\n\n')
    .map((event) => event.replace(/^data: /, '').trim())
    .filter((data) => data && data !== '[DONE]')
    .map((data) => uiStreamChunkSchema.parse(JSON.parse(data)));
}

describe('parseUiMessageStream', () => {
  it('FE-AI-STREAM-001: reads the shared fixture into its chunks, in order', async () => {
    const chunks = await collect(bodyOf([FIXTURE]).body);
    expect(chunks).toEqual(fixtureChunks());
    expect(chunks.map((c) => c.type)).toContain('tool-approval-request');
    expect(chunks[chunks.length - 1]).toEqual({ type: 'finish', finishReason: 'tool-calls' });
  });

  it('FE-AI-STREAM-002: gives the same chunks when every byte arrives in its own read', async () => {
    const bytes = new TextEncoder().encode(FIXTURE);
    const pieces = Array.from(bytes, (b) => new Uint8Array([b]));
    expect(await collect(bodyOf(pieces).body)).toEqual(fixtureChunks());
  });

  it('FE-AI-STREAM-003: reads CRLF line ends, also when a CR and its LF arrive apart', async () => {
    const crlf = FIXTURE.replace(/\n/g, '\r\n');
    const cut = crlf.indexOf('\r\n') + 1;
    expect(await collect(bodyOf([crlf.slice(0, cut), crlf.slice(cut)]).body)).toEqual(fixtureChunks());
  });

  it('FE-AI-STREAM-004: skips keep-alive comments and fields other than data', async () => {
    const stream = [
      ': keepalive\n\n',
      'event: message\nid: 1\ndata: {"type":"start-step"}\n\n',
      ': keepalive\n\n',
      'data: [DONE]\n\n',
    ].join('');
    expect(await collect(bodyOf([stream]).body)).toEqual([{ type: 'start-step' }]);
  });

  it('FE-AI-STREAM-005: skips chunk types this client does not know, and torn JSON', async () => {
    const stream = [
      'data: {"type":"reasoning-delta","delta":"hm"}\n\n',
      'data: {"type":"text-delta","id":"t"\n\n',
      'data: {"type":"text-delta","id":"t","delta":"ok"}\n\n',
      'data: [DONE]\n\n',
    ].join('');
    expect(await collect(bodyOf([stream]).body)).toEqual([{ type: 'text-delta', id: 't', delta: 'ok' }]);
  });

  it('FE-AI-STREAM-006: reads an unknown error code as generic', async () => {
    const stream = 'data: {"type":"error","errorText":"quota_exploded"}\n\ndata: [DONE]\n\n';
    expect(await collect(bodyOf([stream]).body)).toEqual([{ type: 'error', errorText: 'generic' }]);
  });

  it('FE-AI-STREAM-007: joins the lines of a multi-line data field', async () => {
    const stream = 'data: {"type":"text-delta",\ndata: "id":"t","delta":"x"}\n\ndata: [DONE]\n\n';
    expect(await collect(bodyOf([stream]).body)).toEqual([{ type: 'text-delta', id: 't', delta: 'x' }]);
  });

  it('FE-AI-STREAM-008: stops at [DONE] and lets go of the connection', async () => {
    const { body, cancel } = bodyOf([
      'data: {"type":"start-step"}\n\ndata: [DONE]\n\ndata: {"type":"finish-step"}\n\n',
    ]);
    expect(await collect(body)).toEqual([{ type: 'start-step' }]);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('FE-AI-STREAM-009: a stream that closes before [DONE] broke off, after the chunks it finished', async () => {
    const { body, cancel } = bodyOf(['data: {"type":"start-step"}\n\ndata: {"type":"finish-st']);
    const seen: UiStreamChunk[] = [];
    const read = async () => {
      for await (const chunk of parseUiMessageStream(body)) seen.push(chunk);
    };
    await expect(read()).rejects.toThrow('broke off');
    expect(seen).toEqual([{ type: 'start-step' }]);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('FE-AI-STREAM-011: a stream that stays silent past the stall limit fails and lets go', async () => {
    vi.useFakeTimers();
    try {
      const cancel = vi.fn(async () => {});
      const body = {
        getReader: () => ({ read: () => new Promise(() => {}), cancel }),
      } as unknown as ReadableStream<Uint8Array>;
      const failed = expect(collect(body)).rejects.toThrow('stalled');
      await vi.advanceTimersByTimeAsync(STALL_MS);
      await failed;
      expect(cancel).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-AI-STREAM-010: refuses an event past the size limit, and a consumer leaving early cancels the read', async () => {
    const huge = bodyOf([`data: ${'x'.repeat(MAX_EVENT_CHARS + 1)}`]);
    await expect(collect(huge.body)).rejects.toThrow('too large');
    expect(huge.cancel).toHaveBeenCalledTimes(1);

    const early = bodyOf([FIXTURE]);
    for await (const chunk of parseUiMessageStream(early.body)) {
      expect(chunk.type).toBe('start');
      break;
    }
    expect(early.cancel).toHaveBeenCalledTimes(1);
  });
});
