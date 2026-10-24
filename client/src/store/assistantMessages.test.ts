/**
 * FE-AI-MSG-001 to FE-AI-MSG-010
 *
 * The stream is folded into messages of the shape the server stores, so a
 * chat that was streamed and one that was reloaded render the same. The
 * shared fixture is the reference turn: a reading tool, some text, and one
 * held change waiting for the user.
 */
import { uiStreamChunkSchema, type AssistantMessage, type UiStreamChunk } from '@trek/shared';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyChunk, closeUndo, markDecisions, pendingToolCallIds } from './assistantMessages';

const NOW = '2026-10-21T08:00:00.000Z';
const now = () => NOW;
const WRITE_ID = '3f2b8c1e-6d4a-4f7b-9e2c-5a1d8b7c6e40';

const FIXTURE: UiStreamChunk[] = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../shared/src/assistant/__fixtures__/ui-stream.v1.txt'),
  'utf8'
)
  .split('\n\n')
  .map((event) => event.replace(/^data: /, '').trim())
  .filter((data) => data && data !== '[DONE]')
  .map((data) => uiStreamChunkSchema.parse(JSON.parse(data)));

const QUESTION: AssistantMessage = {
  id: 'local-1',
  role: 'user',
  parts: [{ type: 'text', text: 'Fit the Golden Pavilion into Friday' }],
  status: 'complete',
  createdAt: NOW,
};

const fold = (messages: AssistantMessage[], chunks: UiStreamChunk[]) =>
  chunks.reduce((acc, chunk) => applyChunk(acc, chunk, now), messages);

const afterFixture = () => fold([QUESTION], FIXTURE);

describe('applyChunk', () => {
  it('FE-AI-MSG-001: folds the fixture into one assistant message that waits for a decision', () => {
    const messages = afterFixture();
    expect(messages).toHaveLength(2);
    expect(messages[0]).toBe(QUESTION);
    const answer = messages[1];
    expect(answer).toMatchObject({ id: 'msg-12', role: 'assistant', status: 'awaiting_approval', createdAt: NOW });
    expect(answer?.parts.map((p) => p.type)).toEqual(['tool-call', 'text', 'tool-call', 'data-trek-change']);
    expect(answer?.parts[0]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'toolu_01',
      toolName: 'get_trip_summary',
      isError: false,
      result: { title: 'Kyoto in June' },
    });
    expect(answer?.parts[1]).toEqual({
      type: 'text',
      text: 'Friday has room in the afternoon. I would add Kinkaku-ji there.',
    });
    expect(answer?.parts[2]).toMatchObject({
      toolCallId: WRITE_ID,
      toolName: 'create_and_assign_place',
      args: { dayId: 32, name: 'Kinkaku-ji' },
      approval: { id: WRITE_ID },
    });
    expect(pendingToolCallIds(messages)).toEqual([WRITE_ID]);
  });

  it('FE-AI-MSG-002: the decisions stream reports on the held call and continues the same message', () => {
    const decided = markDecisions(afterFixture(), [{ toolCallId: WRITE_ID, approved: true }]);
    const applied = { toolCallId: WRITE_ID, entity: 'place' as const, ids: [55], dayId: 32, undoUntil: NOW };
    const messages = fold(decided, [
      { type: 'start', messageId: 'msg-12' },
      { type: 'tool-output-available', toolCallId: WRITE_ID, output: { place: { id: 55 } } },
      { type: 'data-trek-applied', data: applied },
      { type: 'text-start', id: 'txt-1' },
      { type: 'text-delta', id: 'txt-1', delta: 'Done.' },
      { type: 'finish', finishReason: 'stop' },
    ]);
    expect(messages).toHaveLength(2);
    const answer = messages[1];
    expect(answer?.status).toBe('complete');
    expect(answer?.parts[2]).toMatchObject({
      approval: { id: WRITE_ID, approved: true },
      result: { place: { id: 55 } },
    });
    expect(answer?.parts.slice(-2)).toEqual([
      { type: 'data-trek-applied', data: applied },
      { type: 'text', text: 'Done.' },
    ]);
  });

  it('FE-AI-MSG-003: a new message id opens a new message, and the receipt still lands next to its call', () => {
    const applied = { toolCallId: WRITE_ID, entity: 'place' as const, ids: [55], dayId: 32, undoUntil: null };
    const messages = fold(markDecisions(afterFixture(), [{ toolCallId: WRITE_ID, approved: true }]), [
      { type: 'start', messageId: 'msg-13' },
      { type: 'data-trek-applied', data: applied },
      { type: 'text-delta', id: 't', delta: 'Added.' },
      { type: 'finish' },
    ]);
    expect(messages.map((m) => m.id)).toEqual(['local-1', 'msg-12', 'msg-13']);
    expect(messages[1]?.status).toBe('complete');
    expect(messages[1]?.parts[messages[1].parts.length - 1]).toEqual({ type: 'data-trek-applied', data: applied });
    expect(messages[2]?.parts).toEqual([{ type: 'text', text: 'Added.' }]);
  });

  it('FE-AI-MSG-004: a discarded change is stored as the server stores it', () => {
    const messages = fold(afterFixture(), [{ type: 'tool-output-denied', toolCallId: WRITE_ID }]);
    expect(messages[1]?.parts[2]).toMatchObject({
      result: { rejected: true },
      approval: { id: WRITE_ID, approved: false },
    });
    expect(pendingToolCallIds(messages)).toEqual([]);
  });

  it('FE-AI-MSG-005: a failed tool keeps its error text and flag', () => {
    const messages = fold(
      [QUESTION],
      [
        { type: 'start', messageId: 'm' },
        { type: 'tool-input-available', toolCallId: 'r1', toolName: 'get_weather', input: { date: '2026-06-12' } },
        { type: 'tool-output-error', toolCallId: 'r1', errorText: 'No forecast that far ahead' },
      ]
    );
    expect(messages[1]?.parts).toEqual([
      {
        type: 'tool-call',
        toolCallId: 'r1',
        toolName: 'get_weather',
        args: { date: '2026-06-12' },
        result: 'No forecast that far ahead',
        isError: true,
      },
    ]);
  });

  it('FE-AI-MSG-006: error and abort mark the message being written; a finish keeps the error', () => {
    const errored = fold(
      [QUESTION],
      [{ type: 'start', messageId: 'm' }, { type: 'error', errorText: 'max_steps' }, { type: 'finish' }]
    );
    expect(errored[1]?.status).toBe('error');
    const aborted = fold([QUESTION], [{ type: 'start', messageId: 'm' }, { type: 'abort' }]);
    expect(aborted[1]?.status).toBe('aborted');
    // Nothing was opened yet: there is no message to mark.
    expect(fold([QUESTION], [{ type: 'error', errorText: 'busy' }])).toEqual([QUESTION]);
  });

  it('FE-AI-MSG-007: content without a start opens a message rather than writing into the question', () => {
    const messages = fold([QUESTION], [{ type: 'text-delta', id: 't', delta: 'Hi' }]);
    expect(messages).toHaveLength(2);
    expect(messages[1]).toMatchObject({ role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] });
    expect(messages[0]).toBe(QUESTION);
  });

  it('FE-AI-MSG-008: a repeated change preview replaces the earlier one; unknown calls change nothing', () => {
    const fixtureChange = FIXTURE.find((c) => c.type === 'data-trek-change');
    if (fixtureChange?.type !== 'data-trek-change') throw new Error('fixture has no change');
    const messages = fold(afterFixture(), [
      { type: 'data-trek-change', data: { ...fixtureChange.data, subject: 'Kinkaku-ji (Golden Pavilion)' } },
    ]);
    const previews = messages[1]?.parts.filter((p) => p.type === 'data-trek-change') ?? [];
    expect(previews).toHaveLength(1);
    expect(previews[0]).toMatchObject({ data: { subject: 'Kinkaku-ji (Golden Pavilion)' } });
    const before = afterFixture();
    expect(applyChunk(before, { type: 'tool-output-available', toolCallId: 'nope', output: 1 }, now)).toBe(before);
  });
});

describe('markDecisions and closeUndo', () => {
  it('FE-AI-MSG-009: decisions mark only the named calls; closeUndo ends the undo window', () => {
    const second = {
      type: 'tool-call' as const,
      toolCallId: 'c2',
      toolName: 'create_todo',
      args: {},
      approval: { id: 'c2' },
    };
    const base = afterFixture();
    const two = [
      base[0] as AssistantMessage,
      { ...(base[1] as AssistantMessage), parts: [...(base[1]?.parts ?? []), second] },
    ];

    const partly = markDecisions(two, [{ toolCallId: 'c2', approved: false }]);
    expect(pendingToolCallIds(partly)).toEqual([WRITE_ID]);
    expect(partly[1]?.status).toBe('awaiting_approval');
    expect(markDecisions(two, [{ toolCallId: 'other', approved: true }])).toEqual(two);

    const applied = { toolCallId: WRITE_ID, entity: 'place' as const, ids: [55], dayId: 32, undoUntil: NOW };
    const withReceipt = fold(two, [{ type: 'data-trek-applied', data: applied }]);
    const closed = closeUndo(withReceipt, WRITE_ID);
    expect(closed[1]?.parts.find((p) => p.type === 'data-trek-applied')).toEqual({
      type: 'data-trek-applied',
      data: { ...applied, undoUntil: null },
    });
  });

  it('FE-AI-MSG-010: a page the Studio turn looked at is kept as the server stores it, and its request is not', () => {
    const view = { spreadId: 'sp-3', bookVersion: 4, width: 1280, height: 640, bytes: 182_000, description: 'Page 2' };
    const request = {
      requestId: '5f0c3a52-8d1e-4b7a-9c2f-0a1b2c3d4e5f',
      threadId: 9,
      spreadId: 'sp-3',
      bookVersion: 4,
      hiddenPhotoIds: [],
    };

    const folded = fold(
      [QUESTION],
      [
        { type: 'start', messageId: 'm-2' },
        { type: 'data-trek-render-request', data: request, transient: true },
        { type: 'data-trek-page-view', data: view },
      ]
    );

    expect(folded[1]?.parts).toEqual([{ type: 'data-trek-page-view', data: view }]);
  });
});
