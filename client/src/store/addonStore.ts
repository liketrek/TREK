import { create } from 'zustand'
import { addonsApi } from '../api/client'

interface Addon {
  id: string
  name: string
  description?: string
  type: string
  icon: string
  enabled: boolean
  config?: Record<string, unknown>
  fields?: Array<{
    key: string
    label: string
    input_type: string
    placeholder?: string | null
    required: boolean
    secret: boolean
    settings_key?: string | null
    payload_key?: string | null
    sort_order: number
  }>
}

interface AddonState {
  addons: Addon[]
  bagTracking: boolean
  loaded: boolean
  loadAddons: () => Promise<void>
  isEnabled: (id: string) => boolean
}

export const useAddonStore = create<AddonState>((set, get) => ({
  addons: [],
  bagTracking: false,
  loaded: false,

  loadAddons: async () => {
    try {
      const data = await addonsApi.enabled()
      set({ addons: data.addons || [], bagTracking: !!data.bagTracking, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  isEnabled: (id: string) => {
    if (id === 'memories') {
      return get().addons.some(a => a.type === 'photo_provider' && a.enabled)
    }
    return get().addons.some(a => a.id === id && a.enabled)
  },
}))
