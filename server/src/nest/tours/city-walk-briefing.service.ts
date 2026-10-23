import { Places } from '../../db/entities/Places.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { PlaceRow, PlacesRepository } from '../../db/repositories/Places.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { notFound } from '../common/domain-error';
import {
  briefingCategories,
  describeWalk,
  frameOf,
  planWalk,
  themeCandidates,
  walkLineGeometry,
  type LeftOut,
  type LeftOutReason,
  type WalkCandidate,
} from './city-walk-briefing.helpers';
import { CityWalkFootWayService } from './city-walk-foot-way.service';
import { TourPoiSearchService } from './tour-poi-search.service';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  CITY_WALK_BRIEFING_LIMITS,
  minutesOf,
  type CityWalkBriefingRequest,
  type CityWalkCreateRequest,
  type TourPoiSearchResponse,
} from '@trek/shared';

/** How far from the start, the wishes and the appointments the themes are searched when the briefing does not say. */
const DEFAULT_CORRIDOR_M = 1000;

/** The places of the trip a briefing names, and which of them a station may stand for (no tour). */
interface NamedPlaces {
  rows: Map<number, PlaceRow>;
  linkable: Set<number>;
}

type Spot = { name?: string; lat: number; lng: number };

/** The traveller's own point, a start, an end, a wish or an appointment, as a candidate. */
function given(
  source: WalkCandidate['source'],
  spot: Spot,
  more: Partial<Pick<WalkCandidate, 'stay' | 'osmHours' | 'time' | 'placeId' | 'placeHours'>>,
): WalkCandidate {
  return {
    source,
    name: spot.name ?? null,
    lat: spot.lat,
    lng: spot.lng,
    stay: more.stay ?? null,
    placeHours: more.placeHours ?? null,
    osmHours: more.osmHours ?? null,
    placeId: more.placeId ?? null,
    time: more.time ?? null,
    find: null,
  };
}

/** A place of the trip the traveller allowed, as a candidate, or why it cannot be one. */
function tripPlaceOf(
  choice: { place_id: number; stay_minutes?: number | null },
  known: NamedPlaces,
): WalkCandidate | LeftOut {
  const place = known.rows.get(choice.place_id);
  const refused = (reason: LeftOutReason): LeftOut => ({
    name: place?.name ?? null,
    source: 'trip_place',
    place_id: choice.place_id,
    poi_id: null,
    reason,
  });
  if (!place) return refused('not_in_trip');
  if (!known.linkable.has(place.id)) return refused('is_tour');
  if (place.lat == null || place.lng == null) return refused('no_position');
  return given(
    'trip_place',
    { name: place.name, lat: place.lat, lng: place.lng },
    { stay: choice.stay_minutes, placeHours: place.opening_hours, placeId: place.id },
  );
}

/**
 * CW-11: a city walk proposed from a briefing, for an assistant to show the
 * traveller before anything is saved. It reads the trip's day and places,
 * searches the places of the themes with the search along a tour uses and
 * plans the way on foot with the router the road trip uses (the traveller's
 * own routing server where they set one); it writes nothing. The walk is
 * created only through create_city_walk, once the traveller confirmed it,
 * with its way planned by the same router.
 */
@Injectable()
export class CityWalkBriefingService {
  constructor(
    private readonly poiSearch: TourPoiSearchService,
    private readonly footWays: CityWalkFootWayService,
    private readonly tours: ToursService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
  ) {}

  async propose(tripId: number, userId: number, briefing: CityWalkBriefingRequest) {
    const frame = frameOf(briefing, await this.dateOf(tripId, briefing.day_id));
    const known = await this.tripPlacesOf(tripId, briefing);
    const choices = (briefing.trip_places ?? []).map((choice) => tripPlaceOf(choice, known));
    const leftOut = choices.filter((choice): choice is LeftOut => 'reason' in choice);
    const tripPlaces = choices.filter((choice): choice is WalkCandidate => !('reason' in choice));
    const wished = (briefing.wished ?? []).map((wish) =>
      given('wished', wish, { stay: wish.stay_minutes, osmHours: wish.opening_hours }),
    );
    const appointments = (briefing.appointments ?? []).map((appointment) => {
      const id = appointment.place_id;
      const place = id !== undefined && known.linkable.has(id) ? known.rows.get(id) : undefined;
      return given('appointment', appointment, {
        stay: appointment.stay_minutes,
        time: minutesOf(appointment.time),
        placeId: place?.id,
        placeHours: place?.opening_hours,
      });
    });
    const start = given('start', briefing.start, { stay: 0 });
    const end = briefing.end ? given('end', briefing.end, { stay: 0 }) : null;
    const named = [start, ...wished, ...tripPlaces, ...appointments, ...(end ? [end] : [])];
    const theme = await this.themePlaces(briefing, named);
    const plan = planWalk({
      frame,
      start,
      end,
      appointments,
      wished,
      tripPlaces,
      themes: theme.candidates,
      themeLimit: theme.limit,
    });
    const way = await this.footWays.plan(userId, tripId, plan.route);
    return {
      ...describeWalk(plan.route, frame, way),
      ...walkLineGeometry(way, briefing.include_geometry),
      left_out: [...leftOut, ...plan.leftOut],
      searched: theme.searched,
    };
  }

  /**
   * The walk the traveller confirmed, created through the creation the
   * planner's save uses, with its way on foot planned by the router the
   * proposal used. Where the router gives no way, the walk is saved with its
   * stations only and says why; no straight line is stored as a route.
   */
  async create(tripId: number, userId: number, body: CityWalkCreateRequest) {
    const way = await this.footWays.plan(userId, tripId, body.stations);
    const created = await this.tours.createCityWalk(String(tripId), body, way.kind === 'routed' ? way : null);
    return {
      ...created,
      foot_way: way.kind === 'routed' ? { planned: true } : { planned: false, why: way.why, position: way.position },
    };
  }

  /** The date of the day the walk is for, null without one; a day of another trip is not found. */
  private async dateOf(tripId: number, dayId: number | undefined): Promise<string | null> {
    if (dayId === undefined) return null;
    const day = await this.toursRepo.dayOfTrip(tripId, dayId);
    if (!day) throw notFound('Day not found');
    return day.date;
  }

  /** The places of this trip the briefing names, none of another trip, and those a station may stand for: no tour. */
  private async tripPlacesOf(tripId: number, briefing: CityWalkBriefingRequest): Promise<NamedPlaces> {
    const ids = [
      ...new Set([
        ...(briefing.trip_places ?? []).map((choice) => choice.place_id),
        ...(briefing.appointments ?? []).flatMap((appointment) => appointment.place_id ?? []),
      ]),
    ];
    const [linkable, rows] = await Promise.all([
      this.waypointsRepo.linkablePlaceIds(tripId, ids),
      Promise.all(ids.map((id) => this.placesRepo.findInTrip(id, tripId))),
    ]);
    const found = rows.filter((row): row is PlaceRow => row !== undefined);
    return { rows: new Map(found.map((row) => [row.id, row])), linkable };
  }

  /** The places of the themes along the traveller's own points, or none when the briefing asks for none. */
  private async themePlaces(briefing: CityWalkBriefingRequest, named: readonly WalkCandidate[]) {
    const limit = briefing.theme_places_max ?? CITY_WALK_BRIEFING_LIMITS.themePlaces;
    if (limit === 0) return { limit, candidates: [], searched: null };
    const categories = briefingCategories(briefing.themes ?? ['mixed']);
    const corridor = briefing.corridor_m ?? DEFAULT_CORRIDOR_M;
    const line = named.map((spot): [number, number] => [spot.lat, spot.lng]);
    const found: TourPoiSearchResponse = await this.poiSearch.search({
      tour_type: 'walk',
      categories: categories.searched.map((entry) => entry.category),
      corridor_m: corridor,
      // One point alone is searched around: a line from it to itself.
      line: line.length > 1 ? line : [...line, ...line],
      lang: briefing.lang,
    });
    const candidates = themeCandidates(found.pois, categories.searched, named);
    return {
      limit,
      candidates,
      searched: {
        categories: categories.searched.map((entry) => entry.category),
        categories_not_searched: categories.notSearched,
        corridor_m: corridor,
        found: found.pois.length,
        unavailable: found.unavailable,
        partial: found.partial,
        capped: found.capped,
        truncated: found.truncated,
      },
    };
  }
}
