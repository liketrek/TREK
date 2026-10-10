/**
 * Plan 4 Task 8b-4a (3h L4) — full-key `toEqual(<legacy raw>)` parity for
 * `PackingItemsRepository.listPublicForShare` (`share.service.ts:386` SH13),
 * flagged by the 3h ledger as having no repository-level parity test. The
 * legacy statement (PackingItems.repository.ts's own docstring): `SELECT *
 * FROM packing_items WHERE trip_id = ? AND is_private = 0 ORDER BY
 * sort_order ASC` — a public share viewer is neither owner nor recipient,
 * so a Personal or Shared-with-people item (`is_private = 1`) must never
 * surface, regardless of `owner_id`/recipient rows (the `_shared/packing-
 * visibility.ts` three-tier model this method deliberately does NOT route
 * through — it only ever sees the Common tier).
 */
import { PackingItems } from '../../../../src/db/entities/PackingItems.entity';
import type { PackingItemsRepository } from '../../../../src/db/repositories/PackingItems.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPackingItem, createTrip, createUser } from '../../../helpers/factories';
import { addPackingItemRecipients } from '../../../helpers/factories/packing';
import { updateRows } from '../../../helpers/factories/rows';
import { createTestPackingItemsRepo } from '../../../helpers/packing-repos';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let packingItemsRepo: PackingItemsRepository;
let t: TestOrm;

beforeAll(async () => {
  packingItemsRepo = await createTestPackingItemsRepo(testDb);
  t = await createTestOrm(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(async () => {
  await t.close();
  testDb.close();
});

function legacyPublicForShare(tripId: number): unknown {
  // test-sql-allow: the legacy statement is the oracle the repository read is held to.
  return testDb
    .prepare('SELECT * FROM packing_items WHERE trip_id = ? AND is_private = 0 ORDER BY sort_order ASC')
    .all(tripId);
}

describe('PackingItemsRepository — share.service.ts SH13 read', () => {
  it('listPublicForShare — matches the legacy statement, Common items only, every nullable column both null and set', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const other = createTrip(testDb, owner.id);

    // Common, every nullable column set.
    const commonFull = createPackingItem(testDb, trip.id, { name: 'Tent', category: 'Gear' });
    await updateRows(
      t,
      PackingItems,
      { id: commonFull.id },
      {
        checked: 1,
        sort_order: 5,
        weight_grams: 1200,
        bag: null,
        quantity: 2,
        updated_at: '2026-09-01T00:00:00.000Z',
        is_private: 0,
        owner: owner.id,
      },
    );

    // Common, every nullable column left null.
    const commonBare = createPackingItem(testDb, trip.id, { name: 'Rope' });
    await updateRows(
      t,
      PackingItems,
      { id: commonBare.id },
      {
        category: null,
        sort_order: null,
        weight_grams: null,
        bag: null,
        updated_at: null,
        is_private: 0,
        owner: null,
      },
    );

    // Personal (is_private = 1, owned) — must be excluded even though it has an owner.
    const personal = createPackingItem(testDb, trip.id, { name: 'Passport' });
    await updateRows(t, PackingItems, { id: personal.id }, { is_private: 1, owner: owner.id });

    // Shared-with-people (is_private = 1, has a recipient) — must be excluded too.
    const shared = createPackingItem(testDb, trip.id, { name: 'First aid kit' });
    await updateRows(t, PackingItems, { id: shared.id }, { is_private: 1, owner: owner.id });
    await addPackingItemRecipients(t, shared.id, [owner.id]);

    // A Common item on a different trip must never leak in.
    const foreign = createPackingItem(testDb, other.id, { name: 'Foreign item' });
    await updateRows(t, PackingItems, { id: foreign.id }, { is_private: 0 });

    const legacy = legacyPublicForShare(trip.id);
    const typed = await packingItemsRepo.listPublicForShare(trip.id);
    expect(typed).toEqual(legacy);
    // ORDER BY sort_order ASC: commonBare (default sort_order 0) before commonFull (sort_order 5).
    expect(typed.map((r) => r.id)).toEqual([commonBare.id, commonFull.id]);
  });

  it('listPublicForShare — [] for a trip with no Common items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const personalOnly = createPackingItem(testDb, trip.id);
    await updateRows(t, PackingItems, { id: personalOnly.id }, { is_private: 1 });
    expect(await packingItemsRepo.listPublicForShare(trip.id)).toEqual([]);
  });
});
