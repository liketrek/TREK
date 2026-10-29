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
import { toApiLang } from '../maps.helpers';
import type { NominatimResult, NominatimReverse } from './osm.client';

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
  }),
});

export const photonAnswerSchema = z.object({ features: z.array(photonFeatureSchema) });

export type PhotonFeature = z.infer<typeof photonFeatureSchema>;
type PhotonProperties = PhotonFeature['properties'];

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
