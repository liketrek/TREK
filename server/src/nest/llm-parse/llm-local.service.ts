import { createHash } from 'node:crypto';
import { Injectable, HttpException } from '@nestjs/common';
import { z } from 'zod';
import { safeFetchLlm } from '../../utils/ssrfGuard';
import { readCappedJson } from '../../utils/cappedFetch';

/** `/api/show` carries the licence and the template: tens of KB, never megabytes. */
const MAX_SHOW_BYTES = 1024 * 1024;
const SHOW_TIMEOUT_MS = 5_000;
/** A model's capabilities only change when it is re-pulled; ten minutes of staleness is harmless. */
const CAPABILITIES_TTL_MS = 10 * 60_000;
/** An unreachable server is asked again soon, so a restart does not cost ten minutes. */
const CAPABILITIES_MISS_TTL_MS = 60_000;

const showResponseSchema = z.object({ capabilities: z.array(z.string()).optional() });

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

  /** List models already pulled on the local server. */
  async listModels(baseUrl: string | undefined): Promise<{ models: { name: string; size: number }[] }> {
    const root = this.ollamaRoot(baseUrl);
    let res: Response;
    try {
      res = await safeFetchLlm(`${root}/api/tags`, { signal: AbortSignal.timeout(10_000) });
    } catch {
      throw new HttpException({ error: `Could not reach local LLM server at ${root}` }, 502);
    }
    if (!res.ok) throw new HttpException({ error: `Local LLM server error (${res.status})` }, 502);
    const data = (await res.json()) as { models?: { name?: string; size?: number }[] };
    const models = (data.models ?? []).map(m => ({ name: m.name ?? '', size: m.size ?? 0 })).filter(m => m.name);
    return { models };
  }

  /**
   * Start a streamed pull. Returns the upstream NDJSON body so the controller can
   * pipe Ollama's progress lines straight to the client.
   */
  async pull(baseUrl: string | undefined, model: string): Promise<ReadableStream<Uint8Array>> {
    if (!model?.trim()) throw new HttpException({ error: 'model is required' }, 400);
    const root = this.ollamaRoot(baseUrl);
    let res: Response;
    try {
      res = await safeFetchLlm(`${root}/api/pull`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: model.trim(), stream: true }),
      });
    } catch {
      throw new HttpException({ error: `Could not reach local LLM server at ${root}` }, 502);
    }
    if (!res.ok || !res.body) throw new HttpException({ error: `Pull failed (${res.status})` }, 502);
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
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
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
