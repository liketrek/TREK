/**
 * Shared types + pure helpers for the public (read-only) journey share page.
 * No React, no side effects — safe to import from both the data hook and the
 * presentational page.
 */

export interface PublicEntry {
  id: number
  title?: string | null
  story?: string | null
  entry_date: string
  entry_time?: string | null
  location_name?: string | null
  location_lat?: number | null
  location_lng?: number | null
  mood?: string | null
  weather?: string | null
  pros_cons?: { pros: string[]; cons: string[] } | null
  photos: PublicPhoto[]
}

export interface PublicPhoto {
  id: number
  entry_id: number
  photo_id: number
  provider?: string
  asset_id?: string | null
  owner_id?: number | null
  file_path?: string | null
  caption?: string | null
}

export interface PublicGalleryPhoto {
  id: number
  journey_id: number
  photo_id: number
  provider?: string
  asset_id?: string | null
  owner_id?: number | null
  file_path?: string | null
  caption?: string | null
}

export function groupByDate(entries: PublicEntry[]): Map<string, PublicEntry[]> {
  const groups = new Map<string, PublicEntry[]>()
  for (const e of entries) {
    const d = e.entry_date
    if (!groups.has(d)) groups.set(d, [])
    groups.get(d)!.push(e)
  }
  return groups
}
