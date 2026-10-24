import { runningVersion } from '../../../app-config';
import type {
  AiChatClient,
  AiChatEvent,
  AiChatMessage,
  AiChatRequest,
  AiImage,
  AiProviderState,
  AiSource,
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
import { imageDataUrl, toolImageCaption, toolImagesEndingAt } from './provider-images';
import { readSseEvents } from './sse-lines';
import type { AiConnectionKind } from '@trek/shared';

/** The namespace the tools are grouped in, as Sign in with ChatGPT asks for. */
const TOOL_NAMESPACE = 'trek';

/**
 * The access token of a ChatGPT sign-in. `rejected` is the token the provider
 * just refused: the source refreshes it (once, serialized with any other
 * refresh) instead of answering it again.
 */
type ChatgptTokenSource = (rejected?: string) => Promise<string>;

/**
 * The provider-neutral history as Responses API input items. An assistant
 * message this adapter wrote carries its output items, which are replayed as
 * they came (reasoning with its encrypted content, the function calls with
 * their namespace), since `store: false` keeps nothing on the provider's side;
 * its web search calls are not, as the provider cannot resolve them again.
 * One written by another adapter is rebuilt from its text and its calls.
 */
export function toResponsesInput(request: AiChatRequest): Record<string, unknown>[] {
  const input: Record<string, unknown>[] = [];
  if (request.context) input.push({ type: 'message', role: 'developer', content: request.context });
  request.messages.forEach((message, index) => {
    input.push(...toItems(message));
    // A call's output is text; the images of a step's results follow its last one as a user message.
    const withImages = toolImagesEndingAt(request.messages, index);
    if (withImages.length === 0) return;
    const content = withImages.flatMap((tool) => [
      { type: 'input_text', text: toolImageCaption(tool) },
      ...(tool.images ?? []).map(inputImage),
    ]);
    input.push({ type: 'message', role: 'user', content });
  });
  return input;
}

function inputImage(image: AiImage): Record<string, unknown> {
  return { type: 'input_image', image_url: imageDataUrl(image), detail: image.detail ?? 'high' };
}

function toItems(message: AiChatMessage): Record<string, unknown>[] {
  if (message.role === 'user') {
    const images = (message.images ?? []).map(inputImage);
    return [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: message.text }, ...images] }];
  }
  if (message.role === 'tool') {
    return [{ type: 'function_call_output', call_id: message.toolCallId, output: message.output }];
  }
  // A web search the provider ran is left out: with nothing stored it cannot find the call again and
  // refuses the whole request, and what the search found is in the answer's text and its sources.
  if (message.providerState?.adapter === 'openai-responses') {
    return message.providerState.items.filter((item) => item.type !== 'web_search_call');
  }
  return [
    ...(message.text
      ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: message.text }] }]
      : []),
    ...message.toolCalls.map((call) => ({
      type: 'function_call',
      call_id: call.id,
      name: call.name,
      namespace: TOOL_NAMESPACE,
      arguments: JSON.stringify(call.args),
    })),
  ];
}

/**
 * The tools of a request as the Responses API takes them: TREK's in one
 * namespace, and the provider's own web search beside them when asked for.
 */
function toolsOf(request: AiChatRequest, kind: AiConnectionKind): Record<string, unknown> {
  const tools: Record<string, unknown>[] = [];
  if (request.tools.length > 0) {
    tools.push({
      type: 'namespace',
      name: TOOL_NAMESPACE,
      description: 'TREK trip tools',
      tools: request.tools.map((tool) => ({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: toProviderSchema(tool.parameters, kind),
        strict: false,
      })),
    });
  }
  if (request.webSearch) tools.push({ type: 'web_search' });
  return tools.length > 0 ? { tools, tool_choice: 'auto', parallel_tool_calls: true } : {};
}

/** The pages an output message cites, as its text's URL annotations name them. */
function citedSources(item: Record<string, unknown>): AiSource[] {
  if (item.type !== 'message' || !Array.isArray(item.content)) return [];
  return item.content.flatMap((part: unknown) => {
    const annotations = asRecord(part).annotations;
    if (!Array.isArray(annotations)) return [];
    return annotations.flatMap((raw: unknown) => {
      const annotation = asRecord(raw);
      const url = asText(annotation.url);
      if (annotation.type !== 'url_citation' || !/^https?:\/\//.test(url)) return [];
      return [{ url, title: asText(annotation.title) || url }];
    });
  });
}

/**
 * OpenAI's Responses API on a ChatGPT plan (Sign in with ChatGPT). Within the
 * preview's limits: nothing stored, streamed, no output cap or temperature,
 * the instructions as `instructions`, the tools in one namespace that carries
 * a description. A 401 before the stream starts is answered once with a
 * refreshed token; a second one means the sign-in has to be renewed.
 */
export class OpenAiResponsesClient implements AiChatClient {
  readonly kind = 'chatgpt' as const;
  readonly webSearch = true;

  constructor(
    readonly model: string,
    private readonly token: ChatgptTokenSource,
    private readonly fetcher: AiFetch,
  ) {}

  async *stream(request: AiChatRequest, signal: AbortSignal): AsyncGenerator<AiChatEvent> {
    const body = JSON.stringify({
      model: this.model,
      store: false,
      stream: true,
      instructions: request.system,
      input: toResponsesInput(request),
      ...toolsOf(request, this.kind),
      reasoning: { effort: 'low' },
      include: ['reasoning.encrypted_content'],
      ...(request.cacheKey ? { prompt_cache_key: request.cacheKey } : {}),
    });
    const events = await this.open(body, request.cacheKey, signal);

    const items: Record<string, unknown>[] = [];
    const cited = new Set<string>();
    let usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
    let completed = false;
    for await (const sse of readSseEvents(events)) {
      const event = parseEventData(sse.data);
      if (!event) continue;
      if (event.type === 'response.output_text.delta' && asText(event.delta)) {
        yield { type: 'text-delta', delta: asText(event.delta) };
      } else if (event.type === 'response.output_item.added' && asRecord(event.item).type === 'web_search_call') {
        yield { type: 'web-search', query: null };
      } else if (event.type === 'response.output_item.done') {
        const item = asRecord(event.item);
        items.push(item);
        for (const source of citedSources(item)) {
          if (cited.has(source.url)) continue;
          cited.add(source.url);
          yield { type: 'source', source };
        }
        if (item.type === 'function_call') {
          yield {
            type: 'tool-call',
            call: { id: asText(item.call_id), name: asText(item.name), args: parseToolArgs(asText(item.arguments)) },
          };
        }
      } else if (event.type === 'response.completed') {
        const reported = asRecord(asRecord(event.response).usage);
        usage = {
          inputTokens: asCount(reported.input_tokens),
          cachedInputTokens: asCount(asRecord(reported.input_tokens_details).cached_tokens),
          outputTokens: asCount(reported.output_tokens),
        };
        completed = true;
      } else if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') {
        throw providerFailure(this.kind, 0, errorCodeOf(event) ?? errorCodeOf(event.response) ?? asText(event.type));
      }
    }
    if (!completed) throw new AiProviderError('provider_unavailable', 0, true, undefined, 'stream_cut');
    const state: AiProviderState = { adapter: 'openai-responses', items };
    yield { type: 'usage', ...usage };
    yield { type: 'provider-state', state };
    yield { type: 'finish', reason: items.some((item) => item.type === 'function_call') ? 'tool-calls' : 'stop' };
  }

  private async open(body: string, sessionId: string | undefined, signal: AbortSignal) {
    const send = (accessToken: string) =>
      openProviderStream(
        this.fetcher,
        this.kind,
        `${AI_BASE_URLS.chatgpt}/responses`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
            accept: 'text/event-stream',
            'user-agent': `TREK/${runningVersion()}`,
            ...(sessionId ? { 'session-id': sessionId } : {}),
          },
          body,
        },
        signal,
      );
    const accessToken = await this.token();
    try {
      return await send(accessToken);
    } catch (err) {
      if (!(err instanceof AiProviderError) || err.status !== 401) throw err;
      return send(await this.token(accessToken));
    }
  }
}
