import {
  TREK_WS_EVENTS,
  TREK_WS_EVENT_NAMES,
  TREK_WS_TRIP_EVENT_NAMES,
  TREK_WS_USER_EVENT_NAMES,
  type TrekWsEventName,
} from './events.schema';

import { describe, it, expect } from 'vitest';

/**
 * One representative wire payload per event, transcribed from the emitting
 * server call sites. The completeness guard below fails the moment a registry
 * event has no fixture (or a fixture goes stale), i18n-parity style — so the
 * fixture map cannot silently shrink relative to the registry.
 */
const FIXTURES: Record<TrekWsEventName, Record<string, unknown>> = {
  'place:created': { place: { id: 3, name: 'Louvre' } },
  'place:updated': { place: { id: 3, name: 'Louvre' } },
  'place:deleted': { placeId: 3 },
  'assignment:created': { assignment: { id: 9, day_id: 2 } },
  'assignment:updated': { assignment: { id: 9, day_id: 2 } },
  'assignment:deleted': { assignmentId: 9, dayId: 2 },
  'assignment:moved': { assignment: { id: 9, day_id: 4 }, oldDayId: 2, newDayId: 4 },
  'assignment:reordered': { dayId: 2, orderedIds: [3, 1, 2] },
  'assignment:participants': { assignmentId: 9, participants: [{ user_id: 1 }] },
  'day:created': { day: { id: 2, date: '2026-06-11' } },
  'day:updated': { day: { id: 2, date: '2026-06-11' } },
  'day:deleted': { dayId: 2 },
  'day:reordered': { orderedIds: [2, 1] },
  'dayNote:created': { dayId: 2, note: { id: 5 } },
  'dayNote:updated': { dayId: 2, note: { id: 5 } },
  'dayNote:deleted': { noteId: 5, dayId: 2 },
  'packing:created': { item: { id: 7 } },
  'packing:updated': { item: { id: 7 } },
  'packing:deleted': { itemId: 7 },
  'packing:reordered': { orderedIds: [7, 8] },
  'packing:bag-created': { bag: { id: 1 } },
  'packing:bag-updated': { bag: { id: 1 } },
  'packing:bag-deleted': { bagId: 1 },
  'packing:bag-members-updated': { bagId: 1, members: [{ user_id: 1 }] },
  'packing:assignees': { category: 'clothes', assignees: [1, 2] },
  'packing:template-applied': { items: [{ id: 7 }] },
  'todo:created': { item: { id: 4 } },
  'todo:updated': { item: { id: 4 } },
  'todo:deleted': { itemId: 4 },
  'todo:assignees': { category: 'before', assignees: [1] },
  'budget:created': { item: { id: 11 } },
  'budget:updated': { item: { id: 11 } },
  'budget:deleted': { itemId: 11 },
  'budget:reordered': { orderedIds: [11, 12] },
  'budget:members-updated': { itemId: 11, members: [{ user_id: 1 }], persons: 2 },
  'budget:member-paid-updated': { itemId: 11, userId: 1, paid: true },
  'budget:settlement-created': { settlement: { id: 2 } },
  'budget:settlement-updated': { settlement: { id: 2 } },
  'budget:settlement-deleted': { settlementId: 2 },
  'reservation:created': { reservation: { id: 6 } },
  'reservation:updated': { reservation: { id: 6 } },
  'reservation:deleted': { reservationId: 6 },
  'reservation:positions': { positions: [{ id: 6, position: 0 }], day_id: 2 },
  'reservation:travelers-updated': { reservationId: 6, travelers: [{ user_id: 1 }] },
  'accommodation:created': { accommodation: { id: 8 } },
  'accommodation:updated': { accommodation: { id: 8 } },
  'accommodation:deleted': { accommodationId: 8 },
  'trip:updated': { trip: { id: 1, name: 'Paris' } },
  'trip:deleted': { id: 1 },
  'member:added': { member: { user_id: 2 } },
  'member:removed': { userId: 2 },
  'file:created': { file: { id: 13 } },
  'file:updated': { file: { id: 13 } },
  'file:deleted': { fileId: 13 },
  'collab:note:created': { note: { id: 3 } },
  'collab:note:updated': { note: { id: 3 } },
  'collab:note:deleted': { noteId: 3 },
  'collab:poll:created': { poll: { id: 2 } },
  'collab:poll:voted': { poll: { id: 2 } },
  'collab:poll:closed': { poll: { id: 2 } },
  'collab:poll:deleted': { pollId: 2 },
  'collab:message:created': { message: { id: 14 } },
  'collab:message:reacted': { messageId: 14, reactions: { '👍': [1] } },
  'collab:message:deleted': { messageId: 14, username: 'ana' },
  'memories:updated': { userId: 1 },
  'notification:new': { notification: { id: 21, sender_username: 'ana' } },
  'notification:updated': { notification: { id: 21 } },
  'collections:updated': { collectionId: 4 },
  'collections:accepted': { collectionId: 4 },
  'collections:declined': { collectionId: 4 },
  'collections:left': { collectionId: 4 },
  'collections:deleted': { collectionId: 4 },
  'collections:cancelled': { collectionId: 4 },
  'collections:removed': { collectionId: 4 },
  'collections:invite': { from: { id: 1, username: 'ana' }, collectionId: 4 },
  'vacay:update': {},
  'vacay:settings': {},
  'vacay:accepted': {},
  'vacay:declined': {},
  'vacay:cancelled': {},
  'vacay:dissolved': {},
  'vacay:invite': { from: { id: 1, username: 'ana' }, planId: 2 },
  'vacay:share': { from: { id: 1 } },
  'vacay:share-removed': {},
  'vacay:shared-update': {},
  'journey:trip:synced': { journeyId: 3, tripId: 1 },
  'journey:entry:created': { journeyId: 3, entry: { id: 5 } },
  'journey:entry:updated': { journeyId: 3, entry: { id: 5 } },
  'journey:entry:deleted': { journeyId: 3, entryId: 5 },
  'journey:entries:reordered': { journeyId: 3, orderedIds: [5, 4] },
  'journey:book:saved': { journeyId: 7, version: 4, savedBy: 1 },
  'journey:book:peers': {
    journeyId: 7,
    peers: [{ socketId: 3, userId: 2, username: 'ada', avatar: null }],
  },
  'journey:book:cursor': { journeyId: 7, socketId: 3, userId: 2, spreadIndex: 0, x: 105.5, y: 60 },
  'journey:contributor:changed': { journeyId: 3, targetUserId: 2, role: 'editor' },
  'import:progress': { jobId: 'j1', tripId: 1, status: 'running', done: 1, total: 3, fileName: 'a.pdf' },
  'import:done': { jobId: 'j1', tripId: 1, result: { items: [] } },
  'import:error': { jobId: 'j1', tripId: 1, message: 'boom' },
};

/** Divergent shapes emitted for the same event today (see DRIFT notes in the registry). */
const DRIFT_VARIANTS: Partial<Record<TrekWsEventName, Record<string, unknown>[]>> = {
  'day:reordered': [{ day: { id: 2 } }],
  'budget:reordered': [{ orderedCategories: ['food', 'transport'] }],
  'reservation:created': [{}],
  'reservation:updated': [{}],
  'reservation:positions': [{ positions: [], dayId: 2 }],
  'accommodation:created': [{}],
  'accommodation:updated': [{}],
  'accommodation:deleted': [{}, { id: 8, linkedReservationId: 6 }],
  'journey:entry:updated': [{ journeyId: 3, entryId: 5 }],
  'journey:book:peers': [{ journeyId: 7, peers: [] }],
  // Off the page: the arrow goes, the person stays.
  'journey:book:cursor': [{ journeyId: 7, socketId: 3, userId: 2, spreadIndex: 4, x: null, y: null }],
};

describe('@trek/shared realtime event registry', () => {
  it('WSEVT-REG-001: pins the authoritative inventory counts (65 trip + 32 user = 97)', () => {
    expect(TREK_WS_TRIP_EVENT_NAMES).toHaveLength(65);
    expect(TREK_WS_USER_EVENT_NAMES).toHaveLength(32);
    expect(TREK_WS_EVENT_NAMES).toHaveLength(97);
  });

  it('WSEVT-REG-002: every name is domain:action shaped and outside the reserved plugin: namespace', () => {
    for (const name of TREK_WS_EVENT_NAMES) {
      expect(name).toMatch(/^[a-zA-Z]+(:[a-zA-Z-]+)+$/);
      expect(name.startsWith('plugin:')).toBe(false);
    }
  });

  it('WSEVT-REG-003: trip/user scopes partition the registry', () => {
    const union = new Set<string>([...TREK_WS_TRIP_EVENT_NAMES, ...TREK_WS_USER_EVENT_NAMES]);
    expect(union.size).toBe(TREK_WS_EVENT_NAMES.length);
  });

  it('WSEVT-REG-004: the fixture map covers every registry event (completeness guard)', () => {
    expect(Object.keys(FIXTURES).sort()).toEqual([...TREK_WS_EVENT_NAMES].sort());
  });

  it('WSEVT-REG-005: every event schema parses its representative server payload', () => {
    for (const name of TREK_WS_EVENT_NAMES) {
      const result = TREK_WS_EVENTS[name].payload.safeParse(FIXTURES[name]);
      expect(result.success, `${name} rejected its fixture: ${JSON.stringify(FIXTURES[name])}`).toBe(true);
    }
  });

  it('WSEVT-REG-006: drift unions accept every shape the server emits today', () => {
    for (const [name, variants] of Object.entries(DRIFT_VARIANTS)) {
      for (const variant of variants ?? []) {
        const result = TREK_WS_EVENTS[name as TrekWsEventName].payload.safeParse(variant);
        expect(result.success, `${name} rejected drift variant ${JSON.stringify(variant)}`).toBe(true);
      }
    }
  });

  it('WSEVT-REG-007: payload schemas tolerate the MCP _source marker (strip, not reject)', () => {
    const result = TREK_WS_EVENTS['place:created'].payload.safeParse({
      place: { id: 3 },
      _source: 'mcp',
    });
    expect(result.success).toBe(true);
  });
});
