import { AiProviderError } from './provider-errors';

/** One server-sent event: its `event:` name, if any, and its `data:` lines joined. */
export interface SseEvent {
  event?: string;
  data: string;
}

interface SseReadOptions {
  /** The longest line a provider may send (a tool call's arguments arrive in pieces, never in one line this long). */
  maxLineBytes?: number;
  /** The most bytes the whole stream may carry. */
  maxTotalBytes?: number;
  /** How long the stream may stay silent between two chunks. */
  idleMs?: number;
}

const DEFAULT_MAX_LINE_BYTES = 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const DEFAULT_IDLE_MS = 45_000;

type ReadResult = Awaited<ReturnType<ReadableStreamDefaultReader<Uint8Array>['read']>>;

/**
 * The events of a `text/event-stream` body, as they complete. Comment lines
 * (`: keepalive`) and fields other than `event` and `data` are skipped; CRLF
 * and LF both end a line. The body is read under three limits, each of which
 * ends the stream as `provider_unavailable`: a line longer than
 * `maxLineBytes`, a body larger than `maxTotalBytes`, and a pause longer than
 * `idleMs`. A stream that ends mid-event yields that event still, the way a
 * browser's EventSource does not, because the providers do close without a
 * final blank line.
 */
export async function* readSseEvents(
  body: ReadableStream<Uint8Array>,
  options: SseReadOptions = {},
): AsyncGenerator<SseEvent> {
  const maxLine = options.maxLineBytes ?? DEFAULT_MAX_LINE_BYTES;
  const maxTotal = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
  const decoder = new TextDecoder();
  let buffer = '';
  let total = 0;
  let event: string | undefined;
  let data: string[] = [];

  const readField = (line: string): void => {
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') data.push(value);
    else if (field === 'event') event = value;
  };

  const takeEvent = (): SseEvent | null => {
    const out = data.length > 0 ? { ...(event ? { event } : {}), data: data.join('\n') } : null;
    event = undefined;
    data = [];
    return out;
  };

  for await (const chunk of withIdleLimit(body, options.idleMs ?? DEFAULT_IDLE_MS)) {
    total += chunk.byteLength;
    if (total > maxTotal) throw new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_too_large');
    buffer += decoder.decode(chunk, { stream: true });

    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = withoutCr(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (line === '') {
        const complete = takeEvent();
        if (complete) yield complete;
      } else {
        readField(line);
      }
      newline = buffer.indexOf('\n');
    }
    if (Buffer.byteLength(buffer) > maxLine) {
      throw new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_line_too_long');
    }
  }
  buffer += decoder.decode();
  if (buffer) readField(withoutCr(buffer));
  const last = takeEvent();
  if (last) yield last;
}

function withoutCr(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

/**
 * The body as a stream that errors with `provider_unavailable` when no chunk
 * came within `idleMs`. Leaving it early, or failing, cancels the body, which
 * lets go of the connection.
 */
function withIdleLimit(body: ReadableStream<Uint8Array>, idleMs: number): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let chunk: ReadResult;
      try {
        chunk = await readWithin(reader, idleMs);
      } catch (err) {
        void reader.cancel().catch(() => {});
        throw err;
      }
      if (chunk.done) controller.close();
      else controller.enqueue(chunk.value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** The next chunk, or `provider_unavailable` when none came within `idleMs`. */
async function readWithin(reader: ReadableStreamDefaultReader<Uint8Array>, idleMs: number): Promise<ReadResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const idle = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_idle')),
      idleMs,
    );
  });
  try {
    return await Promise.race([reader.read(), idle]);
  } finally {
    clearTimeout(timer);
  }
}
