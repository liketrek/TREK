import { columnRef } from '../dialect/sql-functions';
import type { RoadtripDayTracks } from '../entities/RoadtripDayTracks.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { RoadtripDayTrack } from '@trek/shared';

/**
 * `roadtrip_day_tracks` — which recorded track (a `places` row with route
 * geometry) a day's drive was fitted to, and how far the fitted route still
 * strayed from it.
 */
export class RoadtripDayTracksRepository extends TrekRepository<RoadtripDayTracks> {
  /** RT7 — `DELETE FROM roadtrip_day_tracks WHERE day_id = ?` (`createMany`'s explicit `track: null` clear). */
  async deleteForDay(day_id: number): Promise<void> {
    await this.nativeDelete({ day: day_id });
  }

  /**
   * RT8 — `INSERT INTO roadtrip_day_tracks (day_id, place_id, stray_km)
   * VALUES (?, ?, ?) ON CONFLICT(day_id) DO UPDATE SET place_id =
   * excluded.place_id, stray_km = excluded.stray_km`.
   *
   * `onConflictFields: ['day']` — the RELATION property, not the `day_id`
   * scalar mirror (`persist(false)`, not a real column MikroORM's upsert
   * builder can target) — the same naming `PlaceRatingsRepository
   * .upsertRating`/`TripMembersRepository`'s own composite-key upserts use
   * for a relation-backed conflict target. `RoadtripDayTracks.day` is this
   * table's PRIMARY KEY (a nullable one-to-one, per Task 0's `RULE12`
   * finding — ruled NOT a generator defect, matching the `VacayUserSettings`
   * precedent), so the single-element list targets the table's actual PK,
   * `roadtrip_day_tracks(day_id)`. Proven, not assumed: `RoadtripDayTracks
   * .repository.test.ts` (`UPSERTTRACKREPO-*`) upserts the SAME `day_id`
   * twice with different `place_id`/`stray_km` and asserts exactly one row
   * survives with the SECOND call's values — if `onConflictFields: ['day']`
   * resolved to anything other than the physical `day_id` column, SQLite's
   * own `ON CONFLICT` target-matching would either throw (no matching
   * unique index) or let the second call's row collide on the real PK and
   * raise `UNIQUE constraint failed`, so the test is a genuine proof, not a
   * behavioural coincidence. `created_at` is named in neither
   * `onConflictMergeFields` NOR the insert payload beyond its own default,
   * so a conflict never refreshes it (pinned — the legacy statement's SET
   * list never named it either).
   */
  async upsertTrack(day_id: number, place_id: number, stray_km: number | null): Promise<void> {
    await this.upsert(
      { day: day_id, place: place_id, stray_km },
      { onConflictFields: ['day'], onConflictAction: 'merge', onConflictMergeFields: ['place', 'stray_km'] },
    );
  }

  /**
   * RT12 — `SELECT t.day_id, t.place_id, t.stray_km FROM roadtrip_day_tracks
   * t JOIN days d ON d.id = t.day_id WHERE d.trip_id = ? ORDER BY t.day_id`.
   *
   * `columnRef` for both `day_id` (actively joined via `t.day`) and
   * `place_id` (not joined here, but selected the same defensive way for
   * consistency with every other persist(false) mirror in this cluster —
   * `PlaceRatingsRepository.listForPlaces`'s docstring is the verified trap
   * this sidesteps). Ordered by `d.id` (`= t.day_id` by the join condition)
   * rather than the mirror column itself, the same reason
   * `RoadtripViasRepository.listForTrip` orders by `d.id`.
   */
  async listForTrip(trip_id: number): Promise<RoadtripDayTrack[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('t')
      .join('t.day', 'd')
      .select([columnRef(platform, 't.day_id'), columnRef(platform, 't.place_id'), 't.stray_km'])
      .where({ 'd.trip': trip_id })
      .orderBy({ 'd.id': 'asc' })
      .execute<RoadtripDayTrack[]>('all', false);
  }
}
