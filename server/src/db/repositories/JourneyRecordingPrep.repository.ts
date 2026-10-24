import type { JourneyRecordingPrep } from '../entities/JourneyRecordingPrep.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type RecordingPrepDB = Pick<
  DB,
  'journey_recording_prep' | 'journeys' | 'journey_contributors' | 'journey_trips' | 'trips'
>;

/** A linked trip of a journey that prepares its recorded days. */
export interface PreparedJourneyTripRow {
  journey_id: number;
  trip_id: number;
  start_date: string | null;
  end_date: string | null;
}

/** How far preparing a journey's recorded days got for one person. */
export interface JourneyRecordingPrepRow {
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

/**
 * `journey_recording_prep` (JRN-03): one row per journey and person, written
 * after each background run that prepared the journey's recorded days, and
 * the read of which journeys a person prepares at all.
 */
export class JourneyRecordingPrepRepository extends TrekRepository<JourneyRecordingPrep> {
  private db() {
    return this.kysely<RecordingPrepDB>();
  }

  /**
   * The dated, not archived linked trips of every journey that prepares its
   * recorded days and that this person may still edit, as owner or editor,
   * within the reach the trip sync keeps: ended on or after `endedAfter`
   * (or still open) and started by `startedBy`. Losing the edit role or the
   * switch takes a journey out of here and so out of the next run.
   */
  async listPreparedTrips(
    userId: number,
    reach: { endedAfter: string; startedBy: string },
  ): Promise<PreparedJourneyTripRow[]> {
    return await this.db()
      .selectFrom('journeys as j')
      .innerJoin('journey_trips as jt', 'jt.journey_id', 'j.id')
      .innerJoin('trips as t', 't.id', 'jt.trip_id')
      .leftJoin('journey_contributors as c', (join) =>
        join.onRef('c.journey_id', '=', 'j.id').on('c.user_id', '=', userId),
      )
      .select(['j.id as journey_id', 't.id as trip_id', 't.start_date', 't.end_date'])
      .where('j.auto_prepare_recordings', '=', 1)
      .where((eb) => eb.or([eb('j.user_id', '=', userId), eb('c.role', 'in', ['owner', 'editor'])]))
      .where((eb) => eb.or([eb('t.is_archived', 'is', null), eb('t.is_archived', '=', 0)]))
      .where('t.start_date', 'is not', null)
      .where('t.start_date', '<=', reach.startedBy)
      .where((eb) => eb.or([eb('t.end_date', 'is', null), eb('t.end_date', '>=', reach.endedAfter)]))
      .orderBy('j.id', 'asc')
      .orderBy('t.start_date', 'asc')
      .execute();
  }

  async findStatus(journeyId: number, userId: number): Promise<JourneyRecordingPrepRow | undefined> {
    return await this.db()
      .selectFrom('journey_recording_prep')
      .select(['last_attempt_at', 'last_success_at', 'last_error'])
      .where('journey_id', '=', journeyId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  /**
   * One attempt, in one statement: a success clears the reason of an earlier
   * failure, a failure keeps the time of the last success, so what is still
   * there and why it is not newer stay apart.
   */
  async recordAttempt(journeyId: number, userId: number, at: string, error: string | null): Promise<void> {
    const outcome = error === null ? { last_success_at: at, last_error: null } : { last_error: error };
    await this.db()
      .insertInto('journey_recording_prep')
      .values({ journey_id: journeyId, user_id: userId, last_attempt_at: at, ...outcome })
      .onConflict((oc) => oc.columns(['journey_id', 'user_id']).doUpdateSet({ last_attempt_at: at, ...outcome }))
      .execute();
  }
}
