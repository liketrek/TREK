import type { ReservationEndpoint } from './reservation-inputs';

/*
 * The shapes the reservations service hands out: a booking row as the joined
 * reads return it, and the travelers on it. Kept apart from
 * reservations.service.ts, which is at its size baseline, the way
 * reservation-inputs.ts is; the service exports them on, so their importers
 * did not change.
 */

// --- Travelers (#1517): trip members / named guests assigned to a booking -----

export interface ReservationTraveler {
  user_id: number;
  username: string;
  avatar: string | null;
  avatar_url?: string | null;
  is_guest?: number | null;
}

/** A reservation row as the joined list/get queries return it (open record —
 *  the legacy queries selected `r.*` and callers pass the row through; the
 *  named fields are the columns consumers read in a typed position). */
export type ReservationRow = Record<string, unknown> & {
  id: number;
  trip_id: number;
  title: string;
  status: string;
  type: string;
  metadata?: string | null;
  accommodation_id?: number | string | null;
  day_positions?: Record<number, number> | null;
  endpoints?: ReservationEndpoint[];
  travelers?: ReservationTraveler[];
};
