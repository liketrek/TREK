import { useState } from 'react';

import type { Reservation } from '../../../types';

/**
 * Deleting a booking after a question, for the desktop bookings panel and the
 * cards of the phone's bookings and transports tabs. `requestDelete` asks,
 * `cancelDelete` drops the question, `confirmDelete` answers it: the question
 * closes first, then `beforeDelete` runs (the desktop closes a detail showing
 * that booking) and the delete goes out. A failed delete calls `onError`, so
 * each view keeps its own toast.
 */
export function useReservationDelete(
  onDelete: (id: number) => unknown,
  onError: () => void,
  beforeDelete?: (r: Reservation) => void
) {
  const [pendingDelete, setPendingDelete] = useState<Reservation | null>(null);

  const confirmDelete = async () => {
    const r = pendingDelete;
    setPendingDelete(null);
    if (!r) return;
    beforeDelete?.(r);
    try {
      await onDelete(r.id);
    } catch {
      onError();
    }
  };

  return {
    pendingDelete,
    requestDelete: setPendingDelete,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete,
  };
}
