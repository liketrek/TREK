import { create } from 'zustand'

/**
 * The raw place payload handed to the "Save to Collection" picker. Carries the
 * provenance ids (source_trip_id / source_place_id) when the place originates
 * from a trip, plus the maps identity used both to save and to dedup. Every
 * field is optional except the name so the same target shape works for a trip
 * pool place, a day-assignment place or a manually entered one.
 */
export interface SaveToCollectionTarget {
  name: string
  source_trip_id?: number | null
  source_place_id?: number | null
  description?: string | null
  lat?: number | null
  lng?: number | null
  address?: string | null
  category_id?: number | null
  price?: number | null
  currency?: string | null
  notes?: string | null
  image_url?: string | null
  google_place_id?: string | null
  google_ftid?: string | null
  osm_id?: string | null
  website?: string | null
  phone?: string | null
}

interface SaveToCollectionState {
  /** The place currently shown in the picker, or null when it is closed. */
  target: SaveToCollectionTarget | null
  /** Bumped after every add/remove so other surfaces (the inspector bookmark
   *  indicator) can re-check membership without prop threading. */
  version: number
  open: (target: SaveToCollectionTarget) => void
  close: () => void
  bumpVersion: () => void
}

export const useSaveToCollectionStore = create<SaveToCollectionState>((set, get) => ({
  target: null,
  version: 0,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
  bumpVersion: () => set({ version: get().version + 1 }),
}))
