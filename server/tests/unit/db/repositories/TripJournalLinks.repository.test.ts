/**
 * `TripJournalLinksRepository` and the link's reach (TJLREPO-*): one journal
 * per trip, the members it lets in, and the rule every read of link access
 * starts from: a member counts only while they are still on the linking trip.
 * Also the roster's side, `TripMembersRepository.leaveJournalLink`.
 */
import { JourneyContributors } from '../../../../src/db/entities/JourneyContributors.entity';
import { TripJournalLinks } from '../../../../src/db/entities/TripJournalLinks.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import type { JourneyContributorsRepository } from '../../../../src/db/repositories/JourneyContributors.repository';
import type { TripJournalLinksRepository } from '../../../../src/db/repositories/TripJournalLinks.repository';
import type { TripMembersRepository } from '../../../../src/db/repositories/TripMembers.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../../helpers/factories/journeys';
import { countRows } from '../../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let links: TripJournalLinksRepository;
let contributors: JourneyContributorsRepository;
let roster: TripMembersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  links = t.repo(TripJournalLinks);
  contributors = t.repo(JourneyContributors);
  roster = t.repo(TripMembers);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** A trip owned by `owner` with Lena and Tom on it, a guest, and a journal of the owner's. */
async function scene() {
  const { user: owner } = await makeUser(t, { username: 'Owner' });
  const { user: lena } = await makeUser(t, { username: 'Lena' });
  const { user: tom } = await makeUser(t, { username: 'Tom' });
  const { user: guest } = await makeUser(t, { username: 'Guest', is_guest: 1 });
  const trip = await makeTrip(t, owner.id);
  await Promise.all([lena, tom, guest].map((m) => addTripMember(t, trip.id, m.id)));
  const journal = await makeJourney(t, owner.id, { title: 'Japan' });
  return { owner, lena, tom, guest, trip, journal };
}

describe('TripJournalLinksRepository', () => {
  it('TJLREPO-001: a trip without a link reads as none, and its people with the owner first', async () => {
    const s = await scene();
    expect(await links.findForTrip(s.trip.id)).toBeNull();
    expect(await links.listMembers(s.trip.id)).toEqual([]);
    const people = await links.listTripPeople(s.trip.id);
    expect(people.map((p) => [p.username, p.is_trip_owner, p.is_guest])).toEqual([
      ['Owner', true, false],
      ['Guest', false, true],
      ['Lena', false, false],
      ['Tom', false, false],
    ]);
  });

  it('TJLREPO-002: linking reads back with the journal, and relinking keeps one row per trip', async () => {
    const s = await scene();
    const other = await makeJourney(t, s.owner.id, { title: 'Iceland' });
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.upsertLink(s.trip.id, other.id, s.owner.id, 2);
    const row = await links.findForTrip(s.trip.id);
    expect(row).toMatchObject({ trip_id: s.trip.id, journey_id: other.id, journey_title: 'Iceland', created_at: 2 });
    expect(await countRows(t, TripJournalLinks, {})).toBe(1);
  });

  it('TJLREPO-003: members are replaced as a list, and a trip without a link takes none', async () => {
    const s = await scene();
    await links.replaceMembers(s.trip.id, [{ user_id: s.lena.id, role: 'viewer' }], 1);
    expect(await links.listMembers(s.trip.id)).toEqual([]);

    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(
      s.trip.id,
      [
        { user_id: s.tom.id, role: 'editor' },
        { user_id: s.lena.id, role: 'viewer' },
      ],
      1,
    );
    expect((await links.listMembers(s.trip.id)).map((m) => [m.username, m.role])).toEqual([
      ['Lena', 'viewer'],
      ['Tom', 'editor'],
    ]);
    await links.replaceMembers(s.trip.id, [], 2);
    expect(await links.listMembers(s.trip.id)).toEqual([]);
  });

  it('TJLREPO-004: the reach gives the stronger role across trips and ends with the membership', async () => {
    const s = await scene();
    const second = await makeTrip(t, s.owner.id);
    await addTripMember(t, second.id, s.lena.id);
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.upsertLink(second.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(s.trip.id, [{ user_id: s.lena.id, role: 'viewer' }], 1);
    await links.replaceMembers(second.id, [{ user_id: s.lena.id, role: 'editor' }], 1);

    expect(await contributors.findAccessRole(s.journal.id, s.lena.id)).toBe('editor');
    expect(await contributors.findAccessRole(s.journal.id, s.tom.id)).toBeUndefined();

    await roster.remove(second.id, s.lena.id);
    expect(await contributors.findAccessRole(s.journal.id, s.lena.id)).toBe('viewer');
    await roster.remove(s.trip.id, s.lena.id);
    expect(await contributors.hasAccess(s.journal.id, s.lena.id)).toBe(false);
  });

  it('TJLREPO-005: a link member keeps a hide-skeletons choice of their own, apart from contributors', async () => {
    const s = await scene();
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(s.trip.id, [{ user_id: s.lena.id, role: 'viewer' }], 1);
    expect(await contributors.getHideSkeletons(s.journal.id, s.lena.id)).toBe(false);

    await contributors.setHideSkeletons(s.journal.id, s.lena.id, 1);
    expect(await contributors.getHideSkeletons(s.journal.id, s.lena.id)).toBe(true);
    expect(await contributors.getHideSkeletons(s.journal.id, s.tom.id)).toBe(false);

    await addJourneyContributor(t, s.journal.id, s.tom.id, 'viewer');
    await contributors.setHideSkeletons(s.journal.id, s.tom.id, 1);
    expect(await contributors.getHideSkeletons(s.journal.id, s.tom.id)).toBe(true);
  });

  it('TJLREPO-006: a direct editor stays one, and a link editor outranks a direct viewer', async () => {
    const s = await scene();
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(
      s.trip.id,
      [
        { user_id: s.lena.id, role: 'viewer' },
        { user_id: s.tom.id, role: 'editor' },
      ],
      1,
    );
    await addJourneyContributor(t, s.journal.id, s.lena.id, 'editor');
    await addJourneyContributor(t, s.journal.id, s.tom.id, 'viewer');

    expect(await contributors.findAccessRole(s.journal.id, s.lena.id)).toBe('editor');
    expect(await contributors.findAccessRole(s.journal.id, s.tom.id)).toBe('editor');
    expect(await contributors.hasAccess(s.journal.id, s.lena.id)).toBe(true);
    expect(await contributors.hasAccess(s.journal.id, s.guest.id)).toBe(false);
  });

  it('TJLREPO-007: unlinking takes the members along, and leaving the trip takes the leaver off', async () => {
    const s = await scene();
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(
      s.trip.id,
      [
        { user_id: s.lena.id, role: 'viewer' },
        { user_id: s.tom.id, role: 'viewer' },
      ],
      1,
    );

    await roster.leaveJournalLink(s.trip.id, s.lena.id);
    expect((await links.listMembers(s.trip.id)).map((m) => m.username)).toEqual(['Tom']);

    await links.deleteForTrip(s.trip.id);
    expect(await links.findForTrip(s.trip.id)).toBeNull();
    expect(await links.listMembers(s.trip.id)).toEqual([]);
  });
  it('TJLREPO-008: the journal lists who the links let in, per trip, apart from its contributors', async () => {
    const s = await scene();
    await links.upsertLink(s.trip.id, s.journal.id, s.owner.id, 1);
    await links.replaceMembers(
      s.trip.id,
      [
        { user_id: s.tom.id, role: 'editor' },
        { user_id: s.lena.id, role: 'viewer' },
      ],
      1,
    );
    await addJourneyContributor(t, s.journal.id, s.tom.id, 'viewer');

    const access = await contributors.listTripAccessForJourney(s.journal.id);
    expect(access.map((a) => [a.username, a.role, a.trip_id])).toEqual([['Lena', 'viewer', s.trip.id]]);
    expect(access[0]?.trip_title).toBe(s.trip.title);
  });
});
