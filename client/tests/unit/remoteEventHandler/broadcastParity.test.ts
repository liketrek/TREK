import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { offlineDb } from '../../../src/db/offlineDb';
import { useAuthStore } from '../../../src/store/authStore';
import { useTripStore } from '../../../src/store/tripStore';
import {
  buildAssignment,
  buildBudgetItem,
  buildDay,
  buildPackingItem,
  buildReservation,
  buildTodoItem,
  buildTrip,
} from '../../helpers/factories';
import { resetAllStores } from '../../helpers/store';

/**
 * The trip-scoped events the broadcast parity work taught the store (plan 2.8):
 * changes written elsewhere (a fellow traveller, the assistant, an MCP client)
 * that used to be dropped and only showed after a reload.
 */

const ME = 7;

beforeEach(() => {
  resetAllStores();
  useAuthStore.setState({ user: { id: ME, username: 'me', email: 'me@example.test' } as never });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const send = (event: Record<string, unknown>) => useTripStore.getState().handleRemoteEvent(event as { type: string });

describe('remoteEventHandler > broadcast parity', () => {
  it('FE-BCAST-001: assignment:participants sets who joins the visit and caches its day', async () => {
    const put = vi.spyOn(offlineDb.days, 'put');
    useTripStore.setState({
      days: [buildDay({ id: 10 }), buildDay({ id: 20 })],
      assignments: {
        '10': [buildAssignment({ id: 100, day_id: 10 })],
        '20': [buildAssignment({ id: 200, day_id: 20 }), buildAssignment({ id: 201, day_id: 20 })],
      },
    });
    const participants = [{ user_id: 3, username: 'ana', avatar: null }];
    send({ type: 'assignment:participants', assignmentId: 201, participants });
    const { assignments } = useTripStore.getState();
    expect(assignments['20'].find((a) => a.id === 201)?.participants).toEqual(participants);
    expect(assignments['20'].find((a) => a.id === 200)?.participants).not.toEqual(participants);
    expect(assignments['10'][0].participants).not.toEqual(participants);
    await vi.waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][0]).toMatchObject({ id: 20 });
  });

  it('FE-BCAST-002: assignment:participants for an assignment this tab does not hold changes nothing', () => {
    const before = { '10': [buildAssignment({ id: 100, day_id: 10 })] };
    useTripStore.setState({ days: [buildDay({ id: 10 })], assignments: before });
    send({ type: 'assignment:participants', assignmentId: 999, participants: [] });
    expect(useTripStore.getState().assignments).toBe(before);
  });

  it('FE-BCAST-003: packing:reordered numbers the named rows as the server does and caches them', async () => {
    const bulkPut = vi.spyOn(offlineDb.packingItems, 'bulkPut');
    useTripStore.setState({
      packingItems: [
        buildPackingItem({ id: 1, sort_order: 0 }),
        buildPackingItem({ id: 2, sort_order: 1 }),
        buildPackingItem({ id: 3, sort_order: 2 }),
      ],
    });
    // 404 is a row this tab does not hold (somebody's private item): it still takes
    // index 1 on the server, so item 1 lands on 2. Item 2 is not named and keeps its order.
    send({ type: 'packing:reordered', orderedIds: [3, 404, 1] });
    const items = useTripStore.getState().packingItems;
    expect(items.map((i) => [i.id, i.sort_order])).toEqual([
      [3, 0],
      [1, 2],
      [2, 1],
    ]);
    await vi.waitFor(() => expect(bulkPut).toHaveBeenCalledTimes(1));
    expect(bulkPut.mock.calls[0][0]).toEqual(items);
  });

  it('FE-BCAST-004: todo:reordered applies the order the same way and caches it', async () => {
    const bulkPut = vi.spyOn(offlineDb.todoItems, 'bulkPut');
    useTripStore.setState({
      todoItems: [buildTodoItem({ id: 1, sort_order: 0 }), buildTodoItem({ id: 2, sort_order: 1 })],
    });
    send({ type: 'todo:reordered', orderedIds: [2, 1] });
    const items = useTripStore.getState().todoItems;
    expect(items.map((i) => [i.id, i.sort_order])).toEqual([
      [2, 0],
      [1, 1],
    ]);
    await vi.waitFor(() => expect(bulkPut).toHaveBeenCalledTimes(1));
    expect(bulkPut.mock.calls[0][0]).toEqual(items);
  });

  it('FE-BCAST-005: a reorder without ids leaves the list alone', () => {
    const packingItems = [buildPackingItem({ id: 1 })];
    useTripStore.setState({ packingItems });
    send({ type: 'packing:reordered' });
    expect(useTripStore.getState().packingItems).toBe(packingItems);
  });

  it('FE-BCAST-006: trip:deleted of the open trip marks it gone, another trip does not', async () => {
    const drop = vi.spyOn(offlineDb.trips, 'delete');
    useTripStore.setState({ trip: buildTrip({ id: 5 }) });
    send({ type: 'trip:deleted', tripId: 6, id: 6 });
    expect(useTripStore.getState().tripGone).toBeNull();
    send({ type: 'trip:deleted', tripId: 5, id: 5 });
    expect(useTripStore.getState().tripGone).toEqual({ tripId: 5, reason: 'deleted' });
    await vi.waitFor(() => expect(drop).toHaveBeenCalledWith(5));
  });

  it('FE-BCAST-007: member:removed marks the trip gone only when it is this user', () => {
    useTripStore.setState({ trip: buildTrip({ id: 5 }) });
    send({ type: 'member:removed', tripId: 5, userId: 99 });
    expect(useTripStore.getState().tripGone).toBeNull();
    send({ type: 'member:removed', tripId: 5, userId: ME });
    expect(useTripStore.getState().tripGone).toEqual({ tripId: 5, reason: 'removed' });
  });

  it('FE-BCAST-025: member:updated renames the guest on every row that lists it and caches those rows', async () => {
    const putBudget = vi.spyOn(offlineDb.budgetItems, 'bulkPut');
    const putDay = vi.spyOn(offlineDb.days, 'put');
    const guest = { user_id: 3, username: 'Ana' };
    const other = { user_id: 4, username: 'Bo' };
    const untouched = buildBudgetItem({ id: 61, members: [{ ...other, paid: 0 }] });
    useTripStore.setState({
      days: [buildDay({ id: 10 })],
      budgetItems: [
        buildBudgetItem({
          id: 60,
          members: [
            { ...guest, paid: 0 },
            { ...other, paid: 1 },
          ],
        }),
        untouched,
      ],
      reservations: [buildReservation({ id: 70, travelers: [guest] })],
      packingItems: [buildPackingItem({ id: 80, recipients: [guest], contributors: [{ ...guest, status: 'packed' }] })],
      assignments: { '10': [buildAssignment({ id: 100, day_id: 10, participants: [guest] })] },
    });
    send({ type: 'member:updated', tripId: 5, member: { id: 3, username: 'Anna' } });
    const state = useTripStore.getState();
    expect(state.budgetItems[0].members?.map((m) => m.username)).toEqual(['Anna', 'Bo']);
    expect(state.budgetItems[1]).toBe(untouched);
    expect(state.reservations[0].travelers?.[0].username).toBe('Anna');
    expect(state.packingItems[0].recipients?.[0].username).toBe('Anna');
    expect(state.packingItems[0].contributors?.[0]).toEqual({ user_id: 3, username: 'Anna', status: 'packed' });
    expect(state.assignments['10'][0].participants?.[0].username).toBe('Anna');
    await vi.waitFor(() => expect(putDay).toHaveBeenCalledTimes(1));
    expect(putBudget.mock.calls[0][0]).toEqual([state.budgetItems[0]]);
  });

  it("FE-BCAST-026: only this user's removal drops the open trip from the offline cache", async () => {
    const drop = vi.spyOn(offlineDb.trips, 'delete');
    useTripStore.setState({ trip: buildTrip({ id: 5 }) });
    send({ type: 'member:removed', tripId: 5, userId: 99 });
    send({ type: 'member:removed', tripId: 5, userId: ME });
    await vi.waitFor(() => expect(drop).toHaveBeenCalledWith(5));
    expect(drop).toHaveBeenCalledTimes(1);
  });

  it('FE-BCAST-008: loading another trip forgets a trip that went away', () => {
    useTripStore.setState({ tripGone: { tripId: 5, reason: 'removed' } });
    useTripStore.getState().resetTrip();
    expect(useTripStore.getState().tripGone).toBeNull();
  });

  it('FE-BCAST-009: a burst of packing:template-applied reads the list once, after it settles', () => {
    vi.useFakeTimers();
    const reload = vi.fn(async () => undefined);
    useTripStore.setState({ trip: buildTrip({ id: 5 }), reloadPackingItems: reload });
    for (let i = 0; i < 5; i++) send({ type: 'packing:template-applied', tripId: 5, items: [] });
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith(5);
  });
});
