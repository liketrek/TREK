import { decodeJson } from '../../utils/json-column';
import type { CollectionTours } from '../entities/CollectionTours.entity';
import { COLLECTION_TOUR_WAYPOINTS } from '../json-columns';
import type { DB } from '../kysely/db';
import type { TourWaypointRow } from './TourWaypoints.repository';
import { TrekRepository } from './_shared/trek-repository';

/**
 * LIB-03: a tour kept in a collection, every column as stored but its control
 * points, which come decoded in route order, and the name of who saved it
 * (null once that account is gone).
 */
export interface CollectionTourRow {
  id: number;
  collection_id: number;
  saved_by: number | null;
  saved_by_name: string | null;
  name: string;
  description: string | null;
  website: string | null;
  route_geometry: string | null;
  waypoints: TourWaypointRow[];
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
  difficulty: string | null;
  wanderer_ref: string | null;
  match_confidence: number | null;
  max_hiking_difficulty: number | null;
  bike_profile: string | null;
  run_profile: string | null;
  run_pace_seconds_per_km: number | null;
  ski_discipline: string | null;
  ski_technique: string | null;
  /** A ski tour's piste router options and build as JSON text, as the tour it was saved from kept them. */
  ski_options: string | null;
  boat_type: string | null;
  water_context: string | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: string | null;
  track_marks: string | null;
  hiking_preferences: string | null;
  origin: string;
  origin_file_name: string | null;
  track_started_at: string | null;
  track_ended_at: string | null;
  source_trip_title: string;
  source_tour_name: string;
  created_at: string;
}

/**
 * What saving a tour into a collection writes: the whole snapshot, written
 * once and never changed, its points already encoded for their column
 * (`COLLECTION_TOUR_WAYPOINTS`) by the service that built them.
 */
export type CollectionTourInsert = Omit<CollectionTourRow, 'id' | 'saved_by_name' | 'created_at' | 'waypoints'> & {
  waypoints: string;
};

/** A trip a kept tour could be taken into, with its owner for the permission check. */
interface CollectionTourTargetRow {
  id: number;
  user_id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
}

type CollectionToursKyselyDB = Pick<DB, 'collection_tours' | 'users' | 'trips'>;

/**
 * `collection_tours` (LIB-03): whole tours kept in a collection, apart from
 * any trip. A row is written whole when a tour is saved and only ever read or
 * deleted afterwards; it goes with its collection.
 */
export class CollectionToursRepository extends TrekRepository<CollectionTours> {
  private db() {
    return this.kysely<CollectionToursKyselyDB>();
  }

  /** The shared SELECT of {@link listForCollection} and {@link findInCollection}. */
  private rowQuery() {
    return this.db()
      .selectFrom('collection_tours as ct')
      .leftJoin('users as u', 'u.id', 'ct.saved_by')
      .selectAll('ct')
      .select('u.username as saved_by_name');
  }

  /** CT1: the tours kept in one collection, the newest first; the id breaks ties inside one second. */
  async listForCollection(collection_id: number): Promise<CollectionTourRow[]> {
    const rows = await this.rowQuery()
      .where('ct.collection_id', '=', collection_id)
      .orderBy('ct.created_at', 'desc')
      .orderBy('ct.id', 'desc')
      .execute();
    return rows.map(readRow);
  }

  /** CT2: one kept tour, undefined unless it is in that collection. */
  async findInCollection(collection_id: number, id: number): Promise<CollectionTourRow | undefined> {
    const row = await this.rowQuery()
      .where('ct.collection_id', '=', collection_id)
      .where('ct.id', '=', id)
      .executeTakeFirst();
    return row ? readRow(row) : undefined;
  }

  /** CT3: keeps a snapshot in a collection and answers its id. */
  async insertSnapshot(row: CollectionTourInsert): Promise<number> {
    const inserted = await this.db()
      .insertInto('collection_tours')
      .values(row)
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** CT4: removes a kept tour from its collection; false when it was not there. */
  async deleteInCollection(collection_id: number, id: number): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('collection_tours')
      .where('collection_id', '=', collection_id)
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  /** CT5: the given trips with their owner, title and dates, in no particular order; the caller orders them. */
  async targetTrips(trip_ids: readonly number[]): Promise<CollectionTourTargetRow[]> {
    if (trip_ids.length === 0) return [];
    return await this.db()
      .selectFrom('trips as t')
      .select(['t.id', 't.user_id', 't.title', 't.start_date', 't.end_date'])
      .where('t.id', 'in', [...trip_ids])
      .execute();
  }
}

/** A stored row as callers read it: its points decoded, a broken list read as none and logged. */
function readRow(row: Omit<CollectionTourRow, 'waypoints'> & { waypoints: string }): CollectionTourRow {
  return { ...row, waypoints: decodeJson(COLLECTION_TOUR_WAYPOINTS, row.waypoints, `collection tour ${row.id}`) };
}
