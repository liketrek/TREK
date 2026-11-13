import { useState } from 'react';

import { useTripStore } from '../../../store/tripStore';
import type { Reservation } from '../../../types';
import { deleteBodyKey } from './bookingsModel';
import { type Attachment, downloadAttachment, openAttachment } from './openAttachment';
import { useReservationDelete } from './useReservationDelete';

/** What a phone card needs from the planner it sits in. */
export interface ReservationCardHost {
  settings: { blur_booking_codes?: boolean };
  handleDeleteReservation: (id: number) => unknown;
  toast: { error: (message: string) => unknown };
  t: (key: string) => string;
}

/**
 * What a card in the phone's bookings and transports tabs does besides
 * opening: its booking code blurred until tapped while the "Blur booking codes"
 * preference is on (off, the code is plain and has no toggle), the delete
 * behind a question with a toast when it fails, and its attached files, which
 * open or download from their own row. A file that cannot be opened or saved
 * stays silent here; the desktop panel toasts it. The delete question names a
 * linked expense, which goes with the booking.
 */
export function useReservationCard(res: Reservation, host: ReservationCardHost) {
  const blurCodes = host.settings.blur_booking_codes;
  const { pendingDelete, requestDelete, cancelDelete, confirmDelete } = useReservationDelete(
    host.handleDeleteReservation,
    () => host.toast.error(host.t('reservations.toast.deleteError'))
  );
  const [codeRevealed, setCodeRevealed] = useState(false);
  const deleteTakesExpense = useTripStore(
    (s) => deleteBodyKey(res.id, s.budgetItems) === 'reservations.confirm.deleteBodyWithExpense'
  );

  return {
    codeBlurred: !!blurCodes && !codeRevealed,
    toggleCode: blurCodes ? () => setCodeRevealed((v) => !v) : undefined,
    confirmingDelete: pendingDelete != null,
    deleteTakesExpense,
    askDelete: () => requestDelete(res),
    cancelDelete,
    confirmDelete: () => {
      void confirmDelete();
    },
    openFile: (f: Attachment) => openAttachment(f),
    downloadFile: (f: Attachment) => downloadAttachment(f),
  };
}
