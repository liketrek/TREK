import { decodeJson, encodeJson } from '../../utils/json-column';
import type { TourWaypoints, TTourWaypointsImportance } from '../entities/TourWaypoints.entity';
import { TOUR_WAYPOINT_FIXED_LEG, TOUR_WAYPOINT_LOCK } from '../json-columns';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';
import { TOUR_POI_CATEGORIES, type PaddleLock, type TourFixedLeg, type TourPoiCategory } from '@trek/shared';

/** One saved routing control point of a tour, in route order. */
export interface TourWaypointRow {
  lat: number;
  lng: number;
  role: 'start' | 'via' | 'end';
  sequence: number;
  /** The leg to the next waypoint as a fixed line; absent for a routed leg. */
  fixed_leg?: TourFixedLeg | null;
  /** A lock at this point of a paddle tour; absent where there is none. */
  lock?: PaddleLock | null;
  /** P2A-03: a shaping point, steering the route only; absent for a stop. */
  shaping?: boolean;
  /** PR1-10: the place of the trip this point stands for; absent for a free point. */
  linked_place_id?: number | null;
  /** CW-03: the point's key, the same across saves; absent on a point saved before keys. */
  key?: string;
  /** The point's own name; absent where it has none. */
  name?: string | null;
  /** CW-02: a city walk station's stay; absent where it is not known, 0 for a point passed through. */
  stay_minutes?: number | null;
  /** CW-03: how much a station matters; absent for normal. */
  importance?: TTourWaypointsImportance | null;
  /** CW-10: a station a proposed change keeps; absent when it is not protected. */
  protected?: boolean;
  /** CW-04: the station's opening hours as OpenStreetMap writes them; absent where there are none. */
  opening_hours?: string | null;
  /** PLN-03: the kind of place the point was taken in from along the tour; absent on a point set by hand. */
  poi_category?: TourPoiCategory | null;
  /** MDT-01: a stop where a stage of a multi-day tour ends; absent where the route goes on. */
  stage_end?: boolean;
}

/** The row as stored, the fixed leg still JSON text. */
interface StoredWaypoint {
  lat: number;
  lng: number;
  role: TourWaypointRow['role'];
  sequence: number;
  fixed_leg: string | null;
  lock: string | null;
  shaping: number;
  linked_place_id: number | null;
  station_key: string | null;
  name: string | null;
  stay_minutes: number | null;
  importance: TTourWaypointsImportance | null;
  protected: number;
  opening_hours: string | null;
  poi_category: string | null;
  stage_end: number;
}

/** The columns a waypoint is read with, as the stored row names them. */
const WAYPOINT_COLUMNS = [
  'lat',
  'lng',
  'role',
  'sequence',
  'fixed_leg',
  'lock',
  'shaping',
  'linked_place_id',
  'station_key',
  'name',
  'stay_minutes',
  'importance',
  'protected',
  'opening_hours',
  'poi_category',
  'stage_end',
] as const;

/** A stored kind the contract knows; one it does not (dropped since) reads as none. */
function poiCategoryOf(stored: string | null): TourPoiCategory | null {
  return TOUR_POI_CATEGORIES.find((category) => category === stored) ?? null;
}

/** A stored row as callers read it: every optional part left out entirely where there is none. */
function readWaypoint(row: StoredWaypoint): TourWaypointRow {
  const { fixed_leg, lock, shaping, linked_place_id, station_key, name, stay_minutes, importance, opening_hours } = row;
  const leg = decodeJson(TOUR_WAYPOINT_FIXED_LEG, fixed_leg, 'tour waypoint');
  const stop = decodeJson(TOUR_WAYPOINT_LOCK, lock, 'tour waypoint');
  const poi_category = poiCategoryOf(row.poi_category);
  return {
    lat: row.lat,
    lng: row.lng,
    role: row.role,
    sequence: row.sequence,
    ...(leg ? { fixed_leg: leg } : {}),
    ...(stop ? { lock: stop } : {}),
    ...(shaping ? { shaping: true } : {}),
    ...(linked_place_id != null ? { linked_place_id } : {}),
    ...(station_key ? { key: station_key } : {}),
    ...(name ? { name } : {}),
    ...(stay_minutes != null ? { stay_minutes } : {}),
    ...(importance ? { importance } : {}),
    ...(row.protected ? { protected: true } : {}),
    ...(opening_hours ? { opening_hours } : {}),
    ...(poi_category ? { poi_category } : {}),
    ...(row.stage_end ? { stage_end: true } : {}),
  };
}

/** {@link TourWaypointRow} plus the tour it belongs to, as the trip copy reads it. */
export interface TourWaypointWithPlaceRow extends TourWaypointRow {
  place_id: number;
}

/** `role` and `importance` narrowed to the values the columns' CHECK constraints allow. */
type TourWaypointsKyselyDB = Pick<DB, 'places' | 'tours'> & {
  tour_waypoints: Omit<DB['tour_waypoints'], 'role' | 'importance'> & {
    role: TourWaypointRow['role'];
    importance: TTourWaypointsImportance | null;
  };
};

/**
 * `tour_waypoints` — the start, via and end points the route editor saved
 * for a tour, so reopening it restores the controls rather than only the
 * derived line. Rows hang off `tours(place_id)` and go with the tour.
 */
export class TourWaypointsRepository extends TrekRepository<TourWaypoints> {
  private db() {
    return this.kysely<TourWaypointsKyselyDB>();
  }

  /** TW1 — `SELECT lat, lng, role, sequence, fixed_leg, lock, shaping FROM tour_waypoints WHERE place_id = ? ORDER BY sequence`. */
  async listForPlace(place_id: number): Promise<TourWaypointRow[]> {
    const rows = await this.db()
      .selectFrom('tour_waypoints')
      .select(WAYPOINT_COLUMNS)
      .where('place_id', '=', place_id)
      .orderBy('sequence', 'asc')
      .execute();
    return rows.map(readWaypoint);
  }

  /** TW2 — every waypoint of a trip's tours, for the trip copy to remap by place. */
  async listForTrip(trip_id: number): Promise<TourWaypointWithPlaceRow[]> {
    const rows = await this.db()
      .selectFrom('tour_waypoints as tw')
      .innerJoin('places as p', 'p.id', 'tw.place_id')
      .select(['tw.place_id', ...WAYPOINT_COLUMNS.map((column) => `tw.${column}` as const)])
      .where('p.trip_id', '=', trip_id)
      .orderBy('tw.place_id', 'asc')
      .orderBy('tw.sequence', 'asc')
      .execute();
    return rows.map(({ place_id, ...point }) => ({ place_id, ...readWaypoint(point) }));
  }

  /** TW2b: every waypoint of these tours with its place, ordered by place and sequence; none for no tour. */
  async listForPlaces(place_ids: readonly number[]): Promise<TourWaypointWithPlaceRow[]> {
    if (place_ids.length === 0) return [];
    const rows = await this.db()
      .selectFrom('tour_waypoints')
      .select(['place_id', ...WAYPOINT_COLUMNS])
      .where('place_id', 'in', [...new Set(place_ids)])
      .orderBy('place_id', 'asc')
      .orderBy('sequence', 'asc')
      .execute();
    return rows.map(({ place_id, ...point }) => ({ place_id, ...readWaypoint(point) }));
  }

  /**
   * TW3 — `INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence, fixed_leg, lock, shaping)
   * VALUES (...)` for each point. The caller owns the transaction: a create
   * writes the tour first, an edit clears the old points first. A trip copy
   * hands its map of copied places, which the links follow.
   */
  async insertForPlace(
    place_id: number,
    waypoints: readonly TourWaypointRow[],
    copiedPlaceIds?: ReadonlyMap<number, number>,
  ): Promise<void> {
    if (waypoints.length === 0) return;
    // In a trip copy a point standing for a place of the trip stands for that place's copy (PR1-10).
    const linkOf = (id: number | null | undefined) =>
      id == null ? null : copiedPlaceIds ? (copiedPlaceIds.get(id) ?? null) : id;
    await this.insertMany(
      waypoints.map((w) => ({
        place: place_id,
        lat: w.lat,
        lng: w.lng,
        role: w.role,
        sequence: w.sequence,
        fixed_leg: w.fixed_leg ? encodeJson(TOUR_WAYPOINT_FIXED_LEG, w.fixed_leg) : null,
        lock: w.lock ? encodeJson(TOUR_WAYPOINT_LOCK, w.lock) : null,
        shaping: w.shaping ? 1 : 0,
        linkedPlace: linkOf(w.linked_place_id),
        station_key: w.key ?? null,
        name: w.name ?? null,
        stay_minutes: w.stay_minutes ?? null,
        importance: w.importance ?? null,
        protected: w.protected ? 1 : 0,
        opening_hours: w.opening_hours ?? null,
        poi_category: w.poi_category ?? null,
        stage_end: w.stage_end ? 1 : 0,
      })),
    );
  }

  /**
   * PR1-10: which of these ids name a place of the trip a waypoint may stand
   * for: a place of that trip that is not itself a tour. An id of another
   * trip, of no place or of a tour is left out alike.
   */
  async linkablePlaceIds(trip_id: number, ids: readonly number[]): Promise<Set<number>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db()
      .selectFrom('places as p')
      .select('p.id')
      .where('p.trip_id', '=', trip_id)
      .where('p.id', 'in', [...new Set(ids)])
      .where((eb) =>
        eb.not(eb.exists(eb.selectFrom('tours as t').select('t.place_id').whereRef('t.place_id', '=', 'p.id'))),
      )
      .execute();
    return new Set(rows.map((row) => row.id));
  }

  /** PR1-10: the names of the places of a trip the given ids stand for, for a reader of the tour. */
  async placeNames(trip_id: number, ids: readonly number[]): Promise<Map<number, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db()
      .selectFrom('places as p')
      .select(['p.id', 'p.name'])
      .where('p.trip_id', '=', trip_id)
      .where('p.id', 'in', [...new Set(ids)])
      .execute();
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  /** TW4 — `DELETE FROM tour_waypoints WHERE place_id = ?`. */
  async deleteForPlace(place_id: number): Promise<void> {
    await this.nativeDelete({ place: place_id });
  }
}
