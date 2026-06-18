import { z } from 'zod';

/**
 * Notification API contract — single source of truth for the /api/notifications
 * endpoints (channel-preference matrix, channel test pings, and in-app
 * notifications).
 *
 * The notification row and the preferences matrix are wide, DB- and
 * registry-derived shapes; the response schemas keep them as open records and
 * pin the stable envelope fields, while the request schemas and the bespoke
 * 400/403/404 controller messages capture the parts the client depends on.
 * Real-time delivery happens over the existing WebSocket path inside the
 * services and is untouched by this contract.
 */

/** Channel preference matrix update: { eventType: { channel: enabled } }. */
export const preferencesUpdateRequestSchema = z.record(z.string(), z.record(z.string(), z.boolean()));
export type PreferencesUpdateRequest = z.infer<typeof preferencesUpdateRequestSchema>;

export const testSmtpRequestSchema = z.object({ email: z.string().optional() });
export const testWebhookRequestSchema = z.object({
  url: z.string().optional(),
});
export const testNtfyRequestSchema = z.object({
  topic: z.string().optional(),
  server: z.string().optional(),
  token: z.string().optional(),
});

/** Result of a channel test ping. */
export const channelTestResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type ChannelTestResult = z.infer<typeof channelTestResultSchema>;

/** Respond to a boolean (yes/no) notification. */
export const notificationRespondRequestSchema = z.object({
  response: z.enum(['positive', 'negative']),
});
export type NotificationRespondRequest = z.infer<typeof notificationRespondRequestSchema>;

/** A single in-app notification row (DB-shaped; kept open). */
export const notificationRowSchema = z.record(z.string(), z.unknown());

export const inAppListResultSchema = z.object({
  notifications: z.array(notificationRowSchema),
  total: z.number(),
  unread_count: z.number(),
});
export type InAppListResult = z.infer<typeof inAppListResultSchema>;

export const unreadCountResultSchema = z.object({ count: z.number() });
export type UnreadCountResult = z.infer<typeof unreadCountResultSchema>;
