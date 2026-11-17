import { MaintenanceRepository } from '../../../../src/db/repositories/MaintenanceRepository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { TableNotFoundException } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let maintenance: MaintenanceRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  maintenance = new MaintenanceRepository(t.em);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('MaintenanceRepository', () => {
  it('MAINTREPO-001: ping sends SELECT 1 and resolves while the database answers', async () => {
    const spy = vi.spyOn(t.em.getConnection(), 'execute');
    try {
      await expect(maintenance.ping()).resolves.toBeUndefined();
      // The first statement sent; the ORM may read its own metadata afterwards.
      expect(spy.mock.calls[0]?.[0]).toBe('SELECT 1');
    } finally {
      spy.mockRestore();
    }
  });

  it('MAINTREPO-004: ping throws outside a request context (fail-closed, matching TrekRepository)', async () => {
    const { MikroORM } = await import('@mikro-orm/core');
    const fresh = await MikroORM.init({
      entities: [],
      driver: (await import('../../../../src/db/orm-driver')).createBoundSqliteDriver(() => testDb),
      dbName: ':memory:',
      allowGlobalContext: false,
      discovery: { warnWhenNoEntities: false },
    });
    try {
      const unwrapped = new MaintenanceRepository(fresh.em);
      await expect(unwrapped.ping()).rejects.toThrow();
    } finally {
      await fresh.close(false);
    }
  });

  it('MAINTREPO-005: deletePluginUserData empties the three plugin tables and rethrows any failure, a missing table included', async () => {
    const spy = vi.spyOn(t.em.getConnection(), 'execute');
    try {
      await expect(maintenance.deletePluginUserData(1)).resolves.toBeUndefined();
      expect(spy.mock.calls.map((call) => call[0]).filter((sql) => String(sql).startsWith('DELETE'))).toEqual([
        'DELETE FROM plugin_user_config WHERE user_id = ?',
        'DELETE FROM plugin_oauth_tokens WHERE user_id = ?',
        'DELETE FROM plugin_oauth_state WHERE user_id = ?',
      ]);

      // No savepoint swallows it: the erasure's transaction rolls back instead.
      spy.mockRejectedValueOnce(new TableNotFoundException(new Error('no such table: plugin_user_config')));
      await expect(maintenance.deletePluginUserData(1)).rejects.toThrow('no such table');

      spy.mockRejectedValueOnce(new Error('connection lost'));
      await expect(maintenance.deletePluginUserData(1)).rejects.toThrow('connection lost');
    } finally {
      spy.mockRestore();
    }
  });
});
