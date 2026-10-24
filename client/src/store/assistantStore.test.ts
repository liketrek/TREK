/**
 * FE-AI-STORE-001 to FE-AI-STORE-012
 *
 * The store runs a turn end to end against a faked repo: the request it
 * sends, how the stream lands in the chat, and what each way of failing
 * leaves behind (a refused question stays to be sent again, a stopped answer
 * is marked, refused decisions go back to undecided). It never reaches Dexie,
 * so these tests need no database.
 */
import type { AiStatusResponse, AssistantMessage, AssistantThreadResponse, UiStreamChunk } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantRequestError } from '../api/assistant';
import { aiConnectionsRepo } from '../repo/aiConnectionsRepo';
import { assistantRepo } from '../repo/assistantRepo';
import { OnlineOnlyError } from '../repo/onlineOnly';
import { chatOf, useAssistantStore } from './assistantStore';
import { useSettingsStore } from './settingsStore';

const TRIP = 4;
const WRITE_ID = 'c0ffee00-0000-4000-8000-000000000001';

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'openai', model: 'gpt', host: 'api.openai.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'openai', model: 'gpt', host: 'api.openai.com' },
  quota: { used: 2, limit: 50 },
  privacyAcked: false,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

const HELD_TURN: UiStreamChunk[] = [
  { type: 'start', messageId: 'msg-1' },
  { type: 'data-trek-thread', data: { threadId: 7, title: 'Friday' } },
  { type: 'text-delta', id: 't', delta: 'Adding it.' },
  { type: 'tool-input-available', toolCallId: WRITE_ID, toolName: 'create_todo', input: { name: 'Tickets' } },
  { type: 'tool-approval-request', approvalId: WRITE_ID, toolCallId: WRITE_ID },
  { type: 'data-trek-quota', data: { used: 3, limit: 50 } },
  { type: 'finish', finishReason: 'tool-calls' },
];

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

/**
 * A stream that sends `first` and then waits until its request is aborted. An
 * abort that came before it got that far ends it at once: the event fired
 * already, and a listener added after it would wait for ever.
 */
async function* hangingStream(first: UiStreamChunk[], signal: AbortSignal): AsyncGenerator<UiStreamChunk> {
  yield* first;
  await new Promise((_, reject) => {
    const stop = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) stop();
    else signal.addEventListener('abort', stop);
  });
}

const chat = () => chatOf(useAssistantStore.getState(), TRIP);
const store = () => useAssistantStore.getState();

async function heldTurn() {
  vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));
  await store().send(TRIP, 'Add tickets');
}

beforeEach(() => {
  useAssistantStore.setState({
    status: null,
    window: { open: false, minimized: false },
    byTrip: {},
    lastApplied: null,
  });
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, language: 'de' } }));
});
afterEach(() => vi.restoreAllMocks());

describe('assistantStore: a turn', () => {
  it('FE-AI-STORE-001: sends the question with the context and folds the answer into the chat', async () => {
    useAssistantStore.setState({ status: STATUS });
    store().setFocus(TRIP, { placeIds: [9] });
    store().setDraft(TRIP, 'Add tickets');
    const send = vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));

    await store().send(TRIP, '  Add tickets ');

    const [tripId, body] = send.mock.calls[0] ?? [];
    expect(tripId).toBe(TRIP);
    expect(body).toMatchObject({ locale: 'de', threadId: null, text: 'Add tickets', focus: { placeIds: [9] } });
    expect(typeof body?.timeZone).toBe('string');
    const c = chat();
    expect(c).toMatchObject({ threadId: 7, isRunning: false, error: null, draft: '', abort: null });
    expect(c.messages.map((m) => [m.role, m.status])).toEqual([
      ['user', 'complete'],
      ['assistant', 'awaiting_approval'],
    ]);
    expect(store().status?.quota).toEqual({ used: 3, limit: 50 });
  });

  it('FE-AI-STORE-002: a refused question stays to be sent again, and "continue here" stops the other turn first', async () => {
    vi.spyOn(assistantRepo, 'send').mockRejectedValueOnce(new AssistantRequestError('busy', 409));
    await store().send(TRIP, 'Hello');
    expect(chat()).toMatchObject({ error: 'busy', unsent: 'Hello', isRunning: false });
    expect(chat().messages).toHaveLength(1);

    const stop = vi.spyOn(assistantRepo, 'stop').mockResolvedValueOnce(undefined);
    const resend = vi
      .spyOn(assistantRepo, 'send')
      .mockResolvedValueOnce(streamOf([{ type: 'start', messageId: 'm2' }, { type: 'finish' }]));
    await store().continueHere(TRIP);

    expect(stop).toHaveBeenCalledWith(TRIP);
    expect(resend.mock.calls[0]?.[1]).toMatchObject({ text: 'Hello' });
    expect(chat().messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(chat()).toMatchObject({ error: null, unsent: null });
  });

  it('FE-AI-STORE-003: stopping marks the answer as stopped, without an error', async () => {
    vi.spyOn(assistantRepo, 'send').mockImplementationOnce(async (_trip, _body, signal) =>
      hangingStream(
        [
          { type: 'start', messageId: 'm1' },
          { type: 'text-delta', id: 't', delta: 'Let me' },
        ],
        signal
      )
    );
    const running = store().send(TRIP, 'Plan it');
    await vi.waitFor(() => expect(chat().isRunning).toBe(true));
    await vi.waitFor(() => expect(chat().abort).not.toBeNull());
    // Stopped once the answer has begun, as a user would.
    await vi.waitFor(() => expect(chat().messages[1]?.parts).toEqual([{ type: 'text', text: 'Let me' }]));

    store().cancel(TRIP);
    await running;

    expect(chat()).toMatchObject({ isRunning: false, error: null });
    expect(chat().messages[1]).toMatchObject({ status: 'aborted', parts: [{ type: 'text', text: 'Let me' }] });
  });

  it('FE-AI-STORE-004: a dropped connection is an error, and retry asks the same question again', async () => {
    async function* broken(): AsyncGenerator<UiStreamChunk> {
      yield { type: 'start', messageId: 'm1' };
      throw new TypeError('network error');
    }
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(broken());
    await store().send(TRIP, 'Plan it');
    expect(chat()).toMatchObject({ error: 'generic', unsent: null });
    expect(chat().messages[1]?.status).toBe('aborted');

    const again = vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf([{ type: 'finish' }]));
    await store().retry(TRIP);
    expect(again.mock.calls[0]?.[1]).toMatchObject({ text: 'Plan it' });
  });

  it('FE-AI-STORE-005: an error chunk becomes the chat error; offline is named as such', async () => {
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(
      streamOf([{ type: 'start', messageId: 'm1' }, { type: 'error', errorText: 'max_steps' }, { type: 'finish' }])
    );
    await store().send(TRIP, 'Plan everything');
    expect(chat().error).toBe('max_steps');

    vi.spyOn(assistantRepo, 'send').mockRejectedValueOnce(new OnlineOnlyError());
    await store().send(TRIP, 'Again');
    expect(chat().error).toBe('offline');
  });

  it('FE-AI-STORE-006: a new chat while a turn runs leaves the old turn without a say', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    async function* slow(): AsyncGenerator<UiStreamChunk> {
      yield { type: 'start', messageId: 'old' };
      await gate;
      yield { type: 'text-delta', id: 't', delta: 'late' };
    }
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(slow());
    const running = store().send(TRIP, 'Old question');
    await vi.waitFor(() => expect(chat().isRunning).toBe(true));

    store().newThread(TRIP);
    release();
    await running;

    expect(chat()).toMatchObject({ threadId: null, messages: [], isRunning: false, error: null });
  });
});

describe('assistantStore: decisions and undo', () => {
  it('FE-AI-STORE-007: decisions go to the thread, and the held call is applied', async () => {
    await heldTurn();
    const decide = vi.spyOn(assistantRepo, 'decide').mockResolvedValueOnce(
      streamOf([
        { type: 'start', messageId: 'msg-1' },
        { type: 'tool-output-available', toolCallId: WRITE_ID, output: { id: 3 } },
        {
          type: 'data-trek-applied',
          data: { toolCallId: WRITE_ID, entity: 'todo', ids: [3], dayId: null, undoUntil: '2026-10-21T08:15:00.000Z' },
        },
        { type: 'finish', finishReason: 'stop' },
      ])
    );

    await store().decide(TRIP, [{ toolCallId: WRITE_ID, approved: true }]);

    expect(decide).toHaveBeenCalledWith(
      TRIP,
      7,
      expect.objectContaining({ locale: 'de', decisions: [{ toolCallId: WRITE_ID, approved: true }] }),
      expect.any(AbortSignal)
    );
    expect(chat().messages[1]?.status).toBe('complete');
    expect(store().lastApplied).toMatchObject({ tripId: TRIP, applied: { entity: 'todo', ids: [3] } });
  });

  it('FE-AI-STORE-008: refused decisions go back to undecided, with the reason', async () => {
    await heldTurn();
    const held = chat().messages;
    vi.spyOn(assistantRepo, 'decide').mockRejectedValueOnce(new AssistantRequestError('rate_limited', 429));

    await store().decide(TRIP, [{ toolCallId: WRITE_ID, approved: true }]);

    expect(chat().messages).toEqual(held);
    expect(chat()).toMatchObject({ error: 'rate_limited', unsent: null, isRunning: false });
  });

  it('FE-AI-STORE-009: undo closes the window when done or stale, and keeps it when it failed', async () => {
    const receipt: AssistantMessage = {
      id: 'a',
      role: 'assistant',
      status: 'complete',
      createdAt: '2026-10-21T08:00:00.000Z',
      parts: [
        {
          type: 'data-trek-applied',
          data: { toolCallId: 'c1', entity: 'todo', ids: [3], dayId: null, undoUntil: '2026-10-21T08:15:00.000Z' },
        },
      ],
    };
    const undoUntil = () => {
      const part = chat().messages[0]?.parts[0];
      return part?.type === 'data-trek-applied' ? part.data.undoUntil : 'missing';
    };
    const reset = () => useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat(), messages: [receipt] } } });

    reset();
    vi.spyOn(assistantRepo, 'undo').mockRejectedValueOnce({ response: { status: 500 } });
    await expect(store().undo(TRIP, 'c1')).resolves.toBe('failed');
    expect(undoUntil()).toBe('2026-10-21T08:15:00.000Z');

    vi.spyOn(assistantRepo, 'undo').mockRejectedValueOnce({ response: { status: 409 } });
    await expect(store().undo(TRIP, 'c1')).resolves.toBe('stale');
    expect(undoUntil()).toBeNull();

    reset();
    vi.spyOn(assistantRepo, 'undo').mockResolvedValueOnce(undefined);
    await expect(store().undo(TRIP, 'c1')).resolves.toBe('undone');
    expect(undoUntil()).toBeNull();
  });
});

describe('assistantStore: threads, window and status', () => {
  const THREAD: AssistantThreadResponse = {
    thread: { id: 7, title: 'Friday', lastMessageAt: '2026-10-21T08:00:00.000Z' },
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hi' }],
        status: 'complete',
        createdAt: '2026-10-21T08:00:00.000Z',
      },
    ],
  };

  it('FE-AI-STORE-010: resume opens the latest thread; a thread deleted elsewhere is forgotten', async () => {
    vi.spyOn(assistantRepo, 'threads').mockResolvedValueOnce([THREAD.thread, { ...THREAD.thread, id: 6 }]);
    vi.spyOn(assistantRepo, 'thread').mockResolvedValueOnce(THREAD);
    await store().resume(TRIP);
    expect(chat()).toMatchObject({ threadId: 7, messages: THREAD.messages, loading: false });

    vi.spyOn(assistantRepo, 'thread').mockRejectedValueOnce({ response: { status: 404 } });
    await store().openThread(TRIP, 6);
    expect(chat()).toMatchObject({ threadId: null, messages: [], loading: false, threads: [THREAD.thread] });

    vi.spyOn(assistantRepo, 'deleteThread').mockResolvedValueOnce(undefined);
    useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat(), threadId: 7, messages: THREAD.messages } } });
    await store().deleteThread(TRIP, 7);
    expect(chat()).toMatchObject({ threadId: null, messages: [], threads: [] });
  });

  it('FE-AI-STORE-011: the window opens, minimizes, toggles and opens on a place', () => {
    store().toggle();
    expect(store().window).toEqual({ open: true, minimized: false });
    store().setMinimized(true);
    store().toggle();
    expect(store().window).toEqual({ open: true, minimized: false });
    store().toggle();
    expect(store().window.open).toBe(false);

    store().openWith(TRIP, { placeIds: [9] });
    expect(store().window).toEqual({ open: true, minimized: false });
    expect(chat().focus).toEqual({ placeIds: [9] });
    store().close();
    expect(store().window.open).toBe(false);
  });

  it('FE-AI-STORE-012: status fails closed, offline keeps the last answer, and the privacy notice is acknowledged', async () => {
    vi.spyOn(aiConnectionsRepo, 'status').mockResolvedValueOnce(STATUS);
    await store().loadStatus();
    expect(store().status).toEqual(STATUS);

    vi.spyOn(aiConnectionsRepo, 'status').mockRejectedValueOnce(new OnlineOnlyError());
    await store().loadStatus();
    expect(store().status).toEqual(STATUS);

    const ack = vi.spyOn(aiConnectionsRepo, 'ackPrivacy').mockResolvedValueOnce(undefined);
    await store().ackPrivacy();
    expect(ack).toHaveBeenCalledWith({ kind: 'openai', host: 'api.openai.com' });
    expect(store().status?.privacyAcked).toBe(true);

    vi.spyOn(aiConnectionsRepo, 'status').mockRejectedValueOnce({ response: { status: 500 } });
    await store().loadStatus();
    expect(store().status).toBeNull();
  });
});
