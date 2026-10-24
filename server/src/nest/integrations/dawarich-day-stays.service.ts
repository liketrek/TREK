import { DawarichVisitSuggestions } from '../../db/entities/DawarichVisitSuggestions.entity';
import type {
  DawarichVisitSuggestionsRepository,
  SuggestionJoinRow,
} from '../../db/repositories/DawarichVisitSuggestions.repository';
import { DomainError } from '../common/domain-error';
import { DawarichSyncService } from './dawarich-sync.service';
import { DawarichError } from './dawarich.client';
import { DawarichService } from './dawarich.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** The caller's stays of one day, and how current they are. */
interface DawarichDayStays {
  stays: SuggestionJoinRow[];
  /** Read from Dawarich just now; false when it did not answer and the last sync is what is shown. */
  fresh: boolean;
  /** Dawarich's reason while `fresh` is false. */
  error: string | null;
  syncedAt: string | null;
  truncated: boolean;
}

/**
 * The stays of one recorded day as a journey takes them over (JRN-02), always
 * the caller's own: read again from their Dawarich where it answers, and
 * marked taken over or left out once they decided. A stay is never written
 * anywhere else from here; the journey's part is `journey-recordings`'.
 */
@Injectable()
export class DawarichDayStaysService {
  constructor(
    @InjectRepository(DawarichVisitSuggestions) private readonly suggestions: DawarichVisitSuggestionsRepository,
    private readonly dawarich: DawarichService,
    private readonly sync: DawarichSyncService,
  ) {}

  /**
   * The stays of a local day, in the order they were lived. Dawarich is asked
   * first; when it does not answer, the stays the last sync brought in are
   * shown with the reason, so the review still works on what is known.
   * Refuses with 409 `not_connected` without a connection.
   *
   * @txIndependent the refresh after a network read and the reopening of
   * stays whose entry is gone each stand on their own.
   */
  async forDay(userId: number, date: string): Promise<DawarichDayStays> {
    const creds = await this.dawarich.getCredentials(userId);
    if (!creds) throw new DomainError(409, 'Dawarich is not connected', { details: { code: 'not_connected' } });

    let fresh = true;
    let error: string | null = null;
    let truncated = false;
    try {
      ({ truncated } = await this.sync.refreshDay(userId, creds, date));
    } catch (err) {
      if (!(err instanceof DawarichError)) throw err;
      fresh = false;
      error = err.code;
    }
    // An entry deleted since puts its stay back into review, as the stay list does.
    await this.suggestions.reopenOrphaned(userId);
    const connection = await this.dawarich.getConnection(userId);
    return {
      stays: await this.suggestions.listForDay(userId, date),
      fresh,
      error,
      syncedAt: fresh ? null : connection.lastSyncAt,
      truncated,
    };
  }

  /** The caller's stays of a day as they stand now, without asking Dawarich. */
  async storedForDay(userId: number, date: string): Promise<SuggestionJoinRow[]> {
    return await this.suggestions.listForDay(userId, date);
  }

  /**
   * Marks stays taken over into the journal entries that hold them, and the
   * ones left out as dismissed, so the day shows nothing pending afterwards.
   * Runs inside the caller's transaction with the entries it wrote.
   */
  async settle(taken: Array<{ suggestionId: number; entryId: number }>, skippedIds: number[]): Promise<void> {
    for (const { suggestionId, entryId } of taken) {
      await this.suggestions.markAccepted(suggestionId, {
        target: 'journal',
        placeId: null,
        journalEntryId: entryId,
        bucketItemId: null,
      });
    }
    for (const id of skippedIds) await this.suggestions.setState(id, 'dismissed');
  }
}
