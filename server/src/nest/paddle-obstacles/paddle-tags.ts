import type { PaddleObstacleKind } from '@trek/shared';

/**
 * PAD-05A: which OpenStreetMap objects are paddle obstacles, places to get
 * in and out, portage ways or access rules, and which of their tags are kept.
 * The tag variants read are listed here and nowhere else:
 *
 * - waterway=weir, dam, lock_gate, waterfall; lock=yes on a waterway (a lock chamber)
 * - rapids: whitewater=rapid, waterway=rapids
 * - hazard: whitewater=hazard, and hazard=* or obstacle=* on a waterway
 * - put-in and egress: canoe=put_in / egress, whitewater=put_in / egress / put_in;egress
 *   (the older whitewater scheme), leisure=slipway as a slipway
 * - portage: canoe=portage, portage=yes, whitewater=portage_way
 * - access: a waterway (river, canal, stream) whose canoe, boat or their
 *   conditional variants say who may paddle it
 *
 * Relations (a multipolygon lock basin) are not read; their member ways are.
 */

const WATERWAYS = new Set(['river', 'canal', 'stream', 'fairway', 'tidal_channel']);
const PUT_IN = new Set(['put_in', 'put_in;egress', 'egress;put_in']);

/** The kind an object is, or null when it is none of PAD-05A's. */
export function paddleKindOf(tags: Readonly<Record<string, string>>): PaddleObstacleKind | null {
  const waterway = tags.waterway;
  const whitewater = tags.whitewater;
  const canoe = tags.canoe;
  if (waterway === 'weir') return 'weir';
  if (waterway === 'dam') return 'dam';
  if (waterway === 'lock_gate') return 'lock_gate';
  if (waterway === 'waterfall') return 'waterfall';
  if (tags.lock === 'yes' && (waterway === undefined || WATERWAYS.has(waterway))) return 'lock';
  if (whitewater === 'rapid' || waterway === 'rapids') return 'rapids';
  if (whitewater === 'hazard') return 'hazard';
  if (canoe === 'portage' || tags.portage === 'yes' || whitewater === 'portage_way') return 'portage';
  if (canoe === 'put_in' || (whitewater !== undefined && PUT_IN.has(whitewater))) return 'put_in';
  if (canoe === 'egress' || whitewater === 'egress') return 'egress';
  if (tags.leisure === 'slipway') return 'slipway';
  if (waterway !== undefined && WATERWAYS.has(waterway)) {
    if (tags.hazard !== undefined || tags.obstacle !== undefined) return 'hazard';
    const ruled = ['canoe', 'boat', 'canoe:conditional', 'boat:conditional'].some((key) => tags[key] !== undefined);
    if (ruled) return 'access';
  }
  return null;
}

const KEPT = new Set([
  'name',
  'lock_name',
  'ref',
  'waterway',
  'lock',
  'whitewater',
  'canoe',
  'boat',
  'access',
  'portage',
  'hazard',
  'obstacle',
  'leisure',
  'height',
  'width',
  'operator',
  'opening_hours',
  'seasonal',
  'description',
  'note',
  'fee',
  'website',
  'motorboat',
  // When someone last looked on site; the checklist shows it, a newer one never flips a decision.
  'check_date',
  'survey:date',
]);
const KEPT_PREFIXES = ['canoe:', 'boat:', 'whitewater:', 'portage:', 'lock:', 'access:', 'check_date:'];

/** The tags an object is judged and shown by; everything else of OSM's is left behind. */
export function keptTags(tags: Readonly<Record<string, string>>): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (KEPT.has(key) || KEPT_PREFIXES.some((prefix) => key.startsWith(prefix))) kept[key] = value;
  }
  return kept;
}

/** The name a paddler knows it by: its own, else the lock's. */
export function paddleNameOf(tags: Readonly<Record<string, string>>): string | null {
  return tags.name ?? tags.lock_name ?? null;
}
