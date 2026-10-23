import { useCallback, useEffect, useState } from 'react';

import { packingApi } from '../../api/client';
import { useServerPing } from '../../sync/useServerPing';
import { offlineOr } from '../../utils/needsConnection';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  error: (message: string) => void;
}

/** Who looks after a packing category, as the server lists them. */
export interface CategoryAssignee {
  user_id: number;
  username: string;
  avatar?: string | null;
  is_guest?: boolean;
}

/**
 * Who looks after each packing category, for both packing lists: loaded per
 * trip, and replaced category by category. A failed load leaves nobody assigned.
 */
export function usePackingCategoryAssignees({ tripId, t, toast }: { tripId: number; t: Translate; toast: Toaster }) {
  const [categoryAssignees, setCategoryAssignees] = useState<Record<string, CategoryAssignee[]>>({});

  const reload = useCallback(
    () =>
      packingApi
        .getCategoryAssignees(tripId)
        .then((data) => setCategoryAssignees(data.assignees || {}))
        .catch(() => {
          // A failed read leaves the last answer standing; there is nothing to undo.
        }),
    [tripId]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Assignees set elsewhere (a fellow traveller, the assistant) are read back,
  // one read per burst, rather than patched in from the event.
  useServerPing('packing:assignees', true, reload);

  const setAssignees = async (category: string, userIds: number[]) => {
    try {
      const data = await packingApi.setCategoryAssignees(tripId, category, userIds);
      setCategoryAssignees((prev) => ({ ...prev, [category]: data.assignees || [] }));
    } catch {
      toast.error(offlineOr(t, t('packing.toast.saveError')));
    }
  };

  return { categoryAssignees, setAssignees };
}
