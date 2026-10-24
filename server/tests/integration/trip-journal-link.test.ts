import { buildApp } from '../../src/bootstrap';
import { withRequestContext } from '../../src/nest/database/request-context';
import { TripJournalLinkMcp } from '../../src/nest/journey/trip-journal-link.mcp';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { addJourneyContributor, makeJourney } from '../helpers/factories/journeys';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

/**
 * A trip that shows one journal from the Journey addon (TJL-*).
 *
 * The link opens the journal to the trip members chosen for it, as viewers or
 * editors, and that access is read wherever journal access is read. So these
 * cases go through the real routes end to end: the link's own routes, and the
 * journal's existing ones a linked member then reaches.
 */

let app: INestApplication;
let orm: FactoryOrm;
let broadcast: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  app = await buildApp();
  await app.init();
  orm = app.get(MikroORM);
  broadcast = vi.spyOn(app.get(RealtimeService), 'broadcast');
});

afterAll(async () => {
  await app?.close();
});

beforeEach(async () => {
  await setAddonEnabled(orm, 'journey', true);
  broadcast.mockClear();
});

const http = () => request(app.getHttpServer());

let scenes = 0;

/**
 * A trip owned by `owner` with three members, and a journal of the owner's.
 * The names carry the scene's number, since usernames are unique and every
 * case builds its own scene on the one database.
 */
async function scene() {
  const n = ++scenes;
  const { user: owner } = await makeUser(orm, { username: `Owner ${n}` });
  const { user: lena } = await makeUser(orm, { username: `Lena ${n}` });
  const { user: tom } = await makeUser(orm, { username: `Tom ${n}` });
  const { user: mia } = await makeUser(orm, { username: `Mia ${n}` });
  const { user: stranger } = await makeUser(orm, { username: `Stranger ${n}` });
  const trip = await makeTrip(orm, owner.id);
  await Promise.all([lena, tom, mia].map((m) => addTripMember(orm, trip.id, m.id)));
  const journal = await makeJourney(orm, owner.id, { title: 'New York, the long weekend' });
  return { owner, lena, tom, mia, stranger, trip, journal };
}

async function link(s: Awaited<ReturnType<typeof scene>>, members: { user_id: number; role: 'viewer' | 'editor' }[]) {
  return http()
    .put(`/api/trips/${s.trip.id}/journal`)
    .set('Cookie', authCookie(s.owner.id))
    .send({ journey_id: s.journal.id, members });
}

describe('linking a journal to a trip', () => {
  it('TJL-001: a trip without a link says so, and its owner may link one', async () => {
    const s = await scene();
    const res = await http().get(`/api/trips/${s.trip.id}/journal`).set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ link: null, can_link: true, can_unlink: false, can_edit_members: false });
  });

  it('TJL-002: links the journal, opens it to the chosen members and tells the trip', async () => {
    const s = await scene();
    const res = await link(s, [
      { user_id: s.lena.id, role: 'viewer' },
      { user_id: s.tom.id, role: 'editor' },
    ]);
    expect(res.status).toBe(200);
    expect(res.body.link).toMatchObject({
      journey_id: s.journal.id,
      title: 'New York, the long weekend',
      my_role: 'owner',
    });
    expect(res.body.link.members.map((m: { username: string; role: string }) => [m.username, m.role])).toEqual([
      [s.lena.username, 'viewer'],
      [s.tom.username, 'editor'],
    ]);
    expect(res.body).toMatchObject({ can_link: true, can_unlink: true, can_edit_members: true });
    expect(broadcast).toHaveBeenCalledWith(s.trip.id, 'trip:journal:changed', {}, undefined);
  });

  it('TJL-003: a viewer reads the journal, finds it in their list, and cannot write to it', async () => {
    const s = await scene();
    await link(s, [{ user_id: s.lena.id, role: 'viewer' }]);
    const cookie = authCookie(s.lena.id);

    const seen = await http().get(`/api/trips/${s.trip.id}/journal`).set('Cookie', cookie);
    expect(seen.body.link).toMatchObject({ journey_id: s.journal.id, my_role: 'viewer', members: null });
    expect(seen.body).toMatchObject({ can_link: false, can_unlink: false, can_edit_members: false });

    const journal = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', cookie);
    expect(journal.status).toBe(200);
    expect(journal.body.my_role).toBe('viewer');

    const list = await http().get('/api/journeys').set('Cookie', cookie);
    expect(list.body.journeys.map((j: { id: number }) => j.id)).toContain(s.journal.id);

    const write = await http()
      .post(`/api/journeys/${s.journal.id}/entries`)
      .set('Cookie', cookie)
      .send({ title: 'not mine to write', entry_date: '2026-05-01' });
    expect(write.status).toBe(404);
  });

  it('TJL-004: an editor writes to the journal', async () => {
    const s = await scene();
    await link(s, [{ user_id: s.tom.id, role: 'editor' }]);
    const res = await http()
      .post(`/api/journeys/${s.journal.id}/entries`)
      .set('Cookie', authCookie(s.tom.id))
      .send({ title: 'Brooklyn Bridge at dawn', entry_date: '2026-05-01' });
    expect(res.status).toBe(201);
  });

  it('TJL-005: a member left out sees no journal in the trip and cannot open it', async () => {
    const s = await scene();
    await link(s, [{ user_id: s.lena.id, role: 'viewer' }]);
    const cookie = authCookie(s.mia.id);
    const seen = await http().get(`/api/trips/${s.trip.id}/journal`).set('Cookie', cookie);
    expect(seen.body).toEqual({ link: null, can_link: false, can_unlink: false, can_edit_members: false });
    expect((await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', cookie)).status).toBe(404);
  });

  it('TJL-006: someone outside the trip gets a 404 for its journal', async () => {
    const s = await scene();
    const res = await http().get(`/api/trips/${s.trip.id}/journal`).set('Cookie', authCookie(s.stranger.id));
    expect(res.status).toBe(404);
  });

  it('TJL-007: refuses a member without the permission, a journal not theirs, and people off the trip', async () => {
    const s = await scene();
    const asLena = await http()
      .put(`/api/trips/${s.trip.id}/journal`)
      .set('Cookie', authCookie(s.lena.id))
      .send({ journey_id: s.journal.id, members: [] });
    expect(asLena.status).toBe(403);

    const other = await makeJourney(orm, s.lena.id);
    const notHers = await http()
      .put(`/api/trips/${s.trip.id}/journal`)
      .set('Cookie', authCookie(s.owner.id))
      .send({ journey_id: other.id, members: [] });
    expect(notHers.status).toBe(403);
    expect(notHers.body.error).toBe('Only the journal owner can link it');

    const offTrip = await link(s, [{ user_id: s.stranger.id, role: 'viewer' }]);
    expect(offTrip.status).toBe(403);
    expect(offTrip.body.error).toBe('Only members of this trip can be given the journal');
  });

  it('TJL-008: never lets a guest in, and leaves the journal owner off the list', async () => {
    const s = await scene();
    const { user: guest } = await makeUser(orm, { is_guest: 1 });
    await addTripMember(orm, s.trip.id, guest.id);
    const withGuest = await link(s, [{ user_id: guest.id, role: 'viewer' }]);
    expect(withGuest.status).toBe(403);

    const withOwner = await link(s, [
      { user_id: s.owner.id, role: 'viewer' },
      { user_id: s.lena.id, role: 'viewer' },
      { user_id: s.lena.id, role: 'editor' },
    ]);
    expect(withOwner.body.link.members.map((m: { user_id: number; role: string }) => [m.user_id, m.role])).toEqual([
      [s.lena.id, 'editor'],
    ]);
  });

  it('TJL-009: the owner may only link a journal they own, even with the admin permission set wide', async () => {
    const s = await scene();
    const lenaJournal = await makeJourney(orm, s.lena.id);
    const res = await http()
      .get(`/api/trips/${s.trip.id}/journal/candidates?journey_id=${lenaJournal.id}`)
      .set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(403);
  });
});

describe('who a journal would be opened to', () => {
  it('TJL-010: lists the trip people but the caller and guests, with the access they hold today', async () => {
    const s = await scene();
    await addJourneyContributor(orm, s.journal.id, s.tom.id, 'editor');
    const res = await http()
      .get(`/api/trips/${s.trip.id}/journal/candidates?journey_id=${s.journal.id}`)
      .set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(200);
    const byName = Object.fromEntries(
      res.body.candidates.map((c: { username: string; access: string | null }) => [c.username, c.access]),
    );
    expect(byName).toEqual({ [s.lena.username]: null, [s.mia.username]: null, [s.tom.username]: 'editor' });
  });

  it('TJL-011: refuses a journey id that is not a number', async () => {
    const s = await scene();
    const res = await http()
      .get(`/api/trips/${s.trip.id}/journal/candidates?journey_id=abc`)
      .set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(400);
  });
});

describe('changing and ending a link', () => {
  it('TJL-012: changing the members takes the access of whoever was left out', async () => {
    const s = await scene();
    await link(s, [
      { user_id: s.lena.id, role: 'viewer' },
      { user_id: s.tom.id, role: 'editor' },
    ]);
    const res = await http()
      .patch(`/api/trips/${s.trip.id}/journal/members`)
      .set('Cookie', authCookie(s.owner.id))
      .send({ members: [{ user_id: s.tom.id, role: 'viewer' }] });
    expect(res.status).toBe(200);
    expect((await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.lena.id))).status).toBe(404);
    const tom = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.tom.id));
    expect(tom.body.my_role).toBe('viewer');
  });

  it('TJL-013: only the journal owner may change who it is open to', async () => {
    const s = await scene();
    await link(s, []);
    const res = await http()
      .patch(`/api/trips/${s.trip.id}/journal/members`)
      .set('Cookie', authCookie(s.lena.id))
      .send({ members: [{ user_id: s.mia.id, role: 'editor' }] });
    expect(res.status).toBe(403);
  });

  it('TJL-014: changing members or unlinking a trip without a link answers 404', async () => {
    const s = await scene();
    const cookie = authCookie(s.owner.id);
    expect(
      (await http().patch(`/api/trips/${s.trip.id}/journal/members`).set('Cookie', cookie).send({ members: [] }))
        .status,
    ).toBe(404);
    expect((await http().delete(`/api/trips/${s.trip.id}/journal`).set('Cookie', cookie)).status).toBe(404);
  });

  it('TJL-015: unlinking takes what the link gave and keeps what was given directly', async () => {
    const s = await scene();
    await addJourneyContributor(orm, s.journal.id, s.mia.id, 'viewer');
    await link(s, [
      { user_id: s.lena.id, role: 'viewer' },
      { user_id: s.mia.id, role: 'editor' },
    ]);
    const mia = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.mia.id));
    expect(mia.body.my_role).toBe('editor');

    const res = await http().delete(`/api/trips/${s.trip.id}/journal`).set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(200);
    expect(res.body.link).toBeNull();
    expect((await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.lena.id))).status).toBe(404);
    const after = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.mia.id));
    expect(after.body.my_role).toBe('viewer');
  });

  it('TJL-016: a member who leaves the trip loses the journal, and coming back does not reopen it', async () => {
    const s = await scene();
    await link(s, [{ user_id: s.lena.id, role: 'viewer' }]);
    const left = await http()
      .delete(`/api/trips/${s.trip.id}/members/${s.lena.id}`)
      .set('Cookie', authCookie(s.lena.id));
    expect(left.status).toBe(200);
    expect((await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.lena.id))).status).toBe(404);

    await addTripMember(orm, s.trip.id, s.lena.id);
    expect((await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.lena.id))).status).toBe(404);
  });

  it('TJL-017: a link member keeps a "hide skeletons" choice of their own', async () => {
    const s = await scene();
    await link(s, [{ user_id: s.lena.id, role: 'viewer' }]);
    const cookie = authCookie(s.lena.id);
    const set = await http()
      .patch(`/api/journeys/${s.journal.id}/preferences`)
      .set('Cookie', cookie)
      .send({ hide_skeletons: true });
    expect(set.status).toBe(200);
    const journal = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', cookie);
    expect(journal.body.hide_skeletons).toBe(true);
    const owner = await http().get(`/api/journeys/${s.journal.id}`).set('Cookie', authCookie(s.owner.id));
    expect(owner.body.hide_skeletons).toBe(false);
  });

  it('TJL-018: with the Journey addon off the routes answer 404', async () => {
    const s = await scene();
    await setAddonEnabled(orm, 'journey', false);
    const res = await http().get(`/api/trips/${s.trip.id}/journal`).set('Cookie', authCookie(s.owner.id));
    expect(res.status).toBe(404);
  });
});

describe('the same over MCP', () => {
  it('TJL-019: links, reads, changes and unlinks with the rules of the routes', async () => {
    const s = await scene();
    const mcp = app.get(TripJournalLinkMcp);
    const ctx = (userId: number) => ({ userId }) as Parameters<TripJournalLinkMcp['getTripJournal']>[1];
    const json = (r: { content: { text: string }[] }) => JSON.parse(r.content[0].text);
    const run = <T>(fn: () => Promise<T>) => withRequestContext(orm as MikroORM, fn);

    const linked = json(
      await run(() =>
        mcp.linkTripJournal(
          { tripId: s.trip.id, journey_id: s.journal.id, members: [{ user_id: s.lena.id, role: 'viewer' }] },
          ctx(s.owner.id),
        ),
      ),
    );
    expect(linked.link.members).toHaveLength(1);
    expect(json(await run(() => mcp.getTripJournal({ tripId: s.trip.id }, ctx(s.lena.id)))).link.my_role).toBe(
      'viewer',
    );

    await expect(
      run(() => mcp.setTripJournalMembers({ tripId: s.trip.id, members: [] }, ctx(s.lena.id))),
    ).rejects.toMatchObject({ status: 403 });
    const changed = json(
      await run(() =>
        mcp.setTripJournalMembers(
          { tripId: s.trip.id, members: [{ user_id: s.tom.id, role: 'editor' }] },
          ctx(s.owner.id),
        ),
      ),
    );
    expect(changed.link.members.map((m: { user_id: number }) => m.user_id)).toEqual([s.tom.id]);
    expect(json(await run(() => mcp.unlinkTripJournal({ tripId: s.trip.id }, ctx(s.owner.id)))).link).toBeNull();
  });
});
