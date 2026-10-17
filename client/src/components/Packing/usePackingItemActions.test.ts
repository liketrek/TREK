import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPackingItem } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { PackingItem } from '../../types';
import type { PackingView } from './packingListModel';
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants';
import { usePackingItemActions } from './usePackingItemActions';

// FE-PACK-ITEMACT-001 to FE-PACK-ITEMACT-012

const t = (key: string) => key;
const ZWSP = '​';

function actions() {
  return {
    addPackingItem: vi.fn<TripStoreState['addPackingItem']>(async () => buildPackingItem()),
    updatePackingItem: vi.fn<TripStoreState['updatePackingItem']>(async () => buildPackingItem()),
    deletePackingItem: vi.fn<TripStoreState['deletePackingItem']>(async () => undefined),
    togglePackingItem: vi.fn<TripStoreState['togglePackingItem']>(async () => undefined),
  };
}

function setup({
  items = [] as PackingItem[],
  view = 'common' as PackingView,
  categories = [] as string[],
  placeholderFrom = 'items' as 'store' | 'items',
  currentUserId = 9 as number | null | undefined,
} = {}) {
  const acts = actions();
  const toast = { error: vi.fn() };
  const rendered = renderHook(() =>
    usePackingItemActions({
      tripId: 7,
      items,
      view,
      currentUserId,
      categories,
      defaultCategory: 'Other',
      actions: acts,
      t,
      toast,
      placeholderFrom,
    })
  );
  return { ...rendered, acts, toast };
}

beforeEach(() => resetAllStores());

describe('usePackingItemActions', () => {
  it('FE-PACK-ITEMACT-001: an item added to a category with a placeholder takes over that row', async () => {
    const placeholder = buildPackingItem({ id: 4, name: PACKING_PLACEHOLDER_NAME, category: 'Camp' });
    const { result, acts } = setup({ items: [placeholder] });
    await act(async () => {
      await result.current.addItemToCategory('Camp', 'Tent');
    });
    expect(acts.updatePackingItem).toHaveBeenCalledWith(7, 4, { name: 'Tent' });
    expect(acts.addPackingItem).not.toHaveBeenCalled();
  });

  it('FE-PACK-ITEMACT-002: the desktop looks the placeholder up in the store, the phone in the items it shows', async () => {
    const placeholder = buildPackingItem({ id: 4, name: PACKING_PLACEHOLDER_NAME, category: 'Camp' });
    seedStore(useTripStore, { packingItems: [placeholder] });

    const desktop = setup({ items: [], placeholderFrom: 'store' });
    await act(async () => {
      await desktop.result.current.addItemToCategory('Camp', 'Tent');
    });
    expect(desktop.acts.updatePackingItem).toHaveBeenCalledWith(7, 4, { name: 'Tent' });

    const phone = setup({ items: [], placeholderFrom: 'items' });
    await act(async () => {
      await phone.result.current.addItemToCategory('Camp', 'Tent');
    });
    expect(phone.acts.updatePackingItem).not.toHaveBeenCalled();
    expect(phone.acts.addPackingItem).toHaveBeenCalledWith(7, { name: 'Tent', category: 'Camp', visibility: 'common' });
  });

  it('FE-PACK-ITEMACT-003: in my list a new item is shared the way the category already is (#2241)', async () => {
    const own = buildPackingItem({
      id: 5,
      name: 'Socks',
      category: 'Clothes',
      is_private: 1,
      owner_id: 9,
      recipients: [{ user_id: 3, username: 'ada' }],
    });
    const { result, acts } = setup({ items: [own], view: 'personal' });
    await act(async () => {
      await result.current.addItemToCategory('Clothes', 'Shirt');
    });
    expect(acts.addPackingItem).toHaveBeenCalledWith(7, {
      name: 'Shirt',
      category: 'Clothes',
      visibility: 'shared',
      recipient_ids: [3],
    });
  });

  it('FE-PACK-ITEMACT-004: a failed add is reported', async () => {
    const { result, acts, toast } = setup();
    acts.addPackingItem.mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.addItemToCategory('Camp', 'Tent');
    });
    expect(toast.error).toHaveBeenCalledWith('packing.toast.addError');
  });

  it('FE-PACK-ITEMACT-005: the last real item of a category turns back into its placeholder, unchecked first', async () => {
    const last = buildPackingItem({ id: 5, name: 'Rope', category: 'Ropes', checked: 1 });
    const { result, acts } = setup({ items: [last] });
    await act(async () => {
      await result.current.deleteItem(last);
    });
    expect(acts.togglePackingItem).toHaveBeenCalledWith(7, 5, false);
    expect(acts.updatePackingItem).toHaveBeenCalledWith(7, 5, {
      name: PACKING_PLACEHOLDER_NAME,
      weight_grams: null,
      bag_id: null,
      quantity: 1,
    });
    expect(acts.deletePackingItem).not.toHaveBeenCalled();
    expect(acts.togglePackingItem.mock.invocationCallOrder[0]).toBeLessThan(
      acts.updatePackingItem.mock.invocationCallOrder[0]
    );
  });

  it('FE-PACK-ITEMACT-006: any other item is deleted, and a failure is reported', async () => {
    const rope = buildPackingItem({ id: 5, name: 'Rope', category: 'Ropes' });
    const knot = buildPackingItem({ id: 6, name: 'Knot', category: 'Ropes' });
    const { result, acts, toast } = setup({ items: [rope, knot] });
    await act(async () => {
      await result.current.deleteItem(rope);
    });
    expect(acts.deletePackingItem).toHaveBeenCalledWith(7, 5);
    expect(acts.togglePackingItem).not.toHaveBeenCalled();
    acts.deletePackingItem.mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.deleteItem(rope);
    });
    expect(toast.error).toHaveBeenCalledWith('packing.toast.deleteError');
  });

  it('FE-PACK-ITEMACT-007: renaming moves every item of the category, the uncategorised under the default name', async () => {
    const a = buildPackingItem({ id: 1, category: 'Camp' });
    const b = buildPackingItem({ id: 2, category: null });
    const c = buildPackingItem({ id: 3, category: 'Camp' });
    const { result, acts } = setup({ items: [a, b, c] });
    await act(async () => {
      await result.current.renameCategory('Camp', 'Outdoor');
    });
    expect(acts.updatePackingItem.mock.calls).toEqual([
      [7, 1, { category: 'Outdoor' }],
      [7, 3, { category: 'Outdoor' }],
    ]);
    acts.updatePackingItem.mockClear();
    await act(async () => {
      await result.current.renameCategory('Other', 'Misc');
    });
    expect(acts.updatePackingItem.mock.calls).toEqual([[7, 2, { category: 'Misc' }]]);
  });

  it('FE-PACK-ITEMACT-008: a failed rename stops: the desktop gets the error, the phone a message', async () => {
    const a = buildPackingItem({ id: 1, category: 'Camp' });
    const c = buildPackingItem({ id: 3, category: 'Camp' });
    const { result, acts, toast } = setup({ items: [a, c] });
    acts.updatePackingItem.mockRejectedValueOnce(new Error('x'));
    await expect(result.current.renameCategory('Camp', 'Outdoor')).rejects.toThrow('x');
    expect(acts.updatePackingItem).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();

    acts.updatePackingItem.mockClear();
    acts.updatePackingItem.mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.renameCategoryReporting('Camp', 'Outdoor');
    });
    expect(acts.updatePackingItem).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('packing.toast.renameError');
  });

  it('FE-PACK-ITEMACT-009: emptying a category tries every item and reports a failure once', async () => {
    const items = [1, 2, 3].map((id) => buildPackingItem({ id, category: 'Camp' }));
    const { result, acts, toast } = setup({ items });
    acts.deletePackingItem.mockRejectedValueOnce(new Error('x')).mockRejectedValueOnce(new Error('y'));
    await act(async () => {
      await result.current.deleteCategoryItems(items);
    });
    expect(acts.deletePackingItem.mock.calls.map((c) => c[1])).toEqual([1, 2, 3]);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('packing.toast.deleteError');
  });

  it('FE-PACK-ITEMACT-010: clearing removes every checked item of the trip, in both views', async () => {
    const items = [
      buildPackingItem({ id: 1, checked: 1 }),
      buildPackingItem({ id: 2, checked: 0 }),
      buildPackingItem({ id: 3, checked: 1, is_private: 1 }),
    ];
    const { result, acts, toast } = setup({ items });
    await act(async () => {
      await result.current.clearChecked();
    });
    expect(acts.deletePackingItem.mock.calls.map((c) => c[1])).toEqual([1, 3]);
    expect(toast.error).not.toHaveBeenCalled();
    acts.deletePackingItem.mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.clearChecked();
    });
    expect(toast.error).toHaveBeenCalledWith('packing.toast.deleteError');
  });

  it('FE-PACK-ITEMACT-011: a new category needs a name, and a taken one gets an invisible suffix', async () => {
    const { result, acts } = setup({ categories: ['Camp', `Camp${ZWSP}`], view: 'personal' });
    await act(async () => {
      await result.current.addNewCategory();
    });
    expect(acts.addPackingItem).not.toHaveBeenCalled();

    act(() => {
      result.current.setAddingCategory(true);
      result.current.setNewCategoryName('  Camp  ');
    });
    await act(async () => {
      await result.current.addNewCategory();
    });
    expect(acts.addPackingItem).toHaveBeenCalledWith(7, {
      name: PACKING_PLACEHOLDER_NAME,
      category: `Camp${ZWSP}${ZWSP}`,
      visibility: 'personal',
    });
    expect(result.current.newCategoryName).toBe('');
    expect(result.current.addingCategory).toBe(false);
  });

  it('FE-PACK-ITEMACT-012: a failed new category is reported and keeps the field open', async () => {
    const { result, acts, toast } = setup();
    acts.addPackingItem.mockRejectedValueOnce(new Error('x'));
    act(() => {
      result.current.setAddingCategory(true);
      result.current.setNewCategoryName('Camp');
    });
    await act(async () => {
      await result.current.addNewCategory();
    });
    expect(acts.addPackingItem).toHaveBeenCalledWith(7, {
      name: PACKING_PLACEHOLDER_NAME,
      category: 'Camp',
      visibility: 'common',
    });
    expect(toast.error).toHaveBeenCalledWith('packing.toast.addError');
    expect(result.current.newCategoryName).toBe('Camp');
    expect(result.current.addingCategory).toBe(true);
  });
});
