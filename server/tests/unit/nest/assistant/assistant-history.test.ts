/**
 * A thread's stored steps read two ways: the conversation the provider gets
 * (every call answered, held changes under the provider's own ids, earlier
 * lookups cut short) and the messages the client shows (one per answer, with
 * what happened to each held change since it was written).
 */
import type { AssistantMessageRow } from '../../../../src/db/repositories/AssistantMessages.repository';
import type { AssistantToolCallRow } from '../../../../src/db/repositories/AssistantToolCalls.repository';
import type { AiChatMessage } from '../../../../src/nest/ai-connections/ai-chat-client.interface';
import { toAnthropicMessages } from '../../../../src/nest/ai-connections/providers/anthropic-messages.client';
import { toChatMessages } from '../../../../src/nest/ai-connections/providers/openai-chat.client';
import { toResponsesInput } from '../../../../src/nest/ai-connections/providers/openai-responses.client';
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

  it('ASTHIS-005b: a file that held no booking says why, and a reason this build does not know adds nothing', () => {
    const read = (reason: unknown) =>
      serverStepsNote([
        {
          type: 'tool-call',
          toolCallId: 'r',
          toolName: 'read_booking_file',
          args: { name: 'AirBnB Buchung.pdf' },
          result: { bookings: [], reason },
        },
      ]);
    expect(read('ai_not_configured')).toBe(
      'TREK read the attached file "AirBnB Buchung.pdf" and found no booking in it: AI reading for imports is not ' +
        "set up on this server, so only TREK's own reader looked at it.",
    );
    expect(read('ai_failed')).toContain('found no booking in it: the AI reader for imports could not read it.');
    expect(read('no_text')).toContain('found no booking in it: it holds no readable text, most likely a scan.');
    expect(read('nothing_found')).toContain(
      "found no booking in it: neither TREK's reader nor the AI reader found one.",
    );
    expect(read('later_reason')).toBe('TREK read the attached file "AirBnB Buchung.pdf" and found no booking in it.');
  });

  it('ASTHIS-005c: a kept attachment is named with the id the model reads it by', () => {
    const id = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
    const history = toChatHistory(
      [
        row('user', [
          { type: 'attachment', name: 'AirBnB Buchung.pdf', mime: 'application/pdf', size: 9, attachmentId: id },
        ]),
      ],
      new Map(),
    );
    expect(history).toEqual([
      {
        role: 'user',
        text:
          `[The user attached the file "AirBnB Buchung.pdf" (application/pdf, 9 bytes), attachment id ${id}. ` +
          'Read it with read_attached_file if the user wants you to work with its content.]',
      },
    ]);
  });

  it('ASTHIS-005d: the text of a file the user let the model read answers its read, once, cut in earlier turns', () => {
    const id = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
    type CallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;
    const read = (toolCallId: string, extra: Partial<CallPart>): AssistantMessagePart => ({
      type: 'tool-call',
      toolCallId,
      toolName: 'read_attached_file',
      args: { attachmentId: id, name: 'AirBnB Buchung.pdf', sentTo: 'm (h)' },
      ...extra,
    });
    const long = `Casa Lisboa ${'x'.repeat(9_000)}`;
    const rows = [
      row('user', [{ type: 'text', text: 'Make a booking from it' }]),
      row('assistant', [
        { type: 'text', text: 'I need to read it first.' },
        read('r1', { approval: { id: 'r1', approved: true }, result: { name: 'AirBnB Buchung.pdf', read: true } }),
      ]),
      row('assistant', [read('r2', { result: { name: 'AirBnB Buchung.pdf', read: true } })]),
      row('user', [{ type: 'text', text: 'Thanks' }]),
    ];
    const history = toChatHistory(rows, new Map(), new Map([[id, long]]));
    expect(history.map((message) => message.role)).toEqual(['user', 'assistant', 'tool', 'assistant', 'tool', 'user']);
    expect(history[1]).toMatchObject({
      role: 'assistant',
      text: 'I need to read it first.',
      toolCalls: [{ id: 'r1', name: 'read_attached_file' }],
    });
    expect(history[2]).toMatchObject({ role: 'tool', toolCallId: 'r1' });
    const told = (history[2] as { output: string }).output;
    expect(told).toContain('The user let you read the attached file "AirBnB Buchung.pdf".');
    expect(told).toContain('Casa Lisboa');
    // An earlier turn's text is cut so it does not crowd out the conversation.
    expect(told.length).toBeLessThan(long.length);
    expect(told.endsWith('[...]')).toBe(true);
    expect(history[4]).toMatchObject({
      role: 'tool',
      toolCallId: 'r2',
      output: 'You read the attached file "AirBnB Buchung.pdf" again; its text is above.',
    });
    // The latest turn keeps the whole text.
    const latest = toChatHistory(rows.slice(0, 2), new Map(), new Map([[id, long]]));
    expect((latest[2] as { output: string }).output).toContain(long);
  });

  it('ASTHIS-005e: a read the user did not allow, one still waiting, a refused one and a swept file say so', () => {
    const id = '0b7c2f0e-6f6d-4a8e-9b1a-3d2c1e0f9a87';
    const step = (extra: Partial<Extract<AssistantMessagePart, { type: 'tool-call' }>>) =>
      toChatHistory(
        [
          row('user', [{ type: 'text', text: 'Read it' }]),
          row('assistant', [
            {
              type: 'tool-call',
              toolCallId: 'r',
              toolName: 'read_attached_file',
              args: { attachmentId: id, name: 'a.pdf' },
              ...extra,
            },
          ]),
        ],
        new Map(),
      ).map((message) => (message.role === 'tool' ? message.output : null));
    expect(step({ approval: { id: 'r', approved: false } })[2]).toBe(
      'The user did not let you read the attached file "a.pdf".',
    );
    expect(step({ approval: { id: 'r' } })[2]).toContain("waits for the user's agreement; you have not read it.");
    expect(step({ approval: { id: 'r', resolution: 'expired' } })[2]).toContain('you have not read it');
    expect(step({ result: 'No such attachment in this conversation.', isError: true })[2]).toBe(
      'Reading the attached file "a.pdf" failed: No such attachment in this conversation.',
    );
    expect(step({ result: { read: true } })[2]).toBe(
      'The attached file "a.pdf" is no longer kept; you cannot read it again.',
    );
  });

  it('ASTHIS-005f: keeping an attached file is answered with what became of it', () => {
    const keep = (extra: Partial<Extract<AssistantMessagePart, { type: 'tool-call' }>>) =>
      toChatHistory(
        [
          row('user', [{ type: 'text', text: 'Keep it in Files' }]),
          row('assistant', [
            { type: 'text', text: 'Here is the card.' },
            {
              type: 'tool-call',
              toolCallId: 'k',
              toolName: 'keep_attached_file',
              args: { attachmentId: 'a', name: 'a.pdf' },
              ...extra,
            },
          ]),
        ],
        new Map(),
      );
    const kept = keep({ approval: { id: 'k', approved: true }, result: { file: { id: 31 } } });
    expect(kept.map((message) => message.role)).toEqual(['user', 'assistant', 'tool']);
    expect(kept[2]).toMatchObject({
      toolCallId: 'k',
      output: 'The attached file "a.pdf" is in the trip\'s Files now (file id 31).',
    });
    const lastOf = (extra: Parameters<typeof keep>[0]) => (keep(extra).at(-1) as { output: string }).output;
    expect(
      lastOf({ approval: { id: 'k', approved: true }, result: 'The file could not be kept.', isError: true }),
    ).toBe('The attached file "a.pdf" could not be kept in Files: The file could not be kept.');
    expect(lastOf({ approval: { id: 'k', approved: false } })).toBe(
      'The user did not keep the attached file "a.pdf" in Files.',
    );
    expect(lastOf({ result: 'No such attachment in this conversation.', isError: true })).toContain('was refused');
    expect(lastOf({ approval: { id: 'k', resolution: 'cancelled' } })).toContain('the user moved on without deciding');
    expect(lastOf({ approval: { id: 'k' } })).toContain('waits for the user to apply or discard it');
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

describe('toChatHistory: calls the model made of the server tools (#2845)', () => {
  /**
   * The thread of #2845: a step that kept a trip note on the way (it runs at
   * once), then a step whose changes the user applied, both with the
   * provider's own record of the step stored beside them.
   */
  function appliedAfterANote(
    noteState: Record<string, unknown>,
    changeState: Record<string, unknown>,
  ): AiChatMessage[] {
    const rows = [
      row('user', [{ type: 'text', text: 'Dinner at 20:00 on day 2, and remember we like late dinners' }]),
      row(
        'assistant',
        [
          {
            type: 'tool-call',
            toolCallId: 'call_note',
            toolName: 'remember_for_trip',
            args: { note: 'Likes late dinners' },
            result: { notes: 'Likes late dinners' },
          },
        ],
        { provider_state: JSON.stringify(noteState) },
      ),
      row(
        'assistant',
        [
          { type: 'text', text: 'Shall I move it?' },
          {
            type: 'tool-call',
            toolCallId: 'held-1',
            toolName: 'update_assignment_time',
            args: { assignmentId: 7, place_time: '20:00' },
            result: { assignment: { id: 7 } },
            approval: { id: 'held-1', approved: true },
          },
        ],
        { provider_state: JSON.stringify(changeState) },
      ),
    ];
    return toChatHistory(rows, new Map([['held-1', 'call_move']]));
  }

  it('ASTHIS-015: the Responses API gets an answer for every call it made, a kept note included', () => {
    const history = appliedAfterANote(
      {
        adapter: 'openai-responses',
        items: [
          { type: 'reasoning', id: 'rs_1', encrypted_content: 'x' },
          { type: 'function_call', call_id: 'call_note', name: 'remember_for_trip', arguments: '{}' },
        ],
      },
      {
        adapter: 'openai-responses',
        items: [
          { type: 'reasoning', id: 'rs_2', encrypted_content: 'y' },
          { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Shall I move it?' }] },
          { type: 'function_call', call_id: 'call_move', name: 'update_assignment_time', arguments: '{}' },
        ],
      },
    );
    const input = toResponsesInput({ system: '', messages: history, tools: [] });
    const made = input.filter((item) => item.type === 'function_call').map((item) => item.call_id);
    const answered = input.filter((item) => item.type === 'function_call_output').map((item) => item.call_id);
    expect(made).toEqual(['call_note', 'call_move']);
    expect(answered).toEqual(['call_note', 'call_move']);
    for (const id of made) {
      const call = input.findIndex((item) => item.type === 'function_call' && item.call_id === id);
      const output = input.findIndex((item) => item.type === 'function_call_output' && item.call_id === id);
      expect(output).toBeGreaterThan(call);
    }
    expect(input.find((item) => item.type === 'function_call_output' && item.call_id === 'call_note')).toMatchObject({
      output: '{"notes":"Likes late dinners"}',
    });
    // Nothing empty goes out as the user's: a kept note is no step of the server to tell.
    const userTexts = input
      .filter((item) => item.type === 'message' && item.role === 'user')
      .flatMap((item) => (item.content as Array<{ text?: string }>).map((part) => part.text ?? ''));
    expect(userTexts).toEqual(['Dinner at 20:00 on day 2, and remember we like late dinners']);
  });

  it('ASTHIS-016: Anthropic gets a tool_result for every tool_use it replays, a kept note included', () => {
    const history = appliedAfterANote(
      {
        adapter: 'anthropic-messages',
        blocks: [
          { type: 'thinking', thinking: 'note it', signature: 's1' },
          { type: 'tool_use', id: 'call_note', name: 'remember_for_trip', input: {} },
        ],
      },
      {
        adapter: 'anthropic-messages',
        blocks: [
          { type: 'thinking', thinking: 'move it', signature: 's2' },
          { type: 'text', text: 'Shall I move it?' },
          { type: 'tool_use', id: 'call_move', name: 'update_assignment_time', input: {} },
        ],
      },
    );
    const messages = toAnthropicMessages(history);
    const uses = messages.flatMap((message) => message.content).filter((block) => block.type === 'tool_use');
    expect(uses.map((block) => block.id)).toEqual(['call_note', 'call_move']);
    messages.forEach((message, index) => {
      const ids = message.content.filter((block) => block.type === 'tool_use').map((block) => block.id);
      if (ids.length === 0) return;
      const next = messages[index + 1];
      expect(next?.role).toBe('user');
      const results = next.content.filter((block) => block.type === 'tool_result').map((block) => block.tool_use_id);
      expect(results).toEqual(ids);
    });
    expect(messages.flatMap((message) => message.content).some((block) => block.text === '')).toBe(false);
  });

  it('ASTHIS-018: Gemini gets every stored call back with its thought signature, an applied change included', () => {
    const state = (id: string, signature: string) => ({
      adapter: 'openai-chat',
      model: 'gemini-3-flash',
      signatures: { [id]: signature },
    });
    type SentCall = { id: string; extra_content?: { google: { thought_signature: string } } };
    const history = appliedAfterANote(state('call_note', 'sig-note'), state('call_move', 'sig-move'));
    const sent = toChatMessages({ system: '', messages: history, tools: [] }, 'gemini-3-flash')
      .flatMap((message) => (message.tool_calls ?? []) as SentCall[])
      .map((call) => [call.id, call.extra_content?.google.thought_signature]);
    expect(sent).toEqual([
      ['call_note', 'sig-note'],
      ['call_move', 'sig-move'],
    ]);
  });

  /** A step stopped while its calls ran: the provider's record holds both calls, the parts only the one that ran. */
  function stoppedMidStep(state: Record<string, unknown>): AiChatMessage[] {
    return toChatHistory(
      [
        row('user', [{ type: 'text', text: 'Plan Friday' }]),
        row(
          'assistant',
          [
            { type: 'text', text: 'Let me look.' },
            { type: 'tool-call', toolCallId: 'call_1', toolName: 'list_places', args: {}, result: { places: [] } },
          ],
          { provider_state: JSON.stringify(state), status: 'aborted' },
        ),
        row('user', [{ type: 'text', text: 'Hello?' }]),
      ],
      new Map(),
    );
  }

  it('ASTHIS-019: Anthropic gets a call of a stopped step that never ran answered, so the thread goes on', () => {
    const history = stoppedMidStep({
      adapter: 'anthropic-messages',
      blocks: [
        { type: 'text', text: 'Let me look.' },
        { type: 'tool_use', id: 'call_1', name: 'list_places', input: {} },
        { type: 'tool_use', id: 'call_2', name: 'get_weather', input: {} },
      ],
    });
    expect(history.filter((message) => message.role === 'tool')).toEqual([
      expect.objectContaining({ toolCallId: 'call_1' }),
      {
        role: 'tool',
        toolCallId: 'call_2',
        name: 'get_weather',
        output: expect.stringContaining('did not run'),
        isError: true,
      },
    ]);
    const messages = toAnthropicMessages(history);
    const results = messages[2].content
      .filter((block) => block.type === 'tool_result')
      .map((block) => block.tool_use_id);
    expect(results).toEqual(['call_1', 'call_2']);
    expect(messages).toHaveLength(3);
  });

  it('ASTHIS-020: the Responses API gets a function call of a stopped step that never ran answered', () => {
    const history = stoppedMidStep({
      adapter: 'openai-responses',
      items: [
        { type: 'function_call', call_id: 'call_1', name: 'list_places', arguments: '{}' },
        { type: 'function_call', call_id: 'call_2', name: 'get_weather', arguments: '{}' },
      ],
    });
    const outputs = toResponsesInput({ system: '', messages: history, tools: [] })
      .filter((item) => item.type === 'function_call_output')
      .map((item) => item.call_id);
    expect(outputs).toEqual(['call_1', 'call_2']);
  });

  it('ASTHIS-021: a stopped step replayed on another provider names every call it answers', () => {
    const anthropic = stoppedMidStep({
      adapter: 'anthropic-messages',
      blocks: [
        { type: 'text', text: 'Let me look.' },
        { type: 'tool_use', id: 'call_1', name: 'list_places', input: {} },
        { type: 'tool_use', id: 'call_2', name: 'get_weather', input: { day: 3 } },
      ],
    });
    expect(anthropic.find((message) => message.role === 'assistant')).toMatchObject({
      toolCalls: [
        { id: 'call_1', name: 'list_places', args: {} },
        { id: 'call_2', name: 'get_weather', args: { day: 3 } },
      ],
    });

    // Chat Completions: every tool message follows an assistant message whose tool_calls name it.
    const chat = toChatMessages({ system: '', messages: anthropic, tools: [] });
    chat.forEach((message, index) => {
      if (message.role !== 'tool') return;
      const before = chat.slice(0, index).reverse().find((earlier) => earlier.role === 'assistant');
      const named = ((before?.tool_calls ?? []) as Array<{ id: string }>).map((call) => call.id);
      expect(named).toContain(message.tool_call_id);
    });

    // Responses: every function_call_output has its function_call before it.
    const items = toResponsesInput({ system: '', messages: anthropic, tools: [] });
    items.forEach((item, index) => {
      if (item.type !== 'function_call_output') return;
      const made = items
        .slice(0, index)
        .some((earlier) => earlier.type === 'function_call' && earlier.call_id === item.call_id);
      expect(made).toBe(true);
    });

    // Anthropic: a step the Responses API recorded is rebuilt with every tool_use its results answer.
    const responses = stoppedMidStep({
      adapter: 'openai-responses',
      items: [
        { type: 'function_call', call_id: 'call_1', name: 'list_places', arguments: '{}' },
        { type: 'function_call', call_id: 'call_2', name: 'get_weather', arguments: 'not json' },
      ],
    });
    const messages = toAnthropicMessages(responses);
    const uses = messages[1].content.filter((block) => block.type === 'tool_use');
    expect(uses.map((block) => [block.id, block.input])).toEqual([
      ['call_1', {}],
      ['call_2', {}],
    ]);
    const results = messages[2].content
      .filter((block) => block.type === 'tool_result')
      .map((block) => block.tool_use_id);
    expect(results).toEqual(['call_1', 'call_2']);
  });

  it('ASTHIS-017: a step that only kept a note is the model call it was, answered with what was kept', () => {
    const history = toChatHistory(
      [
        row('user', [{ type: 'text', text: 'Remember the ferry leaves at 7' }]),
        row('assistant', [
          {
            type: 'tool-call',
            toolCallId: 'n1',
            toolName: 'remember_for_trip',
            args: { note: 'Ferry at 7' },
            result: { notes: 'Ferry at 7' },
          },
        ]),
        row('assistant', [{ type: 'text', text: 'Noted.' }]),
      ],
      new Map(),
    );
    expect(history).toEqual([
      { role: 'user', text: 'Remember the ferry leaves at 7' },
      {
        role: 'assistant',
        text: '',
        toolCalls: [{ id: 'n1', name: 'remember_for_trip', args: { note: 'Ferry at 7' } }],
        providerState: null,
      },
      { role: 'tool', toolCallId: 'n1', name: 'remember_for_trip', output: '{"notes":"Ferry at 7"}' },
      { role: 'assistant', text: 'Noted.', toolCalls: [], providerState: null },
    ]);
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
