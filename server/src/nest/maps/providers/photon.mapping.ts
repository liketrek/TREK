/**
 * Photon's answers in the shape Nominatim gives, so search and reverse read
 * the same to every caller whichever of the two answered.
 *
 * Photon is a GeoJSON service: one feature per hit, the coordinate as
 * [lon, lat], the OSM type as a letter and the address as flat properties.
 * Nominatim names the type in full, spells the coordinate as text and carries
 * the address as one comma-joined line. The OsmClient keeps one mapping from
 * Nominatim's shape to TREK's place record, and this file feeds it.
 */
import { foldName, leadsHere } from '../maps-merge.helpers';
import { toApiLang } from '../maps.helpers';
import type { NominatimResult, NominatimReverse } from './osm.client';
import type { MapsAutocompleteResult } from '@trek/shared';

import { z } from 'zod';

/** The languages the TREK services imported names for; anything else gets the names used on the spot. */
const PHOTON_LANGS: ReadonlySet<string> = new Set([
  'ar',
  'az',
  'ca',
  'cs',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt',
  'ru',
  'sk',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
  'zh',
]);

const OSM_TYPES: Readonly<Record<string, string>> = { N: 'node', W: 'way', R: 'relation' };

const text = z.string().optional();

const photonFeatureSchema = z.object({
  geometry: z.object({ coordinates: z.array(z.number()).min(2) }),
  properties: z.object({
    osm_type: text,
    osm_id: z.number().int().optional(),
    osm_key: text,
    osm_value: text,
    type: text,
    name: text,
    housenumber: text,
    street: text,
    postcode: text,
    locality: text,
    district: text,
    city: text,
    county: text,
    state: text,
    country: text,
    countrycode: text,
    extra: z.record(z.string(), z.unknown()).optional(),
    // [west, north, east, south], on areas only.
    extent: z.array(z.number()).length(4).optional(),
  }),
});

export const photonAnswerSchema = z.object({ features: z.array(photonFeatureSchema) });

export type PhotonFeature = z.infer<typeof photonFeatureSchema>;
type PhotonProperties = PhotonFeature['properties'];
type Suggestion = MapsAutocompleteResult['suggestions'][number];

/**
 * The language Photon is asked in: TREK's code through toApiLang (`br` is
 * Brazilian Portuguese, `gr` Greek), cut to its base (`pt-BR` to `pt`, `zh-TW`
 * to `zh`). A language the import has no names for, or none at all, asks for
 * `default`, the names written on the spot.
 */
export function photonLang(lang: string | undefined): string {
  if (!lang?.trim()) return 'default';
  const base = toApiLang(lang).split('-')[0].toLowerCase();
  return PHOTON_LANGS.has(base) ? base : 'default';
}

/**
 * The address line Nominatim calls `display_name`: the place's own name first,
 * then house number and street as parts of their own ("12, Main Street", the
 * way Nominatim writes them), quarter, town, county, region, postcode and
 * country. A part that repeats one before it is left out, so Berlin reads
 * "Berlin, Germany" rather than naming the city state twice.
 */
export function photonDisplayName(p: PhotonProperties): string {
  const parts = [
    p.name,
    p.housenumber,
    p.street,
    p.district ?? p.locality,
    p.city,
    p.county,
    p.state,
    p.postcode,
    p.country,
  ];
  const seen = new Set<string>();
  for (const part of parts) {
    const value = part?.trim();
    if (value) seen.add(value);
  }
  return [...seen].join(', ');
}

/** A search hit as Nominatim would have answered it, or null for one without an OpenStreetMap id. */
export function asNominatimHit(feature: PhotonFeature): NominatimResult | null {
  const p = feature.properties;
  const osmType = p.osm_type ? OSM_TYPES[p.osm_type] : undefined;
  if (!osmType || p.osm_id === undefined) return null;
  const [lon, lat] = feature.geometry.coordinates;
  return {
    osm_type: osmType,
    osm_id: String(p.osm_id),
    class: p.osm_key,
    type: p.osm_value,
    name: p.name,
    display_name: photonDisplayName(p),
    lat: String(lat),
    lon: String(lon),
    extratags: stringTags(p.extra),
  };
}

/**
 * A search hit as one row of the suggestion list, in the id form the details
 * lookup reads (`node:123`, as the index's OpenStreetMap layer hands it over),
 * or null for one without an id or a name to show.
 */
export function asSuggestion(feature: PhotonFeature): Suggestion | null {
  const hit = asNominatimHit(feature);
  const [lng, lat] = feature.geometry.coordinates;
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // A house without a name is titled by its number, as Nominatim does, and
  // the rest of the line says where it is.
  const name = feature.properties.name?.trim();
  const [head = '', ...rest] = suggestionLine(feature.properties);
  const mainText = name || head;
  if (!mainText) return null;
  return {
    placeId: `${hit.osm_type}:${hit.osm_id}`,
    mainText,
    secondaryText: (name ? [head, ...rest] : rest).filter(Boolean).join(', '),
    source: 'openstreetmap',
    lat,
    lng,
  };
}

/**
 * Where a suggestion is, below its name: house number and street, quarter,
 * town and country, and the region only where there is no town. Shorter than
 * the address line on purpose. The rows of the index beside it read "Mitte,
 * Germany", and a postcode or a county ("Троицкий муниципальный округ", which
 * has no English name) next to them only made the list harder to read.
 */
function suggestionLine(p: PhotonProperties): string[] {
  const name = p.name?.trim();
  const parts = [p.housenumber, p.street, p.district ?? p.locality, p.city, p.city ? undefined : p.state, p.country];
  const seen = new Set<string>(name ? [name] : []);
  const line: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      line.push(value);
    }
  }
  return line;
}

/**
 * Photon's hits with notable places before their namesakes. Photon ranks an
 * artwork called "Neuschwanstein" above the castle and a street called
 * "Colosseum" above the monument; a Wikidata link marks the place people
 * mean, and streets, unlinked shops and unlinked artworks step back. Photon's
 * own order stays the base and breaks ties. Measured on 74 queries without a
 * context, the first hit went from 68 % to 76 % right, and from 61 % to 73 %
 * asked from a map somewhere else.
 */
export function rankFeatures(features: PhotonFeature[]): PhotonFeature[] {
  return features
    .map((feature, index) => ({ feature, index, score: notability(feature.properties) - index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ feature }) => feature);
}

function notability(p: PhotonProperties): number {
  const linked = typeof p.extra?.wikidata === 'string';
  let score = linked ? 2.5 : 0;
  if (p.osm_key === 'highway') score -= 2.5;
  if (!linked && (p.osm_key === 'shop' || p.osm_key === 'office' || p.osm_key === 'craft')) score -= 1.5;
  if (!linked && p.osm_key === 'tourism' && p.osm_value === 'artwork') score -= 2;
  return score;
}

/**
 * The place a name stands for, which the result lists put first
 * (`mergeRanked`): a country or a region, which is what its name means
 * wherever the traveller is looking; a town, or a sight with a Wikidata link,
 * which is what its name means from not too far away. The index beside Photon
 * is a dataset of businesses and answers a town's name with shops that carry
 * it, so without a lead "Tokyo" opened on a restaurant chain.
 */
export interface PhotonLead {
  placeId: string;
  name: string;
  reach: 'everywhere' | 'nearby';
  /** What it is: Photon's value for the place (`city`, `town`, `municipality`), or `landmark` for a sight. */
  kind: string;
  lat: number;
  lng: number;
  /** [west, north, east, south], or null where Photon gave none. */
  extent: [number, number, number, number] | null;
}

const REGIONS = new Set(['country', 'state', 'province', 'region', 'territory']);
/** An island is what its name means too: Spitzbergen, Gran Canaria. */
const ISLANDS = new Set(['island', 'archipelago']);

/** The keys a sight is filed under; `landuse` is left out, it named a field in Italy "Eiffel". */
const SIGHT_KEYS = new Set([
  'tourism',
  'historic',
  'aeroway',
  'man_made',
  'building',
  'railway',
  'natural',
  'amenity',
  'leisure',
  'bridge',
  'waterway',
]);

/** A three-letter code in capitals is an airport to a traveller, never the village or the country it spells. */
const AIRPORT_CODE = /^[A-Z]{3}$/;

export function asLead(feature: PhotonFeature): PhotonLead | null {
  const p = feature.properties;
  if (p.osm_key !== 'place' && p.osm_key !== 'boundary') return null;
  const reach =
    REGIONS.has(p.osm_value ?? '') || p.type === 'country' || p.type === 'state'
      ? 'everywhere'
      : p.type === 'city' || p.type === 'county' || ISLANDS.has(p.osm_value ?? '')
        ? 'nearby'
        : null;
  const row = reach ? asSuggestion(feature) : null;
  if (!row || !reach || row.lat === undefined || row.lng === undefined) return null;
  return {
    placeId: row.placeId,
    name: row.mainText,
    reach,
    // A town filed as an administrative boundary (Mérida) is a town.
    kind: (p.osm_key === 'boundary' ? p.type : p.osm_value) ?? p.type ?? 'place',
    lat: row.lat,
    lng: row.lng,
    // The schema holds it to four numbers.
    extent: (p.extent as PhotonLead['extent']) ?? null,
  };
}

/** A sight as a lead: one with a Wikidata link, under a key sights are filed under. */
function asSightLead(feature: PhotonFeature): PhotonLead | null {
  const p = feature.properties;
  if (typeof p.extra?.wikidata !== 'string' || !SIGHT_KEYS.has(p.osm_key ?? '')) return null;
  const row = asSuggestion(feature);
  if (!row || row.lat === undefined || row.lng === undefined) return null;
  return {
    placeId: row.placeId,
    name: row.mainText,
    reach: 'nearby',
    kind: 'landmark',
    lat: row.lat,
    lng: row.lng,
    extent: null,
  };
}

/**
 * The lead of a Photon answer (ranked by `rankFeatures`), or null. A country
 * or a region in first place leads under any name, which keeps an exonym
 * ("Mauretanien" answers Mauritania); anything else among the first three
 * leads only when it is called what was typed, or a typo of it, when it may
 * lead from where the traveller is looking (`leadsHere`), and when no
 * namesake ranks above it. Without the name check "Paramraibo" opened on a
 * district called Centrum and "Sagrada Familia" on a municipality in Brazil.
 */
export function pickLead(
  features: PhotonFeature[],
  query: string,
  bias?: { lat: number; lng: number },
): PhotonLead | null {
  if (AIRPORT_CODE.test(query.trim())) return null;
  const first = features[0] ? asLead(features[0]) : null;
  if (first?.reach === 'everywhere') return first;
  for (const feature of features.slice(0, 3)) {
    const lead = asLead(feature) ?? asSightLead(feature);
    const named = nameLike(query, lead?.name ?? feature.properties.name ?? '');
    if (lead && named && leadsHere(lead, bias)) return lead;
    // A place of that name Photon ranks higher and that may not lead (the
    // borough of Greenwich in London, a quarter, a municipality with nothing
    // to say where the traveller is) outranks the ones behind it: leading with
    // the next Greenwich put the town in Connecticut above London. A street or
    // a shop of the name does not.
    if (named && (feature.properties.osm_key === 'place' || feature.properties.osm_key === 'boundary')) return null;
  }
  return null;
}

/** Whether a name is what was typed: the same, the start of it, a word of it, or a typo away. */
export function nameLike(query: string, name: string): boolean {
  const typed = foldName(query);
  const called = foldName(name);
  if (typed.length < 3 || !called) return false;
  if (called.startsWith(typed) || typed.startsWith(called) || called.includes(` ${typed}`)) return true;
  return editDistance(typed, called) <= (typed.length >= 8 ? 2 : 1);
}

/**
 * Edits between two strings, a swap of neighbours counting as one: the
 * optimal string alignment distance. "Paramraibo" is one from "Paramaribo".
 */
export function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/**
 * The point a reverse lookup found, in the fields Nominatim's reverse answer
 * has. A town itself is its own `city`, and a named place is filed under its
 * main tag the way Nominatim files it (`tourism` for the Eiffel Tower), so the
 * readers that look for a sight's name before the road find it here too.
 */
export function asNominatimReverse(feature: PhotonFeature): NominatimReverse {
  const p = feature.properties;
  const address: Record<string, string> = {};
  const put = (key: string, value: string | undefined): void => {
    if (value?.trim() && !(key in address)) address[key] = value.trim();
  };
  put('road', p.street);
  put('house_number', p.housenumber);
  put('postcode', p.postcode);
  put('suburb', p.district ?? p.locality);
  put('city', p.type === 'city' ? p.name : p.city);
  put('county', p.county);
  put('state', p.state);
  put('country', p.country);
  put('country_code', p.countrycode?.toLowerCase());
  if (p.osm_key && p.type !== 'city') put(p.osm_key, p.name);
  const displayName = photonDisplayName(p);
  return { display_name: displayName || undefined, name: p.name, address };
}

/** The extra tags Photon passes through, the text ones only. */
function stringTags(extra: Record<string, unknown> | undefined): Record<string, string> | null {
  if (!extra) return null;
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (typeof value === 'string') tags[key] = value;
  }
  return tags;
}
