import { useEffect, useState } from 'react';

import { packingApi } from '../../api/client';

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

  useEffect(() => {
    packingApi
      .getCategoryAssignees(tripId)
      .then((data) => setCategoryAssignees(data.assignees || {}))
      .catch(() => {
        // A failed read leaves every category unassigned; there is nothing to undo.
      });
  }, [tripId]);

  const setAssignees = async (category: string, userIds: number[]) => {
    try {
      const data = await packingApi.setCategoryAssignees(tripId, category, userIds);
      setCategoryAssignees((prev) => ({ ...prev, [category]: data.assignees || [] }));
    } catch {
      toast.error(t('packing.toast.saveError'));
    }
  };

  return { categoryAssignees, setAssignees };
}
