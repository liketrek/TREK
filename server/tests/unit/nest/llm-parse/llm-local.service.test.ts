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

describe('LlmLocalService.capabilities', () => {
  const ok = (body: unknown) => ({ ok: true, json: async () => body });

  it('reports what the server says the model can do', async () => {
    // Verified against Ollama 0.32.15: qwen3.5:4b answers with vision, qwen3:8b
    // does not. This is the answer the id heuristic exists to guess at.
    mockFetch(async () => ok({ capabilities: ['completion', 'vision', 'tools', 'thinking'] }));
    await expect(svc().capabilities('http://localhost:11434/v1', 'qwen3.5:4b')).resolves.toEqual([
      'completion',
      'vision',
      'tools',
      'thinking',
    ]);
  });

  it('asks the native API at the root, not the /v1 path, and names the model', async () => {
    const fetchMock = mockFetch(async () => ok({ capabilities: [] }));
    await svc().capabilities('http://ollama.lan:11434/v1', 'qwen3:8b');

    expect(fetchMock.mock.calls[0][0]).toBe('http://ollama.lan:11434/api/show');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ model: 'qwen3:8b' });
  });

  it('answers null when the server refuses, so the caller falls back to the id', async () => {
    mockFetch(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    await expect(svc().capabilities(undefined, 'nope')).resolves.toBeNull();
  });

  it('answers null when the server is too old to report capabilities', async () => {
    // A model that works must not be hidden because Ollama predates the field.
    mockFetch(async () => ok({ details: { family: 'qwen3' } }));
    await expect(svc().capabilities(undefined, 'qwen3.5:4b')).resolves.toBeNull();
  });

  it('answers null rather than throwing when the server cannot be reached', async () => {
    // Reject only the one call, as above: a persistent rejection surfaces as an
    // unhandled rejection on vitest's own probe of the mock.
    safeFetchLlmMock.mockImplementationOnce(() => Promise.reject(new Error('ECONNREFUSED')));
    await expect(svc().capabilities(undefined, 'qwen3.5:4b')).resolves.toBeNull();
  });

  it('drops anything in the list that is not a string', async () => {
    mockFetch(async () => ok({ capabilities: ['vision', 7, null] }));
    await expect(svc().capabilities(undefined, 'm')).resolves.toEqual(['vision']);
  });
});
