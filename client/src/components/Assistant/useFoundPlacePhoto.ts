import { type RefObject, useEffect, useState } from 'react';

import { fetchPhoto, getCached } from '../../services/photoService';
import { useAuthStore } from '../../store/authStore';

/**
 * What a picture is asked for by: a found place, or a stay a booking card
 * shows (its Google place id, its position and its name).
 */
interface PhotoPlace {
  photoKey?: string | null;
  lat?: number | null;
  lng?: number | null;
  name: string;
}

/** The only pictures a found place shows: TREK's own photo proxy, never an address from the search. */
const PROXY_PREFIX = '/api/maps/place-photo/';

/**
 * A key the proxy can find this very place's photo by. A place known only by
 * its position (`coords:`, what a search of the open map data finds) would get
 * a picture of its surroundings, the same street scene for every restaurant
 * in a district; such a card shows its category instead.
 */
function photoKeyOf(place: PhotoPlace): string | null {
  return place.photoKey && !place.photoKey.startsWith('coords:') ? place.photoKey : null;
}

/** A picture TREK's proxy serves, or null for anything else. */
function proxiedPhoto(url: string | null | undefined): string | null {
  return url?.startsWith(PROXY_PREFIX) ? url : null;
}

/**
 * The picture of a found place, asked from the photo proxy only once its card
 * scrolls into view: each one may cost the instance a call to the photo
 * provider, and a strip holds several. The answer goes through the shared
 * photo cache and its limit on parallel requests, so a place the planner shows
 * too is fetched once. Null while it loads, when there is none, when photos
 * are off, for a place known only by its position, and for any answer that is
 * not the proxy's own address.
 */
export function useFoundPlacePhoto(place: PhotoPlace, ref: RefObject<Element | null>): string | null {
  const enabled = useAuthStore((s) => s.placesPhotosEnabled);
  const key = photoKeyOf(place);
  const [src, setSrc] = useState<string | null>(() => (key ? proxiedPhoto(getCached(key)?.photoUrl) : null));
  // Without an IntersectionObserver every card counts as in view.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !key || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, key, ref]);

  useEffect(() => {
    if (!visible || !enabled || !key) return;
    let cancelled = false;
    fetchPhoto(key, key, place.lat ?? undefined, place.lng ?? undefined, place.name, (entry) => {
      if (!cancelled) setSrc(proxiedPhoto(entry.photoUrl));
    });
    return () => {
      cancelled = true;
    };
  }, [visible, enabled, key, place.lat, place.lng, place.name]);

  return enabled ? src : null;
}
