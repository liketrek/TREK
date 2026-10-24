import type { VacayEntries } from '../entities/VacayEntries.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type VacayEntriesKyselyDB = Pick<DB, 'vacay_entries'>;

/** VC111's joined grid projection (`getEntries`) — the full entry row plus the author's username and color. */
export interface VacayEntryWithPersonRow {
  id: number;
  plan_id: number;
  user_id: number;
  date: string;
  note: string | null;
  fraction: number;
  kind: string;
  person_name: string;
  person_color: string;
}

export class VacayEntriesRepository extends TrekRepository<VacayEntries> {
  /**
   * VC1 — `SELECT COALESCE(SUM(CASE WHEN kind = 'comp' THEN 0 ELSE fraction
   * END), 0) AS used FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND
   * date >= ? AND date < ?` (`usedDays`). Kysely's expression builder
   * (`eb.case()`/`eb.fn.sum`/`eb.fn.coalesce`, the `BudgetItems.repository.ts
   * #getPerPersonSummary` precedent) — the `ELSE fraction` branch is a
   * COLUMN reference, which `sql-functions.ts#caseWhenEquals` cannot express
   * (its `whenTrue`/`whenFalse` are bound VALUES, not column refs), so this
   * is built directly, no `sql` tag.
   */
  async sumFraction(userId: number, planId: number, start: string, end: string): Promise<number> {
    const row = await this.kysely<VacayEntriesKyselyDB>()
      .selectFrom('vacay_entries')
      .select((eb) =>
        eb.fn
          .coalesce(
            eb.fn.sum<number>(eb.case().when('kind', '=', 'comp').then(0).else(eb.ref('fraction')).end()),
            eb.val(0),
          )
          .as('used'),
      )
      .where('user_id', '=', userId)
      .where('plan_id', '=', planId)
      .where('date', '>=', start)
      .where('date', '<', end)
      .executeTakeFirst();
    // Plan 4 Task 8b: both `row?.` AND `?? 0` are unreachable here — an
    // unqualified, ungrouped `COALESCE(SUM(...), 0)` always returns exactly
    // one row with a non-null value (the `COALESCE` already resolves the
    // "no matching rows" case to `0` at the SQL level). Kept for type-shape
    // symmetry with `executeTakeFirst()`'s `| undefined` return type, same
    // accepted class as `OauthClients:147`.
    return row?.used ?? 0;
  }

  /** VC2 — `SELECT COALESCE(SUM(fraction), 0) AS used FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date >= ? AND date < ? AND kind = 'comp'` (`compUsedDays`). */
  async sumCompFraction(userId: number, planId: number, start: string, end: string): Promise<number> {
    const row = await this.kysely<VacayEntriesKyselyDB>()
      .selectFrom('vacay_entries')
      .select((eb) => eb.fn.coalesce(eb.fn.sum<number>('fraction'), eb.val(0)).as('used'))
      .where('user_id', '=', userId)
      .where('plan_id', '=', planId)
      .where('date', '>=', start)
      .where('date', '<', end)
      .where('kind', '=', 'comp')
      .executeTakeFirst();
    // Plan 4 Task 8b: same unreachable `row?.`/`?? 0` shape as {@link
    // sumFraction} above — `COALESCE(SUM(...), 0)` never returns a NULL
    // value or a missing row for an unqualified, ungrouped aggregate.
    return row?.used ?? 0;
  }

  /**
   * VC5 (`shiftOwnerEntriesForTripWindow`): `SELECT id, date, fraction FROM
   * vacay_entries WHERE plan_id = ? AND user_id = ? AND date BETWEEN ? AND ?
   * ORDER BY date`: the leave days a trip window move carries along, and the
   * ones already standing on its targets. The service decides each row's fate
   * and writes it with {@link moveEntry} or {@link deleteById} (#2604).
   */
  async listForOwnerWindow(
    planId: number,
    userId: number,
    start: string,
    end: string,
  ): Promise<{ id: number; date: string; fraction: number }[]> {
    const rows = await this.find(
      { plan: planId, user: userId, date: { $gte: start, $lte: end } },
      { fields: ['id', 'date', 'fraction'], orderBy: { date: 'asc' } },
    );
    return rows.map((row) => ({ id: row.id, date: row.date, fraction: row.fraction }));
  }

  /** VC5: `UPDATE vacay_entries SET date = ?, fraction = ? WHERE id = ?`, one moved day of `shiftOwnerEntriesForTripWindow`. */
  async moveEntry(id: number, date: string, fraction: number): Promise<void> {
    await this.nativeUpdate({ id }, { date, fraction });
  }

  /** VC24/VC30/VC121 — `DELETE FROM vacay_entries WHERE plan_id = ? AND date = ?` (`applyHolidayCalendars`'s auto-clear, and `makeRoomForCompanyHoliday`'s whole-holiday clear, reached from `updatePlan`'s company-holiday enable and `toggleCompanyHoliday`). */
  async deleteForPlanAndDate(planId: number, date: string): Promise<void> {
    await this.nativeDelete({ plan: planId, date });
  }

  /** VC134 — `UPDATE vacay_entries SET fraction = 0.5 WHERE plan_id = ? AND date = ? AND fraction > 0.5` (`makeRoomForCompanyHoliday`: a half company holiday halves a whole leave day, #2439). */
  async halveForPlanAndDate(planId: number, date: string): Promise<void> {
    await this.nativeUpdate({ plan: planId, date, fraction: { $gt: 0.5 } }, { fraction: 0.5 });
  }

  /** VC54/VC69/VC72 — `UPDATE vacay_entries SET plan_id = ? WHERE plan_id = ? AND user_id = ?` (`acceptInvite`'s migration-in, `dissolvePlan`'s two migration-out branches — three identical-text call sites). */
  async updatePlanIdForUser(newPlanId: number, oldPlanId: number, userId: number): Promise<void> {
    await this.nativeUpdate({ plan: oldPlanId, user: userId }, { plan: newPlanId });
  }

  /** VC101 — `SELECT DISTINCT user_id FROM vacay_entries WHERE plan_id = ?` (`deleteYear`'s author enumeration — reads authors off the entries themselves, catching orphans the member list would miss). */
  async listAuthorsForPlan(planId: number): Promise<{ user_id: number }[]> {
    const rows = await this.kysely<VacayEntriesKyselyDB>()
      .selectFrom('vacay_entries')
      .select('user_id')
      .distinct()
      .where('plan_id', '=', planId)
      .execute();
    return rows.map((row) => ({ user_id: row.user_id }));
  }

  /**
   * VC102 (`deleteYear`) — `DELETE FROM vacay_entries WHERE plan_id = ? AND
   * user_id = ? AND date >= ? AND date < ?`. The window is computed PER
   * AUTHOR by the caller (each `resolveYearWindow(user_id, year)` call inside
   * the per-author loop — #737-aware, since members can be on differently
   * shaped leave years) and passed in already resolved; this method never
   * re-derives it, so a shortcut that computed the window once and reused it
   * across authors would be a caller-side bug, not something this method
   * could introduce.
   */
  async deleteForRange(planId: number, userId: number, start: string, end: string): Promise<void> {
    await this.nativeDelete({ plan: planId, user: userId, date: { $gte: start, $lt: end } });
  }

  /**
   * VC111 (`getEntries`) — `SELECT e.*, u.username as person_name,
   * COALESCE(c.color, '#6366f1') as person_color FROM vacay_entries e JOIN
   * users u ON e.user_id = u.id LEFT JOIN vacay_user_colors c ON c.user_id =
   * e.user_id AND c.plan_id = e.plan_id WHERE e.plan_id = ? AND e.date >= ?
   * AND e.date < ?`. Kysely two-condition `LEFT JOIN`
   * (`BudgetItems.repository.ts#getPerPersonSummary`'s
   * `.onRef(...).onRef(...)` shape).
   */
  async listForRangeWithPerson(planId: number, start: string, end: string): Promise<VacayEntryWithPersonRow[]> {
    type EntriesWithPersonKyselyDB = Pick<DB, 'vacay_entries' | 'users' | 'vacay_user_colors'>;
    return this.kysely<EntriesWithPersonKyselyDB>()
      .selectFrom('vacay_entries as e')
      .innerJoin('users as u', 'u.id', 'e.user_id')
      .leftJoin('vacay_user_colors as c', (join) =>
        join.onRef('c.user_id', '=', 'e.user_id').onRef('c.plan_id', '=', 'e.plan_id'),
      )
      .select((eb) => [
        'e.id',
        'e.plan_id',
        'e.user_id',
        'e.date',
        'e.note',
        'e.fraction',
        'e.kind',
        'u.username as person_name',
        eb.fn.coalesce('c.color', eb.val('#6366f1')).as('person_color'),
      ])
      .where('e.plan_id', '=', planId)
      .where('e.date', '>=', start)
      .where('e.date', '<', end)
      .execute();
  }

  /** VC92 (`getSharedCalendars`) — `SELECT date, fraction, kind FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date >= ? AND date < ? ORDER BY date`, over the OWNER's plan and the VIEWER's leave-year window. */
  async listForOwnerRange(
    planId: number,
    userId: number,
    start: string,
    end: string,
  ): Promise<{ date: string; fraction: number; kind: string | null }[]> {
    const rows = await this.find(
      { plan: planId, user: userId, date: { $gte: start, $lt: end } },
      { fields: ['date', 'fraction', 'kind'], orderBy: { date: 'asc' } },
    );
    return rows.map((row) => ({ date: row.date, fraction: row.fraction, kind: row.kind ?? null }));
  }

  /**
   * VC114 — `SELECT id, fraction, kind FROM vacay_entries WHERE user_id = ?
   * AND date = ? AND plan_id = ?` (`toggleEntry`'s existing-entry read).
   * Named `findByUserDatePlan`, not `find` — `EntityRepository#find` already
   * exists with an incompatible signature.
   */
  async findByUserDatePlan(
    userId: number,
    date: string,
    planId: number,
  ): Promise<{ id: number; fraction: number; kind: string | null } | null> {
    const row = await this.findOne({ user: userId, date, plan: planId }, { fields: ['id', 'fraction', 'kind'] });
    return row ? { id: row.id, fraction: row.fraction, kind: row.kind ?? null } : null;
  }

  /** VC115 — `DELETE FROM vacay_entries WHERE id = ?` (`toggleEntry`'s clear-on-repeat-click). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** `DELETE FROM vacay_entries WHERE id IN (dynamic)`, the leave days `shiftOwnerEntriesForTripWindow` drops in one statement; a bound list. */
  async deleteByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.nativeDelete({ id: { $in: ids } });
  }

  /** VC116 — `UPDATE vacay_entries SET fraction = ?, kind = ? WHERE id = ?` (`toggleEntry`'s in-place conversion). */
  async updateFractionKind(id: number, fraction: number, kind: string): Promise<void> {
    await this.nativeUpdate({ id }, { fraction, kind });
  }

  /** VC117 — `INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)` (`toggleEntry`'s new entry — `note` is always `''` from this path). */
  async insertEntry(
    planId: number,
    userId: number,
    date: string,
    note: string,
    fraction: number,
    kind: string,
  ): Promise<void> {
    await this.insert({ plan: planId, user: userId, date, note, fraction, kind });
  }
}
