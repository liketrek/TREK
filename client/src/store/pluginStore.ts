import { create } from 'zustand'
import { pluginsApi } from '../api/client'

const PLUGIN_SESSION_NAMESPACE = 'trek:plugin-session:'

/**
 * Purges state for plugins absent from a successful active-plugin response.
 * A failed request never calls this, because plugin status is then unknown.
 */
function clearInactivePluginSessions(activePluginIds: Set<string>) {
  const keysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const storageKey = sessionStorage.key(i)
    if (!storageKey?.startsWith(PLUGIN_SESSION_NAMESPACE)) continue
    const encodedPluginId = storageKey.slice(PLUGIN_SESSION_NAMESPACE.length).split(':')[1]
    if (encodedPluginId === undefined) continue
    try {
      if (!activePluginIds.has(decodeURIComponent(encodedPluginId))) keysToRemove.push(storageKey)
    } catch {
      // Ignore malformed keys outside the host-owned format.
    }
  }
  keysToRemove.forEach((storageKey) => sessionStorage.removeItem(storageKey))
}

/**
 * Drops every plugin's session state, whatever user or trip it belonged to.
 * Logout calls this so the next user on a shared browser starts clean — the
 * same reason the appearance snapshot and the user-scoped offline DB go.
 */
export function clearAllPluginSessions() {
  const keysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const storageKey = sessionStorage.key(i)
    if (storageKey?.startsWith(PLUGIN_SESSION_NAMESPACE)) keysToRemove.push(storageKey)
  }
  keysToRemove.forEach((storageKey) => sessionStorage.removeItem(storageKey))
}

/**
 * Active plugins the client renders (#plugins, M3). Page plugins become nav
 * entries + a full-page iframe route; widget plugins mount on the dashboard.
 * Cloned from addonStore — plugins have their own feed and lifecycle, so they
 * don't overload the addon store.
 */
export interface ActivePlugin {
  id: string
  name: string
  type: 'integration' | 'page' | 'widget' | 'trip-page'
  icon: string | null
  slot?: 'sidebar' | 'hero' | 'place-detail' | 'day-detail' | 'reservation-detail'
  /** How a trip-page plugin sits in the planner tab bar: which core tabs it
   * replaces while active ('plan' never — enforced server-side) and its
   * preferred 0-based tab index. */
  tripPage?: { replaces?: string[]; position?: number }
  /** The plugin ships a settings.html the user-settings page frames. */
  settingsUi?: true
  /** Routing profiles the planner's route toggle offers (routeProvider hook;
   * the server only sends these when the hook permission is granted). */
  routeProfiles?: Array<{ id: string; label: string; icon?: string }>
  /** The plugin holds the geolocation:read grant — its frames may ask the host
   * for the browser position over the bridge. */
  geolocation?: true
}

interface PluginState {
  plugins: ActivePlugin[]
  loaded: boolean
  loadPlugins: () => Promise<void>
  getById: (id: string) => ActivePlugin | undefined
  pages: () => ActivePlugin[]
  widgets: () => ActivePlugin[]
  heroWidgets: () => ActivePlugin[]
  tripPages: () => ActivePlugin[]
  placeDetailWidgets: () => ActivePlugin[]
  routeProviders: () => ActivePlugin[]
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  loaded: false,

  loadPlugins: async () => {
    try {
      const data = await pluginsApi.active()
      const plugins = (data.plugins as ActivePlugin[]) || []
      set({ plugins, loaded: true })
      // After the state is committed: a sessionStorage failure (Safari private
      // mode, quota) must not cost us the plugin list we just fetched.
      try {
        clearInactivePluginSessions(new Set(plugins.map((plugin) => plugin.id)))
      } catch { /* leaving stale plugin state behind beats losing the nav entries */ }
    } catch {
      set({ loaded: true })
    }
  },

  getById: (id) => get().plugins.find((p) => p.id === id),
  pages: () => get().plugins.filter((p) => p.type === 'page'),
  widgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot !== 'hero' && p.slot !== 'place-detail' && p.slot !== 'day-detail' && p.slot !== 'reservation-detail'),
  heroWidgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot === 'hero'),
  tripPages: () => get().plugins.filter((p) => p.type === 'trip-page'),
  placeDetailWidgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot === 'place-detail'),
  routeProviders: () => get().plugins.filter((p) => !!p.routeProfiles?.length),
}))
