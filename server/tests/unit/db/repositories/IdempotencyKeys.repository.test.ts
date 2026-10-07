import { IdempotencyKeys } from '../../../../src/db/entities/IdempotencyKeys.entity';
import type { IdempotencyKeysRepository } from '../../../../src/db/repositories/IdempotencyKeys.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
    testDb
      .prepare(
        'INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run('k', user.id, 'POST', '/api/categories', 201, '{"id":1}');

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

    const row = testDb
      .prepare(
        'SELECT key, user_id, method, path, status_code, response_body, created_at FROM idempotency_keys WHERE key = ?',
      )
      .get('k');
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
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM idempotency_keys').get()).toEqual({ c: 1 });
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
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM idempotency_keys').get()).toEqual({ c: 2 });
  });
});

describe('IdempotencyKeysRepository.deleteExpired (Plan 4 Task 1)', () => {
  it('IDEMPREPO-006: deletes rows strictly older than the cutoff, returns the row count, leaves the rest', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare(
        'INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('old', user.id, 'POST', '/x', 200, '{}', 100);
    testDb
      .prepare(
        'INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('boundary', user.id, 'POST', '/y', 200, '{}', 200);
    testDb
      .prepare(
        'INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('fresh', user.id, 'POST', '/z', 200, '{}', 300);

    const removed = await idempotencyKeys.deleteExpired(200);

    expect(removed).toBe(1);
    const keys = testDb
      .prepare('SELECT key FROM idempotency_keys ORDER BY key')
      .all()
      .map((r: { key: string }) => r.key);
    expect(keys).toEqual(['boundary', 'fresh']);
  });

  it('IDEMPREPO-007: zero rows removed when nothing is old enough', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare(
        'INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('fresh', user.id, 'POST', '/z', 200, '{}', 1000);
    expect(await idempotencyKeys.deleteExpired(500)).toBe(0);
  });
});
