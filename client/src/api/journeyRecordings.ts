import type {
  JourneyDayImportRequest,
  JourneyDayImportResult,
  JourneyDayStays,
  JourneyRecordedDaysResponse,
  JourneyRecordingPrep,
  JourneyRecordingPreview,
  JourneyRecordingPreviewRequest,
  JourneyRecordingSaveRequest,
  JourneyRecordingSaveResult,
} from '@trek/shared';
import apiClient from './client';
import { DAWARICH_UPSTREAM_TIMEOUT_MS } from './dawarich';

const base = (journeyId: number) => `/journeys/${journeyId}/recordings`;

/** The preview and the save ask Dawarich first, so they get its longer wait. */
const upstream = { timeout: DAWARICH_UPSTREAM_TIMEOUT_MS };

/**
 * JRN-01: the recorded days a journey keeps, previewing one, keeping it and dropping it.
 * JRN-02: the stays of a day reviewed and taken over as drafts.
 * JRN-03: how the journey prepares its days for the caller.
 */
export const journeyRecordingsApi = {
  list: (journeyId: number, signal?: AbortSignal): Promise<JourneyRecordedDaysResponse> =>
    apiClient.get(base(journeyId), { signal }).then((r) => r.data),
  prep: (journeyId: number, signal?: AbortSignal): Promise<JourneyRecordingPrep> =>
    apiClient.get(`${base(journeyId)}/prep`, { signal }).then((r) => r.data),
  preview: (
    journeyId: number,
    body: JourneyRecordingPreviewRequest,
    signal?: AbortSignal
  ): Promise<JourneyRecordingPreview> =>
    apiClient.post(`${base(journeyId)}/preview`, body, { ...upstream, signal }).then((r) => r.data),
  save: (journeyId: number, date: string, body: JourneyRecordingSaveRequest): Promise<JourneyRecordingSaveResult> =>
    apiClient.put(`${base(journeyId)}/${date}`, body, upstream).then((r) => r.data),
  remove: (journeyId: number, date: string): Promise<void> =>
    apiClient.delete(`${base(journeyId)}/${date}`).then(() => undefined),
  reviewDay: (journeyId: number, date: string, signal?: AbortSignal): Promise<JourneyDayStays> =>
    apiClient.post(`${base(journeyId)}/${date}/stays/review`, {}, { ...upstream, signal }).then((r) => r.data),
  takeOverDay: (journeyId: number, date: string, body: JourneyDayImportRequest): Promise<JourneyDayImportResult> =>
    apiClient.post(`${base(journeyId)}/${date}/stays/import`, body).then((r) => r.data),
};
