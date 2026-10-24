/**
 * The agent loop over a fake chat client, fake tools and an in-memory store:
 * reads run and are answered, changes are held (saved before they are
 * announced) and end the turn, refusals go back to the model, and the step
 * limit, a provider failure and a stop end the turn the way the client expects.
 */
import type {
  AiChatClient,
  AiChatEvent,
  AiChatMessage,
  AiChatRequest,
} from '../../../../src/nest/ai-connections/ai-chat-client.interface';
import { AiProviderError } from '../../../../src/nest/ai-connections/ai-chat-client.interface';
import {
  runAgentLoop,
  type AgentDeps,
  type AgentInput,
  type AgentToolRun,
  type HeldCall,
  type StepRecord,
} from '../../../../src/nest/assistant/assistant-agent';
import { buildTripCard } from '../../../../src/nest/assistant/assistant-context';
import { FOLLOW_UPS_ANSWER, followUpsOf } from '../../../../src/nest/assistant/assistant-follow-ups';
import {
  MAX_CARDS_PER_STEP,
  MAX_READS_PER_STEP,
  MAX_STEPS,
  MAX_WRITES_PER_STEP,
} from '../../../../src/nest/assistant/assistant-tools.constants';
import type { AssistantToolKind } from '../../../../src/nest/assistant/assistant-tools.service';
import type { AnswerInput } from '../../../../src/nest/assistant/cards/card-types';
import { UiStreamWriter } from '../../../../src/nest/assistant/ui-stream.writer';
import type { SseStream } from '../../../../src/nest/common/sse-stream';
import {
  ASSISTANT_FOLLOW_UPS_TOOL,
  type AssistantChangePreview,
  type TrekCard,
  type UiStreamChunk,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

type Step = AiChatEvent[] | Error;

/** A client that answers each request with the next scripted step, and remembers what it was asked. */
function scriptedClient(steps: Step[], webSearch = false) {
  const requests: AiChatRequest[] = [];
  const client: AiChatClient = {
    kind: 'openai',
    model: 'fake',
    webSearch,
    async *stream(request: AiChatRequest) {
      requests.push({ ...request, messages: [...request.messages] });
      const step = steps.shift() ?? [{ type: 'finish', reason: 'stop' }];
      if (step instanceof Error) throw step;
      for (const event of step) yield event;
    },
  };
  return { client, requests };
}

const KINDS: Record<string, AssistantToolKind> = {
  list_places: 'read',
  search_place: 'read',
  get_weather: 'read',
  get_place_details: 'read',
  create_place: 'write',
};

/** What the fake tools answer, per tool; anything else fails. */
const ANSWERS: Record<string, unknown> = {
  list_places: { places: [{ id: 5, name: 'Kinkaku-ji' }] },
  search_place: {
    places: [{ name: 'Ginkaku-ji', lat: 35.027, lng: 135.798, google_place_id: 'ChIJg', website: 'https://g.test' }],
  },
  get_weather: { weather: { temp: 20, main: 'Clouds', description: 'cloudy', type: 'climate' } },
  get_place_details: { details: { name: 'Ginkaku-ji' } },
};

function fakeTools() {
  return {
    specs: () => [{ name: 'list_places', description: 'List', parameters: { type: 'object' } }],
    kindOf: (name: string) => KINDS[name] ?? null,
    pinArgs: vi.fn((name: string, args: Record<string, unknown>) => {
      if (args.tripId !== undefined && args.tripId !== 1) return { error: 'wrong trip' };
      const { tripId: _tripId, ...rest } = args;
      return { args: rest };
    }),
    call: vi.fn(async (name: string) =>
      name in ANSWERS ? { ok: true, value: ANSWERS[name] } : { ok: false, value: 'boom' },
    ),
  };
}

function memoryStore() {
  let next = 100;
  const saved: Array<{ rowId: number; step: StepRecord; status: string }> = [];
  const held: Array<{ rowId: number; step: StepRecord; held: HeldCall[] }> = [];
  return {
    saved,
    held,
    store: {
      openStep: vi.fn(async () => next++),
      saveStep: vi.fn(async (rowId: number, step: StepRecord, status: string) => {
        saved.push({ rowId, step, status });
      }),
      holdStep: vi.fn(async (rowId: number, step: StepRecord, calls: HeldCall[]) => {
        held.push({ rowId, step, held: calls });
      }),
    },
  };
}

function chunkStream() {
  const chunks: UiStreamChunk[] = [];
  const stream: SseStream = {
    send: (data) => {
      if (data !== '[DONE]') chunks.push(JSON.parse(data) as UiStreamChunk);
    },
    comment: () => undefined,
    end: () => undefined,
    open: true,
  };
  return { chunks, writer: new UiStreamWriter(stream) };
}

const preview = (toolCallId: string): AssistantChangePreview => ({
  toolCallId,
  verbKey: 'addPlace',
  subject: 'Kinkaku-ji',
  rows: [],
  dayId: null,
  placeIds: [],
  undoable: true,
});

function setup(steps: Step[], overrides: Partial<AgentDeps> = {}, webSearch = false) {
  const { client, requests } = scriptedClient(steps, webSearch);
  const tools = fakeTools();
  const memory = memoryStore();
  const { chunks, writer } = chunkStream();
  let ids = 0;
  const deps: AgentDeps = {
    client,
    tools,
    store: memory.store,
    describe: vi.fn(async (_name: string, id: string) => preview(id)),
    newId: () => `id-${++ids}`,
    quota: null,
    card: buildTripCard(1, 7, { days: [{ id: 41, day_number: 1, date: '2026-06-11' }] }, null, null),
    today: '2026-01-05',
    ...overrides,
  };
  const input: AgentInput = {
    system: 'sys',
    context: 'ctx',
    cacheKey: 'thread-1',
    history: [{ role: 'user', text: 'Plan Friday' }],
    usedCallIds: new Set(),
  };
  return { deps, input, requests, tools, memory, chunks, writer };
}

const types = (chunks: UiStreamChunk[]) => chunks.map((chunk) => chunk.type);

describe('runAgentLoop', () => {
  it('ASTAGT-001: a text answer is one step, saved complete, finished with stop', async () => {
    const t = setup([
      [
        { type: 'text-delta', delta: 'Hello ' },
        { type: 'text-delta', delta: 'there' },
        { type: 'usage', inputTokens: 10, cachedInputTokens: 0, outputTokens: 3 },
        { type: 'finish', reason: 'stop' },
      ],
    ]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome).toEqual({ end: 'stop', code: null, inputTokens: 10, cachedInputTokens: 0, outputTokens: 3 });
    expect(t.memory.saved).toEqual([
      { rowId: 100, step: { parts: [{ type: 'text', text: 'Hello there' }], providerState: null }, status: 'complete' },
    ]);
    expect(types(t.chunks)).toEqual([
      'start-step',
      'text-start',
      'text-delta',
      'text-delta',
      'text-end',
      'finish-step',
      'finish',
    ]);
    expect(t.requests[0]).toMatchObject({ system: 'sys', context: 'ctx', cacheKey: 'thread-1' });
  });

  it('ASTAGT-002: a read runs at once, its answer goes back to the model, and the loop goes on', async () => {
    const t = setup([
      [
        { type: 'tool-call', call: { id: 'toolu_1', name: 'list_places', args: { tripId: 1 } } },
        { type: 'provider-state', state: { adapter: 'openai-responses', items: [{ type: 'function_call' }] } },
        { type: 'usage', inputTokens: 5, cachedInputTokens: 0, outputTokens: 1 },
        { type: 'finish', reason: 'tool-calls' },
      ],
      [
        { type: 'text-delta', delta: 'Found it' },
        { type: 'usage', inputTokens: 7, cachedInputTokens: 5, outputTokens: 2 },
      ],
    ]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome).toEqual({ end: 'stop', code: null, inputTokens: 12, cachedInputTokens: 5, outputTokens: 3 });
    expect(t.tools.call).toHaveBeenCalledWith('list_places', {});
    const second = t.requests[1].messages;
    expect(second[1]).toEqual({
      role: 'assistant',
      text: '',
      toolCalls: [{ id: 'toolu_1', name: 'list_places', args: { tripId: 1 } }],
      providerState: { adapter: 'openai-responses', items: [{ type: 'function_call' }] },
    });
    expect(second[2]).toMatchObject({ role: 'tool', toolCallId: 'toolu_1', name: 'list_places' });
    expect(JSON.parse((second[2] as { output: string }).output)).toEqual({ places: [{ id: 5, name: 'Kinkaku-ji' }] });
    expect(t.memory.saved.map((s) => s.rowId)).toEqual([100, 101]);
    expect(t.memory.saved[0].step.parts).toEqual([
      {
        type: 'tool-call',
        toolCallId: 'toolu_1',
        toolName: 'list_places',
        args: {},
        result: { places: [{ id: 5, name: 'Kinkaku-ji' }] },
      },
    ]);
    expect(types(t.chunks).slice(0, 4)).toEqual([
      'start-step',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
    ]);
  });

  it('ASTAGT-003: a change is held: saved with its card before it is announced, and the turn ends', async () => {
    const t = setup([
      [
        { type: 'text-delta', delta: 'Adding it.' },
        { type: 'tool-call', call: { id: 'toolu_9', name: 'create_place', args: { name: 'Kinkaku-ji' } } },
      ],
    ]);
    t.deps.quota = { used: 3, limit: 50 };
    let announcedBeforeSave = false;
    t.memory.store.holdStep.mockImplementation(async (rowId, step, held) => {
      announcedBeforeSave = t.chunks.some((chunk) => chunk.type === 'tool-approval-request');
      t.memory.held.push({ rowId, step, held });
    });
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome.end).toBe('awaiting');
    expect(announcedBeforeSave).toBe(false);
    expect(t.tools.call).not.toHaveBeenCalled();
    expect(t.memory.held[0].held).toEqual([
      {
        id: 'id-1',
        providerCallId: 'toolu_9',
        toolName: 'create_place',
        args: { name: 'Kinkaku-ji' },
        preview: preview('id-1'),
      },
    ]);
    expect(t.memory.held[0].step.parts).toEqual([
      { type: 'text', text: 'Adding it.' },
      {
        type: 'tool-call',
        toolCallId: 'id-1',
        toolName: 'create_place',
        args: { name: 'Kinkaku-ji' },
        approval: { id: 'id-1' },
      },
      { type: 'data-trek-change', data: preview('id-1') },
    ]);
    expect(types(t.chunks).slice(-7)).toEqual([
      'tool-input-start',
      'tool-input-available',
      'tool-approval-request',
      'data-trek-change',
      'finish-step',
      'data-trek-quota',
      'finish',
    ]);
    expect(t.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
  });

  it('ASTAGT-004: more changes than a step may hold go back to the model as an error', async () => {
    const calls = Array.from({ length: MAX_WRITES_PER_STEP + 1 }, (_, i): AiChatEvent => ({
      type: 'tool-call',
      call: { id: `w${i}`, name: 'create_place', args: { name: `P${i}` } },
    }));
    const t = setup([calls, [{ type: 'text-delta', delta: 'Fewer then.' }]]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome.end).toBe('stop');
    expect(t.memory.store.holdStep).not.toHaveBeenCalled();
    const answers = t.requests[1].messages.filter((m) => m.role === 'tool');
    expect(answers).toHaveLength(MAX_WRITES_PER_STEP + 1);
    expect(answers[0]).toMatchObject({ isError: true });
    expect((answers[0] as { output: string }).output).toContain(`at most ${MAX_WRITES_PER_STEP}`);
  });

  it('ASTAGT-012: lookups past the cap of a step are answered as errors, the first ones run', async () => {
    const calls = Array.from({ length: MAX_READS_PER_STEP + 2 }, (_, i): AiChatEvent => ({
      type: 'tool-call',
      call: { id: `r${i}`, name: 'list_places', args: {} },
    }));
    const t = setup([calls, [{ type: 'text-delta', delta: 'Enough.' }]]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome.end).toBe('stop');
    expect(t.tools.call).toHaveBeenCalledTimes(MAX_READS_PER_STEP);
    const answers = t.requests[1].messages.filter((m) => m.role === 'tool');
    expect(answers).toHaveLength(MAX_READS_PER_STEP + 2);
    expect(answers[MAX_READS_PER_STEP - 1]).not.toHaveProperty('isError');
    expect(answers[MAX_READS_PER_STEP]).toMatchObject({ isError: true });
    expect((answers.at(-1) as { output: string }).output).toContain(`at most ${MAX_READS_PER_STEP}`);
  });

  it('ASTAGT-005: an unknown tool, a foreign trip and a failing read are answered as errors', async () => {
    const t = setup([
      [
        { type: 'tool-call', call: { id: 'a', name: 'delete_trip', args: {} } },
        { type: 'tool-call', call: { id: 'b', name: 'list_places', args: { tripId: 2 } } },
        { type: 'tool-call', call: { id: 'c', name: 'list_places', args: {} } },
      ],
      [{ type: 'text-delta', delta: 'ok' }],
    ]);
    t.tools.call.mockResolvedValueOnce({ ok: false, value: 'Trip not found or access denied.' });
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    const answers = t.requests[1].messages.filter((m) => m.role === 'tool') as Array<{
      output: string;
      isError?: boolean;
    }>;
    expect(answers.map((a) => [a.output, a.isError])).toEqual([
      ['Unknown tool: delete_trip', true],
      ['wrong trip', true],
      ['Trip not found or access denied.', true],
    ]);
    expect(t.tools.call).toHaveBeenCalledTimes(1);
    expect(t.chunks.filter((chunk) => chunk.type === 'tool-output-error')).toHaveLength(3);
  });

  it('ASTAGT-006: a call id the thread used already is replaced', async () => {
    const t = setup([[{ type: 'tool-call', call: { id: 'call_0', name: 'list_places', args: {} } }], []]);
    t.input.usedCallIds.add('call_0');
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    const assistant = t.requests[1].messages[1] as { toolCalls: Array<{ id: string }> };
    expect(assistant.toolCalls[0].id).toBe('call_id-1');
  });

  it('ASTAGT-007: stops after MAX_STEPS steps with max_steps', async () => {
    const reads = Array.from({ length: MAX_STEPS }, (_, i): Step => [
      { type: 'tool-call', call: { id: `r${i}`, name: 'list_places', args: {} } },
    ]);
    const t = setup(reads);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome).toMatchObject({ end: 'max_steps', code: 'max_steps' });
    expect(t.requests).toHaveLength(MAX_STEPS);
    expect(t.chunks.slice(-2)).toEqual([
      { type: 'error', errorText: 'max_steps' },
      { type: 'finish', finishReason: 'error' },
    ]);
  });

  it('ASTAGT-008: a provider failure saves what came and ends with its code', async () => {
    const t = setup([new AiProviderError('rate_limited', 429, true)]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome).toMatchObject({ end: 'failed', code: 'rate_limited' });
    expect(t.memory.saved).toEqual([{ rowId: 100, step: { parts: [], providerState: null }, status: 'error' }]);
    expect(t.chunks.slice(-2)).toEqual([
      { type: 'error', errorText: 'rate_limited' },
      { type: 'finish', finishReason: 'error' },
    ]);
  });

  it('ASTAGT-009: an unexpected failure reads as generic', async () => {
    const t = setup([new Error('socket hang up')]);
    expect((await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal)).code).toBe('generic');
  });

  it('ASTAGT-010: a stop saves the step as aborted, holds nothing and ends with abort', async () => {
    const controller = new AbortController();
    const t = setup([
      [
        { type: 'text-delta', delta: 'Let me' },
        { type: 'tool-call', call: { id: 'w', name: 'create_place', args: { name: 'X' } } },
      ],
    ]);
    t.deps.describe = vi.fn(async (_name: string, id: string) => {
      controller.abort();
      return preview(id);
    });
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, controller.signal);
    expect(outcome.end).toBe('aborted');
    expect(t.memory.store.holdStep).not.toHaveBeenCalled();
    expect(t.memory.saved[0]).toMatchObject({ status: 'aborted' });
    expect(t.chunks.at(-1)).toEqual({ type: 'abort' });
  });

  it('ASTAGT-013: a search streams where it looks, then its answer, then its cards; the weather comes once a step', async () => {
    const t = setup([
      [
        {
          type: 'tool-call',
          call: { id: 'find', name: 'search_place', args: { query: 'temples', locationBias: { lat: 35, lng: 135.7 } } },
        },
        {
          type: 'tool-call',
          call: { id: 'sky1', name: 'get_weather', args: { lat: 35, lng: 135.7, date: '2026-06-11' } },
        },
        {
          type: 'tool-call',
          call: { id: 'sky2', name: 'get_weather', args: { lat: 35, lng: 135.7, date: '2026-06-12' } },
        },
      ],
      [{ type: 'text-delta', delta: 'Here.' }],
    ]);
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(types(t.chunks).slice(0, 13)).toEqual([
      'start-step',
      'data-trek-activity',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
      'data-trek-places',
      'data-trek-activity',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
      'data-trek-activity',
      'tool-input-start',
      'tool-input-available',
    ]);
    expect(types(t.chunks).filter((type) => type === 'data-trek-weather')).toHaveLength(1);
    const step = t.memory.saved[0].step.parts;
    expect(step.map((part) => part.type)).toEqual([
      'tool-call',
      'data-trek-places',
      'tool-call',
      'tool-call',
      'data-trek-weather',
    ]);
    const places = step.find((part) => part.type === 'data-trek-places');
    expect(places?.type === 'data-trek-places' && places.data.places[0]).toMatchObject({
      ref: 'find:0',
      photoKey: 'ChIJg',
    });
    expect(JSON.stringify(places)).not.toContain('g.test');
    const weather = step.find((part) => part.type === 'data-trek-weather');
    expect(weather?.type === 'data-trek-weather' && weather.data.days).toEqual([
      { dayId: 41, date: '2026-06-11', main: 'Clouds', tempMax: 20, tempMin: null, rainPct: null, kind: 'climate' },
      { dayId: null, date: '2026-06-12', main: 'Clouds', tempMax: 20, tempMin: null, rainPct: null, kind: 'climate' },
    ]);
    const answers = t.requests[1].messages.filter((m) => m.role === 'tool');
    expect(answers).toHaveLength(3);
  });

  it('ASTAGT-014: the weather of a step that proposes changes is kept before the cards, and a failed search makes none', async () => {
    const t = setup([
      [
        {
          type: 'tool-call',
          call: { id: 'sky', name: 'get_weather', args: { lat: 35, lng: 135.7, date: '2026-06-11' } },
        },
        { type: 'tool-call', call: { id: 'gone', name: 'search_place', args: { query: 'x' } } },
        { type: 'tool-call', call: { id: 'w', name: 'create_place', args: { name: 'X' } } },
      ],
    ]);
    t.tools.call.mockImplementation(async (name: string) =>
      name === 'get_weather' ? { ok: true, value: ANSWERS.get_weather } : { ok: false, value: 'Place search failed.' },
    );
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(t.memory.held[0].step.parts.map((part) => part.type)).toEqual([
      'tool-call',
      'tool-call',
      'data-trek-weather',
      'tool-call',
      'data-trek-change',
    ]);
    expect(types(t.chunks)).not.toContain('data-trek-places');
  });

  it('ASTAGT-011: a stop while the provider streams saves the text so far', async () => {
    const controller = new AbortController();
    const client: AiChatClient = {
      kind: 'openai',
      model: 'fake',
      webSearch: false,
      async *stream() {
        yield { type: 'text-delta', delta: 'Half' } as AiChatEvent;
        controller.abort();
        throw new Error('aborted');
      },
    };
    const t = setup([], { client });
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, controller.signal);
    expect(outcome.end).toBe('aborted');
    expect(t.memory.saved).toEqual([
      { rowId: 100, step: { parts: [{ type: 'text', text: 'Half' }], providerState: null }, status: 'aborted' },
    ]);
  });

  it('ASTAGT-015: a details lookup runs only for a google id from the card or a search of this turn', async () => {
    const places = { places: [{ id: 9, name: 'Nishiki', google_place_id: 'ChIJn' }] };
    const card = buildTripCard(1, 7, { days: [] }, places, null);
    const details = (id: string, placeId: string) => ({
      type: 'tool-call' as const,
      call: { id, name: 'get_place_details', args: { placeId } },
    });
    const t = setup(
      [
        [details('c1', 'ChIJN1t_tDeuEmsRUsoyG83frY4'), details('c2', 'ChIJn')],
        [{ type: 'tool-call', call: { id: 'c3', name: 'search_place', args: { query: 'Ginkaku' } } }],
        [details('c4', 'ChIJg')],
        [{ type: 'text-delta', delta: 'Open until five' }],
      ],
      { card },
    );
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(t.tools.call).toHaveBeenCalledTimes(3);
    expect(t.tools.call).toHaveBeenNthCalledWith(1, 'get_place_details', { placeId: 'ChIJn' });
    expect(t.tools.call).toHaveBeenNthCalledWith(3, 'get_place_details', { placeId: 'ChIJg' });
    const refused = t.requests[1].messages.find((m) => m.role === 'tool' && m.toolCallId === 'c1');
    expect(refused).toMatchObject({ isError: true, output: expect.stringContaining('call search_place first') });
  });

  it('ASTAGT-016: a first answer that only announces its lookups is pushed once to make them', async () => {
    const t = setup([
      [{ type: 'text-delta', delta: 'Let me look up the weather first:' }],
      [{ type: 'tool-call', call: { id: 'w1', name: 'get_weather', args: { lat: 1, lng: 2, date: '2026-06-11' } } }],
      [{ type: 'text-delta', delta: 'Rain, so here is an indoor plan...' }],
    ]);
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome.end).toBe('stop');
    expect(t.tools.call).toHaveBeenCalledWith('get_weather', expect.anything());
    expect(t.requests[1].messages.slice(-1)[0]).toMatchObject({ role: 'user', text: expect.stringContaining('now') });
    // Only once: the third answer ends on an ellipsis too and still ends the turn.
    expect(t.requests).toHaveLength(3);
  });

  it('ASTAGT-017: an empty answer gets one push without an empty message in the history; a second one is an error', async () => {
    const recovered = setup([
      [{ type: 'tool-call', call: { id: 's1', name: 'search_place', args: { query: 'Sushi' } } }],
      [{ type: 'finish', reason: 'stop' }],
      [{ type: 'text-delta', delta: 'Here are three for tonight.' }],
    ]);
    expect(
      (await runAgentLoop(recovered.deps, recovered.input, recovered.writer, new AbortController().signal)).end,
    ).toBe('stop');
    const pushed = recovered.requests[2].messages;
    expect(pushed.at(-1)).toMatchObject({ role: 'user', text: expect.stringContaining('came back empty') });
    expect(pushed.at(-2)).toMatchObject({ role: 'tool', toolCallId: 's1' });

    const stuck = setup([[{ type: 'finish', reason: 'stop' }], [{ type: 'finish', reason: 'stop' }]]);
    const outcome = await runAgentLoop(stuck.deps, stuck.input, stuck.writer, new AbortController().signal);
    expect(outcome).toMatchObject({ end: 'failed', code: 'empty_answer' });
    expect(stuck.chunks).toContainEqual({ type: 'error', errorText: 'empty_answer' });
  });

  it('ASTAGT-018: an answer cut off by the length limit is pushed to go on', async () => {
    const t = setup([
      [
        { type: 'text-delta', delta: 'Day 1: Senso-ji, then' },
        { type: 'finish', reason: 'length' },
      ],
      [{ type: 'text-delta', delta: ' Skytree in the evening.' }],
    ]);
    expect((await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal)).end).toBe('stop');
    expect(t.requests[1].messages.slice(-2)).toMatchObject([
      { role: 'assistant', text: 'Day 1: Senso-ji, then' },
      { role: 'user', text: expect.stringContaining('cut off') },
    ]);
  });

  it("ASTAGT-023: a change its gate sends back is that call's error for the model, never held; the next one is", async () => {
    const refusalOf = vi.fn(async (_tool: string, args: Record<string, unknown>) =>
      args.name === 'Broken' ? 'Not proposed yet: two photos overlap' : null,
    );
    const t = setup(
      [
        [
          { type: 'tool-call', call: { id: 'w1', name: 'create_place', args: { name: 'Broken' } } },
          { type: 'tool-call', call: { id: 'r1', name: 'list_places', args: {} } },
        ],
        [{ type: 'tool-call', call: { id: 'w2', name: 'create_place', args: { name: 'Fixed' } } }],
      ],
      { refusalOf },
    );
    const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(outcome.end).toBe('awaiting');
    // Only changes are asked about, each with the arguments it would be held with.
    expect(refusalOf.mock.calls).toEqual([
      ['create_place', { name: 'Broken' }],
      ['create_place', { name: 'Fixed' }],
    ]);
    expect(t.deps.describe).toHaveBeenCalledTimes(1);
    const sentBack = t.requests[1].messages.find((m) => m.role === 'tool' && m.toolCallId === 'w1');
    expect(sentBack).toMatchObject({ isError: true, output: expect.stringContaining('two photos overlap') });
    expect(t.chunks).toContainEqual({ type: 'tool-output-error', toolCallId: 'w1', errorText: expect.any(String) });
    expect(t.memory.held[0]?.held.map((call) => call.args)).toEqual([{ name: 'Fixed' }]);
  });

  describe('answer cards', () => {
    /** A card as a package would build it; its fields do not matter to the loop. */
    const CARD = { kind: 'tourList' } as TrekCard;
    const read = (id: string) => ({ type: 'tool-call' as const, call: { id, name: 'list_places', args: {} } });

    it('ASTAGT-019: a read card follows its answer in the stream and its call in the step, built from the raw value', async () => {
      const raw = { places: [{ id: 5, name: 'Kinkaku-ji', email: 'desk@kinkaku.test' }] };
      const answerCard = vi.fn((_tool: string, _input: AnswerInput) => CARD);
      const t = setup([[read('c1')], [{ type: 'text-delta', delta: 'Done.' }]], { answerCard });
      t.tools.call.mockImplementation(async () => ({ ok: true, value: raw }));
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(answerCard).toHaveBeenCalledWith('list_places', {
        toolCallId: 'c1',
        args: {},
        value: raw,
        card: t.deps.card,
        today: '2026-01-05',
      });
      expect(types(t.chunks).slice(0, 6)).toEqual([
        'start-step',
        'tool-input-start',
        'tool-input-available',
        'tool-output-available',
        'data-trek-card',
        'finish-step',
      ]);
      expect(t.chunks[4]).toEqual({ type: 'data-trek-card', data: { toolCallId: 'c1', card: CARD } });
      const [call, card] = t.memory.saved[0].step.parts;
      expect(card).toEqual({ type: 'data-trek-card', data: { toolCallId: 'c1', card: CARD } });
      expect(JSON.stringify(call)).not.toContain('desk@kinkaku.test');
      expect(JSON.stringify(t.requests[1].messages)).not.toContain('desk@kinkaku.test');
    });

    it('ASTAGT-020: a failed read makes no card, and a step shows at most twelve', async () => {
      const answerCard = vi.fn(() => CARD);
      const calls = Array.from({ length: MAX_CARDS_PER_STEP + 2 }, (_, i) => read(`c${i}`));
      const failing = { type: 'tool-call' as const, call: { id: 'bad', name: 'search_place', args: { query: 'x' } } };
      const t = setup([[...calls, failing]], { answerCard });
      t.tools.call.mockImplementation(async (name: string) =>
        name === 'search_place' ? { ok: false, value: 'Place search failed.' } : { ok: true, value: ANSWERS[name] },
      );
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(answerCard).toHaveBeenCalledTimes(MAX_CARDS_PER_STEP + 2);
      expect(types(t.chunks).filter((type) => type === 'data-trek-card')).toHaveLength(MAX_CARDS_PER_STEP);
      const parts = t.memory.saved[0].step.parts;
      expect(parts.filter((part) => part.type === 'data-trek-card')).toHaveLength(MAX_CARDS_PER_STEP);
      expect(parts.filter((part) => part.type === 'tool-call')).toHaveLength(MAX_CARDS_PER_STEP + 3);
    });

    it('ASTAGT-021: no card for a builder that gives none or a call id past 64 characters', async () => {
      const long = `toolu_${'x'.repeat(64)}`;
      const answerCard = vi.fn((_tool: string, input: AnswerInput) => (input.toolCallId === 'none' ? null : CARD));
      const t = setup([[read(long), read('none')]], { answerCard });
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(answerCard).toHaveBeenCalledTimes(1);
      expect(types(t.chunks)).not.toContain('data-trek-card');
    });

    it('ASTAGT-022: without a builder of its own the loop asks the registry, where no core tool has an answer card', async () => {
      const t = setup([[read('c1')], [{ type: 'text-delta', delta: 'Done.' }]]);
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(t.memory.saved[0].step.parts.map((part) => part.type)).toEqual(['tool-call']);
    });
  });

  describe('page images', () => {
    const PAGE = { mimeType: 'image/jpeg' as const, data: 'aGVsbG8=' };
    const VIEW = { spreadId: 'sp-2', bookVersion: 3, width: 1280, height: 640, bytes: 5, description: 'Page 2' };
    const LOOKED: AgentToolRun = { ok: true, value: { description: 'Page 2' }, images: [PAGE, PAGE], view: VIEW };
    const look = (id: string) => ({ type: 'tool-call' as const, call: { id, name: 'list_places', args: {} } });
    const done = (): Step => [{ type: 'text-delta', delta: 'Looks good.' }];
    const vision = () => ({
      refused: vi.fn(),
      afterApply: vi.fn(async (history: readonly AiChatMessage[]) => [...history]),
    });
    const imagesOf = (messages: AiChatMessage[]) =>
      messages.filter((m) => m.role === 'tool').map((m) => (m.role === 'tool' ? (m.images?.length ?? 0) : 0));

    it('ASTAGT-030: a look keeps what it looked at in its step and streams it; one image goes to the next request', async () => {
      const t = setup([[look('c1')], done()], { vision: vision() });
      t.tools.call.mockImplementation(async () => LOOKED);
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      const parts = t.memory.saved[0]?.step.parts ?? [];
      expect(parts.map((part) => part.type)).toEqual(['tool-call', 'data-trek-page-view']);
      expect(parts[1]).toEqual({ type: 'data-trek-page-view', data: VIEW });
      expect(t.chunks).toContainEqual({ type: 'data-trek-page-view', data: VIEW });
      // Never stored, never streamed: the bytes live for the next request.
      expect(JSON.stringify([t.memory.saved, t.chunks])).not.toContain('aGVsbG8=');
      expect(t.requests[1]?.messages.find((m) => m.role === 'tool')).toMatchObject({
        toolCallId: 'c1',
        images: [PAGE],
      });
    });

    it('ASTAGT-031: a request carries the images of the newest three looks, one each; older looks go as their text', async () => {
      const t = setup([[look('c1')], [look('c2')], [look('c3')], [look('c4')], done()], { vision: vision() });
      t.tools.call.mockImplementation(async () => LOOKED);
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(imagesOf(t.requests[1]?.messages ?? [])).toEqual([1]);
      expect(imagesOf(t.requests[4]?.messages ?? [])).toEqual([0, 1, 1, 1]);
    });

    it('ASTAGT-032: a refused image drops the images, tells the vision and asks the step again, once', async () => {
      const refusedImage = new AiProviderError('generic', 400, false, undefined, 'image_input_refused');
      const seeing = vision();
      const t = setup([[look('c1')], refusedImage, done()], { vision: seeing });
      t.tools.call.mockImplementation(async () => LOOKED);
      const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(outcome.end).toBe('stop');
      expect(seeing.refused).toHaveBeenCalledOnce();
      expect(t.requests).toHaveLength(3);
      expect(imagesOf(t.requests[1]?.messages ?? [])).toEqual([1]);
      expect(imagesOf(t.requests[2]?.messages ?? [])).toEqual([0]);
      expect(t.memory.saved.map((row) => row.status)).toEqual(['complete', 'complete']);
    });

    it('ASTAGT-033: another refusal, or one without a vision, ends the turn as before, asked once', async () => {
      const otherRefusal = new AiProviderError('generic', 400, false, undefined, 'model_not_found');
      const seeing = vision();
      const t = setup([[look('c1')], otherRefusal], { vision: seeing });
      t.tools.call.mockImplementation(async () => LOOKED);
      expect((await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal)).end).toBe('failed');
      expect(seeing.refused).not.toHaveBeenCalled();
      expect(t.requests).toHaveLength(2);

      const refusedImage = new AiProviderError('generic', 400, false, undefined, 'image_input_refused');
      const plain = setup([[look('c1')], refusedImage]);
      plain.tools.call.mockImplementation(async () => LOOKED);
      const plainOutcome = await runAgentLoop(plain.deps, plain.input, plain.writer, new AbortController().signal);
      expect(plainOutcome.end).toBe('failed');
      expect(plain.requests).toHaveLength(2);
    });

    it('ASTAGT-034: a turn starts from the history the vision gives back, with views of applied pages', async () => {
      const seeing = vision();
      const seen = { role: 'user' as const, text: 'seen', images: [PAGE] };
      seeing.afterApply.mockImplementation(async (history) => [...history, seen]);
      const t = setup([done()], { vision: seeing });
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(seeing.afterApply).toHaveBeenCalledWith(t.input.history);
      expect(t.requests[0]?.messages.at(-1)).toEqual(seen);
    });
  });

  describe('follow-ups', () => {
    const ask = (id: string, questions: unknown) => ({
      type: 'tool-call' as const,
      call: { id, name: ASSISTANT_FOLLOW_UPS_TOOL, args: { questions } },
    });

    it('ASTAGT-035: an answer that ends on follow-ups is finished: the chips are told and kept, the call answered, the model not asked again', async () => {
      const t = setup([
        [
          { type: 'text-delta', delta: 'Here is the hike.' },
          ask('toolu_9', ['An easier variant', 'What to pack?']),
          { type: 'finish', reason: 'tool-calls' },
        ],
      ]);
      const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(outcome.end).toBe('stop');
      expect(t.requests).toHaveLength(1);
      expect(t.tools.call).not.toHaveBeenCalled();
      expect(t.memory.saved[0].step.parts).toEqual([
        { type: 'text', text: 'Here is the hike.' },
        {
          type: 'tool-call',
          toolCallId: 'toolu_9',
          toolName: ASSISTANT_FOLLOW_UPS_TOOL,
          args: { questions: ['An easier variant', 'What to pack?'] },
          result: FOLLOW_UPS_ANSWER,
        },
        { type: 'data-trek-follow-ups', data: { questions: ['An easier variant', 'What to pack?'] } },
      ]);
      expect(t.chunks).toContainEqual({
        type: 'data-trek-follow-ups',
        data: { questions: ['An easier variant', 'What to pack?'] },
      });
      // Never a step of its own on screen.
      expect(types(t.chunks)).not.toContain('tool-input-start');
    });

    it('ASTAGT-036: follow-ups beside a read are answered with it, so the provider sees every call answered, and the loop goes on', async () => {
      const t = setup([
        [
          { type: 'tool-call', call: { id: 'toolu_1', name: 'list_places', args: { tripId: 1 } } },
          ask('toolu_2', ['Too early']),
          { type: 'finish', reason: 'tool-calls' },
        ],
        [{ type: 'text-delta', delta: 'Done' }],
      ]);
      await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(t.tools.call).toHaveBeenCalledTimes(1);
      const second = t.requests[1].messages;
      const assistant = second[1] as Extract<AiChatMessage, { role: 'assistant' }>;
      expect(assistant.toolCalls.map((call) => call.id)).toEqual(['toolu_1', 'toolu_2']);
      const answered = second.filter((m): m is Extract<AiChatMessage, { role: 'tool' }> => m.role === 'tool');
      expect(answered.map((m) => m.toolCallId).sort()).toEqual(['toolu_1', 'toolu_2']);
      expect(answered.find((m) => m.toolCallId === 'toolu_2')?.output).toContain('Shown to the user');
      expect(t.chunks.some((chunk) => chunk.type === 'data-trek-follow-ups')).toBe(false);
    });

    it('ASTAGT-037: follow-ups without any words still get the push to answer, and empty questions show nothing', async () => {
      const t = setup([
        [ask('toolu_3', ['x']), { type: 'finish', reason: 'tool-calls' }],
        [{ type: 'text-delta', delta: 'Answer' }, ask('toolu_4', ['  ', 42]), { type: 'finish', reason: 'tool-calls' }],
      ]);
      const outcome = await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
      expect(outcome.end).toBe('stop');
      expect(t.requests).toHaveLength(2);
      expect(t.chunks.some((chunk) => chunk.type === 'data-trek-follow-ups')).toBe(false);
    });
  });

  it('ASTAGT-038: followUpsOf trims, drops duplicates and blanks, cuts each to a chip and keeps three', () => {
    const long = 'a'.repeat(200);
    expect(followUpsOf({ questions: [' Easier  one ', 'easier one', '', 7, long, 'Pack', 'Fifth'] })).toEqual({
      questions: ['Easier one', 'a'.repeat(80), 'Pack'],
    });
    expect(followUpsOf({ questions: [] })).toBeNull();
    expect(followUpsOf({})).toBeNull();
  });

  it('ASTAGT-039: a provider web search is a step of its own, the cited pages a part after the text, neither sent back as a call', async () => {
    const t = setup(
      [
        [
          { type: 'web-search', query: 'Rostock harbour restaurants' },
          { type: 'text-delta', delta: 'Eat at the Alter Strom.' },
          { type: 'source', source: { url: 'https://a.example', title: 'A guide' } },
          { type: 'finish', reason: 'stop' },
        ],
      ],
      { webSearch: true },
      true,
    );
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    expect(t.requests[0]?.webSearch).toBe(true);
    expect(t.memory.saved[0]?.step.parts).toEqual([
      {
        type: 'tool-call',
        toolCallId: 'web-id-1',
        toolName: 'web_search',
        args: { query: 'Rostock harbour restaurants' },
        result: 'searched',
      },
      { type: 'text', text: 'Eat at the Alter Strom.' },
      { type: 'data-trek-sources', data: { sources: [{ url: 'https://a.example', title: 'A guide' }] } },
    ]);
    expect(types(t.chunks)).toEqual(
      expect.arrayContaining(['tool-input-available', 'tool-output-available', 'data-trek-sources']),
    );
  });

  it('ASTAGT-040: the search is asked for only where the admin allows it and the provider can search', async () => {
    const off = setup([[{ type: 'finish', reason: 'stop' }]], { webSearch: false }, true);
    await runAgentLoop(off.deps, off.input, off.writer, new AbortController().signal);
    expect(off.requests[0]?.webSearch).toBe(false);
    const unable = setup([[{ type: 'finish', reason: 'stop' }]], { webSearch: true }, false);
    await runAgentLoop(unable.deps, unable.input, unable.writer, new AbortController().signal);
    expect(unable.requests[0]?.webSearch).toBe(false);
  });

  it('ASTAGT-041: a step that searched the web and called a read answers only the read, never the search', async () => {
    const t = setup(
      [
        [
          { type: 'web-search', query: 'Mount Takao trails' },
          { type: 'tool-call', call: { id: 'call_1', name: 'list_places', args: { tripId: 1 } } },
          { type: 'finish', reason: 'tool-calls' },
        ],
        [{ type: 'text-delta', delta: 'Trail 1 up, trail 6 down.' }],
      ],
      { webSearch: true },
      true,
    );
    await runAgentLoop(t.deps, t.input, t.writer, new AbortController().signal);
    const answers = t.requests[1].messages.filter((m) => m.role === 'tool');
    expect(answers.map((m) => (m as { toolCallId: string }).toolCallId)).toEqual(['call_1']);
  });
});
