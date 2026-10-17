import { discardBody, readCappedJson } from '../../utils/cappedFetch';
import { safeFetchLlm } from '../../utils/ssrfGuard';
import { DomainError } from '../common/domain-error';
import { Injectable, HttpException } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { z } from 'zod';

/** `/api/show` carries the licence and the template: tens of KB, never megabytes. */
const MAX_SHOW_BYTES = 1024 * 1024;
const SHOW_TIMEOUT_MS = 5_000;
/** A model's capabilities only change when it is re-pulled; ten minutes of staleness is harmless. */
const CAPABILITIES_TTL_MS = 10 * 60_000;
/** An unreachable server is asked again soon, so a restart does not cost ten minutes. */
const CAPABILITIES_MISS_TTL_MS = 60_000;

const showResponseSchema = z.object({ capabilities: z.array(z.string()).optional() });

/** A model list is a few hundred bytes per model; a megabyte is thousands of them. */
const MAX_LIST_BYTES = 1024 * 1024;
const LIST_TIMEOUT_MS = 10_000;

const tagsResponseSchema = z.object({
  models: z.array(z.object({ name: z.string().optional(), size: z.number().optional() })).optional(),
});
/** The OpenAI-compatible list (`GET /v1/models`) that LM Studio, vLLM and llama.cpp serve. */
const openAiModelsSchema = z.object({ data: z.array(z.object({ id: z.string().optional() })) });

/** The Bearer header the extraction sends, when a key is configured. */
function authHeader(apiKey: string | undefined): Record<string, string> {
  return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}

/**
 * The refusal for an upstream answer that is not ok. A 401 or 403 says what to
 * fix: the key that went along was turned down, or the server wants one and
 * none is saved for this address yet.
 */
function upstreamRefusal(status: number, apiKey: string | undefined, fallback: string): DomainError {
  if (status === 401 || status === 403) {
    return new DomainError(
      502,
      apiKey
        ? `Local LLM server rejected the API key (${status})`
        : `Local LLM server requires an API key (${status}). Save the key for this address first.`,
    );
  }
  return new DomainError(502, fallback);
}

/**
 * Admin helpers for managing a local OpenAI-compatible LLM server (Ollama).
 * Talks to Ollama's *management* API (`/api/tags`, `/api/pull`), which lives at
 * the server root — not the `/v1` OpenAI-compatible path the extraction client
 * uses. Admin-only (guarded at the controller); the base URL is admin-supplied.
 * Requests go through safeFetchLlm, which still allows a localhost/LAN Ollama but
 * blocks the link-local / cloud-metadata range.
 */
@Injectable()
export class LlmLocalService {
  private readonly capabilityCache = new Map<string, { capabilities: string[] | null; expires: number }>();

  /** Derive the Ollama root from a configured base URL (strip a trailing /v1). */
  ollamaRoot(baseUrl: string | undefined): string {
    const raw = (baseUrl ?? 'http://localhost:11434').trim();
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new HttpException({ error: 'Invalid base URL' }, 400);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new HttpException({ error: 'Base URL must be http(s)' }, 400);
    }
    // Trailing slashes are scanned off instead of `/\/+$/`-replaced: that pattern
    // re-walks the slash run from every start position of the admin-supplied URL.
    let end = raw.length;
    while (end > 0 && raw.charCodeAt(end - 1) === 47 /* '/' */) end--;
    return raw.slice(0, end).replace(/\/v1$/, '');
  }

  /**
   * True when two base URLs reach the same server root: the same scheme, host,
   * port and path once `/v1` and trailing slashes are gone. The stored key only
   * ever goes to the address it was saved for, so a mistyped or foreign base URL
   * in the admin form cannot carry it to another host.
   */
  sameServer(a: string | undefined, b: string | undefined): boolean {
    try {
      return new URL(this.ollamaRoot(a)).href === new URL(this.ollamaRoot(b)).href;
    } catch {
      return false;
    }
  }

  /**
   * List models already pulled on the local server. A server without Ollama's
   * `/api/tags` (LM Studio, vLLM, llama.cpp) answers 404 there, so its
   * OpenAI-compatible `/v1/models` is asked instead.
   */
  async listModels(
    baseUrl: string | undefined,
    apiKey?: string,
  ): Promise<{ models: { name: string; size: number }[] }> {
    const root = this.ollamaRoot(baseUrl);
    let res = await this.getModelList(`${root}/api/tags`, root, apiKey);
    let openAi = false;
    if (res.status === 404) {
      const fallback = await this.getModelList(`${root}/v1/models`, root, apiKey);
      if (fallback.ok) {
        discardBody(res);
        res = fallback;
        openAi = true;
      } else {
        // Neither list exists: report the first answer, as before.
        discardBody(fallback);
      }
    }
    if (!res.ok) {
      discardBody(res);
      throw upstreamRefusal(res.status, apiKey, `Local LLM server error (${res.status})`);
    }
    const body = await readCappedJson<unknown>(res, MAX_LIST_BYTES);
    const listed = openAi
      ? openAiModelsSchema.safeParse(body).data?.data.map((m) => ({ name: m.id, size: 0 }))
      : tagsResponseSchema.safeParse(body).data?.models;
    if (!listed) throw new DomainError(502, 'Local LLM server sent an unreadable model list');
    const models = listed.map((m) => ({ name: m.name ?? '', size: m.size ?? 0 })).filter((m) => m.name);
    return { models };
  }

  private async getModelList(url: string, root: string, apiKey: string | undefined): Promise<Response> {
    try {
      return await safeFetchLlm(url, { headers: authHeader(apiKey), signal: AbortSignal.timeout(LIST_TIMEOUT_MS) });
    } catch {
      throw new DomainError(502, `Could not reach local LLM server at ${root}`);
    }
  }

  /**
   * Start a streamed pull. Returns the upstream NDJSON body so the controller can
   * pipe Ollama's progress lines straight to the client.
   */
  async pull(baseUrl: string | undefined, model: string, apiKey?: string): Promise<ReadableStream<Uint8Array>> {
    if (!model?.trim()) throw new HttpException({ error: 'model is required' }, 400);
    const root = this.ollamaRoot(baseUrl);
    let res: Response;
    try {
      // The progress lines stream on to the client for as long as the pull
      // runs, so the body is not capped; LLM_TIMEOUT_MS bounds each pause.
      res = await safeFetchLlm(
        `${root}/api/pull`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...authHeader(apiKey) },
          body: JSON.stringify({ model: model.trim(), stream: true }),
        },
        5,
        null,
      );
    } catch {
      throw new DomainError(502, `Could not reach local LLM server at ${root}`);
    }
    if (!res.ok) {
      discardBody(res);
      throw upstreamRefusal(res.status, apiKey, `Pull failed (${res.status})`);
    }
    if (!res.body) throw new DomainError(502, `Pull failed (${res.status})`);
    return res.body;
  }

  /**
   * What the local server says the model can do (`['completion', 'vision', …]`),
   * or null when it cannot say: a bad URL, a server that is down, a model it
   * does not have, an answer that is not what Ollama sends. Never throws, since
   * every caller treats "unknown" as "no", and remembers the answer per server
   * and model so a page load does not become a request to the model server.
   *
   * The configured key goes along as the same Bearer header the extraction
   * sends: an Ollama behind an auth proxy answered 401 without it, and a model
   * the extraction could reach was never offered a photo. The answer is
   * remembered per key too, by its hash, so a corrected key is asked afresh
   * instead of inheriting the miss of the wrong one.
   */
  async modelCapabilities(baseUrl: string | undefined, model: string, apiKey?: string): Promise<string[] | null> {
    const now = Date.now();
    const keyHash = apiKey ? createHash('sha256').update(apiKey).digest('hex') : '';
    const key = `${baseUrl ?? ''}\n${model}\n${keyHash}`;
    const cached = this.capabilityCache.get(key);
    if (cached && cached.expires > now) return cached.capabilities;

    let capabilities: string[] | null = null;
    try {
      const root = this.ollamaRoot(baseUrl);
      const res = await safeFetchLlm(`${root}/api/show`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader(apiKey) },
        body: JSON.stringify({ model }),
        signal: AbortSignal.timeout(SHOW_TIMEOUT_MS),
      });
      if (res.ok) {
        const parsed = showResponseSchema.safeParse(await readCappedJson<unknown>(res, MAX_SHOW_BYTES));
        if (parsed.success) capabilities = parsed.data.capabilities ?? [];
      } else {
        void res.body?.cancel().catch(() => {});
      }
    } catch {
      capabilities = null;
    }
    this.capabilityCache.set(key, {
      capabilities,
      expires: now + (capabilities ? CAPABILITIES_TTL_MS : CAPABILITIES_MISS_TTL_MS),
    });
    return capabilities;
  }
}
