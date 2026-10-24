import type { JourneyRecordedDays } from '../entities/JourneyRecordedDays.entity';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';
import { TrekRepository } from './_shared/trek-repository';

type RecordedDaysDB = Pick<DB, 'journey_recorded_days' | 'users'>;

/** A day as it is taken over; `segments` is its JSON text. */
export interface JourneyRecordedDayWrite {
  journey_id: number;
  local_date: string;
  source: string;
  source_kind: string;
  utc_offset_minutes: number;
  window_from: string;
  window_to: string;
  segments: string;
  point_count: number;
  distance_m: number | null;
  content_hash: string;
  truncated: number;
  fetched_at: string;
  imported_by: number | null;
}

/** A kept day as it is read back, with the name of whose recording it is. */
export interface JourneyRecordedDayRow extends JourneyRecordedDayWrite {
  id: number;
  imported_by_username: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * `journey_recorded_days` (JRN-01): the route recorded on a day of a journey,
 * taken over on purpose, one version per journey, local day and source. A
 * day goes with its journey; it outlives the account that took it over.
 */
export class JourneyRecordedDaysRepository extends TrekRepository<JourneyRecordedDays> {
  private db() {
    return this.kysely<RecordedDaysDB>();
  }

  private selectRows() {
    return this.db()
      .selectFrom('journey_recorded_days as d')
      .leftJoin('users as u', 'u.id', 'd.imported_by')
      .select([
        'd.id',
        'd.journey_id',
        'd.local_date',
        'd.source',
        'd.source_kind',
        'd.utc_offset_minutes',
        'd.window_from',
        'd.window_to',
        'd.segments',
        'd.point_count',
        'd.distance_m',
        'd.content_hash',
        'd.truncated',
        'd.fetched_at',
        'd.imported_by',
        'u.username as imported_by_username',
        'd.created_at',
        'd.updated_at',
      ]);
  }

  /** The days a journey keeps, earliest first. */
  async listForJourney(journeyId: number): Promise<JourneyRecordedDayRow[]> {
    return await this.selectRows().where('d.journey_id', '=', journeyId).orderBy('d.local_date', 'asc').execute();
  }

  /** The version a journey keeps for one day of one source; undefined while it keeps none. */
  async findDay(journeyId: number, localDate: string, source: string): Promise<JourneyRecordedDayRow | undefined> {
    return await this.selectRows()
      .where('d.journey_id', '=', journeyId)
      .where('d.local_date', '=', localDate)
      .where('d.source', '=', source)
      .executeTakeFirst();
  }

  /**
   * Keeps a day, replacing the version kept for the same journey, day and
   * source in the one statement, and answers its id. A replaced day keeps its
   * id and the time it was first taken over.
   */
  async upsertDay(day: JourneyRecordedDayWrite): Promise<number> {
    const now = dbNow();
    const written = await this.db()
      .insertInto('journey_recorded_days')
      .values({ ...day, created_at: now, updated_at: now })
      .onConflict((oc) =>
        oc.columns(['journey_id', 'local_date', 'source']).doUpdateSet({
          source_kind: day.source_kind,
          utc_offset_minutes: day.utc_offset_minutes,
          window_from: day.window_from,
          window_to: day.window_to,
          segments: day.segments,
          point_count: day.point_count,
          distance_m: day.distance_m,
          content_hash: day.content_hash,
          truncated: day.truncated,
          fetched_at: day.fetched_at,
          imported_by: day.imported_by,
          updated_at: now,
        }),
      )
      .returning('id')
      .executeTakeFirstOrThrow();
    return written.id;
  }

  /**
   * Keeps a day only while the journey keeps none for that day and source, and
   * answers its id; undefined when another version was there first. Two takeovers
   * of the same day at once cannot both win this way.
   */
  async insertDayIfAbsent(day: JourneyRecordedDayWrite): Promise<number | undefined> {
    const now = dbNow();
    const written = await this.db()
      .insertInto('journey_recorded_days')
      .values({ ...day, created_at: now, updated_at: now })
      .onConflict((oc) => oc.columns(['journey_id', 'local_date', 'source']).doNothing())
      .returning('id')
      .executeTakeFirst();
    return written?.id;
  }

  /** Drops the day a journey keeps for one source; false when it kept none. */
  async deleteDay(journeyId: number, localDate: string, source: string): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('journey_recorded_days')
      .where('journey_id', '=', journeyId)
      .where('local_date', '=', localDate)
      .where('source', '=', source)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
