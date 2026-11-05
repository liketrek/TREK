/**
 * Minimal Ollama native-API client used by the extraction router. A server that
 * has no `/api/chat` gets the same extraction over OpenAI-compatible
 * `/chat/completions` instead (see extractOpenAiCompatible below).
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
import { readEnv } from '../../../app-config';
import { safeFetchLlm } from '../../../utils/ssrfGuard';
import { OpenAiCompatibleClient } from '../clients/openai-compatible.client';
import { parseLenientJson } from '../lenient-json';
import type { LlmExtractionFile } from '../llm-provider.interface';

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
  /** Base64 images attached to the user turn, for a vision model reading a photo. */
  images?: string[];
}

/** Resolve the native API base from a config base URL that may end in `/v1`. */
export function toNativeBase(baseUrl: string): string {
  // Trailing slashes come off as a scan, not /\/+$/: that pattern is unanchored at the
  // front, so the engine restarts it at every slash of a run and rescans to the end each
  // time (quadratic — 25s on 200k). Same result: the maximal trailing run goes.
  let end = baseUrl.length;
  while (end > 0 && baseUrl[end - 1] === '/') end--;
  return baseUrl.slice(0, end).replace(/\/v1$/, '');
}

/**
 * The answers that say the server has no `/api/chat` at all, unless the body is
 * Ollama's own 404 for a model it has not pulled (OLLAMA_MISSING_MODEL).
 */
const NOT_OLLAMA_STATUSES = new Set([404, 405, 501]);
const OLLAMA_MISSING_MODEL = /\bmodel\b.*\bnot found\b/i;

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
    // Disable "thinking" for hybrid/reasoning models (Qwen3, etc.): the reasoning tokens
    // collide with the format-grammar constraint here — they produce unparseable output and
    // blow the latency budget on CPU. Ollama ignores this for non-thinking models, so it's safe.
    think: false,
    // Keep the model resident a while so back-to-back imports don't pay the cold load.
    keep_alive: '30m',
    options: { temperature: 0, num_predict: input.numPredict ?? 512, num_ctx: input.numCtx ?? 8192 },
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user, ...(input.images?.length ? { images: input.images } : {}) },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), readEnv().integrations.llmTimeoutMs);
  let res: Response;
  try {
    // baseUrl is user-configurable — guard it against the cloud-metadata range,
    // while still allowing a local/LAN Ollama.
    res = await safeFetchLlm(url, {
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
    if (NOT_OLLAMA_STATUSES.has(res.status) && !OLLAMA_MISSING_MODEL.test(detail))
      return extractOpenAiCompatible(input);
    throw new Error(`Ollama /api/chat failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json().catch(() => null)) as { message?: { content?: string } } | null;
  // LM Studio answers a path it does not serve with 200 and an error object,
  // so an answer without Ollama's `message` is a server of another kind too.
  if (!data || typeof data.message !== 'object') return extractOpenAiCompatible(input);
  const parsed = parseLenientJson(data.message?.content);
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
}

/**
 * The same extraction against an OpenAI-compatible server (Groq, vLLM,
 * LM Studio, a LiteLLM proxy), which the "Own server" connection also names.
 * It goes to `/chat/completions` at the address as entered, the endpoint the
 * assistant chats on, through the client that already handles what such
 * servers refuse (`json_schema`, `max_tokens`, `temperature`). The schema is
 * asked for as a one-element list, the shape that client reads (#2806).
 */
async function extractOpenAiCompatible(input: EnforcedExtractInput): Promise<Record<string, unknown> | null> {
  const [file, ...pageImages] = (input.images ?? []).map(imageFile);
  const list = await new OpenAiCompatibleClient().extract({
    // The shape goes into the prompt as well: the client's later rungs send no
    // schema (json_object, then nothing), and json_object wants the word JSON.
    prompt:
      `${input.system} Answer with JSON only, as {"result": [object]} where the object follows this ` +
      `JSON Schema: ${JSON.stringify(input.schema)}`,
    jsonSchema: {
      type: 'object',
      properties: { result: { type: 'array', items: input.schema } },
      required: ['result'],
    },
    rootKey: 'result',
    userText: input.user,
    model: input.model,
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    file,
    pageImages,
  });
  const first = list[0];
  return first && typeof first === 'object' ? first : null;
}

/** The first characters of a base64 image, per type. Anything else is sent as JPEG. */
const IMAGE_PREFIXES: [string, string][] = [
  ['iVBOR', 'image/png'],
  ['UklGR', 'image/webp'],
  ['R0lGOD', 'image/gif'],
];

/** A base64 image as a file, its type read from its first bytes. */
function imageFile(base64: string): LlmExtractionFile {
  const mimeType = IMAGE_PREFIXES.find(([prefix]) => base64.startsWith(prefix))?.[1] ?? 'image/jpeg';
  return { mimeType, data: Buffer.from(base64, 'base64') };
}
