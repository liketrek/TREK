import type {
  AiChatClient,
  AiChatEvent,
  AiChatMessage,
  AiChatRequest,
  AiFinishReason,
  AiImage,
  AiSource,
  AiToolCall,
} from '../ai-chat-client.interface';
import { AiProviderError, errorCodeOf, providerFailure } from './provider-errors';
import {
  asCount,
  asRecord,
  asText,
  openProviderStream,
  parseEventData,
  parseToolArgs,
  toProviderSchema,
  type AiFetch,
} from './provider-http';
import { imageDataUrl, toolImageCaption, toolImagesEndingAt } from './provider-images';
import { readSseEvents } from './sse-lines';
import type { AiConnectionKind } from '@trek/shared';

/** The end of an OpenAI-compatible stream. */
const DONE = '[DONE]';

/**
 * The provider-neutral history as Chat Completions messages, the instructions
 * and the trip card first. A tool message takes no image, so the images of a
 * step's tool results follow its last result as one user message.
 */
export function toChatMessages(request: AiChatRequest): Record<string, unknown>[] {
  const system = [request.system, request.context].filter(Boolean).join('\n\n');
  const out: Record<string, unknown>[] = [{ role: 'system', content: system }];
  request.messages.forEach((message, index) => {
    out.push(toChatMessage(message));
    const withImages = toolImagesEndingAt(request.messages, index);
    if (withImages.length === 0) return;
    const content = withImages.flatMap((tool) => [
      { type: 'text', text: toolImageCaption(tool) },
      ...(tool.images ?? []).map(imagePart),
    ]);
    out.push({ role: 'user', content });
  });
  return out;
}

function imagePart(image: AiImage): Record<string, unknown> {
  return { type: 'image_url', image_url: { url: imageDataUrl(image), detail: image.detail ?? 'high' } };
}

function toChatMessage(message: AiChatMessage): Record<string, unknown> {
  if (message.role === 'user') {
    if (!message.images?.length) return { role: 'user', content: message.text };
    return { role: 'user', content: [{ type: 'text', text: message.text }, ...message.images.map(imagePart)] };
  }
  if (message.role === 'tool') return { role: 'tool', tool_call_id: message.toolCallId, content: message.output };
  return {
    role: 'assistant',
    content: message.text || null,
    ...(message.toolCalls.length > 0
      ? {
          tool_calls: message.toolCalls.map((call) => ({
            id: call.id,
            type: 'function',
            function: { name: call.name, arguments: JSON.stringify(call.args) },
          })),
        }
      : {}),
  };
}

const FINISH_REASONS: Record<string, AiFinishReason> = { tool_calls: 'tool-calls', length: 'length' };

/**
 * The OpenAI-compatible Chat Completions API, streamed: OpenAI itself, Gemini
 * (its `/v1beta/openai` endpoint), OpenRouter and an admin's own server. The
 * kind decides only what a request may carry: Gemini gets its narrower tool
 * schemas, OpenAI the prompt cache key, which the others do not know.
 */
export class OpenAiChatClient implements AiChatClient {
  /** OpenRouter searches the web for any model through its web plugin; the others have no search here. */
  get webSearch(): boolean {
    return this.kind === 'openrouter';
  }

  constructor(
    readonly kind: AiConnectionKind,
    readonly model: string,
    private readonly baseUrl: string,
    private readonly apiKey: string | null,
    private readonly fetcher: AiFetch,
  ) {}

  async *stream(request: AiChatRequest, signal: AbortSignal): AsyncGenerator<AiChatEvent> {
    const body = {
      model: this.model,
      stream: true,
      stream_options: { include_usage: true },
      messages: toChatMessages(request),
      ...(request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: toProviderSchema(tool.parameters, this.kind),
              },
            })),
            tool_choice: 'auto',
          }
        : {}),
      ...(this.kind === 'openai' && request.cacheKey ? { prompt_cache_key: request.cacheKey } : {}),
      ...(request.webSearch && this.webSearch ? { plugins: [{ id: 'web', max_results: 5 }] } : {}),
    };
    const events = await openProviderStream(
      this.fetcher,
      this.kind,
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      },
      signal,
    );

    const turn = new ChatTurn();
    for await (const sse of readSseEvents(events)) {
      if (sse.data.trim() === DONE) {
        turn.done = true;
        break;
      }
      const chunk = parseEventData(sse.data);
      if (!chunk) continue;
      if (chunk.error) throw providerFailure(this.kind, 0, errorCodeOf(chunk));
      const delta = turn.apply(chunk);
      if (delta) yield { type: 'text-delta', delta };
      for (const source of turn.newSources()) yield { type: 'source', source };
    }
    if (!turn.done && !turn.reason) throw new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_cut');
    for (const call of turn.calls()) yield { type: 'tool-call', call };
    yield {
      type: 'usage',
      inputTokens: turn.inputTokens,
      cachedInputTokens: turn.cachedInputTokens,
      outputTokens: turn.outputTokens,
    };
    yield { type: 'finish', reason: turn.finishReason() };
  }
}

/**
 * What one streamed Chat Completions turn has said so far. A tool call
 * arrives in pieces keyed by its index (its id and name in the first, the
 * arguments spread over the rest), so the calls are only complete at the end.
 */
class ChatTurn {
  inputTokens = 0;
  cachedInputTokens = 0;
  outputTokens = 0;
  reason: string | null = null;
  done = false;
  private readonly pending = new Map<number, { id: string; name: string; args: string }>();
  private readonly cited = new Set<string>();
  private fresh: AiSource[] = [];

  /** Takes one chunk in; answers its text, if it carried any. */
  apply(chunk: Record<string, unknown>): string {
    const usage = asRecord(chunk.usage);
    if (chunk.usage) {
      this.inputTokens = asCount(usage.prompt_tokens);
      this.cachedInputTokens = asCount(asRecord(usage.prompt_tokens_details).cached_tokens);
      this.outputTokens = asCount(usage.completion_tokens);
    }
    const choice = asRecord(Array.isArray(chunk.choices) ? chunk.choices[0] : undefined);
    const finish = asText(choice.finish_reason);
    if (finish) this.reason = finish;
    const delta = asRecord(choice.delta);
    // OpenRouter's web plugin names the pages it read as URL annotations of the message.
    const annotations: unknown[] = Array.isArray(delta.annotations) ? delta.annotations : [];
    for (const raw of annotations) {
      const annotation = asRecord(raw);
      const cite = asRecord(annotation.url_citation);
      const url = asText(cite.url);
      if (annotation.type !== 'url_citation' || !/^https?:\/\//.test(url) || this.cited.has(url)) continue;
      this.cited.add(url);
      this.fresh.push({ url, title: asText(cite.title) || url });
    }
    const calls: unknown[] = Array.isArray(delta.tool_calls) ? delta.tool_calls : [];
    calls.forEach((raw, position) => {
      const piece = asRecord(raw);
      const index = typeof piece.index === 'number' ? piece.index : position;
      const fn = asRecord(piece.function);
      const call = this.pending.get(index) ?? { id: '', name: '', args: '' };
      call.id ||= asText(piece.id);
      call.name ||= asText(fn.name);
      call.args += asText(fn.arguments);
      this.pending.set(index, call);
    });
    return asText(delta.content);
  }

  /** The pages cited since the last ask, each once. */
  newSources(): AiSource[] {
    const out = this.fresh;
    this.fresh = [];
    return out;
  }

  calls(): AiToolCall[] {
    return [...this.pending.entries()]
      .sort(([a], [b]) => a - b)
      .filter(([, call]) => call.name)
      .map(([index, call]) => ({ id: call.id || `call_${index}`, name: call.name, args: parseToolArgs(call.args) }));
  }

  finishReason(): AiFinishReason {
    if (this.calls().length > 0) return 'tool-calls';
    return (this.reason && FINISH_REASONS[this.reason]) || 'stop';
  }
}
