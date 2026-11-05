import { toNativeBase, extractEnforced } from '../../../../src/nest/llm-parse/router/ollama-format.client';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// The client goes through safeFetchLlm (SSRF guard: blocks the cloud-metadata
// range, allows a local/LAN Ollama). Mock it so the tests never do a real DNS
// lookup; its (url, init) signature matches the raw fetch it wraps, so the
// recorded-call assertions are unchanged.
const { safeFetchLlmMock } = vi.hoisted(() => ({ safeFetchLlmMock: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchLlm: safeFetchLlmMock }));

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

  it('attaches images to the user turn only when given', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ message: { content: '{}' } }));
    await extractEnforced({ ...INPUT, images: ['aW1n'] });
    await extractEnforced(INPUT);
    const userTurn = (i: number) => JSON.parse((fetchFn.mock.calls[i][1] as RequestInit).body as string).messages[1];
    expect(userTurn(0).images).toEqual(['aW1n']);
    expect(userTurn(1)).not.toHaveProperty('images');
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

  it('throws for a server error without trying another path', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ error: 'boom' }, false, 500));
    await expect(extractEnforced(INPUT)).rejects.toThrow(/failed \(500\)/);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('extractEnforced on an OpenAI-compatible server (#2806)', () => {
  const GROQ = { ...INPUT, baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b', apiKey: 'gsk' };
  const chatAnswer = (content: string) => jsonResponse({ choices: [{ message: { content } }] });
  const unknownUrl = (url: string) =>
    jsonResponse(
      { error: { message: `Unknown request URL: POST ${new URL(url).pathname}.`, code: 'unknown_url' } },
      false,
      404,
    );

  it('sends the extraction to /chat/completions at the address as entered when /api/chat is missing', async () => {
    const fetchFn = mockFetch((url = '') =>
      url.endsWith('/api/chat') ? unknownUrl(url) : chatAnswer('{"result":[{"name":"Hotel"}]}'),
    );
    expect(await extractEnforced(GROQ)).toEqual({ name: 'Hotel' });
    expect(fetchFn.mock.calls.map((c) => c[0])).toEqual([
      'https://api.groq.com/openai/api/chat',
      'https://api.groq.com/openai/v1/chat/completions',
    ]);
    const init = fetchFn.mock.calls[1][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer gsk');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.response_format.json_schema.schema).toEqual({
      type: 'object',
      properties: { result: { type: 'array', items: { type: 'object' } } },
      required: ['result'],
    });
    expect(body.messages[0].content).toContain('{"result": [object]}');
    expect(body.messages[1].content[0].text).toBe('doc');
  });

  it('falls back on a 405 or 501 too, and on a 200 that is not an Ollama answer (LM Studio)', async () => {
    const fallsBackAfter = async (first: Response) => {
      mockFetch((url = '') => (url.endsWith('/api/chat') ? first : chatAnswer('{"result":[{"a":1}]}')));
      expect(await extractEnforced(GROQ)).toEqual({ a: 1 });
    };
    await fallsBackAfter(jsonResponse({}, false, 405));
    await fallsBackAfter(jsonResponse({}, false, 501));
    await fallsBackAfter(jsonResponse({ error: 'Unexpected endpoint' }));
  });

  it('answers null when the server returns no object', async () => {
    mockFetch((url = '') => (url.endsWith('/api/chat') ? unknownUrl(url) : chatAnswer('{"result":[]}')));
    expect(await extractEnforced(GROQ)).toBeNull();
  });

  it('passes the images on as image parts with their type', async () => {
    const fetchFn = mockFetch((url = '') =>
      url.endsWith('/api/chat') ? unknownUrl(url) : chatAnswer('{"result":[{}]}'),
    );
    await extractEnforced({ ...GROQ, images: ['iVBORw0K', '/9j/4AAQ', 'UklGRiQA', 'R0lGODlh'] });
    const parts = JSON.parse((fetchFn.mock.calls[1][1] as RequestInit).body as string).messages[1].content;
    expect(parts.slice(1).map((p: { image_url: { url: string } }) => p.image_url.url.split(';')[0])).toEqual([
      'data:image/png',
      'data:image/jpeg',
      'data:image/webp',
      'data:image/gif',
    ]);
  });

  it('reports the OpenAI-compatible failure when that path fails too', async () => {
    mockFetch((url = '') =>
      url.endsWith('/api/chat') ? unknownUrl(url) : jsonResponse({ error: 'bad model' }, false, 404),
    );
    await expect(extractEnforced(GROQ)).rejects.toThrow(/LLM request failed \(404\)/);
  });
});
