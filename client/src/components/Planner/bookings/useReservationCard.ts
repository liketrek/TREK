import { useState, type KeyboardEvent, type MouseEvent } from 'react';

import type { Reservation } from '../../../types';
import { openAttachment } from './openAttachment';
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
 * open from a chip inside the card's own button (so a click or Enter/Space on
 * the chip stops there). A file that cannot be opened stays silent here; the
 * desktop panel toasts it.
 */
export function useReservationCard(res: Reservation, host: ReservationCardHost) {
  const blurCodes = host.settings.blur_booking_codes;
  const { pendingDelete, requestDelete, cancelDelete, confirmDelete } = useReservationDelete(
    host.handleDeleteReservation,
    () => host.toast.error(host.t('reservations.toast.deleteError'))
  );
  const [codeRevealed, setCodeRevealed] = useState(false);

  return {
    codeBlurred: !!blurCodes && !codeRevealed,
    toggleCode: blurCodes ? () => setCodeRevealed((v) => !v) : undefined,
    confirmingDelete: pendingDelete != null,
    askDelete: () => requestDelete(res),
    cancelDelete,
    confirmDelete: () => {
      void confirmDelete();
    },
    fileChip: (f: { url: string; original_name: string }) => ({
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        openAttachment(f);
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openAttachment(f);
        }
      },
    }),
  };
}
