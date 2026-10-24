import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyEntryStays } from '../../db/entities/JourneyEntryStays.entity';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import type { JourneyEntryStaysRepository } from '../../db/repositories/JourneyEntryStays.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { JourneyDayEntry } from '@trek/shared';

/** A recorded stay as an entry takes it over. */
export interface StayTakenOver {
  sourceVisitId: string;
  name: string;
  lat: number | null;
  lng: number | null;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
}

const SOURCE = 'dawarich';

/**
 * The recorded stays a journey's entries were taken over from (JRN-02). The
 * journey owns them like its entries: a day report keeps the places it covers
 * here, and taking a day over again asks here what the journey holds already.
 * Reading the stays from Dawarich is `journey-recordings`' part.
 */
@Injectable()
export class JourneyEntryStaysService {
  constructor(
    @InjectRepository(JourneyEntryStays) private readonly stays: JourneyEntryStaysRepository,
    @InjectRepository(JourneyEntries) private readonly entries: JourneyEntriesRepository,
  ) {}

  /** Which of one person's stays the journey holds, by Dawarich visit id, with the entry holding each. */
  async held(
    journeyId: number,
    userId: number,
    sourceVisitIds: string[],
  ): Promise<Map<string, { id: number; title: string | null }>> {
    const rows = await this.stays.listHeld(journeyId, userId, SOURCE, sourceVisitIds);
    return new Map(rows.map((row) => [row.source_visit_id, { id: row.entry_id, title: row.entry_title }]));
  }

  /** The entries a journey has on a day, in the order the timeline shows them. */
  async entriesOn(journeyId: number, date: string): Promise<JourneyDayEntry[]> {
    return (await this.entries.listForJourney(journeyId))
      .filter((entry) => entry.entry_date === date)
      .map((entry) => ({
        id: entry.id,
        title: entry.title ?? null,
        locationName: entry.location_name ?? null,
        entryTime: entry.entry_time ?? null,
        isDraft: entry.is_draft === 1,
      }));
  }

  /** Records the stays an entry was taken over from, in the order they were lived. */
  async record(journeyId: number, entryId: number, userId: number, stays: StayTakenOver[]): Promise<void> {
    await this.stays.insertStays(
      stays.map((stay, index) => ({
        journey_id: journeyId,
        entry_id: entryId,
        source: SOURCE,
        source_visit_id: stay.sourceVisitId,
        name: stay.name,
        lat: stay.lat,
        lng: stay.lng,
        started_at: stay.startedAt,
        ended_at: stay.endedAt,
        duration_minutes: stay.durationMinutes,
        sort_order: index,
        user_id: userId,
      })),
    );
  }
}
