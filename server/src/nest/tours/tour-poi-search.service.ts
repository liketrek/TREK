import { Places } from '../../db/entities/Places.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { MapsService } from '../maps/maps.service';
import { parseRouteGeometry, thinnedLine } from './tours.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  nearnessToLine,
  plannableTourTypeSchema,
  TOUR_POI_LIMIT,
  TOUR_POI_MAX_LINE_POINTS,
  tourHighlightIds,
  type TourPoi,
  type TourPoiCategory,
  type TourPoiSearchRequest,
  type TourPoiSearchResponse,
} from '@trek/shared';

/** The map search's own categories each Tours category asks for. */
const MAPS_CATEGORIES: Record<TourPoiCategory, readonly string[]> = {
  viewpoint: ['viewpoint'],
  peak: ['peak'],
  shelter: ['shelter'],
  drinking_water: ['drinking_water'],
  food: ['restaurant', 'cafe'],
  toilets: ['toilets'],
  picnic: ['picnic'],
  campsite: ['campsite'],
  sights: ['sights'],
  slipway: ['slipway'],
  boat_rental: ['boat_rental'],
  bike_repair: ['bike_repair'],
  // Museums and galleries alone, parks and gardens alone: the explore pill's
  // `museum` also brings theatres and cinemas, its `nature` beaches and summits.
  museum: ['museum_gallery'],
  park: ['park'],
  cafe: ['cafe'],
  restaurant: ['restaurant'],
  market: ['market'],
  // BIK-07: only points tagged for bicycles; the explore pill's `charging` is for cars.
  ebike_charging: ['ebike_charging'],
};

/** The most places of one kind the map search answers from each source. */
const PER_KIND_LIMIT = 30;

/** Within this many metres, two places of one name are one place mapped twice. */
const SAME_PLACE_M = 60;

/**
 * Within this many metres, a highlight of the very same name is the place a
 * row already has: a square's outline and the point on it lie further apart
 * than two points of one place do.
 */
const SAME_NAME_M = 500;

type MapsPoi = Awaited<ReturnType<MapsService['poisAlong']>>['pois'][number];
type MapsHighlight = Awaited<ReturnType<MapsService['highlightsAlong']>>[number];

function metresApart(a: Pick<TourPoi, 'lat' | 'lng'>, b: { lat: number; lng: number }): number {
  const metresPerDegree = 111_320;
  const dLat = (a.lat - b.lat) * metresPerDegree;
  const dLng = (a.lng - b.lng) * metresPerDegree * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/** A name as compared: without case, accents or punctuation. */
function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Every word of one name is in the other, as "Basilica San Marco" is in
 * "Basilica di San Marco", or they share at least two words and half of each.
 * Whole words only: "Dom" is not "Domplatz", and one shared "Palazzo" does not
 * make "Palazzo Ducale" the "Palazzo Reale".
 */
function similarNames(a: string, b: string): boolean {
  if (!a || !b) return false;
  const words = new Set(a.split(' '));
  const others = new Set(b.split(' '));
  const shared = [...others].filter((word) => words.has(word)).length;
  if (shared === Math.min(words.size, others.size)) return true;
  return shared >= 2 && shared * 2 >= Math.max(words.size, others.size);
}

/**
 * The row a highlight is already in: the same OpenStreetMap object, the same
 * name nearby, or a like name in one spot.
 */
function rowOfHighlight(places: readonly TourPoi[], highlight: MapsHighlight, id: string): TourPoi | undefined {
  const name = nameKey(highlight.name);
  return places.find((place) => {
    if (place.id === id) return true;
    const other = nameKey(place.name);
    const apart = metresApart(place, highlight);
    return (!!name && other === name && apart <= SAME_NAME_M) || (apart <= SAME_PLACE_M && similarNames(name, other));
  });
}

/**
 * The kinds of the index a highlight may come in as a sight of its own. A
 * station, a hotel or a restaurant can be famous too, but it is no sight: it
 * still ranks a row it matches, and is never added.
 */
const SIGHT_INDEX_CATEGORIES: ReadonlySet<string> = new Set(['sehenswuerdigkeit', 'kultur']);

/**
 * The places found with the best known places near the line merged in: a
 * highlight a row already has ranks that row, and a sight no row has is added
 * when the rule marks it (Piazza San Marco is a square, which no kind asks for).
 * A ranked place the rule does not mark is not worth a row of its own. The
 * ranks are kept beside the rows, by id, for the highlight rule.
 */
function withHighlights(
  places: readonly TourPoi[],
  highlights: readonly MapsHighlight[],
  corridorM: number,
  line: Array<[number, number]>,
): { places: TourPoi[]; ranks: Map<string, number> } {
  const merged = [...places];
  const candidates: TourPoi[] = [];
  const ranks = new Map<string, number>();
  for (const highlight of [...highlights].sort((a, b) => b.qrank - a.qrank)) {
    const near = nearnessToLine({ lat: highlight.lat, lng: highlight.lng }, line);
    if (!near || near.distanceM > corridorM) continue;
    const id = `${highlight.osmType}:${highlight.osmId}`;
    const row = rowOfHighlight([...merged, ...candidates], highlight, id);
    if (row) {
      ranks.set(row.id, Math.max(ranks.get(row.id) ?? 0, highlight.qrank));
      continue;
    }
    if (!highlight.category || !SIGHT_INDEX_CATEGORIES.has(highlight.category)) continue;
    candidates.push({
      id,
      name: highlight.name,
      lat: highlight.lat,
      lng: highlight.lng,
      category: 'sights',
      kind: highlight.osmTag,
      source: 'openstreetmap',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      distance_m: Math.round(near.distanceM),
      along_m: Math.round(near.alongM),
    });
    ranks.set(id, highlight.qrank);
  }
  const marked = new Set(tourHighlightIds([...ranks].map(([id, qrank]) => ({ id, qrank }))));
  for (const candidate of candidates) {
    if (marked.has(candidate.id)) merged.push(candidate);
    else ranks.delete(candidate.id);
  }
  return { places: merged, ranks };
}

/**
 * The answer's rows: the highlights first, best known first, then the nearest
 * of the rest to the line, in the order the tour meets them. A highlight is
 * never cut for a nearer place.
 */
function answerRows(places: readonly TourPoi[], ranks: ReadonlyMap<string, number>): TourPoi[] {
  const marked = new Set(tourHighlightIds([...ranks].map(([id, qrank]) => ({ id, qrank }))));
  const rank = (place: TourPoi) => ranks.get(place.id) ?? 0;
  const highlights = places
    .filter((place) => marked.has(place.id))
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, TOUR_POI_LIMIT)
    .map((place) => ({ ...place, highlight: true }));
  // The nearest to the line when there are too many, then in the order the tour meets them.
  const rest = places
    .filter((place) => !marked.has(place.id))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, TOUR_POI_LIMIT - highlights.length)
    .sort((a, b) => a.along_m - b.along_m || a.distance_m - b.distance_m);
  return [...highlights, ...rest];
}

/** What an e-bike charging point states, as the answer carries it; nothing for any other place. */
function bikeChargingOf(poi: MapsPoi): Pick<TourPoi, 'charging'> {
  const charging = poi.charging;
  if (!charging || !('bicycle' in charging)) return {};
  const { bicycle, sockets, capacity, fee, access } = charging;
  return { charging: { bicycle, sockets, capacity, fee, access } };
}

function tourCategoryOf(mapsCategory: string, asked: readonly TourPoiCategory[]): TourPoiCategory | undefined {
  return asked.find((category) => MAPS_CATEGORIES[category].includes(mapsCategory));
}

/**
 * Within this many metres, a summit of the index and another of a like name
 * are one mountain. The index holds a mountain as many pins, placed by whoever
 * listed it, at its foot as much as on top, so they lie a mountain's breadth
 * apart. Two OpenStreetMap summits are two peaks, as the Watzmann and the
 * Kleiner Watzmann are.
 */
const SAME_MOUNTAIN_M = 3000;

/**
 * Scripts written without spaces between words: there one name inside another
 * is a word of it, as 高尾山 is of 八王子高尾山, where in Latin "Dom" is not
 * "Domplatz".
 */
const UNSPACED_SCRIPT = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]{2,}$/u;

/** {@link similarNames}, or one word written without spaces inside the other name. */
function likeNames(a: string, b: string): boolean {
  if (similarNames(a, b)) return true;
  const inside = (word: string, name: string) => UNSPACED_SCRIPT.test(word) && name.replaceAll(' ', '').includes(word);
  return a.split(' ').some((word) => inside(word, b)) || b.split(' ').some((word) => inside(word, a));
}

/**
 * Two rows that are one place: the same name in one spot, as OpenStreetMap
 * maps a place twice, as a point and as its outline, or the index holds it
 * beside OpenStreetMap; a like name in one spot; or, for a summit of the
 * index, a like name anywhere on the mountain. An unnamed place (a tap, a
 * bench) is never one with another.
 */
function samePlace(a: TourPoi, b: TourPoi): boolean {
  const name = nameKey(a.name);
  const other = nameKey(b.name);
  if (!name || !other || a.category !== b.category) return false;
  const apart = metresApart(a, b);
  const pinned = a.source !== 'openstreetmap' || b.source !== 'openstreetmap';
  if (a.category === 'peak' && pinned && apart <= SAME_MOUNTAIN_M) return likeNames(name, other);
  return apart <= SAME_PLACE_M && (name === other || likeNames(name, other));
}

/**
 * The row a place mapped several times keeps: an OpenStreetMap object over an
 * index pin, then the plainest name ("高尾山" rather than "Top Of Mt.Takao"),
 * then the first found.
 */
function keptOf(rows: readonly TourPoi[]): TourPoi {
  const plainness = (row: TourPoi) => [row.source === 'openstreetmap' ? 0 : 1, nameKey(row.name).length];
  return rows.reduce((best, row) => {
    const [a, b] = [plainness(row), plainness(best)];
    return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? row : best;
  });
}

/**
 * The rows that are one place, each once: a row joins every group it is one
 * place with, so a bridge like "高尾山 (Mt. Takao)" joins "Mt.Takao" and
 * "高尾山" although those two share no word.
 */
function oncePerPlace(rows: readonly TourPoi[]): TourPoi[] {
  const groups: TourPoi[][] = [];
  for (const row of rows) {
    const joined = groups.filter((group) => group.some((other) => samePlace(row, other)));
    const merged = [...joined.flat(), row];
    groups.splice(0, groups.length, ...groups.filter((group) => !joined.includes(group)), merged);
  }
  const kept = new Set(groups.map(keptOf));
  // In the order found, so the first of equals stays first.
  return rows.filter((row) => kept.has(row));
}

/** The places found, each once and within the corridor, with where they lie. */
function placesWithin(found: MapsPoi[], body: TourPoiSearchRequest, line: Array<[number, number]>): TourPoi[] {
  const kept = new Map<string, TourPoi>();
  for (const poi of found) {
    const category = tourCategoryOf(poi.category, body.categories);
    const near = nearnessToLine({ lat: poi.lat, lng: poi.lng }, line);
    if (!category || !near || near.distanceM > body.corridor_m || kept.has(poi.osm_id)) continue;
    const place: TourPoi = {
      id: poi.osm_id,
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      category,
      kind: poi.poi_type,
      source: poi.source,
      address: poi.address,
      website: poi.website,
      phone: poi.phone,
      opening_hours: poi.opening_hours,
      distance_m: Math.round(near.distanceM),
      along_m: Math.round(near.alongM),
      ...bikeChargingOf(poi),
    };
    kept.set(poi.osm_id, place);
  }
  return oncePerPlace([...kept.values()]);
}

/**
 * PLN-02: places along a tour, searched on purpose. The map search asks the
 * TREK places index in circles along the line and OpenStreetMap near it for
 * the kinds the index does not know; the places kept are those within the
 * corridor of the line itself, the nearest to it when there are more than one
 * answer carries, listed from the start. Nothing is written. A kind no source
 * could be asked for is named as unavailable, so a failed source never reads
 * as nothing found, with the seconds until asking again makes sense when the
 * map search holds back; the distance is measured straight across to the line,
 * never a way someone walked or paddled. A search for sights also asks for the
 * best known places near the line and lists its highlights first.
 */
@Injectable()
export class TourPoiSearchService {
  constructor(
    private readonly maps: MapsService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
  ) {}

  async search(body: TourPoiSearchRequest): Promise<TourPoiSearchResponse> {
    // The contract's tuples, spelled out as pairs once for the measures below.
    const line = body.line.map((point): [number, number] => [Number(point[0]), Number(point[1])]);
    const points = line.map(([lat, lng]) => ({ lat, lng }));
    const asked = [...new Set(body.categories.flatMap((category) => MAPS_CATEGORIES[category]))];
    // The best known places are what a search for sights is for, on any tour.
    const [along, highlights] = await Promise.all([
      this.maps.poisAlong(asked, points, body.corridor_m, body.lang, PER_KIND_LIMIT),
      body.categories.includes('sights') ? this.highlightsAlong(points, body) : [],
    ]);
    const found = withHighlights(placesWithin(along.pois, body, line), highlights, body.corridor_m, line);
    const unavailable = body.categories.filter((category) =>
      MAPS_CATEGORIES[category].every((mapsCategory) => along.failed.includes(mapsCategory)),
    );
    return {
      pois: answerRows(found.places, found.ranks),
      truncated: along.truncated || found.places.length > TOUR_POI_LIMIT,
      partial: along.partial,
      capped: along.capped,
      unavailable,
      // When asking again makes sense, only beside a kind that could not be searched.
      ...(unavailable.length && along.retryAfterS ? { retry_after_s: along.retryAfterS } : {}),
    };
  }

  /** The best known places near the line, or none when they cannot be had: they add to a search, never fail it. */
  private async highlightsAlong(
    points: Array<{ lat: number; lng: number }>,
    body: TourPoiSearchRequest,
  ): Promise<MapsHighlight[]> {
    try {
      return await this.maps.highlightsAlong(points, body.corridor_m, body.lang);
    } catch {
      return [];
    }
  }

  /** The same search along a saved tour's line, for a client that has no draft (MCP). */
  async searchSavedTour(
    tripId: number,
    placeId: number,
    request: Pick<TourPoiSearchRequest, 'categories' | 'corridor_m' | 'lang'>,
  ): Promise<TourPoiSearchResponse> {
    const [tour, place] = await Promise.all([
      this.toursRepo.findInTrip(tripId, placeId),
      this.placesRepo.findInTrip(placeId, tripId),
    ]);
    const line = parseRouteGeometry(place?.route_geometry).map((point): [number, number] => [point[0], point[1]]);
    const tourType = plannableTourTypeSchema.safeParse(tour?.tour_type);
    if (!tour || line.length < 2) throw new NotFoundException('Tour not found');
    return await this.search({
      ...request,
      tour_type: tourType.success ? tourType.data : 'hike',
      line: thinnedLine(line, TOUR_POI_MAX_LINE_POINTS),
    });
  }
}
