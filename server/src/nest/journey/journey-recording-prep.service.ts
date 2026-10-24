import { JourneyRecordingPrep } from '../../db/entities/JourneyRecordingPrep.entity';
import type { JourneyRecordingPrepRepository } from '../../db/repositories/JourneyRecordingPrep.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { JOURNEY_RECORDING_PREP_REACH_DAYS, type JourneyRecordingPrepPeriod } from '@trek/shared';

const DAY_MS = 86_400_000;

/** A journey that prepares its recorded days, with the linked trips the next run reads. */
export interface PreparedJourney {
  journeyId: number;
  trips: Array<{ id: number; start_date: string | null; end_date: string | null }>;
}

/** The last background run over a journey's recorded days, for one person. */
export interface JourneyRecordingPrepStatus {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

/**
 * Preparing a journey's recorded days (JRN-03): which journeys a person's
 * Dawarich sync also reads, and how the last of those runs went for them.
 * The journey owns the switch and the status; the reading itself is the
 * Dawarich sync's, which calls in here and never the other way round.
 */
@Injectable()
export class JourneyRecordingPrepService {
  constructor(@InjectRepository(JourneyRecordingPrep) private readonly prep: JourneyRecordingPrepRepository) {}

  /** The journeys this person prepares now, each with its linked trips within the sync's reach. */
  async listFor(userId: number, now: Date = new Date()): Promise<PreparedJourney[]> {
    const rows = await this.prep.listPreparedTrips(userId, {
      endedAfter: isoDate(now.getTime() - JOURNEY_RECORDING_PREP_REACH_DAYS * DAY_MS),
      startedBy: isoDate(now.getTime() + DAY_MS),
    });
    const byJourney = new Map<number, PreparedJourney>();
    for (const row of rows) {
      let journey = byJourney.get(row.journey_id);
      if (!journey) {
        journey = { journeyId: row.journey_id, trips: [] };
        byJourney.set(row.journey_id, journey);
      }
      journey.trips.push({ id: row.trip_id, start_date: row.start_date, end_date: row.end_date });
    }
    return [...byJourney.values()];
  }

  /**
   * The linked trips of one journey this person's runs reach, read as
   * `listFor` reads them for the sync, so a day is only ever shown as
   * prepared when a run actually reads it.
   */
  async periodsOf(journeyId: number, userId: number, now: Date = new Date()): Promise<JourneyRecordingPrepPeriod[]> {
    const journey = (await this.listFor(userId, now)).find((j) => j.journeyId === journeyId);
    return (journey?.trips ?? []).flatMap((trip) =>
      trip.start_date ? [{ start: trip.start_date, end: trip.end_date }] : [],
    );
  }

  /**
   * One run's outcome for a journey and person: `error` is Dawarich's reason,
   * null when every period came through.
   *
   * @txStandalone a status row, complete on its own whatever the run around it wrote.
   */
  async record(journeyId: number, userId: number, error: string | null, at: Date = new Date()): Promise<void> {
    await this.prep.recordAttempt(journeyId, userId, at.toISOString(), error);
  }

  async status(journeyId: number, userId: number): Promise<JourneyRecordingPrepStatus> {
    const row = await this.prep.findStatus(journeyId, userId);
    return {
      lastAttemptAt: row?.last_attempt_at ?? null,
      lastSuccessAt: row?.last_success_at ?? null,
      lastError: row?.last_error ?? null,
    };
  }
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
