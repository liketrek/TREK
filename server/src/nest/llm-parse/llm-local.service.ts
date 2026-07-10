import { Injectable, HttpException } from '@nestjs/common';
import { safeFetchLlm } from '../../utils/ssrfGuard';

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
    return raw.replace(/\/+$/, '').replace(/\/v1$/, '');
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
}
