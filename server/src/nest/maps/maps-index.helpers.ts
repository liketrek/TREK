/**
 * The TREK Places index answers in its own shape; these turn its rows into the
 * shapes MapsService already answers with, so the client and the map renderer
 * need no branch per source. Pure: the calls themselves are trek-places.client's,
 * the decision to make them is MapsService's.
 */
import { getCountryFromCoords } from '../../utils/country-borders';
import { buildOsmDetails, parsePoiCategories, samePlace, toApiLang } from './maps.helpers';
import { POI_RESULT_CAP, type PoiSearchResult } from './providers/osm.client';
import {
  INDEX_MAX_CATEGORY_CHARS,
  INDEX_MAX_LIMIT,
  POI_CATEGORY_TO_TREK,
  indexRowTerm,
  isOsmHit,
  osmPlaceId,
  toPlaceRecord,
  type TrekPlace,
  type TrekSearchHit,
} from './trek-places.client';
import { normalizePlaceWebsite } from '@trek/shared';
import type { MapsAutocompleteResult } from '@trek/shared';

type PoiBbox = { south: number; west: number; north: number; east: number };

/** Every term the index is asked by, whichever kind asks for it. */
const EVERY_TERM = Object.values(POI_CATEGORY_TO_TREK).flat();

/** What one POI request asks the index, and how its answer is labelled. */
export interface IndexPoiPlan {
  wanted: string[];
  terms: string[];
  /** The category each term answers for, so a request can be cut per category. */
  kindOfTerm: ReadonlyMap<string, string>;
  lat: number;
  lng: number;
  radius: number;
  /** Half the viewport diagonal; a radius below it means the view was narrowed. */
  reach: number;
  cap: number;
  labelFor: (leaf: string | null, path: string | null) => string | undefined;
}

/** Whether the index has terms for a category, so it can answer it at all. */
export function indexKnowsCategory(key: string): boolean {
  return (POI_CATEGORY_TO_TREK[key]?.length ?? 0) > 0;
}

/**
 * The index query for a POI request, or null when the index cannot answer it.
 *
 * One or several categories, the way searchOverpassPois reads them. The
 * corridor search sends a comma-separated list, and looking the whole string up
 * as one key missed every time — so every corridor query fell through to
 * Overpass, on the one path where that hurts most: a single search fans out over
 * sixteen boxes, and each of those races four public mirrors.
 */
export function indexPoiPlan(category: string, bbox: PoiBbox, limit: number): IndexPoiPlan | null {
  const lat = (bbox.south + bbox.north) / 2;
  const lng = (bbox.west + bbox.east) / 2;
  // Half the diagonal, so the circle covers the viewport corners rather
  // than leaving the edges of the map empty.
  const reach = Math.round(
    Math.hypot(
      (bbox.north - bbox.south) * 111_320,
      (bbox.east - bbox.west) * 111_320 * Math.cos((lat * Math.PI) / 180),
    ) / 2,
  );
  return indexPoiPlanAround(category, { lat, lng }, reach, limit);
}

/** The same plan for a circle the caller chose: a viewport's, or one bead of a line searched along. */
export function indexPoiPlanAround(
  category: string,
  centre: { lat: number; lng: number },
  reach: number,
  limit: number,
): IndexPoiPlan | null {
  const wanted = parsePoiCategories(category);
  // Which category each Overture term belongs to, so a hit can be labelled
  // with the category that actually produced it rather than with the whole
  // list. The client colours and groups its markers by that field.
  const categoryOfTerm = new Map<string, string>();
  for (const key of wanted) {
    for (const term of POI_CATEGORY_TO_TREK[key] ?? []) categoryOfTerm.set(term, key);
  }
  // All or nothing: a category the index has no terms for has to be answered
  // by Overpass, and a mixed answer would silently drop it.
  if (wanted.length === 0 || !wanted.every(indexKnowsCategory)) return null;
  // A row belongs to the term whose path it lies under, not to one it is merely
  // spelled like: the leaf alone is rarely a term (`italian_restaurant` sits
  // under `food_and_drink>restaurant`), and falling through to wanted[0] then
  // labelled it with whichever pill the user tapped first, so a trattoria came
  // back as a petrol station. The most specific term wins, so a water park
  // answers the activity pill rather than the park it sits under.
  const labelFor = (leaf: string | null, path: string | null): string | undefined => {
    const term = indexRowTerm(categoryOfTerm.keys(), leaf, path);
    return term === undefined ? undefined : categoryOfTerm.get(term);
  };
  const radius = Math.min(20000, Math.max(300, reach));
  // The same budget the Overpass path spends: per category, capped, so a
  // mixed search does not spend the whole allowance on whichever kind
  // happens to be densest.
  const cap = Math.min(limit * wanted.length, POI_RESULT_CAP);
  const terms = [...categoryOfTerm.keys()];
  return { wanted, terms, kindOfTerm: categoryOfTerm, lat: centre.lat, lng: centre.lng, radius, reach, cap, labelFor };
}

/** One request to the index: the comma-joined terms it asks for and how many rows. */
interface IndexRequest {
  category: string;
  limit: number;
}

/** Terms joined with commas into as few lists as the service takes, none longer than its limit. */
function packTerms(terms: readonly string[]): string[] {
  return terms.reduce<string[]>((lists, term) => {
    const last = lists.at(-1);
    if (last !== undefined && last.length + 1 + term.length <= INDEX_MAX_CATEGORY_CHARS) {
      lists[lists.length - 1] = `${last},${term}`;
    } else lists.push(term);
    return lists;
  }, []);
}

/**
 * The requests that answer a plan within the service's limits. One request,
 * exactly as before, while the whole plan fits; otherwise one per category
 * (its terms packed into lists the service takes), each with that category's
 * share of the budget. A plan of several categories used to ask for their
 * budgets together, and above 100 rows the service refused the request.
 */
export function indexRequests(plan: IndexPoiPlan): IndexRequest[] {
  const all = plan.terms.join(',');
  if (plan.cap <= INDEX_MAX_LIMIT && all.length <= INDEX_MAX_CATEGORY_CHARS) {
    return [{ category: all, limit: plan.cap }];
  }
  return indexRequestsPerKind(plan);
}

/**
 * One request per category, each with its share of the budget and its terms
 * packed into lists the service takes. The search along a tour always asks
 * this way, so the restaurants of a city centre cannot take the place of its
 * one market among the nearest rows.
 */
export function indexRequestsPerKind(plan: IndexPoiPlan): IndexRequest[] {
  const share = Math.max(1, Math.min(INDEX_MAX_LIMIT, Math.floor(plan.cap / plan.wanted.length)));
  return plan.wanted.flatMap((key) =>
    packTerms(plan.terms.filter((term) => plan.kindOfTerm.get(term) === key)).map((category) => ({
      category,
      limit: share,
    })),
  );
}

/**
 * Whether a row's most specific known term is one an asked kind asks for. A
 * water park lies under the parks' path, but `activity` names its own path for
 * it, so a search for parks alone does not list it; a row no term knows is
 * left to {@link belonging}. The search along a tour asks this; the explore
 * pill keeps every row its pills' paths hold.
 */
export function ownedByAsked(
  row: { category: string | null; categoryPath: string | null },
  asked: readonly string[],
): boolean {
  const term = indexRowTerm(EVERY_TERM, row.category, row.categoryPath);
  return term === undefined || asked.some((kind) => POI_CATEGORY_TO_TREK[kind]?.includes(term));
}

/** The rows of several pages as one list, each place once, in the order they came. */
export function mergeIndexPages<T extends { gers: string }>(pages: readonly T[][]): T[] {
  const byId = new Map<string, T>();
  for (const row of pages.flat()) if (!byId.has(row.gers)) byId.set(row.gers, row);
  return [...byId.values()];
}

/**
 * The index's POI hits in the shape the Overpass path produces, so the client
 * and the map renderer need no branch — but named as what it is. Overture is not
 * OpenStreetMap: it carries OSM among other sources under other licences, and
 * this branch argues elsewhere that naming a source is a licence obligation. The
 * wire contract keeps `source` an open string, so widening it costs nothing.
 *
 * One thing the index cannot do is translate a name. The Overpass path picks
 * `name:<lang>` and falls back to `int_name`; the service takes a language now,
 * but only puts localities into it, because Overture carries no translated
 * names. A German user exploring Tokyo therefore still gets the Japanese
 * primary names here, and the POI pins show no locality to translate.
 */
export function indexPoiAnswer(
  found: (TrekPlace & { categoryPath?: string | null })[],
  plan: IndexPoiPlan,
  pageFull: boolean,
): PoiSearchResult {
  const { wanted, labelFor, cap, radius, reach } = plan;
  // Pages asked per category can together run past the cap.
  const kept = belonging(found, plan).slice(0, cap);
  return {
    pois: kept.map((p) => ({
      osm_id: `gers:${p.gers}`,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      // The category that produced the hit, not the list that was
      // asked for: a mixed search must not label a petrol station as
      // "fuel,charging,restaurant".
      category: labelFor(p.category ?? null, p.categoryPath ?? null) ?? wanted[0],
      poi_type: p.category ?? wanted[0],
      address: p.address?.freeform ?? null,
      website: normalizePlaceWebsite(p.contact?.website),
      phone: p.contact?.phone ?? null,
      opening_hours: p.hours?.osm ?? null,
      // The index carries the chain and its Wikidata item, which is what
      // the logo on the pin is looked up from — so a branch of a chain
      // gets its own mark here exactly as it does on the Overpass path.
      brand: p.brand?.name ?? null,
      brand_wikidata: p.brand?.wikidata ?? null,
      // Sockets are an OSM thing; the index has no charging fields, so
      // a station answered from here reports "not stated" rather than
      // claiming it offers nothing.
      charging: null,
      // The index has no cuisine field, so this null is the truth
      // rather than a field being dropped on the way through.
      cuisine: null,
      source: 'trek-places' as const,
    })),
    source: 'trek-places' as const,
    // The page the index sent, not what was left of it: a full page means more
    // places, however many of them this one had to leave out. Pages asked per
    // category say so for themselves, and their sum may run past the cap.
    truncated: pageFull || found.length > cap,
    // A wide viewport is narrowed here too, and the caller is told so
    // for the same reason the Overpass path tells it.
    clamped: radius < reach,
  };
}

/**
 * The rows that belong to a pill the request asked for. The index matches its
 * terms inside the category text, so a near miss can still come back, and it
 * is left out here (#2663). A row the index holds without any category cannot
 * be told either way and stays, as it always has.
 */
export function belonging<T extends TrekPlace & { categoryPath?: string | null }>(found: T[], plan: IndexPoiPlan): T[] {
  return found.filter(
    (p) => (!p.category && !p.categoryPath) || plan.labelFor(p.category ?? null, p.categoryPath ?? null) !== undefined,
  );
}

const regionNamesByLang = new Map<string, Intl.DisplayNames | null>();

/**
 * The index hands over an ISO code ("JP"), which is not what a person reads a
 * place by. Named through Intl in the language of the search, the way
 * journey-domain names countries. A code the runtime cannot name, or a locale
 * it does not know, leaves the code as it came.
 */
function countryName(code: string | null | undefined, lang: string | undefined): string | null {
  if (!code) return null;
  const locale = toApiLang(lang);
  if (!regionNamesByLang.has(locale)) {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' });
    } catch {
      // Not a locale tag, or a Node built without full ICU.
    }
    regionNamesByLang.set(locale, names);
  }
  try {
    return regionNamesByLang.get(locale)?.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Autocomplete rows out of the index and its OpenStreetMap layer, interleaved as they came.
 *
 * A layer row for a place the index already listed is dropped, by the same
 * rule the search list merges its two sources with (#2592). Both copies at the
 * same spot read as two shops, and the explicit search showed it once. The
 * index's copy stays, because it carries the stable id and the contact details.
 */
export function indexSuggestions(found: TrekSearchHit[], lang?: string): MapsAutocompleteResult['suggestions'] {
  const indexed = found.filter((p) => !isOsmHit(p));
  const listed = (p: TrekSearchHit): boolean =>
    !isOsmHit(p) ||
    !indexed.some(
      (i) => samePlace(i, p) || (!!p.local_name && samePlace(i, { lat: p.lat, lng: p.lng, name: p.local_name })),
    );
  return found.filter(listed).map((p) =>
    isOsmHit(p)
      ? {
          // The service's own id form, translated into the one this
          // file already resolves. Leaving it as `osm:node/123` would
          // hand the client an id getPlaceDetails does not know, and
          // the failure would land after the user had picked it.
          placeId: osmPlaceId(p),
          mainText: p.name,
          // The layer carries no address, but asked with a language it
          // names the town the place is in, and that reads the way an
          // index row does: "Sumida, Japan" (#2592). The country comes
          // from the coordinate, which is all the layer has. Without a
          // locality the local name is what the place is called on the
          // spot, which is more use under a translated label than an
          // empty line.
          secondaryText: p.locality
            ? [p.locality, countryName(getCountryFromCoords(p.lat, p.lng), lang)].filter(Boolean).join(', ')
            : p.local_name && p.local_name !== p.name
              ? p.local_name
              : '',
          // Per row, because this list is two indexes interleaved.
          // The name above the list says `trek-places`, which is true
          // of the call and false of half the rows in it — the layer
          // is OpenStreetMap, and a reader deciding whether to trust
          // a suggestion is asking exactly that.
          source: 'openstreetmap',
          // Both indexes hand these over with the row. Carried rather
          // than dropped so picking a suggestion has something to fall
          // back on when the details lookup cannot answer.
          lat: p.lat,
          lng: p.lng,
        }
      : {
          placeId: `gers:${p.gers}`,
          mainText: p.name,
          secondaryText: [p.address?.locality, countryName(p.address?.country, lang)].filter(Boolean).join(', '),
          source: 'trek-places',
          lat: p.lat,
          lng: p.lng,
        },
  );
}

/**
 * The details record of a place picked out of the index, with what
 * OpenStreetMap knows about the same building filled in.
 *
 * What the index does not have, the free sources still do: cuisine,
 * wheelchair access, a menu link. OpenStreetMap has all of them for the same
 * building, and without this the details a user saw while adding the place
 * disappeared from its card afterwards, which reads like data loss. `osmTags`
 * is null when no OSM match passed the identity gates.
 */
export function indexPlaceDetails(
  found: TrekPlace,
  osmTags: Record<string, string> | null,
  placeId: string,
): Record<string, unknown> {
  const record = toPlaceRecord(found);
  // Hours the index read off the operator's own site, run through the same
  // expansion OSM's go through — the client reads a list of weekday lines,
  // not the raw syntax, and handing it two shapes for one field would be a
  // bug on every card that shows it.
  //
  // Measured across seven countries, OpenStreetMap has hours for 27.5
  // percent of gastronomy; this covers part of the rest. It is the
  // fallback, not the first choice: an OSM entry describes this exact
  // object and gets corrected by people who walked past, where a chain's
  // website often carries one set of hours for every branch.
  const fromSite =
    typeof found.hours?.osm === 'string' ? buildOsmDetails({ opening_hours: found.hours.osm }, '', '') : null;
  if (!osmTags) {
    return fromSite?.opening_hours
      ? {
          ...record,
          opening_hours: fromSite.opening_hours,
          open_now: fromSite.open_now,
          opening_periods: fromSite.opening_periods,
        }
      : record;
  }

  const osmDetails = buildOsmDetails(osmTags, '', '');
  const hoursFrom = osmDetails.opening_hours ? osmDetails : fromSite;
  return {
    // Index first: its name, coordinate and contact details are the ones
    // the user picked. OSM only fills what is still missing.
    ...osmDetails,
    ...record,
    opening_hours: hoursFrom?.opening_hours ?? null,
    open_now: hoursFrom?.open_now ?? null,
    opening_periods: hoursFrom?.opening_periods ?? null,
    website: record.website ?? osmDetails.website ?? null,
    phone: record.phone ?? osmDetails.phone ?? null,
    osm_id: placeId,
    source: 'trek-places',
  };
}
