/**
 * A thread's stored steps read two ways: the conversation the provider gets
 * (every call answered, held changes under the provider's own ids, earlier
 * lookups cut short) and the messages the client shows (one per answer, with
 * what happened to each held change since it was written).
 */
import type { AssistantMessageRow } from '../../../../src/db/repositories/AssistantMessages.repository';
import type { AssistantToolCallRow } from '../../../../src/db/repositories/AssistantToolCalls.repository';
import {
  messageIdOf,
  outputText,
  serverStepsNote,
  toChatHistory,
  toThreadMessages,
} from '../../../../src/nest/assistant/assistant-history';
import type { AssistantMessagePart, AssistantToolApproval } from '@trek/shared';

import { describe, expect, it } from 'vitest';

let nextId = 1;
function row(
  role: 'user' | 'assistant',
  parts: AssistantMessagePart[],
  extra: Partial<AssistantMessageRow> = {},
): AssistantMessageRow {
  return {
    id: nextId++,
    thread_id: 1,
    role,
    parts: JSON.stringify(parts),
    provider_state: null,
    status: 'complete',
    model: role === 'assistant' ? 'm' : null,
    created_at: '2026-10-21 10:00:00',
    ...extra,
  };
}

function call(id: string, state: string, extra: Partial<AssistantToolCallRow> = {}): AssistantToolCallRow {
  return {
    id,
    thread_id: 1,
    message_id: 0,
    provider_call_id: `prov-${id}`,
    tool_name: 'create_place',
    args: '{}',
    preview: 'null',
    state,
    result: null,
    undo_until: null,
    created_at: '2026-10-21 10:00:00',
    decided_at: null,
    ...extra,
  };
}

const NOW = new Date('2026-10-21T10:05:00Z');

describe('toChatHistory', () => {
  it('ASTHIS-001: starts at the first user message and answers every call', () => {
    const rows = [
      row('assistant', [{ type: 'text', text: 'orphan' }]),
      row('user', [{ type: 'text', text: 'Plan Friday' }]),
      row(
        'assistant',
        [{ type: 'tool-call', toolCallId: 'toolu_1', toolName: 'list_places', args: {}, result: { places: [] } }],
        { provider_state: '{"adapter":"openai-responses","items":[{"type":"function_call"}]}' },
      ),
      row('assistant', [
        { type: 'text', text: 'Shall I add it?' },
        {
          type: 'tool-call',
          toolCallId: 'uuid-1',
          toolName: 'create_place',
          args: { name: 'A' },
          approval: { id: 'uuid-1' },
        },
        {
          type: 'tool-call',
          toolCallId: 'uuid-2',
          toolName: 'create_place',
          args: { name: 'B' },
          result: 'nope',
          isError: true,
          approval: { id: 'uuid-2', approved: true },
        },
      ]),
      row('assistant', [], { status: 'aborted' }),
    ];
    const history = toChatHistory(
      rows,
      new Map([
        ['uuid-1', 'toolu_9'],
        ['uuid-2', 'toolu_10'],
      ]),
    );
    expect(history).toEqual([
      { role: 'user', text: 'Plan Friday' },
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: 'toolu_1', name: 'list_places', args: {} }],
        providerState: { adapter: 'openai-responses', items: [{ type: 'function_call' }] },
      },
      { role: 'tool', toolCallId: 'toolu_1', name: 'list_places', output: '{"places":[]}' },
      {
        role: 'assistant',
        text: 'Shall I add it?',
        toolCalls: [
          { id: 'toolu_9', name: 'create_place', args: { name: 'A' } },
          { id: 'toolu_10', name: 'create_place', args: { name: 'B' } },
        ],
        providerState: null,
      },
      { role: 'tool', toolCallId: 'toolu_9', name: 'create_place', output: expect.stringContaining('did not apply') },
      { role: 'tool', toolCallId: 'toolu_10', name: 'create_place', output: 'nope', isError: true },
    ]);
  });

  it('ASTHIS-002: cuts the lookups of earlier turns, keeps the current turn whole', () => {
    const big = { places: Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Place number ${i}` })) };
    const rows = [
      row('user', [{ type: 'text', text: 'one' }]),
      row('assistant', [{ type: 'tool-call', toolCallId: 'a', toolName: 'list_places', args: {}, result: big }]),
      row('user', [{ type: 'text', text: 'two' }]),
      row('assistant', [{ type: 'tool-call', toolCallId: 'b', toolName: 'list_places', args: {}, result: big }]),
    ];
    const outputs = toChatHistory(rows, new Map()).filter((m) => m.role === 'tool') as Array<{ output: string }>;
    expect(outputs[0].output.length).toBeLessThanOrEqual(8_000);
    expect(JSON.parse(outputs[0].output)).toMatchObject({ truncated: true });
    expect(outputs[1].output).toBe(JSON.stringify(big));
  });

  it('ASTHIS-003: a thread without a user message sends nothing; text answers stay text', () => {
    expect(toChatHistory([row('assistant', [{ type: 'text', text: 'x' }])], new Map())).toEqual([]);
    expect(outputText('plain')).toBe('plain');
    expect(outputText({ a: 1 })).toBe('{"a":1}');
  });

  it('ASTHIS-004: an attached file and the bookings read from it are notes, never calls of unknown tools', () => {
    type CallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;
    type Outcome = Partial<Pick<CallPart, 'result' | 'isError' | 'approval'>>;
    const booking = (id: string, title: string, extra: Outcome): AssistantMessagePart => ({
      type: 'tool-call',
      toolCallId: id,
      toolName: 'import_booking',
      args: { title },
      ...extra,
    });
    const rows = [
      row('user', [{ type: 'attachment', name: 'trip.pdf', mime: 'application/pdf', size: 2048 }]),
      row('assistant', [
        {
          type: 'tool-call',
          toolCallId: 'r1',
          toolName: 'read_booking_file',
          args: { name: 'trip.pdf' },
          result: { bookings: ['LH 716', 'Hotel Gion', 'Bus', 'Tour', 'Ferry'] },
        },
        booking('b1', 'LH 716', { result: { reservation: { id: 5 } }, approval: { id: 'b1', approved: true } }),
        booking('b2', 'Hotel Gion', { result: 'no', isError: true, approval: { id: 'b2', approved: true } }),
        booking('b3', 'Bus', { result: {}, approval: { id: 'b3', approved: false } }),
        booking('b4', 'Tour', { approval: { id: 'b4', resolution: 'cancelled' } }),
        booking('b5', 'Ferry', { approval: { id: 'b5' } }),
      ]),
      row('assistant', [{ type: 'text', text: 'LH 716 is on your trip.' }]),
    ];
    const history = toChatHistory(rows, new Map());
    expect(history.map((message) => message.role)).toEqual(['user', 'user', 'assistant']);
    expect(history[0]).toEqual({
      role: 'user',
      text: '[The user attached the file "trip.pdf" (application/pdf, 2048 bytes).]',
    });
    const note = (history[1] as { text: string }).text;
    expect(note).toContain('TREK read the attached file "trip.pdf" and found 5 booking(s): "LH 716", "Hotel Gion"');
    expect(note).toContain('"LH 716" was added to the trip as a booking.');
    expect(note).toContain('"Hotel Gion" could not be added.');
    expect(note).toContain('The user discarded "Bus".');
    expect(note).toContain('"Tour" was not added; the user moved on without deciding.');
    expect(note).toContain('"Ferry" is waiting for the user to add or discard it.');
    expect(history[2]).toMatchObject({ role: 'assistant', text: 'LH 716 is on your trip.', toolCalls: [] });
  });

  it('ASTHIS-005: a file that could not be read or held nothing says so; text and a file read as one message', () => {
    expect(
      serverStepsNote([
        { type: 'tool-call', toolCallId: 'r', toolName: 'read_booking_file', args: {}, result: 'x', isError: true },
      ]),
    ).toBe('TREK could not read the attached file "?".');
    expect(
      serverStepsNote([
        { type: 'tool-call', toolCallId: 'r', toolName: 'read_booking_file', args: { name: 'a.ics' }, result: {} },
      ]),
    ).toBe('TREK read the attached file "a.ics" and found no booking in it.');
    const history = toChatHistory(
      [
        row('user', [
          { type: 'text', text: 'Here it is' },
          { type: 'attachment', name: 'b.eml', mime: 'message/rfc822', size: 1 },
        ]),
      ],
      new Map(),
    );
    expect(history).toEqual([
      { role: 'user', text: 'Here it is\n[The user attached the file "b.eml" (message/rfc822, 1 bytes).]' },
    ]);
  });

  it('ASTHIS-006: a place the user picked from the search results is told as a note, whatever became of it', () => {
    const found = (approval: AssistantToolApproval, isError = false) =>
      serverStepsNote([
        {
          type: 'tool-call',
          toolCallId: 'f',
          toolName: 'add_found_place',
          args: { via: 'create_and_assign_place', dayId: 31, name: 'Ginkaku-ji' },
          approval,
          ...(isError ? { isError: true } : {}),
        },
      ]);
    expect(found({ id: 'f' })).toBe(
      'The user picked "Ginkaku-ji" from the search results for day 31; it waits for them to add or discard it.',
    );
    expect(found({ id: 'f', approved: true })).toBe('"Ginkaku-ji" was added to day 31.');
    expect(found({ id: 'f', approved: true }, true)).toBe('"Ginkaku-ji" could not be added to day 31.');
    expect(found({ id: 'f', approved: false })).toBe('The user discarded "Ginkaku-ji" for day 31.');
    expect(found({ id: 'f', resolution: 'cancelled' })).toBe(
      '"Ginkaku-ji" was not added to day 31; the user moved on without deciding.',
    );
    const history = toChatHistory(
      [
        row('user', [{ type: 'text', text: 'Temples?' }]),
        row('assistant', [
          {
            type: 'tool-call',
            toolCallId: 'f',
            toolName: 'add_found_place',
            args: { via: 'assign_place_to_day', dayId: 31, placeId: 4 },
            approval: { id: 'f' },
          },
        ]),
      ],
      new Map(),
    );
    expect(history).toEqual([
      { role: 'user', text: 'Temples?' },
      {
        role: 'user',
        text: 'The user picked "?" from the search results for day 31; it waits for them to add or discard it.',
      },
    ]);
  });

  it('ASTHIS-013: a proposal the user took to add is told as a note, a hike or a city walk, whatever became of it', () => {
    const taken = (approval: AssistantToolApproval, via = 'create_hike', isError = false) =>
      serverStepsNote([
        {
          type: 'tool-call',
          toolCallId: 'p',
          toolName: 'take_proposal',
          args: { via, name: 'Herzogstand' },
          approval,
          ...(isError ? { isError: true } : {}),
        },
      ]);
    expect(taken({ id: 'p' })).toBe(
      'The user took the proposed hike "Herzogstand" to add it; it waits for them to add or discard it.',
    );
    expect(taken({ id: 'p', approved: true })).toBe('The hike "Herzogstand" was added to the trip.');
    expect(taken({ id: 'p', approved: true }, 'create_hike', true)).toBe('The hike "Herzogstand" could not be added.');
    expect(taken({ id: 'p', approved: false }, 'create_city_walk')).toBe(
      'The user discarded the city walk "Herzogstand".',
    );
    expect(taken({ id: 'p', resolution: 'expired' })).toBe(
      'The hike "Herzogstand" was not added; the user moved on without deciding.',
    );
  });

  it('ASTHIS-014: a page the Studio drew is replayed as its description; no image is stored or sent again', () => {
    const view = { spreadId: 'sp-2', bookVersion: 3, width: 1280, height: 640, bytes: 182_000, description: 'Page 2' };
    const looked = { description: 'Page 2, a double spread', findings: [] };
    const args = { spreadId: 'sp-2' };
    const rows = [
      row('user', [{ type: 'text', text: 'Check page 2' }]),
      row('assistant', [
        { type: 'tool-call', toolCallId: 'p1', toolName: 'preview_book_page', args, result: looked },
        // Whatever reaches the store is what the shared part keeps: no bytes.
        { type: 'data-trek-page-view', data: { ...view, data: 'aGVsbG8=' } as typeof view },
      ]),
      row('assistant', [{ type: 'text', text: 'It looks balanced.' }]),
    ];
    const history = toChatHistory(rows, new Map());
    expect(history).toEqual([
      { role: 'user', text: 'Check page 2' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'p1', name: 'preview_book_page', args }], providerState: null },
      { role: 'tool', toolCallId: 'p1', name: 'preview_book_page', output: JSON.stringify(looked) },
      { role: 'assistant', text: 'It looks balanced.', toolCalls: [], providerState: null },
    ]);
    expect(JSON.stringify(history)).not.toContain('aGVsbG8=');
    const [, answer] = toThreadMessages(rows, new Map(), NOW);
    expect(answer?.parts[1]).toEqual({ type: 'data-trek-page-view', data: view });
  });
});

describe('toThreadMessages', () => {
  it('ASTHIS-010: the steps of one answer are one message under the first row id', () => {
    nextId = 10;
    const rows = [
      row('user', [{ type: 'text', text: 'hi' }]),
      row('assistant', [{ type: 'tool-call', toolCallId: 't', toolName: 'list_places', args: {}, result: {} }]),
      row('assistant', [{ type: 'text', text: 'done' }]),
      row('user', [{ type: 'text', text: 'again' }]),
    ];
    const messages = toThreadMessages(rows, new Map(), NOW);
    expect(messages.map((m) => [m.id, m.role, m.parts.length, m.status])).toEqual([
      ['msg-10', 'user', 1, 'complete'],
      ['msg-11', 'assistant', 2, 'complete'],
      ['msg-13', 'user', 1, 'complete'],
    ]);
    expect(messages[0].createdAt).toBe('2026-10-21T10:00:00Z');
    expect(messageIdOf(11)).toBe('msg-11');
  });

  it('ASTHIS-011: a held change reads as it stands now', () => {
    const parts = (id: string): AssistantMessagePart => ({
      type: 'tool-call',
      toolCallId: id,
      toolName: 'create_place',
      args: {},
      approval: { id },
    });
    const rows = [
      row('assistant', [parts('waiting'), parts('old'), parts('gone'), parts('yes'), parts('no'), parts('stuck')], {
        status: 'awaiting_approval',
      }),
    ];
    const calls = new Map([
      ['waiting', call('waiting', 'approval_requested')],
      ['old', call('old', 'approval_requested', { created_at: '2026-10-19 10:00:00' })],
      ['gone', call('gone', 'expired')],
      ['yes', call('yes', 'executed')],
      ['no', call('no', 'rejected')],
      ['stuck', call('stuck', 'approved')],
    ]);
    const [message] = toThreadMessages(rows, calls, NOW);
    expect(message.parts.map((part) => (part.type === 'tool-call' ? part.approval : null))).toEqual([
      { id: 'waiting' },
      { id: 'old', resolution: 'expired' },
      { id: 'gone', resolution: 'expired' },
      { id: 'yes', approved: true },
      { id: 'no', approved: false },
      { id: 'stuck', resolution: 'cancelled' },
    ]);
    expect(message.status).toBe('awaiting_approval');
    calls.set('waiting', call('waiting', 'rejected'));
    expect(toThreadMessages(rows, calls, NOW)[0].status).toBe('complete');
  });

  it('ASTHIS-012: an applied change can be undone until its window closes or it was undone', () => {
    const applied: AssistantMessagePart = {
      type: 'data-trek-applied',
      data: { toolCallId: 'x', entity: 'place', ids: [1], dayId: null, undoUntil: '2026-10-21T10:15:00Z' },
    };
    const rows = [row('assistant', [applied])];
    const undoUntil = (state: string, until: string | null) =>
      (
        toThreadMessages(rows, new Map([['x', call('x', state, { undo_until: until })]]), NOW)[0].parts[0] as {
          data: { undoUntil: string | null };
        }
      ).data.undoUntil;
    expect(undoUntil('executed', '2026-10-21 10:15:00')).toBe('2026-10-21T10:15:00Z');
    expect(undoUntil('executed', '2026-10-21 10:01:00')).toBeNull();
    expect(undoUntil('undone', '2026-10-21 10:15:00')).toBeNull();
  });
});
