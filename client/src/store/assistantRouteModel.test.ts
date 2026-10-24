/**
 * FE-AI-ROUTE-001 to FE-AI-ROUTE-006
 *
 * Which routes of the chat's cards the plan's map draws, and how: changes
 * that still stand on the map with the way they replace, the cards of the
 * latest answer that draws any (its ways each with a letter, the chosen one
 * solid), the order lines lie in, and the spots the waiting changes mark.
 * The looks are a stand-in here: the model reads cards only through them.
 */
import type { AssistantApplied, AssistantMessage, AssistantMessagePart, TourRouteCard, TrekCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { GENTLE, HIKE, SAVED } from '../../tests/helpers/assistantTour';
import type { CardMapLook, RouteLineSpec } from '../types/assistantMap';
import {
  type AnswerLayout,
  cardGhosts,
  cardHiddenGhosts,
  lookPoints,
  routeLines,
  routeRefs,
} from './assistantRouteModel';

const flat = (card: TourRouteCard): [number, number][] => card.line.map(([lat, lng]): [number, number] => [lat, lng]);

/** A look that draws a route card's line (rimmed), the way it replaces, and one spot for a held route. */
const LOOK: CardMapLook = {
  lines: (card: TrekCard, use): RouteLineSpec[] => {
    if (card.kind !== 'tourRoute') return [];
    if (use === 'before') {
      return card.previous ? [{ id: 'previous', lines: [card.previous.line], color: 'var(--faint)', dim: true }] : [];
    }
    if (card.line.length < 2) return [];
    const tints = [{ line: flat(card).slice(3, 6), color: 'var(--t3)' }];
    const route = { id: 'route', lines: [flat(card)], color: 'var(--route)', casing: 'var(--rim)' };
    return [{ ...route, dashed: !card.routed, tints }];
  },
  ghosts: (card) =>
    card.kind === 'tourRoute' ? [{ id: 'start', lat: 47.77, lng: 12.59, name: 'Bergen', variant: 'pin' }] : [],
  hidesEffectGhost: (card) => card.kind === 'tourRoute' && card.routed,
};

/** All an answer's cards as one group, as the chat lays out proposals of one activity. */
const AS_WAYS: AnswerLayout = (entries) => [entries];

function message(parts: AssistantMessagePart[], id = 'msg-1'): AssistantMessage {
  return { id, role: 'assistant', parts, status: 'complete', createdAt: '2026-10-21T08:00:00.000Z' };
}

function read(toolCallId: string, card: TourRouteCard): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'propose_hike', args: {}, result: {} },
    { type: 'data-trek-card', data: { toolCallId, card } },
  ];
}

type Approval = { approved?: boolean; resolution?: 'expired' };
function held(toolCallId: string, card: TourRouteCard, approval: Approval = {}, extra: object = {}) {
  return [
    {
      type: 'tool-call',
      toolCallId,
      toolName: 'create_hike',
      args: {},
      approval: { id: toolCallId, ...approval },
      ...extra,
    },
    {
      type: 'data-trek-change',
      data: { toolCallId, verbKey: 'addTour', subject: 'x', rows: [], dayId: null, placeIds: [], undoable: true, card },
    },
  ] as AssistantMessagePart[];
}

function receipt(toolCallId: string, entity: AssistantApplied['entity'], ids: number[]): AssistantMessagePart {
  return { type: 'data-trek-applied', data: { toolCallId, entity, ids, dayId: null, undoUntil: null } };
}

const PENDING: TourRouteCard = { ...HIKE, source: 'pending' };
const NOBODY = new Set<number>();

describe('assistantRouteModel', () => {
  it('FE-AI-ROUTE-001: a change stands on the map while undecided or running, and once applied until its place arrives', () => {
    const messages = [
      message([
        ...held('wait', PENDING),
        ...held('run', PENDING, { approved: true }),
        ...held('done', PENDING, { approved: true }, { result: {} }),
        receipt('done', 'tour', [41]),
        ...held('note', PENDING, { approved: true }, { result: {} }),
        receipt('note', 'day_note', [5]),
        ...held('no', PENDING, { approved: false }),
        ...held('late', PENDING, { resolution: 'expired' }),
        ...held('broke', PENDING, { approved: true }, { result: {}, isError: true }),
      ]),
    ];
    const standing = routeRefs(messages, {}, NOBODY, LOOK).map((ref) => `${ref.toolCallId}:${ref.use}`);
    const all = ['wait:before', 'wait:pending', 'run:before', 'run:pending', 'done:before', 'done:pending'];
    expect(standing).toEqual(all);

    const arrived = routeRefs(messages, {}, new Set([41]), LOOK).map((ref) => ref.toolCallId);
    expect(arrived).not.toContain('done');
  });

  it('FE-AI-ROUTE-002: the latest answer that draws routes is drawn, its ways lettered and the chosen one picked', () => {
    const older = message(read('old', SAVED), 'msg-0');
    const latest = message([...read('call_1', HIKE), ...read('call_2', GENTLE)], 'msg-1');
    const quiet = message([{ type: 'text', text: 'Both are fine.' }], 'msg-2');

    const first = routeRefs([older, latest, quiet], {}, NOBODY, LOOK, AS_WAYS);
    expect(first.map((ref) => [ref.toolCallId, ref.use, ref.way, ref.picked])).toEqual([
      ['call_1', 'look', 'a', true],
      ['call_2', 'look', 'b', false],
    ]);

    const chosen = routeRefs([older, latest], { 'tour:call_1': 'call_2' }, NOBODY, LOOK, AS_WAYS);
    expect(chosen.map((ref) => ref.picked)).toEqual([false, true]);

    // Laid out one by one, the cards are routes of their own: no letters.
    expect(routeRefs([latest], {}, NOBODY, LOOK).map((ref) => ref.way)).toEqual([null, null]);

    // A card under a change's call is that change's, never an answer's.
    const applied: AssistantMessagePart = { type: 'data-trek-card', data: { toolCallId: 'c9', card: SAVED } };
    const change = message([...held('c9', PENDING), applied]);
    const refs = routeRefs([change], {}, NOBODY, LOOK);
    expect(refs.map((ref) => ref.use)).toEqual(['before', 'pending']);
    expect(refs[1]?.card).toBe(SAVED);
  });

  it('FE-AI-ROUTE-006: once one of the ways is taken into the trip, the answer draws none of them; a discarded take brings them back', () => {
    const latest = message([...read('call_1', HIKE), ...read('call_2', GENTLE)], 'msg-1');
    const take = (approval: Approval) => {
      const parts = held('t1', PENDING, approval);
      const change = parts[1] as Extract<AssistantMessagePart, { type: 'data-trek-change' }>;
      change.data = { ...change.data, takenFrom: 'call_2' };
      return message(parts, 'msg-2');
    };
    const waiting = routeRefs([latest, take({})], {}, NOBODY, LOOK, AS_WAYS);
    expect(waiting.map((ref) => `${ref.toolCallId}:${ref.use}`)).toEqual(['t1:before', 't1:pending']);
    const discarded = routeRefs([latest, take({ approved: false })], {}, NOBODY, LOOK, AS_WAYS);
    expect(discarded.map((ref) => ref.toolCallId)).toEqual(['call_1', 'call_2']);
  });

  it("FE-AI-ROUTE-003: lines lie in order (replaced way, others, the chosen way, the lit one) in their ways' colours", () => {
    const previous = { line: flat(HIKE), distanceM: 8000, ascentM: null, minutes: null };
    const messages = [
      message([...held('upd', { ...PENDING, previous })], 'msg-0'),
      message([...read('call_1', HIKE), ...read('call_2', GENTLE)], 'msg-1'),
    ];
    const refs = routeRefs(messages, { 'tour:call_1': 'call_2' }, NOBODY, LOOK, AS_WAYS);

    const calm = routeLines(refs, LOOK, null);
    expect(calm.map((line) => line.id)).toEqual([
      'upd:before:previous',
      'upd:pending:route',
      'call_1:look:route',
      'call_2:look:route',
    ]);
    const [replaced, pending, wayA, wayB] = calm;
    expect(replaced).toMatchObject({ ref: 'upd', dim: true, casing: 'var(--bg-card)' });
    expect(replaced?.ends).toBeUndefined();
    expect(pending).toMatchObject({ color: 'var(--route)', casing: 'var(--rim)' });
    // The hike is a loop: one disc at its start, no ring at its end.
    expect(pending?.ends).toEqual({ start: [47.77, 12.59], end: null });
    expect(wayA).toMatchObject({ color: 'var(--hike-variant-a)', dashed: true });
    expect(wayA?.tints).toBeUndefined();
    expect(wayB).toMatchObject({ color: 'var(--hike-variant-b)' });
    expect(wayB?.dashed).toBeUndefined();
    expect(wayB?.tints).toHaveLength(1);

    const lit = routeLines(refs, LOOK, 'call_1');
    expect(lit[lit.length - 1]).toMatchObject({ id: 'call_1:look:route', hot: true });
    expect(lit[lit.length - 1]?.dashed).toBeUndefined();
  });

  it('FE-AI-ROUTE-004: a route joined straight stays dashed even when lit, and an open route has a ring at its end', () => {
    const straight: TourRouteCard = { ...HIKE, routed: false, line: HIKE.line.slice(0, 5) };
    const refs = routeRefs([message(read('s', straight))], {}, NOBODY, LOOK);
    const [line] = routeLines(refs, LOOK, 's');
    expect(line).toMatchObject({ dashed: true, hot: true });
    expect(line?.ends).toEqual({ start: [47.77, 12.59], end: [47.79, 12.62] });
  });

  it('FE-AI-ROUTE-005: waiting changes mark their spots under their call, hide the pin their line replaces, and answers frame', () => {
    const messages = [
      message([...held('wait', PENDING), ...held('flat', { ...PENDING, routed: false })], 'msg-0'),
      message(read('call_1', HIKE), 'msg-1'),
    ];
    const refs = routeRefs(messages, {}, NOBODY, LOOK);
    expect(cardGhosts(refs, LOOK)).toEqual([
      { id: 'wait:start', ref: 'wait', lat: 47.77, lng: 12.59, name: 'Bergen', variant: 'pin' },
      { id: 'flat:start', ref: 'flat', lat: 47.77, lng: 12.59, name: 'Bergen', variant: 'pin' },
    ]);
    expect([...cardHiddenGhosts(refs, LOOK)]).toEqual(['wait']);
    expect(lookPoints(refs, LOOK)).toEqual(flat(HIKE));
  });
});
