import { describe, it, expect, vi, beforeEach } from 'vitest';

// The client goes through safeFetchLlm (SSRF guard: blocks the cloud-metadata
// range, allows a local/LAN Ollama). Mock it so the tests never do a real DNS
// lookup; its (url, init) signature matches the raw fetch it wraps, so the
// recorded-call assertions are unchanged.
const { safeFetchLlmMock } = vi.hoisted(() => ({ safeFetchLlmMock: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchLlm: safeFetchLlmMock }));

import { toNativeBase, extractEnforced } from '../../../../src/nest/llm-parse/router/ollama-format.client';

function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response> | Response) {
  safeFetchLlmMock.mockImplementation(impl as unknown as typeof fetch);
  return safeFetchLlmMock;
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

const INPUT = {
  baseUrl: 'http://ollama:11434/v1',
  model: 'qwen3:8b',
  system: 'sys',
  user: 'doc',
  schema: { type: 'object' as const },
};

beforeEach(() => safeFetchLlmMock.mockReset());

describe('toNativeBase', () => {
  it('strips a /v1 suffix and trailing slashes', () => {
    expect(toNativeBase('http://ollama:11434/v1')).toBe('http://ollama:11434');
    expect(toNativeBase('http://ollama:11434/v1/')).toBe('http://ollama:11434');
    expect(toNativeBase('http://ollama:11434/')).toBe('http://ollama:11434');
    expect(toNativeBase('http://ollama:11434')).toBe('http://ollama:11434');
  });
});

describe('extractEnforced', () => {
  it('posts to the native /api/chat with the grammar format and thinking disabled', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ message: { content: '{"name":"Hotel"}' } }));
    const out = await extractEnforced(INPUT);
    expect(out).toEqual({ name: 'Hotel' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://ollama:11434/api/chat');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.format).toEqual({ type: 'object' });
    expect(body.think).toBe(false);
    expect(body.stream).toBe(false);
    expect(body.options.temperature).toBe(0);
    expect((init as RequestInit).headers).not.toHaveProperty('authorization');
  });

  it('sends a bearer header only when an apiKey is given', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ message: { content: '{}' } }));
    await extractEnforced({ ...INPUT, apiKey: 'sk-123', numPredict: 900, numCtx: 16000 });
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-123');
    const body = JSON.parse(init.body as string);
    expect(body.options.num_predict).toBe(900);
    expect(body.options.num_ctx).toBe(16000);
  });

  it('strips a ```json code fence before parsing', async () => {
    mockFetch(() => jsonResponse({ message: { content: '```json\n{"a":1}\n```' } }));
    expect(await extractEnforced(INPUT)).toEqual({ a: 1 });
  });

  it('returns null when the content parses to a non-object', async () => {
    mockFetch(() => jsonResponse({ message: { content: '"just a string"' } }));
    expect(await extractEnforced(INPUT)).toBeNull();
  });

  it('returns null for unparseable content', async () => {
    mockFetch(() => jsonResponse({ message: { content: 'not json at all' } }));
    expect(await extractEnforced(INPUT)).toBeNull();
  });

  it('returns null when the response has no content', async () => {
    mockFetch(() => jsonResponse({ message: {} }));
    expect(await extractEnforced(INPUT)).toBeNull();
  });

  it('throws with the status when Ollama responds non-ok', async () => {
    mockFetch(() => jsonResponse({ error: 'model not found' }, false, 404));
    await expect(extractEnforced(INPUT)).rejects.toThrow(/Ollama \/api\/chat failed \(404\)/);
  });
});
