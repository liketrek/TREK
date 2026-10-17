import type { TourSources } from '../entities/TourSources.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** Where an imported tour came from, as it is written once at the import. */
export interface TourSourceInsert {
  place_id: number;
  provider: string;
  instance: string;
  external_id: string;
  external_url: string | null;
  external_updated: string | null;
  content_hash: string;
  local_hash: string;
  imported_by: number;
}

/** A snapshot of an outside source in a trip, with the tour as it stands now. */
export interface TourSnapshotRow {
  place_id: number;
  external_id: string;
  content_hash: string;
  local_hash: string;
  imported_at: string | null;
  name: string;
  description: string | null;
  route_geometry: string | null;
}

type SourcesDB = Pick<DB, 'tour_sources' | 'places'>;

/**
 * `tour_sources`: the provenance of tours copied in from outside, one row per
 * tour, gone with the tour. The source's own id is not unique here on purpose:
 * importing a changed trail again makes a second snapshot beside the first.
 */
export class TourSourcesRepository extends TrekRepository<TourSources> {
  private db() {
    return this.kysely<SourcesDB>();
  }

  /** Written in the same transaction as the tour it describes. */
  async insertSource(row: TourSourceInsert): Promise<void> {
    await this.db().insertInto('tour_sources').values(row).execute();
  }

  /**
   * Every snapshot in the trip of the given trails of one instance, newest
   * first, with the tour's current name and line for comparing.
   */
  async listSnapshots(
    tripId: number,
    provider: string,
    instance: string,
    externalIds: readonly string[],
  ): Promise<TourSnapshotRow[]> {
    if (externalIds.length === 0) return [];
    return await this.db()
      .selectFrom('tour_sources as s')
      .innerJoin('places as p', 'p.id', 's.place_id')
      .select([
        's.place_id',
        's.external_id',
        's.content_hash',
        's.local_hash',
        's.imported_at',
        'p.name',
        'p.description',
        'p.route_geometry',
      ])
      .where('p.trip_id', '=', tripId)
      .where('s.provider', '=', provider)
      .where('s.instance', '=', instance)
      .where('s.external_id', 'in', [...externalIds])
      .orderBy('s.imported_at', 'desc')
      .orderBy('s.place_id', 'desc')
      .execute();
  }
}
