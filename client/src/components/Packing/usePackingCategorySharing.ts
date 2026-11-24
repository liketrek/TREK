import type { PackingVisibility } from '@trek/shared';
import { useState } from 'react';

import type { TripStoreState } from '../../store/tripStore';
import type { PackingItem } from '../../types';
import {
  type PackingSharing,
  type PackingView,
  agreedSharing,
  categorySharingSplit,
  itemsToReshare,
  packingViewItems,
} from './packingListModel';

/** A list's items in the open view, ticked or not. */
const listItems = (items: PackingItem[], view: PackingView, category: string, defaultCategory: string) =>
  packingViewItems(items, view).filter((i) => (i.category || defaultCategory) === category);

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  success: (message: string) => void;
}

/**
 * Moving a whole list to one sharing tier at once (#2961), behind the desktop
 * dialog and the phone sheet alike. There is no bulk write on the server: each
 * item the user owns goes through the same per-item sharing call the item's own
 * control uses, so the owner-only rule, the claim of an unowned item and the
 * live update to the other members all stay exactly as they are. Items other
 * people added are left alone, and the dialog says so before anything moves.
 *
 * The list is the category within the open view, whatever the status filter
 * hides, so a ticked item never stays behind on its own.
 */
export function usePackingCategorySharing({
  tripId,
  items,
  view,
  defaultCategory,
  currentUserId,
  setPackingItemSharing,
  t,
  toast,
}: {
  tripId: number;
  items: PackingItem[];
  view: PackingView;
  defaultCategory: string;
  currentUserId: number | null | undefined;
  setPackingItemSharing: TripStoreState['setPackingItemSharing'];
  t: Translate;
  toast: Toaster;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PackingVisibility | null>(null);
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const splitOf = (name: string | null) =>
    categorySharingSplit(name == null ? [] : listItems(items, view, name, defaultCategory), currentUserId);
  const { own, othersCount } = splitOf(category);

  /** Opens the choice for a list, starting from the tier its items already agree on. */
  const openFor = (name: string) => {
    const agreed = agreedSharing(splitOf(name).own);
    setCategory(name);
    setVisibility(agreed?.visibility ?? null);
    setRecipientIds(agreed?.recipientIds ?? []);
  };

  const close = () => {
    if (!busy) setCategory(null);
  };

  const toggleRecipient = (userId: number) =>
    setRecipientIds((ids) => (ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]));

  const ready = !busy && own.length > 0 && visibility != null && (visibility !== 'shared' || recipientIds.length > 0);

  /**
   * One write per item that is not at the tier yet, one after the other. The
   * store reports a failed write itself, so a failure only stops the run and
   * keeps the choice open to try again; what went through before it stays.
   */
  const apply = async () => {
    if (!ready || category == null || visibility == null) return;
    const target: PackingSharing = { visibility, recipientIds: visibility === 'shared' ? recipientIds : [] };
    const changes = itemsToReshare(own, target);
    // Already there: nothing to write and nothing to report.
    if (changes.length === 0) {
      setCategory(null);
      return;
    }
    setBusy(true);
    try {
      for (const item of changes) {
        await setPackingItemSharing(tripId, item.id, target.visibility, target.recipientIds);
      }
    } catch {
      return;
    } finally {
      setBusy(false);
    }
    setCategory(null);
    toast.success(
      othersCount > 0
        ? t('packing.shareCat.doneOthersKept', { name: category })
        : t('packing.shareCat.done', { name: category })
    );
  };

  return {
    category,
    visibility,
    setVisibility,
    recipientIds,
    toggleRecipient,
    ownCount: own.length,
    othersCount,
    busy,
    ready,
    openFor,
    close,
    apply,
  };
}

export type PackingCategorySharing = ReturnType<typeof usePackingCategorySharing>;
