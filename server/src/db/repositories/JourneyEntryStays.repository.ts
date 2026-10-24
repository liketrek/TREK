import type { JourneyEntryStays } from '../entities/JourneyEntryStays.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type EntryStaysDB = Pick<DB, 'journey_entry_stays' | 'journey_entries'>;

/** A recorded stay as an entry takes it over. */
export interface JourneyEntryStayWrite {
  journey_id: number;
  entry_id: number;
  source: string;
  source_visit_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  sort_order: number;
  user_id: number;
}

/** A located stay of a journey, as its map draws it (JRN-04). */
interface JourneyEntryStayMapRow {
  id: number;
  entry_id: number;
  name: string;
  lat: number;
  lng: number;
  started_at: string;
  ended_at: string;
}

/** A stay a journey holds, with the entry that holds it. */
interface JourneyEntryStayHeld {
  source_visit_id: string;
  entry_id: number;
  entry_title: string | null;
}

/**
 * `journey_entry_stays` (JRN-02): the recorded stays an entry was taken over
 * from, one row per stay, and the ledger that keeps the same stay of the same
 * person from landing in a journey twice. The rows go with their entry.
 */
export class JourneyEntryStaysRepository extends TrekRepository<JourneyEntryStays> {
  private db() {
    return this.kysely<EntryStaysDB>();
  }

  async insertStays(stays: JourneyEntryStayWrite[]): Promise<void> {
    if (stays.length === 0) return;
    await this.db().insertInto('journey_entry_stays').values(stays).execute();
  }

  /** Which of one person's stays of one source the journey holds, and in which entry. */
  async listHeld(
    journeyId: number,
    userId: number,
    source: string,
    sourceVisitIds: string[],
  ): Promise<JourneyEntryStayHeld[]> {
    if (sourceVisitIds.length === 0) return [];
    return await this.db()
      .selectFrom('journey_entry_stays as s')
      .innerJoin('journey_entries as e', 'e.id', 's.entry_id')
      .select(['s.source_visit_id', 's.entry_id', 'e.title as entry_title'])
      .where('s.journey_id', '=', journeyId)
      .where('s.user_id', '=', userId)
      .where('s.source', '=', source)
      .where('s.source_visit_id', 'in', sourceVisitIds)
      .execute();
  }

  /** The journey's stays that carry a position, by entry and in the order they were lived. */
  async listLocatedForJourney(journeyId: number): Promise<JourneyEntryStayMapRow[]> {
    const rows = await this.db()
      .selectFrom('journey_entry_stays as s')
      .select(['s.id', 's.entry_id', 's.name', 's.lat', 's.lng', 's.started_at', 's.ended_at'])
      .where('s.journey_id', '=', journeyId)
      .where('s.lat', 'is not', null)
      .where('s.lng', 'is not', null)
      .orderBy('s.entry_id', 'asc')
      .orderBy('s.sort_order', 'asc')
      .execute();
    return rows.map((row) => ({ ...row, lat: row.lat as number, lng: row.lng as number }));
  }
}
