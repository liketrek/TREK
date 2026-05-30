/**
 * Backup e2e — exercises the migrated /api/backup endpoints through the real
 * JwtAuthGuard + AdminGuard against a temp SQLite db. The backup service +
 * audit log are mocked; this focuses on auth (401), the admin gate (403 for a
 * non-admin), the rate-limit 429, filename guards and status codes.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));

const { backupSvc } = vi.hoisted(() => ({
  backupSvc: {
    listBackups: vi.fn(), createBackup: vi.fn(), restoreFromZip: vi.fn(), getAutoSettings: vi.fn(),
    updateAutoSettings: vi.fn(), deleteBackup: vi.fn(), isValidBackupFilename: vi.fn(), backupFilePath: vi.fn(),
    backupFileExists: vi.fn(), checkRateLimit: vi.fn(), getUploadTmpDir: () => '/tmp', BACKUP_RATE_WINDOW: 3600000,
    MAX_BACKUP_UPLOAD_SIZE: 1024,
  },
}));
vi.mock('../../src/services/backupService', () => backupSvc);

import { BackupModule } from '../../src/nest/backup/backup.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Backup e2e (real auth + admin guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [BackupModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, role: 'admin', email: 'admin@example.test' });
    seedUser(db as never, { id: 2, role: 'user', email: 'member@example.test' });
    app = await build();
    server = app.getHttpServer();
    backupSvc.listBackups.mockReturnValue([{ filename: 'a.zip', size: 1 }]);
    backupSvc.createBackup.mockResolvedValue({ filename: 'b.zip', size: 10 });
  });

  beforeEach(() => {
    backupSvc.isValidBackupFilename.mockReturnValue(true);
    backupSvc.backupFileExists.mockReturnValue(true);
    backupSvc.checkRateLimit.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/backup/list')).status).toBe(401);
  });

  it('403 for a non-admin', async () => {
    const res = await request(server).get('/api/backup/list').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('200 list for an admin', async () => {
    const res = await request(server).get('/api/backup/list').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ backups: [{ filename: 'a.zip', size: 1 }] });
  });

  it('429 when create is rate-limited', async () => {
    backupSvc.checkRateLimit.mockReturnValue(false);
    const res = await request(server).post('/api/backup/create').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'Too many backup requests. Please try again later.' });
  });

  it('400 on an invalid download filename', async () => {
    backupSvc.isValidBackupFilename.mockReturnValue(false);
    const res = await request(server).get('/api/backup/download/bad').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid filename' });
  });

  it('404 deleting a missing backup', async () => {
    backupSvc.backupFileExists.mockReturnValue(false);
    const res = await request(server).delete('/api/backup/x.zip').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Backup not found' });
  });
});
