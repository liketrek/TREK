import { z } from 'zod';

/**
 * Atlas API contract — single source of truth for the /api/addons/atlas endpoints
 * (visited countries/regions, region GeoJSON, and the travel bucket list).
 *
 * Parity note: unlike the journey addon, the legacy atlas route is NOT gated by
 * an addon-enabled check (app.ts mounts it without one), so the migration does
 * not add a gate either — adding one would be a breaking 404.
 *
 * Stats, visited-regions and GeoJSON are wide, externally-derived shapes kept as
 * open records; the request schemas and the bespoke 400/404 controller messages
 * pin the parts the client depends on.
 */

const open = z.record(z.string(), z.unknown());

export const markRegionRequestSchema = z.object({
  name: z.string().min(1),
  country_code: z.string().min(1),
});
export type MarkRegionRequest = z.infer<typeof markRegionRequestSchema>;

export const createBucketItemRequestSchema = z.object({
  name: z.string().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  country_code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  target_date: z.string().nullable().optional(),
});
export type CreateBucketItemRequest = z.infer<typeof createBucketItemRequestSchema>;

export const updateBucketItemRequestSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  country_code: z.string().nullable().optional(),
  target_date: z.string().nullable().optional(),
});
export type UpdateBucketItemRequest = z.infer<typeof updateBucketItemRequestSchema>;

/** A bucket-list item row (DB-shaped; kept open). */
export const bucketItemSchema = open;

export const bucketListResponseSchema = z.object({
  items: z.array(bucketItemSchema),
});
export type BucketListResponse = z.infer<typeof bucketListResponseSchema>;

/** GeoJSON FeatureCollection (kept open — provider-derived geometry). */
export const regionGeoSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
});
export type RegionGeo = z.infer<typeof regionGeoSchema>;

/**
 * Where a coordinate lands on the atlas map (#1115). Both fields are nullable: the
 * point may sit outside every bundled polygon (open sea, a simplification gap at a
 * coastline), and plenty of countries have no admin1 coverage in the bundle at all,
 * in which case the country resolves and the region does not.
 */
export const atlasLocateResponseSchema = z.object({
  country_code: z.string().nullable(),
  region_code: z.string().nullable(),
  region_name: z.string().nullable(),
});
export type AtlasLocateResponse = z.infer<typeof atlasLocateResponseSchema>;

/**
 * How a country/region ended up on the atlas map. Before this, every trip counted as a
 * visit, so a booked-but-not-taken trip painted the map as if you had already been there.
 * Requested in discussion #1048 — note that's a discussion, not an issue:
 * https://github.com/liketrek/TREK/discussions/1048
 *
 *  - visited: at least one source is a trip that has already started, or a manual mark
 *  - planned: every source is a trip starting in the future
 *  - idea:    every source is a trip with no dates at all
 */
export const visitStatusSchema = z.enum(['visited', 'planned', 'idea']);
export type VisitStatus = z.infer<typeof visitStatusSchema>;

/** Today as 'YYYY-MM-DD' in UTC — the comparison base the rest of TREK uses. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bucket a trip by its dates. A trip that has started but not ended still counts as
 * visited — you are there right now. A trip with neither date is an idea, not a plan,
 * and must stay out of the visit stats.
 */
export function tripVisitStatus(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  today: string = todayUtc(),
): VisitStatus {
  const effectiveStart = startDate || endDate || null;
  if (!effectiveStart) return 'idea';
  return effectiveStart <= today ? 'visited' : 'planned';
}

/** visited beats planned beats idea — a country takes its strongest source. */
export const VISIT_STATUS_RANK: Record<VisitStatus, number> = {
  visited: 0,
  planned: 1,
  idea: 2,
};

export function strongerVisitStatus(a: VisitStatus, b: VisitStatus): VisitStatus {
  return VISIT_STATUS_RANK[a] <= VISIT_STATUS_RANK[b] ? a : b;
}

/**
 * ISO 3166-1 alpha-2 country code → continent. Single source of truth for the
 * Atlas continent breakdown, used by the server (stats aggregation) and the
 * client (keeping the per-continent counts in sync on optimistic mark/unmark).
 */
export const CONTINENT_MAP: Record<string, string> = {
  AF: 'Asia',
  AL: 'Europe',
  DZ: 'Africa',
  AD: 'Europe',
  AO: 'Africa',
  AR: 'South America',
  AM: 'Asia',
  AU: 'Oceania',
  AT: 'Europe',
  AZ: 'Asia',
  BA: 'Europe',
  BD: 'Asia',
  BF: 'Africa',
  BH: 'Asia',
  BI: 'Africa',
  BJ: 'Africa',
  BN: 'Asia',
  BO: 'South America',
  BR: 'South America',
  BE: 'Europe',
  BG: 'Europe',
  BW: 'Africa',
  CA: 'North America',
  CD: 'Africa',
  CG: 'Africa',
  CI: 'Africa',
  CL: 'South America',
  CM: 'Africa',
  CN: 'Asia',
  CO: 'South America',
  CR: 'North America',
  CU: 'North America',
  CV: 'Africa',
  CY: 'Europe',
  HR: 'Europe',
  CZ: 'Europe',
  DJ: 'Africa',
  DK: 'Europe',
  DO: 'North America',
  EC: 'South America',
  EG: 'Africa',
  EE: 'Europe',
  ER: 'Africa',
  ET: 'Africa',
  FI: 'Europe',
  FR: 'Europe',
  DE: 'Europe',
  GE: 'Asia',
  GH: 'Africa',
  GN: 'Africa',
  GR: 'Europe',
  GT: 'North America',
  HN: 'North America',
  HT: 'North America',
  HU: 'Europe',
  IS: 'Europe',
  IN: 'Asia',
  ID: 'Asia',
  IR: 'Asia',
  IQ: 'Asia',
  IE: 'Europe',
  IL: 'Asia',
  IT: 'Europe',
  JM: 'North America',
  JO: 'Asia',
  JP: 'Asia',
  KE: 'Africa',
  KG: 'Asia',
  KH: 'Asia',
  KR: 'Asia',
  KW: 'Asia',
  KZ: 'Asia',
  LA: 'Asia',
  LB: 'Asia',
  LK: 'Asia',
  LV: 'Europe',
  LT: 'Europe',
  LU: 'Europe',
  LY: 'Africa',
  MA: 'Africa',
  MD: 'Europe',
  ME: 'Europe',
  MG: 'Africa',
  MK: 'Europe',
  ML: 'Africa',
  MM: 'Asia',
  MN: 'Asia',
  MR: 'Africa',
  MT: 'Europe',
  MU: 'Africa',
  MV: 'Asia',
  MW: 'Africa',
  MY: 'Asia',
  MX: 'North America',
  MZ: 'Africa',
  NA: 'Africa',
  NE: 'Africa',
  NI: 'North America',
  NL: 'Europe',
  NP: 'Asia',
  NZ: 'Oceania',
  NO: 'Europe',
  OM: 'Asia',
  PA: 'North America',
  PG: 'Oceania',
  PK: 'Asia',
  PE: 'South America',
  PH: 'Asia',
  PL: 'Europe',
  PS: 'Asia',
  PT: 'Europe',
  PY: 'South America',
  QA: 'Asia',
  RO: 'Europe',
  RU: 'Europe',
  RW: 'Africa',
  SA: 'Asia',
  SC: 'Africa',
  SD: 'Africa',
  SG: 'Asia',
  SI: 'Europe',
  SK: 'Europe',
  SN: 'Africa',
  SO: 'Africa',
  RS: 'Europe',
  SV: 'North America',
  SY: 'Asia',
  TG: 'Africa',
  TJ: 'Asia',
  TM: 'Asia',
  TN: 'Africa',
  TT: 'North America',
  TW: 'Asia',
  TZ: 'Africa',
  ZA: 'Africa',
  SE: 'Europe',
  CH: 'Europe',
  TH: 'Asia',
  TR: 'Europe',
  UA: 'Europe',
  UG: 'Africa',
  UY: 'South America',
  UZ: 'Asia',
  VE: 'South America',
  AE: 'Asia',
  GB: 'Europe',
  US: 'North America',
  VN: 'Asia',
  XK: 'Europe',
  YE: 'Asia',
  ZM: 'Africa',
  ZW: 'Africa',
  NG: 'Africa',
  HK: 'Asia',
  MO: 'Asia',
  SM: 'Europe',
  VA: 'Europe',
  MC: 'Europe',
  LI: 'Europe',
  GI: 'Europe',
  PR: 'North America',

  // Countries present in the bundled admin0 borders but long absent from this table,
  // so they bucketed into 'Other' once resolved. Spain is the notable one — it always
  // had a bounding box, just no continent (#1490).
  ES: 'Europe',
  BY: 'Europe',
  GL: 'North America',
  AG: 'North America',
  BB: 'North America',
  BS: 'North America',
  BZ: 'North America',
  DM: 'North America',
  GD: 'North America',
  KN: 'North America',
  LC: 'North America',
  VC: 'North America',
  GY: 'South America',
  SR: 'South America',
  BT: 'Asia',
  KP: 'Asia',
  TL: 'Asia',
  CF: 'Africa',
  EH: 'Africa',
  GA: 'Africa',
  GM: 'Africa',
  GQ: 'Africa',
  GW: 'Africa',
  KM: 'Africa',
  LR: 'Africa',
  LS: 'Africa',
  SL: 'Africa',
  SS: 'Africa',
  ST: 'Africa',
  SZ: 'Africa',
  TD: 'Africa',
  FJ: 'Oceania',
  FM: 'Oceania',
  KI: 'Oceania',
  MH: 'Oceania',
  NR: 'Oceania',
  PW: 'Oceania',
  SB: 'Oceania',
  TO: 'Oceania',
  TV: 'Oceania',
  VU: 'Oceania',
  WS: 'Oceania',
  AQ: 'Antarctica',
};

/** Continent for an ISO alpha-2 country code; 'Other' when unknown. */
export function continentForCountry(code: string | null | undefined): string {
  if (!code) return 'Other';
  return CONTINENT_MAP[code.toUpperCase()] || 'Other';
}
