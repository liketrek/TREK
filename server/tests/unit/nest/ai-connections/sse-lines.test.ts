/**
 * readSseEvents: the event-stream reader every chat adapter streams through,
 * with its limits on line length, total size and silence.
 */
import { AiProviderError } from '../../../../src/nest/ai-connections/providers/provider-errors';
import { readSseEvents, type SseEvent } from '../../../../src/nest/ai-connections/providers/sse-lines';

import { describe, expect, it } from 'vitest';

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>, options?: Parameters<typeof readSseEvents>[1]) {
  const events: SseEvent[] = [];
  for await (const event of readSseEvents(stream, options)) events.push(event);
  return events;
}

describe('readSseEvents', () => {
  it('SSE-001: reads data and event fields, joins multi-line data and skips comments', async () => {
    const events = await collect(
      streamOf([': keepalive\n\n', 'event: ping\ndata: {"a":1}\n\n', 'data: one\ndata: two\nid: 3\n\n']),
    );
    expect(events).toEqual([{ event: 'ping', data: '{"a":1}' }, { data: 'one\ntwo' }]);
  });

  it('SSE-002: an event cut across chunks, CRLF endings and a multi-byte character split in two still read whole', async () => {
    const bytes = new TextEncoder().encode('data: Kyōto\r\n\r\n');
    const split = bytes.indexOf(0xc5) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 4));
        controller.enqueue(bytes.subarray(4, split));
        controller.enqueue(bytes.subarray(split));
        controller.close();
      },
    });
    expect(await collect(stream)).toEqual([{ data: 'Kyōto' }]);
  });

  it('SSE-003: a stream that ends without the final blank line still yields its last event', async () => {
    expect(await collect(streamOf(['data: [DONE]']))).toEqual([{ data: '[DONE]' }]);
  });

  it('SSE-004: a line longer than the limit ends the stream as provider_unavailable', async () => {
    const err = await collect(streamOf([`data: ${'x'.repeat(64)}`]), { maxLineBytes: 32 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AiProviderError);
    expect(err).toMatchObject({ code: 'provider_unavailable', providerCode: 'stream_line_too_long' });
  });

  it('SSE-005: a body larger than the limit ends the stream', async () => {
    const err = await collect(streamOf(['data: a\n\n', 'data: b\n\n']), { maxTotalBytes: 12 }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: 'provider_unavailable', providerCode: 'stream_too_large' });
  });

  it('SSE-006: a stream that goes silent ends after the idle limit', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: first\n\n'));
      },
    });
    const seen: SseEvent[] = [];
    const err = await (async () => {
      for await (const event of readSseEvents(stream, { idleMs: 20 })) seen.push(event);
    })().catch((e: unknown) => e);
    expect(seen).toEqual([{ data: 'first' }]);
    expect(err).toMatchObject({ code: 'provider_unavailable', providerCode: 'stream_idle', retryable: true });
  });
});
