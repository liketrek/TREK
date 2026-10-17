/**
 * The format rules of a plugin manifest (trek-plugin.json): the id, version and host
 * patterns, the allowed sets and the caps. `install/manifest.ts` enforces them, and
 * `scripts/gen-plugin-facts.ts` writes them into the SDK's `generated/host-facts.ts`,
 * so `trek-plugin validate` reads the very values an install does instead of a copy
 * that can drift (`check:plugin-facts` fails the build when the two differ).
 *
 * Pure data, no imports with runtime effect: the generator imports this file in a CI
 * job that installs only the server.
 */
import type { NotifEventType } from '../../notifications/notification-events';

/** A plugin id: lowercase slug, 3 to 40 characters. */
export const PLUGIN_ID_RE = /^[a-z][a-z0-9-]{2,39}$/;

/**
 * Static path segments under /api/admin/plugins: a plugin id must never shadow them
 * (id "registry" would collide with GET registry/:id vs :id/errors routing).
 */
export const RESERVED_PLUGIN_IDS = ['registry', 'install', 'rescan'] as const;

/** A plugin version: plain semver, an optional prerelease, no build metadata. */
export const PLUGIN_SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * 'trip-page' mounts the plugin's sandboxed UI as a tab inside every trip planner
 * (tripId-scoped), with no dashboard presence, unlike 'page' (dashboard nav).
 */
export const PLUGIN_TYPES = ['integration', 'page', 'widget', 'trip-page'] as const;

/**
 * Addon ids are lowercase slugs that may contain underscores (e.g. `llm_parsing`).
 * Validated format-only: existence is checked at activation.
 */
export const ADDON_ID_RE = /^[a-z][a-z0-9_]{1,39}$/;

/**
 * An outbound host: an exact hostname (single-label like a `redis` sibling service,
 * or a dotted FQDN) OR a `*.`-prefixed wildcard that MUST have a real multi-label
 * suffix. Rejects `*`, `*.`, whole-TLD `*.com`, schemes, and any embedded space, all
 * of which would otherwise widen egress or inject a CSP source token when the host is
 * interpolated into connect-src.
 */
export const EGRESS_HOST_RE = /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i;

/** Where a widget mounts: dashboard sidebar (default), hero bar, or a planner detail panel. */
export const WIDGET_SLOTS = ['sidebar', 'hero', 'place-detail', 'day-detail', 'reservation-detail'] as const;

/**
 * Core planner tabs a trip-page plugin may replace while it is active. 'plan' is
 * deliberately NOT in this list: a trip always keeps its planner view.
 */
export const REPLACEABLE_TABS = ['transports', 'buchungen', 'listen', 'finanzplan', 'dateien', 'collab'] as const;

/** The highest 0-based tab index a trip-page plugin may ask for. */
export const TRIP_PAGE_POSITION_MAX = 50;

/** Route profiles one plugin may declare, and the shape of their ids. */
export const ROUTE_PROFILES_MAX = 3;
export const ROUTE_PROFILE_ID_RE = /^[a-z][a-z0-9-]{0,23}$/;

/** Export function / event names exposed to other plugins (dots allowed, `rate.updated`). */
export const CAPABILITY_NAME_RE = /^[a-zA-Z][a-zA-Z0-9._-]{0,63}$/;

/** Tools one plugin may advertise. A long list crowds out the built-ins. */
export const MCP_TOOLS_MAX = 8;

/** Plugin-local tool name. No dot or dash, so the advertised name parses apart. */
export const TOOL_NAME_RE = /^[a-z0-9_]{1,48}$/;

/**
 * A settings field key. Constrained because the key is used as a JSON object key in
 * the plugin's stored config: an unconstrained one (`__proto__`, `constructor`)
 * resolves off Object.prototype on read, so a required field with such a name would
 * look "configured" for every user who had configured nothing.
 */
export const SETTING_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/;
export const RESERVED_SETTING_KEYS = ['constructor', 'prototype', '__proto__'] as const;

/**
 * Every attribute a settings-field object may carry: parseSettings reads exactly
 * these and silently drops anything else, so `trek-plugin validate` warns on any other.
 */
export const SETTING_FIELD_KEYS = [
  'key',
  'label',
  'input_type',
  'placeholder',
  'hint',
  'required',
  'secret',
  'scope',
  'options',
  'oauth',
  'default',
] as const;

/** Settings-page action buttons one plugin may declare. */
export const ACTIONS_MAX = 8;

/**
 * Events a plugin notification channel may carry. Two exclusions, both deliberate:
 * `version_available` is admin-scoped (it goes out over the admin's own global
 * credentials, and a community plugin is never a recipient of one), and
 * `synology_session_cleared` is in-app only.
 *
 * Spelled out rather than derived from the notification service, so the plugin
 * installer carries no runtime dependency on it; the type guard below keeps the two
 * in step.
 */
export const PLUGIN_CHANNEL_EVENTS = [
  'trip_invite',
  'booking_change',
  'trip_reminder',
  'todo_due',
  'vacay_invite',
  'collection_invite',
  'photos_shared',
  'collab_message',
  'packing_tagged',
  'plugin_notification',
] as const;

// Compile-time guard: every id above must still be a real notification event.
// If one is renamed or dropped, this stops compiling.
type ChannelEventsAreReal = (typeof PLUGIN_CHANNEL_EVENTS)[number] extends NotifEventType ? true : never;
const channelEventDriftGuard: ChannelEventsAreReal = true;
void channelEventDriftGuard;
