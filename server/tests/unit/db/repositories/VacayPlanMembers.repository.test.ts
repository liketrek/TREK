/**
 * VacayPlanMembersRepository — Plan 4 Task 8b-2 item 3 (3f L6 carry): "the
 * share and fusion pickers" and the `getPlanData` pending-invite reads
 * (VC75 `getAvailableUsers`, VC129/130) had no repository-level
 * `toEqual(<legacy raw>)` parity test.
 */
import { Users } from '../../../../src/db/entities/Users.entity';
import { VacayPlanMembers } from '../../../../src/db/entities/VacayPlanMembers.entity';
import type { VacayPlanMembersRepository } from '../../../../src/db/repositories/VacayPlanMembers.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRow, updateRows } from '../../../helpers/factories/rows';
import { makeVacayPlan } from '../../../helpers/factories/vacay';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayPlanMembersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayPlanMembers);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertPlan(ownerId: number): Promise<number> {
  return (await makeVacayPlan(t, ownerId)).id;
}

function insertMember(planId: number, userId: number, status: string): Promise<number> {
  return insertRow(t, VacayPlanMembers, { plan: planId, user: userId, status });
}

describe('VacayPlanMembersRepository.listAvailableForFusion (VC75, getAvailableUsers — the fusion-candidate picker)', () => {
  it('VACAYMEMREPO-001: matches the legacy three-NOT-IN statement — excludes self, guests, existing plan members, any already-fused user, and the owner of an already-fused plan', async () => {
    const { user: me } = createUser(testDb);
    const planId = await insertPlan(me.id);
    const { user: candidate } = createUser(testDb, { username: 'candidate' });
    const { user: existingMember } = createUser(testDb, { username: 'existingmember' });
    await insertMember(planId, existingMember.id, 'pending');
    const { user: alreadyFusedElsewhere } = createUser(testDb, { username: 'fusedelsewhere' });
    const otherPlan = await insertPlan(createUser(testDb, { username: 'otherowner' }).user.id);
    await insertMember(otherPlan, alreadyFusedElsewhere.id, 'accepted');
    const { user: fusedPlanOwner } = createUser(testDb, { username: 'fusedplanowner' });
    const fusedPlan = await insertPlan(fusedPlanOwner.id);
    const { user: theirFusedMember } = createUser(testDb, { username: 'theirfusedmember' });
    await insertMember(fusedPlan, theirFusedMember.id, 'accepted');
    const { user: guest } = createUser(testDb, { username: 'guestuser' });
    await updateRows(t, Users, { id: guest.id }, { is_guest: 1 });

    // test-sql-allow: the legacy VC75 statement is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare(
        `
      SELECT u.id, u.username, u.email FROM users u
      WHERE u.id != ? AND COALESCE(u.is_guest, 0) = 0
        AND u.id NOT IN (SELECT user_id FROM vacay_plan_members WHERE plan_id = ?)
        AND u.id NOT IN (SELECT user_id FROM vacay_plan_members WHERE status = 'accepted')
        AND u.id NOT IN (SELECT owner_id FROM vacay_plans WHERE id IN (SELECT plan_id FROM vacay_plan_members WHERE status = 'accepted'))
      ORDER BY u.username`,
      )
      .all(me.id, planId);

    const typed = await repo.listAvailableForFusion(me.id, planId);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toContain(candidate.id);
    expect(typed.map((r) => r.id)).not.toContain(me.id);
    expect(typed.map((r) => r.id)).not.toContain(existingMember.id);
    expect(typed.map((r) => r.id)).not.toContain(alreadyFusedElsewhere.id);
    expect(typed.map((r) => r.id)).not.toContain(fusedPlanOwner.id);
    expect(typed.map((r) => r.id)).not.toContain(guest.id);
  });
});

describe("VacayPlanMembersRepository.listPendingForPlan / listPendingForUser (VC129/130, getPlanData's share picker)", () => {
  it('VACAYMEMREPO-002: listPendingForPlan matches the legacy JOIN — outgoing invites the plan owner sent', async () => {
    const { user: owner } = createUser(testDb);
    const planId = await insertPlan(owner.id);
    const { user: invitee } = createUser(testDb, { username: 'invitee' });
    await insertMember(planId, invitee.id, 'pending');
    const { user: accepted } = createUser(testDb, { username: 'accepted' });
    await insertMember(planId, accepted.id, 'accepted');

    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare(
        `
      SELECT m.id, m.user_id, u.username, u.email, m.created_at
      FROM vacay_plan_members m JOIN users u ON m.user_id = u.id
      WHERE m.plan_id = ? AND m.status = 'pending'`,
      )
      .all(planId);

    const typed = await repo.listPendingForPlan(planId);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.user_id)).toEqual([invitee.id]);
  });

  it("VACAYMEMREPO-003: listPendingForUser matches the legacy JOIN — the OWNER's username/email, not the invited member's", async () => {
    const { user: owner } = createUser(testDb, { username: 'planowner' });
    const planId = await insertPlan(owner.id);
    const { user: invitee } = createUser(testDb, { username: 'invitee' });
    await insertMember(planId, invitee.id, 'pending');

    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare(
        `
      SELECT m.id, m.plan_id, u.username, u.email, m.created_at
      FROM vacay_plan_members m JOIN vacay_plans p ON m.plan_id = p.id JOIN users u ON p.owner_id = u.id
      WHERE m.user_id = ? AND m.status = 'pending'`,
      )
      .all(invitee.id);

    const typed = await repo.listPendingForUser(invitee.id);
    expect(typed).toEqual(legacy);
    expect(typed).toEqual([
      { id: typed[0].id, plan_id: planId, username: 'planowner', email: owner.email, created_at: typed[0].created_at },
    ]);
  });
});
