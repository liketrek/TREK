import type { AiProviderState } from '../../db/json-columns';
import type { AiConnectionKind } from '@trek/shared';

export type { AiProviderState };
export { AiProviderError, isImageRefusal } from './providers/provider-errors';

/** A tool the model may call: its name, what it is for and its arguments as JSON Schema. */
export interface AiToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** A call the model made, with the id the provider gave it and its parsed arguments. */
export interface AiToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/**
 * An image a message carries to a model that reads images (the Studio page
 * the assistant looks at), base64 without line breaks. It lives for one turn
 * in memory; nothing stores it.
 */
export interface AiImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
  detail?: 'low' | 'high';
}

/**
 * The provider-neutral history a turn sends. A tool result answers the call
 * with the same id; an assistant message may carry the items its provider
 * needs replayed verbatim (`providerState`), which an adapter for another
 * provider ignores and rebuilds from the text and the calls instead. A user
 * message or a tool result may carry images; each adapter places them where
 * its provider reads them, and the assistant sends none to a model that reads
 * no images.
 */
export type AiChatMessage =
  | { role: 'user'; text: string; images?: AiImage[] }
  | { role: 'assistant'; text: string; toolCalls: AiToolCall[]; providerState?: AiProviderState | null }
  | { role: 'tool'; toolCallId: string; name: string; output: string; isError?: boolean; images?: AiImage[] };

export interface AiChatRequest {
  /** The standing instructions, the same on every turn of a conversation (cached where the provider can). */
  system: string;
  /** What changes from turn to turn (the trip card), sent after the instructions. */
  context?: string;
  messages: AiChatMessage[];
  tools: AiToolSpec[];
  /** Keeps a conversation on the provider's prompt cache (the thread id). */
  cacheKey?: string;
}

export type AiFinishReason = 'stop' | 'tool-calls' | 'length';

/**
 * What a streamed turn yields, in order: text as it arrives, each tool call
 * once complete, then the token usage, the provider's items to replay (only
 * where it needs them) and the finish. A refusal or a broken stream is thrown
 * as an AiProviderError, never yielded.
 */
export type AiChatEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-call'; call: AiToolCall }
  /** `cachedInputTokens` is the part of `inputTokens` the provider read from its prompt cache. */
  | { type: 'usage'; inputTokens: number; cachedInputTokens: number; outputTokens: number }
  | { type: 'provider-state'; state: AiProviderState }
  | { type: 'finish'; reason: AiFinishReason };

export interface AiChatClient {
  readonly kind: AiConnectionKind;
  readonly model: string;
  stream(request: AiChatRequest, signal: AbortSignal): AsyncIterable<AiChatEvent>;
}
