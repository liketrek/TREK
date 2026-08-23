import { describe, it, expect } from 'vitest';
import { discardBody, exceedsDeclaredLength, readCapped, readCappedJson, readCappedText } from '../../../src/utils/cappedFetch';

/** Response stub that streams `chunks` through a reader, tracking cancellation. */
function streamed(chunks: string[], contentLength: string | null = null) {
  let i = 0;
  const state = { cancelled: false };
  return {
    state,
    res: {
      headers: { get: () => contentLength },
      body: {
        getReader: () => ({
          read: async () =>
            i < chunks.length
              ? { done: false, value: new TextEncoder().encode(chunks[i++]) }
              : { done: true, value: undefined as unknown as Uint8Array },
          cancel: async () => { state.cancelled = true; },
        }),
        cancel: async () => { state.cancelled = true; },
      },
    },
  };
}

describe('exceedsDeclaredLength', () => {
  it('CAP-001: is true when content-length is over the budget', () => {
    const res = { headers: { get: () => '2048' } };
    expect(exceedsDeclaredLength(res, 1024)).toBe(true);
  });

  it('CAP-002: is false when content-length is missing or under the budget', () => {
    expect(exceedsDeclaredLength({ headers: { get: () => '512' } }, 1024)).toBe(false);
    expect(exceedsDeclaredLength({ headers: { get: () => null } }, 1024)).toBe(false);
    expect(exceedsDeclaredLength({}, 1024)).toBe(false);
  });
});

describe('readCapped', () => {
  it('CAP-003: returns the whole body when it fits', async () => {
    const { res, state } = streamed(['hello ', 'world']);
    const { bytes, truncated } = await readCapped(res, 1024);
    expect(bytes.toString('utf8')).toBe('hello world');
    expect(truncated).toBe(false);
    expect(state.cancelled).toBe(false);
  });

  it('CAP-004: stops at the budget and cancels the reader when the body is oversized', async () => {
    const { res, state } = streamed(['aaaa', 'bbbb', 'cccc']);
    const { bytes, truncated } = await readCapped(res, 6);
    expect(bytes.length).toBe(6);
    expect(bytes.toString('utf8')).toBe('aaaabb');
    expect(truncated).toBe(true);
    expect(state.cancelled).toBe(true);
  });

  it('CAP-005: survives a reader whose cancel rejects', async () => {
    const { res } = streamed(['aaaa', 'bbbb']);
    res.body.getReader = ((orig) => () => ({ ...orig(), cancel: async () => { throw new Error('nope'); } }))(
      res.body.getReader,
    );
    const { truncated } = await readCapped(res, 2);
    expect(truncated).toBe(true);
  });

  it('CAP-006: falls back to arrayBuffer when the response exposes no stream', async () => {
    const res = { arrayBuffer: async () => new TextEncoder().encode('body').buffer };
    const { bytes, truncated } = await readCapped(res, 1024);
    expect(bytes.toString('utf8')).toBe('body');
    expect(truncated).toBe(false);
  });

  it('CAP-007: truncates the arrayBuffer fallback too', async () => {
    const res = { arrayBuffer: async () => new TextEncoder().encode('abcdef').buffer };
    const { bytes, truncated } = await readCapped(res, 3);
    expect(bytes.toString('utf8')).toBe('abc');
    expect(truncated).toBe(true);
  });

  it('CAP-008: falls back to text() when there is neither a stream nor arrayBuffer', async () => {
    const { bytes } = await readCapped({ text: async () => 'from text' }, 1024);
    expect(bytes.toString('utf8')).toBe('from text');
  });

  it('CAP-009: yields an empty body for a stub with no reader at all', async () => {
    const { bytes, truncated } = await readCapped({}, 1024);
    expect(bytes.length).toBe(0);
    expect(truncated).toBe(false);
  });
});

describe('readCappedText', () => {
  it('CAP-010: decodes the collected bytes as UTF-8', async () => {
    const { res } = streamed(['<title>', 'Hallo Grüße', '</title>']);
    const { text, truncated } = await readCappedText(res, 1024);
    expect(text).toBe('<title>Hallo Grüße</title>');
    expect(truncated).toBe(false);
  });

  it('CAP-011a: prefers text() over arrayBuffer() when there is no stream', async () => {
    const res = {
      text: async () => '# markdown',
      arrayBuffer: async () => new ArrayBuffer(4),
    };
    const { text } = await readCappedText(res, 1024);
    expect(text).toBe('# markdown');
  });

  it('CAP-011b: truncates the text() fallback at the budget', async () => {
    const { text, truncated } = await readCappedText({ text: async () => 'abcdef' }, 3);
    expect(text).toBe('abc');
    expect(truncated).toBe(true);
  });

  it('CAP-011: reports truncation and still returns the head', async () => {
    const { res } = streamed(['<title>x</title>', 'z'.repeat(100)]);
    const { text, truncated } = await readCappedText(res, 20);
    expect(truncated).toBe(true);
    expect(text.startsWith('<title>x</title>')).toBe(true);
    expect(text.length).toBe(20);
  });
});

describe('discardBody', () => {
  it('CAP-012: cancels the stream of a response nobody is going to read', async () => {
    const { res, state } = streamed(['unread']);
    discardBody(res);
    await Promise.resolve();
    expect(state.cancelled).toBe(true);
  });

  it('CAP-013: is a no-op for a response without a body, and swallows a rejecting cancel', async () => {
    expect(() => discardBody({})).not.toThrow();
    expect(() => discardBody({ body: { getReader: () => ({ read: async () => ({ done: true }), cancel: async () => undefined }), cancel: async () => { throw new Error('nope'); } } })).not.toThrow();
    await Promise.resolve();
  });
});

describe('readCappedJson', () => {
  it('CAP-014: parses a streamed body that fits', async () => {
    const { res } = streamed(['{"holidays"', ':[1,2]}']);
    expect(await readCappedJson(res, 1024)).toEqual({ holidays: [1, 2] });
  });

  it('CAP-015: a chunked body over the cap is undefined, not a truncated parse', async () => {
    // No content-length at all — the case the declared-length check cannot see.
    const { res, state } = streamed(['{"items":[', 'x'.repeat(200), ']}']);
    expect(await readCappedJson(res, 32)).toBeUndefined();
    expect(state.cancelled).toBe(true);
  });

  it('CAP-016: a declared oversize is refused without reading the body', async () => {
    const { res, state } = streamed(['{"ok":true}'], '999999');
    expect(await readCappedJson(res, 1024)).toBeUndefined();
    await Promise.resolve();
    expect(state.cancelled).toBe(true);
  });

  it('CAP-017: a body that is not JSON is undefined rather than a throw', async () => {
    const { res } = streamed(['<html>error page</html>']);
    expect(await readCappedJson(res, 1024)).toBeUndefined();
  });

  it('CAP-018: falls back to json() when the response exposes nothing to stream', async () => {
    expect(await readCappedJson({ json: async () => ({ from: 'json' }) }, 1024)).toEqual({ from: 'json' });
  });
});
