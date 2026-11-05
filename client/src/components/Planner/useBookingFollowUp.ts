import { type Dispatch, type SetStateAction, useEffect, useRef } from 'react';

import { useTripStore } from '../../store/tripStore';
import type { Reservation } from '../../types';
import { type BookingSaveSteps, travelersChanged, uploadBookingFiles } from './bookingFormModel';

interface BookingFollowUpOptions {
  /**
   * Which booking the editor is open on. A new value starts over: the booking a
   * failed try stored belongs to the editor session it was saved in.
   */
  session: unknown;
  tripId: number | string | undefined;
  /** The booking being edited, whose travellers the picked ones are compared with. */
  original: Pick<Reservation, 'travelers'> | null | undefined;
  travelerIds: Set<number>;
  pendingFiles: File[];
  setPendingFiles: Dispatch<SetStateAction<File[]>>;
  /** Where picked files go; without it they stay with the form. */
  upload: ((fd: FormData) => Promise<unknown>) | undefined;
  t: (key: string) => string;
}

/**
 * The part of a booking save that comes after the booking itself, shared by the
 * desktop dialogs and the phone sheets: the travellers picked for it (#1517) and
 * the files picked in the form. The planner waits for it before it closes the
 * editor, so a failure leaves the editor open (#2883). Each file that lands
 * leaves the list at once, so what is left after a failure is exactly what still
 * has to go up, and the booking the failed try stored is kept so that saving
 * again updates it instead of adding a second one.
 */
export function useBookingFollowUp({
  session,
  tripId,
  original,
  travelerIds,
  pendingFiles,
  setPendingFiles,
  upload,
  t,
}: BookingFollowUpOptions) {
  const setReservationTravelers = useTripStore((s) => s.setReservationTravelers);
  const stored = useRef<Reservation | null>(null);

  useEffect(() => {
    stored.current = null;
  }, [session]);

  const afterSave = async (saved: Reservation, description: string) => {
    stored.current = saved;
    if (tripId) {
      const { changed, nextIds } = travelersChanged(original, travelerIds);
      if (changed) await setReservationTravelers(tripId, saved.id, nextIds);
    }
    // The server's reason for one file says less than what the editor shows: the
    // booking is there, and the files still listed are the ones to try again.
    const uploaded = await uploadBookingFiles(upload, saved.id, pendingFiles, description, (file) =>
      setPendingFiles((prev) => prev.filter((f) => f !== file))
    ).then(
      () => true,
      () => false
    );
    if (!uploaded) throw new Error(t('reservations.toast.filesNotUploaded'));
    // Only a failed try is retried. The editor can stay open on to the next
    // booking without a new session (the import review on the phone), and that
    // one must be added, not written over this one.
    stored.current = null;
  };

  return {
    /** Whether a try in this session already stored the booking, so the form holds a retry. */
    holdsSaved: () => stored.current !== null,
    /** What the save hands the planner, for a booking whose files are described by `description`. */
    steps: (description: string): BookingSaveSteps & Required<Pick<BookingSaveSteps, 'afterSave'>> => ({
      saved: stored.current ?? undefined,
      afterSave: (saved) => afterSave(saved, description),
    }),
  };
}
