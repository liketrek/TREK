/**
 * FE-AI-STORE-MAP-001 to FE-AI-STORE-MAP-008
 *
 * The store's side of the assistant on the map: the live activity of a
 * running step, mentions in a question, the "before" snapshot a decision
 * takes, undoing a whole block, suggesting a found place for a day, and the
 * hover, camera and window state the planner's map reads.
 */
import type { AssistantMessage, Trip, UiStreamChunk } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assistantRepo } from '../repo/assistantRepo';
import type { Assignment } from '../types';
import { chatOf, useAssistantStore } from './assistantStore';
import { useTripStore } from './tripStore';

const TRIP = 4;
const ADD = 'c0ffee00-0000-4000-8000-00000000000a';
const MOVE = 'c0ffee00-0000-4000-8000-00000000000b';

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

const chat = () => chatOf(useAssistantStore.getState(), TRIP);
const store = () => useAssistantStore.getState();

function visit(id: number, dayId: number): Assignment {
  const place = { id: id * 10, name: `P${id}`, lat: 41, lng: 12 };
  return { id, day_id: dayId, place_id: id * 10, order_index: 0, place } as Assignment;
}

/** A thread holding two changes for the map: a new place on day 3, and a stop moved from day 3 to day 5. */
const HELD: AssistantMessage = {
  id: 'msg-1',
  role: 'assistant',
  status: 'awaiting_approval',
  createdAt: '2026-10-21T08:00:00.000Z',
  parts: [
    { type: 'tool-call', toolCallId: ADD, toolName: 'create_and_assign_place', args: {}, approval: { id: ADD } },
    {
      type: 'data-trek-change',
      data: {
        toolCallId: ADD,
        verbKey: 'addPlaceToDay',
        subject: 'Pantheon',
        rows: [],
        dayId: 3,
        placeIds: [],
        undoable: true,
        effect: {
          kind: 'add',
          dayId: 3,
          fromDayId: null,
          placeId: null,
          assignmentId: null,
          place: { name: 'Pantheon', lat: 41.9, lng: 12.48, categoryId: null },
        },
      },
    },
    { type: 'tool-call', toolCallId: MOVE, toolName: 'move_assignment', args: {}, approval: { id: MOVE } },
    {
      type: 'data-trek-change',
      data: {
        toolCallId: MOVE,
        verbKey: 'moveAssignment',
        subject: 'Forum',
        rows: [],
        dayId: 5,
        placeIds: [20],
        undoable: true,
        effect: { kind: 'move', dayId: 5, fromDayId: 3, placeId: 20, assignmentId: 2, place: null },
      },
    },
  ],
};

function holdThread() {
  useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat(), threadId: 7, messages: [HELD] } } });
}

beforeEach(() => {
  useAssistantStore.setState({
    status: null,
    window: { open: true, minimized: false },
    byTrip: {},
    lastApplied: null,
    mapLink: null,
    camera: null,
    preview: null,
    windowRect: null,
  });
  useTripStore.setState({
    trip: { id: TRIP } as Trip,
    assignments: { 3: [visit(1, 3), visit(2, 3)], 5: [visit(3, 5)] },
  });
});
afterEach(() => vi.restoreAllMocks());

describe('assistantStore: the live line', () => {
  it('FE-AI-STORE-MAP-001: a running step names its area until its result is in, and nothing is left once the turn ends', async () => {
    const seen: (string | null)[] = [];
    const unsubscribe = useAssistantStore.subscribe((s) => seen.push(chatOf(s, TRIP).live.activity?.label ?? null));
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(
      streamOf([
        { type: 'start', messageId: 'm1' },
        {
          type: 'data-trek-activity',
          data: {
            toolCallId: 's1',
            label: 'Trastevere',
            area: { type: 'point', lat: 41.88, lng: 12.47, radiusM: 800 },
          },
          transient: true,
        },
        { type: 'tool-output-available', toolCallId: 's1', output: {} },
        {
          type: 'data-trek-activity',
          data: { toolCallId: 's2', label: 'Monti', area: null },
          transient: true,
        },
        { type: 'finish' },
      ])
    );
    await store().send(TRIP, 'Lunch near Trastevere');
    unsubscribe();
    expect(seen).toContain('Trastevere');
    expect(seen).toContain('Monti');
    expect(seen.indexOf('Monti')).toBeGreaterThan(seen.lastIndexOf('Trastevere'));
    expect(chat().live.activity).toBeNull();
    // The stored message never keeps it.
    expect(chat().messages[1]?.parts.some((p) => (p.type as string) === 'data-trek-activity')).toBe(false);
  });
});

describe('assistantStore: mentions', () => {
  it('FE-AI-STORE-MAP-002: a question carries the mentions still in its text, minus what the focus already names', async () => {
    store().setFocus(TRIP, { dayId: 3 });
    store().addMention(TRIP, { kind: 'place', id: 9, label: 'Louvre' });
    store().addMention(TRIP, { kind: 'place', id: 9, label: 'Louvre' });
    store().addMention(TRIP, { kind: 'reservation', id: 4, label: 'Ferry' });
    store().addMention(TRIP, { kind: 'day', id: 3, label: 'Day 3' });
    expect(chat().mentions).toHaveLength(3);
    const send = vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf([{ type: 'finish' }]));

    await store().send(TRIP, 'Is @Louvre open on @Day 3?');

    expect(send.mock.calls[0]?.[1]).toMatchObject({ mentions: [{ kind: 'place', id: 9 }] });
    const question = chat().messages[0];
    expect(question?.parts[1]).toEqual({
      type: 'data-trek-mentions',
      data: { items: [{ kind: 'place', id: 9, label: 'Louvre' }] },
    });
    expect(chat().mentions).toEqual([]);
  });
});

describe('assistantStore: before and after', () => {
  it('FE-AI-STORE-MAP-003: a decision snapshots the days its applied changes touch, and notes the places they make', async () => {
    holdThread();
    vi.spyOn(assistantRepo, 'decide').mockResolvedValueOnce(
      streamOf([
        { type: 'start', messageId: 'msg-1' },
        { type: 'tool-output-available', toolCallId: ADD, output: { id: 77 } },
        { type: 'data-trek-applied', data: { toolCallId: ADD, entity: 'place', ids: [77], dayId: 3, undoUntil: null } },
        { type: 'finish' },
      ])
    );

    await store().decide(TRIP, [
      { toolCallId: ADD, approved: true },
      { toolCallId: MOVE, approved: false },
    ]);

    const compare = chat().compare;
    expect(compare).toMatchObject({ blockKey: ADD, mode: 'after', newPlaceCalls: [ADD], addedPlaceIds: [77] });
    expect(Object.keys(compare?.snapshot ?? {})).toEqual(['3']);
    expect(compare?.snapshot[3]?.map((v) => v.id)).toEqual([1, 2]);

    store().setCompare(TRIP, 'before');
    expect(chat().compare?.mode).toBe('before');
    expect(store().camera).toMatchObject({ tripId: TRIP, mode: 'fit', why: 'user' });
    expect(store().camera?.points.length).toBeGreaterThan(0);

    // A new question looks at the plan as it is now.
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(streamOf([{ type: 'finish' }]));
    await store().send(TRIP, 'Thanks');
    expect(chat().compare?.mode).toBe('after');
  });

  it('FE-AI-STORE-MAP-004: no snapshot for another trip, and none left when the server refuses the decision', async () => {
    holdThread();
    useTripStore.setState({ trip: { id: 99 } as Trip });
    vi.spyOn(assistantRepo, 'decide').mockResolvedValueOnce(streamOf([{ type: 'finish' }]));
    await store().decide(TRIP, [{ toolCallId: ADD, approved: true }]);
    expect(chat().compare).toBeNull();

    holdThread();
    useTripStore.setState({ trip: { id: TRIP } as Trip });
    vi.spyOn(assistantRepo, 'decide').mockRejectedValueOnce({ response: { status: 500 } });
    await store().decide(TRIP, [{ toolCallId: ADD, approved: true }]);
    expect(chat().compare).toBeNull();
  });

  function holdCompare() {
    holdThread();
    useAssistantStore.setState({
      byTrip: {
        [TRIP]: {
          ...chat(),
          compare: { blockKey: 'a', mode: 'before', snapshot: {}, newPlaceCalls: [], addedPlaceIds: [] },
        },
      },
    });
  }

  it('FE-AI-STORE-MAP-005: undoing a block goes last first and ends the comparison once all of it is undone', async () => {
    holdCompare();
    const undo = vi.spyOn(assistantRepo, 'undo').mockResolvedValue(undefined);

    const result = await store().undoBlock(TRIP, ['a', 'b', 'c']);

    expect(undo.mock.calls.map(([, id]) => id)).toEqual(['c', 'b', 'a']);
    expect(result).toEqual({ done: 3, stale: 0, failed: 0 });
    expect(chat().undone).toEqual({ a: true, b: true, c: true });
    expect(chat().compare).toBeNull();
  });

  it('FE-AI-STORE-MAP-005b: a refusal stops the run and a stale change keeps the comparison', async () => {
    holdCompare();
    const undo = vi
      .spyOn(assistantRepo, 'undo')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ response: { status: 429 } });

    const failed = await store().undoBlock(TRIP, ['a', 'b', 'c']);

    expect(undo.mock.calls.map(([, id]) => id)).toEqual(['c', 'b']);
    expect(failed).toEqual({ done: 1, stale: 0, failed: 1 });
    expect(chat().undone).toEqual({ c: true });
    expect(chat().compare).not.toBeNull();

    undo.mockReset();
    undo.mockRejectedValueOnce({ response: { status: 409 } }).mockResolvedValueOnce(undefined);
    const stale = await store().undoBlock(TRIP, ['a', 'b']);

    expect(stale).toEqual({ done: 1, stale: 1, failed: 0 });
    expect(chat().compare).not.toBeNull();
  });
});

describe('assistantStore: a found place for a day', () => {
  it('FE-AI-STORE-MAP-006: the suggestion arrives as a message; a refusal shows its code', async () => {
    holdThread();
    const reply: AssistantMessage = { ...HELD, id: 'msg-2', parts: [] };
    const add = vi.spyOn(assistantRepo, 'addFoundPlace').mockResolvedValueOnce({ message: reply });

    await store().addFoundPlace(TRIP, 'call:0', 3);

    expect(add).toHaveBeenCalledWith(TRIP, 7, expect.objectContaining({ ref: 'call:0', dayId: 3 }));
    expect(chat().messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);

    // The server answers with the whole answer the card joined, under its id: it replaces, never doubles.
    const joined: AssistantMessage = { ...reply, status: 'awaiting_approval' };
    vi.spyOn(assistantRepo, 'addFoundPlace').mockResolvedValueOnce({ message: joined });
    await store().addFoundPlace(TRIP, 'call:2', 3);
    expect(chat().messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
    expect(chat().messages[1]).toBe(joined);

    vi.spyOn(assistantRepo, 'addFoundPlace').mockRejectedValueOnce({
      response: { status: 409, data: { code: 'decide_first' } },
    });
    await store().addFoundPlace(TRIP, 'call:1', 3);
    expect(chat().error).toBe('decide_first');
  });
});

describe('assistantStore: the map link', () => {
  it('FE-AI-STORE-MAP-007: a repeated hover changes nothing, and every camera request is a new one', () => {
    store().setMapHover(TRIP, ADD, 'card');
    const link = store().mapLink;
    store().setMapHover(TRIP, ADD, 'card');
    expect(store().mapLink).toBe(link);
    store().setMapHover(TRIP, ADD, 'map');
    expect(store().mapLink).toEqual({ tripId: TRIP, hoveredId: ADD, source: 'map' });

    store().requestCamera(TRIP, [], 'fit', 'user');
    expect(store().camera).toBeNull();
    store().requestCamera(TRIP, [[41, 12]], 'pan', 'user');
    store().requestCamera(TRIP, [[41, 12]], 'pan', 'user');
    expect(store().camera).toMatchObject({ seq: 2, mode: 'pan', points: [[41, 12]] });
  });

  it('FE-AI-STORE-MAP-008: closing the window takes the hover and the preview pin along and goes back to "after"', () => {
    useAssistantStore.setState({
      byTrip: {
        [TRIP]: {
          ...chat(),
          compare: { blockKey: 'a', mode: 'before', snapshot: {}, newPlaceCalls: [], addedPlaceIds: [] },
        },
      },
    });
    store().setMapHover(TRIP, ADD, 'card');
    store().setPreviewPin({ tripId: TRIP, ref: 'call:0', lat: 41, lng: 12, name: 'Pantheon' });
    store().setWindowRect({ x: 10, y: 20, width: 360, height: 480 });

    store().close();

    expect(store()).toMatchObject({ mapLink: null, preview: null, window: { open: false } });
    expect(store().windowRect).toEqual({ x: 10, y: 20, width: 360, height: 480 });
    expect(chat().compare?.mode).toBe('after');
  });
});
