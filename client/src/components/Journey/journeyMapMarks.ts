import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';

/**
 * The marks a journey map draws beside its entries and photos (JRN-04): the
 * places the plan puts on a day, and the stays a journal entry was taken over
 * from. One module for both renderers, so a mark says the same on Leaflet and
 * on GL. The markup is SVG with its colours as attributes: it is drawn over
 * any basemap, so it keeps its own contrast instead of following the scheme.
 */
export type JourneyMapMark =
  | { kind: 'plan'; key: string; lat: number; lng: number; color: string; place: JourneyMapPlace }
  | { kind: 'stay'; key: string; lat: number; lng: number; color: string; stay: JourneyMapStay };

/** The colour of a planned place whose category has none, a neutral slate that reads on light and dark tiles. */
export const PLAN_FALLBACK_COLOR = '#64748b';

/**
 * Marks closer than this on screen are one hit: the reader could not pick one
 * of them anyway. Tighter than the photo grid, since a mark is a pin and not a
 * thumbnail, so marks a street apart stay apart.
 */
export const MARK_CLUSTER_PX = 26;

const PLAN_PIN_W = 22;
const PLAN_PIN_H = 28;
const STAY_DOT = 14;
const MARK_CLUSTER_SIZE = 28;

/**
 * Grid clustering in screen space, shared by both renderers: points whose
 * projected position falls in the same `px` cell become one, anchored on the
 * first so the pin points where that member is. `project` is the engine's own
 * lat/lng to container-pixel conversion.
 */
export function clusterPoints<T extends { lat: number; lng: number }>(
  points: readonly T[],
  project: (lat: number, lng: number) => { x: number; y: number },
  px: number
): { lat: number; lng: number; members: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const point of points) {
    const pt = project(point.lat, point.lng);
    const key = `${Math.round(pt.x / px)}:${Math.round(pt.y / px)}`;
    const list = buckets.get(key);
    if (list) list.push(point);
    else buckets.set(key, [point]);
  }
  return [...buckets.values()].map((members) => ({ lat: members[0].lat, lng: members[0].lng, members }));
}

/** Only a `#rgb`/`#rrggbb` colour reaches markup; anything else a category holds falls back. */
export function safeColor(color: string | null | undefined, fallback = PLAN_FALLBACK_COLOR): string {
  return color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
}

/**
 * A planned place: a hollow pin, dashed in its category colour, smaller than
 * an entry pin. Hollow on purpose: the plan is what was meant, not what was
 * lived, and it never reads as a filled journal pin.
 */
export function planPinSvg(color: string): string {
  const c = safeColor(color);
  return `<svg width="${PLAN_PIN_W}" height="${PLAN_PIN_H}" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))">
    <path d="M11 26.5C11 26.5 20.5 17.4 20.5 10.2C20.5 5 16.25 1.5 11 1.5C5.75 1.5 1.5 5 1.5 10.2C1.5 17.4 11 26.5 11 26.5Z" fill="#ffffff" fill-opacity="0.92" stroke="${c}" stroke-width="2" stroke-dasharray="3 2"/>
    <circle cx="11" cy="10.5" r="3" fill="${c}"/>
  </svg>`;
}

/** A stay of a day report: a dot in the colour of its day, ringed so it holds on any tile. */
function stayDotSvg(color: string): string {
  const c = safeColor(color);
  return `<svg width="${STAY_DOT}" height="${STAY_DOT}" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">
    <circle cx="7" cy="7" r="5.5" fill="${c}" stroke="#ffffff" stroke-width="2"/>
  </svg>`;
}

/**
 * Several marks on one spot: a stacked disc with the count, ringed in the
 * colours of up to two members so the reader sees what kinds lie beneath.
 */
function markClusterSvg(count: number, colors: string[]): string {
  const [a, b] = [safeColor(colors[0]), safeColor(colors[1] ?? colors[0])];
  const label = count > 99 ? '99+' : String(count);
  return `<svg width="${MARK_CLUSTER_SIZE}" height="${MARK_CLUSTER_SIZE}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style="display:block;cursor:pointer;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))">
    <circle cx="16" cy="12" r="10" fill="#ffffff" stroke="${b}" stroke-width="2"/>
    <circle cx="12" cy="16" r="10" fill="#ffffff" stroke="${a}" stroke-width="2.5"/>
    <text x="12" y="16" text-anchor="middle" dominant-baseline="central" fill="#111827" font-family="'Poppins',system-ui,sans-serif" font-size="10" font-weight="700">${label}</text>
  </svg>`;
}

/** The markup of one hit on the map: a mark alone, or the disc of several. */
export function markHitSvg(members: readonly JourneyMapMark[]): {
  html: string;
  width: number;
  height: number;
  anchor: 'bottom' | 'center';
} {
  if (members.length > 1) {
    return {
      html: markClusterSvg(
        members.length,
        members.map((m) => m.color)
      ),
      width: MARK_CLUSTER_SIZE,
      height: MARK_CLUSTER_SIZE,
      anchor: 'center',
    };
  }
  const mark = members[0];
  return mark.kind === 'plan'
    ? { html: planPinSvg(mark.color), width: PLAN_PIN_W, height: PLAN_PIN_H, anchor: 'bottom' }
    : { html: stayDotSvg(mark.color), width: STAY_DOT, height: STAY_DOT, anchor: 'center' };
}

/**
 * The small check an entry pin carries when the plan had that place too: plan
 * and memory at one spot read as one pin, not two on top of each other. Sits
 * at the pin's top corner, inside its 28 x 36 box.
 */
export const PLANNED_BADGE_SVG = `<circle cx="22.5" cy="5.5" r="5" fill="#ffffff" stroke="#16a34a" stroke-width="1.2"/><path d="M20.4 5.6l1.5 1.5 2.8-2.9" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
