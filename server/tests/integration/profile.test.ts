/**
 * User Profile & Settings integration tests.
 * Covers PROFILE-001 to PROFILE-015.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import path from 'path';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createAdmin, createTrip } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { MikroORM } from '@mikro-orm/core';
import { readUser } from '../helpers/factories/users';
import { insertRow } from '../helpers/factories/rows';
import { Users } from '../../src/db/entities/Users.entity';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;
const FIXTURE_JPEG = path.join(__dirname, '../fixtures/small-image.jpg');
const FIXTURE_PDF = path.join(__dirname, '../fixtures/test.pdf');

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

describe('PROFILE-001 — Get current user profile', () => {
  it('returns user object with expected fields', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.mfa_secret).toBeUndefined();
    expect(res.body.user).toHaveProperty('mfa_enabled');
    expect(res.body.user).toHaveProperty('must_change_password');
  });
});

// PUT /api/auth/me/settings — F3 (task-1-review.md): the B1 regression's
// user-visible symptom was exactly this route answering 200 while silently
// discarding the write. Asserts the DB row directly, not only the response
// body, and the response body against a fresh GET /api/auth/me — either one
// alone would have missed B1 (the response body came from the pre-flush
// in-memory entity, which still looked right).
describe('PUT /api/auth/me/settings (F3)', () => {
  it('PROFILE-016 — a username+email change persists: the response, a fresh GET, and the raw row all agree', async () => {
    const { user } = createUser(testDb, { username: 'before-name', email: 'before@example.test' });

    const put = await request(app)
      .put('/api/auth/me/settings')
      .set('Cookie', authCookie(user.id))
      .send({ username: 'after-name', email: 'after@example.test' });
    expect(put.status).toBe(200);
    expect(put.body.success).toBe(true);
    expect(put.body.user).toMatchObject({ username: 'after-name', email: 'after@example.test' });

    const get = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(get.status).toBe(200);
    expect(get.body.user).toMatchObject({ username: 'after-name', email: 'after@example.test' });

    const row = await readUser(orm, user.id);
    expect(row.username).toBe('after-name');
    expect(row.email).toBe('after@example.test');
  });

  // Program rule 18 / Plan 3b Task 7 review H1 — UP6's own-rename collision
  // check (findIdByEmailCI) must fold both sides of a non-ASCII identifier
  // with the same engine. (UP5's username collision check, findIdByUsernameCI,
  // is exercised at the repository level — USERSREPO-044b — since the
  // username field itself is ASCII-only by the service's own validation
  // regex, `^[a-zA-Z0-9_.-]+$`, so a non-ASCII collision can never reach
  // this route.)
  it('PROFILE-016b — renaming to a non-ASCII email that collides with ANOTHER user still 409s; renaming to one\'s own exact non-ASCII spelling succeeds', async () => {
    createUser(testDb, { email: 'JOSÉ-OTHER@x.com' });
    const { user } = createUser(testDb, { email: 'plain-self@example.test' });

    // Differs from the stored spelling only in ASCII-letter case (the accented
    // 'É' is kept as-is — SQLite's LOWER() never touches it): SQLite's own
    // LOWER() folds both to the same string, so this must still collide.
    const collideEmail = await request(app)
      .put('/api/auth/me/settings')
      .set('Cookie', authCookie(user.id))
      .send({ email: 'JOSÉ-OTHER@X.COM' });
    expect(collideEmail.status).toBe(409);

    // Renaming self to a non-ASCII spelling that collides with nobody else succeeds.
    const ownRename = await request(app)
      .put('/api/auth/me/settings')
      .set('Cookie', authCookie(user.id))
      .send({ email: 'JOSÉ-SELF@x.com' });
    expect(ownRename.status).toBe(200);
  });
});

describe('Avatar', () => {
  it('PROFILE-002 — upload valid JPEG avatar updates avatar_url', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/auth/avatar')
      .set('Cookie', authCookie(user.id))
      .attach('avatar', FIXTURE_JPEG);
    expect(res.status).toBe(200);
    expect(res.body.avatar_url).toBeDefined();
    expect(typeof res.body.avatar_url).toBe('string');
  });

  it('PROFILE-P01 — avatar bytes land at uploads/avatars under a bare uuid name', async () => {
    const fsMod = require('fs') as typeof import('fs');
    const pathMod = require('path') as typeof import('path');
    const avatarsDir = pathMod.join(__dirname, '../../uploads/avatars');
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/auth/avatar')
      .set('Cookie', authCookie(user.id))
      .attach('avatar', FIXTURE_JPEG);
    expect(res.status).toBe(200);
    const first = pathMod.basename(res.body.avatar_url);
    expect(first).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(fsMod.existsSync(pathMod.join(avatarsDir, first))).toBe(true);

    // Re-upload removes the previous file (saveAvatar's cleanup branch).
    const second = await request(app)
      .post('/api/auth/avatar')
      .set('Cookie', authCookie(user.id))
      .attach('avatar', FIXTURE_JPEG);
    expect(second.status).toBe(200);
    const secondName = pathMod.basename(second.body.avatar_url);
    expect(fsMod.existsSync(pathMod.join(avatarsDir, secondName))).toBe(true);
    expect(fsMod.existsSync(pathMod.join(avatarsDir, first))).toBe(false);
  });

  it('PROFILE-003 — uploading non-image (PDF) is rejected', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/auth/avatar')
      .set('Cookie', authCookie(user.id))
      .attach('avatar', FIXTURE_PDF);
    // multer fileFilter rejects non-image types (cb(null, false) → req.file undefined → 400)
    expect(res.status).toBe(400);
  });

  it('PROFILE-005 — DELETE /api/auth/avatar clears avatar_url', async () => {
    const { user } = createUser(testDb);
    // Upload first
    await request(app)
      .post('/api/auth/avatar')
      .set('Cookie', authCookie(user.id))
      .attach('avatar', FIXTURE_JPEG);

    const res = await request(app)
      .delete('/api/auth/avatar')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(me.body.user.avatar_url).toBeNull();
  });
});

describe('Password change', () => {
  it('PROFILE-006 — change password with valid credentials succeeds', async () => {
    const { user, password } = createUser(testDb);
    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', authCookie(user.id))
      .send({ current_password: password, new_password: 'NewStr0ng!Pass', confirm_password: 'NewStr0ng!Pass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PROFILE-007 — wrong current password returns 401', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', authCookie(user.id))
      .send({ current_password: 'WrongPass1!', new_password: 'NewStr0ng!Pass', confirm_password: 'NewStr0ng!Pass' });
    expect(res.status).toBe(401);
  });

  it('PROFILE-008 — weak new password is rejected', async () => {
    const { user, password } = createUser(testDb);
    const res = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', authCookie(user.id))
      .send({ current_password: password, new_password: 'weak', confirm_password: 'weak' });
    expect(res.status).toBe(400);
  });
});

describe('Settings', () => {
  it('PROFILE-009 — PUT /api/settings with key+value persists and GET returns it', async () => {
    const { user } = createUser(testDb);

    const put = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'dark_mode', value: 'dark' });
    expect(put.status).toBe(200);

    const get = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(user.id));
    expect(get.status).toBe(200);
    expect(get.body.settings).toHaveProperty('dark_mode', 'dark');
  });

  it('PROFILE-009 — PUT /api/settings without key returns 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ value: 'dark' });
    expect(res.status).toBe(400);
  });

  it('PROFILE-010 — POST /api/settings/bulk saves multiple keys atomically', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: { theme: 'dark', language: 'fr', timezone: 'Europe/Paris' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const get = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(user.id));
    expect(get.body.settings).toHaveProperty('theme', 'dark');
    expect(get.body.settings).toHaveProperty('language', 'fr');
    expect(get.body.settings).toHaveProperty('timezone', 'Europe/Paris');
  });
});

describe('Account deletion', () => {
  it('PROFILE-013 — DELETE /api/auth/me removes account, subsequent login fails', async () => {
    const { user, password } = createUser(testDb);

    const del = await request(app)
      .delete('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);

    // Should not be able to log in
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(login.status).toBe(401);
  });

  it('PROFILE-013 — admin cannot delete their own account', async () => {
    const { user: admin } = createAdmin(testDb);
    // Admins are protected from self-deletion
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Cookie', authCookie(admin.id));
    // deleteAccount returns 400 when the user is the last admin
    expect(res.status).toBe(400);
  });
});

describe('Travel stats', () => {
  it('PROFILE-014 — GET /api/auth/travel-stats returns stats object', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, {
      title: 'France Trip',
      start_date: '2024-06-01',
      end_date: '2024-06-05',
    });

    const res = await request(app)
      .get('/api/auth/travel-stats')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalTrips');
    expect(res.body.totalTrips).toBeGreaterThanOrEqual(1);
  });
});

describe('Demo mode protections', () => {
  it('PROFILE-015 — demo user cannot upload avatar (demoUploadBlock)', async () => {
    // demoUploadBlock checks for email === 'demo@nomad.app'
    const demoUser = { id: await insertRow(orm, Users, { username: 'demo', email: 'demo@nomad.app', password_hash: 'x', role: 'user' }) };
    process.env.DEMO_MODE = 'true';

    try {
      const res = await request(app)
        .post('/api/auth/avatar')
        .set('Cookie', authCookie(demoUser.id))
        .attach('avatar', FIXTURE_JPEG);
      expect(res.status).toBe(403);
    } finally {
      delete process.env.DEMO_MODE;
    }
  });
});
