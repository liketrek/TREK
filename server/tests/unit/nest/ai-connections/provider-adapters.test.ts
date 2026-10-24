/**
 * The three chat adapters against recorded-shape streams: what each sends,
 * how it turns a provider's stream (cut into arbitrary chunks) into the
 * neutral events, and how a refusal becomes an AiProviderError. No socket is
 * opened: every adapter is handed a fetch that answers from the fixtures.
 */
import type { AiChatEvent, AiChatRequest } from '../../../../src/nest/ai-connections/ai-chat-client.interface';
import {
  AnthropicMessagesClient,
  markHistoryForCache,
  toAnthropicMessages,
} from '../../../../src/nest/ai-connections/providers/anthropic-messages.client';
import { OpenAiChatClient, toChatMessages } from '../../../../src/nest/ai-connections/providers/openai-chat.client';
import {
  OpenAiResponsesClient,
  toResponsesInput,
} from '../../../../src/nest/ai-connections/providers/openai-responses.client';
import {
  AiProviderError,
  CHATGPT_USAGE_URL,
  errorCodeOf,
  IMAGE_INPUT_REFUSED,
  isImageRefusal,
  namesImageInput,
  providerFailure,
} from '../../../../src/nest/ai-connections/providers/provider-errors';
import { toProviderSchema, type AiFetch } from '../../../../src/nest/ai-connections/providers/provider-http';

import { describe, expect, it, vi } from 'vitest';

/** An SSE body from whole events, cut every `every` characters so no event arrives in one piece. */
function sseBody(events: unknown[], every = 7): ReadableStream<Uint8Array> {
  const text = events.map((e) => `data: ${typeof e === 'string' ? e : JSON.stringify(e)}\n\n`).join('');
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < text.length; i += every) controller.enqueue(encoder.encode(text.slice(i, i + every)));
      controller.close();
    },
  });
}

function streamResponse(events: unknown[]): Response {
  return new Response(sseBody(events), { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function fetchAnswering(...responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit & { signal: AbortSignal } }> = [];
  const fetcher = vi.fn<AiFetch>(async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error('no more answers');
    return next;
  });
  return { fetcher, calls, body: (i = 0) => JSON.parse(String(calls[i]?.init.body)) as Record<string, unknown> };
}

/** A value deep in a request body, by its path of keys and indexes. */
function dig(value: unknown, ...path: Array<string | number>): unknown {
  return path.reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Record<string | number, unknown>)[key] : undefined),
    value,
  );
}

async function run(stream: AsyncIterable<AiChatEvent>): Promise<AiChatEvent[]> {
  const out: AiChatEvent[] = [];
  for await (const event of stream) out.push(event);
  return out;
}

async function failure(stream: AsyncIterable<AiChatEvent>): Promise<unknown> {
  return run(stream).then(
    () => null,
    (err: unknown) => err,
  );
}

const TOOL = {
  name: 'create_place',
  description: 'Create a place',
  parameters: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: { name: { type: 'string' }, kind: { const: 'poi' }, lat: { type: 'number', exclusiveMinimum: -91 } },
    required: ['name'],
    additionalProperties: false,
  },
};

const REQUEST: AiChatRequest = {
  system: 'You plan trips.',
  context: 'Trip: Japan, 3 days',
  messages: [
    { role: 'user', text: 'Add Kinkaku-ji' },
    {
      role: 'assistant',
      text: 'Adding it.',
      toolCalls: [{ id: 'call_1', name: 'create_place', args: { name: 'Kinkaku-ji' } }],
    },
    { role: 'tool', toolCallId: 'call_1', name: 'create_place', output: '{"id":7}' },
    { role: 'user', text: 'Thanks' },
  ],
  tools: [TOOL],
  cacheKey: 'thread-12',
};

const signal = () => new AbortController().signal;

describe('provider errors', () => {
  it.each([
    ['anthropic', 401, undefined, 'invalid_key', false],
    ['openai', 403, undefined, 'invalid_key', false],
    ['chatgpt', 401, undefined, 'needs_reauth', false],
    ['chatgpt', 403, undefined, 'not_eligible', false],
    ['chatgpt', 429, 'subscription_sharing_usage_limit_exceeded', 'usage_limit', false],
    ['chatgpt', 403, 'subscription_sharing_user_not_eligible', 'not_eligible', false],
    ['chatgpt', 503, 'subscription_sharing_usage_unavailable', 'provider_unavailable', true],
    ['anthropic', 529, 'overloaded_error', 'provider_unavailable', true],
    ['openai', 429, 'rate_limit_exceeded', 'rate_limited', true],
    ['openai', 500, undefined, 'provider_unavailable', true],
    ['openai', 0, undefined, 'provider_unavailable', true],
    ['openai', 400, 'model_not_found', 'generic', false],
  ] as const)('PERR-001: %s %i %s is %s', (kind, status, code, expected, retryable) => {
    const err = providerFailure(kind, status, code);
    expect(err).toMatchObject({ code: expected, status, retryable });
  });

  it('PERR-002: a used-up ChatGPT plan points at the usage page', () => {
    expect(providerFailure('chatgpt', 429, 'subscription_sharing_usage_limit_exceeded').helpUrl).toBe(
      CHATGPT_USAGE_URL,
    );
  });

  it('PERR-003: the error code is found where each provider puts it', () => {
    expect(errorCodeOf({ error: { code: 'x', type: 'y' } })).toBe('x');
    expect(errorCodeOf({ error: { type: 'overloaded_error' } })).toBe('overloaded_error');
    expect(errorCodeOf({ error: 'invalid_grant' })).toBe('invalid_grant');
    expect(errorCodeOf({ code: 'top' })).toBe('top');
    expect(errorCodeOf({ detail: { code: 'deep' } })).toBe('deep');
    expect(errorCodeOf(null)).toBeUndefined();
    expect(errorCodeOf({})).toBeUndefined();
  });
});

describe('toProviderSchema', () => {
  it('PSCH-001: every provider is spared $schema; Gemini also loses what it refuses and reads const as enum', () => {
    expect(toProviderSchema(TOOL.parameters, 'anthropic')).toEqual({
      type: 'object',
      properties: { name: { type: 'string' }, kind: { const: 'poi' }, lat: { type: 'number', exclusiveMinimum: -91 } },
      required: ['name'],
      additionalProperties: false,
    });
    expect(toProviderSchema(TOOL.parameters, 'gemini')).toEqual({
      type: 'object',
      properties: { name: { type: 'string' }, kind: { enum: ['poi'] }, lat: { type: 'number' } },
      required: ['name'],
    });
  });
});

describe('AnthropicMessagesClient', () => {
  const STREAM = [
    { type: 'message_start', message: { usage: { input_tokens: 10, cache_read_input_tokens: 90, output_tokens: 1 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'On it' } },
    { type: 'content_block_stop', index: 0 },
    {
      type: 'content_block_start',
      index: 1,
      content_block: { type: 'tool_use', id: 'toolu_01', name: 'create_place' },
    },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"name":"Gin' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: 'kaku-ji"}' } },
    { type: 'content_block_stop', index: 1 },
    { type: 'ping' },
    { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 42 } },
    { type: 'message_stop' },
  ];

  it('ANTH-001: sends the instructions and the trip card as cached system blocks, the history alternating', async () => {
    const http = fetchAnswering(streamResponse(STREAM));
    await run(new AnthropicMessagesClient('claude-sonnet', 'sk-ant-key', http.fetcher).stream(REQUEST, signal()));
    expect(http.calls[0]?.url).toBe('https://api.anthropic.com/v1/messages');
    expect(http.calls[0]?.init.headers).toMatchObject({ 'x-api-key': 'sk-ant-key', 'anthropic-version': '2023-06-01' });
    const body = http.body();
    expect(body).toMatchObject({ model: 'claude-sonnet', stream: true });
    expect(body.system).toEqual([
      { type: 'text', text: 'You plan trips.', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'Trip: Japan, 3 days', cache_control: { type: 'ephemeral' } },
    ]);
    expect(dig(body, 'tools', 0, 'input_schema', 'type')).toBe('object');
    expect(dig(body, 'tools', 0, 'input_schema', '$schema')).toBeUndefined();
    expect([0, 1, 2, 3].map((i) => dig(body, 'messages', i, 'role'))).toEqual(['user', 'assistant', 'user', undefined]);
  });

  it('ANTH-006: marks the end of the history and the end of what came before the question for the cache', async () => {
    const http = fetchAnswering(streamResponse(STREAM));
    await run(new AnthropicMessagesClient('m', 'k', http.fetcher).stream(REQUEST, signal()));
    const marked = JSON.stringify(http.body()).match(/cache_control/g) ?? [];
    expect(marked).toHaveLength(4);
    // The question "Thanks" shares its turn with the tool result before it: both carry a mark.
    expect(dig(http.body(), 'messages', 2, 'content')).toEqual([
      { type: 'tool_result', tool_use_id: 'call_1', content: '{"id":7}', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'Thanks', cache_control: { type: 'ephemeral' } },
    ]);
    expect(dig(http.body(), 'messages', 0, 'content', 0, 'cache_control')).toBeUndefined();
  });

  it('ANTH-007: later steps of a turn keep the mark before the question; never more marks than allowed', () => {
    const step = toAnthropicMessages([
      ...REQUEST.messages,
      { role: 'assistant', text: '', toolCalls: [{ id: 'call_2', name: 'list_places', args: {} }] },
      { role: 'tool', toolCallId: 'call_2', name: 'list_places', output: '[]' },
    ]);
    markHistoryForCache(step, 2);
    const marks = step.flatMap((turn, i) =>
      turn.content.flatMap((block, j) => (block.cache_control ? [`${i}.${j}`] : [])),
    );
    expect(marks).toEqual(['2.0', '4.0']);

    const first = toAnthropicMessages([{ role: 'user', text: 'Hi' }]);
    markHistoryForCache(first, 2);
    expect(first[0]?.content).toEqual([{ type: 'text', text: 'Hi', cache_control: { type: 'ephemeral' } }]);

    const none = toAnthropicMessages(REQUEST.messages);
    markHistoryForCache(none, 0);
    expect(JSON.stringify(none)).not.toContain('cache_control');
    const one = toAnthropicMessages(REQUEST.messages);
    markHistoryForCache(one, 1);
    expect(JSON.stringify(one).match(/cache_control/g)).toHaveLength(1);
    markHistoryForCache([], 2);
  });

  it('ANTH-002: a tool result and the next user text share one user turn', () => {
    expect(toAnthropicMessages(REQUEST.messages)[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'call_1', content: '{"id":7}' },
        { type: 'text', text: 'Thanks' },
      ],
    });
    expect(
      toAnthropicMessages([
        { role: 'assistant', text: '', toolCalls: [] },
        { role: 'tool', toolCallId: 'a', name: 'x', output: 'no', isError: true },
      ]),
    ).toEqual([{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'a', content: 'no', is_error: true }] }]);
  });

  it('ANTH-003: streams the text, assembles the tool call from its pieces, then usage and finish', async () => {
    const http = fetchAnswering(streamResponse(STREAM));
    const events = await run(new AnthropicMessagesClient('m', 'k', http.fetcher).stream(REQUEST, signal()));
    expect(events).toEqual([
      { type: 'text-delta', delta: 'On it' },
      { type: 'tool-call', call: { id: 'toolu_01', name: 'create_place', args: { name: 'Ginkaku-ji' } } },
      { type: 'usage', inputTokens: 100, cachedInputTokens: 90, outputTokens: 42 },
      { type: 'finish', reason: 'tool-calls' },
    ]);
  });

  it('ANTH-004: a refused key, an error event and a stream cut short are provider errors', async () => {
    const client = (res: Response) => new AnthropicMessagesClient('m', 'k', fetchAnswering(res).fetcher);
    expect(
      await failure(client(jsonResponse(401, { error: { type: 'authentication_error' } })).stream(REQUEST, signal())),
    ).toMatchObject({ code: 'invalid_key', status: 401 });
    expect(
      await failure(
        client(streamResponse([{ type: 'error', error: { type: 'overloaded_error' } }])).stream(REQUEST, signal()),
      ),
    ).toMatchObject({ code: 'provider_unavailable', providerCode: 'overloaded_error' });
    expect(await failure(client(streamResponse(STREAM.slice(0, 4))).stream(REQUEST, signal()))).toMatchObject({
      code: 'provider_unavailable',
      providerCode: 'stream_cut',
    });
  });

  it('ANTH-005: a network failure is provider_unavailable, an abort stays an abort', async () => {
    const down = new AnthropicMessagesClient('m', 'k', async () => {
      throw new TypeError('fetch failed');
    });
    expect(await failure(down.stream(REQUEST, signal()))).toBeInstanceOf(AiProviderError);

    const controller = new AbortController();
    controller.abort();
    const aborted = new AnthropicMessagesClient('m', 'k', async (_url, init) => {
      init.signal.throwIfAborted();
      return streamResponse(STREAM);
    });
    const err = await failure(aborted.stream(REQUEST, controller.signal));
    expect(err).not.toBeInstanceOf(AiProviderError);
    expect((err as Error).name).toBe('AbortError');
  });
});

describe('OpenAiChatClient', () => {
  const STREAM = [
    { choices: [{ delta: { role: 'assistant', content: 'Sure' } }] },
    { choices: [{ delta: { content: ', adding.' } }] },
    {
      choices: [
        {
          delta: {
            tool_calls: [
              { index: 0, id: 'call_a', type: 'function', function: { name: 'create_place', arguments: '' } },
            ],
          },
        },
      ],
    },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"name":' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"Nijo"}' } }] } }] },
    { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
    { choices: [], usage: { prompt_tokens: 120, prompt_tokens_details: { cached_tokens: 64 }, completion_tokens: 30 } },
    '[DONE]',
  ];

  it('OACH-001: sends the system text first and the history as Chat Completions messages', async () => {
    const http = fetchAnswering(streamResponse(STREAM));
    await run(
      new OpenAiChatClient('openai', 'gpt-5-mini', 'https://api.openai.com/v1', 'sk-key', http.fetcher).stream(
        REQUEST,
        signal(),
      ),
    );
    expect(http.calls[0]?.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(http.calls[0]?.init.headers).toMatchObject({ authorization: 'Bearer sk-key' });
    const body = http.body();
    expect(dig(body, 'messages', 0)).toEqual({ role: 'system', content: 'You plan trips.\n\nTrip: Japan, 3 days' });
    expect(body).toMatchObject({ prompt_cache_key: 'thread-12', stream_options: { include_usage: true } });
    expect(dig(body, 'tools', 0, 'function', 'name')).toBe('create_place');
    expect(toChatMessages(REQUEST).slice(2, 4)).toEqual([
      {
        role: 'assistant',
        content: 'Adding it.',
        tool_calls: [
          { id: 'call_1', type: 'function', function: { name: 'create_place', arguments: '{"name":"Kinkaku-ji"}' } },
        ],
      },
      { role: 'tool', tool_call_id: 'call_1', content: '{"id":7}' },
    ]);
  });

  it('OACH-002: streams the text and assembles the tool call by its index', async () => {
    const events = await run(
      new OpenAiChatClient('openai', 'm', 'https://x', 'k', fetchAnswering(streamResponse(STREAM)).fetcher).stream(
        REQUEST,
        signal(),
      ),
    );
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Sure' },
      { type: 'text-delta', delta: ', adding.' },
      { type: 'tool-call', call: { id: 'call_a', name: 'create_place', args: { name: 'Nijo' } } },
      { type: 'usage', inputTokens: 120, cachedInputTokens: 64, outputTokens: 30 },
      { type: 'finish', reason: 'tool-calls' },
    ]);
  });

  it('OACH-003: Gemini gets its narrower schemas and no cache key; a server without a key sends no header', async () => {
    const gemini = fetchAnswering(streamResponse(['[DONE]']));
    await run(
      new OpenAiChatClient('gemini', 'gemini-flash', 'https://g', 'AIza', gemini.fetcher).stream(REQUEST, signal()),
    );
    expect(gemini.body().prompt_cache_key).toBeUndefined();
    expect(dig(gemini.body(), 'tools', 0, 'function', 'parameters', 'type')).toBe('object');
    expect(dig(gemini.body(), 'tools', 0, 'function', 'parameters', 'additionalProperties')).toBeUndefined();

    const custom = fetchAnswering(streamResponse([{ choices: [{ delta: { content: 'hi' }, finish_reason: 'stop' }] }]));
    const events = await run(
      new OpenAiChatClient('custom', 'llama', 'http://ollama:11434/v1', null, custom.fetcher).stream(
        { ...REQUEST, tools: [] },
        signal(),
      ),
    );
    expect(custom.calls[0]?.init.headers).not.toHaveProperty('authorization');
    expect(custom.body().tools).toBeUndefined();
    // A server that closes after its finish_reason without [DONE] has still finished.
    expect(events.at(-1)).toEqual({ type: 'finish', reason: 'stop' });
  });

  it('OACH-004: a call without id or index gets one, a broken argument list becomes empty', async () => {
    const events = await run(
      new OpenAiChatClient(
        'gemini',
        'm',
        'https://g',
        'k',
        fetchAnswering(
          streamResponse([
            { choices: [{ delta: { tool_calls: [{ function: { name: 'list_places', arguments: '{oops' } }] } }] },
            '[DONE]',
          ]),
        ).fetcher,
      ).stream(REQUEST, signal()),
    );
    expect(events).toContainEqual({ type: 'tool-call', call: { id: 'call_0', name: 'list_places', args: {} } });
  });

  it('OACH-005: an error chunk, a refusal and a stream cut short are provider errors', async () => {
    const client = (res: Response) =>
      new OpenAiChatClient('openrouter', 'm', 'https://o', 'k', fetchAnswering(res).fetcher);
    expect(
      await failure(
        client(streamResponse([{ error: { code: 'server_error', message: 'x' } }])).stream(REQUEST, signal()),
      ),
    ).toMatchObject({ code: 'provider_unavailable' });
    expect(await failure(client(jsonResponse(401, { error: { code: 401 } })).stream(REQUEST, signal()))).toMatchObject({
      code: 'invalid_key',
    });
    expect(
      await failure(client(streamResponse([{ choices: [{ delta: { content: 'half' } }] }])).stream(REQUEST, signal())),
    ).toMatchObject({ providerCode: 'stream_cut' });
  });
});

describe('OpenAiResponsesClient', () => {
  const REASONING = { type: 'reasoning', id: 'rs_1', encrypted_content: 'opaque' };
  const CALL = {
    type: 'function_call',
    id: 'fc_1',
    call_id: 'call_x',
    name: 'create_place',
    namespace: 'trek',
    arguments: '{"name":"Ryoan-ji"}',
  };
  const STREAM = [
    { type: 'response.created', response: {} },
    { type: 'response.output_item.done', item: REASONING },
    { type: 'response.output_text.delta', delta: 'Adding ' },
    { type: 'response.output_text.delta', delta: 'it.' },
    { type: 'response.output_item.done', item: CALL },
    {
      type: 'response.completed',
      response: { usage: { input_tokens: 500, input_tokens_details: { cached_tokens: 400 }, output_tokens: 60 } },
    },
  ];
  const tokens = (...values: string[]) => vi.fn(async (_rejected?: string) => values.shift() ?? 'none');

  it('OARS-001: keeps to the preview: nothing stored, instructions, one described namespace, no output cap', async () => {
    const http = fetchAnswering(streamResponse(STREAM));
    await run(new OpenAiResponsesClient('gpt-6.1-sol', tokens('at-1'), http.fetcher).stream(REQUEST, signal()));
    expect(http.calls[0]?.url).toBe('https://api.openai.com/v1/responses');
    expect(http.calls[0]?.init.headers).toMatchObject({ authorization: 'Bearer at-1', 'session-id': 'thread-12' });
    const body = http.body();
    expect(body).toMatchObject({ model: 'gpt-6.1-sol', store: false, stream: true, instructions: 'You plan trips.' });
    expect(body.max_output_tokens).toBeUndefined();
    expect(body.temperature).toBeUndefined();
    expect(body.prompt_cache_key).toBe('thread-12');
    expect(body.tools).toHaveLength(1);
    expect(dig(body, 'tools', 0)).toMatchObject({ type: 'namespace', name: 'trek', description: 'TREK trip tools' });
    expect(dig(body, 'tools', 0, 'tools', 0)).toMatchObject({ type: 'function', name: 'create_place', strict: false });
    expect(dig(body, 'input', 0)).toEqual({ type: 'message', role: 'developer', content: 'Trip: Japan, 3 days' });
  });

  it('OARS-002: streams text, yields the call, then usage, the items to replay and the finish', async () => {
    const events = await run(
      new OpenAiResponsesClient('m', tokens('at'), fetchAnswering(streamResponse(STREAM)).fetcher).stream(
        REQUEST,
        signal(),
      ),
    );
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Adding ' },
      { type: 'text-delta', delta: 'it.' },
      { type: 'tool-call', call: { id: 'call_x', name: 'create_place', args: { name: 'Ryoan-ji' } } },
      { type: 'usage', inputTokens: 500, cachedInputTokens: 400, outputTokens: 60 },
      { type: 'provider-state', state: { adapter: 'openai-responses', items: [REASONING, CALL] } },
      { type: 'finish', reason: 'tool-calls' },
    ]);
  });

  it('OARS-003b: leaves its own web search calls out of a replay, which the provider cannot resolve without storage', () => {
    const search = {
      type: 'web_search_call',
      id: 'ws_1',
      status: 'completed',
      action: { type: 'search', query: 'Harz' },
    };
    const input = toResponsesInput({
      ...REQUEST,
      context: undefined,
      messages: [
        {
          role: 'assistant',
          text: 'ignored',
          toolCalls: [],
          providerState: { adapter: 'openai-responses', items: [REASONING, search, CALL] },
        },
        { role: 'tool', toolCallId: 'call_x', name: 'create_place', output: 'ok' },
      ],
    });
    expect(input).toEqual([REASONING, CALL, { type: 'function_call_output', call_id: 'call_x', output: 'ok' }]);
  });

  it('OARS-003: replays its own items verbatim and rebuilds another adapter turn from text and calls', () => {
    const input = toResponsesInput({
      ...REQUEST,
      context: undefined,
      messages: [
        {
          role: 'assistant',
          text: 'ignored',
          toolCalls: [],
          providerState: { adapter: 'openai-responses', items: [REASONING, CALL] },
        },
        { role: 'tool', toolCallId: 'call_x', name: 'create_place', output: 'ok' },
        {
          role: 'assistant',
          text: 'Adding it.',
          toolCalls: [{ id: 'call_1', name: 'create_place', args: { name: 'Kinkaku-ji' } }],
        },
      ],
    });
    expect(input).toEqual([
      REASONING,
      CALL,
      { type: 'function_call_output', call_id: 'call_x', output: 'ok' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Adding it.' }] },
      {
        type: 'function_call',
        call_id: 'call_1',
        name: 'create_place',
        namespace: 'trek',
        arguments: '{"name":"Kinkaku-ji"}',
      },
    ]);
  });

  it('OARS-004: a 401 before the stream is answered once with a refreshed token', async () => {
    const http = fetchAnswering(jsonResponse(401, { error: { code: 'invalid_token' } }), streamResponse(STREAM));
    const token = tokens('stale', 'fresh');
    const events = await run(new OpenAiResponsesClient('m', token, http.fetcher).stream(REQUEST, signal()));
    expect(token).toHaveBeenNthCalledWith(2, 'stale');
    expect(http.calls[1]?.init.headers).toMatchObject({ authorization: 'Bearer fresh' });
    expect(events.at(-1)).toEqual({ type: 'finish', reason: 'tool-calls' });

    const twice = fetchAnswering(jsonResponse(401, {}), jsonResponse(401, {}));
    expect(
      await failure(new OpenAiResponsesClient('m', tokens('a', 'b'), twice.fetcher).stream(REQUEST, signal())),
    ).toMatchObject({ code: 'needs_reauth' });
  });

  it('OARS-005: a used-up plan, a failed response and a stream without completion are provider errors', async () => {
    const client = (res: Response) => new OpenAiResponsesClient('m', tokens('at'), fetchAnswering(res).fetcher);
    expect(
      await failure(
        client(jsonResponse(429, { error: { code: 'subscription_sharing_usage_limit_exceeded' } })).stream(
          REQUEST,
          signal(),
        ),
      ),
    ).toMatchObject({ code: 'usage_limit', helpUrl: CHATGPT_USAGE_URL });
    expect(
      await failure(
        client(streamResponse([{ type: 'response.failed', response: { error: { code: 'server_error' } } }])).stream(
          REQUEST,
          signal(),
        ),
      ),
    ).toMatchObject({ code: 'provider_unavailable', providerCode: 'server_error' });
    expect(await failure(client(streamResponse(STREAM.slice(0, 3))).stream(REQUEST, signal()))).toMatchObject({
      providerCode: 'stream_cut',
    });
  });
});

describe('images for a model that reads them', () => {
  const PAGE = { mimeType: 'image/jpeg' as const, data: 'aGVsbG8=' };
  const WITH_IMAGES: AiChatRequest = {
    ...REQUEST,
    messages: [
      { role: 'user', text: 'Tidy page 2', images: [PAGE] },
      {
        role: 'assistant',
        text: '',
        toolCalls: [
          { id: 'call_1', name: 'preview_book_page', args: { spreadId: 'sp-2' } },
          { id: 'call_2', name: 'get_book', args: {} },
        ],
      },
      { role: 'tool', toolCallId: 'call_1', name: 'preview_book_page', output: 'Page 2', images: [PAGE] },
      { role: 'tool', toolCallId: 'call_2', name: 'get_book', output: '{"pages":4}' },
    ],
  };

  it('PIMG-001: Anthropic puts a tool image in its tool_result after the text, a user image before the words', () => {
    const turns = toAnthropicMessages(WITH_IMAGES.messages);
    const image = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'aGVsbG8=' } };
    expect(turns[0]?.content).toEqual([image, { type: 'text', text: 'Tidy page 2' }]);
    expect(turns[2]?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'call_1', content: [{ type: 'text', text: 'Page 2' }, image] },
      { type: 'tool_result', tool_use_id: 'call_2', content: '{"pages":4}' },
    ]);
  });

  it('PIMG-002: Chat Completions keeps the tool message text and sends the step images after its last result', () => {
    const messages = toChatMessages(WITH_IMAGES);
    const part = { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,aGVsbG8=', detail: 'high' } };
    expect(messages[1]).toEqual({ role: 'user', content: [{ type: 'text', text: 'Tidy page 2' }, part] });
    expect(messages.slice(3)).toEqual([
      { role: 'tool', tool_call_id: 'call_1', content: 'Page 2' },
      { role: 'tool', tool_call_id: 'call_2', content: '{"pages":4}' },
      {
        role: 'user',
        content: [{ type: 'text', text: 'The image the call preview_book_page (call_1) produced:' }, part],
      },
    ]);
  });

  it('PIMG-003: the Responses API sends the output as text, then the image in a user message', () => {
    const input = toResponsesInput(WITH_IMAGES);
    const image = { type: 'input_image', image_url: 'data:image/jpeg;base64,aGVsbG8=', detail: 'high' };
    expect(dig(input, 1, 'content', 1)).toEqual(image);
    expect(input.slice(-3)).toEqual([
      { type: 'function_call_output', call_id: 'call_1', output: 'Page 2' },
      { type: 'function_call_output', call_id: 'call_2', output: '{"pages":4}' },
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: 'The image the call preview_book_page (call_1) produced:' }, image],
      },
    ]);
  });

  it('PIMG-004: a history without images reads as it always did, with no extra user message', () => {
    expect(toChatMessages(REQUEST).filter((message) => Array.isArray(message.content))).toEqual([]);
    expect(toAnthropicMessages(REQUEST.messages)[2]?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'call_1', content: '{"id":7}' },
      { type: 'text', text: 'Thanks' },
    ]);
  });

  it('PIMG-005: a refusal over the image carries its own code; other refusals and plan limits do not', async () => {
    const refused = (status: number, body: unknown) => {
      const http = fetchAnswering(jsonResponse(status, body));
      const client = new OpenAiChatClient('openai', 'gpt-4', 'https://o', 'k', http.fetcher);
      return failure(client.stream(WITH_IMAGES, signal()));
    };
    const imageRefusal = await refused(400, { error: { message: 'image_url is only supported by certain models.' } });
    expect(imageRefusal).toMatchObject({ code: 'generic', providerCode: IMAGE_INPUT_REFUSED });
    expect(isImageRefusal(imageRefusal)).toBe(true);
    const other = await refused(400, { error: { code: 'model_not_found', message: 'No such model' } });
    expect(isImageRefusal(other)).toBe(false);
    expect(isImageRefusal(await refused(500, { error: { message: 'image service down' } }))).toBe(false);
    const code = 'subscription_sharing_unsupported_capability';
    const plan = await refused(400, { error: { code, message: 'Image input is not part of this plan' } });
    expect(plan).toMatchObject({ code: 'not_eligible', providerCode: code });
    expect(namesImageInput(422, { message: 'This model does not support vision' })).toBe(true);
    expect(namesImageInput(400, { detail: 'Invalid input_image' })).toBe(true);
    expect(namesImageInput(400, 'image')).toBe(false);
    expect(isImageRefusal(new Error('image'))).toBe(false);
  });
});

describe('web search through the provider', () => {
  const ASK: AiChatRequest = { ...REQUEST, webSearch: true };

  it('WEB-001: the Responses API gets its web_search tool beside the namespace, and tells the search and the cited pages', async () => {
    const SEARCH = {
      type: 'web_search_call',
      id: 'ws_1',
      status: 'completed',
      action: { query: 'harbour restaurants' },
    };
    const MESSAGE = {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: 'Try the harbour.',
          annotations: [
            { type: 'url_citation', url: 'https://www.example.org/harbour', title: 'Harbour guide' },
            { type: 'url_citation', url: 'https://www.example.org/harbour', title: 'Harbour guide' },
            { type: 'url_citation', url: 'ftp://nowhere', title: 'Not a page' },
            { type: 'file_citation', file_id: 'f1' },
          ],
        },
      ],
    };
    const http = fetchAnswering(
      streamResponse([
        { type: 'response.output_item.added', item: { type: 'web_search_call', id: 'ws_1' } },
        { type: 'response.output_item.done', item: SEARCH },
        { type: 'response.output_text.delta', delta: 'Try the harbour.' },
        { type: 'response.output_item.done', item: MESSAGE },
        { type: 'response.completed', response: { usage: {} } },
      ]),
    );
    const client = new OpenAiResponsesClient('m', async () => 'at', http.fetcher);
    expect(client.webSearch).toBe(true);
    const events = await run(client.stream(ASK, signal()));
    expect(dig(http.body(), 'tools', 1)).toEqual({ type: 'web_search' });
    expect(events.filter((e) => e.type === 'web-search' || e.type === 'source')).toEqual([
      { type: 'web-search', query: null },
      { type: 'source', source: { url: 'https://www.example.org/harbour', title: 'Harbour guide' } },
    ]);
    // The search goes back with the rest of the step's items.
    expect(events).toContainEqual({
      type: 'provider-state',
      state: { adapter: 'openai-responses', items: [SEARCH, MESSAGE] },
    });
    // Without tools of its own a request still gets the search.
    const alone = fetchAnswering(streamResponse([{ type: 'response.completed', response: { usage: {} } }]));
    await run(new OpenAiResponsesClient('m', async () => 'at', alone.fetcher).stream({ ...ASK, tools: [] }, signal()));
    expect(alone.body().tools).toEqual([{ type: 'web_search' }]);
    // Without asking for it, none.
    const plain = fetchAnswering(streamResponse([{ type: 'response.completed', response: { usage: {} } }]));
    await run(new OpenAiResponsesClient('m', async () => 'at', plain.fetcher).stream(REQUEST, signal()));
    expect(plain.body().tools).toHaveLength(1);
  });

  it('WEB-002: Anthropic gets its web search server tool, tells the query and the cited pages, and replays the searched answer', async () => {
    const RESULT = {
      type: 'web_search_tool_result',
      tool_use_id: 'srv_1',
      content: [{ type: 'web_search_result', url: 'https://a.example', title: 'A', encrypted_content: 'xyz' }],
    };
    const START = { type: 'message_start', message: { usage: { input_tokens: 10, output_tokens: 1 } } };
    const TEXT = [
      { type: 'content_block_start', index: 2, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 2, delta: { type: 'text_delta', text: 'Eat at A.' } },
      {
        type: 'content_block_delta',
        index: 2,
        delta: {
          type: 'citations_delta',
          citation: { type: 'web_search_result_location', url: 'https://a.example', title: 'A', cited_text: 'x' },
        },
      },
      { type: 'content_block_stop', index: 2 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } },
      { type: 'message_stop' },
    ];
    const STREAM = [
      START,
      {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'server_tool_use', id: 'srv_1', name: 'web_search' },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"query":"Rostock harbour"}' },
      },
      { type: 'content_block_stop', index: 0 },
      { type: 'content_block_start', index: 1, content_block: RESULT },
      { type: 'content_block_stop', index: 1 },
      ...TEXT,
    ];
    const http = fetchAnswering(streamResponse(STREAM));
    const client = new AnthropicMessagesClient('m', 'k', http.fetcher);
    expect(client.webSearch).toBe(true);
    const events = await run(client.stream(ASK, signal()));
    expect(dig(http.body(), 'tools', 1)).toEqual({ type: 'web_search_20250305', name: 'web_search', max_uses: 5 });
    expect(events.filter((e) => e.type !== 'usage')).toEqual([
      { type: 'web-search', query: 'Rostock harbour' },
      { type: 'text-delta', delta: 'Eat at A.' },
      { type: 'source', source: { url: 'https://a.example', title: 'A' } },
      {
        type: 'provider-state',
        state: {
          adapter: 'anthropic-messages',
          blocks: [
            { type: 'server_tool_use', id: 'srv_1', name: 'web_search', input: { query: 'Rostock harbour' } },
            RESULT,
            { type: 'text', text: 'Eat at A.' },
          ],
        },
      },
      { type: 'finish', reason: 'stop' },
    ]);
    const state = events.find((e) => e.type === 'provider-state');
    if (state?.type !== 'provider-state') throw new Error('no state');
    const replayed = toAnthropicMessages([
      { role: 'user', text: 'Where to eat?' },
      { role: 'assistant', text: 'Eat at A.', toolCalls: [], providerState: state.state },
    ]);
    expect(replayed[1]?.content.map((block) => block.type)).toEqual([
      'server_tool_use',
      'web_search_tool_result',
      'text',
    ]);
    // A request that does not ask for the search, and a step that did not search, keep no state.
    const plain = fetchAnswering(streamResponse([START, ...TEXT]));
    const quiet = await run(new AnthropicMessagesClient('m', 'k', plain.fetcher).stream(REQUEST, signal()));
    expect(plain.body().tools).toHaveLength(1);
    expect(quiet.some((e) => e.type === 'provider-state')).toBe(false);
  });

  it('WEB-003: OpenRouter asks its web plugin and tells the cited pages; another Chat Completions provider has no search', async () => {
    const CITE = { type: 'url_citation', url_citation: { url: 'https://a.example', title: 'A' } };
    const STREAM = [
      { choices: [{ delta: { content: 'See A.' } }] },
      { choices: [{ delta: { annotations: [CITE, CITE] }, finish_reason: 'stop' }] },
      '[DONE]',
    ];
    const http = fetchAnswering(streamResponse(STREAM));
    const router = new OpenAiChatClient('openrouter', 'm', 'https://x', 'k', http.fetcher);
    expect(router.webSearch).toBe(true);
    const events = await run(router.stream(ASK, signal()));
    expect(http.body().plugins).toEqual([{ id: 'web', max_results: 5 }]);
    expect(events.filter((e) => e.type === 'source')).toEqual([
      { type: 'source', source: { url: 'https://a.example', title: 'A' } },
    ]);
    const other = fetchAnswering(streamResponse(['[DONE]']));
    const openai = new OpenAiChatClient('openai', 'm', 'https://x', 'k', other.fetcher);
    expect(openai.webSearch).toBe(false);
    await run(openai.stream(ASK, signal()));
    expect(other.body().plugins).toBeUndefined();
  });
});
