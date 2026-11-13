import type { BudgetItemReceipt, TripFile } from '../../types';

/** A file of the booking: its own column names it, or one of its link rows does. */
function onBooking(file: TripFile, reservationId: number): boolean {
  return Number(file.reservation_id) === reservationId || (file.linked_reservation_ids || []).includes(reservationId);
}

/**
 * The trip's files an expense could take as a receipt (#2839): the ones not in
 * the bin and not on the expense yet. A booking's confirmation is so often its
 * invoice as well that the files of the booking the expense belongs to lead.
 */
export function linkableReceiptFiles(
  files: readonly TripFile[],
  receipts: readonly BudgetItemReceipt[],
  reservationId: number | null | undefined
): TripFile[] {
  const taken = new Set(receipts.map((r) => r.id));
  const live = files.filter((f) => !f.deleted_at && !taken.has(f.id));
  if (!reservationId) return live;
  return [...live.filter((f) => onBooking(f, reservationId)), ...live.filter((f) => !onBooking(f, reservationId))];
}

/**
 * A trip file as the receipt row the editor lists. Nothing is written yet: the
 * save sends its id with the others in `receipt_file_ids`, which links it.
 */
export function receiptOfFile(file: TripFile): BudgetItemReceipt {
  return {
    id: file.id,
    filename: file.filename,
    original_name: file.original_name,
    file_size: file.file_size ?? null,
    mime_type: file.mime_type,
    url: file.url,
  };
}
