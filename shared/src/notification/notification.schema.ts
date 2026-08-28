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
// server/token are nullable: the client deliberately sends null to mean
// "fall back to the saved value" (a stored token is only masked in the
// placeholder — sending null keeps the saved one).
export const testNtfyRequestSchema = z.object({
  topic: z.string().optional(),
  server: z.string().nullable().optional(),
  token: z.string().nullable().optional(),
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

// ── Direct Web Push ────────────────────────────────────────────────────────

const webPushKeySchema = z
  .string()
  .min(8)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/);

export const webPushSubscriptionSchema = z.object({
  endpoint: z
    .url()
    .max(4096)
    .refine((value) => value.startsWith('https://'), 'Web Push endpoints must use HTTPS'),
  expirationTime: z.number().nonnegative().nullable().optional(),
  keys: z.object({
    p256dh: webPushKeySchema,
    auth: webPushKeySchema,
  }),
});
export type WebPushSubscription = z.infer<typeof webPushSubscriptionSchema>;

export const webPushCurrentRequestSchema = z.object({
  intent: z.enum(['enable', 'reconcile']),
  installationId: z.uuid(),
  label: z.string().trim().min(1).max(80),
  subscription: webPushSubscriptionSchema,
});
export type WebPushCurrentRequest = z.infer<typeof webPushCurrentRequestSchema>;

export const webPushDeviceSchema = z.object({
  id: z.number().int().positive(),
  installationId: z.uuid(),
  label: z.string().min(1).max(80),
  createdAt: z.string().datetime({ offset: true }),
  lastSeenAt: z.string().datetime({ offset: true }),
  lastSuccessAt: z.string().datetime({ offset: true }).nullable(),
});
export type WebPushDevice = z.infer<typeof webPushDeviceSchema>;

export const webPushDeviceListResultSchema = z.object({ devices: z.array(webPushDeviceSchema) });
export type WebPushDeviceListResult = z.infer<typeof webPushDeviceListResultSchema>;

export const webPushRenameRequestSchema = z.object({ label: z.string().trim().min(1).max(80) });
export type WebPushRenameRequest = z.infer<typeof webPushRenameRequestSchema>;

export const webPushCurrentResultSchema = z.object({
  state: z.enum(['active', 'revoked', 'suspended', 'unavailable']),
  device: webPushDeviceSchema.optional(),
  error: z.string().optional(),
});
export type WebPushCurrentResult = z.infer<typeof webPushCurrentResultSchema>;

export const webPushConfigResultSchema = z.object({
  enabled: z.boolean(),
  available: z.boolean(),
  publicKey: z.string().min(1).optional(),
  canonicalOrigin: z.url().optional(),
  maxDevices: z.number().int().positive(),
  error: z.string().optional(),
});
export type WebPushConfigResult = z.infer<typeof webPushConfigResultSchema>;
