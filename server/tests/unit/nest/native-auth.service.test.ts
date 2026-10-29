/**
 * NativeAuthService and the auth domain's LoginSessionService behind it, over
 * the container and a real in-memory SQLite: a code minted for a challenge
 * redeems once, with the matching verifier, into a tracked session, and the
 * login lands on the account.
 */
import { UserSessions } from '../../../src/db/entities/UserSessions.entity';
import { LoginSessionService } from '../../../src/nest/auth/login-session.service';
import { NativeAuthModule } from '../../../src/nest/native-auth/native-auth.module';
import { NativeAuthService } from '../../../src/nest/native-auth/native-auth.service';
import {
  InMemoryNativeHandoffStore,
  MAX_PENDING_HANDOFFS,
  NATIVE_HANDOFF_CODE_TTL_MS,
  NativeHandoffStore,
  type NativeHandoff,
} from '../../../src/nest/native-auth/native-handoff.store';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow } from '../../helpers/factories/rows';
import { makeUser, readUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const verifier = 'v'.repeat(43);
const challenge = createHash('sha256').update(verifier).digest('hex');
const client = { userAgent: 'TREK iOS' };

const db = createSnapshotTestDb();
let t: TestModule;
let service: NativeAuthService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [NativeAuthModule],
    overrides: [{ provide: MailerService, useValue: { sendPasswordResetEmail: vi.fn() } }],
  });
  service = t.get(NativeAuthService);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

const refused = expect.objectContaining({ status: 400, response: { error: 'Invalid or expired code' } });

describe('NativeAuthService', () => {
  it('NATIVE-SVC-001: redeems a code with the matching verifier into a remembered, tracked session', async () => {
    const { user } = await makeUser(orm());
    const before = await readUser(orm(), user.id);
    const code = await service.issueCode(user.id, challenge);

    const session = await service.redeem(code, verifier, client);

    expect(session.userId).toBe(user.id);
    const claims = jwt.decode(session.token) as { id: number; jti: string; remember?: boolean };
    expect(claims.id).toBe(user.id);
    expect(claims.remember).toBe(true);
    const row = await findRow(orm(), UserSessions, { id: claims.jti });
    expect(row?.user_id).toBe(user.id);
    expect(row?.user_agent).toBe('TREK iOS');
    const after = await readUser(orm(), user.id);
    expect(after.login_count).toBe(before.login_count + 1);
    expect(after.last_login).toBeTruthy();
  });

  it('NATIVE-SVC-002: a wrong verifier is refused and burns the code with it', async () => {
    const { user } = await makeUser(orm());
    const code = await service.issueCode(user.id, challenge);

    await expect(service.redeem(code, 'w'.repeat(43), client)).rejects.toEqual(refused);
    await expect(service.redeem(code, verifier, client)).rejects.toEqual(refused);
  });

  it('NATIVE-SVC-003: a code is single use', async () => {
    const { user } = await makeUser(orm());
    const code = await service.issueCode(user.id, challenge);

    await service.redeem(code, verifier, client);
    await expect(service.redeem(code, verifier, client)).rejects.toEqual(refused);
  });

  it('NATIVE-SVC-004: an unknown code is refused', async () => {
    await expect(service.redeem('nope', verifier, client)).rejects.toEqual(refused);
  });

  it('NATIVE-SVC-005: a code older than its ttl is refused', async () => {
    const { user } = await makeUser(orm());
    vi.useFakeTimers({ toFake: ['Date'] });
    const code = await service.issueCode(user.id, challenge);
    vi.setSystemTime(Date.now() + NATIVE_HANDOFF_CODE_TTL_MS + 1);

    await expect(service.redeem(code, verifier, client)).rejects.toEqual(refused);
  });

  it('NATIVE-SVC-006: a code whose account is gone mints no session', async () => {
    const sessions = await countRows(orm(), UserSessions);
    const code = await service.issueCode(987654, challenge);

    await expect(service.redeem(code, verifier, client)).rejects.toEqual(refused);
    expect(await countRows(orm(), UserSessions)).toBe(sessions);
  });

  it('NATIVE-SVC-007: a full store refuses to mint another code', async () => {
    vi.spyOn(t.get(NativeHandoffStore), 'put').mockResolvedValueOnce(false);

    await expect(service.issueCode(1, challenge)).rejects.toEqual(expect.objectContaining({ status: 503 }));
  });

  it('NATIVE-SVC-008: LoginSessionService answers null for an account that does not exist', async () => {
    expect(await t.get(LoginSessionService).signIn(987654, true, client)).toBeNull();
  });
});

describe('InMemoryNativeHandoffStore', () => {
  const entry = (expiresAt: number): NativeHandoff => ({ userId: 1, challenge, expiresAt });

  it('NATIVE-STORE-001: holds at most its cap of live codes', async () => {
    const store = new InMemoryNativeHandoffStore();
    const later = Date.now() + 60_000;
    const stored = await Promise.all(
      Array.from({ length: MAX_PENDING_HANDOFFS }, (_, i) => store.put(`c${i}`, entry(later))),
    );
    expect(stored.every(Boolean)).toBe(true);
    expect(await store.put('one-too-many', entry(later))).toBe(false);
  });

  it('NATIVE-STORE-002: expired codes are dropped on the next write and make room', async () => {
    const store = new InMemoryNativeHandoffStore();
    const past = Date.now() - 1;
    await Promise.all(Array.from({ length: MAX_PENDING_HANDOFFS }, (_, i) => store.put(`c${i}`, entry(past))));

    expect(await store.put('fresh', entry(Date.now() + 60_000))).toBe(true);
    expect(await store.take('c0')).toBeNull();
    expect(await store.take('fresh')).toEqual(expect.objectContaining({ userId: 1 }));
  });

  it('NATIVE-STORE-003: take removes the entry, expired or not', async () => {
    const store = new InMemoryNativeHandoffStore();
    await store.put('old', entry(Date.now() + 60_000));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 120_000);

    expect(await store.take('old')).toBeNull();
    vi.useRealTimers();
    expect(await store.take('old')).toBeNull();
  });
});
