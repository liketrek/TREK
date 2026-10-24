import { buildApp } from '../../src/bootstrap';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * A member another member took off a trip cannot walk back in through the
 * trip's invite link (GHSA-wr4c-964p-39jg, TIR-*). Through the real routes:
 * the link, the roster's remove and add, and the join that reads both.
 */

let app: INestApplication;
let orm: FactoryOrm;

beforeAll(async () => {
  app = await buildApp();
  await app.init();
  orm = app.get(MikroORM);
});

afterAll(async () => {
  await app?.close();
});

const http = () => request(app.getHttpServer());

let scenes = 0;

/** A trip with an invite link, and Ben, who joined through it. */
async function scene() {
  const n = ++scenes;
  const { user: owner } = await makeUser(orm, { username: `tir-owner-${n}` });
  const { user: ben } = await makeUser(orm, { username: `tir-ben-${n}` });
  const trip = await makeTrip(orm, owner.id);
  const created = await http().post(`/api/trips/${trip.id}/invite-link`).set('Cookie', authCookie(owner.id)).send({});
  expect(created.status).toBeLessThan(300);
  const token = created.body.token as string;
  const joined = await http().post(`/api/trip-invites/${token}/accept`).set('Cookie', authCookie(ben.id));
  expect(joined.body).toEqual({ trip_id: trip.id, joined: true });
  return { owner, ben, trip, token };
}

const accept = (token: string, userId: number) =>
  http().post(`/api/trip-invites/${token}/accept`).set('Cookie', authCookie(userId));
const preview = (token: string, userId: number) =>
  http().get(`/api/trip-invites/${token}`).set('Cookie', authCookie(userId));
const remove = (tripId: number, userId: number, byUserId: number) =>
  http().delete(`/api/trips/${tripId}/members/${userId}`).set('Cookie', authCookie(byUserId));
const canOpen = async (tripId: number, userId: number) =>
  (await http().get(`/api/trips/${tripId}`).set('Cookie', authCookie(userId))).status === 200;

describe('a removed member and the invite link', () => {
  it('TIR-001: removed by the owner, the old link refuses them and says why, and they stay out', async () => {
    const s = await scene();
    expect((await remove(s.trip.id, s.ben.id, s.owner.id)).status).toBe(200);

    const seen = await preview(s.token, s.ben.id);
    expect(seen.status).toBe(403);
    expect(seen.body).toEqual({
      error: 'You were removed from this trip. Ask its owner to add you again.',
      removed: true,
    });

    const rejoin = await accept(s.token, s.ben.id);
    expect(rejoin.status).toBe(403);
    expect(rejoin.body.removed).toBe(true);
    expect(await canOpen(s.trip.id, s.ben.id)).toBe(false);
  });

  it('TIR-002: the link still works for everybody else', async () => {
    const s = await scene();
    await remove(s.trip.id, s.ben.id, s.owner.id);
    const { user: cara } = await makeUser(orm, { username: `tir-cara-${scenes}` });
    expect((await preview(s.token, cara.id)).status).toBe(200);
    expect((await accept(s.token, cara.id)).body).toEqual({ trip_id: s.trip.id, joined: true });
  });

  it('TIR-003: whoever left on their own may come back through the link', async () => {
    const s = await scene();
    expect((await remove(s.trip.id, s.ben.id, s.ben.id)).status).toBe(200);
    expect(await canOpen(s.trip.id, s.ben.id)).toBe(false);
    expect((await accept(s.token, s.ben.id)).body).toEqual({ trip_id: s.trip.id, joined: true });
    expect(await canOpen(s.trip.id, s.ben.id)).toBe(true);
  });

  it('TIR-004: added back by name, then leaving on their own, they may use the link again', async () => {
    const s = await scene();
    await remove(s.trip.id, s.ben.id, s.owner.id);
    const added = await http()
      .post(`/api/trips/${s.trip.id}/members`)
      .set('Cookie', authCookie(s.owner.id))
      .send({ identifier: s.ben.username });
    expect(added.status).toBe(201);
    expect((await preview(s.token, s.ben.id)).status).toBe(200);

    await remove(s.trip.id, s.ben.id, s.ben.id);
    expect((await accept(s.token, s.ben.id)).body).toEqual({ trip_id: s.trip.id, joined: true });
  });

  it('TIR-005: removing somebody who was never a member leaves no note against them', async () => {
    const s = await scene();
    const { user: dana } = await makeUser(orm, { username: `tir-dana-${scenes}` });
    await remove(s.trip.id, dana.id, s.owner.id);
    expect((await accept(s.token, dana.id)).body).toEqual({ trip_id: s.trip.id, joined: true });
  });

  it('TIR-006: a regenerated link refuses the removed member too', async () => {
    const s = await scene();
    await remove(s.trip.id, s.ben.id, s.owner.id);
    const rotated = await http()
      .post(`/api/trips/${s.trip.id}/invite-link`)
      .set('Cookie', authCookie(s.owner.id))
      .send({});
    expect((await accept(rotated.body.token as string, s.ben.id)).status).toBe(403);
  });
});
