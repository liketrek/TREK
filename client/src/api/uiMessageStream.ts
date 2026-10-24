import { UI_STREAM_DONE, uiStreamChunkSchema, type UiStreamChunk } from '@trek/shared';

/**
 * Reads the assistant's server-sent events into typed chunks.
 *
 * The wire format is the `@trek/shared` stream contract: one `data: <json>`
 * event per chunk, closed by `data: [DONE]`. Our own parser rather than the
 * `assistant-stream` one, because that one drops `tool-approval-request`, the
 * chunk a held change hangs on, and it would pull the chat runtime into every
 * chunk that only needs the data layer.
 *
 * What it tolerates, because proxies and the network do these things: events
 * split across reads at any byte, CRLF line ends, `:` keep-alive comments,
 * and fields other than `data`. A chunk that does not match the contract,
 * a type this client does not know among them, is skipped, so the server can
 * add chunk types without breaking an older tab. An event longer than
 * MAX_EVENT_CHARS ends the stream with an error instead of growing the buffer
 * without bound.
 *
 * The server always closes with `[DONE]` and sends a keep-alive every 15
 * seconds, so a stream that ends without the marker, or stays silent for
 * STALL_MS, lost its server (a restart, a dropped proxy) and fails instead of
 * leaving the chat waiting for an answer that will not come.
 */

export const MAX_EVENT_CHARS = 1024 * 1024;
export const STALL_MS = 45_000;

/** The next read, or a failure once nothing came for STALL_MS. */
async function readOrStall(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Assistant stream stalled')), STALL_MS);
  });
  try {
    return await Promise.race([reader.read(), stalled]);
  } finally {
    clearTimeout(timer);
  }
}

export async function* parseUiMessageStream(body: ReadableStream<Uint8Array>): AsyncGenerator<UiStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await readOrStall(reader);
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      // A CR at the very end may be the first half of a CRLF; it waits for the next read.
      const carry = !done && buffer.endsWith('\r') ? '\r' : '';
      if (carry) buffer = buffer.slice(0, -1);
      buffer = buffer.replace(/\r\n?/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const data = dataOf(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (data === UI_STREAM_DONE) {
          finished = true;
          return;
        }
        const chunk = data === null ? null : chunkOf(data);
        if (chunk) yield chunk;
        boundary = buffer.indexOf('\n\n');
      }
      buffer += carry;

      if (buffer.length > MAX_EVENT_CHARS) throw new Error('Assistant stream event too large');
      // The connection closed before [DONE]: the server went away mid-answer.
      if (done) {
        finished = true;
        throw new Error('Assistant stream broke off');
      }
    }
  } finally {
    // Leaving early (the consumer stopped, or an error) releases the connection.
    if (!finished) {
      try {
        await reader.cancel();
      } catch {
        // The stream already failed; the error that brought us here is the one that counts.
      }
    }
  }
}

/** The joined `data` lines of one event, or null for an event without any (a comment). */
function dataOf(event: string): string | null {
  const lines: string[] = [];
  for (const line of event.split('\n')) {
    if (line === 'data' || line.startsWith('data:')) {
      const value = line.slice(5);
      lines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  }
  return lines.length ? lines.join('\n') : null;
}

function chunkOf(data: string): UiStreamChunk | null {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    // A torn or foreign event; the next one is still worth reading.
    return null;
  }
  const parsed = uiStreamChunkSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}
