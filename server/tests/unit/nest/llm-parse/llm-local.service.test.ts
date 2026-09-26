import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

// listModels/pull go through safeFetchLlm (SSRF guard: allows a local/LAN Ollama,
// blocks the cloud-metadata range). Mock it so the tests never resolve DNS; its
// (url, init) signature matches the raw fetch it replaced.
const { safeFetchLlmMock } = vi.hoisted(() => ({ safeFetchLlmMock: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchLlm: safeFetchLlmMock }));

import { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';

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

describe('LlmLocalService.listModels', () => {
  it('returns named models from /api/tags', async () => {
    const fetchFn = mockFetch(async () => ({ ok: true, json: async () => ({ models: [{ name: 'nuextract', size: 100 }, { name: '' }] }) }));
    const out = await svc().listModels('http://localhost:11434/v1');
    expect(out.models).toEqual([{ name: 'nuextract', size: 100 }]);
    expect(fetchFn.mock.calls[0][0]).toBe('http://localhost:11434/api/tags');
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
});

describe('LlmLocalService.modelCapabilities', () => {
  const showOk = (body: unknown, headers: Record<string, string> = {}) => ({
    ok: true,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  });

  it('asks /api/show for the model and answers its capabilities', async () => {
    const fetchFn = mockFetch(async () => showOk({ capabilities: ['completion', 'vision'] }));
    await expect(svc().modelCapabilities('http://ollama:11434/v1', 'qwen3.5:4b')).resolves.toEqual(['completion', 'vision']);
    expect(fetchFn.mock.calls[0][0]).toBe('http://ollama:11434/api/show');
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ model: 'qwen3.5:4b' });
    expect(fetchFn.mock.calls[0][1].headers).not.toHaveProperty('authorization');
  });

  it('sends the configured key as the Bearer header the extraction sends', async () => {
    const fetchFn = mockFetch(async () => showOk({ capabilities: ['vision'] }));
    await expect(svc().modelCapabilities('http://ollama:11434/v1', 'qwen3.5:4b', 'proxy-key')).resolves.toEqual(['vision']);
    expect(fetchFn.mock.calls[0][1].headers).toMatchObject({ authorization: 'Bearer proxy-key' });
  });

  it('remembers an answer per key, so a corrected key is asked afresh', async () => {
    const fetchFn = mockFetch(async (_url: string, init: { headers: Record<string, string> }) =>
      init?.headers?.authorization === 'Bearer right' ? showOk({ capabilities: ['vision'] }) : { ok: false, status: 401, body: null });
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

  it('answers null for an unreachable server, a model it lacks, or a body that is not Ollama\'s', async () => {
    mockFetch(async () => { throw new Error('ECONNREFUSED'); });
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
      mockFetch(async () => { throw new Error('down'); });
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
