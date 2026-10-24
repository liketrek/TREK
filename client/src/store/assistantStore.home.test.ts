/**
 * FE-AI-STORE-HOME-001 to FE-AI-STORE-HOME-005
 *
 * The home chat (the assistant outside any one trip) in the same store as the
 * trips' and the journeys': kept under the key 0, which no trip and no
 * journey has; every call it has goes out with the home scope; an applied
 * change does not make a planner jump; the trip-only actions (files, found
 * places, proposals) do nothing for it. The repo is faked, nothing reaches
 * Dexie.
 */
import type { UiStreamChunk } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assistantRepo } from '../repo/assistantRepo';
import { assistantChatKey, assistantScopeOf, assistantTargetOf, HOME_CHAT_KEY } from './assistantChatKey';
import { chatOf, useAssistantStore } from './assistantStore';
import { useSettingsStore } from './settingsStore';

const HOME = { kind: 'home' } as const;
const WRITE_ID = 'c0ffee00-0000-4000-8000-000000000003';

const HELD_TURN: UiStreamChunk[] = [
  { type: 'start', messageId: 'msg-1' },
  { type: 'data-trek-thread', data: { threadId: 21, title: 'Japan' } },
  { type: 'text-delta', id: 't', delta: 'Japan goes into your atlas.' },
  {
    type: 'tool-input-available',
    toolCallId: WRITE_ID,
    toolName: 'mark_country_visited',
    input: { country_code: 'JP' },
  },
  { type: 'tool-approval-request', approvalId: WRITE_ID, toolCallId: WRITE_ID },
  { type: 'finish', finishReason: 'tool-calls' },
];

const APPLIED_TURN: UiStreamChunk[] = [
  { type: 'start', messageId: 'msg-1' },
  { type: 'tool-output-available', toolCallId: WRITE_ID, output: { country_code: 'JP' } },
  {
    type: 'data-trek-applied',
    data: { toolCallId: WRITE_ID, entity: 'atlas', ids: [], dayId: null, undoUntil: '2026-10-23T08:15:00.000Z' },
  },
  { type: 'finish', finishReason: 'stop' },
];

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

const store = () => useAssistantStore.getState();
const chat = () => chatOf(store(), HOME_CHAT_KEY);

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

describe('assistantChatKey: the home chat', () => {
  it('FE-AI-STORE-HOME-001: is kept under 0, which reads back as the home scope and is called with it', () => {
    expect(assistantChatKey(HOME)).toBe(HOME_CHAT_KEY);
    expect(HOME_CHAT_KEY).toBe(0);
    expect(assistantScopeOf(HOME_CHAT_KEY)).toEqual(HOME);
    expect(assistantTargetOf(HOME_CHAT_KEY)).toEqual(HOME);
    // A trip and a journey keep their keys.
    expect(assistantTargetOf(5)).toBe(5);
    expect(assistantTargetOf(-5)).toEqual({ kind: 'journey', journeyId: 5 });
  });
});

describe('assistantStore: the home chat', () => {
  it('FE-AI-STORE-HOME-002: sends with the home scope, apart from every trip', async () => {
    const send = vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));

    await store().send(HOME_CHAT_KEY, '  I was in Japan ');

    const [target, body] = send.mock.calls[0] ?? [];
    expect(target).toEqual(HOME);
    expect(body).toMatchObject({ locale: 'en', threadId: null, text: 'I was in Japan' });
    expect(chat()).toMatchObject({ threadId: 21, isRunning: false, error: null });
    expect(chat().messages.map((m) => [m.role, m.status])).toEqual([
      ['user', 'complete'],
      ['assistant', 'awaiting_approval'],
    ]);
  });

  it('FE-AI-STORE-HOME-003: resume and delete reach the home threads', async () => {
    const summary = { id: 21, title: 'Japan', lastMessageAt: '2026-10-23T08:00:00.000Z' };
    const threads = vi.spyOn(assistantRepo, 'threads').mockResolvedValueOnce([summary]);
    const open = vi.spyOn(assistantRepo, 'thread').mockResolvedValueOnce({ thread: summary, messages: [] });

    await store().resume(HOME_CHAT_KEY);
    expect(threads).toHaveBeenCalledWith(HOME);
    expect(open).toHaveBeenCalledWith(HOME, 21);

    const remove = vi.spyOn(assistantRepo, 'deleteThread').mockResolvedValueOnce(undefined);
    await store().deleteThread(HOME_CHAT_KEY, 21);
    expect(remove).toHaveBeenCalledWith(HOME, 21);
  });

  it('FE-AI-STORE-HOME-004: a decision goes to the home thread; an applied change makes no planner jump', async () => {
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf(HELD_TURN));
    await store().send(HOME_CHAT_KEY, 'I was in Japan');
    const decide = vi.spyOn(assistantRepo, 'decide').mockResolvedValueOnce(streamOf(APPLIED_TURN));

    await store().decide(HOME_CHAT_KEY, [{ toolCallId: WRITE_ID, approved: true }]);

    expect(decide).toHaveBeenCalledWith(HOME, 21, expect.anything(), expect.any(AbortSignal));
    expect(store().lastApplied).toBeNull();
    expect(chat().compare).toBeNull();
  });

  it('FE-AI-STORE-HOME-005: files, found places and proposals do nothing in the home chat', async () => {
    useAssistantStore.setState({ byTrip: { [HOME_CHAT_KEY]: { ...chat(), threadId: 21 } } });
    const attach = vi.spyOn(assistantRepo, 'attach');
    const found = vi.spyOn(assistantRepo, 'addFoundPlace');
    const proposal = vi.spyOn(assistantRepo, 'takeProposal');

    await store().attach(HOME_CHAT_KEY, new File(['x'], 'booking.pdf', { type: 'application/pdf' }));
    await store().addFoundPlace(HOME_CHAT_KEY, 's1:0', 31);
    await expect(store().takeProposal(HOME_CHAT_KEY, WRITE_ID)).resolves.toBe('skipped');

    expect(attach).not.toHaveBeenCalled();
    expect(found).not.toHaveBeenCalled();
    expect(proposal).not.toHaveBeenCalled();
  });
});
