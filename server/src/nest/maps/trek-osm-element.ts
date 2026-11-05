import { trekCommunityValuesSchema } from './trek-community.schema';
import { getJson } from './trek-places.client';

import { z } from 'zod';

/** An OSM element as the TREK Places API's details layer answers it: the tags, the point, and the community values. */
const trekOsmElementSchema = trekCommunityValuesSchema.extend({
  name: z.string().nullish(),
  lat: z.number(),
  lng: z.number(),
  tags: z.record(z.string(), z.string()),
});

type TrekOsmElement = z.infer<typeof trekOsmElementSchema>;

/** The details layer answers in well under a second or not at all; Overpass is the fallback, not this. */
const TIMEOUT_MS = 3_000;

/**
 * An element's detail tags from TREK's own copy of OpenStreetMap
 * (`/v1/osm/{type}/{id}`), or null when the layer does not hold it, the index
 * is switched off or the service does not answer. Then Overpass is asked, as
 * before.
 */
export async function trekOsmElement(osmType: string, osmId: string): Promise<TrekOsmElement | null> {
  try {
    const body = await getJson<{ place?: unknown } | null>(
      `/v1/osm/${encodeURIComponent(osmType)}/${encodeURIComponent(osmId)}`,
      {},
      { timeoutMs: TIMEOUT_MS },
    );
    // An answer outside the published shape is no element: Overpass is asked instead.
    const place = trekOsmElementSchema.safeParse(body?.place);
    return place.success ? place.data : null;
  } catch {
    return null;
  }
}

/** The element as Overpass would have placed it (the shape of OverpassElement), for the code that reads Overpass answers. */
export function asOverpassElement(element: TrekOsmElement): { tags: Record<string, string>; lat: number; lon: number } {
  return { tags: element.tags, lat: element.lat, lon: element.lng };
}
