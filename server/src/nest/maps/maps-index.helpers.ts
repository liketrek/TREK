/**
 * The TREK Places index answers in its own shape; these turn its rows into the
 * shapes MapsService already answers with, so the client and the map renderer
 * need no branch per source. Pure: the calls themselves are trek-places.client's,
 * the decision to make them is MapsService's.
 */
import { buildOsmDetails, parsePoiCategories } from './maps.helpers';
import { POI_RESULT_CAP, type PoiSearchResult } from './providers/osm.client';
import {
  POI_CATEGORY_TO_TREK,
  isOsmHit,
  osmPlaceId,
  toPlaceRecord,
  type TrekPlace,
  type TrekSearchHit,
} from './trek-places.client';
import { normalizePlaceWebsite } from '@trek/shared';
import type { MapsAutocompleteResult } from '@trek/shared';

type PoiBbox = { south: number; west: number; north: number; east: number };

/** What one POI request asks the index, and how its answer is labelled. */
export interface IndexPoiPlan {
  wanted: string[];
  terms: string[];
  lat: number;
  lng: number;
  radius: number;
  /** Half the viewport diagonal; a radius below it means the view was narrowed. */
  reach: number;
  cap: number;
  labelFor: (leaf: string | null, path: string | null) => string | undefined;
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
  const indexKnowsAll = wanted.length > 0 && wanted.every((key) => POI_CATEGORY_TO_TREK[key]?.length);
  if (!indexKnowsAll) return null;
  // The index matches a term as a SUBSTRING of `category` and `category_path`
  // (see POI_CATEGORY_TO_TREK), so an exact lookup misses every leaf that is
  // not literally a term: `italian_restaurant` is a hit for `restaurant` and
  // finds nothing here. Falling through to wanted[0] then labelled it with
  // whichever pill the user happened to tap first, and the corridor panel
  // groups and colours on exactly that field, so a trattoria came back as a
  // petrol station. Longest match wins, because `fast_food` must not lose to
  // `food` when both are terms of different categories.
  const labelFor = (leaf: string | null, path: string | null): string | undefined => {
    const haystack = `${leaf ?? ''} ${path ?? ''}`;
    let best: string | undefined;
    for (const term of categoryOfTerm.keys()) {
      if (!haystack.includes(term)) continue;
      if (best === undefined || term.length > best.length) best = term;
    }
    return best === undefined ? undefined : categoryOfTerm.get(best);
  };
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
  const radius = Math.min(20000, Math.max(300, reach));
  // The same budget the Overpass path spends: per category, capped, so a
  // mixed search does not spend the whole allowance on whichever kind
  // happens to be densest.
  const cap = Math.min(limit * wanted.length, POI_RESULT_CAP);
  return { wanted, terms: [...categoryOfTerm.keys()], lat, lng, radius, reach, cap, labelFor };
}

/**
 * The index's POI hits in the shape the Overpass path produces, so the client
 * and the map renderer need no branch — but named as what it is. Overture is not
 * OpenStreetMap: it carries OSM among other sources under other licences, and
 * this branch argues elsewhere that naming a source is a licence obligation. The
 * wire contract keeps `source` an open string, so widening it costs nothing.
 *
 * One thing the index cannot do is localise. The Overpass path picks
 * `name:<lang>` and falls back to `int_name`; the service has no language
 * parameter at all, so a German user exploring Tokyo gets the Japanese primary
 * names here. Named rather than hidden: whoever adds localisation upstream
 * should find this comment.
 */
export function indexPoiAnswer(
  found: (TrekPlace & { categoryPath?: string | null })[],
  plan: IndexPoiPlan,
): PoiSearchResult {
  const { wanted, labelFor, cap, radius, reach } = plan;
  return {
    pois: found.map((p) => ({
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
    truncated: found.length >= cap,
    // A wide viewport is narrowed here too, and the caller is told so
    // for the same reason the Overpass path tells it.
    clamped: radius < reach,
  };
}

/** Autocomplete rows out of the index and its OpenStreetMap layer, interleaved as they came. */
export function indexSuggestions(found: TrekSearchHit[]): MapsAutocompleteResult['suggestions'] {
  return found.map((p) =>
    isOsmHit(p)
      ? {
          // The service's own id form, translated into the one this
          // file already resolves. Leaving it as `osm:node/123` would
          // hand the client an id getPlaceDetails does not know, and
          // the failure would land after the user had picked it.
          placeId: osmPlaceId(p),
          mainText: p.name,
          // The layer carries no address. The local name is what the
          // place is called on the spot, which is more use under a
          // translated label than an empty line.
          secondaryText: p.local_name && p.local_name !== p.name ? p.local_name : '',
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
          secondaryText: [p.address?.locality, p.address?.country].filter(Boolean).join(', '),
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
