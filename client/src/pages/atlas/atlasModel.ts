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
}

export interface AtlasStats {
  totalTrips: number
  totalPlaces: number
  totalCountries: number
  totalDays: number
  totalCities?: number
}

export interface AtlasData {
  countries: AtlasCountry[]
  stats: AtlasStats
  mostVisited?: AtlasCountry | null
  continents?: Record<string, number>
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
    .replace(/\s*-\s*/g, '-') // collapse spaced dashes ("A – B" vs "A-B")
    .toLowerCase()
    .trim()
}

// Convert country code to flag emoji
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
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
