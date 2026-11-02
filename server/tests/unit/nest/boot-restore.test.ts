/**
 * BOOT-RESTORE-001..009 — restoring a backup on a first start (#1089).
 *
 * Real files, a real archive and a real SQLite file: what is being protected is
 * the order of things on disk, and a mocked filesystem would only confirm the
 * calls this file makes. The plugin staging is the one seam stubbed, because
 * it moves trees under the plugin roots of the machine running the tests.
 */
import { knownMigrationNames } from '../../../src/db/known-migrations';
import { BootRestoreError, restoreOnFirstBoot } from '../../../src/nest/backup/boot-restore';

import archiver from 'archiver';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { stageMock } = vi.hoisted(() => ({ stageMock: vi.fn() }));
vi.mock('../../../src/nest/plugins/plugin-backup', () => ({ stageExtractedPluginTrees: stageMock }));

let root: string;
let dataDir: string;
let dbFile: string;
let reclaimResetFile: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-boot-restore-'));
  dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir);
  dbFile = path.join(dataDir, 'travel.db');
  reclaimResetFile = path.join(dataDir, '.trek-reclaim-reset');
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
  // test-sql-allow: a hand-made backup database, before any boot; no ORM is bound to it.
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
  return archive({
    'travel.db': { file: src },
    '.encryption_key': 'a'.repeat(64),
    'uploads/covers/c.jpg': 'jpeg',
    ...extra,
  });
}

describe('restoreOnFirstBoot', () => {
  it('BOOT-RESTORE-001: without the variable nothing happens', async () => {
    expect(await restoreOnFirstBoot({ archive: null, dbFile, dataDir, reclaimResetFile })).toEqual({
      restored: false,
      reason: 'unset',
    });
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it("BOOT-RESTORE-002: on a first start the backup's database, key and uploads are put in place", async () => {
    const zipPath = await goodArchive();

    const out = await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile });

    expect(out.restored).toBe(true);
    const db = new Database(dbFile, { readonly: true });
    // test-sql-allow: the restored file is read before any boot; no ORM is bound to it.
    expect(db.prepare('SELECT name FROM users').get()).toEqual({ name: 'from-backup' });
    db.close();
    expect(fs.readFileSync(path.join(dataDir, '.encryption_key'), 'utf8')).toBe('a'.repeat(64));
    if (!out.restored) throw new Error('unreachable');
    expect(fs.readFileSync(path.join(out.uploads!, 'covers', 'c.jpg'), 'utf8')).toBe('jpeg');
    expect(stageMock).toHaveBeenCalledWith(out.staging);
    expect(fs.existsSync(`${dbFile}.restore-tmp`)).toBe(false);
    // Storage reclaim drops the restored database's reclaim state on this start, whichever install it is from.
    expect(fs.existsSync(reclaimResetFile)).toBe(true);
  });

  it('BOOT-RESTORE-003: with a database already there the backup is left alone, so a restart never rolls back', async () => {
    const zipPath = await goodArchive();
    trekDb(dbFile, ['users', 'trips', 'trip_members', 'places', 'days']);
    const before = fs.readFileSync(dbFile);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile })).toEqual({
      restored: false,
      reason: 'database-exists',
    });
    expect(fs.readFileSync(dbFile).equals(before)).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only restored on a first start'));
    expect(fs.existsSync(reclaimResetFile)).toBe(false);
  });

  it('BOOT-RESTORE-004: a missing archive stops the start instead of coming up empty', async () => {
    await expect(
      restoreOnFirstBoot({ archive: path.join(root, 'nope.zip'), dbFile, dataDir, reclaimResetFile }),
    ).rejects.toBeInstanceOf(BootRestoreError);
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  describe('on Postgres', () => {
    /**
     * Stand-in client tools: psql lists the tables written to `tables` and
     * marks `loaded` when it runs a restore; pg_restore lists a known migration
     * as the dump's history, or writes a restricted script. Their arguments are
     * pinned in pg-tools.test.ts.
     */
    const postgresPlan = (archivePath: string) => {
      const bin = path.join(root, 'bin');
      fs.mkdirSync(bin, { recursive: true });
      const write = (name: string, body: string) => {
        const version = `[ "$1" = --version ] && { echo '${name} (PostgreSQL) 17.11'; exit 0; }`;
        fs.writeFileSync(path.join(bin, name), `#!/bin/sh\n${version}\n${body}\n`);
        fs.chmodSync(path.join(bin, name), 0o755);
      };
      write(
        'psql',
        `case "$*" in *--command=*) [ -f '${root}/tables' ] && cat '${root}/tables'; exit 0;; *) touch '${root}/loaded';; esac`,
      );
      const migration = [...knownMigrationNames()][0];
      write(
        'pg_restore',
        [
          'case "$*" in',
          `  *--data-only*) printf 'COPY public.mikro_orm_migrations (id, name) FROM stdin;\\n1\\t${migration}\\n\\\\.\\n';;`,
          `  *) for a in "$@"; do case "$a" in --file=*) printf '%s\\n' '\\restrict k1' > "\${a#--file=}";; esac; done;;`,
          'esac',
        ].join('\n'),
      );
      return {
        archive: archivePath,
        dbFile,
        dataDir,
        reclaimResetFile,
        postgres: { url: 'postgres://trek:pw@db/trek', binDir: bin },
      };
    };
    const loaded = () => fs.existsSync(path.join(root, 'loaded'));

    it('BOOT-RESTORE-004b: a database holding tables is left alone, so a restart never rolls back', async () => {
      const plan = postgresPlan(await archive({ 'travel.pgdump': 'dump' }));
      fs.writeFileSync(path.join(root, 'tables'), 'users\ntrips\n');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await restoreOnFirstBoot(plan)).toEqual({ restored: false, reason: 'database-exists' });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('the Postgres database (2 table(s))'));
      expect(loaded()).toBe(false);
    });

    it("BOOT-RESTORE-004c: an empty database is loaded from the archive's dump, with its key and uploads", async () => {
      const plan = postgresPlan(
        await archive({ 'travel.pgdump': 'dump', '.encryption_key': 'b'.repeat(64), 'uploads/a.jpg': 'jpeg' }),
      );
      const out = await restoreOnFirstBoot(plan);
      expect(out.restored).toBe(true);
      expect(loaded()).toBe(true);
      expect(fs.readFileSync(path.join(dataDir, '.encryption_key'), 'utf8')).toBe('b'.repeat(64));
      expect(fs.existsSync(reclaimResetFile)).toBe(true);
      expect(fs.existsSync(dbFile)).toBe(false);
    });

    it('BOOT-RESTORE-004d: a SQLite backup is refused before anything is loaded, leaving no scratch', async () => {
      const plan = postgresPlan(await goodArchive());
      await expect(restoreOnFirstBoot(plan)).rejects.toThrow(
        'RESTORE_FROM_BACKUP: This backup holds a SQLite database, which cannot be restored into a Postgres database.',
      );
      expect(loaded()).toBe(false);
      expect(fs.existsSync(reclaimResetFile)).toBe(false);
      expect(fs.readdirSync(dataDir).filter((f) => f.startsWith('restore-boot-'))).toEqual([]);
    });
  });

  it('BOOT-RESTORE-005: an archive without a database is refused and leaves no scratch behind', async () => {
    const zipPath = await archive({ 'notes.txt': 'hello' });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile })).rejects.toThrow(
      'RESTORE_FROM_BACKUP: Invalid backup: travel.db not found',
    );
    expect(fs.existsSync(dbFile)).toBe(false);
    expect(fs.readdirSync(dataDir).filter((n) => n.startsWith('restore-boot-'))).toEqual([]);
    expect(fs.existsSync(reclaimResetFile)).toBe(false);
  });

  it('BOOT-RESTORE-006: a database that is not a TREK one is refused', async () => {
    const src = path.join(root, 'other.db');
    trekDb(src, ['users']);
    const zipPath = await archive({ 'travel.db': { file: src } });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile })).rejects.toThrow(
      'missing required table: trips',
    );
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-007: an entry escaping the archive is refused', async () => {
    const zipPath = await archive({ '../escape.txt': 'x', 'travel.db': 'not a db' });
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile })).rejects.toThrow(
      /escapes the archive root|not a valid SQLite database/,
    );
    expect(fs.existsSync(dbFile)).toBe(false);
  });

  it('BOOT-RESTORE-008: an archive with only a database restores it, without inventing a key or an uploads tree', async () => {
    const src = path.join(root, 'src.db');
    trekDb(src);
    const zipPath = await archive({ 'travel.db': { file: src } });

    const out = await restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile });

    expect(out).toEqual({ restored: true, uploads: null, staging: expect.stringContaining('restore-boot-') });
    expect(fs.existsSync(dbFile)).toBe(true);
    expect(fs.existsSync(path.join(dataDir, '.encryption_key'))).toBe(false);
  });

  it('BOOT-RESTORE-009: a reclaim reset file that cannot be written stops the start before the database is put in place', async () => {
    const zipPath = await goodArchive();
    // A directory where the file goes: writing it fails, as on a read-only data folder.
    fs.mkdirSync(reclaimResetFile);
    await expect(restoreOnFirstBoot({ archive: zipPath, dbFile, dataDir, reclaimResetFile })).rejects.toThrow();
    expect(fs.existsSync(dbFile)).toBe(false);
  });
});
