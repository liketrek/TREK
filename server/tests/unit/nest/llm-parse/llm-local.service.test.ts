import { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// listModels/pull go through safeFetchLlm (SSRF guard: allows a local/LAN Ollama,
// blocks the cloud-metadata range). Mock it so the tests never resolve DNS; its
// (url, init) signature matches the raw fetch it replaced.
const { safeFetchLlmMock } = vi.hoisted(() => ({ safeFetchLlmMock: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchLlm: safeFetchLlmMock }));

const svc = () => new LlmLocalService();

function mockFetch(impl: any) {
  safeFetchLlmMock.mockImplementation(impl);
  return safeFetchLlmMock;
}

beforeEach(() => safeFetchLlmMock.mockReset());

describe('LlmLocalService.ollamaRoot', () => {
  it('strips a trailing /v1 and slashes', () => {
    expect(svc().ollamaRoot('http://localhost:11434/v1')).toBe('http://localhost:11434');
    expect(svc().ollamaRoot('http://localhost:11434/v1/')).toBe('http://localhost:11434');
    expect(svc().ollamaRoot('http://host:1/')).toBe('http://host:1');
  });

  it('defaults when no base URL is given', () => {
    expect(svc().ollamaRoot(undefined)).toBe('http://localhost:11434');
  });

  it('rejects non-http(s) and invalid URLs', () => {
    expect(() => svc().ollamaRoot('ftp://x')).toThrow(HttpException);
    expect(() => svc().ollamaRoot('not a url')).toThrow(HttpException);
  });
});

describe('LlmLocalService.sameServer', () => {
  it('matches the same root however the base URL is spelled', () => {
    expect(svc().sameServer('https://ollama.example.org/v1', 'https://ollama.example.org')).toBe(true);
    expect(svc().sameServer('https://OLLAMA.example.org:443/v1/', 'https://ollama.example.org/v1')).toBe(true);
    expect(svc().sameServer(undefined, 'http://localhost:11434/v1')).toBe(true);
  });

  it('does not match another host, scheme, port or path', () => {
    const s = svc();
    expect(s.sameServer('https://ollama.example.org/v1', 'https://evil.example.com/v1')).toBe(false);
    expect(s.sameServer('https://ollama.example.org/v1', 'http://ollama.example.org/v1')).toBe(false);
    expect(s.sameServer('https://ollama.example.org/v1', 'https://ollama.example.org:8443/v1')).toBe(false);
    expect(s.sameServer('https://proxy.example.org/ollama', 'https://proxy.example.org/other')).toBe(false);
    expect(s.sameServer('https://ollama.example.org', 'https://ollama.example.org@evil.example.com')).toBe(false);
    expect(s.sameServer('https://ollama.example.org', 'not a url')).toBe(false);
  });
});

describe('LlmLocalService.listModels', () => {
  it('returns named models from /api/tags', async () => {
    const fetchFn = mockFetch(async () => ({
      ok: true,
      json: async () => ({ models: [{ name: 'nuextract', size: 100 }, { name: '' }] }),
    }));
    const out = await svc().listModels('http://localhost:11434/v1');
    expect(out.models).toEqual([{ name: 'nuextract', size: 100 }]);
    expect(fetchFn.mock.calls[0][0]).toBe('http://localhost:11434/api/tags');
  });

  it('sends the configured key as a Bearer header, and none without one (#2649)', async () => {
    const fetchFn = mockFetch(async () => ({ ok: true, json: async () => ({ models: [] }) }));
    await svc().listModels('https://ollama.example.org/v1', 'proxy-key');
    expect(fetchFn.mock.calls[0][1].headers).toMatchObject({ authorization: 'Bearer proxy-key' });
    await svc().listModels('https://ollama.example.org/v1');
    expect(fetchFn.mock.calls[1][1].headers ?? {}).not.toHaveProperty('authorization');
    expect(fetchFn.mock.calls[0][0]).not.toContain('proxy-key');
  });

  it('says the key was rejected when the server answers 401 or 403', async () => {
    mockFetch(async () => ({ ok: false, status: 401, body: null }));
    await expect(svc().listModels('http://ollama:11434', 'wrong')).rejects.toMatchObject({
      response: { error: 'Local LLM server rejected the API key (401)' },
    });
    mockFetch(async () => ({ ok: false, status: 403, body: null }));
    await expect(svc().listModels('http://ollama:11434')).rejects.toMatchObject({
      response: { error: expect.stringContaining('requires an API key (403)') },
    });
  });

  it('falls back to the OpenAI model list when the server has no /api/tags', async () => {
    const fetchFn = mockFetch(async (url?: string) =>
      url?.endsWith('/api/tags')
        ? { ok: false, status: 404, body: null }
        : { ok: true, json: async () => ({ data: [{ id: 'qwen3-8b' }, { id: '' }, {}] }) },
    );
    const out = await svc().listModels('http://lmstudio:1234/v1', 'k');
    expect(out.models).toEqual([{ name: 'qwen3-8b', size: 0 }]);
    expect(fetchFn.mock.calls[1][0]).toBe('http://lmstudio:1234/v1/models');
    expect(fetchFn.mock.calls[1][1].headers).toMatchObject({ authorization: 'Bearer k' });
  });

  it('keeps the 404 when the OpenAI model list is missing too', async () => {
    mockFetch(async () => ({ ok: false, status: 404, body: null }));
    await expect(svc().listModels('http://nothing:1')).rejects.toMatchObject({
      response: { error: 'Local LLM server error (404)' },
    });
  });

  it('502s when the server is unreachable', async () => {
    // Reject only the one call listModels makes (mockImplementationOnce): vitest
    // probes the mock a second time and a persistent rejection there would surface
    // as an unhandled rejection and fail the test even though listModels catches
    // the real one and maps it to a 502.
    safeFetchLlmMock.mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')));
    await expect(svc().listModels('http://localhost:11434')).rejects.toThrow(HttpException);
  });
});

describe('LlmLocalService.pull', () => {
  it('requires a model', async () => {
    await expect(svc().pull('http://localhost:11434', '')).rejects.toThrow(HttpException);
  });

  it('posts to /api/pull and returns the stream body', async () => {
    const body = {} as ReadableStream<Uint8Array>;
    const fetchFn = mockFetch(async () => ({ ok: true, body }));
    const out = await svc().pull('http://localhost:11434/v1', 'nuextract');
    expect(out).toBe(body);
    expect(fetchFn.mock.calls[0][0]).toBe('http://localhost:11434/api/pull');
    const init = fetchFn.mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({ model: 'nuextract', stream: true });
  });

  it('sends the configured key with the pull, and none without one (#2649)', async () => {
    const fetchFn = mockFetch(async () => ({ ok: true, body: {} }));
    await svc().pull('https://ollama.example.org/v1', 'nuextract', 'proxy-key');
    expect(fetchFn.mock.calls[0][1].headers).toMatchObject({
      'content-type': 'application/json',
      authorization: 'Bearer proxy-key',
    });
    await svc().pull('https://ollama.example.org/v1', 'nuextract');
    expect(fetchFn.mock.calls[1][1].headers).not.toHaveProperty('authorization');
  });

  it('says the key was rejected when the pull answers 401', async () => {
    mockFetch(async () => ({ ok: false, status: 401, body: null }));
    await expect(svc().pull('http://ollama:11434', 'nuextract', 'wrong')).rejects.toMatchObject({
      response: { error: 'Local LLM server rejected the API key (401)' },
    });
  });
});

describe('LlmLocalService.modelCapabilities', () => {
  const showOk = (body: unknown, headers: Record<string, string> = {}) => ({
    ok: true,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  });

  it('asks /api/show for the model and answers its capabilities', async () => {
    const fetchFn = mockFetch(async () => showOk({ capabilities: ['completion', 'vision'] }));
    await expect(svc().modelCapabilities('http://ollama:11434/v1', 'qwen3.5:4b')).resolves.toEqual([
      'completion',
      'vision',
    ]);
    expect(fetchFn.mock.calls[0][0]).toBe('http://ollama:11434/api/show');
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ model: 'qwen3.5:4b' });
    expect(fetchFn.mock.calls[0][1].headers).not.toHaveProperty('authorization');
  });

  it('sends the configured key as the Bearer header the extraction sends', async () => {
    const fetchFn = mockFetch(async () => showOk({ capabilities: ['vision'] }));
    await expect(svc().modelCapabilities('http://ollama:11434/v1', 'qwen3.5:4b', 'proxy-key')).resolves.toEqual([
      'vision',
    ]);
    expect(fetchFn.mock.calls[0][1].headers).toMatchObject({ authorization: 'Bearer proxy-key' });
  });

  it('remembers an answer per key, so a corrected key is asked afresh', async () => {
    const fetchFn = mockFetch(async (_url: string, init: { headers: Record<string, string> }) =>
      init?.headers?.authorization === 'Bearer right'
        ? showOk({ capabilities: ['vision'] })
        : { ok: false, status: 401, body: null },
    );
    const s = svc();
    await expect(s.modelCapabilities('http://ollama:11434', 'm', 'wrong')).resolves.toBeNull();
    await expect(s.modelCapabilities('http://ollama:11434', 'm', 'right')).resolves.toEqual(['vision']);
    await expect(s.modelCapabilities('http://ollama:11434', 'm', 'right')).resolves.toEqual(['vision']);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('asks the server once per server and model, not once per call', async () => {
    const fetchFn = mockFetch(async () => showOk({ capabilities: ['completion'] }));
    const s = svc();
    await s.modelCapabilities('http://ollama:11434', 'qwen3:8b');
    await s.modelCapabilities('http://ollama:11434', 'qwen3:8b');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    await s.modelCapabilities('http://ollama:11434', 'qwen3.5:4b');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('answers null for a URL it cannot use, without throwing and without a request', async () => {
    await expect(svc().modelCapabilities('not a url', 'm')).resolves.toBeNull();
    await expect(svc().modelCapabilities('ftp://x', 'm')).resolves.toBeNull();
    expect(safeFetchLlmMock).not.toHaveBeenCalled();
  });

  it("answers null for an unreachable server, a model it lacks, or a body that is not Ollama's", async () => {
    mockFetch(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(svc().modelCapabilities('http://a:1', 'm')).resolves.toBeNull();
    mockFetch(async () => ({ ok: false, status: 404, body: null }));
    await expect(svc().modelCapabilities('http://b:1', 'm')).resolves.toBeNull();
    mockFetch(async () => showOk({ capabilities: 'vision' }));
    await expect(svc().modelCapabilities('http://c:1', 'm')).resolves.toBeNull();
  });

  it('does not read a body that declares itself larger than the cap', async () => {
    const json = vi.fn(async () => ({ capabilities: ['vision'] }));
    mockFetch(async () => ({ ...showOk({}), headers: { get: () => String(2 * 1024 * 1024) }, json }));
    await expect(svc().modelCapabilities('http://d:1', 'm')).resolves.toBeNull();
    expect(json).not.toHaveBeenCalled();
  });

  it('asks again a minute after a miss, and keeps an answer for ten', async () => {
    vi.useFakeTimers();
    try {
      const s = svc();
      mockFetch(async () => {
        throw new Error('down');
      });
      await s.modelCapabilities('http://e:1', 'm');
      vi.advanceTimersByTime(61_000);
      mockFetch(async () => showOk({ capabilities: ['vision'] }));
      await expect(s.modelCapabilities('http://e:1', 'm')).resolves.toEqual(['vision']);
      vi.advanceTimersByTime(9 * 60_000);
      mockFetch(async () => showOk({ capabilities: [] }));
      await expect(s.modelCapabilities('http://e:1', 'm')).resolves.toEqual(['vision']);
    } finally {
      vi.useRealTimers();
    }
  });
});
