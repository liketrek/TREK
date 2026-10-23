/**
 * CollectionsService: the writes a user makes to their own lists reach every
 * tab of theirs, the assistant's included (G33). A REST call leaves out only the
 * tab that asked, which updates from its own answer; an MCP call has no socket,
 * so all of them hear it.
 */
import { CollectionsModule } from '../../../src/nest/collections/collections.module';
import { CollectionsService } from '../../../src/nest/collections/collections.service';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let svc: CollectionsService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [CollectionsModule],
    // The invite's in-app notification is the notifications domain's; only the realtime echo is under test here.
    overrides: [
      { provide: NotificationsService, useValue: { send: vi.fn(async () => ({ attempted: 0, delivered: 0 })) } },
    ],
  });
  svc = t.get(CollectionsService);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  t.realtime.reset();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

/** What each user was sent, as [user, event type, left-out socket]. */
const sent = () =>
  t.realtime.broadcastToUserMock.mock.calls.map(([to, msg, sid]) => [to, (msg as { type: string }).type, sid]);

describe('CollectionsService: the actor hears their own writes', () => {
  it("COLLECTIONS-SVC-217: every invite step reaches the actor's own tabs too, leaving out only the one that asked (G33)", async () => {
    const { user: owner } = await makeUser(orm, { username: 'owner-217' });
    const { user: target } = await makeUser(orm, { username: 'target-217' });
    const col = await svc.createCollection(owner.id, { name: 'Fusion' });

    t.realtime.broadcastToUserMock.mockClear();
    await svc.sendInvite(col.id, owner.id, owner.username, target.id, 'editor', 'sock-o');
    expect(sent()).toEqual([
      [target.id, 'collections:invite', undefined],
      [owner.id, 'collections:updated', 'sock-o'],
    ]);

    t.realtime.broadcastToUserMock.mockClear();
    await svc.cancelInvite(col.id, owner.id, target.id, 'sock-o');
    expect(sent()).toEqual([
      [target.id, 'collections:cancelled', undefined],
      [owner.id, 'collections:updated', 'sock-o'],
    ]);

    await svc.sendInvite(col.id, owner.id, owner.username, target.id);
    t.realtime.broadcastToUserMock.mockClear();
    await svc.declineInvite(target.id, col.id, 'sock-t');
    expect(sent()).toEqual([
      [owner.id, 'collections:declined', 'sock-t'],
      [target.id, 'collections:declined', 'sock-t'],
    ]);

    await svc.sendInvite(col.id, owner.id, owner.username, target.id);
    await svc.acceptInvite(target.id, col.id, undefined);
    t.realtime.broadcastToUserMock.mockClear();
    await svc.leaveCollection(target.id, col.id, 'sock-t');
    expect(sent()).toEqual([
      [owner.id, 'collections:left', 'sock-t'],
      [target.id, 'collections:removed', 'sock-t'],
    ]);
  });

  it("COLLECTIONS-SVC-218: a new list and a new order reach the owner's other tabs; an order of nothing visible says nothing", async () => {
    const { user: a } = await makeUser(orm, { username: 'owner-218' });
    const col = await svc.createCollection(a.id, { name: 'Fresh' }, 'sock-a');
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      a.id,
      { type: 'collections:updated', collectionId: col.id },
      'sock-a',
    );

    t.realtime.broadcastToUserMock.mockClear();
    await svc.reorderCollections(a.id, [col.id], 'sock-a');
    expect(t.realtime.broadcastToUserMock.mock.calls).toEqual([
      [a.id, { type: 'collections:updated', collectionId: col.id }, 'sock-a'],
    ]);

    t.realtime.broadcastToUserMock.mockClear();
    await svc.reorderCollections(a.id, [999_999], 'sock-a');
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('COLLECTIONS-SVC-219: an MCP call has no socket, so every tab of the actor hears the delete, the owner included', async () => {
    const { user: owner } = await makeUser(orm, { username: 'owner-219' });
    const col = await svc.createCollection(owner.id, { name: 'Gone soon' });

    t.realtime.broadcastToUserMock.mockClear();
    await svc.deleteCollection(owner.id, col.id);
    expect(sent()).toEqual([[owner.id, 'collections:deleted', undefined]]);
  });

  it('COLLECTIONS-SVC-230: an imported list is announced once, after its transaction has committed', async () => {
    const { user: owner } = await makeUser(orm, { username: 'owner-230' });
    const openTx: boolean[] = [];
    t.realtime.broadcastToUserMock.mockImplementation(() => {
      openTx.push(db.inTransaction);
    });

    try {
      const result = await svc.importCollection(
        owner.id,
        {
          file: {
            format: 'trek.collection',
            version: 1,
            name: 'Announced',
            places: [{ name: 'One' }, { name: 'Two' }],
          },
        },
        'sock-o',
      );
      const created = result.collection as { id: number };
      expect(result.imported).toBe(2);
      expect(t.realtime.broadcastToUserMock.mock.calls).toEqual([
        [owner.id, { type: 'collections:updated', collectionId: created.id }, 'sock-o'],
      ]);
    } finally {
      t.realtime.broadcastToUserMock.mockImplementation(() => undefined);
    }
    // The places were written inside the import's one transaction, so none was open any more.
    expect(openTx).toEqual([false]);
  });

  it('COLLECTIONS-SVC-231: an import that rolls back announces nothing', async () => {
    const { user: owner } = await makeUser(orm, { username: 'owner-231' });
    const prepare = db.prepare.bind(db);
    const spy = vi.spyOn(db, 'prepare').mockImplementation((sql: string) => {
      if (/insert\s+into\s+"?collection_places"?/i.test(sql)) throw new Error('disk is full');
      return prepare(sql);
    });

    try {
      await expect(
        svc.importCollection(owner.id, {
          file: { format: 'trek.collection', version: 1, name: 'Doomed', places: [{ name: 'Never arrives' }] },
        }),
      ).rejects.toThrow('disk is full');
    } finally {
      spy.mockRestore();
    }
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });
});
