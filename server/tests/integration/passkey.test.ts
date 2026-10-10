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
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createAdmin } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { MikroORM } from '@mikro-orm/core';
import { findRow, insertRow } from '../helpers/factories/rows';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { WebauthnCredentials } from '../../src/db/entities/WebauthnCredentials.entity';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

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
    await insertRow(orm, WebauthnCredentials, {
      id: 16, user: user.id, credential_id: 'cred-16', public_key: Buffer.from([0]), name: 'Original16',
    });

    const res = await request(app)
      .patch('/api/auth/passkey/credentials/0x10')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Passkey not found' });
    const row = (await findRow(orm, WebauthnCredentials, { id: 16 }))!;
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

    const res = await request(app)
      .delete('/api/admin/users/abc/passkeys')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });
});

describe('Registration invite deletion — prefixed numeric literal parity (Plan 3b Task 3 review, F2)', () => {
  it('INVITE-INT-001 — DELETE /admin/invites/0x10 (hex literal) returns the legacy 404 and leaves invite id 16 untouched', async () => {
    const { user: admin } = createAdmin(testDb);
    await insertRow(orm, InviteTokens, {
      id: 16, token: 'hex-literal-survivor', max_uses: 1, used_count: 0, expires_at: null, createdByRef: admin.id,
    });

    const res = await request(app)
      .delete('/api/admin/invites/0x10')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invite not found' });
    expect(await findRow(orm, InviteTokens, { id: 16 })).not.toBeNull();
  });
});
