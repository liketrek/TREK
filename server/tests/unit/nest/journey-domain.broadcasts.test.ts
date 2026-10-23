/**
 * JourneyDomainService: who hears a journey change (G31). The suite takes the
 * service from its module over a snapshot test db, so the audience reads, the
 * writes and the realtime fake are the ones the app uses.
 *
 * What it pins: a deleted journey reaches every contributor, read before the
 * delete takes their rows; a removed contributor hears their own removal; a
 * restore sends `journey:updated`; a preference reaches only the user who set
 * it; and a refused or empty write sends nothing at all.
 */
import { JourneyDomainModule } from '../../../src/nest/journey/journey-domain.module';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let svc: JourneyDomainService;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyDomainModule] });
  svc = t.get(JourneyDomainService);
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

/** What each user was sent, as [user, event type, left-out socket], in user order. */
const sent = () =>
  t.realtime.broadcastToUserMock.mock.calls
    .map(([to, msg, sid]) => [to, (msg as { type: string }).type, sid] as const)
    .sort((a, b) => a[0] - b[0]);

/** A journey with its owner, an editor and a viewer. */
async function crew() {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id);
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  t.realtime.broadcastToUserMock.mockClear();
  return { owner, editor, viewer, journey, everyone: [owner.id, editor.id, viewer.id].sort((a, b) => a - b) };
}

describe('JourneyDomainService broadcasts (G31)', () => {
  it('JOURNEY-BC-001: a deleted journey reaches every contributor, leaving out only the tab that asked', async () => {
    const { owner, journey, everyone } = await crew();

    expect(await svc.deleteJourney(journey.id, owner.id, 'sock-o')).toBe(true);

    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:deleted', 'sock-o']));
  });

  it('JOURNEY-BC-002: a delete refused to a contributor sends nothing and keeps the journey', async () => {
    const { editor, journey } = await crew();

    expect(await svc.deleteJourney(journey.id, editor.id, 'sock-e')).toBe(false);

    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
    expect(await svc.canAccessJourney(journey.id, editor.id)).not.toBeNull();
  });

  it('JOURNEY-BC-003: the removed contributor hears their own removal (role null), as everyone else does', async () => {
    const { owner, viewer, journey, everyone } = await crew();

    expect(await svc.removeContributor(journey.id, owner.id, viewer.id)).toBe(true);

    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:contributor:changed', undefined]));
    for (const [, msg] of t.realtime.broadcastToUserMock.mock.calls) {
      expect(msg).toEqual({
        type: 'journey:contributor:changed',
        journeyId: journey.id,
        targetUserId: viewer.id,
        role: null,
      });
    }
    expect(await svc.canAccessJourney(journey.id, viewer.id)).toBeNull();
  });

  it('JOURNEY-BC-004: removing the owner, a stranger, or as a non-owner announces nothing', async () => {
    const { owner, editor, viewer, journey } = await crew();
    const { user: stranger } = await makeUser(orm);

    // The owner row is protected, and a stranger has no row: nothing was deleted.
    expect(await svc.removeContributor(journey.id, owner.id, owner.id)).toBe(true);
    expect(await svc.removeContributor(journey.id, owner.id, stranger.id)).toBe(true);
    // Only the owner may remove anyone.
    expect(await svc.removeContributor(journey.id, editor.id, viewer.id)).toBe(false);

    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
    expect(await svc.canAccessJourney(journey.id, viewer.id)).not.toBeNull();
  });

  it('JOURNEY-BC-005: an update reaches every contributor; an empty patch or a non-owner sends nothing', async () => {
    const { owner, editor, journey, everyone } = await crew();

    await svc.updateJourney(journey.id, owner.id, { title: 'Renamed' }, 'sock-o');
    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:updated', 'sock-o']));

    t.realtime.broadcastToUserMock.mockClear();
    await svc.updateJourney(journey.id, owner.id, {}, 'sock-o');
    expect(await svc.updateJourney(journey.id, editor.id, { title: 'Not theirs' }, 'sock-e')).toBeNull();
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('JOURNEY-BC-006: a restore of dismissed suggestions sends journey:updated, nothing when none was', async () => {
    const { owner, editor, viewer, journey, everyone } = await crew();
    await makeJourneyEntry(orm, journey.id, owner.id, { dismissed: 1 });

    expect(await svc.restoreDismissedSuggestions(journey.id, editor.id, 'sock-e')).toEqual({ restored: 1 });
    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:updated', 'sock-e']));

    t.realtime.broadcastToUserMock.mockClear();
    expect(await svc.restoreDismissedSuggestions(journey.id, owner.id, 'sock-o')).toEqual({ restored: 0 });
    // A viewer may not restore at all.
    expect(await svc.restoreDismissedSuggestions(journey.id, viewer.id, 'sock-v')).toBeNull();
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it("JOURNEY-BC-007: a preference reaches only the user's own tabs; a stranger's sends nothing", async () => {
    const { viewer, journey } = await crew();
    const { user: stranger } = await makeUser(orm);

    const prefs = await svc.updateJourneyPreferences(journey.id, viewer.id, { hide_skeletons: true }, 'sock-v');
    expect(prefs).toEqual({ hide_skeletons: true });
    expect(t.realtime.broadcastToUserMock.mock.calls).toEqual([
      [viewer.id, { type: 'journey:updated', journeyId: journey.id }, 'sock-v'],
    ]);

    t.realtime.broadcastToUserMock.mockClear();
    expect(await svc.updateJourneyPreferences(journey.id, stranger.id, { hide_skeletons: true }, 'sock-s')).toBeNull();
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });
});
