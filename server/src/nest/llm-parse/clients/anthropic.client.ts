import type { LlmExtractionClient, LlmExtractionInput } from '../llm-provider.interface';
import { safeFetchLlm } from '../../../utils/ssrfGuard';
import { readEnv } from '../../../app-config';
import { toReservationList } from '../lenient-json';
import { UnreadableLlmResponse } from './openai-compatible.client';

const MAX_TOKENS = 8192;
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Anthropic Messages API client. Structured output via forced tool-use: a single
 * `emit_<rootKey>` tool (`emit_reservations` by default) whose `input_schema` is
 * the caller's schema, with `tool_choice` forcing it — the documented, reliable
 * way to get structured JSON.
 * PDFs go as native base64 `document` blocks (Anthropic reads scanned PDFs), photos
 * as `image` blocks.
 * Raw fetch (no SDK) to match the codebase's HTTP style.
 */
export class AnthropicClient implements LlmExtractionClient {
  async extract(input: LlmExtractionInput): Promise<Record<string, unknown>[]> {
    // The lookbehind pins the run to its own start. Without it `\/+$` restarts at every
    // slash of a trailing run that turns out not to end the string, rescanning to the
    // end each time; the assertion only rules out start positions the leftmost match
    // could never have used, so the trimmed result is unchanged.
    const base = (input.baseUrl ?? 'https://api.anthropic.com').replace(/(?<!\/)\/+$/, '');
    const url = `${base}/v1/messages`;

    const rootKey = input.rootKey ?? 'reservations';
    const toolName = `emit_${rootKey}`;
    const userText = input.userText ?? USER_TEXT;

    const content: unknown[] = [];
    for (const file of input.file ? [input.file, ...(input.pageImages ?? [])] : []) {
      content.push({
        // A photo is an image block; the document block only takes a PDF.
        type: file.mimeType.startsWith('image/') ? 'image' : 'document',
        source: { type: 'base64', media_type: file.mimeType, data: file.data.toString('base64') },
      });
    }
    content.push({
      type: 'text',
      text: input.text ? `${userText}\n\n${input.text}` : userText,
    });

    const body = {
      model: input.model,
      max_tokens: MAX_TOKENS,
      system: input.prompt,
      tools: [
        {
          name: toolName,
          description: `Return the ${rootKey} extracted from the document.`,
          input_schema: input.jsonSchema,
        },
      ],
      tool_choice: { type: 'tool', name: toolName },
      messages: [{ role: 'user', content }],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), readEnv().integrations.llmTimeoutMs);
    let res: Response;
    try {
      // baseUrl is user-configurable — guard it against pointing at the cloud
      // metadata endpoint, while still allowing a local/LAN gateway.
      res = await safeFetchLlm(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': input.apiKey ?? '',
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Anthropic request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      stop_reason?: string;
      content?: { type: string; name?: string; input?: Record<string, unknown> }[];
    };

    if (data.stop_reason === 'refusal') {
      throw new Error('Anthropic declined to process this document');
    }
    // A run that hits the cap stops mid-tool-call, so what arrives is a fragment
    // of the list or nothing at all — and a forced tool that was not called left
    // no list either. Neither is "this document holds no booking", but both came
    // back as [] and reached the person as an empty preview with nothing in the
    // log: the #2375 symptom, on the provider the dropdown offers first.
    if (data.stop_reason === 'max_tokens') {
      throw new UnreadableLlmResponse(
        `the answer was cut off at the ${MAX_TOKENS}-token limit — the document is too long to extract in one pass`,
      );
    }

    const toolUse = data.content?.find(b => b.type === 'tool_use' && b.name === toolName);
    if (!toolUse) throw new UnreadableLlmResponse(`the model answered without calling ${toolName}`);
    return toReservationList(toolUse.input?.[rootKey], rootKey);
  }
}

const USER_TEXT = 'Extract every travel reservation from the following document as schema.org JSON-LD.';
