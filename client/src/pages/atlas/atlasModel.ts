import { continentForCountry, type VisitStatus } from '@trek/shared'

/**
 * Shared types + pure helpers for the Atlas page. No React, no side effects.
 * A2_TO_A3 is deliberately a mutable module-level object: the geoData load
 * effect in useAtlas augments it at runtime, and both the hook (visited-country
 * colouring) and the page's SidebarContent read it — they must share one
 * reference, so it lives here rather than inside either consumer.
 */

export interface AtlasCountry {
  code: string
  tripCount: number
  placeCount: number
  firstVisit?: string | null
  lastVisit?: string | null
  /** Optional so a client talking to an older server keeps painting everything as visited. */
  status?: VisitStatus
}

export interface AtlasStats {
  totalTrips: number
  totalPlaces: number
  totalCountries: number
  totalDays: number
  totalCities?: number
  totalCountriesPlanned?: number
  totalCountriesIdea?: number
}

export interface AtlasData {
  countries: AtlasCountry[]
  stats: AtlasStats
  mostVisited?: AtlasCountry | null
  continents?: Record<string, number>
  continentsPlanned?: Record<string, number>
  lastTrip?: { id: number; title: string; countryCode?: string } | null
  nextTrip?: { id: number; title: string; countryCode?: string } | null
  streak?: number
  firstYear?: number
  tripsThisYear?: number
}

export interface CountryDetail {
  places: import('../../types').AtlasPlace[]
  trips: { id: number; title: string }[]
  manually_marked?: boolean
  status?: VisitStatus
}

/** A country from a server that predates #1048 has no status — treat it as visited. */
export function countryStatus(c: Pick<AtlasCountry, 'status'>): VisitStatus {
  return c.status ?? 'visited'
}

/**
 * Which countries belong on the map. Planned and dateless countries share one switch —
 * splitting them into two would clutter the map for a distinction few users make.
 */
export function isCountryVisible(c: Pick<AtlasCountry, 'status'>, showPlanned: boolean): boolean {
  return countryStatus(c) === 'visited' || showPlanned
}

/**
 * Fold a manual "I have been here" mark into the loaded data without refetching — the
 * map redraws from `data`, so a reload would flash the whole globe. A country that was
 * merely planned moves over to the visited tally instead of being added twice.
 * Shared by every mark flow (map click, search, mobile popup) so none of them can drift.
 */
export function withCountryMarkedVisited(prev: AtlasData, code: string): AtlasData {
  const existing = prev.countries.find(c => c.code === code)
  if (existing && countryStatus(existing) === 'visited') return prev
  const cont = continentForCountry(code)
  const wasPlanned = !!existing
  return {
    ...prev,
    countries: existing
      ? prev.countries.map(c => (c.code === code ? { ...c, status: 'visited' as const } : c))
      : [...prev.countries, { code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null, status: 'visited' as const }],
    stats: {
      ...prev.stats,
      totalCountries: prev.stats.totalCountries + 1,
      ...(wasPlanned ? { totalCountriesPlanned: Math.max(0, (prev.stats.totalCountriesPlanned || 0) - 1) } : {}),
    },
    continents: { ...prev.continents, [cont]: (prev.continents?.[cont] || 0) + 1 },
    ...(wasPlanned
      ? { continentsPlanned: { ...prev.continentsPlanned, [cont]: Math.max(0, (prev.continentsPlanned?.[cont] || 0) - 1) } }
      : {}),
  }
}

/** A geocoded hit in the atlas search box (#1115), before it is resolved to a region. */
export interface AtlasPlaceHit {
  name: string
  address: string | null
  lat: number
  lng: number
}

export interface BucketItem {
  id: number
  name: string
  lat: number | null
  lng: number | null
  country_code: string | null
  notes: string | null
  target_date: string | null
}

// Normalize a region name for matching: strip diacritics (the geocoder and the
// bundled boundaries don't always agree on accenting, e.g. "Ile-de-France" vs
// "Île-de-France") and fold dash variants (en/em dash vs hyphen) to a plain
// hyphen, then lowercase. Used to compare a place's cached region_name against
// the admin-1 GeoJSON's name/name_en when the region code itself doesn't match.
export function normalizeRegionName(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[‐-―]/g, '-') // fold hyphen/dash variants to "-"
    // Collapse spaced dashes ("A – B" vs "A-B"). split/trim, not /\s*-\s*/g:
    // that pattern backtracks over every space in a dash-less name (quadratic).
    .split('-').map(part => part.trim()).join('-')
    .toLowerCase()
    .trim()
}

// SQLite's lower() folds ASCII only, and the server's duplicate check runs the
// name through it — folding more here would block names the server accepts.
function foldBucketName(name: string): string {
  return name.trim().replace(/[A-Z]/g, c => c.toLowerCase())
}

/**
 * The entry this wish would duplicate, if any (#1898). Identity mirrors the
 * server: name (trimmed, ASCII case-insensitive), country, target date and
 * coordinates — so a different target date stays a separate, allowed entry.
 * Empty string and null both mean "not set" because the forms send ''.
 * The server answers 409 either way; this is what lets the UI say so up front,
 * in the user's language and without losing what they typed.
 */
export function findBucketDuplicate(
  items: BucketItem[],
  candidate: Pick<BucketItem, 'name' | 'country_code' | 'target_date' | 'lat' | 'lng'>,
): BucketItem | undefined {
  const name = foldBucketName(candidate.name)
  const country = candidate.country_code || null
  const targetDate = candidate.target_date || null
  const lat = candidate.lat ?? null
  const lng = candidate.lng ?? null
  return items.find(
    item =>
      foldBucketName(item.name) === name &&
      (item.country_code || null) === country &&
      (item.target_date || null) === targetDate &&
      (item.lat ?? null) === lat &&
      (item.lng ?? null) === lng,
  )
}

/** A bucket-list write the server refused as a duplicate (#1898). */
export function isBucketDuplicateError(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 409
}

// Alpha-3 codes for bucket-list countries that aren't visited yet — the Atlas
// map renders these with a hatched fill so they read as "on the wishlist"
// instead of blending into the flat unvisited gray.
export function wishlistA3Codes(bucketList: BucketItem[], visitedA3: Set<string>): Set<string> {
  const result = new Set<string>()
  for (const item of bucketList) {
    const a3 = item.country_code ? A2_TO_A3[item.country_code] : undefined
    if (a3 && !visitedA3.has(a3)) result.add(a3)
  }
  return result
}

// Palette for the Atlas map's country fills (visited: solid, wishlist: hatched).
export const COUNTRY_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e', '#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#0ea5e9', '#e11d48', '#0d9488', '#7c3aed', '#2563eb', '#dc2626', '#059669', '#d946ef']

// Deterministic color for a country code, hashed from the code itself so a country
// keeps the same color forever — regardless of visit order or how many other
// countries are visited/wishlisted. An order/index-based scheme would reshuffle
// every other country's color each time one more was marked or added.
export function countryColor(a3: string): string {
  let hash = 0
  for (let i = 0; i < a3.length; i++) hash = (hash * 31 + a3.codePointAt(i)) >>> 0
  return COUNTRY_COLORS[hash % COUNTRY_COLORS.length]
}

// How many countries' worth of admin-1 geometry the region layer keeps around.
// Panning back to a country you just left has to stay free, but a session that
// wanders across a continent used to hold on to every country it ever touched,
// a few hundred polygons each (#1950). A dozen covers the countries around any
// one view, and /regions/geo is served with a day of cache headroom, so the
// countries that do fall out come back without hitting the database.
export const REGION_CACHE_MAX = 12

/**
 * Which cached countries to drop, given the cache order (least recently viewed
 * first) and the codes that have to stay. Never returns a code from `keep`: when
 * the countries in view alone exceed the cap it returns a shorter list instead of
 * dropping geometry that is on screen, which is what stops panning across a big
 * country turning into fetch / evict / refetch.
 */
export function regionCacheEvictions(order: string[], keep: Set<string>, max: number): string[] {
  const drop: string[] = []
  let remaining = order.length
  for (const code of order) {
    if (remaining <= max) break
    if (keep.has(code)) continue
    drop.push(code)
    remaining -= 1
  }
  return drop
}

// Convert country code to flag emoji
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.codePointAt(0) - 65))
}

// ISO-3166-1 alpha-2 → alpha-3 mapping. Two sources feed this table:
//   1. Hardcoded entries below — REQUIRED for any country whose GeoJSON record has no
//      usable ISO_A2: '-99' in Natural Earth data (e.g. France=FRA, Norway=NOR) or null
//      in the geoBoundaries bundle (Kosovo=XKX, a user-assigned ISO code, #1609). The
//      runtime augmentation loop (see geoData useEffect below) skips such features, so
//      those countries MUST be listed here or the A3 fallbacks will silently fail.
//   2. Runtime augmentation — the geoData load effect adds entries for every feature
//      that has a valid ISO_A2, covering territories not present below.
export const A2_TO_A3: Record<string, string> = {"AF":"AFG","AL":"ALB","DZ":"DZA","AD":"AND","AO":"AGO","AG":"ATG","AR":"ARG","AM":"ARM","AU":"AUS","AT":"AUT","AZ":"AZE","BS":"BHS","BH":"BHR","BD":"BGD","BB":"BRB","BY":"BLR","BE":"BEL","BZ":"BLZ","BJ":"BEN","BT":"BTN","BO":"BOL","BA":"BIH","BW":"BWA","BR":"BRA","BN":"BRN","BG":"BGR","BF":"BFA","BI":"BDI","CV":"CPV","KH":"KHM","CM":"CMR","CA":"CAN","CF":"CAF","TD":"TCD","CL":"CHL","CN":"CHN","CO":"COL","KM":"COM","CG":"COG","CD":"COD","CR":"CRI","CI":"CIV","HR":"HRV","CU":"CUB","CY":"CYP","CZ":"CZE","DK":"DNK","DJ":"DJI","DM":"DMA","DO":"DOM","EC":"ECU","EG":"EGY","SV":"SLV","GQ":"GNQ","ER":"ERI","EE":"EST","SZ":"SWZ","ET":"ETH","FJ":"FJI","FI":"FIN","FR":"FRA","GA":"GAB","GM":"GMB","GE":"GEO","DE":"DEU","GH":"GHA","GR":"GRC","GD":"GRD","GT":"GTM","GN":"GIN","GW":"GNB","GY":"GUY","HT":"HTI","HN":"HND","HU":"HUN","IS":"ISL","IN":"IND","ID":"IDN","IR":"IRN","IQ":"IRQ","IE":"IRL","IL":"ISR","IT":"ITA","JM":"JAM","JP":"JPN","JO":"JOR","KZ":"KAZ","KE":"KEN","KI":"KIR","XK":"XKX","KP":"PRK","KR":"KOR","KW":"KWT","KG":"KGZ","LA":"LAO","LV":"LVA","LB":"LBN","LS":"LSO","LR":"LBR","LY":"LBY","LI":"LIE","LT":"LTU","LU":"LUX","MG":"MDG","MW":"MWI","MY":"MYS","MV":"MDV","ML":"MLI","MT":"MLT","MR":"MRT","MU":"MUS","MX":"MEX","MD":"MDA","MN":"MNG","ME":"MNE","MA":"MAR","MZ":"MOZ","MM":"MMR","NA":"NAM","NP":"NPL","NL":"NLD","NZ":"NZL","NI":"NIC","NE":"NER","NG":"NGA","MK":"MKD","NO":"NOR","OM":"OMN","PK":"PAK","PA":"PAN","PG":"PNG","PY":"PRY","PE":"PER","PH":"PHL","PL":"POL","PT":"PRT","QA":"QAT","RO":"ROU","RU":"RUS","RW":"RWA","SA":"SAU","SN":"SEN","RS":"SRB","SL":"SLE","SG":"SGP","SK":"SVK","SI":"SVN","SB":"SLB","SO":"SOM","ZA":"ZAF","SS":"SSD","ES":"ESP","LK":"LKA","SD":"SDN","SR":"SUR","SE":"SWE","CH":"CHE","SY":"SYR","TW":"TWN","TJ":"TJK","TZ":"TZA","TH":"THA","TL":"TLS","TG":"TGO","TT":"TTO","TN":"TUN","TR":"TUR","TM":"TKM","UG":"UGA","UA":"UKR","AE":"ARE","GB":"GBR","US":"USA","UY":"URY","UZ":"UZB","VU":"VUT","VE":"VEN","VN":"VNM","YE":"YEM","ZM":"ZMB","ZW":"ZWE"}
