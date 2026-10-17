/**
 * CollectionsService.updatePlace moving a saved place to another list.
 * COLLECTIONS-SVC-018b through 018e, moved out of collections.service.test.ts.
 *
 * Real in-memory SQLite over the container: the service comes out of
 * CollectionsModule, and the members are seeded through the ORM factories.
 */
import { CollectionPlaces } from '../../../src/db/entities/CollectionPlaces.entity';
import { CollectionsModule } from '../../../src/nest/collections/collections.module';
import { CollectionsService } from '../../../src/nest/collections/collections.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addCollectionMember } from '../../helpers/factories/collections';
import { findRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: CollectionsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [CollectionsModule] });
  svc = t.get(CollectionsService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** Puts the user on the list as an accepted member with the given role. */
async function joinCollection(colId: number, userId: number, role: 'viewer' | 'editor' | 'admin') {
  await addCollectionMember(orm(), colId, userId, { role });
}

describe('updatePlace moving a place out of its list', () => {
  // Moving a place out takes it away from the source list, so the source needs
  // the same role as deleting it there (owner or admin), not just edit rights.
  it('COLLECTIONS-SVC-018b: an editor of the source list cannot move a place out of it', async () => {
    const owner = (await makeUser(orm())).user;
    const shared = await svc.createCollection(owner.id, { name: 'Shared' });
    const editor = (await makeUser(orm())).user;
    await joinCollection(shared.id, editor.id, 'editor');
    const own = await svc.createCollection(editor.id, { name: 'Mine' });
    const l = await svc.createLabel(owner.id, shared.id, 'Berlin');
    const { place: p } = await svc.savePlace(owner.id, { collection_id: shared.id, name: 'Kept' });
    await svc.updatePlace(owner.id, p.id, { label_ids: [l.id] });

    await expect(svc.updatePlace(editor.id, p.id, { collection_id: own.id })).rejects.toThrow(
      'Only an admin can move places out of this list',
    );
    const row = await findRow(orm(), CollectionPlaces, { id: p.id });
    expect(row?.collection_id).toBe(shared.id);
    expect(row?.owner_id).toBe(owner.id);
    const { places } = await svc.getCollection(owner.id, shared.id);
    expect(places.find((x) => x.id === p.id)?.label_ids).toEqual([l.id]);
  });

  it('COLLECTIONS-SVC-018c: an admin of the source list may move a place out of it', async () => {
    const owner = (await makeUser(orm())).user;
    const shared = await svc.createCollection(owner.id, { name: 'Shared' });
    const admin = (await makeUser(orm())).user;
    await joinCollection(shared.id, admin.id, 'admin');
    const own = await svc.createCollection(admin.id, { name: 'Mine' });
    const { place: p } = await svc.savePlace(owner.id, { collection_id: shared.id, name: 'Movable' });

    const moved = await svc.updatePlace(admin.id, p.id, { collection_id: own.id });
    expect(moved.collection_id).toBe(own.id);
  });

  it('COLLECTIONS-SVC-018d: an editor may still edit a place when collection_id names the list it is in', async () => {
    const owner = (await makeUser(orm())).user;
    const shared = await svc.createCollection(owner.id, { name: 'Shared' });
    const editor = (await makeUser(orm())).user;
    await joinCollection(shared.id, editor.id, 'editor');
    const { place: p } = await svc.savePlace(owner.id, { collection_id: shared.id, name: 'Old' });

    const res = await svc.updatePlace(editor.id, p.id, { collection_id: shared.id, name: 'New' });
    expect(res.name).toBe('New');
    expect(res.collection_id).toBe(shared.id);
  });

  it('COLLECTIONS-SVC-018e: a viewer of the source list still gets the read-only refusal on a move', async () => {
    const owner = (await makeUser(orm())).user;
    const shared = await svc.createCollection(owner.id, { name: 'Shared' });
    const viewer = (await makeUser(orm())).user;
    await joinCollection(shared.id, viewer.id, 'viewer');
    const own = await svc.createCollection(viewer.id, { name: 'Mine' });
    const { place: p } = await svc.savePlace(owner.id, { collection_id: shared.id, name: 'X' });

    await expect(svc.updatePlace(viewer.id, p.id, { collection_id: own.id })).rejects.toThrow(
      'You have read-only access to this list',
    );
  });
});
