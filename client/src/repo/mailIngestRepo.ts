import {
  mailIngestAddressResponseSchema,
  mailIngestAdminStatusResponseSchema,
  mailIngestAdminTestResponseSchema,
  mailIngestCandidateResponseSchema,
  mailIngestInboxCountResponseSchema,
  mailIngestInboxResponseSchema,
  mailIngestMessagePreviewResponseSchema,
  mailIngestPrefillResponseSchema,
  mailIngestSettingsResponseSchema,
  mailIngestUploadResponseSchema,
} from '@trek/shared';
import { mailIngestApi, type MailIngestAction } from '../api/mailIngest';
import { requireOnline } from './onlineOnly';

/**
 * The booking mail import: the person's settings and forwarding addresses,
 * the inbox of bookings read from forwarded mails, the actions on them, and
 * the admin's transport settings and status.
 *
 * **Deliberately online-only, and no Dexie table.** Every action asks the
 * server to decide (which trip, whether it is a duplicate, whether the mail
 * may still be undone), so there is nothing an offline copy could do.
 * Answers are parsed against the shared contracts rather than cast, so a
 * server that answered something else fails here, naming the field.
 */
export const mailIngestRepo = {
  async settings() {
    requireOnline();
    return mailIngestSettingsResponseSchema.parse(await mailIngestApi.settings());
  },

  async updateSettings(body: { enabled?: boolean; ai_enabled?: boolean; auto_add?: boolean }) {
    requireOnline();
    return mailIngestSettingsResponseSchema.parse(await mailIngestApi.updateSettings(body));
  },

  async renewAddress() {
    requireOnline();
    return mailIngestAddressResponseSchema.parse(await mailIngestApi.renewAddress());
  },

  async tripAddress(tripId: number) {
    requireOnline();
    return mailIngestAddressResponseSchema.parse(await mailIngestApi.tripAddress(tripId)).address;
  },

  async createTripAddress(tripId: number) {
    requireOnline();
    return mailIngestAddressResponseSchema.parse(await mailIngestApi.createTripAddress(tripId)).address;
  },

  async inbox(before?: number) {
    requireOnline();
    return mailIngestInboxResponseSchema.parse(await mailIngestApi.inbox({ status: 'open', before }));
  },

  async inboxCount() {
    requireOnline();
    return mailIngestInboxCountResponseSchema.parse(await mailIngestApi.inboxCount()).pending;
  },

  async preview(messageId: number) {
    requireOnline();
    return mailIngestMessagePreviewResponseSchema.parse(await mailIngestApi.preview(messageId));
  },

  async prefill(candidateId: number) {
    requireOnline();
    return mailIngestPrefillResponseSchema.parse(await mailIngestApi.prefill(candidateId));
  },

  async act(candidateId: number, action: MailIngestAction, body: Record<string, unknown> = {}) {
    requireOnline();
    return mailIngestCandidateResponseSchema.parse(await mailIngestApi.act(candidateId, action, body)).candidate;
  },

  async upload(file: File) {
    requireOnline();
    return mailIngestUploadResponseSchema.parse(await mailIngestApi.upload(file));
  },

  async adminStatus() {
    requireOnline();
    return mailIngestAdminStatusResponseSchema.parse(await mailIngestApi.adminStatus());
  },

  async adminTest() {
    requireOnline();
    return mailIngestAdminTestResponseSchema.parse(await mailIngestApi.adminTest());
  },

  /** The admin's stored app settings (passwords masked), of which the mail form reads its own keys. */
  async adminSettings(): Promise<Record<string, unknown>> {
    requireOnline();
    const raw = await mailIngestApi.adminSettings();
    return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  },

  async saveAdminSettings(patch: Record<string, string | boolean>) {
    requireOnline();
    await mailIngestApi.saveAdminSettings(patch);
  },
};
