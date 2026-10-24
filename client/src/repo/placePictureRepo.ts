import type { MapsPlaceEnrichmentResult } from '@trek/shared';
import { fetchImageAsBlob } from '../api/authUrl';
import { mapsApi } from '../api/client';

/** What the sources are asked for one place: where it is, what it is called, in which language. */
interface PlaceEnrichmentQuery {
  placeId?: string;
  lat: number;
  lng: number;
  name: string;
  lang?: string;
  details?: Record<string, unknown>;
}

/**
 * The pictures a place can be given: the sources' photos and the images
 * attached to it. Online only by nature, and nothing here is cached on the
 * device; the session cache for enrichment lives with the planner view.
 */
export const placePictureRepo = {
  /** The sources' pictures and description for a place, as the maps route answers them. */
  enrichment(query: PlaceEnrichmentQuery, signal?: AbortSignal): Promise<MapsPlaceEnrichmentResult> {
    return mapsApi.placeEnrichment(query, signal);
  },

  /** An attached image as an object URL the view can show; empty when it could not be read. */
  attachedImage(url: string): Promise<string> {
    return fetchImageAsBlob(url);
  },
};
