/**
 * FE-AI-STORE-JRN-001 to FE-AI-STORE-JRN-006
 *
 * A journey's chat (the assistant in TREK Studio) in the same store as the
 * trips': kept under its own key, beside a trip with the same id; every call
 * the two have goes out with the journey's scope; an applied change does not
 * make the planner jump; the trip-only actions (files, found places,
 * proposals) do nothing for it. The repo is faked, nothing reaches Dexie.
 */
import type { AssistantMessage, AssistantThreadResponse, UiStreamChunk } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assistantRepo } from '../repo/assistantRepo';
import { assistantChatKey, assistantScopeOf, assistantTargetOf } from './assistantChatKey';
import { chatOf, useAssistantStore } from './assistantStore';
import { useSettingsStore } from './settingsStore';

const JOURNEY = 12;
const KEY = assistantChatKey({ kind: 'journey', journeyId: JOURNEY });
const SCOPE = { kind: 'journey', journeyId: JOURNEY } as const;
const WRITE_ID = 'c0ffee00-0000-4000-8000-000000000002';
const AT = '2026-10-22T08:00:00.000Z';

const HELD_TURN: UiStreamChunk[] = [
  { type: 'start', messageId: 'msg-1' },
  { type: 'data-trek-thread', data: { threadId: 9, title: 'Lisbon book' } },
  { type: 'text-delta', id: 't', delta: 'A quieter cover.' },
  { type: 'tool-input-available', toolCallId: WRITE_ID, toolName: 'set_book_cover', input: { title: 'Lisbon' } },
  { type: 'tool-approval-request', approvalId: WRITE_ID, toolCallId: WRITE_ID },
  { type: 'finish', finishReason: 'tool-calls' },
];

const APPLIED_TURN: UiStreamChunk[] = [
  { type: 'start', messageId: 'msg-1' },
  { type: 'tool-output-available', toolCallId: WRITE_ID, output: { version: 4 } },
  {
    type: 'data-trek-applied',
    data: { toolCallId: WRITE_ID, entity: 'book_page', ids: [], dayId: null, undoUntil: '2026-10-22T08:15:00.000Z' },
  },
  { type: 'finish', finishReason: 'stop' },
];

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

const store = () => useAssistantStore.getState();
const chat = () => chatOf(store(), KEY);

async function heldTurn() {
  vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));
  await store().send(KEY, 'Make the cover quieter');
}

beforeEach(() => {
  useAssistantStore.setState({
    status: null,
    window: { open: false, minimized: false },
    byTrip: {},
    lastApplied: null,
  });
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, language: 'en' } }));
});
afterEach(() => vi.restoreAllMocks());

describe('assistantChatKey', () => {
  it('FE-AI-STORE-JRN-001: a trip keeps its id as key, a journey gets one no trip has, and both read back', () => {
    expect(assistantChatKey({ kind: 'trip', tripId: JOURNEY })).toBe(JOURNEY);
    expect(KEY).not.toBe(JOURNEY);
    expect(assistantScopeOf(KEY)).toEqual(SCOPE);
    expect(assistantScopeOf(JOURNEY)).toEqual({ kind: 'trip', tripId: JOURNEY });
    // The repo is called with a trip's bare id as it always was, and with the scope for a journey.
    expect(assistantTargetOf(JOURNEY)).toBe(JOURNEY);
    expect(assistantTargetOf(KEY)).toEqual(SCOPE);
  });
});

describe('assistantStore: a journey chat', () => {
  it('FE-AI-STORE-JRN-002: sends with the journey scope, apart from the trip with the same id', async () => {
    store().setFocus(KEY, { spreadId: 'sp-3' });
    const send = vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));

    await store().send(KEY, '  Make the cover quieter ');

    const [target, body] = send.mock.calls[0] ?? [];
    expect(target).toEqual(SCOPE);
    expect(body).toMatchObject({
      locale: 'en',
      threadId: null,
      text: 'Make the cover quieter',
      focus: { spreadId: 'sp-3' },
    });
    expect(chat()).toMatchObject({ threadId: 9, isRunning: false, error: null });
    expect(chat().messages.map((m) => [m.role, m.status])).toEqual([
      ['user', 'complete'],
      ['assistant', 'awaiting_approval'],
    ]);
    expect(chatOf(store(), JOURNEY)).toMatchObject({ threadId: null, messages: [] });
  });

  it('FE-AI-STORE-JRN-003: resume, open and delete reach the journey threads', async () => {
    const thread: AssistantThreadResponse = {
      thread: { id: 9, title: 'Lisbon book', lastMessageAt: AT },
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }], status: 'complete', createdAt: AT }],
    };
    const threads = vi.spyOn(assistantRepo, 'threads').mockResolvedValueOnce([thread.thread]);
    const open = vi.spyOn(assistantRepo, 'thread').mockResolvedValueOnce(thread);

    await store().resume(KEY);

    expect(threads).toHaveBeenCalledWith(SCOPE);
    expect(open).toHaveBeenCalledWith(SCOPE, 9);
    expect(chat()).toMatchObject({ threadId: 9, messages: thread.messages, loading: false });

    const remove = vi.spyOn(assistantRepo, 'deleteThread').mockResolvedValueOnce(undefined);
    await store().deleteThread(KEY, 9);
    expect(remove).toHaveBeenCalledWith(SCOPE, 9);
    expect(chat()).toMatchObject({ threadId: null, messages: [], threads: [] });
  });

  it('FE-AI-STORE-JRN-004: a decision goes to the journey thread; an applied change leaves the planner', async () => {
    await heldTurn();
    const decide = vi.spyOn(assistantRepo, 'decide').mockResolvedValueOnce(streamOf(APPLIED_TURN));

    await store().decide(KEY, [{ toolCallId: WRITE_ID, approved: true }]);

    expect(decide).toHaveBeenCalledWith(
      SCOPE,
      9,
      expect.objectContaining({ decisions: [{ toolCallId: WRITE_ID, approved: true }] }),
      expect.any(AbortSignal)
    );
    expect(chat().messages[1]?.status).toBe('complete');
    expect(chat().compare).toBeNull();
    expect(store().lastApplied).toBeNull();
  });

  it('FE-AI-STORE-JRN-005: undo and "continue here" carry the journey scope; a stale undo closes', async () => {
    const receipt: AssistantMessage = {
      id: 'a',
      role: 'assistant',
      status: 'complete',
      createdAt: AT,
      parts: [
        {
          type: 'data-trek-applied',
          data: {
            toolCallId: WRITE_ID,
            entity: 'book_page',
            ids: [],
            dayId: null,
            undoUntil: '2026-10-22T08:15:00.000Z',
          },
        },
      ],
    };
    useAssistantStore.setState({ byTrip: { [KEY]: { ...chat(), threadId: 9, messages: [receipt] } } });
    const undo = vi.spyOn(assistantRepo, 'undo').mockRejectedValueOnce({ response: { status: 409 } });

    await expect(store().undo(KEY, WRITE_ID)).resolves.toBe('stale');
    expect(undo).toHaveBeenCalledWith(SCOPE, WRITE_ID);
    const part = chat().messages[0]?.parts[0];
    expect(part?.type === 'data-trek-applied' ? part.data.undoUntil : 'missing').toBeNull();

    const stop = vi.spyOn(assistantRepo, 'stop').mockResolvedValueOnce(undefined);
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf([{ type: 'finish' }]));
    useAssistantStore.setState({ byTrip: { [KEY]: { ...chat(), unsent: 'Again' } } });
    await store().continueHere(KEY);
    expect(stop).toHaveBeenCalledWith(SCOPE);
  });

  it('FE-AI-STORE-JRN-006: files, found places and proposals do nothing in a journey chat', async () => {
    useAssistantStore.setState({ byTrip: { [KEY]: { ...chat(), threadId: 9 } } });
    const attach = vi.spyOn(assistantRepo, 'attach');
    const found = vi.spyOn(assistantRepo, 'addFoundPlace');
    const proposal = vi.spyOn(assistantRepo, 'takeProposal');

    await store().attach(KEY, new File(['x'], 'booking.pdf', { type: 'application/pdf' }));
    await store().addFoundPlace(KEY, 's1:0', 31);
    await expect(store().takeProposal(KEY, WRITE_ID)).resolves.toBe('skipped');

    expect(attach).not.toHaveBeenCalled();
    expect(found).not.toHaveBeenCalled();
    expect(proposal).not.toHaveBeenCalled();
    expect(chat()).toMatchObject({ messages: [], isRunning: false, error: null });
  });
});
