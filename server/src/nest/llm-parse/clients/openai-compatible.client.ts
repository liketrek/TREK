import type { LlmExtractionClient, LlmExtractionInput } from '../llm-provider.interface';
import { isNuExtractModel, buildNuExtractUserText, nuExtractToKiReservations } from './nuextract';
import { parseLenientJson, toReservationList } from '../lenient-json';
import { safeFetchLlm } from '../../../utils/ssrfGuard';
import { readEnv } from '../../../app-config';

const MAX_TOKENS = 4096;

/**
 * A response the client could not read at all: prose where JSON was asked for,
 * an empty body, an answer that stopped mid-sentence.
 *
 * Its own type because the two callers want opposite things from it. The booking
 * import lets it through, so the per-file catch in llm-parse.service.ts names the
 * file and the person gets a warning instead of an empty preview (#2375); the
 * plugin AI surface, versioned separately and answering an empty value for a
 * model that talks prose since it shipped, swallows exactly this one and nothing
 * else. The Anthropic client raises it too.
 */
export class UnreadableLlmResponse extends Error {}

/** What one attempt differs in. Each field is switched on by a 400 that asked for it. */
interface RequestShape {
  tokenParam: 'max_tokens' | 'max_completion_tokens';
  jsonObject: boolean;
  noResponseFormat: boolean;
  omitTemperature: boolean;
}

/**
 * Does this 400 body say the model refuses an explicit `temperature`?
 * OpenAI: "Unsupported value: 'temperature' does not support 0 with this model.
 * Only the default (1) value is supported."; Azure: "Unsupported parameter:
 * 'temperature' is not supported with this model."
 *
 * The bare word is not enough. Dropping temperature costs the deterministic
 * sampling every small local model depends on, and an error body can mention the
 * word while complaining about something else. When the phrasing is unfamiliar
 * nothing is lost — the request still falls through to the json_object retry,
 * exactly as it does today.
 */
function rejectsTemperature(detail: string): boolean {
  return /temperature/i.test(detail)
    && /unsupported|not supported|does not support|only the default/i.test(detail);
}

/**
 * OpenAI-compatible chat-completions client. Covers both the "openai" cloud
 * provider and the "local" provider (Ollama / vLLM / llama.cpp / LM Studio),
 * which all expose `POST {baseUrl}/chat/completions`. Native binaries (PDF) are
 * sent as an OpenAI `file` content part; text goes as a text part. Uses the
 * global fetch (no SDK) to match the codebase's HTTP style.
 *
 * A NuExtract model (detected by id) takes a different request shape: the JSON
 * template inlined in a single user message, no system prompt and no
 * `response_format` (see ./nuextract.ts) — that's how the fine-tune expects to
 * be driven; the generic instruct path applies to every other model.
 *
 * Structured output is requested as `json_schema` first; servers that only
 * support `json_object` (DeepSeek, Mistral, some vLLM/llama.cpp) reject that
 * with a 400, so the request is retried once in `json_object` mode, and a server
 * that refuses that too gets one last attempt carrying no `response_format` at
 * all — the shape a proxy's `drop_params` produces, and the only one a provider
 * without either grammar can answer (#2375). Two further 400s are answered the
 * same way: `max_tokens` becomes `max_completion_tokens` (#1760), and
 * "temperature is not supported" drops the parameter (#2262).
 *
 * Those retries are a loop over what the server actually said, not a fixed
 * chain. A reasoning model rejects `max_tokens` AND `temperature`, the API names
 * only one parameter per response, and it may name either first — a chain of
 * one-shot ifs survives only one of the two orders. Each remedy applies at most
 * once, so this adds at most four extra requests.
 */
export class OpenAiCompatibleClient implements LlmExtractionClient {
  async extract(input: LlmExtractionInput): Promise<Record<string, unknown>[]> {
    // The lookbehind matches only the first slash of the trailing run. Without it the
    // engine retries from every slash, which is quadratic on a slash-heavy value.
    const base = (input.baseUrl ?? 'https://api.openai.com/v1').replace(/(?<!\/)\/+$/, '');
    const url = `${base}/chat/completions`;
    const nuextract = isNuExtractModel(input.model);

    const userContent: unknown[] = nuextract
      ? [{ type: 'text', text: buildNuExtractUserText(input.text ?? '') }]
      : [{ type: 'text', text: input.text ? `${USER_TEXT}\n\n${input.text}` : USER_TEXT }];
    // Only genuine images go natively (as image_url) — OpenAI-compatible servers
    // (notably Ollama) reject `file`/PDF content parts. PDFs reach this client as
    // pre-extracted text (see llm-parse.service.ts), never as bytes.
    if (!nuextract && input.file && input.file.mimeType.startsWith('image/')) {
      const b64 = input.file.data.toString('base64');
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${input.file.mimeType};base64,${b64}` },
      });
    }

    // The token cap is `max_tokens` for the chat-completions API and for every
    // local server (Ollama/vLLM/llama.cpp), but newer OpenAI models reject it
    // with a 400 and demand `max_completion_tokens`. Start with the broadly
    // supported spelling and swap on that specific rejection (#1760).
    const buildBody = (shape: RequestShape) => {
      const baseBody = {
        model: input.model,
        [shape.tokenParam]: MAX_TOKENS,
        // Extraction is a deterministic task — Ollama defaults to 0.7, which makes
        // small models (NuExtract) drop fields or return empty. Pin to 0, and only
        // leave it out once a server has explicitly rejected the parameter (#2262).
        // The first attempt always carries it, and that is the only one a local
        // server ever sees.
        ...(shape.omitTemperature ? {} : { temperature: 0 }),
        // NuExtract wants the template (in the user turn) to be the only instruction
        // — a system prompt or a json_schema grammar derails it.
        messages: nuextract
          ? [{ role: 'user', content: userContent }]
          : [
              { role: 'system', content: input.prompt },
              { role: 'user', content: userContent },
            ],
      };
      // NuExtract never carries one, and the last rung of the 400 ladder has
      // given it up: the system prompt still dictates the shape, and JSON5 reads
      // back whatever the model made of it.
      if (nuextract || shape.noResponseFormat) return baseBody;
      return {
        ...baseBody,
        response_format: shape.jsonObject
          ? { type: 'json_object' as const }
          : { type: 'json_schema' as const, json_schema: { name: 'reservations', schema: input.jsonSchema, strict: false } },
      };
    };

    const shape: RequestShape = { tokenParam: 'max_tokens', jsonObject: false, noResponseFormat: false, omitTemperature: false };
    const tried = { tokenParam: false, temperature: false, jsonObject: false, noResponseFormat: false };

    let res = await this.send(url, buildBody(shape), input.apiKey);
    let detail = res.ok ? '' : await res.text().catch(() => '');

    // A 400 is the server naming the parameter it dislikes. Apply every remedy it
    // names, and only when it names none fall back to json_object — the unchanged
    // behaviour for servers that reject `json_schema` with an unspecific 400. The
    // system prompt already dictates the exact output shape and mentions JSON,
    // which json_object mode requires.
    while (!res.ok && res.status === 400) {
      let named = false;
      if (!tried.tokenParam && detail.includes('max_completion_tokens')) {
        shape.tokenParam = 'max_completion_tokens';
        tried.tokenParam = true;
        named = true;
      }
      if (!tried.temperature && rejectsTemperature(detail)) {
        shape.omitTemperature = true;
        tried.temperature = true;
        named = true;
      }
      if (!named) {
        // NuExtract sends no response_format at all, so it has nothing to fall
        // back to and the 400 is final.
        if (nuextract || tried.noResponseFormat) break;
        if (tried.jsonObject) {
          shape.noResponseFormat = true;
          tried.noResponseFormat = true;
        } else {
          shape.jsonObject = true;
          tried.jsonObject = true;
        }
      }
      res = await this.send(url, buildBody(shape), input.apiKey);
      detail = res.ok ? '' : await res.text().catch(() => '');
    }

    if (!res.ok) {
      throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    return nuextract ? parseNuExtract(content) : parseReservations(content);
  }

  private async send(url: string, body: unknown, apiKey?: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readEnv().integrations.llmTimeoutMs);
    try {
      // baseUrl is user-configurable — guard it against pointing at the cloud
      // metadata endpoint, while still allowing a local/LAN Ollama.
      return await safeFetchLlm(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Parse a NuExtract response and map its flat template output to KiReservation nodes. */
function parseNuExtract(content: string | undefined | null): Record<string, unknown>[] {
  return nuExtractToKiReservations(readAnswer(content));
}

const USER_TEXT = 'Extract every travel reservation from the following document as schema.org JSON-LD.';

/** Tolerant parse: strip code fences, JSON(5).parse, pull `reservations`. */
function parseReservations(content: string | undefined | null): Record<string, unknown>[] {
  return toReservationList(readAnswer(content));
}

/**
 * What the model answered, or an `UnreadableLlmResponse` when nothing could read it.
 *
 * An empty list is an answer — the document held no booking, and the import says
 * so. A response nobody could read is not that answer, and returning `[]` for it
 * too made a provider that replied with prose, or with nothing at all, look
 * exactly like an empty voucher: no item, no warning, nothing in the log (#2375).
 * So only the unreadable throws; whatever parsed is handed on, and an answer that
 * holds no reservation keeps the old "no reservations found" path.
 */
function readAnswer(content: string | undefined | null): unknown {
  if (!content?.trim()) throw new UnreadableLlmResponse('the model returned an empty response');
  const parsed = parseLenientJson(content);
  if (isReadable(parsed)) return parsed;
  // The response is the booking, so it stays out of a managed operator's log —
  // same split as the extracted text in llm-parse.service.ts.
  const snippet = readEnv().managed.enabled ? '' : `: ${content.trim().slice(0, 200)}`;
  throw new UnreadableLlmResponse(`the model did not answer with JSON${snippet}`);
}

/** A value the parser actually read back, as opposed to prose or a bare scalar. */
function isReadable(value: unknown): boolean {
  if (typeof value === 'string') return isReadable(parseLenientJson(value));
  return Array.isArray(value) || (!!value && typeof value === 'object');
}
