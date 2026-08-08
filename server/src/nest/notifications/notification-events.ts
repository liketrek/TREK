import type { NotificationEventKey } from '@trek/shared/i18n/externalNotifications';

/**
 * The notification vocabulary: event names, channel ids, and the contract a
 * channel implements. No database, no DI, and — deliberately — no imports from
 * anywhere else in the domain.
 *
 * This module exists to keep the notification cluster a DAG. The preferences
 * service, the channel registry and the transports all need these names, and
 * before they lived here the cluster was only acyclic because two of those
 * edges happened to be `import type` and compiled away. The first person to put
 * `NotifEventType` or `ALL_EVENT_TYPES` in a value position would have turned
 * that into a real runtime cycle, with the built-in channels as a third ring.
 */

// ── Channels ───────────────────────────────────────────────────────────────

/**
 * A channel id. Open by design: the built-ins plus `plugin:<id>` for any plugin
 * implementing the `notificationChannel` hook. The DB column is a bare TEXT with
 * no CHECK constraint and the Zod contract is already a string record, so the set
 * was only ever closed in TypeScript.
 */
export type NotifChannel = string;

export const INAPP_CHANNEL = 'inapp';

// ── Events ─────────────────────────────────────────────────────────────────

export type NotifEventType =
  | 'trip_invite'
  | 'booking_change'
  | 'trip_reminder'
  | 'todo_due'
  | 'vacay_invite'
  | 'vacay_share'
  | 'collection_invite'
  | 'photos_shared'
  | 'collab_message'
  | 'packing_tagged'
  | 'version_available'
  | 'synology_session_cleared'
  | 'plugin_notification';

/** Every event, in the order the preferences UI lists them. */
export const ALL_EVENT_TYPES: NotifEventType[] = [
  'trip_invite',
  'booking_change',
  'trip_reminder',
  'todo_due',
  'vacay_invite',
  'vacay_share',
  'collection_invite',
  'photos_shared',
  'collab_message',
  'packing_tagged',
  'version_available',
  'synology_session_cleared',
  'plugin_notification',
];

/** Events that target admins only (shown in admin panel, not in user settings). */
export const ADMIN_SCOPED_EVENTS = new Set<NotifEventType>(['version_available']);

// Compile-time guard: shared NotificationEventKey and server NotifEventType must
// stay in sync. It sits next to the union it guards — it used to live in the
// transports module, three files away from the type it was protecting.
type _EvtFwd = NotifEventType extends NotificationEventKey ? true : never;
type _EvtBwd = NotificationEventKey extends NotifEventType ? true : never;
const _eventKeyDriftGuard: [_EvtFwd, _EvtBwd] = [true, true];
void _eventKeyDriftGuard;

/**
 * Channels whose admin-scoped preference is global (app_settings) rather than
 * per-user. Built-ins only: plugin channels are user-scoped and never carry
 * admin-scoped events.
 */
const ADMIN_GLOBAL_CHANNELS = ['email', 'webhook', 'ntfy'] as const;
export type AdminGlobalChannel = (typeof ADMIN_GLOBAL_CHANNELS)[number];

export function isAdminGlobalChannel(channel: string): channel is AdminGlobalChannel {
  return (ADMIN_GLOBAL_CHANNELS as readonly string[]).includes(channel);
}

// ── The channel contract ───────────────────────────────────────────────────
//
// A channel is anything that delivers a *rendered* notification out of TREK:
// email, webhook, ntfy, and any plugin that implements the `notificationChannel`
// hook. In-app is deliberately NOT a channel — it writes typed rows with
// scope/target/callback payloads rather than a title+body, so it keeps its own
// path in NotificationsService.send(). The split mirrors the one shared/ already
// draws in i18n/<locale>/externalNotifications.ts.
//
// Channels are declarative: they say what they support and whether a given user
// has credentials, and they send. They do NOT consult preferences — the admin
// toggle (`notification_channels`) and the per-user event opt-outs are applied by
// the dispatch loop.

/** A notification already rendered into the recipient's language. */
export interface ChannelMessage {
  event: NotifEventType;
  title: string;
  body: string;
  /** Relative navigate target (e.g. `/trips/12`) — what the email CTA builder takes. */
  navigateTarget?: string;
  /** Absolute link (appUrl + navigateTarget) — what webhook/ntfy/plugin payloads carry. */
  url?: string;
  tripName?: string;
}

export interface ExternalChannel {
  readonly id: string;
  readonly source: 'builtin' | 'plugin';
  /** Built-ins: an i18n key the client resolves. */
  readonly labelKey?: string;
  /** Plugin channels: a literal display name (the host has no i18n for it). */
  readonly label?: string;
  /** Where the user configures their credentials, if anywhere. */
  readonly settingsPath?: string;
  /**
   * Admin-scoped events (`version_available`) bypass the `notification_channels`
   * toggle for this channel and are gated by the admin global pref instead.
   * Only email does this today; preserved verbatim from the pre-registry dispatch.
   */
  readonly bypassesActiveToggleForAdminEvents?: boolean;
  /** Delivers the one admin-scoped global copy (not per-recipient). */
  readonly supportsAdminGlobal?: boolean;

  supportsEvent(event: NotifEventType): boolean;
  /**
   * Instance-level readiness, independent of any one recipient (email: is SMTP set
   * up at all?). Absent means "always ready".
   */
  isInstanceConfigured?(): boolean;
  /** Does this recipient have credentials for this channel? */
  isConfiguredFor(userId: number): boolean;
  sendToUser(userId: number, msg: ChannelMessage): Promise<unknown>;
  sendGlobal?(msg: ChannelMessage): Promise<unknown>;
  test?(userId: number, override?: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
}

/** One channel column in the preferences matrix. */
export interface ChannelDescriptor {
  id: string;
  source: 'builtin' | 'plugin';
  /** Built-ins: an i18n key. */
  labelKey?: string;
  /** Plugin channels: a literal display name. */
  label?: string;
  /** Where the user sets their credentials for this channel, if anywhere. */
  settingsPath?: string;
  /** The admin has enabled this channel (in-app is always on). */
  active: boolean;
  /** This user has credentials for it. */
  configured: boolean;
}
