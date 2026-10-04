/**
 * BOOT-RESTORE-001..008 — restoring a backup on a first start (#1089).
 *
 * Real files, a real archive and a real SQLite file: what is being protected is
 * the order of things on disk, and a mocked filesystem would only confirm the
 * calls this file makes. The plugin staging is the one seam stubbed, because
 * it moves trees under the plugin roots of the machine running the tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import archiver from 'archiver';
import Database from 'better-sqlite3';

const { stageMock } = vi.hoisted(() => ({ stageMock: vi.fn() }));
vi.mock('../../../src/nest/plugins/plugin-backup', () => ({ stageExtractedPluginTrees: stageMock }));

import { BootRestoreError, restoreOnFirstBoot } from '../../../src/nest/backup/boot-restore';

let root: string;
let dataDir: string;
let dbFile: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-boot-restore-'));
  dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  dbFile = path.join(dataDir, 'travel.db');
  stageMock.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

/** A database with the tables every TREK has, and one user to recognise it by. */
function trekDb(file: string, tables = ['users', 'trips', 'trip_members', 'places', 'days']) {
  const db = new Database(file);
  for (const t of tables) db.exec(`CREATE TABLE ${t} (id INTEGER PRIMARY KEY, name TEXT)`);
  if (tables.includes('users')) db.prepare('INSERT INTO users (name) VALUES (?)').run('from-backup');
  db.close();
}

async function archive(entries: Record<string, string | { file: string }>): Promise<string> {
  const zipPath = path.join(root, 'backup.zip');
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(zipPath);
    const zip = archiver('zip');
    out.on('close', () => resolve());
    zip.on('error', reject);
    zip.pipe(out);
    for (const [name, content] of Object.entries(entries)) {
      if (typeof content === 'string') zip.append(content, { name });
      else zip.file(content.file, { name });
    }
    void zip.finalize();
  });
  return zipPath;
}

async function goodArchive(extra: Record<string, string> = {}) {
  const src = path.join(root, 'src.db');
  trekDb(src);
  return archive({ 'travel.db': { file: src }, '.encryption_key': 'a'.repeat(64), 'uploads/covers/c.jpg': 'jpeg', ...extra });
}

describe('restoreOnFirstBoot', () => {
  it('BOOT-RESTORE-001: without the variable nothing happens', async () => {
    expect(await restoreOnFirstBoot({ archive: null, dbFile, dataDir })).toEqual({ restored: false, reason: 'unset' });
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-002: on a first start the backup\'s database, key and uploads are put in place', async () => {
    const zipPath = await goodArchive();

    const out = await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir });

    expect(out.restored).toBe(true);
    const db = new Database(dbFile, { readonly: true });
    expect(db.prepare('SELECT name FROM users').get()).toEqual({ name: 'from-backup' });
    db.close();
    expect(fs.readFileSync(path.join(dataDir, '.encryption_key'), 'utf8')).toBe('a'.repeat(64));
    if (!out.restored) throw new Error('unreachable');
    expect(fs.readFileSync(path.join(out.uploads!, 'covers', 'c.jpg'), 'utf8')).toBe('jpeg');
    expect(stageMock).toHaveBeenCalledWith(out.staging);
    expect(fs.existsSync(`${dbFile}.restore-tmp`)).toBe(false);
  });

  it('BOOT-RESTORE-003: with a database already there the backup is left alone, so a restart never rolls back', async () => {
    const zipPath = await goodArchive();
    trekDb(dbFile, ['users', 'trips', 'trip_members', 'places', 'days']);
    const before = fs.readFileSync(dbFile);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir })).toEqual({ restored: false, reason: 'database-exists' });
    expect(fs.readFileSync(dbFile).equals(before)).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only restored on a first start'));
  });

  it('BOOT-RESTORE-004: a missing archive stops the start instead of coming up empty', async () => {
    await expect(restoreOnFirstBoot({ archive: path.join(root, 'nope.zip'), dbFile, dataDir }))
      .rejects.toBeInstanceOf(BootRestoreError);
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-005: an archive without a database is refused and leaves no scratch behind', async () => {
    const zipPath = await archive({ 'notes.txt': 'hello' });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir }))
      .rejects.toThrow('RESTORE_FROM_BACKUP: Invalid backup: travel.db not found');
    expect(fs.existsSync(dbFile)).toBe(false);
    expect(fs.readdirSync(dataDir).filter(n => n.startsWith('restore-boot-'))).toEqual([]);
  });

  it('BOOT-RESTORE-006: a database that is not a TREK one is refused', async () => {
    const src = path.join(root, 'other.db');
    trekDb(src, ['users']);
    const zipPath = await archive({ 'travel.db': { file: src } });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir }))
      .rejects.toThrow('missing required table: trips');
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-007: an entry escaping the archive is refused', async () => {
    const zipPath = await archive({ '../escape.txt': 'x', 'travel.db': 'not a db' });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir }))
      .rejects.toThrow(/escapes the archive root|not a valid SQLite database/);
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-008: an archive with only a database restores it, without inventing a key or an uploads tree', async () => {
    const src = path.join(root, 'src.db');
    trekDb(src);
    const zipPath = await archive({ 'travel.db': { file: src } });

    const out = await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir });

    expect(out).toEqual({ restored: true, uploads: null, staging: expect.stringContaining('restore-boot-') });
    expect(fs.existsSync(dbFile)).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.encryption_key'))).toBe(false);
  });
});
