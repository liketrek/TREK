import type { SuggestionJoinRow } from '../../db/repositories/DawarichVisitSuggestions.repository';
import { badRequest, forbidden, notFound } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { DawarichDayStaysService } from '../integrations/dawarich-day-stays.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { JourneyEntryStaysService, type StayTakenOver } from '../journey/journey-entry-stays.service';
import { JourneyRecordedDaysService } from '../journey/journey-recorded-days.service';
import { JourneyRecordingsService } from './journey-recordings.service';
import { Injectable } from '@nestjs/common';
import {
  journeyDayImportProblem,
  type JourneyDayEntry,
  type JourneyDayImportGroup,
  type JourneyDayImportRequest,
  type JourneyDayImportResult,
  type JourneyDayStay,
  type JourneyDayStays,
} from '@trek/shared';

type CreatedEntry = NonNullable<Awaited<ReturnType<JourneyDomainService['createEntry']>>>;

/** A stay of the group with the name it goes into the journal under. */
interface NamedStay {
  row: SuggestionJoinRow;
  name: string;
}

/**
 * Taking a recorded day into a journey with its stays (JRN-02): the review of
 * the day from the caller's own Dawarich, then, on their word, drafts.
 *
 * Every stay is the caller's and of the chosen day, checked again when the
 * drafts are written. The drafts, the stays they hold, and the stays marked
 * taken over or left out are one transaction: a failure leaves nothing
 * behind, and a stay the journey holds already is reported instead of
 * written twice, so sending the same take-over again is harmless. The new
 * entries are announced after the commit. Nothing that was in the journal is
 * changed, and nothing is published: the entries are drafts.
 */
@Injectable()
export class JourneyDayImportService {
  constructor(
    private readonly recordings: JourneyRecordingsService,
    private readonly journeys: JourneyDomainService,
    private readonly entryStays: JourneyEntryStaysService,
    private readonly recordedDays: JourneyRecordedDaysService,
    private readonly dayStays: DawarichDayStaysService,
    private readonly uow: UnitOfWork,
  ) {}

  async review(userId: number, journeyId: number, date: string): Promise<JourneyDayStays> {
    const journey = await this.recordings.requireEditable(journeyId, userId);
    await this.recordings.requireDawarich();
    const day = await this.dayStays.forDay(userId, date);
    const entries = await this.entryStays.entriesOn(journeyId, date);
    const held = await this.entryStays.held(
      journeyId,
      userId,
      day.stays.map((row) => row.source_visit_id),
    );
    return {
      journey: { id: journey.id, title: journey.title },
      date,
      stays: day.stays.map((row) => toStay(row, held.get(row.source_visit_id) ?? null, entries)),
      entries,
      fresh: day.fresh,
      error: day.error,
      syncedAt: day.syncedAt,
      truncated: day.truncated,
      audience: await this.recordedDays.audience(journeyId, userId),
    };
  }

  async takeOver(
    userId: number,
    journeyId: number,
    date: string,
    request: JourneyDayImportRequest,
    socketId?: string,
  ): Promise<JourneyDayImportResult> {
    const problem = journeyDayImportProblem(request);
    if (problem) throw badRequest('This take-over cannot be written', { code: problem });
    await this.recordings.requireEditable(journeyId, userId);
    await this.recordings.requireDawarich();

    // Read inside the transaction, so a second take-over of the same day sent
    // at once finds what the first one wrote and reports it as taken.
    const done = await this.uow.transactional(async () => {
      const rows = new Map((await this.dayStays.storedForDay(userId, date)).map((row) => [row.id, row]));
      const rowOf = (id: number): SuggestionJoinRow => {
        const row = rows.get(id);
        if (!row) throw notFound('A stay is not one of yours on that day', { code: 'stay_not_on_day' });
        return row;
      };
      const groups = request.groups.map((group) => ({
        group,
        stays: group.stays.map((stay) => {
          const row = rowOf(stay.suggestionId);
          return { row, name: stay.name ?? row.name };
        }),
      }));
      const skipping = (request.skipSuggestionIds ?? []).map(rowOf);
      const held = await this.entryStays.held(
        journeyId,
        userId,
        [...rows.values()].map((row) => row.source_visit_id),
      );
      const isTaken = (row: SuggestionJoinRow) => held.has(row.source_visit_id) || row.state === 'accepted';

      const written: Array<{ entry: CreatedEntry; stays: NamedStay[] }> = [];
      for (const { group, stays: asked } of groups) {
        const [first, ...rest] = asked
          .filter((stay) => !isTaken(stay.row))
          .sort((a, b) => (a.row.started_at < b.row.started_at ? -1 : 1));
        if (!first) continue;
        const stays: [NamedStay, ...NamedStay[]] = [first, ...rest];
        // Announced below, once the whole take-over is committed.
        const entry = await this.journeys.createEntry(journeyId, userId, draftOf(group, stays, date), undefined, false);
        if (!entry) throw forbidden('Not allowed');
        await this.entryStays.record(journeyId, entry.id, userId, stays.map(takenOver));
        written.push({ entry, stays });
      }
      const skipped = skipping.filter((row) => row.state === 'new').map((row) => row.id);
      await this.dayStays.settle(
        written.flatMap(({ entry, stays }) => stays.map((stay) => ({ suggestionId: stay.row.id, entryId: entry.id }))),
        skipped,
      );
      const alreadyTaken = [...groups.flatMap(({ stays }) => stays.map((stay) => stay.row)), ...skipping]
        .filter(isTaken)
        .map((row) => row.id);
      return { written, skipped, alreadyTaken };
    });

    await Promise.all(
      done.written.map(({ entry }) =>
        this.journeys.broadcastJourneyEvent(journeyId, 'journey:entry:created', { entry }, socketId),
      ),
    );
    return {
      entries: done.written.map(({ entry, stays }) => ({
        id: entry.id,
        title: entry.title ?? null,
        stayCount: stays.length,
      })),
      alreadyTaken: done.alreadyTaken,
      skipped: done.skipped,
    };
  }
}

/** Where a stay of the day stands for this journey, as the review shows it. */
function toStay(
  row: SuggestionJoinRow,
  heldBy: { id: number; title: string | null } | null,
  entries: JourneyDayEntry[],
): JourneyDayStay {
  // A stay accepted one by one before the ledger existed is known by its entry id.
  const legacy = row.target === 'journal' ? entries.find((e) => e.id === row.accepted_journal_entry_id) : undefined;
  const entry = heldBy ?? (legacy ? { id: legacy.id, title: legacy.title } : null);
  return {
    suggestionId: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    sourceStatus: row.source_status === 'confirmed' ? 'confirmed' : 'suggested',
    confidenceBand: row.confidence_band,
    status: entry ? 'here' : row.state === 'accepted' ? 'elsewhere' : row.state === 'dismissed' ? 'skipped' : 'open',
    entry,
  };
}

/**
 * The draft a group becomes. It is pinned to the chosen stay, else the longest
 * one with a place, and dated to the day at the first arrival. A report lists
 * its stays with their times, so it is never an empty card.
 */
function draftOf(group: JourneyDayImportGroup, stays: [NamedStay, ...NamedStay[]], date: string) {
  const anchor =
    group.anchorSuggestionId === null
      ? undefined
      : (stays.find((stay) => stay.row.id === group.anchorSuggestionId && stay.row.lat !== null) ?? longest(stays));
  const [first] = stays;
  return {
    type: 'entry',
    title: group.title ?? first.name,
    story: group.kind === 'report' ? stays.map(reportLine).join('\n') : undefined,
    entry_date: date,
    entry_time: timeOf(first.row.started_at) ?? undefined,
    location_name: anchor?.name ?? (group.kind === 'report' ? undefined : first.name),
    location_lat: anchor?.row.lat ?? undefined,
    location_lng: anchor?.row.lng ?? undefined,
    is_draft: true,
  };
}

function longest(stays: NamedStay[]): NamedStay | undefined {
  return stays
    .filter((stay) => stay.row.lat !== null && stay.row.lng !== null)
    .reduce<NamedStay | undefined>(
      (best, stay) => (!best || stay.row.duration_minutes > best.row.duration_minutes ? stay : best),
      undefined,
    );
}

function reportLine(stay: NamedStay): string {
  const from = timeOf(stay.row.started_at);
  const to = timeOf(stay.row.ended_at);
  const span = from && to ? `${from}-${to}` : (from ?? '');
  return `- ${span ? `${span} ` : ''}${stay.name}`;
}

function takenOver(stay: NamedStay): StayTakenOver {
  return {
    sourceVisitId: stay.row.source_visit_id,
    name: stay.name,
    lat: stay.row.lat,
    lng: stay.row.lng,
    startedAt: stay.row.started_at,
    endedAt: stay.row.ended_at,
    durationMinutes: stay.row.duration_minutes,
  };
}

/** `HH:MM` out of an ISO timestamp, on the clock of the offset it carries. */
function timeOf(iso: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.slice(11, 16) : null;
}
