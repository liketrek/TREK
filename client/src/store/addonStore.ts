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

/** The parts of the collab addon the admin can switch off inside it, instance-wide. */
export interface CollabFeatures {
  chat: boolean
  notes: boolean
  links: boolean
  polls: boolean
  whatsnext: boolean
}

const ALL_COLLAB_FEATURES: CollabFeatures = { chat: true, notes: true, links: true, polls: true, whatsnext: true }

/**
 * The Tours options the admin chose, whatever the instance Tours switch says: a
 * trip may switch Tours on for itself, and its planner offers them there.
 */
interface ToursOptions {
  wanderer: boolean
  hikingMap: boolean
  cycleMap: boolean
}

interface AddonState {
  addons: Addon[]
  bagTracking: boolean
  /** Tours is on and the admin allows wanderer under it. */
  toursWanderer: boolean
  /** Tours is on and the admin offers OpenHikingMap in its planner (MAP-01). */
  toursHikingMap: boolean
  /** Tours is on and the admin offers CyclOSM in its planner (BIK-06). */
  toursCycleMap: boolean
  toursOptions: ToursOptions
  /** The collab chat is on: the admin can switch it off inside the collab addon. */
  collabChat: boolean
  collabFeatures: CollabFeatures
  loaded: boolean
  /** No read of the addons has answered yet but one failed (offline, say), so `addons` says nothing about the instance. */
  failed: boolean
  loadAddons: () => Promise<void>
  isEnabled: (id: string) => boolean
}

export const useAddonStore = create<AddonState>((set, get) => ({
  addons: [],
  bagTracking: false,
  toursWanderer: false,
  toursHikingMap: false,
  toursCycleMap: false,
  toursOptions: { wanderer: false, hikingMap: false, cycleMap: false },
  collabChat: true,
  collabFeatures: ALL_COLLAB_FEATURES,
  loaded: false,
  failed: false,

  loadAddons: async () => {
    try {
      const data = await addonsApi.enabled()
      const toursWanderer = !!data.toursWanderer
      const toursHikingMap = !!data.toursHikingMap
      const toursCycleMap = !!data.toursCycleMap
      set({ addons: data.addons || [], bagTracking: !!data.bagTracking,
        toursWanderer,
        toursHikingMap,
        toursCycleMap,
        // A server from before the options were listed apart only sends the combined flags.
        toursOptions: {
          wanderer: data.toursOptions?.wanderer ?? toursWanderer,
          hikingMap: data.toursOptions?.hikingMap ?? toursHikingMap,
          cycleMap: data.toursOptions?.cycleMap ?? toursCycleMap,
        },
        collabChat: data.collabFeatures?.chat !== false,
        collabFeatures: { ...ALL_COLLAB_FEATURES, ...data.collabFeatures },
        loaded: true,
        failed: false,
      })
    } catch {
      // A failed refresh after a good read keeps that read: it still says what the instance has.
      set(state => ({ loaded: true, failed: state.failed || !state.loaded }))
    }
  },

  isEnabled: (id: string) => {
    if (id === 'memories') {
      return get().addons.some(a => a.type === 'photo_provider' && a.enabled)
    }
    return get().addons.some(a => a.id === id && a.enabled)
  },
}))

/**
 * The instance switch of an addon when the instance list is known (a read
 * answered, or the list holds addons), else `whenUnknown`: offline, or before
 * the first read answered, the empty list would otherwise read as every addon off.
 */
export function instanceAddonOn(
  state: Pick<AddonState, 'addons' | 'loaded' | 'failed' | 'isEnabled'>,
  id: string,
  whenUnknown: boolean,
): boolean {
  return (state.loaded && !state.failed) || state.addons.length > 0 ? state.isEnabled(id) : whenUnknown
}
