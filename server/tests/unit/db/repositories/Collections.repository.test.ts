/**
 * `CollectionsRepository`: the order of a list's places and the pages
 * list_collection_places reads it in (#2647). getCollection (listPlaceRows)
 * and a page order the same way, sort_order, then created_at, then id, so two
 * places saved in the same second keep one order; a page filters by status,
 * label or "no label" and goes on after a position, not an offset.
 * COLL-REPO-001 to COLL-REPO-005.
 */
import { CollectionLabels } from '../../../../src/db/entities/CollectionLabels.entity';
import type { CollectionPlaces } from '../../../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../../../src/db/entities/Collections.entity';
import type {
  CollectionPlacePageRow,
  CollectionsRepository,
} from '../../../../src/db/repositories/Collections.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { labelCollectionPlace, makeCollection, makeCollectionPlace } from '../../../helpers/factories/collections';
import { createRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import type { EntityData } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: CollectionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(Collections);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const SAME_SECOND = '2026-05-01 10:00:00';

/**
 * A list of five places: two saved in the same second at position 0, one saved
 * earlier at position 0, one at position 1 and one whose position was never
 * written (it reads as 0, after the earlier one by its created_at).
 */
async function seedList() {
  const { user } = await makeUser(t);
  const list = await makeCollection(t, user.id, { name: 'Paris' });
  const place = (name: string, overrides: EntityData<CollectionPlaces>) =>
    makeCollectionPlace(t, list.id, user.id, { name, ...overrides });
  const later = await place('Later', { sort_order: 1, created_at: '2026-04-01 09:00:00' });
  const tieA = await place('Tie A', { sort_order: 0, created_at: SAME_SECOND, status: 'want' });
  const tieB = await place('Tie B', { sort_order: 0, created_at: SAME_SECOND });
  const early = await place('Early', { sort_order: 0, created_at: '2026-03-01 08:00:00', status: 'want' });
  const unplaced = await place('Unplaced', { sort_order: null, created_at: '2026-03-15 08:00:00' });
  return { user, list, ids: { later: later.id, tieA: tieA.id, tieB: tieB.id, early: early.id, unplaced: unplaced.id } };
}

const names = (rows: Array<Pick<CollectionPlacePageRow, 'name'>>) => rows.map((row) => row.name);

describe('CollectionsRepository: the order of a list', () => {
  it('COLL-REPO-001: getCollection orders by position, then saving time, then id', async () => {
    const { list } = await seedList();
    const rows = await repo.listPlaceRows(list.id);
    expect(names(rows)).toEqual(['Early', 'Unplaced', 'Tie A', 'Tie B', 'Later']);
  });
});

describe('CollectionsRepository: a page of a list (#2647)', () => {
  it('COLL-REPO-002: a page holds the list in that same order and goes on after the position it names', async () => {
    const { list, ids } = await seedList();
    const first = await repo.listPlacePage(list.id, {}, null, 3);
    expect(names(first)).toEqual(['Early', 'Unplaced', 'Tie A']);
    // The position a page goes on from: the missing sort_order reads as 0.
    expect(first[1]).toMatchObject({ id: ids.unplaced, sort_key: 0, created_key: '2026-03-15 08:00:00' });

    const tieA = first[2];
    const rest = await repo.listPlacePage(
      list.id,
      {},
      { sortOrder: tieA.sort_key, createdAt: tieA.created_key, id: tieA.id },
      3,
    );
    expect(names(rest)).toEqual(['Tie B', 'Later']);
    expect(await repo.countPlacePage(list.id, {})).toBe(5);
  });

  it('COLL-REPO-003: a page carries the fields an agent names a place by', async () => {
    const { user } = await makeUser(t);
    const list = await makeCollection(t, user.id);
    await makeCollectionPlace(t, list.id, user.id, {
      name: 'Septime',
      address: '80 Rue de Charonne',
      google_place_id: 'ChIJseptime',
      website: 'https://septime-charonne.fr',
      phone: '+33 1 43 67 38 29',
    });
    const [row] = await repo.listPlacePage(list.id, {}, null, 10);
    expect(row).toMatchObject({
      name: 'Septime',
      status: 'idea',
      address: '80 Rue de Charonne',
      lat: 48.8566,
      lng: 2.3522,
      google_place_id: 'ChIJseptime',
      website: 'https://septime-charonne.fr',
      phone: '+33 1 43 67 38 29',
    });
  });

  it('COLL-REPO-004: filters by status and by label, and counts what the filter matches', async () => {
    const { list, ids } = await seedList();
    const label = await createRow(t, CollectionLabels, { collection: list.id, name: 'Food' });
    await labelCollectionPlace(t, ids.tieB, label.id);
    await labelCollectionPlace(t, ids.later, label.id);

    expect(names(await repo.listPlacePage(list.id, { status: 'want' }, null, 10))).toEqual(['Early', 'Tie A']);
    expect(await repo.countPlacePage(list.id, { status: 'want' })).toBe(2);
    expect(names(await repo.listPlacePage(list.id, { labelId: label.id }, null, 10))).toEqual(['Tie B', 'Later']);
    expect(await repo.countPlacePage(list.id, { labelId: label.id })).toBe(2);
    expect(names(await repo.listPlacePage(list.id, { unlabeled: true }, null, 10))).toEqual([
      'Early',
      'Unplaced',
      'Tie A',
    ]);
    expect(await repo.countPlacePage(list.id, { unlabeled: true, status: 'want' })).toBe(2);
  });

  it('COLL-REPO-005: a place labelled after its page was read does not move the next page of unlabelled ones', async () => {
    const { list, ids } = await seedList();
    const label = await createRow(t, CollectionLabels, { collection: list.id, name: 'Done' });
    const first = await repo.listPlacePage(list.id, { unlabeled: true }, null, 2);
    expect(names(first)).toEqual(['Early', 'Unplaced']);
    await labelCollectionPlace(t, ids.early, label.id);
    await labelCollectionPlace(t, ids.unplaced, label.id);

    const last = first[1];
    const next = await repo.listPlacePage(
      list.id,
      { unlabeled: true },
      { sortOrder: last.sort_key, createdAt: last.created_key, id: last.id },
      2,
    );
    expect(names(next)).toEqual(['Tie A', 'Tie B']);
  });
});
