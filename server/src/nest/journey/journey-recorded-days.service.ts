import { JourneyRecordedDays } from '../../db/entities/JourneyRecordedDays.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import { JOURNEY_RECORDED_DAY_SEGMENTS } from '../../db/json-columns';
import type {
  JourneyRecordedDayRow,
  JourneyRecordedDaysRepository,
} from '../../db/repositories/JourneyRecordedDays.repository';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import { parseDbTimestamp } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { recordingStats, type DawarichTrackSegment, type JourneyRecordedDay } from '@trek/shared';

import crypto from 'crypto';

/** A day's recording as it is handed over to be kept. */
interface RecordingToKeep {
  date: string;
  sourceKind: 'tracks' | 'points';
  utcOffsetMinutes: number;
  window: { from: string; to: string };
  segments: DawarichTrackSegment[];
  truncated: boolean;
  fetchedAt: string;
  contentHash: string;
}

const SOURCE = 'dawarich';

/**
 * The recorded days a journey keeps (JRN-01). The journey owns them, so its
 * map can draw them without the integration they came from; taking a day
 * over from Dawarich is `journey-recordings`' part.
 */
@Injectable()
export class JourneyRecordedDaysService {
  constructor(
    @InjectRepository(JourneyRecordedDays) private readonly days: JourneyRecordedDaysRepository,
    @InjectRepository(Journeys) private readonly journeys: JourneysRepository,
  ) {}

  /**
   * What a recording says, as one value: equal hashes are the same line cut in
   * the same zone, so taking it over again keeps nothing new.
   */
  hashOf(segments: DawarichTrackSegment[], utcOffsetMinutes: number): string {
    return crypto
      .createHash('sha256')
      .update(`${utcOffsetMinutes}|${JSON.stringify(segments)}`)
      .digest('hex');
  }

  async list(journeyId: number): Promise<JourneyRecordedDay[]> {
    return (await this.days.listForJourney(journeyId)).map(toRecordedDay);
  }

  async find(journeyId: number, date: string): Promise<JourneyRecordedDay | null> {
    const row = await this.days.findDay(journeyId, date, SOURCE);
    return row ? toRecordedDay(row) : null;
  }

  /**
   * Keeps a day's recording and answers it as kept. With `replace` it takes the
   * place of what the journey kept for that day; without, it is kept only while
   * the journey keeps none, and null says another version got there first.
   */
  async keep(
    journeyId: number,
    userId: number,
    recording: RecordingToKeep,
    replace: boolean,
  ): Promise<JourneyRecordedDay | null> {
    const stats = recordingStats(recording.segments);
    const row = {
      journey_id: journeyId,
      local_date: recording.date,
      source: SOURCE,
      source_kind: recording.sourceKind,
      utc_offset_minutes: recording.utcOffsetMinutes,
      window_from: recording.window.from,
      window_to: recording.window.to,
      segments: JSON.stringify(recording.segments),
      point_count: stats.pointCount,
      distance_m: stats.distanceMeters,
      content_hash: recording.contentHash,
      truncated: recording.truncated ? 1 : 0,
      fetched_at: recording.fetchedAt,
      imported_by: userId,
    };
    if (replace) await this.days.upsertDay(row);
    else if ((await this.days.insertDayIfAbsent(row)) === undefined) return null;
    const kept = await this.find(journeyId, recording.date);
    if (!kept) throw new Error(`Recorded day ${recording.date} of journey ${journeyId} vanished after its write`);
    return kept;
  }

  async remove(journeyId: number, date: string): Promise<boolean> {
    return await this.days.deleteDay(journeyId, date, SOURCE);
  }

  /** How many people besides `userId` can open the journey, and so would see its map. */
  async audience(journeyId: number, userId: number): Promise<number> {
    return (await this.journeys.listRecipientUserIds(journeyId)).filter((id) => id !== userId).length;
  }
}

function toRecordedDay(row: JourneyRecordedDayRow): JourneyRecordedDay {
  const segments = decodeJson(JOURNEY_RECORDED_DAY_SEGMENTS, row.segments, `recorded day ${row.id}`);
  return {
    id: row.id,
    date: row.local_date,
    source: SOURCE,
    sourceKind: row.source_kind === 'tracks' ? 'tracks' : 'points',
    utcOffsetMinutes: row.utc_offset_minutes,
    window: { from: row.window_from, to: row.window_to },
    segments,
    stats: recordingStats(segments),
    truncated: row.truncated === 1,
    provisional: Date.parse(row.fetched_at) < Date.parse(row.window_to),
    fetchedAt: row.fetched_at,
    contentHash: row.content_hash,
    importedBy:
      row.imported_by !== null && row.imported_by_username !== null
        ? { id: row.imported_by, username: row.imported_by_username }
        : null,
    savedAt: (parseDbTimestamp(row.updated_at) ?? new Date(0)).toISOString(),
  };
}
