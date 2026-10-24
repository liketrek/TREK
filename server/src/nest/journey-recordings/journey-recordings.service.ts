import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { DomainError, conflict, forbidden, notFound } from '../common/domain-error';
import { DawarichTracksService } from '../integrations/dawarich-tracks.service';
import { DawarichService } from '../integrations/dawarich.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { JourneyRecordedDaysService } from '../journey/journey-recorded-days.service';
import { JourneyRecordingPrepService } from '../journey/journey-recording-prep.service';
import { Injectable } from '@nestjs/common';
import {
  recordingStats,
  type JourneyRecordedDay,
  type JourneyRecordingPrep,
  type JourneyRecordingPreview,
  type JourneyRecordingPreviewRequest,
  type JourneyRecordingSaveRequest,
  type JourneyRecordingSaveResult,
} from '@trek/shared';

/**
 * Taking a day's recorded route over into a journey (JRN-01): a live preview
 * of the day from the caller's own Dawarich connection, then, on their word,
 * a copy the journey keeps.
 *
 * The preview writes nothing. The save reads the day again and keeps it only
 * when it is still the one previewed (its hash), so a recording that grew in
 * between is shown again before it is kept. A failed read throws before
 * anything is written, so the version a journey kept stays as it was. The
 * same day taken over twice keeps one version; a different one replaces it
 * only when asked to, and never touches an entry or a text of the journey.
 *
 * Whoever may edit the journey may keep their own recording in it; everyone
 * who can open the journey sees it on the map, which the preview says.
 */
@Injectable()
export class JourneyRecordingsService {
  constructor(
    private readonly journeys: JourneyDomainService,
    private readonly recordedDays: JourneyRecordedDaysService,
    private readonly tracks: DawarichTracksService,
    private readonly addons: AddonsService,
    private readonly prep: JourneyRecordingPrepService,
    private readonly dawarich: DawarichService,
  ) {}

  /** The days a journey keeps, for anyone who can open it. Needs no Dawarich. */
  async list(userId: number, journeyId: number): Promise<JourneyRecordedDay[]> {
    if (!(await this.journeys.canAccessJourney(journeyId, userId))) throw notFound('Journey not found');
    return await this.recordedDays.list(journeyId);
  }

  async preview(
    userId: number,
    journeyId: number,
    request: JourneyRecordingPreviewRequest,
  ): Promise<JourneyRecordingPreview> {
    const journey = await this.requireEditable(journeyId, userId);
    await this.requireDawarich();
    const day = await this.tracks.fetchDay(userId, request.date, {
      offsetMinutes: request.utcOffsetMinutes,
      useSourceOffset: request.useSourceOffset ?? false,
    });
    const contentHash = day.segments.length > 0 ? this.recordedDays.hashOf(day.segments, day.utcOffsetMinutes) : null;
    const stored = await this.recordedDays.find(journeyId, request.date);
    return {
      journey: { id: journey.id, title: journey.title },
      date: request.date,
      utcOffsetMinutes: day.utcOffsetMinutes,
      offsetSource: day.offsetSource,
      sourceOffsetMinutes: day.sourceOffsetMinutes,
      window: day.window,
      sourceKind: day.sourceKind,
      segments: day.segments,
      stats: recordingStats(day.segments),
      truncated: day.truncated,
      provisional: Date.parse(day.fetchedAt) < Date.parse(day.window.to),
      fetchedAt: day.fetchedAt,
      contentHash,
      stored,
      sameAsStored: stored !== null && stored.contentHash === contentHash,
      audience: await this.recordedDays.audience(journeyId, userId),
    };
  }

  async save(
    userId: number,
    journeyId: number,
    date: string,
    request: JourneyRecordingSaveRequest,
    socketId?: string,
  ): Promise<JourneyRecordingSaveResult> {
    await this.requireEditable(journeyId, userId);
    await this.requireDawarich();
    const day = await this.tracks.fetchDay(userId, date, {
      offsetMinutes: request.utcOffsetMinutes,
      useSourceOffset: false,
    });
    if (day.segments.length === 0) {
      throw new DomainError(422, 'Dawarich recorded nothing on that day', { details: { code: 'recording_empty' } });
    }
    const contentHash = this.recordedDays.hashOf(day.segments, day.utcOffsetMinutes);
    if (contentHash !== request.expectedHash) {
      throw conflict('The recording changed since the preview', { code: 'recording_changed' });
    }

    const stored = await this.recordedDays.find(journeyId, date);
    if (stored?.contentHash === contentHash) return { day: stored, outcome: 'unchanged' };
    if (stored && !request.replace) throw recordingExists();

    const kept = await this.recordedDays.keep(
      journeyId,
      userId,
      {
        date,
        sourceKind: day.sourceKind,
        utcOffsetMinutes: day.utcOffsetMinutes,
        window: day.window,
        segments: day.segments,
        truncated: day.truncated,
        fetchedAt: day.fetchedAt,
        contentHash,
      },
      request.replace === true,
    );
    // Another editor kept the day between the read above and this write.
    if (!kept) throw recordingExists();
    await this.journeys.broadcastJourneyEvent(journeyId, 'journey:recording:updated', { date }, socketId);
    return { day: kept, outcome: stored ? 'replaced' : 'created' };
  }

  /** Drops the day a journey keeps. Needs no Dawarich: a kept day stays removable once the connection is gone. */
  async remove(userId: number, journeyId: number, date: string, socketId?: string): Promise<void> {
    await this.requireEditable(journeyId, userId);
    if (!(await this.recordedDays.remove(journeyId, date))) throw notFound('No recording kept for that day');
    await this.journeys.broadcastJourneyEvent(journeyId, 'journey:recording:updated', { date }, socketId);
  }

  /**
   * Whether the journey prepares its recorded days (JRN-03) and how the
   * caller's own last runs over it went, with what their connection allows
   * and, while it is on, which linked trips those runs reach.
   * Only for those who may edit it: a reader has nothing of theirs prepared.
   */
  async prepStatus(userId: number, journeyId: number): Promise<JourneyRecordingPrep> {
    const journey = await this.requireEditable(journeyId, userId);
    await this.requireDawarich();
    const connection = await this.dawarich.getConnection(userId);
    const enabled = !!journey.auto_prepare_recordings;
    return {
      enabled,
      connection: !connection.connected ? 'not_connected' : connection.syncEnabled ? 'ready' : 'sync_off',
      ...(await this.prep.status(journeyId, userId)),
      ...(enabled ? { periods: await this.prep.periodsOf(journeyId, userId) } : {}),
    };
  }

  /** The journey, when the caller may edit it: 404 when they cannot open it, 403 when they only read it. */
  async requireEditable(journeyId: number, userId: number) {
    const journey = await this.journeys.canAccessJourney(journeyId, userId);
    if (!journey) throw notFound('Journey not found');
    if (!(await this.journeys.canEdit(journeyId, userId))) throw forbidden('Not allowed');
    return journey;
  }

  async requireDawarich(): Promise<void> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.DAWARICH))) {
      throw notFound('Dawarich is not enabled', { code: 'addon_disabled' });
    }
  }
}

function recordingExists(): DomainError {
  return conflict('The journey already keeps another recording of that day', { code: 'recording_exists' });
}
