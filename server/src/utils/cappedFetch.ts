/**
 * Response size caps for outbound fetches.
 *
 * Every outbound request has to bound what it buffers, and there are two
 * things worth bounding: the length the provider declares (cheap, but a
 * chunked response omits it) and the bytes that actually arrive. The
 * declared-length check is the pattern transit.service.ts established; the
 * streaming read is the one the plugin installer needed for codeload
 * archives, lifted here so the other fetch sites can share it.
 */

/** Minimal shape of the bits of Response these helpers touch (test stubs are partial). */
interface CappedReader {
  read(): Promise<{ done?: boolean; value?: Uint8Array }>;
  cancel(): Promise<unknown>;
}
interface CappedResponse {
  headers?: { get(name: string): string | null } | null;
  body?: { getReader(): CappedReader; cancel?(): Promise<unknown> } | null;
  arrayBuffer?(): Promise<ArrayBuffer>;
  text?(): Promise<string>;
  json?(): Promise<unknown>;
}

/** True when the provider declares a body larger than the budget. */
export function exceedsDeclaredLength(res: CappedResponse, maxBytes: number): boolean {
  return Number(res.headers?.get('content-length') ?? 0) > maxBytes;
}

/**
 * Let go of a body nobody is going to read. undici keeps the connection
 * reserved until the stream ends, so a bail-out that just returns leaves the
 * socket pinned until the garbage collector gets around to it — which is the
 * one thing a size cap is supposed to prevent.
 */
export function discardBody(res: CappedResponse): void {
  void res.body?.cancel?.().catch(() => {});
}

/**
 * readCappedText plus the parse, for the providers that only ever answer with a
 * JSON document. Answers `undefined` when the body is over the cap, was cut off
 * at it, or does not parse: every caller already has a "the provider
 * misbehaved" branch, and none of them can do anything with half a document.
 */
export async function readCappedJson<T>(res: CappedResponse, maxBytes: number): Promise<T | undefined> {
  if (exceedsDeclaredLength(res, maxBytes)) {
    discardBody(res);
    return undefined;
  }
  // Neither a stream nor text() means there is nothing to read incrementally
  // and nothing to cap — a null-body status, or a partial stub in a test.
  if (!res.body?.getReader && !res.text && !res.arrayBuffer && res.json) {
    return await res.json() as T;
  }
  const { text, truncated } = await readCappedText(res, maxBytes);
  if (truncated) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

/**
 * Read a body, stopping once maxBytes have arrived. Callers that must reject
 * an oversized payload look at `truncated`; callers that only scan the head of
 * the document (og: tags, a coordinate regex) can use the partial bytes and
 * degrade to whatever they find. Responses without a stream fall back to
 * arrayBuffer(), which is post-checked instead.
 */
export async function readCapped(res: CappedResponse, maxBytes: number): Promise<{ bytes: Buffer; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) {
    const raw = res.arrayBuffer ? Buffer.from(await res.arrayBuffer()) : Buffer.from(res.text ? await res.text() : '');
    return raw.length > maxBytes
      ? { bytes: raw.subarray(0, maxBytes), truncated: true }
      : { bytes: raw, truncated: false };
  }

  const chunks: Buffer[] = [];
  let received = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(Buffer.from(value));
    received += value.length;
    if (received > maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
  }
  const bytes = Buffer.concat(chunks);
  return { bytes: truncated ? bytes.subarray(0, maxBytes) : bytes, truncated };
}

/**
 * readCapped for text bodies. Decodes as UTF-8, so a chopped trailing sequence
 * comes back as a replacement character rather than as a throw. Without a
 * stream it reads text() directly instead of going through readCapped, which
 * prefers arrayBuffer().
 */
export async function readCappedText(res: CappedResponse, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!res.body?.getReader && res.text) {
    const raw = Buffer.from(await res.text(), 'utf8');
    return raw.length > maxBytes
      ? { text: new TextDecoder('utf-8').decode(raw.subarray(0, maxBytes)), truncated: true }
      : { text: raw.toString('utf8'), truncated: false };
  }
  const { bytes, truncated } = await readCapped(res, maxBytes);
  return { text: new TextDecoder('utf-8').decode(bytes), truncated };
}
