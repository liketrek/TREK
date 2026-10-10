/**
 * Authentication integration tests.
 * Covers AUTH-001 to AUTH-022, AUTH-028 to AUTH-033.
 * OIDC scenarios (AUTH-023 to AUTH-027) require a real IdP and are excluded.
 * Rate limiting scenarios (AUTH-004, AUTH-018) are at the end of this file.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { BucketList } from '../../src/db/entities/BucketList.entity';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { Categories } from '../../src/db/entities/Categories.entity';
import { CollabNotes } from '../../src/db/entities/CollabNotes.entity';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../src/db/entities/JourneyEntries.entity';
import { JourneyShareTokens } from '../../src/db/entities/JourneyShareTokens.entity';
import { Journeys } from '../../src/db/entities/Journeys.entity';
import { McpTokens } from '../../src/db/entities/McpTokens.entity';
import { NotificationChannelPreferences } from '../../src/db/entities/NotificationChannelPreferences.entity';
import { Notifications } from '../../src/db/entities/Notifications.entity';
import { OauthClients } from '../../src/db/entities/OauthClients.entity';
import { OauthConsents } from '../../src/db/entities/OauthConsents.entity';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { PackingBags } from '../../src/db/entities/PackingBags.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import { PasswordResetTokens } from '../../src/db/entities/PasswordResetTokens.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { ShareTokens } from '../../src/db/entities/ShareTokens.entity';
import { Tags } from '../../src/db/entities/Tags.entity';
import { TodoItems } from '../../src/db/entities/TodoItems.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { UserNoticeDismissals } from '../../src/db/entities/UserNoticeDismissals.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { VacayPlanMembers } from '../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../src/db/entities/VacayPlans.entity';
import { VisitedCountries } from '../../src/db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../src/db/entities/VisitedRegions.entity';
import { dbNow } from '../../src/db/types';
import { authCookie, authHeader } from '../helpers/auth';
import {
  createUser,
  createAdmin,
  createUserWithMfa,
  createInviteToken,
  createTrip,
  createBudgetItem,
  createJourney,
  createJourneyEntry,
  addJourneyContributor,
  addTripPhoto,
  createCategory,
  createTag,
  createTodoItem,
  createMcpToken,
  createBucketListItem,
  createVisitedCountry,
  createCollabNote,
  addTripMember,
} from '../helpers/factories';
import { findRow, insertRow, insertRowIgnoringConflict, updateRows } from '../helpers/factories/rows';
import { setAppSetting, setUserSetting } from '../helpers/factories/settings';
import { makeShareToken } from '../helpers/factories/trips';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { EntityClass, FilterQuery } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import { authenticator } from 'otplib';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Bare in-memory DB — schema applied in beforeAll after mocks register
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

/** The row matching `where`, or null once it is gone. */
function rowOf<T extends object>(entity: EntityClass<T>, where: FilterQuery<T>) {
  return findRow(orm, entity, where);
}

beforeEach(async () => {
  resetTestDb(testDb);
  // Reset rate limiter state between tests so they don't interfere
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

describe('Login', () => {
  it('AUTH-001 — successful login returns 200, user object, and trek_session cookie', async () => {
    const { user, password } = createUser(testDb);
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password_hash).toBeUndefined();
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    expect(cookies.some((c: string) => c.includes('trek_session'))).toBe(true);
  });

  it('AUTH-002 — wrong password returns 401 with generic message', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('AUTH-003 — non-existent email returns 401 with same generic message (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'SomePass1!' });
    expect(res.status).toBe(401);
    // Must be same message as wrong-password to avoid email enumeration
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('AUTH-013 — POST /api/auth/logout clears session cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : res.headers['set-cookie']
        ? [res.headers['set-cookie']]
        : [];
    const sessionCookie = cookies.find((c: string) => c.includes('trek_session'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

describe('Registration', () => {
  it('AUTH-005 — first user registration creates admin role and returns 201 + cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'firstadmin',
      email: 'admin@example.com',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [res.headers['set-cookie']];
    expect(cookies.some((c: string) => c.includes('trek_session'))).toBe(true);
  });

  it('AUTH-006 — registration with weak password is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'weakpwduser',
      email: 'weak@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('AUTH-007 — registration with common password is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'commonpwd',
      email: 'common@example.com',
      password: 'Password1', // 'password1' is in the COMMON_PASSWORDS set
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/common/i);
  });

  it('AUTH-008 — registration with duplicate email returns 409', async () => {
    createUser(testDb, { email: 'taken@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'taken@example.com',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(409);
  });

  it('AUTH-009 — registration disabled by admin returns 403', async () => {
    createUser(testDb);
    await setAppSetting(orm, 'allow_registration', 'false');
    const res = await request(app).post('/api/auth/register').send({
      username: 'blocked',
      email: 'blocked@example.com',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disabled/i);
  });

  it('AUTH-010 — registration with valid invite token succeeds even when registration disabled', async () => {
    const { user: admin } = createAdmin(testDb);
    await setAppSetting(orm, 'allow_registration', 'false');
    const invite = createInviteToken(testDb, { max_uses: 1, created_by: admin.id });

    const res = await request(app).post('/api/auth/register').send({
      username: 'invited',
      email: 'invited@example.com',
      password: 'Str0ng!Pass',
      invite_token: invite.token,
    });
    expect(res.status).toBe(201);

    const row = (await rowOf(InviteTokens, { id: invite.id }))!;
    expect(row.used_count).toBe(1);
  });

  it('AUTH-011 — GET /api/auth/invite/:token with expired token returns 410', async () => {
    const { user: admin } = createAdmin(testDb);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const invite = createInviteToken(testDb, { expires_at: yesterday, created_by: admin.id });

    const res = await request(app).get(`/api/auth/invite/${invite.token}`);
    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('AUTH-012 — GET /api/auth/invite/:token with exhausted token returns 410', async () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { max_uses: 1, created_by: admin.id });
    // Mark as exhausted
    await updateRows(orm, InviteTokens, { id: invite.id }, { used_count: 1 });

    const res = await request(app).get(`/api/auth/invite/${invite.token}`);
    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/fully used/i);
  });

  it('AUTH-013 — GET /api/auth/invite/:token for a never-expiring invite keeps expires_at present and null on the wire (rule 16, task-5-review F1/T1)', async () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { max_uses: 3, created_by: admin.id });
    await updateRows(orm, InviteTokens, { id: invite.id }, { used_count: 1 });

    const res = await request(app).get(`/api/auth/invite/${invite.token}`);
    expect(res.status).toBe(200);
    // toEqual cannot see a dropped key (undefined and missing compare equal),
    // so this asserts on the raw response text, byte for byte.
    expect(res.text).toBe(JSON.stringify({ valid: true, max_uses: 3, used_count: 1, expires_at: null }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration — whitespace normalization
// ─────────────────────────────────────────────────────────────────────────────

describe('Registration — whitespace normalization', () => {
  it('AUTH-REG-TRIM-1 — username with surrounding whitespace is trimmed before storage', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: '  trimmeduser  ',
      email: 'trimmed@example.com',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(201);
    const row = (await rowOf(Users, { email: 'trimmed@example.com' }))!;
    expect(row.username).toBe('trimmeduser');
  });

  it('AUTH-REG-TRIM-2 — email with surrounding whitespace is trimmed before storage', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'emailtrimuser',
      email: '  emailtrim@example.com  ',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(201);
    const row = (await rowOf(Users, { username: 'emailtrimuser' }))!;
    expect(row.email).toBe('emailtrim@example.com');
  });

  it('AUTH-REG-TRIM-3 — whitespace-padded username that trims to existing username returns 409', async () => {
    createUser(testDb, { username: 'alice', email: 'alice@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      username: '  alice  ',
      email: 'alice2@example.com',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(409);
  });

  it('AUTH-REG-TRIM-4 — whitespace-padded email that trims to existing email returns 409', async () => {
    createUser(testDb, { username: 'bob', email: 'bob@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      username: 'bob2',
      email: '  bob@example.com  ',
      password: 'Str0ng!Pass',
    });
    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration / login — non-ASCII case folding (program rule 18, Plan 3b
// Task 7 review H1: register('JOSÉ@x.com') then login with the exact stored
// spelling used to 401, and a duplicate registration used to 500 instead of
// 409, because the repository lowered the column with SQLite's ASCII-only
// LOWER() and the bound value with JS's full-Unicode toLowerCase().
// ─────────────────────────────────────────────────────────────────────────────

describe('Registration / login — non-ASCII case folding (H1)', () => {
  it('AUTH-NONASCII-1 — register a non-ASCII email, then log in with the exact stored spelling: 201, then 200', async () => {
    const register = await request(app).post('/api/auth/register').send({
      username: 'joseuser',
      email: 'JOSÉ@x.com',
      password: 'Str0ng!Pass',
    });
    expect(register.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email: 'JOSÉ@x.com', password: 'Str0ng!Pass' });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('JOSÉ@x.com');
  });

  it('AUTH-NONASCII-2 — registering the same non-ASCII email again returns 409, not 500', async () => {
    const first = await request(app).post('/api/auth/register').send({
      username: 'joseuser2',
      email: 'JOSÉ2@x.com',
      password: 'Str0ng!Pass',
    });
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send({
      username: 'differentname',
      email: 'JOSÉ2@x.com',
      password: 'Str0ng!Pass',
    });
    expect(second.status).toBe(409);
    expect(second.body.error).toBeDefined();
  });

  it('AUTH-NONASCII-3 — an ASCII-only account is unaffected (control)', async () => {
    const { user, password } = createUser(testDb, { email: 'ROOT@example.com' });
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(login.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Session / Me
// ─────────────────────────────────────────────────────────────────────────────

describe('Session', () => {
  it('AUTH-014 — GET /api/auth/me without session returns 401 AUTH_REQUIRED', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-014 — GET /api/auth/me with valid cookie returns safe user object', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.mfa_secret).toBeUndefined();
  });

  it('AUTH-021 — user with must_change_password=1 sees the flag in their profile', async () => {
    const { user } = createUser(testDb);
    await updateRows(orm, Users, { id: user.id }, { must_change_password: 1 });

    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.user.must_change_password).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// App Config (AUTH-028)
// ─────────────────────────────────────────────────────────────────────────────

describe('App config', () => {
  it('AUTH-028 — GET /api/auth/app-config returns expected flags', async () => {
    const res = await request(app).get('/api/auth/app-config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('allow_registration');
    expect(res.body).toHaveProperty('oidc_configured');
    expect(res.body).toHaveProperty('demo_mode');
    expect(res.body).toHaveProperty('has_users');
    expect(res.body).toHaveProperty('setup_complete');
  });

  it('AUTH-028 — allow_registration is false after admin disables it', async () => {
    createUser(testDb);
    await setAppSetting(orm, 'allow_registration', 'false');
    const res = await request(app).get('/api/auth/app-config');
    expect(res.status).toBe(200);
    expect(res.body.allow_registration).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Demo Login (AUTH-022)
// ─────────────────────────────────────────────────────────────────────────────

describe('Demo login', () => {
  it('AUTH-022 — POST /api/auth/demo-login without DEMO_MODE returns 404', async () => {
    delete process.env.DEMO_MODE;
    const res = await request(app).post('/api/auth/demo-login');
    expect(res.status).toBe(404);
  });

  it('AUTH-022 — POST /api/auth/demo-login with DEMO_MODE and demo user returns 200 + cookie', async () => {
    await insertRow(orm, Users, { username: 'demo', email: 'demo@trek.app', password_hash: 'x', role: 'user' });
    process.env.DEMO_MODE = 'true';
    try {
      const res = await request(app).post('/api/auth/demo-login');
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('demo@trek.app');
    } finally {
      delete process.env.DEMO_MODE;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MFA (AUTH-015 to AUTH-019)
// ─────────────────────────────────────────────────────────────────────────────

describe('MFA', () => {
  it('AUTH-015 — POST /api/auth/mfa/setup returns secret and QR data URL', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).post('/api/auth/mfa/setup').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.secret).toBeDefined();
    expect(res.body.otpauth_url).toContain('otpauth://');
    expect(res.body.qr_svg).toMatch(/^<svg/);
  });

  it('AUTH-015 — POST /api/auth/mfa/enable with valid TOTP code enables MFA', async () => {
    const { user } = createUser(testDb);

    const setupRes = await request(app).post('/api/auth/mfa/setup').set('Cookie', authCookie(user.id));
    expect(setupRes.status).toBe(200);

    const enableRes = await request(app)
      .post('/api/auth/mfa/enable')
      .set('Cookie', authCookie(user.id))
      .send({ code: authenticator.generate(setupRes.body.secret) });
    expect(enableRes.status).toBe(200);
    expect(enableRes.body.mfa_enabled).toBe(true);
    expect(Array.isArray(enableRes.body.backup_codes)).toBe(true);
  });

  it('AUTH-016 — login with MFA-enabled account returns mfa_required + mfa_token', async () => {
    const { user, password } = createUserWithMfa(testDb);
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.mfa_required).toBe(true);
    expect(typeof loginRes.body.mfa_token).toBe('string');
  });

  it('AUTH-016 — POST /api/auth/mfa/verify-login with valid code completes login', async () => {
    const { user, password, totpSecret } = createUserWithMfa(testDb);

    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const { mfa_token } = loginRes.body;

    const verifyRes = await request(app)
      .post('/api/auth/mfa/verify-login')
      .send({ mfa_token, code: authenticator.generate(totpSecret) });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user).toBeDefined();
    const cookies: string[] = Array.isArray(verifyRes.headers['set-cookie'])
      ? verifyRes.headers['set-cookie']
      : [verifyRes.headers['set-cookie']];
    expect(cookies.some((c: string) => c.includes('trek_session'))).toBe(true);
  });

  it('AUTH-017 — verify-login with invalid TOTP code returns 401', async () => {
    const { user, password } = createUserWithMfa(testDb);
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password });

    const verifyRes = await request(app)
      .post('/api/auth/mfa/verify-login')
      .send({ mfa_token: loginRes.body.mfa_token, code: '000000' });
    expect(verifyRes.status).toBe(401);
    expect(verifyRes.body.error).toMatch(/invalid/i);
  });

  it('AUTH-019 — disable MFA with valid password and TOTP code', async () => {
    const { user, password, totpSecret } = createUserWithMfa(testDb);

    const disableRes = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Cookie', authCookie(user.id))
      .send({ password, code: authenticator.generate(totpSecret) });
    expect(disableRes.status).toBe(200);
    expect(disableRes.body.mfa_enabled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Forced MFA Policy (AUTH-020)
// ─────────────────────────────────────────────────────────────────────────────

describe('Forced MFA policy', () => {
  it('AUTH-020 — non-MFA user is blocked (403 MFA_REQUIRED) when require_mfa is true', async () => {
    const { user } = createUser(testDb);
    await setAppSetting(orm, 'require_mfa', 'true');

    // mfaPolicy checks Authorization: Bearer header
    const res = await request(app).get('/api/trips').set(authHeader(user.id));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('MFA_REQUIRED');
  });

  it('AUTH-020 — /api/auth/me and MFA setup endpoints are exempt from require_mfa', async () => {
    const { user } = createUser(testDb);
    await setAppSetting(orm, 'require_mfa', 'true');

    const meRes = await request(app).get('/api/auth/me').set(authHeader(user.id));
    expect(meRes.status).toBe(200);

    const setupRes = await request(app).post('/api/auth/mfa/setup').set(authHeader(user.id));
    expect(setupRes.status).toBe(200);
  });

  it('AUTH-020 — MFA-enabled user passes through require_mfa policy', async () => {
    const { user } = createUserWithMfa(testDb);
    await setAppSetting(orm, 'require_mfa', 'true');

    const res = await request(app).get('/api/trips').set(authHeader(user.id));
    expect(res.status).toBe(200);
  });

  it('AUTH-020 — require_mfa guards nested Nest addon controllers, not just top-level routes', async () => {
    // The global MFA middleware runs ahead of the Express→Nest dispatch, so it
    // must block the deeper trip-scoped controllers (budget/packing/todo) too —
    // not only /api/trips. A regression that only guarded top-level paths would
    // leave every addon endpoint reachable without MFA.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await setAppSetting(orm, 'require_mfa', 'true');

    for (const path of [
      `/api/trips/${trip.id}/budget`,
      `/api/trips/${trip.id}/packing`,
      `/api/trips/${trip.id}/todo`,
    ]) {
      const res = await request(app).get(path).set(authHeader(user.id));
      expect(res.status, `${path} must be MFA-gated`).toBe(403);
      expect(res.body.code).toBe('MFA_REQUIRED');
    }
  });

  it('AUTH-020 — MFA-enabled user reaches nested Nest addon controllers under require_mfa', async () => {
    const { user } = createUserWithMfa(testDb);
    const trip = createTrip(testDb, user.id);
    await setAppSetting(orm, 'require_mfa', 'true');

    const res = await request(app).get(`/api/trips/${trip.id}/budget`).set(authHeader(user.id));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Short-lived tokens (AUTH-029, AUTH-030)
// ─────────────────────────────────────────────────────────────────────────────

describe('Short-lived tokens', () => {
  it('AUTH-029 — POST /api/auth/ws-token returns a single-use token', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).post('/api/auth/ws-token').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('AUTH-030 — POST /api/auth/resource-token returns a single-use token', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/auth/resource-token')
      .set('Cookie', authCookie(user.id))
      .send({ purpose: 'download' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Extended scenarios (AUTH-031 to AUTH-033)
// ─────────────────────────────────────────────────────────────────────────────

describe('Extended auth scenarios', () => {
  it('AUTH-031 — login succeeds with uppercased email (case-insensitive lookup)', async () => {
    const { user, password } = createUser(testDb, { email: 'alice@example.com' });

    const res = await request(app).post('/api/auth/login').send({ email: 'ALICE@EXAMPLE.COM', password });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('AUTH-032 — registration with duplicate username returns 409', async () => {
    createUser(testDb, { username: 'alice' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice2@example.com', password: 'Str0ng!Pass' });
    expect(res.status).toBe(409);
  });

  it('AUTH-033 — MFA backup code login succeeds and invalidates the used code', async () => {
    const { hashBackupCode, generateBackupCodes } = await import('../../src/nest/auth/auth.helpers');
    const { user, password } = createUserWithMfa(testDb);

    // Generate and store backup codes on the MFA-enabled user
    const backupCodes = generateBackupCodes();
    const backupHashes = backupCodes.map(hashBackupCode);
    await updateRows(orm, Users, { id: user.id }, { mfa_backup_codes: JSON.stringify(backupHashes) });

    // Step 1: login to get mfa_token
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(loginRes.body.mfa_required).toBe(true);
    const { mfa_token } = loginRes.body;

    // Step 2: verify with a backup code
    const res = await request(app).post('/api/auth/mfa/verify-login').send({ mfa_token, code: backupCodes[0] });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();

    // Step 3: same backup code is now consumed — second login attempt fails
    const loginRes2 = await request(app).post('/api/auth/login').send({ email: user.email, password });
    const { mfa_token: mfa_token2 } = loginRes2.body;

    const res2 = await request(app)
      .post('/api/auth/mfa/verify-login')
      .send({ mfa_token: mfa_token2, code: backupCodes[0] });
    expect(res2.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Account deletion
// ─────────────────────────────────────────────────────────────────────────────

describe('Account deletion', () => {
  it('AUTH-040 — DELETE /auth/me succeeds when user has FK references', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user: target } = createUser(testDb);
    const { user: otherUser } = createUser(testDb);
    const { user: thirdUser } = createUser(testDb);

    // trip_members.invited_by: target invited thirdUser to otherUser's trip
    // (trip survives deletion; only invited_by should become NULL)
    const otherTrip = createTrip(testDb, otherUser.id);
    await insertRow(orm, TripMembers, { trip: otherTrip.id, user: thirdUser.id, invitedByRef: target.id });

    // share_tokens.created_by: target created a share token for otherUser's trip
    await makeShareToken(orm, otherTrip.id, target.id, { token: 'tok-auth-test' });

    // budget_items.paid_by_user_id: target paid for an expense on otherUser's trip
    const budgetItem = createBudgetItem(testDb, otherTrip.id);
    await updateRows(orm, BudgetItems, { id: budgetItem.id }, { paidByUser: target.id });

    // journey_contributors: target is a contributor on otherUser's journey
    const otherJourney = createJourney(testDb, otherUser.id);
    addJourneyContributor(testDb, otherJourney.id, target.id);

    // journey_entries: target authored an entry on otherUser's journey
    createJourneyEntry(testDb, otherJourney.id, target.id);

    // journey_share_tokens: target created a share token for otherUser's journey
    await insertRow(orm, JourneyShareTokens, {
      journey: otherJourney.id,
      token: 'jst-auth-test',
      createdByRef: target.id,
    });

    // notifications.sender_id (SET NULL): target sent a notification to otherUser
    const sentNotifId = await insertRow(orm, Notifications, {
      type: 'simple',
      scope: 'trip',
      target: otherTrip.id,
      sender: target.id,
      recipient: otherUser.id,
      title_key: 'k',
      text_key: 'k',
    });
    // notifications.recipient_id (CASCADE): otherUser sent a notification to target
    await insertRow(orm, Notifications, {
      type: 'simple',
      scope: 'trip',
      target: otherTrip.id,
      sender: otherUser.id,
      recipient: target.id,
      title_key: 'k',
      text_key: 'k',
    });

    // user_notice_dismissals (CASCADE): target dismissed a notice
    await insertRow(orm, UserNoticeDismissals, { user: target.id, notice_id: 'test-notice', dismissed_at: Date.now() });

    // owned journey: target owns a journey with an entry (cascade-deletes on journey deletion)
    const ownedJourney = createJourney(testDb, target.id);
    createJourneyEntry(testDb, ownedJourney.id, target.id);

    // trip_files.uploaded_by (SET NULL): target uploaded a file to otherUser's trip
    const fileId = await insertRow(orm, TripFiles, {
      trip: otherTrip.id,
      filename: 'f.pdf',
      original_name: 'file.pdf',
      uploadedByRef: target.id,
    });

    // trek_photos.owner_id (SET NULL): target owns a photo in the central registry
    const trekPhotoId = await insertRow(orm, TrekPhotos, {
      provider: 'immich',
      asset_id: 'asset-auth-test',
      owner: target.id,
    });

    // trip_photos.user_id (CASCADE): target added a photo to otherUser's trip
    addTripPhoto(testDb, otherTrip.id, target.id, 'asset-tp-auth', 'immich');

    // trips.user_id (CASCADE): target owns a trip
    const ownedTrip = createTrip(testDb, target.id);

    // trip_members.user_id (CASCADE): target is a member of otherUser's trip
    addTripMember(testDb, otherTrip.id, target.id);

    // categories.user_id (SET NULL): target created a category
    const userCategory = createCategory(testDb, { user_id: target.id });

    // tags.user_id (CASCADE): target created a tag
    const userTag = createTag(testDb, target.id);

    // todo_items.assigned_user_id (SET NULL): target is assigned to a todo on otherUser's trip
    const todoItem = createTodoItem(testDb, otherTrip.id);
    await updateRows(orm, TodoItems, { id: todoItem.id }, { assignedUser: target.id });

    // packing_bags.user_id (SET NULL): target owns a packing bag on otherUser's trip
    const packBagId = await insertRow(orm, PackingBags, {
      trip: otherTrip.id,
      name: 'Bag',
      color: '#ff0000',
      user: target.id,
    });

    // mcp_tokens.user_id (CASCADE): target has an MCP API token
    createMcpToken(testDb, target.id);

    // oauth_tokens/consents.user_id (CASCADE): target has tokens from otherUser's OAuth client
    await insertRow(orm, OauthClients, {
      id: 'cl-auth-test',
      user: otherUser.id,
      name: 'App',
      client_id: 'cid-auth-test',
      client_secret_hash: 'h',
    });
    await insertRow(orm, OauthTokens, {
      client: 'cid-auth-test',
      user: target.id,
      access_token_hash: 'ath-auth',
      refresh_token_hash: 'rth-auth',
      access_token_expires_at: dbNow(new Date(Date.now() + 3600_000)),
      refresh_token_expires_at: dbNow(new Date(Date.now() + 30 * 86_400_000)),
    });
    await insertRow(orm, OauthConsents, { client: 'cid-auth-test', user: target.id });

    // vacay_plans.owner_id (CASCADE): target owns a vacation plan
    const vacayPlanId = await insertRow(orm, VacayPlans, { owner: target.id });

    // vacay_plan_members.user_id (CASCADE): target is a member of otherUser's vacay plan
    const otherVacayPlanId = await insertRow(orm, VacayPlans, { owner: otherUser.id });
    await insertRow(orm, VacayPlanMembers, { plan: otherVacayPlanId, user: target.id });

    // bucket_list.user_id (CASCADE): target has a bucket list item
    createBucketListItem(testDb, target.id);

    // visited_countries.user_id (CASCADE): target has visited a country
    createVisitedCountry(testDb, target.id, 'JP');

    // visited_regions.user_id (CASCADE): target has visited a region
    await insertRow(orm, VisitedRegions, {
      user: target.id,
      region_code: 'JP-13',
      region_name: 'Tokyo',
      country_code: 'JP',
    });

    // packing_templates.created_by (CASCADE): target created a packing template
    const packTemplateId = await insertRow(orm, PackingTemplates, { name: 'My Template', createdByRef: target.id });

    // invite_tokens.created_by (CASCADE): target created an invite token
    createInviteToken(testDb, { created_by: target.id });

    // collab_notes.user_id (CASCADE): target authored a collab note on otherUser's trip
    createCollabNote(testDb, otherTrip.id, target.id);

    // settings.user_id (CASCADE): target has a user setting
    await setUserSetting(orm, target.id, 'theme', 'dark');

    // password_reset_tokens.user_id (CASCADE): target has a pending password reset
    await insertRow(orm, PasswordResetTokens, {
      user: target.id,
      token_hash: 'prt-hash-auth',
      expires_at: dbNow(new Date(Date.now() + 3600_000)),
    });

    // audit_log.user_id (SET NULL): target performed an audited action
    const auditId = await insertRow(orm, AuditLog, { user: target.id, action: 'test.action', ip: '127.0.0.1' });

    // notification_channel_preferences.user_id (CASCADE): target has notification preferences
    await insertRowIgnoringConflict(orm, NotificationChannelPreferences, {
      user: target.id,
      event_type: 'trip_invite',
      channel: 'email',
    });

    // admin exists to ensure target (non-admin user) passes the last-admin guard
    void admin;

    const res = await request(app).delete('/api/auth/me').set('Cookie', authCookie(target.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(await rowOf(Users, { id: target.id })).toBeNull();
    // trip_members row survives but invited_by is now NULL
    expect((await rowOf(TripMembers, { trip: otherTrip.id, user: thirdUser.id }))!.invited_by).toBeNull();
    expect(await rowOf(ShareTokens, { createdByRef: target.id })).toBeNull();
    expect((await rowOf(BudgetItems, { id: budgetItem.id }))!.paid_by_user_id).toBeNull();
    expect(await rowOf(JourneyContributors, { journey: otherJourney.id, user: target.id })).toBeNull();
    expect(await rowOf(JourneyEntries, { author: target.id })).toBeNull();
    expect(await rowOf(JourneyShareTokens, { createdByRef: target.id })).toBeNull();
    // sent notification survives but sender_id becomes NULL
    expect((await rowOf(Notifications, { id: sentNotifId }))!.sender_id).toBeNull();
    // received notification is cascade-deleted
    expect(await rowOf(Notifications, { recipient: target.id })).toBeNull();
    // notice dismissals are cascade-deleted
    expect(await rowOf(UserNoticeDismissals, { user: target.id, notice_id: 'test-notice' })).toBeNull();
    // owned journey and its entries are cascade-deleted
    expect(await rowOf(Journeys, { user: target.id })).toBeNull();
    expect(await rowOf(JourneyEntries, { journey: ownedJourney.id })).toBeNull();
    // uploaded file survives but uploaded_by is now NULL
    expect((await rowOf(TripFiles, { id: fileId }))!.uploaded_by).toBeNull();
    // trek_photos row survives but owner_id is now NULL
    expect((await rowOf(TrekPhotos, { id: trekPhotoId }))!.owner_id).toBeNull();
    // trip_photos row for target is cascade-deleted
    expect(await rowOf(TripPhotos, { trip: otherTrip.id, user: target.id })).toBeNull();
    // owned trip is cascade-deleted
    expect(await rowOf(Trips, { id: ownedTrip.id })).toBeNull();
    // trip membership on others' trips is removed
    expect(await rowOf(TripMembers, { trip: otherTrip.id, user: target.id })).toBeNull();
    // category survives but user_id is NULL
    expect((await rowOf(Categories, { id: userCategory.id }))!.user_id).toBeNull();
    // tag is deleted
    expect(await rowOf(Tags, { id: userTag.id })).toBeNull();
    // todo assigned_user_id is NULL
    expect((await rowOf(TodoItems, { id: todoItem.id }))!.assigned_user_id).toBeNull();
    // packing bag survives but user_id is NULL
    expect((await rowOf(PackingBags, { id: packBagId }))!.user_id).toBeNull();
    // MCP tokens are deleted
    expect(await rowOf(McpTokens, { user: target.id })).toBeNull();
    // OAuth tokens and consents are deleted
    expect(await rowOf(OauthTokens, { user: target.id })).toBeNull();
    expect(await rowOf(OauthConsents, { user: target.id })).toBeNull();
    // owned vacay plan is deleted
    expect(await rowOf(VacayPlans, { id: vacayPlanId })).toBeNull();
    // vacay plan membership on others' plans is removed
    expect(await rowOf(VacayPlanMembers, { plan: otherVacayPlanId, user: target.id })).toBeNull();
    // bucket list items are deleted
    expect(await rowOf(BucketList, { user: target.id })).toBeNull();
    // travel history is deleted
    expect(await rowOf(VisitedCountries, { user: target.id, country_code: 'JP' })).toBeNull();
    expect(await rowOf(VisitedRegions, { user: target.id })).toBeNull();
    // packing template is deleted
    expect(await rowOf(PackingTemplates, { id: packTemplateId })).toBeNull();
    // invite tokens created by target are deleted
    expect(await rowOf(InviteTokens, { createdByRef: target.id })).toBeNull();
    // collab content is deleted
    expect(await rowOf(CollabNotes, { user: target.id, trip: otherTrip.id })).toBeNull();
    // user settings are deleted
    expect(await rowOf(Settings, { user: target.id })).toBeNull();
    // password reset tokens are deleted
    expect(await rowOf(PasswordResetTokens, { user: target.id })).toBeNull();
    // audit log entry survives but user_id is NULL
    expect((await rowOf(AuditLog, { id: auditId }))!.user_id).toBeNull();
    // notification channel preferences are deleted
    expect(await rowOf(NotificationChannelPreferences, { user: target.id, event_type: 'trip_invite' })).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (AUTH-004, AUTH-018) — placed last
// ─────────────────────────────────────────────────────────────────────────────

describe('Rate limiting', () => {
  it('AUTH-004 — login endpoint rate-limits after 10 attempts from the same IP', async () => {
    // beforeEach has cleared loginAttempts; we fill up exactly to the limit
    let lastStatus = 0;
    for (let i = 0; i <= 10; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ratelimit@example.com', password: 'wrong' });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it('AUTH-018 — MFA verify-login endpoint rate-limits after 5 attempts', async () => {
    let lastStatus = 0;
    for (let i = 0; i <= 5; i++) {
      const res = await request(app).post('/api/auth/mfa/verify-login').send({ mfa_token: 'badtoken', code: '000000' });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it('AUTH-019 — reset-password endpoint rate-limits after 5 attempts (parity with the legacy resetLimiter)', async () => {
    let lastStatus = 0;
    for (let i = 0; i <= 5; i++) {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'badtoken', new_password: 'NewPassw0rd!' });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MCP token management (AUTH-034 to AUTH-039)
// ─────────────────────────────────────────────────────────────────────────────

describe('MCP token management', () => {
  it('AUTH-034 — GET /auth/mcp-tokens returns empty list initially', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).get('/api/auth/mcp-tokens').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.tokens).toEqual([]);
  });

  it('AUTH-035 — POST /auth/mcp-tokens creates a token', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/auth/mcp-tokens')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'my-token' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token.raw_token).toBe('string');
  });

  it('AUTH-036 — POST /auth/mcp-tokens without name returns 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).post('/api/auth/mcp-tokens').set('Cookie', authCookie(user.id)).send({});
    expect(res.status).toBe(400);
  });

  it('AUTH-037 — DELETE /auth/mcp-tokens/:id deletes the token', async () => {
    const { user } = createUser(testDb);
    const createRes = await request(app)
      .post('/api/auth/mcp-tokens')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'to-delete' });
    expect(createRes.status).toBe(201);
    const tokenId = createRes.body.token.id;

    const delRes = await request(app).delete(`/api/auth/mcp-tokens/${tokenId}`).set('Cookie', authCookie(user.id));
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const listRes = await request(app).get('/api/auth/mcp-tokens').set('Cookie', authCookie(user.id));
    expect(listRes.body.tokens).toEqual([]);
  });

  it('AUTH-038 — DELETE /auth/mcp-tokens/:id returns 404 for non-existent', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).delete('/api/auth/mcp-tokens/99999').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });

  it('AUTH-039 — unauthenticated GET /auth/mcp-tokens returns 401', async () => {
    const res = await request(app).get('/api/auth/mcp-tokens');
    expect(res.status).toBe(401);
  });

  it('AUTH-040 — DELETE /auth/mcp-tokens/abc (non-numeric id) returns the legacy 404, not a 500 (Plan 3b Task 2 review, F1)', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).delete('/api/auth/mcp-tokens/abc').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Token not found' });
  });

  it('AUTH-041 — DELETE /auth/api-tokens/abc (non-numeric id) returns the legacy 404, not a 500 (Plan 3b Task 2 review, F1)', async () => {
    const { user } = createUser(testDb);
    const res = await request(app).delete('/api/auth/api-tokens/abc').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Token not found' });
  });
});
