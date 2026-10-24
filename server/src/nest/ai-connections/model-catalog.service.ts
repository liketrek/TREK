import { safeFetch } from '../../utils/ssrfGuard';
import { DomainError } from '../common/domain-error';
import { LlmLocalService } from '../llm-parse/llm-local.service';
import { AI_BASE_URLS } from './ai-connections.constants';
import { ANTHROPIC_VERSION } from './providers/anthropic-messages.client';
import { AiProviderError } from './providers/provider-errors';
import { refusalOf } from './providers/provider-http';
import { Injectable } from '@nestjs/common';
import type { AiConnectionKind, AiModelInfo } from '@trek/shared';

import { createHash } from 'node:crypto';
import { z } from 'zod';

/** A model list is a few hundred bytes per model; OpenRouter's lists hundreds of them. */
const MAX_LIST_BYTES = 8 * 1024 * 1024;
const LIST_TIMEOUT_MS = 10_000;
/** Which models a provider offers changes rarely; a list is asked again after ten minutes. */
const CACHE_TTL_MS = 10 * 60_000;

/**
 * The models a ChatGPT plan offers when the provider's own list does not
 * answer, or answers empty: it has been unreliable since the preview began.
 */
const CHATGPT_FALLBACK_MODELS = [
  'gpt-6.1-sol',
  'gpt-6-sol',
  'gpt-6-luna',
  'gpt-6-astra',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-5.5',
];

/** OpenAI's list holds every model of the account; these are the ones a chat with tools cannot use. */
const OPENAI_NOT_FOR_CHAT = /(audio|realtime|transcribe|tts|image|search|instruct|embedding|moderation|codex)/;

/**
 * OpenAI chat models that read no images: the first GPT-4 and its dated
 * snapshots, GPT-3.5 and the small reasoning models of the o1 and o3 lines.
 * Every other chat model on the list reads them. A model this misses is
 * caught at run time: the provider refuses the image and the assistant goes
 * on without it.
 */
const OPENAI_TEXT_ONLY = /^(?:gpt-3\.5|gpt-4(?:-0\d{3})?$|o1-mini|o1-preview|o3-mini)/;

/** Whether an OpenAI chat model reads images. */
function openAiReadsImages(id: string): boolean {
  return !OPENAI_TEXT_ONLY.test(id);
}

/**
 * Whether the model a turn runs on reads images, without asking the provider:
 * every current Anthropic and Gemini model and every model of a ChatGPT plan
 * do, OpenAI's by name. OpenRouter's and a custom server's cannot be told
 * from the id alone, so they stay on the page description (journey-studio.md
 * 6, cut 5); the model list still says so for OpenRouter where it can. A
 * model this takes for one that reads images and that refuses one is caught
 * at run time and remembered as text-only.
 */
export function modelReadsImages(kind: AiConnectionKind, model: string): boolean {
  if (kind === 'openai') return openAiReadsImages(model);
  return kind === 'anthropic' || kind === 'gemini' || kind === 'chatgpt';
}

const openAiListSchema = z.object({ data: z.array(z.object({ id: z.string() })) });
const anthropicListSchema = z.object({
  data: z.array(z.object({ id: z.string(), display_name: z.string().optional() })),
});
const openRouterListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      supported_parameters: z.array(z.string()).optional(),
      architecture: z.object({ input_modalities: z.array(z.string()).optional() }).optional(),
      pricing: z.object({ prompt: z.string().optional(), completion: z.string().optional() }).optional(),
    }),
  ),
});
const chatgptListSchema = z.object({
  models: z.array(
    z.object({
      slug: z.string(),
      display_name: z.string().optional(),
      visibility: z.string().optional(),
      supported_in_api: z.boolean().optional(),
    }),
  ),
});

/** What a model list is asked with: the connection's kind, its server and the secret it calls with. */
export interface CatalogTarget {
  kind: AiConnectionKind;
  baseUrl: string | null;
  secret: string | null;
}

/** The version numbers in a model id, in order ("gemini-3.1-flash" reads 3, 1). */
function versionOf(id: string): number[] {
  return (id.match(/\d+(?:\.\d+)*/g) ?? []).flatMap((part) => part.split('.').map(Number));
}

function newerFirst(a: string, b: string): number {
  const va = versionOf(a);
  const vb = versionOf(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (vb[i] ?? 0) - (va[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

/** Ids a provider marks as not settled yet; a default never starts there. */
const UNSTABLE = /(preview|exp|experimental|beta|alpha)/i;

/**
 * The model a new connection starts on, when the user picked none: the
 * newest stable one of a capable, not the most expensive line. Providers list
 * their models in no useful order, so the first match was often an old one.
 */
export function pickDefaultModel(kind: AiConnectionKind, models: AiModelInfo[]): string | null {
  const prefer: Partial<Record<AiConnectionKind, (id: string) => boolean>> = {
    anthropic: (id) => id.includes('sonnet'),
    openai: (id) => /^gpt-[\d.]+-mini$/.test(id),
    gemini: (id) => id.includes('flash') && !id.includes('lite'),
    openrouter: (id) => id.startsWith('anthropic/') && id.includes('sonnet'),
  };
  const preferred = prefer[kind];
  const candidates = preferred ? models.map((m) => m.id).filter((id) => preferred(id) && !UNSTABLE.test(id)) : [];
  return candidates.sort(newerFirst)[0] ?? models[0]?.id ?? null;
}

/** The list as a picker shows it: the recommended model first and marked, the rest newest first. */
export function withRecommendation(kind: AiConnectionKind, models: AiModelInfo[]): AiModelInfo[] {
  const recommended = pickDefaultModel(kind, models);
  const rest = models.filter((m) => m.id !== recommended).sort((a, b) => newerFirst(a.id, b.id));
  const first = models.find((m) => m.id === recommended);
  return first ? [{ ...first, recommended: true }, ...rest] : rest;
}

/**
 * The models a connection can run the assistant on, which doubles as the test
 * of a key: a provider that refuses the list refuses the key. Lists are kept
 * for ten minutes per kind, server and secret (by its hash); a failure is not
 * kept, so a corrected key is asked afresh.
 */
@Injectable()
export class ModelCatalogService {
  private readonly cache = new Map<string, { models: AiModelInfo[]; expires: number }>();

  constructor(private readonly llmLocal: LlmLocalService) {}

  async list(target: CatalogTarget): Promise<AiModelInfo[]> {
    const key = [
      target.kind,
      target.baseUrl ?? '',
      createHash('sha256')
        .update(target.secret ?? '')
        .digest('hex'),
    ].join('\n');
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expires > now) return cached.models;
    const models = withRecommendation(target.kind, await this.fetchList(target));
    this.cache.set(key, { models, expires: now + CACHE_TTL_MS });
    return models;
  }

  private async fetchList(target: CatalogTarget): Promise<AiModelInfo[]> {
    const secret = target.secret ?? '';
    switch (target.kind) {
      case 'anthropic': {
        const body = await this.getJson(target.kind, `${AI_BASE_URLS.anthropic}/v1/models?limit=1000`, {
          'x-api-key': secret,
          'anthropic-version': ANTHROPIC_VERSION,
        });
        return parsed(anthropicListSchema, body).data.map((m) => ({
          id: m.id,
          label: m.display_name ?? m.id,
          supportsTools: true,
          supportsImages: true,
        }));
      }
      case 'openai': {
        const body = await this.getJson(target.kind, `${AI_BASE_URLS.openai}/models`, bearer(secret));
        return parsed(openAiListSchema, body)
          .data.map((m) => m.id)
          .filter((id) => (id.startsWith('gpt-') || /^o\d/.test(id)) && !OPENAI_NOT_FOR_CHAT.test(id))
          .sort()
          .map((id) => ({ id, label: id, supportsTools: true, supportsImages: openAiReadsImages(id) }));
      }
      case 'gemini': {
        const body = await this.getJson(target.kind, `${AI_BASE_URLS.gemini}/models`, bearer(secret));
        return parsed(openAiListSchema, body)
          .data.map((m) => m.id.replace(/^models\//, ''))
          .filter((id) => id.startsWith('gemini') && !/(embedding|image|tts|audio)/.test(id))
          .map((id) => ({ id, label: id, supportsTools: true, supportsImages: true }));
      }
      case 'openrouter': {
        // The model list is public; the key is checked on its own first.
        await this.getJson(target.kind, `${AI_BASE_URLS.openrouter}/key`, bearer(secret));
        const body = await this.getJson(target.kind, `${AI_BASE_URLS.openrouter}/models`, bearer(secret));
        return parsed(openRouterListSchema, body)
          .data.filter((m) => m.supported_parameters?.includes('tools'))
          .map((m) => ({
            id: m.id,
            label: m.name ?? m.id,
            supportsTools: true,
            free: m.pricing?.prompt === '0' && m.pricing?.completion === '0',
            // A model OpenRouter lists without its input kinds is taken as one that reads no images.
            supportsImages: m.architecture?.input_modalities?.includes('image') ?? false,
          }));
      }
      case 'chatgpt':
        return this.chatgptModels(secret);
      case 'custom':
        return this.customModels(target.baseUrl, target.secret);
    }
  }

  private async chatgptModels(accessToken: string): Promise<AiModelInfo[]> {
    let listed: AiModelInfo[] = [];
    try {
      const body = await this.getJson('chatgpt', `${AI_BASE_URLS.chatgpt}/models`, bearer(accessToken));
      listed = parsed(chatgptListSchema, body)
        .models.filter((m) => m.visibility === 'list' && m.supported_in_api !== false)
        .map((m) => chatgptModel(m.slug, m.display_name));
    } catch (err) {
      // A refused sign-in is the answer; anything else falls back to the known list.
      if (err instanceof AiProviderError && !err.retryable && err.code !== 'generic') throw err;
    }
    return listed.length > 0 ? listed : CHATGPT_FALLBACK_MODELS.map((id) => chatgptModel(id));
  }

  private async customModels(baseUrl: string | null, apiKey: string | null): Promise<AiModelInfo[]> {
    try {
      const { models } = await this.llmLocal.listModels(baseUrl ?? undefined, apiKey ?? undefined);
      return models.map((m) => ({ id: m.name, label: m.name, supportsTools: true }));
    } catch (err) {
      if (err instanceof DomainError) throw new AiProviderError('provider_unavailable', err.getStatus(), true);
      throw err;
    }
  }

  private async getJson(kind: AiConnectionKind, url: string, headers: Record<string, string>): Promise<unknown> {
    let res: Response;
    try {
      res = await safeFetch(
        url,
        { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(LIST_TIMEOUT_MS) },
        { maxBytes: MAX_LIST_BYTES },
      );
    } catch {
      throw new AiProviderError('provider_unavailable', 0, true);
    }
    if (!res.ok) throw await refusalOf(kind, res);
    try {
      return (await res.json()) as unknown;
    } catch {
      throw new AiProviderError('provider_unavailable', res.status, true, undefined, 'unreadable_list');
    }
  }
}

/** A model of a ChatGPT plan: every one reads images through the Responses API. */
function chatgptModel(id: string, label?: string): AiModelInfo {
  return { id, label: label ?? id, supportsTools: true, supportsImages: true };
}

function bearer(secret: string): Record<string, string> {
  return { authorization: `Bearer ${secret}` };
}

/** A provider's answer read against the shape it documents; anything else is a provider that misbehaved. */
function parsed<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new AiProviderError('provider_unavailable', 200, true, undefined, 'unreadable_list');
  return result.data;
}
