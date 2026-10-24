/**
 * TripMemberWritesService over a stubbed roster and budget. MEMBER-WRITES-001+.
 *
 * The routes and the MCP tools reach these use cases with rows that exist; this
 * file pins the two fallbacks they never meet: an inviter whose address cannot
 * be read still sends the invitation, and an expense that is gone by the time a
 * deleted guest's split is read back again is left out instead of announced.
 */
import { BudgetService } from '../../../src/nest/budget/budget.service';
import type { TripWriter } from '../../../src/nest/common/trip-writer';
import { TripMemberWritesService } from '../../../src/nest/trip-members/trip-member-writes.service';
import { TripMembersModule } from '../../../src/nest/trip-members/trip-members.module';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../helpers/test-module';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let writes: TripMemberWritesService;

const roster = {
  addMember: vi.fn(),
  notifyInvite: vi.fn(),
  deleteGuest: vi.fn(),
};
const budget = {
  listBudgetItems: vi.fn(),
  getBudgetItem: vi.fn(),
};

/** A writer whose user has no row, so nothing about them can be read back. */
function writerFor(userId: number): TripWriter {
  return { userId, role: 'user', surface: 'rest', events: { emit: vi.fn(), emitAll: vi.fn() } };
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [TripMembersModule],
    overrides: [
      { provide: TripMembersService, useValue: roster },
      { provide: BudgetService, useValue: budget },
    ],
  });
  writes = t.get(TripMemberWritesService);
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

describe('TripMemberWritesService', () => {
  it('MEMBER-WRITES-001: an inviter whose name cannot be read still sends the invitation, with an empty name', async () => {
    const member = { id: 21, email: 'invitee@example.test' };
    roster.addMember.mockResolvedValue({ member, targetUserId: 21, tripTitle: 'Lisbon' });
    const writer = writerFor(987654);

    const result = await writes.addMember(7, 'invitee@example.test', 3, writer);

    expect(result.member).toBe(member);
    expect(roster.addMember).toHaveBeenCalledWith(7, 'invitee@example.test', 3, 987654);
    expect(writer.events.emit).toHaveBeenCalledWith('member:added', { member });
    expect(roster.notifyInvite).toHaveBeenCalledWith(
      '7',
      { id: 987654, username: '' },
      21,
      'Lisbon',
      'invitee@example.test',
    );
  });

  it('MEMBER-WRITES-002: deleting a guest announces only the expenses that still read back after the re-split', async () => {
    const guestId = 40;
    budget.listBudgetItems.mockResolvedValue([
      { id: 1, paid_by_user_id: guestId, members: [] },
      { id: 2, paid_by_user_id: null, members: [{ user_id: guestId }] },
      { id: 3, paid_by_user_id: null, members: [{ user_id: 5 }] },
      { id: 4, paid_by_user_id: null },
    ]);
    roster.deleteGuest.mockResolvedValue(true);
    budget.getBudgetItem.mockImplementation((itemId: number) => (itemId === 1 ? { id: 1 } : null));
    const writer = writerFor(3);

    expect(await writes.deleteGuest(7, guestId, writer)).toBe(true);

    expect(budget.getBudgetItem.mock.calls).toEqual([
      [1, 7],
      [2, 7],
    ]);
    expect(vi.mocked(writer.events.emit).mock.calls).toEqual([
      ['member:removed', { userId: guestId }],
      ['budget:updated', { item: { id: 1 } }],
    ]);
  });

  it('MEMBER-WRITES-003: a guest the roster does not delete reads nothing back and announces nothing', async () => {
    budget.listBudgetItems.mockResolvedValue([{ id: 1, paid_by_user_id: 40, members: [] }]);
    roster.deleteGuest.mockResolvedValue(false);
    const writer = writerFor(3);

    expect(await writes.deleteGuest(7, 40, writer)).toBe(false);

    expect(budget.getBudgetItem).not.toHaveBeenCalled();
    expect(writer.events.emit).not.toHaveBeenCalled();
  });
});
