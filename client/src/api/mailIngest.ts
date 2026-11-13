import apiClient from './client';

/**
 * The booking mail import (server nest/mail-ingest): the person's settings and
 * forwarding address, the inbox of bookings read from forwarded mails, and the
 * actions on them. Answers come back unparsed; store/mailIngestStore.ts checks
 * them against the shared contracts. apiClient puts an idempotency key on every
 * write, so a request sent again on a flaky connection acts once.
 */
const data = (response: { data: unknown }) => response.data;

export type MailIngestAction = 'apply' | 'move' | 'file' | 'undo' | 'discard' | 'read-ai';

export const mailIngestApi = {
  settings: (): Promise<unknown> => apiClient.get('/mail-ingest/settings').then(data),
  updateSettings: (body: { enabled?: boolean; ai_enabled?: boolean; auto_add?: boolean }): Promise<unknown> =>
    apiClient.patch('/mail-ingest/settings', body).then(data),
  renewAddress: (): Promise<unknown> => apiClient.post('/mail-ingest/address/renew', {}).then(data),

  tripAddress: (tripId: number): Promise<unknown> => apiClient.get(`/trips/${tripId}/mail-ingest/address`).then(data),
  createTripAddress: (tripId: number): Promise<unknown> =>
    apiClient.post(`/trips/${tripId}/mail-ingest/address`, {}).then(data),

  inbox: (params: { status?: 'open' | 'resolved'; before?: number; limit?: number }): Promise<unknown> =>
    apiClient.get('/mail-ingest/inbox', { params }).then(data),
  inboxCount: (): Promise<unknown> => apiClient.get('/mail-ingest/inbox/count').then(data),
  preview: (messageId: number): Promise<unknown> =>
    apiClient.get(`/mail-ingest/messages/${messageId}/preview`).then(data),
  prefill: (candidateId: number): Promise<unknown> =>
    apiClient.get(`/mail-ingest/candidates/${candidateId}/prefill`).then(data),

  act: (candidateId: number, action: MailIngestAction, body: Record<string, unknown> = {}): Promise<unknown> =>
    apiClient.post(`/mail-ingest/candidates/${candidateId}/${action}`, body).then(data),

  review: (tripId: number, reservationId: number, fields?: string[]): Promise<unknown> =>
    apiClient.post(`/trips/${tripId}/reservations/${reservationId}/mail-review`, fields ? { fields } : {}).then(data),

  upload: (file: File): Promise<unknown> => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/mail-ingest/upload', form).then(data);
  },
};
