/**
 * Backup integration tests.
 * Covers BACKUP-001 to BACKUP-008.
 *
 * Note: createBackup() is async and creates real files.
 *       These tests run in test env and may not have a full DB file to zip,
 *       but the service should handle gracefully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

// Mock filesystem-dependent service functions to avoid real disk I/O in tests
vi.mock('../../src/nest/backup/backup.impl', async () => {
  const actual = await vi.importActual<typeof import('../../src/nest/backup/backup.impl')>('../../src/nest/backup/backup.impl');
  return {
    ...actual,
    createBackup: vi.fn().mockResolvedValue({
      filename: 'backup-2026-04-03T06-00-00.zip',
      size: 1024,
      sizeText: '1.0 KB',
      created_at: new Date().toISOString(),
    }),
    restoreFromZip: vi.fn().mockResolvedValue({ success: true }),
    restoreBackup: vi.fn().mockResolvedValue({ success: true }),
    deleteBackup: vi.fn().mockReturnValue(undefined),
    backupFileExists: vi.fn().mockReturnValue(false),
    // Keep checkRateLimit from actual so rate-limit tests work correctly
    checkRateLimit: vi.fn().mockReturnValue(true),
  };
});

// The auto-settings routes live on AutoBackupJob now; keep its settings-file
// I/O off the real data/ dir (the scheduling itself is off under the test gate).
vi.mock('../../src/nest/backup/auto-backup.settings', async () => {
  const actual = await vi.importActual<typeof import('../../src/nest/backup/auto-backup.settings')>('../../src/nest/backup/auto-backup.settings');
  return {
    ...actual,
    loadSettings: vi.fn(() => ({ enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 })),
    saveSettings: vi.fn(),
  };
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createAdmin, createUser } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import * as backupService from '../../src/nest/backup/backup.impl';
import { DEFAULT_BACKUPS_ROOT } from '../../src/nest/storage/storage-paths';
import fs from 'fs';
import path from 'path';
import os from 'os';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Backup access control', () => {
  it('non-admin cannot access backup routes', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/backup/list')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(403);
  });
});

describe('Backup list', () => {
  it('BACKUP-001 — GET /backup/list returns backups array', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .get('/api/backup/list')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.backups)).toBe(true);
  });
});

describe('Backup creation', () => {
  it('BACKUP-001 — POST /backup/create creates a backup', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/backup/create')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.backup).toHaveProperty('filename');
    expect(res.body.backup).toHaveProperty('size');
  });
});

describe('Auto-backup settings', () => {
  it('BACKUP-008 — GET /backup/auto-settings returns current config', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .get('/api/backup/auto-settings')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toHaveProperty('enabled');
  });

  it('BACKUP-008 — PUT /backup/auto-settings updates settings', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .put('/api/backup/auto-settings')
      .set('Cookie', authCookie(admin.id))
      .send({ enabled: false, interval: 'daily', keep_days: 7 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toHaveProperty('enabled');
    expect(res.body.settings).toHaveProperty('interval');
  });
});

describe('Backup security', () => {
  it('BACKUP-007 — Download with path traversal filename is rejected', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .get('/api/backup/download/../../etc/passwd')
      .set('Cookie', authCookie(admin.id));
    // Express normalises the URL before routing; path traversal gets resolved
    // to a path that matches no route → 404
    expect(res.status).toBe(404);
  });

  it('BACKUP-007 — Delete with path traversal filename is rejected', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .delete('/api/backup/../../../etc/passwd')
      .set('Cookie', authCookie(admin.id));
    // Express normalises the URL, stripping traversal → no route match → 404
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

describe('Backup download', () => {
  // Serving goes through the real StorageService now (sendBackupToResponse is
  // NOT overridden in the impl mock), so the fixture must live in the real
  // backups root. Only this one file is cleaned up — never the whole dir.
  const downloadFixture = 'backup-2026-04-06T12-00-00.zip';
  const downloadFixturePath = path.join(DEFAULT_BACKUPS_ROOT, downloadFixture);

  beforeEach(() => {
    vi.mocked(backupService.backupFileExists).mockResolvedValue(true);
  });

  afterAll(() => {
    try { fs.unlinkSync(downloadFixturePath); } catch {}
  });

  it('BACKUP-INT-001 — GET /backup/download/:filename returns 200 with content-disposition', async () => {
    const { user: admin } = createAdmin(testDb);
    // (Re)write the fixture immediately before the request that serves it.
    fs.mkdirSync(DEFAULT_BACKUPS_ROOT, { recursive: true });
    fs.writeFileSync(downloadFixturePath, 'fake zip content');

    const res = await request(app)
      .get(`/api/backup/download/${downloadFixture}`)
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment/i);
    expect(res.headers['content-disposition']).toContain(downloadFixture);
    // superagent has no parser for application/zip, so assert the byte count
    // rather than the (unbuffered) body.
    expect(res.headers['content-length']).toBe(String('fake zip content'.length));
  });

  it('BACKUP-INT-002 — GET /backup/download/:filename returns 400 for invalid filename', async () => {
    const { user: admin } = createAdmin(testDb);
    vi.mocked(backupService.backupFileExists).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/backup/download/not-a-valid-name.tar.gz')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid filename/i);
  });

  it('BACKUP-INT-003 — GET /backup/download/:filename returns 404 when file not found', async () => {
    const { user: admin } = createAdmin(testDb);
    vi.mocked(backupService.backupFileExists).mockResolvedValue(false);

    const res = await request(app)
      .get('/api/backup/download/backup-2026-04-06T12-00-00.zip')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ---------------------------------------------------------------------------
// Restore from existing backup
// ---------------------------------------------------------------------------

describe('Backup restore', () => {
  it('BACKUP-INT-004 — POST /backup/restore/:filename returns 200 on success', async () => {
    const { user: admin } = createAdmin(testDb);
    const filename = 'backup-2026-04-06T12-00-00.zip';

    vi.mocked(backupService.backupFileExists).mockResolvedValue(true);
    vi.mocked(backupService.restoreBackup).mockResolvedValue({ success: true });

    const res = await request(app)
      .post(`/api/backup/restore/${filename}`)
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(vi.mocked(backupService.restoreBackup)).toHaveBeenCalledWith(expect.anything(), filename);
  });

  it('BACKUP-INT-005 — POST /backup/restore/:filename returns 404 when backup not found', async () => {
    const { user: admin } = createAdmin(testDb);

    vi.mocked(backupService.backupFileExists).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/backup/restore/backup-2026-04-06T12-00-00.zip')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('BACKUP-INT-006 — POST /backup/restore/:filename returns 400 for invalid filename', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/backup/restore/../../evil.zip')
      .set('Cookie', authCookie(admin.id));

    // Express resolves path traversal → no route or invalid filename check
    expect([400, 404]).toContain(res.status);
  });

  it('BACKUP-INT-007 — POST /backup/restore/:filename returns 400 when the restore reports failure', async () => {
    const { user: admin } = createAdmin(testDb);
    const filename = 'backup-2026-04-06T12-00-00.zip';

    vi.mocked(backupService.backupFileExists).mockResolvedValue(true);
    vi.mocked(backupService.restoreBackup).mockResolvedValue({
      success: false,
      error: 'Invalid backup: travel.db not found',
      status: 400,
    });

    const res = await request(app)
      .post(`/api/backup/restore/${filename}`)
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/travel\.db not found/i);
  });
});

// ---------------------------------------------------------------------------
// Delete backup
// ---------------------------------------------------------------------------

describe('Backup delete', () => {
  it('BACKUP-INT-008 — DELETE /backup/:filename returns 200 on success', async () => {
    const { user: admin } = createAdmin(testDb);
    const filename = 'backup-2026-04-06T12-00-00.zip';

    vi.mocked(backupService.backupFileExists).mockResolvedValue(true);
    vi.mocked(backupService.deleteBackup).mockReturnValue(undefined);

    const res = await request(app)
      .delete(`/api/backup/${filename}`)
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // First arg is the app's real StorageService (BackupService forwards it).
    expect(vi.mocked(backupService.deleteBackup)).toHaveBeenCalledWith(expect.anything(), filename);
  });

  it('BACKUP-INT-009 — DELETE /backup/:filename returns 404 when not found', async () => {
    const { user: admin } = createAdmin(testDb);

    vi.mocked(backupService.backupFileExists).mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/backup/backup-2026-04-06T12-00-00.zip')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('BACKUP-INT-010 — DELETE /backup/:filename returns 400 for invalid filename', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .delete('/api/backup/not-a-backup.tar.gz')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid filename/i);
  });
});

// ---------------------------------------------------------------------------
// Rate limiter on POST /create
// ---------------------------------------------------------------------------

describe('Backup rate limiter', () => {
  it('BACKUP-INT-011 — POST /backup/create returns 429 after 3 requests', async () => {
    const { user: admin } = createAdmin(testDb);

    // Allow first 3 calls, then block
    let callCount = 0;
    vi.mocked(backupService.checkRateLimit).mockImplementation(() => {
      callCount++;
      return callCount <= 3;
    });

    // First 3 succeed
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/backup/create')
        .set('Cookie', authCookie(admin.id));
      expect(res.status).toBe(200);
    }

    // 4th is rate-limited
    const res = await request(app)
      .post('/api/backup/create')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many/i);
  });
});

// ---------------------------------------------------------------------------
// Upload-restore
// ---------------------------------------------------------------------------

describe('Backup upload-restore', () => {
  it('BACKUP-INT-012 — POST /backup/upload-restore with zip file returns 200', async () => {
    const { user: admin } = createAdmin(testDb);

    vi.mocked(backupService.restoreFromZip).mockResolvedValue({ success: true });

    // Create a minimal fake zip buffer (just needs to pass multer's file filter)
    const fakeZipBuffer = Buffer.from('PK\x03\x04'); // ZIP magic bytes

    const res = await request(app)
      .post('/api/backup/upload-restore')
      .set('Cookie', authCookie(admin.id))
      .attach('backup', fakeZipBuffer, { filename: 'test-restore.zip', contentType: 'application/zip' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(vi.mocked(backupService.restoreFromZip)).toHaveBeenCalled();
  });

  it('BACKUP-INT-013 — POST /backup/upload-restore with no file returns 400', async () => {
    const { user: admin } = createAdmin(testDb);

    const res = await request(app)
      .post('/api/backup/upload-restore')
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it('BACKUP-INT-014 — POST /backup/upload-restore returns 400 when restore fails', async () => {
    const { user: admin } = createAdmin(testDb);

    vi.mocked(backupService.restoreFromZip).mockResolvedValue({
      success: false,
      error: 'Uploaded file is not a valid SQLite database',
      status: 400,
    });

    const fakeZipBuffer = Buffer.from('PK\x03\x04');

    const res = await request(app)
      .post('/api/backup/upload-restore')
      .set('Cookie', authCookie(admin.id))
      .attach('backup', fakeZipBuffer, { filename: 'bad-restore.zip', contentType: 'application/zip' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a valid SQLite/i);
  });
});
