import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores } from '../../helpers/store';
import { buildBudgetItem } from '../../helpers/factories';
import type { BudgetItemMember } from '../../../src/types';

beforeEach(() => {
  resetAllStores();
});

describe('remoteEventHandler > budget', () => {
  const member1: BudgetItemMember = { user_id: 5, paid: 0, username: 'eve' };
  const member2: BudgetItemMember = { user_id: 6, paid: 1, username: 'frank' };

  const seedData = () => {
    useTripStore.setState({
      budgetItems: [
        buildBudgetItem({ id: 1, persons: 1, members: [{ ...member1 }] }),
        buildBudgetItem({ id: 2, persons: 2, members: [{ ...member2 }] }),
      ],
    });
  };

  it('FE-WSEVT-BUDGET-001: budget:created adds item to budgetItems', () => {
    seedData();
    const newItem = buildBudgetItem({ id: 99, name: 'Hotel' });
    useTripStore.getState().handleRemoteEvent({ type: 'budget:created', item: newItem });
    const { budgetItems } = useTripStore.getState();
    expect(budgetItems).toHaveLength(3);
    expect(budgetItems.find(i => i.id === 99)).toBeDefined();
  });

  it('FE-WSEVT-BUDGET-002: budget:created is idempotent — no duplicate if same ID', () => {
    seedData();
    const duplicate = buildBudgetItem({ id: 1, name: 'Duplicate' });
    useTripStore.getState().handleRemoteEvent({ type: 'budget:created', item: duplicate });
    const { budgetItems } = useTripStore.getState();
    expect(budgetItems).toHaveLength(2);
  });

  it('FE-WSEVT-BUDGET-003: budget:updated replaces item in array', () => {
    seedData();
    const updated = buildBudgetItem({ id: 1, name: 'Updated Hotel', total_price: 500 });
    useTripStore.getState().handleRemoteEvent({ type: 'budget:updated', item: updated });
    const { budgetItems } = useTripStore.getState();
    const item = budgetItems.find(i => i.id === 1);
    expect(item?.name).toBe('Updated Hotel');
    expect(item?.total_price).toBe(500);
  });

  it('FE-WSEVT-BUDGET-004: budget:deleted removes item by ID', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({ type: 'budget:deleted', itemId: 1 });
    const { budgetItems } = useTripStore.getState();
    expect(budgetItems).toHaveLength(1);
    expect(budgetItems.find(i => i.id === 1)).toBeUndefined();
  });

  it('FE-WSEVT-BUDGET-005: budget:members-updated replaces entire members array and persons count', () => {
    seedData();
    const newMembers: BudgetItemMember[] = [{ user_id: 7, paid: 1, username: 'grace' }, { user_id: 8, paid: 0, username: 'heidi' }];
    useTripStore.getState().handleRemoteEvent({
      type: 'budget:members-updated',
      itemId: 1,
      members: newMembers,
      persons: 3,
    });
    const { budgetItems } = useTripStore.getState();
    const item = budgetItems.find(i => i.id === 1);
    expect(item?.members).toEqual(newMembers);
    expect(item?.persons).toBe(3);
    // Other item should be unchanged
    const item2 = budgetItems.find(i => i.id === 2);
    expect(item2?.members).toEqual([{ ...member2 }]);
  });

  it('FE-WSEVT-BUDGET-006: budget:member-paid-updated toggles specific member paid status', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({
      type: 'budget:member-paid-updated',
      itemId: 1,
      userId: 5,
      // 1, not true: both emitters send `paid: body.paid ? 1 : 0`, and the handler
      // stores the value verbatim. Asserting on `true` tested a payload the server
      // never sends — the seeded value on the line below is a number for the same reason.
      paid: 1,
    });
    const { budgetItems } = useTripStore.getState();
    const item = budgetItems.find(i => i.id === 1);
    const m = item?.members?.find(m => m.user_id === 5);
    expect(m?.paid).toBe(1);
    // Other item members unchanged (member2 keeps its seeded paid value)
    const item2 = budgetItems.find(i => i.id === 2);
    expect(item2?.members?.[0].paid).toBe(1);
  });

  it('FE-WSEVT-BUDGET-007: budget:members-updated for an unknown item leaves every item untouched', () => {
    seedData();
    useTripStore.getState().handleRemoteEvent({
      type: 'budget:members-updated',
      itemId: 4242,
      members: [{ user_id: 9, paid: 0, username: 'ivan' }],
      persons: 9,
    });
    const { budgetItems } = useTripStore.getState();
    expect(budgetItems.map(i => i.persons)).toEqual([1, 2]);
    expect(budgetItems[0].members).toEqual([{ ...member1 }]);
  });

  it('FE-WSEVT-BUDGET-008: budget:member-paid-updated only touches the addressed member', () => {
    useTripStore.setState({
      budgetItems: [
        buildBudgetItem({ id: 1, members: [{ ...member1 }, { ...member2 }] }),
      ],
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'budget:member-paid-updated',
      itemId: 1,
      userId: 5,
      paid: 1,
    });
    const members = useTripStore.getState().budgetItems[0].members ?? [];
    expect(members.find(m => m.user_id === 5)?.paid).toBe(1);
    expect(members.find(m => m.user_id === 6)?.paid).toBe(1); // seeded value, untouched
  });

  it('FE-WSEVT-BUDGET-009: budget:member-paid-updated on an item without members does not throw', () => {
    useTripStore.setState({
      budgetItems: [buildBudgetItem({ id: 1, members: undefined })],
    });
    useTripStore.getState().handleRemoteEvent({
      type: 'budget:member-paid-updated',
      itemId: 1,
      userId: 5,
      paid: 1,
    });
    expect(useTripStore.getState().budgetItems[0].members).toEqual([]);
  });

  describe('budget:reordered', () => {
    it('FE-WSEVT-BUDGET-010: orderedIds rewrites sort_order and keeps unlisted items at the end', () => {
      useTripStore.setState({
        budgetItems: [
          buildBudgetItem({ id: 1, sort_order: 0 }),
          buildBudgetItem({ id: 2, sort_order: 1 }),
          buildBudgetItem({ id: 3, sort_order: 2 }),
        ],
      });
      useTripStore.getState().handleRemoteEvent({ type: 'budget:reordered', orderedIds: [3, 1] });
      const { budgetItems } = useTripStore.getState();
      expect(budgetItems.map(i => i.id)).toEqual([3, 1, 2]);
      // The whole array is reindexed, so re-sorting by sort_order reproduces the
      // order that was just applied.
      expect(budgetItems.map(i => i.sort_order)).toEqual([0, 1, 2]);
    });

    it('FE-WSEVT-BUDGET-011: an orderedIds entry for an unknown item is dropped', () => {
      useTripStore.setState({
        budgetItems: [buildBudgetItem({ id: 1 }), buildBudgetItem({ id: 2 })],
      });
      useTripStore.getState().handleRemoteEvent({ type: 'budget:reordered', orderedIds: [2, 999, 1] });
      expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([2, 1]);
    });

    it('FE-WSEVT-BUDGET-012: orderedCategories groups items and appends unlisted categories', () => {
      useTripStore.setState({
        budgetItems: [
          buildBudgetItem({ id: 1, category: 'Food' }),
          buildBudgetItem({ id: 2, category: 'Transport' }),
          buildBudgetItem({ id: 3, category: 'Food' }),
          buildBudgetItem({ id: 4, category: 'Lodging' }),
        ],
      });
      useTripStore.getState().handleRemoteEvent({
        type: 'budget:reordered',
        orderedCategories: ['Transport', 'Food', 'Souvenirs'],
      });
      // Transport, then both Food rows in their original order, then the
      // category the server did not mention.
      expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([2, 1, 3, 4]);
    });

    it('FE-WSEVT-BUDGET-013: an item without a category is grouped under "Other"', () => {
      useTripStore.setState({
        budgetItems: [
          buildBudgetItem({ id: 1, category: null }),
          buildBudgetItem({ id: 2, category: 'Food' }),
        ],
      });
      useTripStore.getState().handleRemoteEvent({
        type: 'budget:reordered',
        orderedCategories: ['Other', 'Food'],
      });
      expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([1, 2]);
    });

    it('FE-WSEVT-BUDGET-014: a payload with neither key is a no-op', () => {
      useTripStore.setState({
        budgetItems: [buildBudgetItem({ id: 1 }), buildBudgetItem({ id: 2 })],
      });
      useTripStore.getState().handleRemoteEvent({ type: 'budget:reordered' });
      expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([1, 2]);
    });
  });
});
