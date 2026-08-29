import type { ExternalChannel } from './notification-events';

/**
 * The live set of notification channels.
 *
 * Deliberately a module singleton and not a provider: PluginRuntimeService
 * pushes its channel getter in at onModuleInit, and every
 * separately-constructed NotificationsService (the no-Nest test harnesses;
 * CHOVR-015 pins this) must see it. Make this a provider and such an instance
 * gets a second, empty registry - plugin channels would then go quiet with no
 * error anywhere. The built-ins are registered from NotificationsService's
 * constructor, so every path that can dispatch has them. (The last production
 * out-of-container consumer, notifications.instance.ts, died with the bridge
 * fold - a provider registry is thinkable now, but the harnesses still hang
 * off the module scope.)
 */

/** Namespace for plugin channel ids, so a plugin can never claim `email`. */
export const PLUGIN_CHANNEL_PREFIX = 'plugin:';

export function pluginChannelId(pluginId: string): string {
  return `${PLUGIN_CHANNEL_PREFIX}${pluginId}`;
}

export function isPluginChannelId(id: string): boolean {
  return id.startsWith(PLUGIN_CHANNEL_PREFIX);
}

// ── Registry ───────────────────────────────────────────────────────────────

const builtins = new Map<string, ExternalChannel>();

/** Register a built-in channel. Called at import of ./builtins. */
export function registerChannel(channel: ExternalChannel): void {
  // The `plugin:` namespace belongs to plugins; a built-in claiming it would make
  // getChannel() resolve inconsistently (it routes namespaced ids past this map).
  if (isPluginChannelId(channel.id))
    throw new Error(`built-in channel cannot claim the plugin namespace: ${channel.id}`);
  builtins.set(channel.id, channel);
}

/**
 * Plugin channels cross a trust boundary, so re-establish their invariants HERE
 * rather than trusting whoever produced them.
 *
 * The runtime mints ids with pluginChannelId() and leaves the built-in-only privileges
 * off — but nothing structural stopped a bug (or a future caller) from handing us a
 * channel that claims `email`. Such a channel would be dispatched to off the user's
 * EMAIL opt-in, without them ever enabling a plugin channel, and — because
 * isAdminGlobalChannel('email') is true — would also receive admin-scoped events and
 * the admin-global copy. Same reasoning as providersOf()/invokeHook re-checking the
 * hook grant host-side even though the child reports its own hooks.
 */
function sanitizePluginChannels(raw: readonly ExternalChannel[]): ExternalChannel[] {
  const out: ExternalChannel[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    if (!c || typeof c.id !== 'string') continue;
    if (!isPluginChannelId(c.id)) continue; // must be namespaced …
    if (builtins.has(c.id)) continue; // … and can never shadow a built-in
    if (seen.has(c.id)) continue; // no duplicate columns / double sends
    seen.add(c.id);
    out.push({
      id: c.id,
      source: 'plugin',
      label: c.label,
      settingsPath: c.settingsPath,
      // Built-in-only privileges, stripped unconditionally. A plugin channel is
      // user-scoped: it never bypasses the admin's channel toggle, and never carries an
      // admin-scoped or admin-global notification. (With these off, notificationService
      // refuses it an ADMIN_SCOPED_EVENT and the admin-global loop skips it — so this
      // holds even if the channel lies in supportsEvent().)
      bypassesActiveToggleForAdminEvents: false,
      supportsAdminGlobal: false,
      // Bound, so a producer that used a class keeps its `this`.
      supportsEvent: (e) => c.supportsEvent(e),
      isConfiguredFor: (u) => c.isConfiguredFor(u),
      sendToUser: (u, m) => c.sendToUser(u, m),
      ...(c.isInstanceConfigured ? { isInstanceConfigured: () => c.isInstanceConfigured!() } : {}),
      ...(c.test ? { test: (u: number, o?: Record<string, unknown>) => c.test!(u, o) } : {}),
      // NB: sendGlobal is deliberately NOT carried over.
    });
  }
  return out;
}

// Plugin channels are supplied by the plugin runtime, which lives in the Nest
// graph and cannot be imported from a plain service. Same seam as
// setPluginEventSink() in plugin-runtime.service.ts: the runtime pushes a getter
// in at onModuleInit, and we pull from it on every read so a plugin that is
// disabled or uninstalled simply stops appearing.
let pluginChannelSource: (() => ExternalChannel[]) | null = null;

export function setPluginChannelSource(source: (() => ExternalChannel[]) | null): void {
  pluginChannelSource = source;
}

/** Every channel that currently exists: built-ins plus live, sanitized plugin channels. */
export function listChannels(): ExternalChannel[] {
  const plugins = (() => {
    try {
      return pluginChannelSource?.() ?? [];
    } catch {
      // A broken plugin runtime must never take notifications down with it.
      return [];
    }
  })();
  // Built-ins first, and they always win: a plugin channel can only ever be an
  // addition, never an override.
  return [...builtins.values(), ...sanitizePluginChannels(plugins)];
}

export function getChannel(id: string): ExternalChannel | undefined {
  if (isPluginChannelId(id)) return listChannels().find((c) => c.id === id);
  return builtins.get(id);
}

/** Test seam — drops registered built-ins. */
export function __resetChannelsForTest(): void {
  builtins.clear();
  pluginChannelSource = null;
}
