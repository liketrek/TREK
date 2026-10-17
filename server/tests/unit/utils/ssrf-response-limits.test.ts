import {
  capResponse,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_RESPONSE_TIMEOUT_MS,
  ResponseTooLargeError,
  safeFetch,
  safeFetchAdminConfigured,
  safeFetchFollow,
  safeFetchLlm,
} from '../../../src/utils/ssrfGuard';

import dns from 'dns/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The defaults every SSRF-guarded fetch now carries: a bounded wait for the
 * response headers when the caller passes no signal, an optional deadline for
 * the whole exchange, and a cap on the body. Before, a call such as
 * `safeFetch(url, undefined, options)` reached the platform fetch through a
 * spread init the lint rule could not see into, waited undici's five minutes
 * for a hung host and read whatever size the host sent back into memory.
 */
const { AgentMock } = vi.hoisted(() => ({ AgentMock: vi.fn() }));
vi.mock('undici', () => ({ Agent: AgentMock }));

vi.mock('dns/promises', () => ({ default: { lookup: vi.fn() }, lookup: vi.fn() }));

const { readEnvMock } = vi.hoisted(() => ({
  readEnvMock: vi.fn(() => ({
    net: { allowInternalNetwork: false, proxy: { noProxy: [] } },
    integrations: { llmTimeoutMs: 900_000 },
  })),
}));
vi.mock('../../../src/app-config', () => ({ readEnv: readEnvMock }));

const mockLookup = vi.mocked(dns.lookup);
const agentOptions = () => AgentMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;

/** A real platform Response, as undici hands it back, with the url it would carry. */
function upstream(
  body: ConstructorParameters<typeof Response>[0],
  init: ResponseInit = {},
  url = 'https://photos.example/a.jpg',
): Response {
  const res = new Response(body, init);
  Object.defineProperty(res, 'url', { value: url });
  return res;
}

/** A body that arrives in chunks and never declares its length. */
function chunked(chunks: number, size: number): ReadableStream<Uint8Array> {
  let sent = 0;
  return new ReadableStream({
    pull(controller) {
      if (sent++ >= chunks) controller.close();
      else controller.enqueue(new Uint8Array(size));
    },
  });
}

beforeEach(() => {
  AgentMock.mockClear();
  mockLookup.mockResolvedValue({ address: '203.0.113.10', family: 4 });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the wait for a response', () => {
  it('LIMIT-001: without a signal, the headers are waited for a bounded time and the body is left to undici', async () => {
    const fetchMock = vi.fn().mockResolvedValue(upstream('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await safeFetch('https://photos.example/a.jpg');

    expect(agentOptions().headersTimeout).toBe(DEFAULT_RESPONSE_TIMEOUT_MS);
    expect(agentOptions().bodyTimeout).toBeUndefined();
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeUndefined();
  });

  it("LIMIT-002: the caller's own signal governs, and goes through unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValue(upstream('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const signal = AbortSignal.timeout(5_000);

    await safeFetchFollow('https://photos.example/a.jpg', { signal });

    expect(agentOptions().headersTimeout).toBeUndefined();
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBe(signal);
  });

  it('LIMIT-003: timeoutMs sets a deadline for the whole chain and joins the caller signal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(upstream(null, { status: 302, headers: { location: 'https://cdn.example/b.jpg' } }))
      .mockResolvedValueOnce(upstream('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const caller = new AbortController();

    await safeFetchFollow('https://photos.example/a.jpg', { signal: caller.signal }, { timeoutMs: 60_000 });

    const first = (fetchMock.mock.calls[0][1] as RequestInit).signal!;
    const second = (fetchMock.mock.calls[1][1] as RequestInit).signal!;
    expect(first).toBeInstanceOf(AbortSignal);
    expect(first).not.toBe(caller.signal);
    // One signal for every hop, so a redirect does not restart the clock.
    expect(second).toBe(first);
    caller.abort();
    expect(first.aborted).toBe(true);
  });

  it('LIMIT-004: timeoutMs alone gives a call without an init its deadline', async () => {
    const fetchMock = vi.fn().mockResolvedValue(upstream('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await safeFetch('https://photos.example/a.jpg', undefined, { timeoutMs: 1_000 });

    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
    expect(agentOptions().headersTimeout).toBeUndefined();
  });
});

describe('the size of a response', () => {
  it('LIMIT-005: a declared length over the cap is refused before anything is read', async () => {
    const res = upstream('x', { headers: { 'content-length': '2048' } });
    const cancel = vi.spyOn(res.body!, 'cancel');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));

    await expect(safeFetch('https://photos.example/a.jpg', undefined, { maxBytes: 1024 })).rejects.toBeInstanceOf(
      ResponseTooLargeError,
    );
    expect(cancel).toHaveBeenCalled();
  });

  it('LIMIT-006: a body without a declared length fails the read once it passes the cap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(chunked(10, 512))));

    const res = await safeFetch('https://photos.example/a.jpg', undefined, { maxBytes: 2048 });

    await expect(res.arrayBuffer()).rejects.toBeInstanceOf(ResponseTooLargeError);
  });

  it('LIMIT-007: a body under the cap reads whole, with its status, headers and final url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(upstream(chunked(3, 100), { status: 203, headers: { 'content-type': 'image/jpeg' } })),
    );

    const res = await safeFetch('https://photos.example/a.jpg', undefined, { maxBytes: 2048 });

    expect(res.status).toBe(203);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.url).toBe('https://photos.example/a.jpg');
    expect((await res.arrayBuffer()).byteLength).toBe(300);
  });

  it('LIMIT-008: the default cap applies when the caller names none', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(upstream('x', { headers: { 'content-length': String(DEFAULT_MAX_RESPONSE_BYTES + 1) } })),
    );

    await expect(safeFetchFollow('https://photos.example/a.jpg')).rejects.toBeInstanceOf(ResponseTooLargeError);
  });

  it('LIMIT-009: maxBytes null hands back the response untouched, for a body streamed on', async () => {
    const res = upstream('x', { headers: { 'content-length': String(DEFAULT_MAX_RESPONSE_BYTES + 1) } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));

    await expect(safeFetch('https://photos.example/a.jpg', undefined, { maxBytes: null })).resolves.toBe(res);
  });

  it('LIMIT-010: the admin-configured lane is capped too, and the LLM lane can lift it', async () => {
    const big = () => upstream('x', { headers: { 'content-length': String(DEFAULT_MAX_RESPONSE_BYTES + 1) } });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(big())),
    );

    await expect(
      safeFetchAdminConfigured('https://idp.example/jwks', { signal: AbortSignal.timeout(1_000) }),
    ).rejects.toBeInstanceOf(ResponseTooLargeError);
    await expect(safeFetchLlm('https://llm.example/api/pull', { method: 'POST' }, 5, null)).resolves.toBeInstanceOf(
      Response,
    );
  });

  it('LIMIT-011: capResponse leaves a body-less answer and a test stub alone', () => {
    const empty = upstream(null, { status: 204 });
    expect(capResponse(empty, 10)).toBe(empty);
    const stub = { status: 200, headers: { get: () => null }, body: null } as unknown as Response;
    expect(capResponse(stub, 10)).toBe(stub);
  });
});
