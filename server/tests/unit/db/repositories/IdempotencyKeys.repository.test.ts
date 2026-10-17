import { IdempotencyKeys } from '../../../../src/db/entities/IdempotencyKeys.entity';
import type { IdempotencyKeysRepository } from '../../../../src/db/repositories/IdempotencyKeys.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { countRows, findRow, findRows, insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

function seedKey(
  key: string,
  userId: number,
  method: string,
  path: string,
  statusCode: number,
  responseBody: string,
  createdAt?: number,
) {
  return insertRow(t, IdempotencyKeys, {
    key,
    user: userId,
    method,
    path,
    status_code: statusCode,
    response_body: responseBody,
    ...(createdAt !== undefined ? { created_at: createdAt } : {}),
  });
}

const testDb = createSnapshotTestDb();
let t: TestOrm;
let idempotencyKeys: IdempotencyKeysRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  idempotencyKeys = t.repo(IdempotencyKeys);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('IdempotencyKeysRepository.findResponse (Plan 4 Task 1)', () => {
  it('IDEMPREPO-001: returns status_code/response_body only, scoped by the full (key, user, method, path) composite key', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    await seedKey('k', user.id, 'POST', '/api/categories', 201, '{"id":1}');

    expect(await idempotencyKeys.findResponse('k', user.id, 'POST', '/api/categories')).toEqual({
      status_code: 201,
      response_body: '{"id":1}',
    });
    // Same key, different user — a different row entirely, not this one.
    expect(await idempotencyKeys.findResponse('k', other.id, 'POST', '/api/categories')).toBeNull();
    // Same key/user, different method or path — must not cross-match.
    expect(await idempotencyKeys.findResponse('k', user.id, 'PUT', '/api/categories')).toBeNull();
    expect(await idempotencyKeys.findResponse('k', user.id, 'POST', '/api/tags')).toBeNull();
  });

  it('IDEMPREPO-002: null when no row matches at all', async () => {
    const { user } = createUser(testDb);
    expect(await idempotencyKeys.findResponse('missing', user.id, 'POST', '/x')).toBeNull();
  });
});

describe('IdempotencyKeysRepository.insertIfAbsent (Plan 4 Task 1)', () => {
  it('IDEMPREPO-003: inserts every bound column, including the caller-supplied created_at', async () => {
    const { user } = createUser(testDb);
    await idempotencyKeys.insertIfAbsent({
      key: 'k',
      user_id: user.id,
      method: 'POST',
      path: '/api/places',
      status_code: 201,
      response_body: '{"ok":true}',
      created_at: 1_700_000_000,
    });

    const stored = (await findRow(t, IdempotencyKeys, { key: 'k' }))!;
    const row = {
      key: stored.key,
      user_id: stored.user_id,
      method: stored.method,
      path: stored.path,
      status_code: stored.status_code,
      response_body: stored.response_body,
      created_at: stored.created_at,
    };
    expect(row).toEqual({
      key: 'k',
      user_id: user.id,
      method: 'POST',
      path: '/api/places',
      status_code: 201,
      response_body: '{"ok":true}',
      created_at: 1_700_000_000,
    });
  });

  it('IDEMPREPO-004: a second insert on the SAME (key, user, method, path) is ignored — the first write wins (INSERT OR IGNORE parity)', async () => {
    const { user } = createUser(testDb);
    await idempotencyKeys.insertIfAbsent({
      key: 'k',
      user_id: user.id,
      method: 'POST',
      path: '/api/places',
      status_code: 201,
      response_body: '{"first":true}',
      created_at: 1_700_000_000,
    });
    await idempotencyKeys.insertIfAbsent({
      key: 'k',
      user_id: user.id,
      method: 'POST',
      path: '/api/places',
      status_code: 500,
      response_body: '{"second":true}',
      created_at: 1_800_000_000,
    });

    expect(await idempotencyKeys.findResponse('k', user.id, 'POST', '/api/places')).toEqual({
      status_code: 201,
      response_body: '{"first":true}',
    });
    expect(await countRows(t, IdempotencyKeys)).toBe(1);
  });

  it('IDEMPREPO-005: the SAME key for a DIFFERENT user is a separate row, not a conflict', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb, { username: 'b' });
    await idempotencyKeys.insertIfAbsent({
      key: 'k',
      user_id: a.id,
      method: 'POST',
      path: '/x',
      status_code: 200,
      response_body: '{}',
      created_at: 1,
    });
    await idempotencyKeys.insertIfAbsent({
      key: 'k',
      user_id: b.id,
      method: 'POST',
      path: '/x',
      status_code: 200,
      response_body: '{}',
      created_at: 2,
    });
    expect(await countRows(t, IdempotencyKeys)).toBe(2);
  });
});

describe('IdempotencyKeysRepository.deleteExpired (Plan 4 Task 1)', () => {
  it('IDEMPREPO-006: deletes rows strictly older than the cutoff, returns the row count, leaves the rest', async () => {
    const { user } = createUser(testDb);
    await seedKey('old', user.id, 'POST', '/x', 200, '{}', 100);
    await seedKey('boundary', user.id, 'POST', '/y', 200, '{}', 200);
    await seedKey('fresh', user.id, 'POST', '/z', 200, '{}', 300);

    const removed = await idempotencyKeys.deleteExpired(200);

    expect(removed).toBe(1);
    const keys = (await findRows(t, IdempotencyKeys, {}, { key: 'asc' })).map((r) => r.key);
    expect(keys).toEqual(['boundary', 'fresh']);
  });

  it('IDEMPREPO-007: zero rows removed when nothing is old enough', async () => {
    const { user } = createUser(testDb);
    await seedKey('fresh', user.id, 'POST', '/z', 200, '{}', 1000);
    expect(await idempotencyKeys.deleteExpired(500)).toBe(0);
  });
});
