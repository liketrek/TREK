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
