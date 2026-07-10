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
