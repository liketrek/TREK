import type { TravelPlanDraftItem } from '@trek/shared';
import { isOutsideChina } from '@trek/shared';

/** How the traveller is moving; the map's toggle picks it for every link it renders. */
export type DraftTravelMode = 'drive' | 'walk';

/** The first and last stop of a day plus the ones in between; null below two stops. */
function tripEnds(
  items: TravelPlanDraftItem[]
): { first: TravelPlanDraftItem; middle: TravelPlanDraftItem[]; last: TravelPlanDraftItem } | null {
  if (items.length < 2) return null;
  const [first, ...rest] = items;
  const last = rest.pop();
  if (!first || !last) return null;
  return { first, middle: rest, last };
}

/**
 * Amap's URI API takes `lng,lat,name` per point and expects GCJ-02 — the
 * coordinate system the providers themselves return for domestic places.
 * Commas stay literal, only the name is percent-encoded (it may contain one).
 */
function amapPoint(place: TravelPlanDraftItem['place']): string {
  return `${place.lng},${place.lat},${encodeURIComponent(place.name)}`;
}

function amapNavigationUrl(parts: string[], mode: DraftTravelMode): string {
  return `https://uri.amap.com/navigation?${[
    ...parts,
    `mode=${mode === 'walk' ? 'walk' : 'car'}`,
    'policy=1',
    'coordinate=gaode',
    'src=trek',
    'callnative=1',
  ].join('&')}`;
}

/**
 * One driving or walking route through the day: first stop → middle stops → last
 * stop, in the order the timeline visits them. A day with a single stop has no
 * route.
 */
export function amapDayNavigationUrl(items: TravelPlanDraftItem[], mode: DraftTravelMode = 'drive'): string | null {
  const ends = tripEnds(items);
  if (!ends) return null;
  const via = ends.middle.map((item) => amapPoint(item.place));
  return amapNavigationUrl(
    [
      `from=${amapPoint(ends.first.place)}`,
      `to=${amapPoint(ends.last.place)}`,
      ...(via.length > 0 ? [`via=${via.join('|')}`] : []),
    ],
    mode
  );
}

/**
 * Just the destination: Amap starts from the user's current location when
 * `from` is omitted, which is what "navigate here" means from a phone.
 */
export function amapPlaceNavigationUrl(place: TravelPlanDraftItem['place'], mode: DraftTravelMode = 'drive'): string {
  return amapNavigationUrl([`to=${amapPoint(place)}`], mode);
}

/** Google Maps takes plain `lat,lng`, with the same coordinate pair in either order of legs. */
function googlePoint(place: TravelPlanDraftItem['place']): string {
  return `${place.lat},${place.lng}`;
}

/**
 * The same day as a Google Maps directions link, for stops Amap has no map of.
 * The URL API documents a ceiling of nine waypoints, so a longer day keeps its
 * first nine and still ends on the last stop.
 */
export function googleDayNavigationUrl(items: TravelPlanDraftItem[], mode: DraftTravelMode = 'drive'): string | null {
  const ends = tripEnds(items);
  if (!ends) return null;
  const params = new URLSearchParams({
    api: '1',
    origin: googlePoint(ends.first.place),
    destination: googlePoint(ends.last.place),
    travelmode: mode === 'walk' ? 'walking' : 'driving',
  });
  const via = ends.middle.slice(0, 9).map((item) => googlePoint(item.place));
  if (via.length > 0) params.set('waypoints', via.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** The destination alone; Google, like Amap, starts from the current location. */
export function googlePlaceNavigationUrl(place: TravelPlanDraftItem['place'], mode: DraftTravelMode = 'drive'): string {
  const params = new URLSearchParams({
    api: '1',
    destination: googlePoint(place),
    travelmode: mode === 'walk' ? 'walking' : 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** True while every stop is on the map Amap serves. */
function insideChina(items: TravelPlanDraftItem[]): boolean {
  return items.every((item) => !isOutsideChina(item.place.lat, item.place.lng));
}

/**
 * The day's navigation: Amap inside China, Google Maps everywhere else. Amap has
 * no map abroad, so an overseas day that stayed on the Amap link would open an
 * app with nothing to show.
 */
export function dayNavigationUrl(items: TravelPlanDraftItem[], mode: DraftTravelMode = 'drive'): string | null {
  if (items.length < 2) return null;
  return insideChina(items) ? amapDayNavigationUrl(items, mode) : googleDayNavigationUrl(items, mode);
}

/** "Navigate here", routed to whichever map knows the stop. */
export function placeNavigationUrl(place: TravelPlanDraftItem['place'], mode: DraftTravelMode = 'drive'): string {
  return isOutsideChina(place.lat, place.lng)
    ? googlePlaceNavigationUrl(place, mode)
    : amapPlaceNavigationUrl(place, mode);
}
