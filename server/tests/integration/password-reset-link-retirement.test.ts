/**
 * A password reset link is a credential delivered to the account's email
 * address. Once the account's address or password changes, a link sent
 * before that must stop working, whoever changed it: the user in their own
 * settings or an admin in the user list. A link requested afterwards works.
 *
 * Boots the whole app and drives the registered routes; only the delivery of
 * the reset mail is replaced, so the test can read the link from it.
 */
import { buildApp } from '../../src/bootstrap';
import { AuthService } from '../../src/nest/auth/auth.service';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;
let delivered: { email: string; url: string }[];

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
  vi.spyOn(nestApp.get(AuthService), 'sendPasswordResetEmail').mockImplementation(async (email, url) => {
    delivered.push({ email, url });
    return { delivered: 'email' };
  });
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  delivered = [];
});

afterAll(async () => {
  vi.restoreAllMocks();
  await nestApp.close();
});

/** Asks for a reset link for this address and returns the token in it. */
async function resetToken(email: string): Promise<string> {
  const before = delivered.length;
  const res = await request(app).post('/api/auth/forgot-password').send({ email });
  expect(res.status).toBe(200);
  expect(delivered).toHaveLength(before + 1);
  expect(delivered[before].email).toBe(email);
  const token = new URL(delivered[before].url).searchParams.get('token');
  expect(token).toBeTruthy();
  return token as string;
}

function useToken(token: string, newPassword: string) {
  return request(app).post('/api/auth/reset-password').send({ token, new_password: newPassword });
}

describe('password reset links after the account changes', () => {
  it('PWRESET-RETIRE-001: a link sent to the old address stops working once the user changes their email', async () => {
    const { user } = await makeUser(orm);
    const oldLink = await resetToken(user.email);

    const changed = await request(app)
      .put('/api/auth/me/settings')
      .set('Cookie', authCookie(user.id))
      .send({ email: 'moved@current.example.test' });
    expect(changed.status).toBe(200);

    const reset = await useToken(oldLink, 'Recovered2026!x');
    expect(reset.status).toBe(400);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'moved@current.example.test', password: 'Recovered2026!x' });
    expect(login.status).toBe(401);

    // A link sent to the new address works.
    const freshLink = await resetToken('moved@current.example.test');
    expect((await useToken(freshLink, 'Current2026!x')).status).toBe(200);
  });

  it('PWRESET-RETIRE-002: saving the same address, or it in another case, keeps the link', async () => {
    const { user } = await makeUser(orm);
    const link = await resetToken(user.email);

    const saved = await request(app)
      .put('/api/auth/me/settings')
      .set('Cookie', authCookie(user.id))
      .send({ email: user.email.toUpperCase(), username: 'renamed_user' });
    expect(saved.status).toBe(200);

    expect((await useToken(link, 'StillMine2026!x')).status).toBe(200);
  });

  it('PWRESET-RETIRE-003: a link stops working once the user changes their password', async () => {
    const { user, password } = await makeUser(orm);
    const link = await resetToken(user.email);

    const changed = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', authCookie(user.id))
      .send({ current_password: password, new_password: 'Changed2026!x' });
    expect(changed.status).toBe(200);

    expect((await useToken(link, 'Recovered2026!x')).status).toBe(400);
  });

  it("PWRESET-RETIRE-004: a link stops working once an admin changes the user's email or sets a password", async () => {
    const { user: admin } = await makeAdmin(orm);
    const { user: emailUser } = await makeUser(orm);
    const { user: passwordUser } = await makeUser(orm);
    const emailLink = await resetToken(emailUser.email);
    const passwordLink = await resetToken(passwordUser.email);

    const moved = await request(app)
      .put(`/api/admin/users/${emailUser.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ email: 'admin-moved@current.example.test' });
    expect(moved.status).toBe(200);
    const reset = await request(app)
      .put(`/api/admin/users/${passwordUser.id}`)
      .set('Cookie', authCookie(admin.id))
      .send({ password: 'AdminSet2026!x' });
    expect(reset.status).toBe(200);

    expect((await useToken(emailLink, 'Recovered2026!x')).status).toBe(400);
    expect((await useToken(passwordLink, 'Recovered2026!x')).status).toBe(400);
  });
});
