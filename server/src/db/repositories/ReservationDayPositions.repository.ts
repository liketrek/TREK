import { columnRef } from '../dialect/sql-functions';
import type { ReservationDayPositions } from '../entities/ReservationDayPositions.entity';
import { TrekRepository } from './_shared/trek-repository';

/** `reservation_day_positions`/`reservations`/`days`'s shape for RS31's Kysely upsert. */
interface ReservationDayPositionsKyselyDB {
  reservation_day_positions: {
    reservation_id: number;
    day_id: number;
    position: number;
  };
  reservations: {
    id: number;
    // `number | string`: the legacy statement raw-binds `tripId` exactly as
    // the caller received it (D4's T5 escape hatch) — the Kysely column type
    // here is widened to accept both without narrowing which non-canonical
    // ids match, never actually persisted (this table has no `trip_id`
    // column of its own).
    trip_id: number | string;
  };
  days: {
    id: number;
    trip_id: number | string;
  };
}

export class ReservationDayPositionsRepository extends TrekRepository<ReservationDayPositions> {
  /**
   * RS19 (`ReservationsService.list`) — `SELECT rdp.reservation_id,
   * rdp.day_id, rdp.position FROM reservation_day_positions rdp JOIN
   * reservations r ON rdp.reservation_id = r.id WHERE r.trip_id = ?`. The
   * fold into `{[day_id]: position}` per reservation stays in the service.
   */
  async listForTrip(trip_id: number): Promise<{ reservation_id: number; day_id: number; position: number }[]> {
    const platform = this.getEntityManager().getPlatform();
    // `rdp.reservation_id`/`rdp.day_id` are `persist(false)` mirrors of the
    // `reservation`/`day` relations — bare-selecting them alongside an
    // active JOIN on `rdp.reservation` (aliased `r`) is the exact trap
    // `DayAssignmentsRepository.assignmentWithPlaceSelect`'s `category_id`
    // docstring documents (the column silently aliases off the JOINED
    // entity instead); `columnRef` selects the literal physical column.
    return this.qb('rdp')
      .join('rdp.reservation', 'r')
      .select([
        columnRef(platform, 'rdp.reservation_id').as('reservation_id'),
        columnRef(platform, 'rdp.day_id').as('day_id'),
        'rdp.position',
      ])
      .where({ 'r.trip': trip_id })
      .execute<{ reservation_id: number; day_id: number; position: number }[]>('all', false);
  }

  /**
   * RS31 (`ReservationsService.updatePositions`'s day branch) — `INSERT OR
   * REPLACE INTO reservation_day_positions (reservation_id, day_id,
   * position) SELECT r.id, d.id, ? FROM reservations r JOIN days d ON
   * d.trip_id = r.trip_id WHERE r.id = ? AND d.id = ? AND r.trip_id = ?`.
   *
   * Kysely `insertInto().orReplace().columns().expression(selectFrom…)`
   * (the MikroORM QueryBuilder's `insertFrom` has no `OR REPLACE` flag —
   * `.onConflict().merge()` is semantically different, a real UPDATE rather
   * than REPLACE's delete-then-insert). The trip scoping lives IN the
   * SELECT (a foreign `reservation_id`/`day_id` materialises zero rows to
   * insert, never a foreign-key error) — preserved exactly, not hoisted
   * into a pre-check.
   */
  async upsertScoped(
    trip_id: number | string,
    reservation_id: number,
    day_id: number,
    position: number,
  ): Promise<void> {
    await this.kysely<ReservationDayPositionsKyselyDB>()
      .insertInto('reservation_day_positions')
      .orReplace()
      .columns(['reservation_id', 'day_id', 'position'])
      .expression((eb) =>
        eb
          .selectFrom('reservations as r')
          .innerJoin('days as d', 'd.trip_id', 'r.trip_id')
          .select(['r.id as reservation_id', 'd.id as day_id', eb.val(position).as('position')])
          .where('r.id', '=', reservation_id)
          .where('d.id', '=', day_id)
          .where('r.trip_id', '=', trip_id),
      )
      .execute();
  }
}
