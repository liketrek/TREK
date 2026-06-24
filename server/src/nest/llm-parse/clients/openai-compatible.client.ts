import type { LlmExtractionClient, LlmExtractionInput } from '../llm-provider.interface';

// Generous: a local model (Ollama) may cold-load several GB before its first
// token, and longer documents push inference past a minute.
const TIMEOUT_MS = 180_000;
const MAX_TOKENS = 4096;

/**
 * OpenAI-compatible chat-completions client. Covers both the "openai" cloud
 * provider and the "local" provider (Ollama / vLLM / llama.cpp / LM Studio),
 * which all expose `POST {baseUrl}/chat/completions`. Native binaries (PDF) are
 * sent as an OpenAI `file` content part; text goes as a text part. Uses the
 * global fetch (no SDK) to match the codebase's HTTP style.
 */
export class OpenAiCompatibleClient implements LlmExtractionClient {
  async extract(input: LlmExtractionInput): Promise<Record<string, unknown>[]> {
    const base = (input.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
    const url = `${base}/chat/completions`;

    const userContent: unknown[] = [
      { type: 'text', text: input.text ? `${USER_TEXT}\n\n${input.text}` : USER_TEXT },
    ];
    // Only genuine images go natively (as image_url) — OpenAI-compatible servers
    // (notably Ollama) reject `file`/PDF content parts. PDFs reach this client as
    // pre-extracted text (see llm-parse.service.ts), never as bytes.
    if (input.file && input.file.mimeType.startsWith('image/')) {
      const b64 = input.file.data.toString('base64');
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${input.file.mimeType};base64,${b64}` },
      });
    }

    const body = {
      model: input.model,
      max_tokens: MAX_TOKENS,
      // Extraction is a deterministic task — Ollama defaults to 0.7, which makes
      // small models (NuExtract) drop fields or return empty. Pin to 0.
      temperature: 0,
      messages: [
        { role: 'system', content: input.prompt },
        { role: 'user', content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'reservations', schema: input.jsonSchema, strict: false },
      },
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
      throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    return parseReservations(content);
  }
}

const USER_TEXT = 'Extract every travel reservation from the following document as schema.org JSON-LD.';

/** Tolerant parse: strip code fences, JSON.parse, pull `reservations`. `[]` on failure. */
function parseReservations(content: string | undefined | null): Record<string, unknown>[] {
  if (!content) return [];
  const stripped = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return [];
  }
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { reservations?: unknown }).reservations)) {
    return (parsed as { reservations: Record<string, unknown>[] }).reservations;
  }
  return [];
}
