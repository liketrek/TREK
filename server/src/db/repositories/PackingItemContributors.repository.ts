import type { PackingItemContributors } from '../entities/PackingItemContributors.entity';
import { TrekRepository } from './_shared/trek-repository';

/** PK3's contributor projection (`enrichItems`). */
export interface PackingItemContributorRow {
  item_id: number;
  user_id: number;
  status: string;
  username: string;
}

interface PackingItemContributorsKyselyDB {
  packing_item_contributors: { item_id: number; user_id: number; status: string; created_at: string | null };
  users: { id: number; username: string; display_name: string | null };
}

/**
 * `packing_item_contributors` — "I can bring that too" co-contributors on a
 * Common item (#858). Unlike `packing_item_recipients`/`packing_bag_members`
 * (folded onto `PackingItemsRepository`/`PackingBagsRepository` — see their
 * class docstrings), this pivot HAS its own entity
 * (`PackingItemContributors.entity.ts`, `.pivotEntity(...)`-declared on
 * `PackingItems`) with a genuine composite primary key (`item` + `user`,
 * both `.primary()` — R5, confirmed against
 * `Migration20200101022900_three_tier_packing_sharing.ts:23-30`'s own
 * `PRIMARY KEY (item_id, user_id)`), the only join table in this cluster
 * shaped that way (every sibling uses a surrogate `id` PK + a `uniques`
 * array instead). So it gets a normal, entity-backed repository, and its
 * writes use the composite-key form of `em.upsert`/`nativeDelete` (the
 * conflict/match target is the two-column PK, not a synthetic id) — the
 * `ReservationDayPositionsRepository`/`ReservationDayPositions.entity.ts`
 * precedent for a genuine composite-PK relation table.
 */
export class PackingItemContributorsRepository extends TrekRepository<PackingItemContributors> {
  /**
   * PK3 (`enrichItems`'s contributor read) — `SELECT c.item_id, c.user_id,
   * c.status, COALESCE(u.display_name, u.username) AS username FROM
   * packing_item_contributors c JOIN users u ON u.id = c.user_id WHERE
   * c.item_id IN (${…})`. Kysely: `item_id` is `persist(false)` (the
   * physical mirror of the composite-PK `item` relation).
   */
  async listForItems(item_ids: number[]): Promise<PackingItemContributorRow[]> {
    if (item_ids.length === 0) return [];
    return await this.kysely<PackingItemContributorsKyselyDB>()
      .selectFrom('packing_item_contributors as c')
      .innerJoin('users as u', 'u.id', 'c.user_id')
      .select([
        'c.item_id',
        'c.user_id',
        'c.status',
        (eb) => eb.fn.coalesce('u.display_name', 'u.username').as('username'),
      ])
      .where('c.item_id', 'in', item_ids)
      .execute();
  }

  /**
   * PK20 (`addContributor`) — `INSERT OR IGNORE INTO
   * packing_item_contributors (item_id, user_id, status) VALUES (?, ?,
   * 'accepted')`. `em.upsert` with the composite-PK conflict target
   * (`onConflictFields: ['item', 'user']`, the entity's real `PRIMARY KEY
   * (item_id, user_id)` — R5/§16, NOT a synthetic-id workaround), named by
   * entity property (the `AssignmentParticipantsRepository.insertIgnore`
   * precedent).
   */
  async insertIgnore(item_id: number, user_id: number): Promise<void> {
    await this.upsert(
      { item: item_id, user: user_id, status: 'accepted' },
      { onConflictFields: ['item', 'user'], onConflictAction: 'ignore' },
    );
  }

  /** PK18 (`setItemSharing`'s leaving-Common cleanup) — `DELETE FROM packing_item_contributors WHERE item_id = ?`. */
  async deleteForItem(item_id: number): Promise<void> {
    await this.nativeDelete({ item: item_id });
  }

  /** PK22 (`removeContributor`) — `DELETE FROM packing_item_contributors WHERE item_id = ? AND user_id = ?`, the composite-PK match target. */
  async deleteOne(item_id: number, user_id: number): Promise<void> {
    await this.nativeDelete({ item: item_id, user: user_id });
  }
}
