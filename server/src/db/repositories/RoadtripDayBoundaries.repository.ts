import type { RoadtripDayBoundary } from '@trek/shared';
import type { RoadtripDayBoundaries } from '../entities/RoadtripDayBoundaries.entity';
import { columnRef } from '../dialect/sql-functions';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `roadtrip_day_boundaries` — where a manual day ending sits (a stop, or a
 * fraction along the driving leg between two consecutive stops), overriding
 * the automatic day-ending rule daily travel times uses.
 */
export class RoadtripDayBoundariesRepository extends TrekRepository<RoadtripDayBoundaries> {
  /**
   * RB1 — `SELECT day_number, from_assignment_id, to_assignment_id, fraction
   * FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number`.
   *
   * `columnRef` for `from_assignment_id`/`to_assignment_id` — both are
   * `persist(false)` mirrors of the `fromAssignment`/`toAssignment`
   * relations, and selecting either bare (`'b.from_assignment_id'`) drops it
   * from the result silently, EVEN with no active join on that relation
   * (verified directly here, not assumed from `PlaceRatingsRepository
   * .listForPlaces`'s narrower, join-only framing of the same trap).
   */
  async listForTrip(trip_id: number): Promise<RoadtripDayBoundary[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('b')
      .select(['b.day_number', columnRef(platform, 'b.from_assignment_id'), columnRef(platform, 'b.to_assignment_id'), 'b.fraction'])
      .where({ trip: trip_id })
      .orderBy({ day_number: 'asc' })
      .execute<RoadtripDayBoundary[]>('all', false);
  }

  /**
   * RB3 — `INSERT INTO roadtrip_day_boundaries (trip_id, day_number,
   * from_assignment_id, to_assignment_id, fraction) VALUES (?×5) ON CONFLICT
   * (trip_id, day_number) DO UPDATE SET from_assignment_id =
   * excluded.from_assignment_id, to_assignment_id = excluded.to_assignment_id,
   * fraction = excluded.fraction`.
   *
   * `onConflictFields: ['trip', 'day_number']` — the composite PK the
   * migration and the entity's own `[PrimaryKeyProp]?: ['trip',
   * 'day_number']` both declare; `onConflictMergeFields` names the three
   * relation/scalar properties the legacy SET list names (`fromAssignment`/
   * `toAssignment`, not their `persist(false)` `_id` mirrors —
   * `OauthConsentsRepository.upsertGrant`'s precedent), so a conflict never
   * touches `trip`/`day_number` themselves (the key) or any future column
   * this entity gains.
   */
  async upsertBoundary(trip_id: number, boundary: RoadtripDayBoundary): Promise<void> {
    await this.upsert(
      {
        trip: trip_id,
        day_number: boundary.day_number,
        fromAssignment: boundary.from_assignment_id,
        toAssignment: boundary.to_assignment_id,
        fraction: boundary.fraction,
      },
      { onConflictFields: ['trip', 'day_number'], onConflictAction: 'merge', onConflictMergeFields: ['fromAssignment', 'toAssignment', 'fraction'] },
    );
  }

  /** RB4 — `DELETE FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number = ?`, silent on a miss. */
  async deleteForDay(trip_id: number, day_number: number): Promise<void> {
    await this.nativeDelete({ trip: trip_id, day_number });
  }

  /**
   * RB5 (`DaysService.shiftBoundariesBack`, the dated append) — `SELECT
   * day_number FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number
   * >= ? ORDER BY day_number DESC`.
   */
  async listDayNumbersFrom(trip_id: number, from_number: number): Promise<number[]> {
    const rows = await this.qb('b')
      .select(['b.day_number'])
      .where({ trip: trip_id, day_number: { $gte: from_number } })
      .orderBy({ day_number: 'desc' })
      .execute<{ day_number: number }[]>('all', false);
    return rows.map((r) => r.day_number);
  }

  /**
   * RB6 (`DayRemovalService.shiftBoundaries`) — `SELECT day_number FROM
   * roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number`.
   */
  async listDayNumbers(trip_id: number): Promise<number[]> {
    const rows = await this.qb('b')
      .select(['b.day_number'])
      .where({ trip: trip_id })
      .orderBy({ day_number: 'asc' })
      .execute<{ day_number: number }[]>('all', false);
    return rows.map((r) => r.day_number);
  }

  /**
   * RB7 (`DaysService.shiftBoundariesBack`, `DayRemovalService.shiftBoundaries`)
   * — `UPDATE roadtrip_day_boundaries SET day_number = ? WHERE trip_id = ? AND
   * day_number = ?`.
   */
  async moveDayNumber(trip_id: number, from_number: number, to_number: number): Promise<void> {
    await this.nativeUpdate({ trip: trip_id, day_number: from_number }, { day_number: to_number });
  }
}
