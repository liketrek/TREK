import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildDay, buildAssignment, buildPlace } from '../../helpers/factories';
import type { Assignment } from '../../../src/types';

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > assignments', () => {
  const seedData = () => {
    useTripStore.setState({
      days: [buildDay({ id: 10 }), buildDay({ id: 20 })],
      assignments: {
        '10': [buildAssignment({ id: 100, day_id: 10 })],
        '20': [],
      },
    });
  };

  it('FE-WSEVT-ASSIGN-001: assignment:created adds assignment to correct day', () => {
    seedData();
    const newAssignment = buildAssignment({ id: 200, day_id: 20 });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: newAssignment });
    const { assignments } = useTripStore.getState();
    expect(assignments['20']).toHaveLength(1);
    expect(assignments['20'][0].id).toBe(200);
    expect(assignments['10']).toHaveLength(1);
  });

  it('FE-WSEVT-ASSIGN-002: assignment:created is idempotent — no duplicate if same ID', () => {
    seedData();
    const duplicate = buildAssignment({ id: 100, day_id: 10 });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: duplicate });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(1);
  });

  it('FE-WSEVT-ASSIGN-003: assignment:created replaces temp (negative) ID assignment with same place_id', () => {
    const place = buildPlace({ id: 55 });
    const tempAssignment = buildAssignment({ id: -1, day_id: 10, place, place_id: place.id });
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: { '10': [tempAssignment] },
    });
    const realAssignment = buildAssignment({ id: 500, day_id: 10, place, place_id: place.id });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: realAssignment });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(1);
    expect(assignments['10'][0].id).toBe(500);
  });

  it('FE-WSEVT-ASSIGN-003b: a second assignment of an already-present place is NOT suppressed (H11)', () => {
    const place = buildPlace({ id: 55 });
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      // A committed (positive-id) assignment of place 55 already on the day.
      assignments: { '10': [buildAssignment({ id: 100, day_id: 10, place, place_id: place.id })] },
    });
    // A legitimately new, distinct assignment of the same place arrives.
    const second = buildAssignment({ id: 300, day_id: 10, place, place_id: place.id });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: second });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(2);
    expect(assignments['10'].map(a => a.id).sort((x, y) => x - y)).toEqual([100, 300]);
  });

  it('FE-WSEVT-ASSIGN-003c: temp reconciliation replaces only the matching place, not a sibling temp (H11)', () => {
    const place55 = buildPlace({ id: 55 });
    const place66 = buildPlace({ id: 66 });
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: {
        '10': [
          buildAssignment({ id: -1, day_id: 10, place: place55, place_id: 55 }),
          buildAssignment({ id: -2, day_id: 10, place: place66, place_id: 66 }),
        ],
      },
    });
    const real = buildAssignment({ id: 500, day_id: 10, place: place55, place_id: 55 });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: real });
    const { assignments } = useTripStore.getState();
    const ids = assignments['10'].map(a => a.id);
    expect(assignments['10']).toHaveLength(2);
    expect(ids).toContain(500);   // temp 55 reconciled to real
    expect(ids).toContain(-2);    // sibling temp 66 untouched
    expect(ids).not.toContain(-1);
  });

  it('FE-WSEVT-ASSIGN-003d: place-less assignments do not collapse onto each other (H11)', () => {
    // Defensive: a malformed event lacking place data must not let the
    // `place?.id === placeId` reconciliation match undefined === undefined.
    const placeless = (id: number): Assignment =>
      ({ ...buildAssignment({ id, day_id: 10 }), place: undefined, place_id: undefined } as unknown as Assignment);
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: { '10': [placeless(-1)] },
    });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:created', assignment: placeless(700) });
    const { assignments } = useTripStore.getState();
    // No placeId → no reconcile; both survive as distinct rows (no collapse).
    expect(assignments['10']).toHaveLength(2);
  });

  it('FE-WSEVT-ASSIGN-004: assignment:updated merges updated data into correct day', () => {
    seedData();
    const updated = buildAssignment({ id: 100, day_id: 10, notes: 'Updated notes' });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:updated', assignment: updated });
    const { assignments } = useTripStore.getState();
    expect(assignments['10'][0].notes).toBe('Updated notes');
  });

  it('FE-WSEVT-ASSIGN-005: assignment:deleted removes assignment from day', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:deleted', assignmentId: 100, dayId: 10 });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(0);
  });

  it('FE-WSEVT-ASSIGN-006: assignment:moved removes from old day and adds to new day', () => {
    const movedAssignment = buildAssignment({ id: 100, day_id: 20 });
    useTripStore.setState({
      days: [buildDay({ id: 10 }), buildDay({ id: 20 })],
      assignments: {
        '10': [movedAssignment],
        '20': [],
      },
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'assignment:moved',
      assignment: movedAssignment,
      oldDayId: 10,
      newDayId: 20,
    });
    const { assignments } = useTripStore.getState();
    expect(assignments['10']).toHaveLength(0);
    expect(assignments['20']).toHaveLength(1);
    expect(assignments['20'][0].id).toBe(100);
  });

  it('FE-WSEVT-ASSIGN-007: assignment:reordered updates order_index values', () => {
    const a1 = buildAssignment({ id: 1, day_id: 10, order_index: 0 });
    const a2 = buildAssignment({ id: 2, day_id: 10, order_index: 1 });
    const a3 = buildAssignment({ id: 3, day_id: 10, order_index: 2 });
    useTripStore.setState({
      assignments: { '10': [a1, a2, a3] },
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'assignment:reordered',
      dayId: 10,
      orderedIds: [3, 1, 2],
    });
    const { assignments } = useTripStore.getState();
    const reordered = assignments['10'];
    const item3 = reordered.find(a => a.id === 3);
    const item1 = reordered.find(a => a.id === 1);
    const item2 = reordered.find(a => a.id === 2);
    expect(item3?.order_index).toBe(0);
    expect(item1?.order_index).toBe(1);
    expect(item2?.order_index).toBe(2);
  });

  // A collaborator can touch a day this client has never populated (the day row
  // exists, but no assignments key). Every applier must fall back to an empty list.
  describe('days with no assignments entry yet', () => {
    it('FE-WSEVT-ASSIGN-008: assignment:created seeds a fresh day key', () => {
      useTripStore.setState({ days: [buildDay({ id: 30 })], assignments: {} });
      useTripStore.getState().handleRemoteEvent({
        type: 'assignment:created',
        assignment: buildAssignment({ id: 300, day_id: 30 }),
      });
      expect(useTripStore.getState().assignments['30'].map(a => a.id)).toEqual([300]);
    });

    it('FE-WSEVT-ASSIGN-009: assignment:updated on an unseen day yields an empty list', () => {
      useTripStore.setState({ days: [buildDay({ id: 30 })], assignments: {} });
      useTripStore.getState().handleRemoteEvent({
        type: 'assignment:updated',
        assignment: buildAssignment({ id: 300, day_id: 30 }),
      });
      expect(useTripStore.getState().assignments['30']).toEqual([]);
    });

    it('FE-WSEVT-ASSIGN-010: assignment:deleted on an unseen day yields an empty list', () => {
      useTripStore.setState({ days: [buildDay({ id: 30 })], assignments: {} });
      useTripStore.getState().handleRemoteEvent({ type: 'assignment:deleted', assignmentId: 1, dayId: 30 });
      expect(useTripStore.getState().assignments['30']).toEqual([]);
    });

    it('FE-WSEVT-ASSIGN-011: assignment:reordered on an unseen day yields an empty list', () => {
      useTripStore.setState({ days: [buildDay({ id: 30 })], assignments: {} });
      useTripStore.getState().handleRemoteEvent({ type: 'assignment:reordered', dayId: 30, orderedIds: [1] });
      expect(useTripStore.getState().assignments['30']).toEqual([]);
    });

    it('FE-WSEVT-ASSIGN-011b: assignment:moved between two unseen days seeds both keys', () => {
      const moved = buildAssignment({ id: 300, day_id: 40 });
      useTripStore.setState({ days: [buildDay({ id: 30 }), buildDay({ id: 40 })], assignments: {} });
      useTripStore.getState().handleRemoteEvent({
        type: 'assignment:moved',
        assignment: moved,
        oldDayId: 30,
        newDayId: 40,
      });
      const { assignments } = useTripStore.getState();
      expect(assignments['30']).toEqual([]);
      expect(assignments['40'].map(a => a.id)).toEqual([300]);
    });

    it('FE-WSEVT-ASSIGN-012: an event for a day that is not in the store leaves days untouched', () => {
      // The Dexie write-through resolves the Day row from Zustand; a missing row
      // must not blow up the (fire-and-forget) persist.
      useTripStore.setState({ days: [], assignments: {} });
      expect(() => useTripStore.getState().handleRemoteEvent({
        type: 'assignment:created',
        assignment: buildAssignment({ id: 300, day_id: 77 }),
      })).not.toThrow();
      expect(useTripStore.getState().days).toEqual([]);
    });
  });

  it('FE-WSEVT-ASSIGN-013: assignment:updated only merges into the addressed assignment', () => {
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: {
        '10': [buildAssignment({ id: 100, day_id: 10, notes: 'keep' }), buildAssignment({ id: 101, day_id: 10, notes: 'keep too' })],
      },
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'assignment:updated',
      assignment: buildAssignment({ id: 101, day_id: 10, notes: 'changed' }),
    });
    const items = useTripStore.getState().assignments['10'];
    expect(items[0].notes).toBe('keep');
    expect(items[1].notes).toBe('changed');
  });

  it('FE-WSEVT-ASSIGN-014: assignment:moved drops a stale copy already sitting on the target day', () => {
    const moved = buildAssignment({ id: 100, day_id: 20 });
    useTripStore.setState({
      days: [buildDay({ id: 10 }), buildDay({ id: 20 })],
      assignments: {
        '10': [moved],
        // The target day still holds the previous copy plus an unrelated item.
        '20': [buildAssignment({ id: 100, day_id: 20 }), buildAssignment({ id: 200, day_id: 20 })],
      },
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'assignment:moved',
      assignment: moved,
      oldDayId: 10,
      newDayId: 20,
    });
    const target = useTripStore.getState().assignments['20'];
    expect(target.map(a => a.id)).toEqual([200, 100]);
    expect(useTripStore.getState().assignments['10']).toHaveLength(0);
  });

  it('FE-WSEVT-ASSIGN-015: assignment:reordered drops ids that are no longer on the day', () => {
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: { '10': [buildAssignment({ id: 1, day_id: 10 }), buildAssignment({ id: 2, day_id: 10 })] },
    });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:reordered', dayId: 10, orderedIds: [2, 999, 1] });
    expect(useTripStore.getState().assignments['10'].map(a => a.id)).toEqual([2, 1]);
  });

  it('FE-WSEVT-ASSIGN-016: assignment:reordered without orderedIds leaves the day list alone', () => {
    const existing = buildAssignment({ id: 1, day_id: 10 });
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      assignments: { '10': [existing] },
    });
    useTripStore.getState().handleRemoteEvent({ type: 'assignment:reordered', dayId: 10 });
    expect(useTripStore.getState().assignments['10']).toEqual([existing]);
  });
});
