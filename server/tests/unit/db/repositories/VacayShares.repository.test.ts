/**
 * VacaySharesRepository.listOutgoing/listIncoming — VC81/VC82 parity (L6,
 * task-7-review.md item 11). One seeded world: two owners sharing with a
 * common recipient (one hidden, one not), plus an unrelated share that must
 * not leak across owners/recipients.
 */
import { Users } from '../../../../src/db/entities/Users.entity';
import { VacayShares } from '../../../../src/db/entities/VacayShares.entity';
import type { VacaySharesRepository } from '../../../../src/db/repositories/VacayShares.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRow, updateRows } from '../../../helpers/factories/rows';
import { addVacayPlanMember, makeVacayPlan } from '../../../helpers/factories/vacay';
import { resetTestDb } from '../../../helpers/test-db';
import type { TestOrm } from '../../../helpers/test-orm';
import { sharedTestOrm } from '../../../helpers/test-uow';
import { createTestVacaySharesRepo } from '../../../helpers/vacay-repos';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let repo: VacaySharesRepository;
let orm: TestOrm;

beforeAll(async () => {
  repo = await createTestVacaySharesRepo(testDb);
  orm = await sharedTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
});
afterAll(() => testDb.close());

const LEGACY_LIST_OUTGOING = `SELECT s.id, s.user_id, u.username FROM vacay_shares s JOIN users u ON s.user_id = u.id WHERE s.owner_id = ? ORDER BY s.id`;
const LEGACY_LIST_INCOMING = `SELECT s.id, s.owner_id, s.hidden, u.username FROM vacay_shares s JOIN users u ON s.owner_id = u.id WHERE s.user_id = ? ORDER BY s.id`;

function insertShare(ownerId: number, userId: number, hidden = 0): Promise<number> {
  return insertRow(orm, VacayShares, { owner: ownerId, user: userId, hidden });
}

describe('VacaySharesRepository — VC81/VC82 parity with the legacy statements', () => {
  it('VC81 listOutgoing: byte-identical to the legacy statement, ordered by id, usernames only (emails withheld)', async () => {
    const { user: ownerA } = createUser(testDb, { username: 'owner-a' });
    const { user: recipient1 } = createUser(testDb, { username: 'recipient-1' });
    const { user: recipient2 } = createUser(testDb, { username: 'recipient-2' });
    const { user: ownerB } = createUser(testDb, { username: 'owner-b' });
    await insertShare(ownerA.id, recipient2.id);
    await insertShare(ownerA.id, recipient1.id);
    await insertShare(ownerB.id, recipient1.id); // a different owner — must not appear for ownerA

    // test-sql-allow: the legacy VC81 statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare(LEGACY_LIST_OUTGOING).all(ownerA.id);
    const rows = await repo.listOutgoing(ownerA.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.username)).toEqual(['recipient-2', 'recipient-1']);
  });

  it('VC81 listOutgoing: an owner with no outgoing shares returns [], matching the legacy statement', async () => {
    const { user: owner } = createUser(testDb);
    // test-sql-allow: the legacy VC81 statement is the parity oracle the repository is compared against.
    expect(await repo.listOutgoing(owner.id)).toEqual(testDb.prepare(LEGACY_LIST_OUTGOING).all(owner.id));
  });

  it('VC82/VC91 listIncoming: byte-identical to the legacy statement, ordered by id, carrying owner username and the hidden flag', async () => {
    const { user: recipient } = createUser(testDb, { username: 'recipient' });
    const { user: ownerA } = createUser(testDb, { username: 'owner-a' });
    const { user: ownerB } = createUser(testDb, { username: 'owner-b' });
    const { user: elsewhere } = createUser(testDb, { username: 'elsewhere' });
    await insertShare(ownerB.id, recipient.id, 1); // hidden
    await insertShare(ownerA.id, recipient.id, 0);
    await insertShare(ownerA.id, elsewhere.id, 0); // a different recipient — must not appear for `recipient`

    // test-sql-allow: the legacy VC82 statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare(LEGACY_LIST_INCOMING).all(recipient.id);
    const rows = await repo.listIncoming(recipient.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => ({ username: r.username, hidden: r.hidden }))).toEqual([
      { username: 'owner-b', hidden: 1 },
      { username: 'owner-a', hidden: 0 },
    ]);
  });

  it('VC82/VC91 listIncoming: a recipient with no incoming shares returns [], matching the legacy statement', async () => {
    const { user: recipient } = createUser(testDb);
    // test-sql-allow: the legacy VC82 statement is the parity oracle the repository is compared against.
    expect(await repo.listIncoming(recipient.id)).toEqual(testDb.prepare(LEGACY_LIST_INCOMING).all(recipient.id));
  });
});

// Plan 4 final review m5 (carry 5): `listAvailableForShare` (VC90) had no test
// reference at all. Full-key parity against the legacy statement run raw on the
// same connection, over one world that exercises every exclusion.
const LEGACY_LIST_AVAILABLE = `SELECT u.id, u.username FROM users u WHERE u.id != ? AND COALESCE(u.is_guest, 0) = 0
  AND u.id NOT IN (SELECT user_id FROM vacay_shares WHERE owner_id = ?)
  AND u.id NOT IN (SELECT owner_id FROM vacay_plans WHERE id = ? UNION SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND status = 'accepted')
  ORDER BY u.username`;

describe('VacaySharesRepository — VC90 listAvailableForShare parity with the legacy statement', () => {
  it('VC90 listAvailableForShare: byte-identical to the legacy statement; excludes the caller, guests, existing shares, the plan owner and accepted members', async () => {
    const { user: caller } = createUser(testDb, { username: 'caller' });
    const { user: planOwner } = createUser(testDb, { username: 'plan-owner' });
    const { user: accepted } = createUser(testDb, { username: 'accepted-member' });
    const { user: pending } = createUser(testDb, { username: 'pending-member' });
    const { user: alreadyShared } = createUser(testDb, { username: 'already-shared' });
    const { user: guest } = createUser(testDb, { username: 'a-guest' });
    const { user: sharedByOther } = createUser(testDb, { username: 'shared-by-someone-else' });
    createUser(testDb, { username: 'bystander' });
    await updateRows(orm, Users, { id: guest.id }, { is_guest: 1 });
    const { id: planId } = await makeVacayPlan(orm, planOwner.id);
    await addVacayPlanMember(orm, planId, accepted.id, 'accepted');
    await addVacayPlanMember(orm, planId, pending.id, 'pending');
    await insertShare(caller.id, alreadyShared.id);
    await insertShare(planOwner.id, sharedByOther.id); // another owner's share — must not exclude

    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare(LEGACY_LIST_AVAILABLE).all(caller.id, caller.id, planId, planId);
    const rows = await repo.listAvailableForShare(caller.id, planId);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.username)).toEqual(['bystander', 'pending-member', 'shared-by-someone-else']);
  });

  it('VC90 listAvailableForShare: a plan id with no plan excludes only the caller, guests and shares, matching the legacy statement', async () => {
    const { user: caller } = createUser(testDb, { username: 'caller' });
    createUser(testDb, { username: 'someone' });
    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare(LEGACY_LIST_AVAILABLE).all(caller.id, caller.id, 999999, 999999);
    const rows = await repo.listAvailableForShare(caller.id, 999999);
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.username)).toEqual(['someone']);
  });
});
