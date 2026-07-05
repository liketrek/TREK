import { create } from 'zustand'
import { pluginsApi } from '../api/client'

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
  slot?: 'sidebar' | 'hero' | 'place-detail'
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
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  loaded: false,

  loadPlugins: async () => {
    try {
      const data = await pluginsApi.active()
      set({ plugins: (data.plugins as ActivePlugin[]) || [], loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  getById: (id) => get().plugins.find((p) => p.id === id),
  pages: () => get().plugins.filter((p) => p.type === 'page'),
  widgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot !== 'hero' && p.slot !== 'place-detail'),
  heroWidgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot === 'hero'),
  tripPages: () => get().plugins.filter((p) => p.type === 'trip-page'),
  placeDetailWidgets: () => get().plugins.filter((p) => p.type === 'widget' && p.slot === 'place-detail'),
}))
