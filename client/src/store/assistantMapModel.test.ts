/**
 * FE-AI-MAPMODEL-001 to FE-AI-MAPMODEL-009
 *
 * What the map makes of the assistant's chat, without React or a store: which
 * changes stand on the map as ghosts and until when, the box a running step
 * searches, the days a block touches, the "before" plan laid over the view,
 * and how far the floating window reaches over the map.
 */
import type { AssistantChangeEffect, AssistantMessage, AssistantMessagePart } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { Assignment, AssignmentsMap } from '../types';
import {
  activityFocus,
  blockDays,
  blockKeyOf,
  dayPoints,
  ghostCandidates,
  liveGhosts,
  overlaySnapshot,
  snapshotDays,
  windowCover,
} from './assistantMapModel';

const NEW_PLACE: AssistantChangeEffect = {
  kind: 'add',
  dayId: 3,
  fromDayId: null,
  placeId: null,
  assignmentId: null,
  place: { name: 'Pantheon', lat: 41.9, lng: 12.48, categoryId: 2 },
};
const MOVE: AssistantChangeEffect = {
  kind: 'move',
  dayId: 4,
  fromDayId: 3,
  placeId: 20,
  assignmentId: 200,
  place: null,
};
const REMOVE: AssistantChangeEffect = { ...MOVE, kind: 'remove', fromDayId: null };

type Approval = { approved?: boolean; resolution?: 'cancelled' | 'expired' };

function call(toolCallId: string, approval: Approval, result?: unknown): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'x', args: {}, approval: { id: toolCallId, ...approval }, result },
  ];
}

function change(toolCallId: string, effect: AssistantChangeEffect): AssistantMessagePart {
  return {
    type: 'data-trek-change',
    data: {
      toolCallId,
      verbKey: 'addPlace',
      subject: 'x',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: true,
      effect,
    },
  };
}

function message(parts: AssistantMessagePart[]): AssistantMessage {
  return { id: 'msg-1', role: 'assistant', parts, status: 'awaiting_approval', createdAt: '2026-10-21T08:00:00.000Z' };
}

function visit(id: number, dayId: number, lat = 41, lng = 12): Assignment {
  const place = { id: id * 10, name: `P${id}`, lat, lng };
  return { id, day_id: dayId, place_id: id * 10, order_index: 0, place } as Assignment;
}

describe('assistantMapModel: ghosts', () => {
  it('FE-AI-MAPMODEL-001: a change waiting for a decision is a ghost; a removal and a decided-against one are not', () => {
    const messages = [
      message([
        ...call('a', {}),
        change('a', NEW_PLACE),
        ...call('b', {}),
        change('b', REMOVE),
        ...call('c', { approved: false }),
        change('c', MOVE),
        ...call('d', { resolution: 'expired' }),
        change('d', MOVE),
        ...call('e', {}),
      ]),
    ];
    expect(ghostCandidates(messages)).toEqual([
      { toolCallId: 'a', effect: NEW_PLACE, status: 'waiting', placeId: null },
    ]);
  });

  it('FE-AI-MAPMODEL-002: an applied new place stays a ghost until the trip holds the place it made', () => {
    const running = [message([...call('a', { approved: true }), change('a', NEW_PLACE)])];
    expect(liveGhosts(ghostCandidates(running), new Set())).toHaveLength(1);

    const applied = [
      message([
        ...call('a', { approved: true }, { id: 77 }),
        change('a', NEW_PLACE),
        { type: 'data-trek-applied', data: { toolCallId: 'a', entity: 'place', ids: [77], dayId: 3, undoUntil: null } },
      ]),
    ];
    const candidates = ghostCandidates(applied);
    expect(candidates[0]).toMatchObject({ status: 'applied', placeId: 77 });
    expect(liveGhosts(candidates, new Set())).toHaveLength(1);
    expect(liveGhosts(candidates, new Set([77]))).toEqual([]);
  });

  it('FE-AI-MAPMODEL-003: an applied change to a place that exists, or one that failed, leaves no ghost', () => {
    const messages = [
      message([
        ...call('a', { approved: true }),
        change('a', MOVE),
        ...call('b', { approved: true }, 'boom'),
        change('b', NEW_PLACE),
      ]),
    ];
    expect(liveGhosts(ghostCandidates(messages), new Set())).toEqual([]);
  });

  it('FE-AI-MAPMODEL-004: a block is named by its first call', () => {
    expect(blockKeyOf(['x', 'y'])).toBe('x');
    expect(blockKeyOf([])).toBe('');
  });
});

describe('assistantMapModel: areas and days', () => {
  it('FE-AI-MAPMODEL-005: a box is its corners; a point with a radius becomes the box around it', () => {
    expect(activityFocus(null)).toEqual([]);
    expect(activityFocus({ type: 'bbox', south: 1, west: 2, north: 3, east: 4 })).toEqual([
      [1, 2],
      [3, 4],
    ]);
    const [[s, w], [n, e]] = activityFocus({ type: 'point', lat: 0, lng: 10, radiusM: 1113.2 });
    expect(n - s).toBeCloseTo(0.02, 4);
    expect(e - w).toBeCloseTo(0.02, 4);
    expect((s + n) / 2).toBeCloseTo(0, 6);
  });

  it('FE-AI-MAPMODEL-006: a block touches the days its changes land on and come from, each once', () => {
    expect(blockDays([NEW_PLACE, MOVE, MOVE])).toEqual([3, 4]);
    const plan: AssignmentsMap = { 3: [visit(1, 3, 41, 12)], 4: [visit(2, 4, 42, 13)] };
    expect(dayPoints(plan, [3, 4, 9])).toEqual([
      [41, 12],
      [42, 13],
    ]);
  });
});

describe('assistantMapModel: before and after', () => {
  it('FE-AI-MAPMODEL-007: the snapshot copies only the days asked for', () => {
    const plan: AssignmentsMap = { 3: [visit(1, 3)], 4: [visit(2, 4)] };
    const snapshot = snapshotDays(plan, [3]);
    expect(Object.keys(snapshot)).toEqual(['3']);
    expect(snapshot[3]).not.toBe(plan[3]);
  });

  it('FE-AI-MAPMODEL-008: "before" shows a stop the block took away, and keeps a stop the view hides hidden', () => {
    const hotel = visit(5, 3);
    const removed = visit(6, 3);
    const kept = visit(7, 3);
    const stored: AssignmentsMap = { 3: [hotel, kept], 4: [visit(8, 4)] };
    const view: AssignmentsMap = { 3: [kept], 4: [visit(8, 4)] };
    const before = overlaySnapshot(view, stored, { 3: [hotel, removed, kept] });
    expect(before[3]?.map((v) => v.id)).toEqual([6, 7]);
    expect(before[4]).toBe(view[4]);
  });
});

describe('assistantMapModel: the window over the map', () => {
  it('FE-AI-MAPMODEL-009: covers the side it sits on, mirrored right to left, and nothing when it is too wide', () => {
    const rect = { x: 900, y: 80, width: 360, height: 500 };
    expect(windowCover(rect, 1280, false)).toEqual({ side: 'right', px: 404 });
    expect(windowCover({ ...rect, x: 20 }, 1280, false)).toEqual({ side: 'left', px: 404 });
    // In Arabic x counts from the right edge: 20 from the right is the right side.
    expect(windowCover({ ...rect, x: 20 }, 1280, true)).toEqual({ side: 'right', px: 404 });
    expect(windowCover({ ...rect, width: 900 }, 1280, false)).toBeNull();
    expect(windowCover(null, 1280, false)).toBeNull();
  });
});
