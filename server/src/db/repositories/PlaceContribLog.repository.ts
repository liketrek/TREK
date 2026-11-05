import type { PlaceContribLog } from '../entities/PlaceContribLog.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type LogKyselyDB = Pick<DB, 'place_contrib_log'>;

/** One line of the transmission log. */
interface PlaceContribLogRow {
  id: number;
  day: string;
  contrib_key: string;
  place_name: string;
  field: string;
  value_summary: string | null;
  result: string;
  reason: string | null;
}

export type PlaceContribLogWrite = Omit<PlaceContribLogRow, 'id'>;

/** Which lines a page of the log shows. */
interface PlaceContribLogFilter {
  result?: string;
  field?: string;
}

const LOG_COLUMNS = ['id', 'day', 'contrib_key', 'place_name', 'field', 'value_summary', 'result', 'reason'] as const;

/**
 * `place_contrib_log`: what this installation sent to the TREK Places API and
 * what became of it, or why it kept a value home. By day, with the place's key
 * and name, never a user, trip or row id.
 */
export class PlaceContribLogRepository extends TrekRepository<PlaceContribLog> {
  private db() {
    return this.kysely<LogKyselyDB>();
  }

  async insertLines(rows: PlaceContribLogWrite[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db().insertInto('place_contrib_log').values(rows).execute();
  }

  /** One page, newest first. */
  async page(filter: PlaceContribLogFilter, limit: number, offset: number): Promise<PlaceContribLogRow[]> {
    let query = this.db()
      .selectFrom('place_contrib_log')
      .select([...LOG_COLUMNS]);
    if (filter.result) query = query.where('result', '=', filter.result);
    if (filter.field) query = query.where('field', '=', filter.field);
    return query.orderBy('id', 'desc').limit(limit).offset(offset).execute();
  }

  async total(filter: PlaceContribLogFilter): Promise<number> {
    let query = this.db()
      .selectFrom('place_contrib_log')
      .select((eb) => eb.fn.countAll<number>().as('count'));
    if (filter.result) query = query.where('result', '=', filter.result);
    if (filter.field) query = query.where('field', '=', filter.field);
    const row = await query.executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  /** Lines per result from `sinceDay` (YYYY-MM-DD) on. */
  async countsSince(sinceDay: string): Promise<Array<{ result: string; count: number }>> {
    const rows = await this.db()
      .selectFrom('place_contrib_log')
      .select(['result', (eb) => eb.fn.countAll<number>().as('count')])
      .where('day', '>=', sinceDay)
      .groupBy('result')
      .execute();
    return rows.map((row) => ({ result: row.result, count: Number(row.count) }));
  }

  /** The newest day a field was accepted, or null. */
  async lastAcceptedDay(): Promise<string | null> {
    const row = await this.db()
      .selectFrom('place_contrib_log')
      .select((eb) => eb.fn.max('day').as('day'))
      .where('result', '=', 'accepted')
      .executeTakeFirst();
    return row?.day ?? null;
  }

  /** The retention sweep: drops the lines older than `beforeDay`. */
  async purgeBefore(beforeDay: string): Promise<number> {
    const result = await this.db().deleteFrom('place_contrib_log').where('day', '<', beforeDay).executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
