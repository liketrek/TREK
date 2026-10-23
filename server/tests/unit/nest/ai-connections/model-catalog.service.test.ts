/**
 * ModelCatalogService: each provider's model list read into the assistant's
 * shape, which doubles as the key test, kept for ten minutes per kind, server
 * and secret. The providers answer through a mocked safeFetch; a custom
 * server's list comes from LlmLocalService, the way the admin screen reads it.
 */
import { AiConnectionsModule } from '../../../../src/nest/ai-connections/ai-connections.module';
import {
  modelReadsImages,
  ModelCatalogService,
  pickDefaultModel,
  withRecommendation,
} from '../../../../src/nest/ai-connections/model-catalog.service';
import { AiProviderError } from '../../../../src/nest/ai-connections/providers/provider-errors';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';
import { OidcService } from '../../../../src/nest/oidc/oidc.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const db = createSnapshotTestDb();
let t: TestModule;
const llmLocal = { listModels: vi.fn() };

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, AiConnectionsModule],
    overrides: [
      { provide: LlmLocalService, useValue: llmLocal },
      { provide: OidcService, useValue: {} },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

beforeEach(() => {
  safeFetch.mockReset();
  llmLocal.listModels.mockReset();
});

const catalog = () => t.get(ModelCatalogService);
let n = 0;
/** A secret no earlier case listed with, so the cache never answers for another case. */
const secret = () => `key-${++n}`;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('ModelCatalogService', () => {
  it('MCAT-001: Anthropic lists every model with its display name, asked with the key and version', async () => {
    safeFetch.mockResolvedValueOnce(json(200, { data: [{ id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5' }] }));
    const key = secret();
    expect(await catalog().list({ kind: 'anthropic', baseUrl: null, secret: key })).toEqual([
      { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', supportsTools: true, supportsImages: true, recommended: true },
    ]);
    const [url, init] = safeFetch.mock.calls[0] as [string, RequestInit, { maxBytes: number }];
    expect(url).toBe('https://api.anthropic.com/v1/models?limit=1000');
    expect(init.headers).toMatchObject({ 'x-api-key': key, 'anthropic-version': '2023-06-01' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('MCAT-002: OpenAI keeps the chat models only, Gemini drops the models/ prefix and non-chat models', async () => {
    safeFetch.mockResolvedValueOnce(
      json(200, {
        data: [
          { id: 'gpt-5-mini' },
          { id: 'o4' },
          { id: 'gpt-realtime' },
          { id: 'text-embedding-3' },
          { id: 'dall-e-3' },
        ],
      }),
    );
    expect((await catalog().list({ kind: 'openai', baseUrl: null, secret: secret() })).map((m) => m.id)).toEqual([
      'gpt-5-mini',
      'o4',
    ]);
    safeFetch.mockResolvedValueOnce(
      json(200, {
        data: [{ id: 'models/gemini-3-flash' }, { id: 'models/gemini-embedding-1' }, { id: 'models/imagen-4' }],
      }),
    );
    expect((await catalog().list({ kind: 'gemini', baseUrl: null, secret: secret() })).map((m) => m.id)).toEqual([
      'gemini-3-flash',
    ]);
  });

  it('MCAT-003: OpenRouter checks the key first, then lists the models that call tools, marking the free ones', async () => {
    safeFetch.mockResolvedValueOnce(json(200, { data: { label: 'key' } }));
    safeFetch.mockResolvedValueOnce(
      json(200, {
        data: [
          {
            id: 'anthropic/claude-sonnet-5',
            name: 'Sonnet',
            supported_parameters: ['tools'],
            architecture: { input_modalities: ['text', 'image'] },
            pricing: { prompt: '0.000003', completion: '0.000015' },
          },
          { id: 'meta/llama:free', supported_parameters: ['tools'], pricing: { prompt: '0', completion: '0' } },
          { id: 'old/no-tools', supported_parameters: ['temperature'] },
        ],
      }),
    );
    expect(await catalog().list({ kind: 'openrouter', baseUrl: null, secret: secret() })).toEqual([
      {
        id: 'anthropic/claude-sonnet-5',
        label: 'Sonnet',
        supportsTools: true,
        free: false,
        supportsImages: true,
        recommended: true,
      },
      { id: 'meta/llama:free', label: 'meta/llama:free', supportsTools: true, free: true, supportsImages: false },
    ]);
    expect(safeFetch.mock.calls.map((call) => call[0])).toEqual([
      'https://openrouter.ai/api/v1/key',
      'https://openrouter.ai/api/v1/models',
    ]);
  });

  it('MCAT-004: a refused key is invalid_key, a provider that is down is provider_unavailable, neither is kept', async () => {
    const key = secret();
    safeFetch.mockResolvedValueOnce(json(401, { error: { type: 'authentication_error' } }));
    await expect(catalog().list({ kind: 'anthropic', baseUrl: null, secret: key })).rejects.toMatchObject({
      code: 'invalid_key',
    });
    safeFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(catalog().list({ kind: 'anthropic', baseUrl: null, secret: key })).rejects.toBeInstanceOf(
      AiProviderError,
    );
    safeFetch.mockResolvedValueOnce(json(200, { unexpected: true }));
    await expect(catalog().list({ kind: 'anthropic', baseUrl: null, secret: key })).rejects.toMatchObject({
      providerCode: 'unreadable_list',
    });
    safeFetch.mockResolvedValueOnce(json(200, { data: [{ id: 'claude-x' }] }));
    expect(await catalog().list({ kind: 'anthropic', baseUrl: null, secret: key })).toHaveLength(1);
  });

  it('MCAT-005: a list is kept for the same kind and secret, and asked afresh for another secret', async () => {
    const key = secret();
    safeFetch.mockResolvedValue(json(200, { data: [{ id: 'claude-x' }] }));
    await catalog().list({ kind: 'anthropic', baseUrl: null, secret: key });
    safeFetch.mockResolvedValue(json(200, { data: [{ id: 'claude-x' }] }));
    await catalog().list({ kind: 'anthropic', baseUrl: null, secret: key });
    expect(safeFetch).toHaveBeenCalledOnce();
    safeFetch.mockResolvedValue(json(200, { data: [{ id: 'claude-x' }] }));
    await catalog().list({ kind: 'anthropic', baseUrl: null, secret: secret() });
    expect(safeFetch).toHaveBeenCalledTimes(2);
  });

  it('MCAT-006: ChatGPT lists the visible models, and falls back to the known ones when the list fails or is empty', async () => {
    safeFetch.mockResolvedValueOnce(
      json(200, {
        models: [
          { slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', visibility: 'list' },
          { slug: 'gpt-hidden', visibility: 'hidden' },
          { slug: 'gpt-app-only', visibility: 'list', supported_in_api: false },
        ],
      }),
    );
    expect(await catalog().list({ kind: 'chatgpt', baseUrl: null, secret: secret() })).toEqual([
      { id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol', supportsTools: true, supportsImages: true, recommended: true },
    ]);
    safeFetch.mockResolvedValueOnce(json(500, {}));
    expect((await catalog().list({ kind: 'chatgpt', baseUrl: null, secret: secret() }))[0]?.id).toBe('gpt-6.1-sol');
    safeFetch.mockResolvedValueOnce(json(200, { models: [] }));
    expect(await catalog().list({ kind: 'chatgpt', baseUrl: null, secret: secret() })).toHaveLength(8);
    // A refused sign-in is not covered up by the known list.
    safeFetch.mockResolvedValueOnce(json(401, {}));
    await expect(catalog().list({ kind: 'chatgpt', baseUrl: null, secret: secret() })).rejects.toMatchObject({
      code: 'needs_reauth',
    });
  });

  it('MCAT-007: a custom server is listed through LlmLocalService, its failure is provider_unavailable', async () => {
    llmLocal.listModels.mockResolvedValueOnce({ models: [{ name: 'qwen3:14b', size: 9 }] });
    expect(await catalog().list({ kind: 'custom', baseUrl: 'http://ollama:11434/v1', secret: null })).toEqual([
      { id: 'qwen3:14b', label: 'qwen3:14b', supportsTools: true, recommended: true },
    ]);
    expect(llmLocal.listModels).toHaveBeenCalledWith('http://ollama:11434/v1', undefined);
    llmLocal.listModels.mockRejectedValueOnce(new DomainError(502, 'Could not reach local LLM server'));
    await expect(
      catalog().list({ kind: 'custom', baseUrl: 'http://down:11434/v1', secret: 'k' }),
    ).rejects.toMatchObject({ code: 'provider_unavailable', status: 502 });
  });

  it('MCAT-008: the default model is a capable one, else the first listed', () => {
    const list = (...ids: string[]) => ids.map((id) => ({ id, label: id, supportsTools: true }));
    expect(pickDefaultModel('anthropic', list('claude-haiku', 'claude-sonnet-5', 'claude-opus'))).toBe(
      'claude-sonnet-5',
    );
    expect(pickDefaultModel('openai', list('gpt-5', 'gpt-5-mini', 'o4'))).toBe('gpt-5-mini');
    expect(pickDefaultModel('gemini', list('gemini-3-flash-lite', 'gemini-3-flash'))).toBe('gemini-3-flash');
    expect(pickDefaultModel('openrouter', list('x/y', 'anthropic/claude-sonnet-5'))).toBe('anthropic/claude-sonnet-5');
    expect(pickDefaultModel('custom', list('llama'))).toBe('llama');
    expect(pickDefaultModel('chatgpt', [])).toBeNull();
  });

  it('MCAT-009: of a capable line the newest stable model wins, whatever order the provider lists them in', () => {
    const list = (...ids: string[]) => ids.map((id) => ({ id, label: id, supportsTools: true }));
    expect(
      pickDefaultModel(
        'gemini',
        list('gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3-flash', 'gemini-2.0-flash'),
      ),
    ).toBe('gemini-3-flash');
    expect(pickDefaultModel('anthropic', list('claude-sonnet-4-5', 'claude-sonnet-5-5', 'claude-sonnet-5'))).toBe(
      'claude-sonnet-5-5',
    );
    expect(pickDefaultModel('openai', list('gpt-4.1-mini', 'gpt-5.5-mini', 'gpt-5-mini'))).toBe('gpt-5.5-mini');
  });

  it('MCAT-011: says which models read images: OpenAI by name, Gemini all, OpenRouter by its input kinds', async () => {
    safeFetch.mockResolvedValueOnce(json(200, { data: [{ id: 'gpt-5-mini' }, { id: 'gpt-4' }, { id: 'o3-mini' }] }));
    const openai = await catalog().list({ kind: 'openai', baseUrl: null, secret: secret() });
    expect(Object.fromEntries(openai.map((m) => [m.id, m.supportsImages]))).toEqual({
      'gpt-4': false,
      'gpt-5-mini': true,
      'o3-mini': false,
    });
    safeFetch.mockResolvedValueOnce(json(200, { data: [{ id: 'models/gemini-3-flash' }] }));
    expect((await catalog().list({ kind: 'gemini', baseUrl: null, secret: secret() }))[0]?.supportsImages).toBe(true);
  });

  it('MCAT-012: a turn tells from the kind and the id alone whether its model reads images', () => {
    expect(modelReadsImages('anthropic', 'claude-sonnet-5')).toBe(true);
    expect(modelReadsImages('gemini', 'gemini-3-flash')).toBe(true);
    expect(modelReadsImages('chatgpt', 'gpt-6.1-sol')).toBe(true);
    expect(modelReadsImages('openai', 'gpt-4o')).toBe(true);
    expect(modelReadsImages('openai', 'gpt-4-0613')).toBe(false);
    expect(modelReadsImages('openai', 'gpt-3.5-turbo')).toBe(false);
    // OpenRouter and a custom server cannot be told from the id: the turn stays on the description.
    expect(modelReadsImages('openrouter', 'anthropic/claude-sonnet-5')).toBe(false);
    expect(modelReadsImages('custom', 'llava')).toBe(false);
  });

  it('MCAT-010: a picker lists the recommended model first and marked, the rest newest first', () => {
    const list = (...ids: string[]) => ids.map((id) => ({ id, label: id, supportsTools: true }));
    expect(
      withRecommendation('gemini', list('gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-pro')).map(
        (m) => [m.id, m.recommended ?? false],
      ),
    ).toEqual([
      ['gemini-3-flash', true],
      ['gemini-3-pro', false],
      // The same version reads in name order.
      ['gemini-2.5-flash', false],
      ['gemini-2.5-pro', false],
    ]);
  });
});
