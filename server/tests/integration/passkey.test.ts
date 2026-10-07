/**
 * Passkey management + admin invite deletion — non-numeric/prefixed id
 * regression coverage for Plan 3b Task 3's fix round.
 *
 * F1 (HIGH): `renamePasskey`/`deletePasskey`/`adminResetPasskeys` used to
 * hand a bare `Number(id)` to a MikroORM filter — a non-numeric route id
 * became `NaN`, which the ORM renders as the unquoted token `NaN` in the
 * generated SQL, and SQLite throws `InvalidFieldNameException: no such
 * column: NaN` (a 500). The legacy raw-SQL route always answered its
 * ordinary 404 for the same input. These cases pin the legacy status AND
 * body through a real HTTP request, per the fix round's task brief.
 *
 * F2 (LOW): `RegistrationInvitesService.deleteInvite`'s `Number(id)` +
 * `Number.isInteger` guard accepted prefixed numeric literals ('0x10') that
 * the legacy raw-string bind never matched — `toRowId` closes that gap.
 *
 * A new file, not an addition to `admin.test.ts`/`auth.test.ts`: another
 * implementer owns in-flight, unstaged changes in both files at the time
 * this fix round runs (Task 4, OAuth).
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { authCookie } from '../helpers/auth';
import { createUser, createAdmin } from '../helpers/factories';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Passkey management — non-numeric id parity (Plan 3b Task 3 review, F1)', () => {
  it('PASSKEY-INT-001 — PATCH /auth/passkey/credentials/abc (non-numeric id) returns the legacy 404, not a 500', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .patch('/api/auth/passkey/credentials/abc')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Passkey not found' });
  });

  it('PASSKEY-INT-002 — PATCH /auth/passkey/credentials/1abc (leading-digit non-numeric id) returns the legacy 404, not a 500', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .patch('/api/auth/passkey/credentials/1abc')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Passkey not found' });
  });

  // task-3-rereview.md R1: on the passkey credential routes the LEGACY bound
  // `Number(id)` (unlike the invite route's raw-string bind PASSKEY-INT-003's
  // sibling cases guard against), so `Number('0x10') === 16` and the legacy
  // statement would have ACTED ON credential 16, not answered a 404 — this
  // case pins the deliberate `toRowId` narrowing the fix round chose
  // (accepted deviation), not "the legacy 404". Credential 16 is seeded so
  // the case is load-bearing: dropping the `toRowId` guard makes
  // `renamePasskey` fall back to `Number(id)`, which would rename credential
  // 16 instead of 404ing — verified by hand, recorded in the task report.
  it('PASSKEY-INT-003 — PATCH /auth/passkey/credentials/0x10 (hex-literal id) is refused by the toRowId narrowing, even though credential 16 exists', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare(
        `INSERT INTO webauthn_credentials (id, user_id, credential_id, public_key, name)
       VALUES (16, ?, 'cred-16', X'00', 'Original16')`,
      )
      .run(user.id);

    const res = await request(app)
      .patch('/api/auth/passkey/credentials/0x10')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Passkey not found' });
    const row = testDb.prepare('SELECT name FROM webauthn_credentials WHERE id = 16').get() as { name: string };
    expect(row.name).toBe('Original16'); // untouched — not renamed to 'Ghost'
  });

  it('PASSKEY-INT-004 — DELETE /auth/passkey/credentials/abc (non-numeric id, correct password) returns the legacy 404, not a 500', async () => {
    const { user, password } = createUser(testDb);

    const res = await request(app)
      .delete('/api/auth/passkey/credentials/abc')
      .set('Cookie', authCookie(user.id))
      .send({ password });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Passkey not found' });
  });

  it('PASSKEY-INT-005 — DELETE /admin/users/abc/passkeys (non-numeric id) returns the legacy 404, not a 500', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app).delete('/api/admin/users/abc/passkeys').set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });
});

describe('Registration invite deletion — prefixed numeric literal parity (Plan 3b Task 3 review, F2)', () => {
  it('INVITE-INT-001 — DELETE /admin/invites/0x10 (hex literal) returns the legacy 404 and leaves invite id 16 untouched', async () => {
    const { user: admin } = createAdmin(testDb);
    testDb
      .prepare(
        'INSERT INTO invite_tokens (id, token, max_uses, used_count, expires_at, created_by) VALUES (16, ?, 1, 0, NULL, ?)',
      )
      .run('hex-literal-survivor', admin.id);

    const res = await request(app).delete('/api/admin/invites/0x10').set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invite not found' });
    expect(testDb.prepare('SELECT id FROM invite_tokens WHERE id = 16').get()).toBeDefined();
  });
});
