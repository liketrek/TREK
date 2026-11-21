/**
 * Shared types + pure helpers for the public (read-only) journey share page.
 * No React, no side effects — safe to import from both the data hook and the
 * presentational page.
 */

/**
 * An entry as the share link sends it (`journeyPublicEntrySchema` in
 * @trek/shared). A map-only share leaves out the story fields and the photos.
 */
export interface PublicEntry {
  id: number;
  type?: string | null;
  sort_order?: number | null;
  title?: string | null;
  story?: string | null;
  entry_date: string;
  entry_time?: string | null;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  country_code?: string | null;
  mood?: string | null;
  weather?: string | null;
  tags?: string[];
  pros_cons?: { pros: string[]; cons: string[] } | null;
  photos: PublicPhoto[];
}

/**
 * A photo of a shared journey (`journeyPublicPhotoSchema`). It carries no
 * storage key or asset id: the bytes are fetched by `photo_id` through the
 * share token.
 */
export interface PublicPhoto {
  id: number;
  photo_id: number;
  caption?: string | null;
  // 'image' (default) or 'video' (#823)
  media_type?: string | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  /** A clip whose poster frame could not be grabbed; the page draws a plain tile instead of an <img> (#2341). */
  posterless?: boolean;
}

export interface PublicGalleryPhoto extends PublicPhoto {
  /** When and where the picture was taken (#1614). Absent for most photos, and the
   *  coordinates are withheld entirely unless the owner shared the map. */
  taken_at?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function groupByDate(entries: PublicEntry[]): Map<string, PublicEntry[]> {
  const groups = new Map<string, PublicEntry[]>();
  for (const e of entries) {
    const d = e.entry_date;
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(e);
  }
  return groups;
}
