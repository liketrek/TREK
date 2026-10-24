import {
  journeyDayImportResultSchema,
  journeyDayStaysSchema,
  journeyRecordedDaysResponseSchema,
  journeyRecordingPrepSchema,
  journeyRecordingPreviewSchema,
  journeyRecordingSaveResultSchema,
  type JourneyDayImportRequest,
  type JourneyDayImportResult,
  type JourneyDayStays,
  type JourneyRecordedDay,
  type JourneyRecordingPrep,
  type JourneyRecordingPreview,
  type JourneyRecordingPreviewRequest,
  type JourneyRecordingSaveRequest,
  type JourneyRecordingSaveResult,
} from '@trek/shared';
import { journeyRecordingsApi } from '../api/journeyRecordings';
import { requireOnline } from './onlineOnly';

/**
 * JRN-01, online only on purpose, like the journey itself: the days a journey
 * keeps are read when it is open, and taking one over asks Dawarich, which
 * needs the network anyway. Answers are parsed against the shared contract,
 * so a server that answered something else fails here and not on the map.
 */
export const journeyRecordingsRepo = {
  async list(journeyId: number, signal?: AbortSignal): Promise<JourneyRecordedDay[]> {
    requireOnline();
    return journeyRecordedDaysResponseSchema.parse(await journeyRecordingsApi.list(journeyId, signal)).days;
  },

  /** JRN-03: whether the journey prepares its days and how the caller's last runs over it went. */
  async prep(journeyId: number, signal?: AbortSignal): Promise<JourneyRecordingPrep> {
    requireOnline();
    return journeyRecordingPrepSchema.parse(await journeyRecordingsApi.prep(journeyId, signal));
  },

  async preview(
    journeyId: number,
    body: JourneyRecordingPreviewRequest,
    signal?: AbortSignal
  ): Promise<JourneyRecordingPreview> {
    requireOnline();
    return journeyRecordingPreviewSchema.parse(await journeyRecordingsApi.preview(journeyId, body, signal));
  },

  async save(journeyId: number, date: string, body: JourneyRecordingSaveRequest): Promise<JourneyRecordingSaveResult> {
    requireOnline();
    return journeyRecordingSaveResultSchema.parse(await journeyRecordingsApi.save(journeyId, date, body));
  },

  async remove(journeyId: number, date: string): Promise<void> {
    requireOnline();
    await journeyRecordingsApi.remove(journeyId, date);
  },

  /** JRN-02: the caller's stays of a day as the journey would take them over, read from Dawarich first. */
  async reviewDay(journeyId: number, date: string, signal?: AbortSignal): Promise<JourneyDayStays> {
    requireOnline();
    return journeyDayStaysSchema.parse(await journeyRecordingsApi.reviewDay(journeyId, date, signal));
  },

  async takeOverDay(journeyId: number, date: string, body: JourneyDayImportRequest): Promise<JourneyDayImportResult> {
    requireOnline();
    return journeyDayImportResultSchema.parse(await journeyRecordingsApi.takeOverDay(journeyId, date, body));
  },
};
