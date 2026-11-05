/**
 * The search records OpenStreetMap answers are read into, and Photon's half of
 * the OpenStreetMap geocoding: search and suggestions with the lead they open
 * on, airport codes, the identity of a place by name and coordinate, the
 * reverse lookup and the details of an element Overpass placed.
 *
 * Free functions over the PhotonClient OsmClient holds, so OsmClient keeps one
 * face for its callers while Photon's rules live in one place. Where Photon is
 * the installation's geocoder these answer alone; Nominatim is OsmClient's
 * business, for installations without the TREK services.
 */
import { airportByCode, type AirportByCode } from '../../airports/airports.contract';
import { buildOsmDetails, haversineMetres, namesOverlap, toApiLang } from '../maps.helpers';
import type { NominatimResult, NominatimReverse, OverpassElement } from './osm.client';
import type { PhotonClient } from './photon.client';
import {
  asNominatimHit,
  asNominatimReverse,
  asSuggestion,
  photonDisplayName,
  pickLead,
  rankFeatures,
  type PhotonFeature,
  type PhotonLead,
} from './photon.mapping';
import { readWikiIdentity } from './wiki-identity';

type Bias = { lat: number; lng: number };

function nominatimCategory(item: { class?: string; type?: string }): string | null {
  if (!item.class || !item.type || item.type === 'yes') return null;
  return item.class === 'shop' ? `shop_${item.type}` : item.type;
}

/** A search row as TREK's place record. */
export function searchRecord(item: NominatimResult) {
  // Number.isFinite, not `|| null`: a place on the equator or prime
  // meridian has a legitimate 0 coordinate.
  const lat = Number.parseFloat(item.lat);
  const lng = Number.parseFloat(item.lon);
  return {
    google_place_id: null,
    google_ftid: null,
    osm_id: `${item.osm_type}:${item.osm_id}`,
    name: item.name || item.display_name?.split(',')[0] || '',
    address: item.display_name || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    rating: null,
    website: null,
    phone: null,
    // What the place is, so the add form can preselect a category (#2282). A shop's
    // value is the ware ("bakery"), so the key goes first and says it is a shop.
    category: nominatimCategory(item),
    source: 'openstreetmap',
    ...readWikiIdentity(item.extratags),
  };
}

function isHit(hit: NominatimResult | null): hit is NominatimResult {
  return hit !== null;
}

/**
 * Photon's search, its hits ranked (`rankFeatures`) and read as search
 * records, with the lead the list opens on; or null where Photon is not in
 * use or did not answer, and the caller is left to what it had before.
 */
export async function photonSearch(photon: PhotonClient, query: string, lang?: string, bias?: Bias) {
  const airport = airportOfCode(query);
  const found = await photon.search(airport?.name ?? query, { lang, bias: airport ?? bias });
  if (!found) return null;
  const ranked = rankFeatures(found);
  return {
    records: ranked.map(asNominatimHit).filter(isHit).map(searchRecord),
    lead: airport ? airportLead(ranked, airport) : pickLead(ranked, query, bias),
  };
}

/** Photon's suggestions with the lead the list opens on, or null when it goes without them. */
export async function photonSuggest(
  photon: PhotonClient,
  input: string,
  { lang, bias, signal }: { lang?: string; bias?: Bias; signal?: AbortSignal },
) {
  const airport = airportOfCode(input);
  const found = await photon.suggest(airport?.name ?? input, { lang, bias: airport ?? bias, signal });
  if (!found) return null;
  const ranked = rankFeatures(found);
  return {
    rows: ranked.map(asSuggestion).filter((row) => row !== null),
    lead: airport ? airportLead(ranked, airport) : pickLead(ranked, input, bias),
  };
}

/**
 * The airport a code in capitals names ("JFK", "LHR"), from the bundled
 * dataset. Photon does not search codes: "JFK" answered with an expressway,
 * "FRA" with France. So the code is asked for as the airport's name at its
 * coordinate, where the aerodrome comes first. Lower case is left alone, so
 * "Ber" typed on the way to "Berlin" stays a search for Berlin.
 */
function airportOfCode(query: string): AirportByCode | null {
  const code = query.trim();
  return /^[A-Z]{3}$/.test(code) ? airportByCode(code) : null;
}

/**
 * The aerodrome of a code's answer, within a few kilometres of the airport, as
 * a lead from everywhere; failing that a place there that calls itself an
 * airport, which is how OpenStreetMap files Haneda (an island named "Tokyo
 * International Airport").
 */
function airportLead(ranked: PhotonFeature[], airport: AirportByCode): PhotonLead | null {
  const near = ranked
    .map((feature) => ({ feature, row: asSuggestion(feature) }))
    .filter(
      (
        c,
      ): c is {
        feature: PhotonFeature;
        row: NonNullable<ReturnType<typeof asSuggestion>> & { lat: number; lng: number };
      } =>
        c.row?.lat !== undefined &&
        c.row.lng !== undefined &&
        haversineMetres(airport.lat, airport.lng, c.row.lat, c.row.lng) <= AIRPORT_MATCH_M,
    );
  const best =
    near.find((c) => c.feature.properties.osm_value === 'aerodrome') ??
    near.find((c) => c.feature.properties.osm_key === 'place' && AIRPORT_WORDS.test(c.row.mainText));
  if (!best) return null;
  const { placeId, mainText, lat, lng } = best.row;
  return { placeId, name: mainText, reach: 'everywhere', kind: 'airport', lat, lng, extent: null };
}

const AIRPORT_WORDS = /airport|flughafen|aéroport|aeropuerto|aeroporto|luchthaven|lotnisko|空港|机场|공항/iu;

/** How far an aerodrome may lie from the dataset's coordinate of its airport and still be it. */
const AIRPORT_MATCH_M = 8000;

// A station or a road named after a place is not the place, unless the name
// asked for one ("Hauptbahnhof", "Tor station").
const TRANSPORT_KEYS = new Set(['railway', 'public_transport', 'highway']);
const TRANSPORT_WORDS =
  /(?:^|[^\p{L}])(?:station|bahnhof|hbf|bhf|halt|haltestelle|stop|street|straße|strasse|road|weg|gare|estación|stazione)(?:$|[^\p{L}])|駅/iu;

export interface IdentityMatch {
  tags: Record<string, string>;
  osmUrl: string | null;
  matchedName: string;
}

/**
 * The identity of a place from Photon, inside a box of about 2 km around the
 * point and through the two gates OsmClient's identity match keeps: within
 * `maxDistanceM`, and a name that shares a substantial word. Photon has no
 * `importance`, so a Wikidata link stands in for it, and a station or a road
 * named after the place steps back unless the name asked for one: the
 * Brandenburg Gate before the station beside it. Measured on eight
 * landmarks: seven right, against five in Photon's order.
 */
export async function photonIdentity(
  photon: PhotonClient,
  {
    query,
    lat,
    lng,
    maxDistanceM,
    lang,
  }: { query: string; lat: number; lng: number; maxDistanceM: number; lang?: string },
): Promise<IdentityMatch | null> {
  const d = 0.02;
  const found = await photon.search(query, { lang, bbox: [lng - d, lat - d, lng + d, lat + d], limit: 5 });
  const transport = !TRANSPORT_WORDS.test(query);
  const best = (found ?? [])
    .map((feature) => ({ feature, hit: asNominatimHit(feature) }))
    .filter((c): c is { feature: PhotonFeature; hit: NominatimResult } => c.hit !== null)
    .map((c) => ({ ...c, metres: haversineMetres(lat, lng, Number(c.hit.lat), Number(c.hit.lon)) }))
    .filter((c) => c.metres <= maxDistanceM && namesOverlap(query, c.hit.name || ''))
    .map((c) => ({
      ...c,
      score:
        (c.hit.extratags?.wikidata ? -2 : 0) +
        (transport && TRANSPORT_KEYS.has(c.feature.properties.osm_key ?? '') ? 3 : 0),
    }))
    .sort((a, b) => a.score - b.score || a.metres - b.metres)[0];
  if (!best) return null;
  return {
    tags: best.hit.extratags ?? {},
    osmUrl: `https://www.openstreetmap.org/${best.hit.osm_type}/${best.hit.osm_id}`,
    matchedName: best.hit.name || query,
  };
}

// How far a reverse lookup that found nothing next to the point looks again.
const WIDE_REVERSE_KM = 50;

/**
 * Photon's nearest feature, or null where it has none. Photon looks within
 * a small radius by default and finds nothing in open country or at sea,
 * where Nominatim named the nearest object at any distance, so an empty
 * answer is asked once more with a radius of 50 km.
 */
export async function photonReverse(
  photon: PhotonClient,
  lat: number,
  lng: number,
  { lang, timeoutMs }: { lang?: string; timeoutMs?: number } = {},
): Promise<NominatimReverse | null> {
  const near = await photon.reverse(lat, lng, lang, timeoutMs);
  const found =
    near?.length === 0 ? await photon.reverse(lat, lng, lang, timeoutMs, { radius: WIDE_REVERSE_KM }) : near;
  return found?.[0] ? asNominatimReverse(found[0]) : null;
}

/**
 * The details of an element without Nominatim: Overpass gave the tags and
 * where the element is, Photon's reverse lookup at that point names it and
 * writes its address, the element itself where Photon has it. Null when
 * Overpass did not say where it is, so the caller can still try Nominatim.
 */
export async function photonElementDetails(
  photon: PhotonClient,
  element: OverpassElement,
  { osmType, osmId, placeId, lang }: { osmType: string; osmId: string; placeId: string; lang?: string },
): Promise<Record<string, unknown> | null> {
  const lat = element.center?.lat ?? element.lat;
  const lng = element.center?.lon ?? element.lon;
  if (lat === undefined || lng === undefined) return null;
  const near = await photon.reverse(lat, lng, lang, undefined, { limit: 10, radius: 0.3 });
  const self = near?.find((f) => asNominatimHit(f)?.osm_type === osmType && String(f.properties.osm_id) === osmId);
  const base = lang ? toApiLang(lang).split('-')[0] : '';
  const extra = self ? (asNominatimHit(self)?.extratags ?? {}) : {};
  return {
    ...buildOsmDetails({ ...extra, ...(element.tags ?? {}) }, osmType, osmId),
    name: (base && element.tags?.[`name:${base}`]) || self?.properties.name || element.tags?.name || '',
    address: self ? photonDisplayName(self.properties) : near?.[0] ? photonDisplayName(near[0].properties) : '',
    lat,
    lng,
    osm_id: placeId,
  };
}
