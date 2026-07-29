import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores, seedStore } from '../../helpers/store';
import { buildPlace, buildAssignment } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';

vi.mock('../../../src/api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  joinTrip: vi.fn(),
  leaveTrip: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
}));

beforeEach(() => {
  resetAllStores();
});

describe('assignmentsSlice', () => {
  describe('assignPlaceToDay', () => {
    it('FE-ASSIGN-001: assignPlaceToDay adds optimistic temp ID (negative) immediately', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, {
        places: [place],
        assignments: { '1': [] },
      });

      // Don't await — check state mid-flight
      let tempAdded = false;
      server.use(
        http.post('/api/trips/1/days/1/assignments', async () => {
          const state = useTripStore.getState();
          const dayAssignments = state.assignments['1'];
          if (dayAssignments.some(a => a.id < 0)) {
            tempAdded = true;
          }
          const result = buildAssignment({ day_id: 1, place_id: 10, place });
          return HttpResponse.json({ assignment: result });
        }),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10);
      expect(tempAdded).toBe(true);
    });

    it('FE-ASSIGN-002: after API success, temp ID is replaced with real assignment', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, {
        places: [place],
        assignments: { '1': [] },
      });

      const realAssignment = buildAssignment({ id: 999, day_id: 1, place_id: 10, place });
      server.use(
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ assignment: realAssignment })
        ),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10);

      const dayAssignments = useTripStore.getState().assignments['1'];
      expect(dayAssignments).toHaveLength(1);
      expect(dayAssignments[0].id).toBe(999);
      expect(dayAssignments.every(a => a.id > 0)).toBe(true);
    });

    it('FE-ASSIGN-003: on API failure, temp assignment is removed (rollback)', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, {
        places: [place],
        assignments: { '1': [] },
      });

      server.use(
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(useTripStore.getState().assignPlaceToDay(1, 1, 10)).rejects.toThrow();

      const dayAssignments = useTripStore.getState().assignments['1'];
      expect(dayAssignments).toHaveLength(0);
    });

    it('FE-ASSIGN-001b: returns undefined if place not found in store', async () => {
      seedStore(useTripStore, {
        places: [], // no places seeded
        assignments: { '1': [] },
      });

      const result = await useTripStore.getState().assignPlaceToDay(1, 1, 999);
      expect(result).toBeUndefined();
    });

    it('FE-ASSIGN-008: a day with no assignments entry yet is seeded from scratch', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [place], assignments: {} });

      server.use(
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ assignment: buildAssignment({ id: 999, day_id: 1, place_id: 10, place }) })
        ),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10);
      expect(useTripStore.getState().assignments['1'].map(a => a.id)).toEqual([999]);
    });

    it('FE-ASSIGN-009: a response without a nested place falls back to the store place', async () => {
      const place = buildPlace({ id: 10, trip_id: 1, name: 'Louvre' });
      seedStore(useTripStore, { places: [place], assignments: { '1': [] } });

      const bare = { ...buildAssignment({ id: 999, day_id: 1, place_id: 10 }), place: undefined };
      server.use(
        http.post('/api/trips/1/days/1/assignments', () => HttpResponse.json({ assignment: bare })),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10);
      expect(useTripStore.getState().assignments['1'][0].place?.name).toBe('Louvre');
    });

    it('FE-ASSIGN-010: inserting at a position keeps the other rows and reorders server-side', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      const existing = buildAssignment({ id: 1, day_id: 1, order_index: 0 });
      const other = buildAssignment({ id: 2, day_id: 1, order_index: 1 });
      seedStore(useTripStore, { places: [place], assignments: { '1': [existing, other] } });

      let reorderBody: number[] | undefined;
      server.use(
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ assignment: buildAssignment({ id: 999, day_id: 1, place_id: 10, place, order_index: 7 }) })
        ),
        http.put('/api/trips/1/days/1/assignments/reorder', async ({ request }) => {
          const body = await request.json() as { orderedIds: number[] };
          reorderBody = body.orderedIds;
          return HttpResponse.json({ success: true });
        }),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10, 1);

      const items = useTripStore.getState().assignments['1'];
      expect(items.map(a => a.id)).toEqual([1, 999, 2]);
      expect(items.map(a => a.order_index)).toEqual([0, 1, 2]);
      expect(reorderBody).toEqual([1, 999, 2]);
    });

    it('FE-ASSIGN-011: a failing follow-up reorder keeps the optimistic order', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, {
        places: [place],
        assignments: { '1': [buildAssignment({ id: 1, day_id: 1, order_index: 0 })] },
      });

      server.use(
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ assignment: buildAssignment({ id: 999, day_id: 1, place_id: 10, place }) })
        ),
        http.put('/api/trips/1/days/1/assignments/reorder', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      // The reorder failure is swallowed — the create itself already succeeded.
      await expect(useTripStore.getState().assignPlaceToDay(1, 1, 10, 0)).resolves.toBeDefined();
      expect(useTripStore.getState().assignments['1'].map(a => a.id)).toEqual([999, 1]);
    });

    it('FE-ASSIGN-012: no reorder call when the day holds no server-side ids', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      seedStore(useTripStore, { places: [place], assignments: { '1': [] } });

      let reorderCalls = 0;
      server.use(
        // An unsynced (still negative) id echoed back by the offline replay path.
        http.post('/api/trips/1/days/1/assignments', () =>
          HttpResponse.json({ assignment: buildAssignment({ id: -42, day_id: 1, place_id: 10, place }) })
        ),
        http.put('/api/trips/1/days/1/assignments/reorder', () => {
          reorderCalls += 1;
          return HttpResponse.json({ success: true });
        }),
      );

      await useTripStore.getState().assignPlaceToDay(1, 1, 10, 0);
      expect(reorderCalls).toBe(0);
      expect(useTripStore.getState().assignments['1'].map(a => a.id)).toEqual([-42]);
    });
  });

  describe('removeAssignment', () => {
    it('FE-ASSIGN-004: removeAssignment is optimistically removed, re-added on failure', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      const assignment = buildAssignment({ id: 100, day_id: 1, place });
      seedStore(useTripStore, {
        assignments: { '1': [assignment] },
      });

      server.use(
        http.delete('/api/trips/1/days/1/assignments/100', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(useTripStore.getState().removeAssignment(1, 1, 100)).rejects.toThrow();

      // Should be rolled back
      const dayAssignments = useTripStore.getState().assignments['1'];
      expect(dayAssignments).toHaveLength(1);
      expect(dayAssignments[0].id).toBe(100);
    });

    it('FE-ASSIGN-004b: removeAssignment success removes from store', async () => {
      const place = buildPlace({ id: 10, trip_id: 1 });
      const assignment = buildAssignment({ id: 100, day_id: 1, place });
      seedStore(useTripStore, {
        assignments: { '1': [assignment] },
      });

      await useTripStore.getState().removeAssignment(1, 1, 100);

      expect(useTripStore.getState().assignments['1']).toHaveLength(0);
    });
  });

  describe('reorderAssignments', () => {
    it('FE-ASSIGN-005: reorderAssignments updates order_index of assignments', async () => {
      const place1 = buildPlace({ id: 10 });
      const place2 = buildPlace({ id: 20 });
      const a1 = buildAssignment({ id: 1, day_id: 5, order_index: 0, place: place1 });
      const a2 = buildAssignment({ id: 2, day_id: 5, order_index: 1, place: place2 });
      seedStore(useTripStore, {
        assignments: { '5': [a1, a2] },
      });

      await useTripStore.getState().reorderAssignments(1, 5, [2, 1]);

      const dayAssignments = useTripStore.getState().assignments['5'];
      const reorderedA2 = dayAssignments.find(a => a.id === 2);
      const reorderedA1 = dayAssignments.find(a => a.id === 1);
      expect(reorderedA2?.order_index).toBe(0);
      expect(reorderedA1?.order_index).toBe(1);
    });

    it('FE-ASSIGN-005b: reorderAssignments rolls back on failure', async () => {
      const place1 = buildPlace({ id: 10 });
      const place2 = buildPlace({ id: 20 });
      const a1 = buildAssignment({ id: 1, day_id: 5, order_index: 0, place: place1 });
      const a2 = buildAssignment({ id: 2, day_id: 5, order_index: 1, place: place2 });
      seedStore(useTripStore, {
        assignments: { '5': [a1, a2] },
      });

      server.use(
        http.put('/api/trips/1/days/5/assignments/reorder', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(useTripStore.getState().reorderAssignments(1, 5, [2, 1])).rejects.toThrow();

      const dayAssignments = useTripStore.getState().assignments['5'];
      expect(dayAssignments.find(a => a.id === 1)?.order_index).toBe(0);
      expect(dayAssignments.find(a => a.id === 2)?.order_index).toBe(1);
    });

    it('FE-ASSIGN-013: ids that are no longer on the day are dropped from the new order', async () => {
      const a1 = buildAssignment({ id: 1, day_id: 5, order_index: 0 });
      seedStore(useTripStore, { assignments: { '5': [a1] } });

      await useTripStore.getState().reorderAssignments(1, 5, [999, 1]);

      const dayAssignments = useTripStore.getState().assignments['5'];
      expect(dayAssignments.map(a => a.id)).toEqual([1]);
      expect(dayAssignments[0].order_index).toBe(1);
    });

    it('FE-ASSIGN-014: reordering a day with no assignments entry yields an empty list', async () => {
      seedStore(useTripStore, { assignments: {} });

      await useTripStore.getState().reorderAssignments(1, 5, [1, 2]);

      expect(useTripStore.getState().assignments['5']).toEqual([]);
    });
  });

  describe('moveAssignment', () => {
    it('FE-ASSIGN-006: moveAssignment removes from source day and adds to target day', async () => {
      const place = buildPlace({ id: 10 });
      const assignment = buildAssignment({ id: 50, day_id: 1, order_index: 0, place });
      seedStore(useTripStore, {
        assignments: {
          '1': [assignment],
          '2': [],
        },
      });

      await useTripStore.getState().moveAssignment(1, 50, 1, 2);

      expect(useTripStore.getState().assignments['1']).toHaveLength(0);
      expect(useTripStore.getState().assignments['2']).toHaveLength(1);
      expect(useTripStore.getState().assignments['2'][0].id).toBe(50);
    });

    it('FE-ASSIGN-007: moveAssignment rolls back on failure', async () => {
      const place = buildPlace({ id: 10 });
      const assignment = buildAssignment({ id: 50, day_id: 1, order_index: 0, place });
      seedStore(useTripStore, {
        assignments: {
          '1': [assignment],
          '2': [],
        },
      });

      server.use(
        http.put('/api/trips/1/assignments/50/move', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(useTripStore.getState().moveAssignment(1, 50, 1, 2)).rejects.toThrow();

      // Rolled back: assignment back in day 1
      expect(useTripStore.getState().assignments['1']).toHaveLength(1);
      expect(useTripStore.getState().assignments['1'][0].id).toBe(50);
      expect(useTripStore.getState().assignments['2']).toHaveLength(0);
    });

    it('FE-ASSIGN-015: an unknown assignment id is a no-op', async () => {
      seedStore(useTripStore, { assignments: { '1': [buildAssignment({ id: 50, day_id: 1 })] } });

      await useTripStore.getState().moveAssignment(1, 999, 1, 2);

      expect(useTripStore.getState().assignments['1']).toHaveLength(1);
      expect(useTripStore.getState().assignments['2']).toBeUndefined();
    });

    it('FE-ASSIGN-016: a source day with no assignments entry is a no-op', async () => {
      seedStore(useTripStore, { assignments: {} });

      await useTripStore.getState().moveAssignment(1, 50, 1, 2);

      expect(useTripStore.getState().assignments).toEqual({});
    });

    it('FE-ASSIGN-017: dropping at an explicit index renumbers the target day and pushes the new order', async () => {
      const moved = buildAssignment({ id: 50, day_id: 1, order_index: 0 });
      const t1 = buildAssignment({ id: 60, day_id: 2, order_index: 1 });
      const t2 = buildAssignment({ id: 61, day_id: 2, order_index: 0 });
      seedStore(useTripStore, { assignments: { '1': [moved], '2': [t1, t2] } });

      let reorderBody: number[] | undefined;
      server.use(
        http.put('/api/trips/1/days/2/assignments/reorder', async ({ request }) => {
          const body = await request.json() as { orderedIds: number[] };
          reorderBody = body.orderedIds;
          return HttpResponse.json({ success: true });
        }),
      );

      await useTripStore.getState().moveAssignment(1, 50, 1, 2, 1);

      const target = useTripStore.getState().assignments['2'];
      // Target day is sorted by order_index first (61, 60), then the drop lands at index 1.
      expect(target.map(a => a.id)).toEqual([61, 50, 60]);
      expect(target.map(a => a.order_index)).toEqual([0, 1, 2]);
      expect(target[1].day_id).toBe(2);
      expect(reorderBody).toEqual([61, 50, 60]);
    });

    it('FE-ASSIGN-018: moving onto a day with no assignments entry skips the reorder call', async () => {
      const moved = buildAssignment({ id: 50, day_id: 1, order_index: 0 });
      seedStore(useTripStore, { assignments: { '1': [moved] } });

      let reorderCalls = 0;
      server.use(
        http.put('/api/trips/1/days/2/assignments/reorder', () => {
          reorderCalls += 1;
          return HttpResponse.json({ success: true });
        }),
      );

      await useTripStore.getState().moveAssignment(1, 50, 1, 2);

      expect(useTripStore.getState().assignments['2'].map(a => a.id)).toEqual([50]);
      expect(reorderCalls).toBe(0);
    });
  });

  describe('setAssignments', () => {
    it('FE-ASSIGN-019: replaces the whole assignments map', () => {
      seedStore(useTripStore, { assignments: { '1': [buildAssignment({ id: 1, day_id: 1 })] } });

      const next = { '9': [buildAssignment({ id: 90, day_id: 9 })] };
      useTripStore.getState().setAssignments(next);

      expect(useTripStore.getState().assignments).toEqual(next);
    });
  });
});
