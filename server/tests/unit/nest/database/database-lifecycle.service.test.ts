/**
 * DatabaseLifecycle: the provider that owns when the core connection opens,
 * closes and reopens.
 *
 * The connection module and the schema bootstrap are mocked: what is pinned
 * here is the order the provider drives them in (the boot order the legacy
 * baseline depends on) and that the ORM is rebuilt around a reopened handle.
 * The real open, migrate and reopen run in tests/integration/database-lifecycle.test.ts.
 */
import { DatabaseLifecycle } from '../../../../src/nest/database/database-lifecycle.service';
import type { MikroORM } from '@mikro-orm/core';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dbMock, ormMock, calls } = vi.hoisted(() => {
  const calls: string[] = [];
  return {
    calls,
    dbMock: {
      getRawConnection: vi.fn(() => {
        calls.push('getRawConnection');
        return {};
      }),
      registerReinitializeHook: vi.fn((_hook: () => Promise<void>) => {
        calls.push('registerReinitializeHook');
      }),
      closeDb: vi.fn(() => {
        calls.push('closeDb');
      }),
      reinitialize: vi.fn(async () => {
        calls.push('reinitialize');
      }),
    },
    ormMock: {
      runSchemaBootstrap: vi.fn(async (_orm: unknown, opts?: { snapshot?: boolean }) => {
        calls.push(`runSchemaBootstrap:${JSON.stringify(opts ?? {})}`);
      }),
    },
  };
});

vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/db/orm', () => ormMock);

function ormStub() {
  const connection = {
    close: vi.fn(async (force?: boolean) => {
      calls.push(`connection.close:${String(force)}`);
    }),
    connect: vi.fn(async () => {
      calls.push('connection.connect');
    }),
  };
  return { orm: { em: { getConnection: () => connection } } as unknown as MikroORM, connection };
}

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
});

describe('DatabaseLifecycle', () => {
  it('DBLIFE-001: open() opens the connection, binds the ORM to later swaps, then brings the schema to head', async () => {
    const { orm } = ormStub();

    await new DatabaseLifecycle(orm).open();

    expect(calls).toEqual(['getRawConnection', 'registerReinitializeHook', 'runSchemaBootstrap:{}']);
    expect(ormMock.runSchemaBootstrap).toHaveBeenCalledWith(orm);
  });

  it('DBLIFE-002: the hook open() registers rebuilds the ORM client and migrates the new file without a pre-migrate copy', async () => {
    const { orm, connection } = ormStub();
    await new DatabaseLifecycle(orm).open();
    const hook = dbMock.registerReinitializeHook.mock.calls[0][0];
    calls.length = 0;

    await hook();

    expect(connection.close).toHaveBeenCalledWith(true);
    expect(calls).toEqual(['connection.close:true', 'connection.connect', 'runSchemaBootstrap:{"snapshot":false}']);
  });

  it('DBLIFE-007: listeners registered with onReopened run after the schema bootstrap of a reopen, in order', async () => {
    const { orm } = ormStub();
    const lifecycle = new DatabaseLifecycle(orm);
    lifecycle.onReopened(async () => {
      calls.push('listener:first');
    });
    lifecycle.onReopened(async () => {
      calls.push('listener:second');
    });
    await lifecycle.open();
    const hook = dbMock.registerReinitializeHook.mock.calls[0][0];
    calls.length = 0;

    await hook();

    expect(calls).toEqual([
      'connection.close:true',
      'connection.connect',
      'runSchemaBootstrap:{"snapshot":false}',
      'listener:first',
      'listener:second',
    ]);
  });

  it('DBLIFE-008: a listener that throws fails the reopen, so a listener must contain its own failures', async () => {
    const { orm } = ormStub();
    const lifecycle = new DatabaseLifecycle(orm);
    lifecycle.onReopened(async () => {
      throw new Error('listener broke');
    });
    await lifecycle.open();
    const hook = dbMock.registerReinitializeHook.mock.calls[0][0];

    await expect(hook()).rejects.toThrow('listener broke');
  });

  it('DBLIFE-003: close() and reopen() go through the connection module', async () => {
    const lifecycle = new DatabaseLifecycle(ormStub().orm);

    lifecycle.close();
    await lifecycle.reopen();

    expect(calls).toEqual(['closeDb', 'reinitialize']);
  });

  it('DBLIFE-004: a reopen that fails is not swallowed', async () => {
    dbMock.reinitialize.mockRejectedValueOnce(new Error('database is locked'));

    await expect(new DatabaseLifecycle(ormStub().orm).reopen()).rejects.toThrow('database is locked');
  });

  describe('file', () => {
    let dir: string | null = null;

    afterEach(() => {
      vi.unstubAllEnvs();
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
      dir = null;
    });

    it('DBLIFE-005: is the in-memory database under test', () => {
      expect(new DatabaseLifecycle(ormStub().orm).file).toBe(':memory:');
    });

    it('DBLIFE-006: is TREK_DB_FILE when it is set, the one path the connection, the backup and the restore share', () => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-lifecycle-'));
      const file = path.join(dir, 'nested', 'custom-name.db');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('TREK_DB_FILE', file);

      expect(new DatabaseLifecycle(ormStub().orm).file).toBe(file);
    });
  });
});
