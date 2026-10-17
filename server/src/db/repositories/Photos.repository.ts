import type { Photos } from '../entities/Photos.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** The `photos` tables {@link PhotosRepository.findTripIdByFilename} reads. */
type PhotosKyselyDB = Pick<DB, 'photos'>;

/**
 * `photos` (Plan 4 Task 1's platform.routes.ts pickup — the last table with no
 * repository at all; this class existed only as an empty stub before this
 * plan).
 */
export class PhotosRepository extends TrekRepository<Photos> {
  /**
   * (`platform.routes.ts`'s pre-init `servePhoto` handler, the share-token
   * fallback) — `SELECT trip_id FROM photos WHERE filename = ?`. `trip_id`
   * is a `persist(false)` mirror of the `trip` relation
   * (`Photos.entity.ts`), so this reads through Kysely rather than a bare
   * `qb().select(['trip_id'])` — the `ShareTokensRepository`/
   * `CollectionPlacesRepository` class-docstring trap (a bare `persist(false)`
   * column select is silently dropped).
   */
  async findTripIdByFilename(filename: string): Promise<{ trip_id: number } | undefined> {
    return await this.kysely<PhotosKyselyDB>()
      .selectFrom('photos')
      .where('filename', '=', filename)
      .select(['trip_id'])
      .executeTakeFirst();
  }
}
