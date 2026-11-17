import { useEffect, useState } from 'react';

import { fetchPhoto, getCached } from '../../services/photoService';
import { useAuthStore } from '../../store/authStore';
import { photoCacheKey } from '../Map/placePhoto';

/** What a place's picture is found by. */
interface PhotoPlace {
  name: string;
  image_url?: string | null;
  google_place_id?: string | null;
  osm_id?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/**
 * A place's picture at full size, for a view that shows it large (#2629).
 *
 * The place's own picture wins, as everywhere else. Without one, the picture its
 * provider has for its Google or OSM id is asked through the shared photo cache,
 * so a place the list or the map already shows costs no second request. A place
 * known only by its position gets none: the proxy would answer with whatever is
 * near those coordinates, the same street for every stop along it. Null while it
 * loads, when there is none and while photos are switched off.
 */
/** How the picture is asked for: the place's own, or its provider's through the cache key. */
function photoQuery(place: PhotoPlace | null) {
  const own = place?.image_url || null;
  const providerId = place?.google_place_id || place?.osm_id || null;
  return {
    own,
    providerId,
    key: place && !own && providerId ? photoCacheKey(place) : '',
    lat: place?.lat ?? undefined,
    lng: place?.lng ?? undefined,
    name: place?.name,
  };
}

export function usePlacePhoto(place: PhotoPlace | null): string | null {
  const enabled = useAuthStore((s) => s.placesPhotosEnabled);
  const { own, providerId, key, lat, lng, name } = photoQuery(place);
  // Names the place it belongs to, so the previous place's picture never shows for the next.
  const [loaded, setLoaded] = useState<{ key: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!enabled || !key || !providerId) return;
    let cancelled = false;
    fetchPhoto(key, providerId, lat, lng, name, (entry) => {
      if (!cancelled) setLoaded({ key, url: entry.photoUrl });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, key, providerId, lat, lng, name]);

  if (own) return own;
  if (!enabled || !key) return null;
  return loaded?.key === key ? loaded.url : (getCached(key)?.photoUrl ?? null);
}
