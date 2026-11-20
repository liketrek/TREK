import type { TravelPlanDraftItem } from '@trek/shared';

/**
 * Amap's URI API takes `lng,lat,name` per point and expects GCJ-02 — the
 * coordinate system the providers themselves return for domestic places.
 * Commas stay literal, only the name is percent-encoded (it may contain one).
 */
function amapPoint(place: TravelPlanDraftItem['place']): string {
  return `${place.lng},${place.lat},${encodeURIComponent(place.name)}`;
}

function amapNavigationUrl(parts: string[]): string {
  return `https://uri.amap.com/navigation?${[
    ...parts,
    'mode=car',
    'policy=1',
    'coordinate=gaode',
    'src=trek',
    'callnative=1',
  ].join('&')}`;
}

/**
 * One driving route through the day: first stop → middle stops → last stop, in
 * the order the timeline visits them. A day with a single stop has no route.
 */
export function amapDayNavigationUrl(items: TravelPlanDraftItem[]): string | null {
  if (items.length < 2) return null;
  const [first, ...rest] = items;
  const last = rest.pop();
  if (!first || !last) return null;
  const via = rest.map((item) => amapPoint(item.place));
  return amapNavigationUrl([
    `from=${amapPoint(first.place)}`,
    `to=${amapPoint(last.place)}`,
    ...(via.length > 0 ? [`via=${via.join('|')}`] : []),
  ]);
}

/**
 * Just the destination: Amap starts from the user's current location when
 * `from` is omitted, which is what "navigate here" means from a phone.
 */
export function amapPlaceNavigationUrl(place: TravelPlanDraftItem['place']): string {
  return amapNavigationUrl([`to=${amapPoint(place)}`]);
}
