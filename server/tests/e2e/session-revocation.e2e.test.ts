/**
 * Session revocation e2e: the admin actions that sign another account out.
 *
 * sessions.e2e.test.ts covers what a user does to their own sessions on the
 * auth routes alone. An admin setting a password, clearing two-factor or
 * deleting an account goes through AdminModule, which pulls in most of the
 * app, so this suite boots the whole thing with `buildApp()` against the
 * migrated snapshot, every global guard included. The member signs in twice
 * for real (two tracked sessions), the admin acts, and both of the member's
 * cookies must stop working while the admin's own session carries on.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { MikroORM } from '@mikro-orm/core';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetRateLimits } from '../helpers/test-db';
import { createAdmin, createUser } from '../helpers/factories';
import { sessionRows } from '../helpers/sessions';
import { findRow, updateRows } from '../helpers/factories/rows';
import { Users } from '../../src/db/entities/Users.entity';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
});

/** Sign in from a device; returns the `trek_session=…` cookie pair. */
async function signIn(email: string, password: string, device: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').set('User-Agent', device).send({ email, password });
  expect(res.status).toBe(200);
  const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
  return /^(trek_session=[^;]+)/.exec(cookie)![1];
}

const sessionIdOf = (cookie: string) => (jwt.decode(cookie.slice('trek_session='.length)) as { jti: string }).jti;
const me = (cookie: string) => request(app).get('/api/auth/me').set('Cookie', cookie);
const liveRows = async (userId: number) => (await sessionRows(testDb as never, userId)).filter((row) => row.revoked_at === null);

/** An admin and a member, each signed in; the member on two devices. */
async function signedInPair(name: string) {
  const admin = createAdmin(testDb as never, { username: `${name}-admin`, email: `${name}-admin@example.test` });
  const member = createUser(testDb as never, { username: `${name}-member`, email: `${name}-member@example.test` });
  return {
    adminCookie: await signIn(admin.user.email, admin.password, 'Admin browser'),
    member: member.user,
    laptop: await signIn(member.user.email, member.password, 'Laptop'),
    phone: await signIn(member.user.email, member.password, 'Phone'),
  };
}

describe('Admin actions that end another account\'s sessions', () => {
  it('SESS-E2E-ADMIN-001: setting a new password for a member ends every session of that member', async () => {
    const { adminCookie, member, laptop, phone } = await signedInPair('sess-admin-pw');
    expect((await me(laptop)).status).toBe(200);

    const res = await request(app)
      .put(`/api/admin/users/${member.id}`)
      .set('Cookie', adminCookie)
      .send({ password: 'Admin1234!x' });
    expect(res.status).toBe(200);

    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(401);
    expect((await sessionRows(testDb as never, member.id)).map((row) => row.id).sort()).toEqual([sessionIdOf(laptop), sessionIdOf(phone)].sort());
    expect(await liveRows(member.id)).toEqual([]);
    expect((await me(adminCookie)).status).toBe(200);
  }, 30000);

  it('SESS-E2E-ADMIN-002: clearing a member\'s two-factor ends every session of that member', async () => {
    const { adminCookie, member, laptop, phone } = await signedInPair('sess-admin-mfa');
    await updateRows(nestApp.get(MikroORM), Users, { id: member.id }, { mfa_enabled: 1, mfa_secret: 'x' });

    const res = await request(app).delete(`/api/admin/users/${member.id}/mfa`).set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(401);
    expect(await liveRows(member.id)).toEqual([]);
    expect((await findRow(nestApp.get(MikroORM), Users, { id: member.id }))?.mfa_enabled).toBe(0);
    expect((await me(adminCookie)).status).toBe(200);
  }, 30000);

  it('SESS-E2E-ADMIN-003: deleting a member takes the member\'s session rows with the account', async () => {
    const { adminCookie, member, laptop, phone } = await signedInPair('sess-admin-delete');
    expect(await sessionRows(testDb as never, member.id)).toHaveLength(2);

    const res = await request(app).delete(`/api/admin/users/${member.id}`).set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    expect(await sessionRows(testDb as never, member.id)).toEqual([]);
    expect((await me(laptop)).status).toBe(401);
    expect((await me(phone)).status).toBe(401);
    expect((await me(adminCookie)).status).toBe(200);
  }, 30000);

  it('SESS-E2E-ADMIN-004: an admin edit that leaves the password alone signs nobody out', async () => {
    const { adminCookie, member, laptop, phone } = await signedInPair('sess-admin-rename');

    const res = await request(app)
      .put(`/api/admin/users/${member.id}`)
      .set('Cookie', adminCookie)
      .send({ username: 'sess-admin-renamed' });
    expect(res.status).toBe(200);

    expect((await me(laptop)).status).toBe(200);
    expect((await me(phone)).status).toBe(200);
    expect(await liveRows(member.id)).toHaveLength(2);
  }, 30000);
});
