import { useState } from 'react';

import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { PackingItem } from '../../types';
import { isLastCustomItemInCategory, isPackingPlaceholder, type PackingView } from './packingListModel';
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants';
import { newItemSharing } from './packingListPanel.helpers';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  error: (message: string) => void;
}
type PackingActions = Pick<
  TripStoreState,
  'addPackingItem' | 'updatePackingItem' | 'deletePackingItem' | 'togglePackingItem'
>;

/**
 * The item and category writes behind both packing lists: adding an item to a
 * category, deleting one, renaming, emptying and adding categories, and removing
 * every checked item. Each surface asks for confirmation its own way first.
 *
 * `placeholderFrom` says where a category's `...` placeholder is looked up when
 * an item is added: the desktop reads the store as it is at that moment, the
 * phone the items it rendered.
 */
export function usePackingItemActions({
  tripId,
  items,
  view,
  currentUserId,
  categories,
  defaultCategory,
  actions,
  t,
  toast,
  placeholderFrom,
}: {
  tripId: number;
  items: PackingItem[];
  view: PackingView;
  currentUserId: number | null | undefined;
  /** The categories of the active view, in display order. */
  categories: string[];
  defaultCategory: string;
  actions: PackingActions;
  t: Translate;
  toast: Toaster;
  placeholderFrom: 'store' | 'items';
}) {
  const { addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem } = actions;
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addItemToCategory = async (category: string, name: string) => {
    try {
      // Reuse the '...' placeholder slot when the category already has one, so a
      // freshly-emptied category keeps its position (and therefore its colour)
      // instead of the new item being appended to the end of the list.
      const pool = placeholderFrom === 'store' ? useTripStore.getState().packingItems : items;
      const placeholder = pool.find((i) => i.category === category && isPackingPlaceholder(i));
      if (placeholder) {
        await updatePackingItem(tripId, placeholder.id, { name });
      } else {
        // New items inherit the active view's tier, and in "my list" the sharing the
        // category's own items agree on (#2241).
        await addPackingItem(tripId, {
          name,
          category,
          ...newItemSharing(items, category, view, currentUserId),
        } as Parameters<typeof addPackingItem>[1]);
      }
    } catch {
      toast.error(t('packing.toast.addError'));
    }
  };

  // Deleting an item from a row. When it is the last item of a user-created
  // category, turn that row back into the '...' placeholder in place rather than
  // deleting it (#1289). Updating the row keeps its id, list position and colour,
  // so the category neither disappears nor jumps to the end. The default
  // (uncategorized) group and the placeholder row itself are deleted normally:
  // removing the placeholder is how an empty category is dismissed.
  const deleteItem = async (item: PackingItem) => {
    try {
      if (isLastCustomItemInCategory(item, items)) {
        if (item.checked) await togglePackingItem(tripId, item.id, false);
        await updatePackingItem(tripId, item.id, {
          name: PACKING_PLACEHOLDER_NAME,
          weight_grams: null,
          bag_id: null,
          quantity: 1,
        });
      } else {
        await deletePackingItem(tripId, item.id);
      }
    } catch {
      toast.error(t('packing.toast.deleteError'));
    }
  };

  /** Moves every item of a category to the new name, one write each; a failure stops it and is thrown. */
  const renameCategory = async (oldName: string, newName: string) => {
    const toUpdate = items.filter((i) => (i.category || defaultCategory) === oldName);
    for (const item of toUpdate) {
      await updatePackingItem(tripId, item.id, { category: newName });
    }
  };

  /** The same, with a failure reported here rather than thrown to the caller. */
  const renameCategoryReporting = async (oldName: string, newName: string) => {
    try {
      await renameCategory(oldName, newName);
    } catch {
      toast.error(t('packing.toast.renameError'));
    }
  };

  const deleteCategoryItems = async (catItems: PackingItem[]) => {
    let failed = false;
    for (const item of catItems) {
      try {
        await deletePackingItem(tripId, item.id);
      } catch {
        failed = true;
      }
    }
    if (failed) toast.error(t('packing.toast.deleteError'));
  };

  /** Removes every checked item of the trip, not only those of the active view. */
  const clearChecked = async () => {
    let failed = false;
    for (const item of items.filter((i) => i.checked)) {
      try {
        await deletePackingItem(tripId, item.id);
      } catch {
        failed = true;
      }
    }
    if (failed) toast.error(t('packing.toast.deleteError'));
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    let catName = newCategoryName.trim();
    // Allow duplicate display names: append invisible zero-width spaces to make them unique internally.
    while (categories.includes(catName)) {
      catName += '​';
    }
    try {
      await addPackingItem(tripId, {
        name: PACKING_PLACEHOLDER_NAME,
        category: catName,
        visibility: view === 'personal' ? 'personal' : 'common',
      } as Parameters<typeof addPackingItem>[1]);
      setNewCategoryName('');
      setAddingCategory(false);
    } catch {
      toast.error(t('packing.toast.addError'));
    }
  };

  return {
    addingCategory,
    setAddingCategory,
    newCategoryName,
    setNewCategoryName,
    addItemToCategory,
    deleteItem,
    renameCategory,
    renameCategoryReporting,
    deleteCategoryItems,
    clearChecked,
    addNewCategory,
  };
}
