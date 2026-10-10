import type { Reservation, TripFile } from '../types';

/** A booking's files: the ones uploaded to it and the ones linked to it, trashed files left out. */
export function filesFor(r: Pick<Reservation, 'id'>, files: TripFile[]): TripFile[] {
  return files.filter(
    (f) => !f.deleted_at && (f.reservation_id === r.id || (f.linked_reservation_ids || []).includes(r.id))
  );
}
