import { typeToCostCategory } from '@trek/shared';

import type { BudgetItem, Reservation, TripFile } from '../../types';
import type { BookingExpenseRequest } from './BookingCostsSection.types';
import { importedPriceEntry } from './importedPrice';

/**
 * What the transport and the booking forms share on both shells: the travellers
 * picked for a booking (#1517) and the files picked before it was saved.
 */

/** The travellers a booking opens with. */
export function travelerIdsOf(reservation: Pick<Reservation, 'travelers'> | null | undefined): Set<number> {
  return new Set((reservation?.travelers || []).map((tv) => tv.user_id));
}

/** The picked travellers with one more or one less. */
export function toggledTraveler(prev: Set<number>, id: number): Set<number> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Whether the picked travellers differ from the ones the booking had, so the save only writes a real change. */
export function travelersChanged(reservation: Pick<Reservation, 'travelers'> | null | undefined, picked: Set<number>) {
  const original = (reservation?.travelers || []).map((tv) => tv.user_id);
  const nextIds = [...picked];
  return { changed: original.length !== nextIds.length || nextIds.some((id) => !original.includes(id)), nextIds };
}

/**
 * Uploads the files picked in a booking form against the saved booking, one after
 * the other, each described with the booking's title. Callers run it after both a
 * create and an edit: the form only holds files the user just picked, so nothing is
 * uploaded twice, and skipping the edit dropped them without a word (#2534).
 * Without an upload handler (a dialog opened with no file support) there is
 * nowhere to send them, so nothing is uploaded and the save carries on.
 */
export async function uploadBookingFiles(
  upload: ((fd: FormData) => Promise<unknown>) | undefined,
  savedId: number,
  files: File[],
  description: string
): Promise<void> {
  if (!upload) return;
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('reservation_id', String(savedId));
    fd.append('description', description);
    await upload(fd);
  }
}

/**
 * Which expense the user asked for while saving a booking: a new one or an edit of
 * the linked one. The form saves itself first, so the request can name the saved id.
 */
export interface BookingExpenseIntent {
  editItem?: BudgetItem;
  create?: boolean;
}

/**
 * The expense editor request to open once a booking is saved, or null when the user
 * asked for none or the save came back without a record.
 */
export function expenseRequestAfterSave(
  intent: BookingExpenseIntent | null | undefined,
  savedId: number | null | undefined,
  booking: { title: string; type: string }
): BookingExpenseRequest | null {
  if (!intent || !savedId) return null;
  if (intent.editItem) return { editItem: intent.editItem };
  return { prefill: { reservationId: savedId, name: booking.title, category: typeToCostCategory(booking.type) } };
}

/**
 * The cost an import review previews before the booking exists: the parsed price the
 * save will link, so the preview and the save cannot name different currencies.
 * Nothing for a saved booking or a booking that was not imported.
 */
export function pendingImportExpense(
  reservation: unknown,
  prefill: { metadata?: unknown } | null | undefined,
  type: string
): { total_price: number; category: string; currency: string | null } | null {
  const entry = !reservation && prefill ? importedPriceEntry(prefill.metadata, type) : null;
  return entry ? { ...entry, currency: entry.currency ?? null } : null;
}

/**
 * The trip files shown on a saved booking: the ones uploaded to it, the ones linked
 * to it on the server and the ones linked in this dialog. Nothing before it is saved.
 */
export function attachedBookingFiles(
  files: TripFile[],
  reservationId: number | null | undefined,
  linkedFileIds: number[]
): TripFile[] {
  if (!reservationId) return [];
  return files.filter(
    (f) =>
      f.reservation_id === reservationId ||
      linkedFileIds.includes(f.id) ||
      f.linked_reservation_ids?.includes(reservationId)
  );
}
