import type { JourneyDetail } from '../../../store/journeyStore'

/**
 * Stable input contract for every Journey export surface.
 *
 * Store/API shapes stay at the feature boundary; renderers, designers and
 * persistence code consume this deliberately small representation instead.
 */
export interface JourneyExportModel {
  title: string
  subtitle: string | null
  coverImage: string | null
  entries: JourneyExportEntry[]
}

export interface JourneyExportEntry {
  title: string | null
  story: string | null
  entry_date: string
  entry_time: string | null
  location_name: string | null
  pros_cons: { pros: string[]; cons: string[] } | null
  photos: JourneyExportPhoto[]
}

export interface JourneyExportPhoto {
  photo_id: number
}

/** Creates an export-specific snapshot from the Journey store model. */
export function createJourneyExportModel(journey: JourneyDetail): JourneyExportModel {
  return {
    title: journey.title,
    subtitle: journey.subtitle ?? null,
    coverImage: journey.cover_image ?? null,
    entries: (journey.entries || [])
      .filter(entry => entry.type !== 'skeleton')
      .map(entry => ({
        title: entry.title ?? null,
        story: entry.story ?? null,
        entry_date: entry.entry_date,
        entry_time: entry.entry_time ?? null,
        location_name: entry.location_name ?? null,
        pros_cons: entry.pros_cons ?? null,
        photos: (entry.photos || []).map(photo => ({ photo_id: photo.photo_id })),
      })),
  }
}
