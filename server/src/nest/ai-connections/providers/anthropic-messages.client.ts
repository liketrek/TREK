import type {
  AiChatClient,
  AiChatEvent,
  AiChatMessage,
  AiChatRequest,
  AiFinishReason,
  AiImage,
  AiToolCall,
} from '../ai-chat-client.interface';
import { AI_BASE_URLS } from '../ai-connections.constants';
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
import { readSseEvents } from './sse-lines';

export const ANTHROPIC_VERSION = '2023-06-01';
/**
 * The answer cap of one step, which Anthropic requires to be set: the most
 * every current Claude model allows, so it is no limit in practice. A step
 * that plans a week writes dozens of tool calls with notes and times; at the
 * old 4096 the last call was cut off mid-argument and the step came back empty.
 */
const MAX_TOKENS = 32_000;

type ContentBlock = Record<string, unknown>;
type AnthropicMessage = { role: 'user' | 'assistant'; content: ContentBlock[] };

/** An image as a Messages API block: base64 in the request, never a URL. */
function imageBlock(image: AiImage): ContentBlock {
  return { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.data } };
}

/**
 * The provider-neutral history as Messages API turns: a tool result is a
 * `tool_result` block of a user turn, and turns of the same role that follow
 * each other merge into one, since the API wants them alternating. An image
 * of a tool result goes inside that `tool_result`, after its text, where the
 * model reads it as what the tool produced; a user's images go before their
 * words.
 */
export function toAnthropicMessages(messages: AiChatMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = [];
  const push = (role: AnthropicMessage['role'], blocks: ContentBlock[]) => {
    if (blocks.length === 0) return;
    const last = out.at(-1);
    if (last?.role === role) last.content.push(...blocks);
    else out.push({ role, content: blocks });
  };
  for (const message of messages) {
    if (message.role === 'user') {
      push('user', [...(message.images ?? []).map(imageBlock), { type: 'text', text: message.text }]);
    } else if (message.role === 'assistant') {
      push('assistant', [
        ...(message.text ? [{ type: 'text', text: message.text }] : []),
        ...message.toolCalls.map((call) => ({ type: 'tool_use', id: call.id, name: call.name, input: call.args })),
      ]);
    } else {
      const images = (message.images ?? []).map(imageBlock);
      const output = images.length > 0 ? [{ type: 'text', text: message.output }, ...images] : message.output;
      push('user', [
        {
          type: 'tool_result',
          tool_use_id: message.toolCallId,
          content: output,
          ...(message.isError ? { is_error: true } : {}),
        },
      ]);
    }
  }
  return out;
}

/** The most cache breakpoints Anthropic takes in one request; the system blocks use the first ones. */
const MAX_CACHE_BREAKPOINTS = 4;
const CACHED = { type: 'ephemeral' } as const;

/**
 * Marks the history for the prompt cache, with what the system blocks left of
 * the breakpoints: the end of the whole history, which the next step of the
 * turn starts from, and the end of what came before the user's question of
 * this turn, which every step of the turn sends unchanged. The second one
 * still hits when a step added more blocks (many tool calls and their
 * results) than the cache looks back over from the first. The turns are the
 * request's own copies, so they are marked in place.
 */
export function markHistoryForCache(messages: AnthropicMessage[], breakpoints: number): void {
  const blocks = messages.flatMap((message) => message.content.map((block) => ({ role: message.role, block })));
  const last = blocks.at(-1);
  if (!last || breakpoints < 1) return;
  last.block.cache_control = CACHED;
  let question = blocks.length - 1;
  while (question >= 0 && !(blocks[question]?.role === 'user' && blocks[question]?.block.type === 'text')) question--;
  const before = question > 0 ? blocks[question - 1] : undefined;
  if (breakpoints >= 2 && before && before !== last) before.block.cache_control = CACHED;
}

const STOP_REASONS: Record<string, AiFinishReason> = { tool_use: 'tool-calls', max_tokens: 'length' };

/**
 * Anthropic's Messages API, streamed. The instructions and the trip card are
 * two system blocks, each marked for the prompt cache, so the tools and the
 * instructions are read from cache on every later step of a conversation; the
 * history is marked too (markHistoryForCache), so a step reads the turns
 * before it from the cache instead of paying for them again.
 */
export class AnthropicMessagesClient implements AiChatClient {
  readonly kind = 'anthropic' as const;

  constructor(
    readonly model: string,
    private readonly apiKey: string,
    private readonly fetcher: AiFetch,
  ) {}

  async *stream(request: AiChatRequest, signal: AbortSignal): AsyncGenerator<AiChatEvent> {
    const system = [request.system, request.context]
      .filter((text): text is string => !!text)
      .map((text) => ({ type: 'text', text, cache_control: CACHED }));
    const messages = toAnthropicMessages(request.messages);
    markHistoryForCache(messages, MAX_CACHE_BREAKPOINTS - system.length);
    const body = {
      model: this.model,
      max_tokens: MAX_TOKENS,
      stream: true,
      system,
      messages,
      ...(request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              input_schema: toProviderSchema(tool.parameters, this.kind),
            })),
          }
        : {}),
    };
    const events = await openProviderStream(
      this.fetcher,
      this.kind,
      `${AI_BASE_URLS.anthropic}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      },
      signal,
    );

    const turn = new AnthropicTurn();
    for await (const sse of readSseEvents(events)) {
      const event = parseEventData(sse.data);
      if (!event) continue;
      if (event.type === 'error') throw providerFailure(this.kind, 0, errorCodeOf(event));
      const out = turn.apply(event);
      if (out) yield out;
    }
    if (!turn.finished) throw new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_cut');
    yield {
      type: 'usage',
      inputTokens: turn.inputTokens,
      cachedInputTokens: turn.cachedInputTokens,
      outputTokens: turn.outputTokens,
    };
    yield { type: 'finish', reason: turn.reason };
  }
}

/** What one streamed Messages API turn has said so far, fed one event at a time. */
class AnthropicTurn {
  inputTokens = 0;
  cachedInputTokens = 0;
  outputTokens = 0;
  reason: AiFinishReason = 'stop';
  finished = false;
  private readonly blocks = new Map<number, { call?: Omit<AiToolCall, 'args'>; json: string }>();

  /** Takes one event in; answers what the caller learns from it now, if anything. */
  apply(event: Record<string, unknown>): AiChatEvent | null {
    const index = asCount(event.index);
    switch (event.type) {
      case 'message_start': {
        const usage = asRecord(asRecord(event.message).usage);
        this.inputTokens =
          asCount(usage.input_tokens) +
          asCount(usage.cache_creation_input_tokens) +
          asCount(usage.cache_read_input_tokens);
        this.cachedInputTokens = asCount(usage.cache_read_input_tokens);
        this.outputTokens = asCount(usage.output_tokens);
        return null;
      }
      case 'content_block_start': {
        const block = asRecord(event.content_block);
        const call = block.type === 'tool_use' ? { id: asText(block.id), name: asText(block.name) } : undefined;
        this.blocks.set(index, { call, json: '' });
        return null;
      }
      case 'content_block_delta': {
        const delta = asRecord(event.delta);
        if (delta.type === 'text_delta' && asText(delta.text)) return { type: 'text-delta', delta: asText(delta.text) };
        const block = this.blocks.get(index);
        if (delta.type === 'input_json_delta' && block) block.json += asText(delta.partial_json);
        return null;
      }
      case 'content_block_stop': {
        const block = this.blocks.get(index);
        return block?.call ? { type: 'tool-call', call: { ...block.call, args: parseToolArgs(block.json) } } : null;
      }
      case 'message_delta': {
        const stop = asText(asRecord(event.delta).stop_reason);
        if (stop) this.reason = STOP_REASONS[stop] ?? 'stop';
        this.outputTokens = asCount(asRecord(event.usage).output_tokens) || this.outputTokens;
        return null;
      }
      case 'message_stop':
        this.finished = true;
        return null;
      default:
        return null;
    }
  }
}
