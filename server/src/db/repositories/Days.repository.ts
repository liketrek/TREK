import type { Days } from '../entities/Days.entity';
import { columnRef } from '../dialect/sql-functions';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `days` row as the API emits it. */
export interface DayRow {
  id: number;
  trip_id: number;
  day_number: number;
  date: string | null;
  notes: string | null;
  title: string | null;
  default_transport_mode: string | null;
}

const _dayRowKeys: AssertRowKeys<DayRow, Days> = true;

/** The DY26/DY29 reorder/insert projection: `SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number`. */
export interface DayOrderRow {
  id: number;
  day_number: number;
  date: string | null;
}

/** The DY21 re-anchor lookup: `SELECT id, day_number FROM days WHERE trip_id = ? AND date = ? LIMIT 1`. */
export interface DayIdAndNumberRow {
  id: number;
  day_number: number;
}

/** RPL1's projection: `SELECT id, day_number, date, title, default_transport_mode FROM days WHERE trip_id = ? ORDER BY day_number`. */
export interface PlanDayRow {
  id: number;
  day_number: number;
  date: string | null;
  title: string | null;
  default_transport_mode: string | null;
}

/** TP77's projection: a day as the shared planDayGrid reads it. `has_plan_items` is SQLite's 0/1. */
export interface DayGridReadRow {
  id: number;
  day_number: number;
  date: string | null;
  has_plan_items: number;
}

/** The narrow table shape TP77/TP78 read (`this.kysely()`'s typed `DB` argument). */
interface DayGridKyselyDB {
  days: { id: number; trip_id: number; day_number: number; date: string | null };
  day_assignments: { id: number; day_id: number };
  day_notes: { id: number; day_id: number };
  day_accommodations: { id: number; start_day_id: number; end_day_id: number };
}

export class DaysRepository extends TrekRepository<Days> {
  /** `SELECT * FROM days WHERE trip_id = ? ORDER BY day_number ASC` */
  async listByTrip(trip_id: number): Promise<DayRow[]> {
    const days = await this.find({ trip: trip_id }, { orderBy: { day_number: 'asc' } });
    return days.map((d) => toRow(d) as DayRow);
  }

  /** `SELECT * FROM days WHERE id = ? AND trip_id = ?` */
  async findInTrip(id: number, trip_id: number): Promise<DayRow | undefined> {
    const day = await this.findOne({ id, trip: trip_id });
    return day ? (toRow(day) as DayRow) : undefined;
  }

  /**
   * CT1/CT2 (Plan 3j Task 5, `contributions/day-schedule.controller.ts` /
   * `day-tints.controller.ts`, byte-identical text) — `SELECT id FROM days
   * WHERE trip_id = ?`, the trip's own day-id set (used only for a
   * membership check against a plugin-contributed `dayId`).
   */
  async listIdsByTrip(trip_id: number): Promise<number[]> {
    const rows = await this.find({ trip: trip_id }, { fields: ['id'] });
    return rows.map((r) => r.id);
  }

  /**
   * MR9 (Plan 3j Task 5, `host/rpc/meta.rpc.ts#entityTrip`'s `'day'` arm,
   * R12's "one method per target table, no dynamic identifier dispatch"
   * precedent — `PlacesRepository.findTripId`/`ReservationsRepository
   * .findTripId`'s own docstrings) — `SELECT trip_id FROM days WHERE id =
   * ?`. `trip_id` is a `persist(false)` mirror of the `trip` relation —
   * `columnRef`, not a bare select (the program-wide trap).
   */
  async findTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('d')
      .select([columnRef(platform, 'd.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  /**
   * The trip's highest `day_number`, 0 when it has no days.
   *
   * The legacy statement was `SELECT MAX(day_number) ... WHERE trip_id = ?`;
   * this reads the same value as the first row of a descending order, which
   * needs no SQL function spelled outside `db/dialect/sql-functions.ts` and no
   * entity hydrated into the identity map.
   */
  async maxDayNumber(trip_id: number): Promise<number> {
    const row = await this.qb('d')
      .select('d.day_number')
      .where({ trip: trip_id })
      .orderBy({ day_number: 'desc' })
      .limit(1)
      .execute<{ day_number: number | null } | undefined>('get', false);
    return row?.day_number ?? 0;
  }

  /**
   * The column set of the legacy INSERT:
   * `INSERT INTO days (trip_id, day_number, date, notes) VALUES (?, ?, ?, ?)`.
   *
   * The caller passes already-coerced values — every field is required and is
   * written verbatim, because a default or a coercion belongs to the service
   * that owns the rule, not to the statement that stores it.
   *
   * `this.insert` (Plan 3b interlude B, finishing F2's sweep — Task 1 fix
   * round's re-review flagged this method as a leftover whole-request-
   * UnitOfWork `flush()`), never `create()` + `persist().flush()`: `flush()`
   * commits the *whole* unit of work of the request's `EntityManager`, not
   * just this row. The insert is followed by a read-back
   * (`disableIdentityMap: true` by the base class's default), so the caller
   * gets the stored row rather than what it asked to store — not optional:
   * the insert's `returning` clause carries only the generated and
   * `defaultRaw` columns, so a column this insert never names (`title`,
   * `default_transport_mode`) would otherwise simply be missing from the
   * row.
   */
  async createDay(input: {
    trip_id: number;
    day_number: number;
    date: string | null;
    notes: string | null;
  }): Promise<DayRow> {
    const id = await this.insert({
      trip: input.trip_id,
      day_number: input.day_number,
      date: input.date,
      notes: input.notes,
    });
    const inserted = await this.findOne({ id });
    if (!inserted) {
      throw new Error('createDay: read-back after insert found no row');
    }
    return toRow(inserted) as DayRow;
  }

  /**
   * `SELECT * FROM days WHERE id = ?` — DY7/DY10/DY12/DY32/DY36's shared
   * re-select, one method for all five sites (DY32/DY36 read after their
   * transaction resolves, so this is a fresh statement against committed
   * rows, no `refresh` needed).
   */
  async findById(id: number): Promise<DayRow | undefined> {
    const day = await this.findOne({ id });
    return day ? (toRow(day) as DayRow) : undefined;
  }

  /**
   * DY9 — `UPDATE days SET notes = ?, title = ? WHERE id = ?`. The presence
   * sentinel that decides `notes`/`title` (the legacy's asymmetric `||`
   * vs. `??` coercion) stays in `DaysService.update`; this takes the final,
   * already-decided values and writes them verbatim.
   */
  async updateNotesAndTitle(id: number, notes: string | null, title: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { notes, title });
  }

  /** DY11 — `UPDATE days SET default_transport_mode = ? WHERE id = ?` (#1281). */
  async setDefaultTransportMode(id: number, mode: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { default_transport_mode: mode });
  }

  /** DY13 — `DELETE FROM days WHERE id = ?`, unscoped: the caller proved trip access. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * DY26/DY29 — `SELECT id, day_number, date FROM days WHERE trip_id = ?
   * ORDER BY day_number`, the read `reorder`/`insert` both take before
   * opening their `uow.transactional` block (same text, two legacy methods,
   * one repository method here).
   */
  async listOrderedForReorder(trip_id: number): Promise<DayOrderRow[]> {
    return await this.qb('d')
      .select(['d.id', 'd.day_number', 'd.date'])
      .where({ trip: trip_id })
      .orderBy({ day_number: 'asc' })
      .execute<DayOrderRow[]>('all', false);
  }

  /** DY27/DY30 — `UPDATE days SET day_number = ? WHERE id = ?` (the two-phase renumber's per-row write). */
  async setDayNumber(id: number, day_number: number): Promise<void> {
    await this.nativeUpdate({ id }, { day_number });
  }

  /** DY28/DY33 — `UPDATE days SET day_number = ?, date = ? WHERE id = ?`. */
  async setDayNumberAndDate(id: number, day_number: number, date: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { day_number, date });
  }

  /**
   * DY31/DY34 — `INSERT INTO days (trip_id, day_number, date) VALUES (?, ?,
   * ?)` (no `notes` column named, unlike `createDay`'s DY6 — the row's
   * `notes` is left to the column's own NULL default). Returns the inserted
   * id (`em.insert()`'s returned PK, R6's `lastInsertRowid` replacement);
   * the caller re-selects separately (DY32/DY36), after its transaction
   * resolves, so no read-back happens here.
   */
  async insertDay(input: { trip_id: number; day_number: number; date: string | null }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      day_number: input.day_number,
      date: input.date,
    });
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 8 (`TripsService.copy`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP39 (`trips.service.ts::copy`'s day INSERT) — `INSERT INTO days
   * (trip_id, day_number, date, notes, title) VALUES (?, ?, ?, ?, ?)`. A
   * different column set from both `insertDay` (DY31/DY34, no `notes`/
   * `title`) and `createDay` (no `title`): the copy carries a source day's
   * `notes` AND `title` verbatim, with no read-back — the caller only needs
   * the generated id for `dayMap`.
   */
  async insertDayCopy(input: {
    trip_id: number;
    day_number: number;
    date: string | null;
    notes: string | null;
    title: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      day_number: input.day_number,
      date: input.date,
      notes: input.notes,
      title: input.title,
    });
  }

  /** DY21 — `SELECT id, day_number FROM days WHERE trip_id = ? AND date = ? LIMIT 1`. */
  async findByTripAndDate(trip_id: number, date: string): Promise<DayIdAndNumberRow | undefined> {
    const row = await this.qb('d')
      .select(['d.id', 'd.day_number'])
      .where({ trip: trip_id, date })
      .limit(1)
      .execute<DayIdAndNumberRow | undefined>('get', false);
    return row ?? undefined;
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 1 (`RoadtripPlanService`) — additive, per this task's own
  // file-ownership rule ("all additive methods on Days/Places/DayAssignments
  // repositories").
  // ---------------------------------------------------------------------------

  /**
   * RPL1 (`roadtrip-plan.service.ts::context`) — `SELECT id, day_number,
   * date, title, default_transport_mode FROM days WHERE trip_id = ? ORDER BY
   * day_number`.
   */
  async listPlanDays(trip_id: number): Promise<PlanDayRow[]> {
    return await this.qb('d')
      .select(['d.id', 'd.day_number', 'd.date', 'd.title', 'd.default_transport_mode'])
      .where({ trip: trip_id })
      .orderBy({ day_number: 'asc' })
      .execute<PlanDayRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 3 (`AssignmentsService`) — appended per the task's own
  // file-ownership rule ("additive methods on Days/Places repositories if
  // needed").
  // ---------------------------------------------------------------------------

  /**
   * AS4 (`AssignmentsService.dayExists`) — `SELECT id FROM days WHERE id = ?
   * AND trip_id = ?`. Raw-bind (`number | string`, D4's T5 escape hatch,
   * `TripsRepository.findAccessible`'s precedent): the legacy guard binds
   * the route's raw params with no `Number()`/`toRowId` conversion of its
   * own, so this must accept and bind exactly what it's handed.
   */
  async existsInTrip(id: number | string, trip_id: number | string): Promise<boolean> {
    const row = await this.qb('d')
      .select(['d.id'])
      .where('d.id = ? AND d.trip_id = ?', [id, trip_id])
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 7 (`TripsService.generateDays`) — appended per the task's own
  // file-ownership rule ("additive methods on Days/Places/Users repositories").
  // ---------------------------------------------------------------------------

  /**
   * TP77 (`trips.service.ts::generateDays`, the shared planDayGrid input) —
   * `SELECT d.id, d.day_number, d.date, EXISTS (SELECT 1 FROM day_assignments
   * da WHERE da.day_id = d.id) OR EXISTS (SELECT 1 FROM day_notes dn WHERE
   * dn.day_id = d.id) AS has_plan_items FROM days d WHERE d.trip_id = ?`.
   * Ordered by `day_number` here where the legacy statement has no `ORDER BY`:
   * harmless, the plan sorts by `day_number` itself. `$castTo` for the same
   * reason `DayAssignmentsRepository.listForTimeSort` gives: Kysely types the
   * `eb.or(...)` column as its own `SqlBool`, not the `0`/`1` SQLite returns.
   */
  async listForDayGrid(trip_id: number): Promise<DayGridReadRow[]> {
    return await this.kysely<DayGridKyselyDB>()
      .selectFrom('days as d')
      .select(['d.id', 'd.day_number', 'd.date'])
      .select((eb) =>
        eb.or([
          eb.exists(eb.selectFrom('day_assignments as da').select('da.id').whereRef('da.day_id', '=', 'd.id')),
          eb.exists(eb.selectFrom('day_notes as dn').select('dn.id').whereRef('dn.day_id', '=', 'd.id')),
        ]).as('has_plan_items'),
      )
      .where('d.trip_id', '=', trip_id)
      .orderBy('d.day_number', 'asc')
      .$castTo<DayGridReadRow>()
      .execute();
  }

  /**
   * TP78 (`trips.service.ts::generateDays`) — `SELECT dac.start_day_id,
   * dac.end_day_id FROM day_accommodations dac WHERE dac.start_day_id IN
   * (SELECT id FROM days WHERE trip_id = ?) OR dac.end_day_id IN (SELECT id
   * FROM days WHERE trip_id = ?)`: every stay touching one of the trip's days.
   */
  async listDayGridStays(trip_id: number): Promise<{ start_day_id: number; end_day_id: number }[]> {
    return await this.kysely<DayGridKyselyDB>()
      .selectFrom('day_accommodations as dac')
      .select(['dac.start_day_id', 'dac.end_day_id'])
      .where((eb) =>
        eb.or([
          eb('dac.start_day_id', 'in', eb.selectFrom('days').select('id').where('trip_id', '=', trip_id)),
          eb('dac.end_day_id', 'in', eb.selectFrom('days').select('id').where('trip_id', '=', trip_id)),
        ]),
      )
      .execute();
  }

  // ---------------------------------------------------------------------------
  // Plan 4 Task 1 (`public-api.service.ts::buildDays`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * `SELECT id, day_number, date, title, notes FROM days WHERE trip_id = ?
   * ORDER BY day_number ASC` — the same shape {@link listPlanDays} already
   * establishes for this table, a narrower column set.
   */
  async listForPublicApi(trip_id: number): Promise<PublicApiDayProjectionRow[]> {
    return await this.qb('d')
      .select(['d.id', 'd.day_number', 'd.date', 'd.title', 'd.notes'])
      .where({ trip: trip_id })
      .orderBy({ day_number: 'asc' })
      .execute<PublicApiDayProjectionRow[]>('all', false);
  }
}

/** {@link DaysRepository.listForPublicApi}'s projection. */
export interface PublicApiDayProjectionRow {
  id: number;
  day_number: number;
  date: string | null;
  title: string | null;
  notes: string | null;
}
