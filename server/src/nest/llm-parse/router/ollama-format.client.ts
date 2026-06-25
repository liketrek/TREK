/**
 * Minimal Ollama native-API client used by the extraction router.
 *
 * Why not the OpenAI-compatible `/v1/chat/completions` path the rest of llm-parse uses?
 * Ollama's `/v1` endpoint does NOT faithfully honour OpenAI's `response_format:{json_schema,strict}`
 * (it's passed through loosely — the schema and `strict` flag are effectively ignored).
 * Ollama's OWN `/api/chat` endpoint with a top-level `format: <jsonSchema>` is the path that
 * actually compiles the schema to a GBNF grammar and constrains token sampling. That hard
 * guarantee — valid, type-correct, all-required-fields JSON — is the router's foundation,
 * so the router talks to `/api/chat` directly. (Cloud providers enforce via their own strict
 * tool/response_format and keep using the existing clients.)
 */

const TIMEOUT_MS = 300_000;

export interface EnforcedExtractInput {
  /** Ollama base URL — accepts the addon's `…/v1` form; the `/v1` suffix is stripped. */
  baseUrl: string;
  model: string;
  system: string;
  user: string;
  /** JSON Schema the output is constrained to (grammar-level). */
  schema: Record<string, unknown>;
  apiKey?: string;
  numPredict?: number;
  /** Context window. 8192 fits a typical multi-section booking; raise for long itineraries. */
  numCtx?: number;
}

/** Resolve the native API base from a config base URL that may end in `/v1`. */
export function toNativeBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
}

/** Strip code fences and JSON.parse; returns null on failure. */
function parseJson(content: string | undefined | null): unknown {
  if (!content) return null;
  const stripped = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

/**
 * Run one schema-constrained chat completion against Ollama's native `/api/chat`.
 * Returns the parsed JSON object (constrained to `schema`), or null if the request
 * failed or produced unparseable output.
 */
export async function extractEnforced(input: EnforcedExtractInput): Promise<Record<string, unknown> | null> {
  const url = `${toNativeBase(input.baseUrl)}/api/chat`;
  const body = {
    model: input.model,
    stream: false,
    format: input.schema,
    // Keep the model resident a while so back-to-back imports don't pay the cold load.
    keep_alive: '30m',
    options: { temperature: 0, num_predict: input.numPredict ?? 512, num_ctx: input.numCtx ?? 8192 },
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(input.apiKey ? { authorization: `Bearer ${input.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Ollama /api/chat failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const parsed = parseJson(data.message?.content);
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
}
