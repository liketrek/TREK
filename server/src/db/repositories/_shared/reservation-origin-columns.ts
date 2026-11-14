/**
 * Where an imported booking came from and its key there, as the reservations
 * table stores them. Named on an insert only when the caller passes them: an
 * imported booking records its origin, every other write leaves the columns to
 * their defaults (`sync_enabled INTEGER DEFAULT 1`). Kept out of
 * Reservations.repository.ts, which is at its size baseline.
 */
export interface ReservationOriginColumns {
  external_source?: string;
  external_id?: string;
  sync_enabled?: number;
}

/** The origin columns an insert names: only those the caller set. */
export function originColumnValues(input: ReservationOriginColumns): ReservationOriginColumns {
  return {
    ...(input.external_source !== undefined && { external_source: input.external_source }),
    ...(input.external_id !== undefined && { external_id: input.external_id }),
    ...(input.sync_enabled !== undefined && { sync_enabled: input.sync_enabled }),
  };
}
