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

// ── Web Push (#894) ──────────────────────────────────────────────────────────

/** Id of the built-in Web Push channel in the preference matrix and the admin CSV. */
export const WEB_PUSH_CHANNEL_ID = 'push';

/**
 * The longest push endpoint the server takes, well above what the push
 * services hand out. One value for the contract and the server's own endpoint
 * check, so a device that can register can always unsubscribe and be sent to.
 */
export const MAX_PUSH_ENDPOINT_LENGTH = 2048;

/**
 * The browser's PushSubscription as PushSubscription.toJSON() hands it over.
 * Only the shape is checked here; the service refuses an endpoint that is not
 * https on a known push service and keys that do not decode to the RFC 8291
 * sizes, with messages of its own.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().min(1).max(MAX_PUSH_ENDPOINT_LENGTH),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

/** Register this device for push; repeating it for the same endpoint only refreshes the row. */
export const pushSubscribeRequestSchema = z.object({
  subscription: pushSubscriptionSchema,
});
export type PushSubscribeRequest = z.infer<typeof pushSubscribeRequestSchema>;

/** Forget one device (logout, or the user switching push off there). */
export const pushUnsubscribeRequestSchema = z.object({
  endpoint: z.string().min(1).max(MAX_PUSH_ENDPOINT_LENGTH),
});
export type PushUnsubscribeRequest = z.infer<typeof pushUnsubscribeRequestSchema>;

/** The VAPID public key a browser subscribes with (base64url, uncompressed P-256 point). */
export const pushPublicKeyResultSchema = z.object({
  publicKey: z.string(),
});
export type PushPublicKeyResult = z.infer<typeof pushPublicKeyResultSchema>;

export const pushSubscribeResultSchema = z.object({
  success: z.literal(true),
  /** How many devices this account now receives push on. */
  devices: z.number(),
});
export type PushSubscribeResult = z.infer<typeof pushSubscribeResultSchema>;

/** Forgetting a device always succeeds, also for an endpoint the server no longer knows. */
export const pushUnsubscribeResultSchema = z.object({
  success: z.literal(true),
});
export type PushUnsubscribeResult = z.infer<typeof pushUnsubscribeResultSchema>;

/**
 * What the service worker receives. Title and body are rendered on the server
 * in the recipient's language, because the worker has no translations; `url` is
 * a same-origin path the click opens.
 */
export const pushPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),
  tag: z.string().optional(),
});
export type PushPayload = z.infer<typeof pushPayloadSchema>;
