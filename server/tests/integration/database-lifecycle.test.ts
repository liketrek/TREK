import { buildApp } from '../../src/bootstrap';
import { SqliteDatabaseBackup } from '../../src/nest/backup/sqlite-database-backup';
import { DATABASE_BACKUP, type DatabaseBackupStrategy } from '../../src/nest/database/database-backup.interface';
import { DatabaseLifecycle } from '../../src/nest/database/database-lifecycle.service';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * The core database's lifecycle, owned by the DatabaseLifecycle provider, on a
 * real boot.
 *
 * The connection used to open as a side effect of importing db/database.ts and
 * was closed and reopened through module functions the restore and the demo
 * reset called directly. buildApp() now opens it through the provider, which
 * also binds the ORM to later swaps; the backup port closes and reopens it
 * through the same provider. Unmocked on purpose: under NODE_ENV=test the
 * module opens a copy of the migrated schema snapshot, and every reopen opens a
 * pristine copy again, which is all these cases need.
 */
describe('the database connection lifecycle under buildApp()', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('LIFECYCLE-001: the boot opened the connection through the provider and the database answers', async () => {
    expect(app.get(DatabaseLifecycle).file).toBe(':memory:');

    const res = await request(app.getHttpServer()).get('/api/health/ready');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  it('LIFECYCLE-002: closed, the readiness probe answers 503; reopened, the ORM is bound to the new handle and it answers again', async () => {
    const lifecycle = app.get(DatabaseLifecycle);

    lifecycle.close();
    try {
      const down = await request(app.getHttpServer()).get('/api/health/ready');
      expect(down.status).toBe(503);
      expect(down.body).toEqual({ status: 'unavailable' });
    } finally {
      await lifecycle.reopen();
    }

    const up = await request(app.getHttpServer()).get('/api/health/ready');
    expect(up.status).toBe(200);
  });

  it('LIFECYCLE-003: the backup port the container hands out is the SQLite one, on the file the connection runs on', () => {
    const port = app.get<DatabaseBackupStrategy>(DATABASE_BACKUP);

    expect(port).toBeInstanceOf(SqliteDatabaseBackup);
    expect(port.location()).toBe(app.get(DatabaseLifecycle).file);
    // The in-memory test database has no file to copy.
    expect(port.canSnapshot()).toBe(false);
  });
});
