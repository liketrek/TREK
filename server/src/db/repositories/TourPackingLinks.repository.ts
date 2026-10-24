import { currentTimestampKysely } from '../dialect/kysely-functions';
import type { TourPackingLinks } from '../entities/TourPackingLinks.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type LinksDB = Pick<DB, 'tour_packing_links'>;

/** What a tour points at in its trip's packing list: null for the whole list, otherwise one category. */
interface TourPackingLinkRow {
  category: string | null;
  linked_at: string;
}

/**
 * `tour_packing_links` (P2D-XD-01): the packing list, or the category of it,
 * a tour points at. One row per tour, gone with the tour. It names what it
 * points at and nothing else, so no statement here reaches a packing item.
 */
export class TourPackingLinksRepository extends TrekRepository<TourPackingLinks> {
  private db() {
    return this.kysely<LinksDB>();
  }

  /** The tour's link; undefined while it points at nothing. */
  async findForTour(place_id: number): Promise<TourPackingLinkRow | undefined> {
    return await this.db()
      .selectFrom('tour_packing_links')
      .select(['category', 'linked_at'])
      .where('place_id', '=', place_id)
      .executeTakeFirst();
  }

  /** Points the tour at the list or a category, replacing what it pointed at before; the time is the new link's. */
  async put(place_id: number, category: string | null, linked_by: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.db()
      .insertInto('tour_packing_links')
      .values({ place_id, category, linked_by })
      .onConflict((oc) =>
        oc.column('place_id').doUpdateSet((eb) => ({
          category: eb.ref('excluded.category'),
          linked_by: eb.ref('excluded.linked_by'),
          // The clock in the spelling of the live database: CURRENT_TIMESTAMP is no function call.
          linked_at: currentTimestampKysely(platform),
        })),
      )
      .execute();
  }

  /** Lets go of what the tour points at; false when it pointed at nothing. */
  async remove(place_id: number): Promise<boolean> {
    const result = await this.db().deleteFrom('tour_packing_links').where('place_id', '=', place_id).executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
