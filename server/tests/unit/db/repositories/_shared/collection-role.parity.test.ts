import { CollectionMembers } from '../../../../../src/db/entities/CollectionMembers.entity';
import { Collections } from '../../../../../src/db/entities/Collections.entity';
import { resolveCollectionRole, type CollectionRole } from '../../../../../src/db/repositories/_shared/collection-role';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import { createUser } from '../../../../helpers/factories';
import { addCollectionMember, makeCollection } from '../../../../helpers/factories/collections';
import { resetTestDb } from '../../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Plan 3h Task 1, R6 — the collections cluster's shared collection-role
 * predicate's own parity harness, built BEFORE any consumer (Task 2's
 * `assertCanEdit`/`assertCanDelete` call sites throughout saved-places/
 * copy-to-trip/labels/invites) converts. `CollectionsService`'s own
 * `isVisible`/`isOwner`/`roleOf`/`assertAccess`/`assertCanEdit`/
 * `assertCanDelete` all resolve through {@link resolveCollectionRole} —
 * this file proves the predicate itself; `collections.service.test.ts`'s
 * own describe blocks exercise it end-to-end through the real service.
 *
 * Six actor cases (the R6 ruling text names five roles plus a stranger,
 * six distinct actors in total): owner, an accepted admin member, an
 * accepted editor member, an accepted viewer member, an invited-but-still-
 * `pending` user, and a complete stranger (no row at all). Each case is
 * checked against all three refusal shapes R6 calls out — 404 (no access),
 * 403-viewer (edit refused), 403-non-admin (delete refused) — via a local
 * re-implementation of `CollectionsService`'s own branch logic
 * (`assertCanEdit`/`assertCanDelete`'s exact `if` chain, copied here as the
 * test's own oracle, independent of the production service — the same
 * "hold this side fixed" reasoning `reservation-visibility.test.ts`'s
 * docstring gives, adapted from a SQL string to a decision table since this
 * predicate is value-returning, not boolean).
 *
 * **Mutation-proved**: flipping {@link resolveCollectionRole}'s `r ===
 * 'viewer'`-adjacent branch (temporarily changing the member-row
 * normalization so `'viewer'` fell through to `'editor'` instead of staying
 * `'viewer'`) made the VIEWER case's `assertCanEdit-refused` assertion go
 * red (a viewer would then wrongly pass the edit gate) while every other
 * case stayed green — confirmed by hand during this task, then reverted;
 * not left in the tree.
 */

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

type Actor = 'owner' | 'admin' | 'editor' | 'viewer' | 'pending' | 'stranger';

async function seedFixture() {
  const { user: owner } = createUser(testDb);
  const { user: admin } = createUser(testDb);
  const { user: editor } = createUser(testDb);
  const { user: viewer } = createUser(testDb);
  const { user: pending } = createUser(testDb);
  const { user: stranger } = createUser(testDb);

  const { id: collectionId } = await makeCollection(t, owner.id, { name: 'Fixture' });

  const addMember = (userId: number, role: string, status: string) =>
    addCollectionMember(t, collectionId, userId, { status, role });
  await addMember(admin.id, 'admin', 'accepted');
  await addMember(editor.id, 'editor', 'accepted');
  await addMember(viewer.id, 'viewer', 'accepted');
  await addMember(pending.id, 'editor', 'pending');

  return {
    collectionId: collectionId as number,
    userIds: {
      owner: owner.id,
      admin: admin.id,
      editor: editor.id,
      viewer: viewer.id,
      pending: pending.id,
      stranger: stranger.id,
    } as Record<Actor, number>,
  };
}

/** `assertAccess`'s own branch: 404 iff the predicate returns null. */
function assertAccessLike(role: CollectionRole): 'ok' | 404 {
  return role === null ? 404 : 'ok';
}

/** `assertCanEdit`'s own branch: 404 no-access, 403 viewer-refused, else ok. */
function assertCanEditLike(role: CollectionRole): 'ok' | 404 | 403 {
  if (role === null) return 404;
  if (role === 'viewer') return 403;
  return 'ok';
}

/** `assertCanDelete`'s own branch: 404 no-access, 403 non-admin-refused, else ok. */
function assertCanDeleteLike(role: CollectionRole): 'ok' | 404 | 403 {
  if (role === null) return 404;
  if (role !== 'owner' && role !== 'admin') return 403;
  return 'ok';
}

const EXPECTED: Record<
  Actor,
  { role: CollectionRole; access: 'ok' | 404; edit: 'ok' | 404 | 403; del: 'ok' | 404 | 403 }
> = {
  owner: { role: 'owner', access: 'ok', edit: 'ok', del: 'ok' },
  admin: { role: 'admin', access: 'ok', edit: 'ok', del: 'ok' },
  editor: { role: 'editor', access: 'ok', edit: 'ok', del: 403 },
  viewer: { role: 'viewer', access: 'ok', edit: 403, del: 403 },
  pending: { role: null, access: 404, edit: 404, del: 404 },
  stranger: { role: null, access: 404, edit: 404, del: 404 },
};

describe('_shared/collection-role — R6 parity harness (owner/admin/editor/viewer/pending/stranger)', () => {
  (Object.keys(EXPECTED) as Actor[]).forEach((actor) => {
    it(`resolves the ${actor} case to role=${String(EXPECTED[actor].role)} and the matching refusal shapes`, async () => {
      const { collectionId, userIds } = await seedFixture();
      const collections = t.repo(Collections);
      const members = t.repo(CollectionMembers);

      const role = await resolveCollectionRole(collections, members, collectionId, userIds[actor]);
      const expected = EXPECTED[actor];

      expect(role).toBe(expected.role);
      expect(assertAccessLike(role)).toBe(expected.access);
      expect(assertCanEditLike(role)).toBe(expected.edit);
      expect(assertCanDeleteLike(role)).toBe(expected.del);
    });
  });

  it('a stranger and a pending invite are indistinguishable to the predicate (both resolve to null, no access)', async () => {
    const { collectionId, userIds } = await seedFixture();
    const collections = t.repo(Collections);
    const members = t.repo(CollectionMembers);

    const pendingRole = await resolveCollectionRole(collections, members, collectionId, userIds.pending);
    const strangerRole = await resolveCollectionRole(collections, members, collectionId, userIds.stranger);
    expect(pendingRole).toBeNull();
    expect(strangerRole).toBeNull();
  });
});
