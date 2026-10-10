import { coalesce, columnRef } from '../dialect/sql-functions';
import type { ReservationTravelers } from '../entities/ReservationTravelers.entity';
import { TrekRepository } from './_shared/trek-repository';

/** A traveler row as RS6/RR3 project it (before `toTraveler()`'s `avatar_url` add). */
export interface TravelerJoinRow {
  reservation_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  is_guest: number | null;
}

export class ReservationTravelersRepository extends TrekRepository<ReservationTravelers> {
  /**
   * RS6 (`ReservationsService.loadTravelersByTrip`) — `SELECT
   * rt.reservation_id, rt.user_id, COALESCE(u.display_name, u.username) AS
   * username, u.avatar, u.is_guest FROM reservation_travelers rt JOIN
   * reservations r ON rt.reservation_id = r.id JOIN users u ON rt.user_id =
   * u.id WHERE r.trip_id = ? ORDER BY rt.reservation_id`.
   */
  async listForTrip(trip_id: number): Promise<TravelerJoinRow[]> {
    const platform = this.getEntityManager().getPlatform();
    // `rt.reservation_id`/`rt.user_id` are `persist(false)` mirrors of the
    // `reservation`/`user` relations, both ALSO actively joined here
    // (aliased `r`/`u`) — the exact trap `DayAssignmentsRepository
    // .assignmentWithPlaceSelect`'s `category_id` docstring documents
    // (a bare select silently aliases off the joined entity instead);
    // `columnRef` selects the literal physical columns.
    return this.qb('rt')
      .join('rt.reservation', 'r')
      .join('rt.user', 'u')
      .select([
        columnRef(platform, 'rt.reservation_id').as('reservation_id'),
        columnRef(platform, 'rt.user_id').as('user_id'),
        coalesce(platform, 'u.display_name', 'u.username').as('username'),
        'u.avatar',
        'u.is_guest',
      ])
      .where({ 'r.trip': trip_id })
      .orderBy({ 'rt.reservation': 'asc' })
      .execute<TravelerJoinRow[]>('all', false);
  }

  /**
   * RR3 (`ReservationsReadService.loadTravelers`) — `SELECT rt.user_id,
   * COALESCE(u.display_name, u.username) AS username, u.avatar, u.is_guest
   * FROM reservation_travelers rt JOIN users u ON rt.user_id = u.id WHERE
   * rt.reservation_id = ?` — **no ORDER BY** (unlike `listForTrip`), matching
   * the legacy statement's own row order (SQLite's).
   */
  async listForReservation(reservation_id: number): Promise<Omit<TravelerJoinRow, 'reservation_id'>[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('rt')
      .join('rt.user', 'u')
      .select([
        columnRef(platform, 'rt.user_id').as('user_id'),
        coalesce(platform, 'u.display_name', 'u.username').as('username'),
        'u.avatar',
        'u.is_guest',
      ])
      .where({ reservation: reservation_id })
      .execute<Omit<TravelerJoinRow, 'reservation_id'>[]>('all', false);
  }

  /** RS8 (`ReservationsService.setReservationTravelers`'s replace-all) — `DELETE FROM reservation_travelers WHERE reservation_id = ?`. */
  async deleteForReservation(reservation_id: number): Promise<void> {
    await this.nativeDelete({ reservation: reservation_id });
  }

  /**
   * RS9 — `INSERT OR IGNORE INTO reservation_travelers (reservation_id,
   * user_id) VALUES (?, ?)`, run once per id. `upsertMany` with
   * `onConflictAction: 'ignore'` on the table's real unique key
   * (`UNIQUE(reservation_id, user_id)`, `ReservationTravelers.entity.ts`'s
   * `uniques`), named by entity property (`reservation`/`user`, the
   * `AssignmentParticipantsRepository.insertIgnore` precedent). The caller
   * roster-scopes and dedupes the ids before calling; the empty-array guard
   * here is defensive, matching the service's own guard.
   */
  async insertIgnore(reservation_id: number, user_ids: number[]): Promise<void> {
    if (user_ids.length === 0) return;
    await this.upsertMany(
      user_ids.map((user_id) => ({ reservation: reservation_id, user: user_id })),
      { onConflictFields: ['reservation', 'user'], onConflictAction: 'ignore' },
    );
  }
}
