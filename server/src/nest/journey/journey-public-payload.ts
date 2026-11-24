import type { JourneyEntryWire } from './journey-entry-row';
import type { JourneyPublicEntry, JourneyPublicPhoto } from '@trek/shared';

/**
 * The public journey payload, built field by field.
 *
 * The share link used to spread whole rows into its answer, so every column
 * the reads selected went out to anyone holding the link: the storage keys of
 * local photos (`journey/<uuid>.jpg`), provider asset ids, the photo owner,
 * the entry author and its source ids. Each function below names what the
 * public page reads and nothing else, so a column added to a read later stays
 * on the server unless it is added here on purpose.
 */

/** The photo columns the public reads select; only some of them go out. */
interface PublicPhotoSource {
  id: number;
  photo_id: number;
  caption?: string | null;
  provider?: string | null;
  thumbnail_path?: string | null;
  width?: number | null;
  height?: number | null;
  media_type?: string | null;
  duration_ms?: number | null;
  taken_at?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/**
 * A photo as the public page shows it. Capture coordinates go out only with
 * the map. `posterless` is worked out here, because the storage key it used to
 * be read from no longer leaves the server (#2341); a clip also keeps its
 * provider, which builds from before that flag still read.
 */
export function publicPhoto(photo: PublicPhotoSource, withLocation: boolean): JourneyPublicPhoto {
  const mediaType = photo.media_type ?? null;
  return {
    id: photo.id,
    photo_id: photo.photo_id,
    caption: photo.caption ?? null,
    media_type: mediaType,
    width: photo.width ?? null,
    height: photo.height ?? null,
    duration_ms: photo.duration_ms ?? null,
    taken_at: photo.taken_at ?? null,
    lat: withLocation ? (photo.lat ?? null) : null,
    lng: withLocation ? (photo.lng ?? null) : null,
    posterless: mediaType === 'video' && photo.provider === 'local' && !photo.thumbnail_path,
    // Older clients still work `posterless` out from the provider (see the schema).
    ...(mediaType === 'video' ? { provider: photo.provider ?? null } : {}),
  };
}

/** Just enough of an entry to plot its marker: a map-only share tells no story. */
export function publicMapEntry(entry: JourneyEntryWire): JourneyPublicEntry {
  return {
    id: entry.id,
    type: entry.type,
    entry_date: entry.entry_date,
    sort_order: entry.sort_order ?? null,
    title: entry.title ?? null,
    location_name: entry.location_name ?? null,
    location_lat: entry.location_lat ?? null,
    location_lng: entry.location_lng ?? null,
  };
}

/**
 * An entry of a shared timeline with its photos. The coordinates follow the
 * map switch; the photos follow the gallery switch.
 */
export function publicTimelineEntry(
  entry: JourneyEntryWire,
  photos: readonly PublicPhotoSource[],
  share: { map: boolean; gallery: boolean },
): JourneyPublicEntry {
  return {
    id: entry.id,
    type: entry.type,
    entry_date: entry.entry_date,
    entry_time: entry.entry_time ?? null,
    sort_order: entry.sort_order ?? null,
    title: entry.title ?? null,
    story: entry.story ?? null,
    location_name: entry.location_name ?? null,
    location_lat: share.map ? (entry.location_lat ?? null) : null,
    location_lng: share.map ? (entry.location_lng ?? null) : null,
    country_code: entry.country_code ?? null,
    mood: entry.mood ?? null,
    weather: entry.weather ?? null,
    tags: entry.tags,
    pros_cons: entry.pros_cons,
    photos: share.gallery ? photos.map((p) => publicPhoto(p, share.map)) : [],
  };
}
