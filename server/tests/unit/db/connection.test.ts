import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { openDatabase } from '../../../src/db/connection';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm } from '../../helpers/test-orm';
import {
  createDayAssignment,
  createDayNote,
  createPackingItem,
  createPlace,
  createTrip,
  createUser,
} from '../../helpers/factories';

// #2518: a container with a read-only root filesystem and no tmpfs on /tmp
// gives SQLite nowhere to put a temp file, so deleting a trip failed with
// SQLITE_IOERR_GETTEMPPATH. Every connection TREK opens keeps its temp storage
// in memory now, and these tests pin that down.

const SERVER_ROOT = path.resolve(__dirname, '../../..');
const MEMORY = 2; // PRAGMA temp_store: 0 default, 1 file, 2 memory

let tmpDir: string;
let schemaFile: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-connection-'));
  // Real schema, built once and copied per test: the delete below has to
  // cascade through the same tables and foreign keys a live install has.
  // The schema is the migrated snapshot the vitest global setup built, written
  // out as a file so every copy is a real on-disk database.
  schemaFile = path.join(tmpDir, 'schema.db');
  const snapshot = createSnapshotTestDb();
  fs.writeFileSync(schemaFile, snapshot.serialize());
  snapshot.close();
  const db = openDatabase(schemaFile);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  db.close();
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function freshCopy(name: string): string {
  const file = path.join(tmpDir, `${name}.db`);
  fs.copyFileSync(schemaFile, file);
  return file;
}

describe('openDatabase', () => {
  it('keeps temp storage in memory on a read-write handle', () => {
    const db = openDatabase(freshCopy('rw'));
    try {
      expect(db.pragma('temp_store', { simple: true })).toBe(MEMORY);
    } finally {
      db.close();
    }
  });

  it('keeps temp storage in memory on a read-only handle', () => {
    const db = openDatabase(freshCopy('ro'), { readonly: true });
    try {
      expect(db.readonly).toBe(true);
      expect(db.pragma('temp_store', { simple: true })).toBe(MEMORY);
    } finally {
      db.close();
    }
  });

  it('is what the server opens its main database with', async () => {
    const { db } = await import('../../../src/db/database');
    expect(db.pragma('temp_store', { simple: true })).toBe(MEMORY);
  });
});

// SQLite names every temp file etilqs_<random>. Linux unlinks the file the
// moment it is opened, so it only shows among the process's open descriptors;
// Windows keeps it in the temp directory until it is closed. macOS offers
// neither view, which is why the test below does not run there.
const canSeeTempFiles = process.platform === 'linux' || process.platform === 'win32';

function sqliteTempFiles(): string[] {
  if (process.platform === 'linux') {
    return fs
      .readdirSync('/proc/self/fd')
      .flatMap((fd) => {
        try {
          return [fs.readlinkSync(`/proc/self/fd/${fd}`)];
        } catch {
          return [];
        }
      })
      .filter((target) => target.includes('etilqs_'));
  }
  return fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('etilqs_'));
}

/**
 * Builds a trip the size of a real one on `db`, deletes it through
 * TripsService.remove and reports which SQLite temp files were open while the
 * delete ran. A trigger calls back into the test after the cascade, still
 * inside the statement, which is when a spilled statement journal is open.
 */
async function deleteTripAndWatchTempFiles(db: Database.Database): Promise<{
  tempFiles: string[];
  tripLeft: number;
  placesLeft: number;
}> {
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  const { user } = createUser(db);
  const trip = createTrip(db, user.id, {
    title: 'Niederlande Hoofddorp',
    start_date: '2026-06-01',
    end_date: '2026-06-14',
  });
  const days = db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(trip.id) as { id: number }[];
  for (let i = 0; i < 25; i++) {
    const place = createPlace(db, trip.id, { name: `Ort ${i}`, description: 'Grachten und Tulpen. '.repeat(10) });
    createDayAssignment(db, days[i % days.length].id, place.id);
  }
  days.forEach((day) => createDayNote(db, day.id, trip.id));
  for (let i = 0; i < 20; i++) createPackingItem(db, trip.id, { name: `Teil ${i}` });

  const before = new Set(sqliteTempFiles());
  const seen = new Set<string>();
  db.function('trek_watch_temp_files', () => {
    for (const file of sqliteTempFiles()) if (!before.has(file)) seen.add(file);
    return null;
  });
  db.exec('CREATE TRIGGER trek_watch_trip_delete AFTER DELETE ON trips BEGIN SELECT trek_watch_temp_files(); END');

  const none = undefined as never;
  const t = await createTestOrm(db);
  try {
    const trips = new TripsService(none, none, none, none, none, none, none, none, new UnitOfWork(t.em), t.em, none);
    await trips.remove(trip.id, user.id, 'user');
  } finally {
    await t.close();
  }

  return {
    tempFiles: [...seen],
    tripLeft: (db.prepare('SELECT COUNT(*) AS n FROM trips WHERE id = ?').get(trip.id) as { n: number }).n,
    placesLeft: (db.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id) as { n: number }).n,
  };
}

describe.runIf(canSeeTempFiles)('deleting a trip with content (#2518)', () => {
  it('needs a temp file on a connection left at the SQLite default', async () => {
    // The control: proves the watcher sees temp files, and that this delete is
    // one SQLite cannot finish without one where no temp directory is writable.
    const db = new Database(freshCopy('default'));
    try {
      const result = await deleteTripAndWatchTempFiles(db);
      expect(result.tempFiles.length).toBeGreaterThan(0);
      expect(result.tripLeft).toBe(0);
    } finally {
      db.close();
    }
  });

  it('never touches a temp file on a connection TREK opens', async () => {
    const db = openDatabase(freshCopy('trek'));
    try {
      const result = await deleteTripAndWatchTempFiles(db);
      expect(result.tempFiles).toEqual([]);
      expect(result.tripLeft).toBe(0);
      expect(result.placesLeft).toBe(0);
    } finally {
      db.close();
    }
  });
});

describe('every SQLite connection goes through openDatabase', () => {
  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return entry.name.endsWith('.ts') ? [full] : [];
    });
  }

  it('leaves no other place in src/ constructing a better-sqlite3 handle', () => {
    const offenders = sourceFiles(path.join(SERVER_ROOT, 'src')).filter((file) => {
      if (file === path.join(SERVER_ROOT, 'src', 'db', 'connection.ts')) return false;
      const source = fs.readFileSync(file, 'utf8');
      // A value import (not `import type`) under whatever local name, then `new` on it.
      const imported = /import\s+(?!type\b)(\w+)[^;]*?from\s+['"]better-sqlite3['"]/.exec(source)?.[1];
      const required = /(\w+)\s*=\s*require\(\s*['"]better-sqlite3['"]\s*\)/.exec(source)?.[1];
      return [imported, required].some((name) => name && new RegExp(`new\\s+${name}\\s*\\(`).test(source));
    });
    expect(offenders.map((file) => path.relative(SERVER_ROOT, file))).toEqual([]);
  });

  it('is mirrored by the standalone scripts that cannot import it', () => {
    // reset-admin.js and the key rotation run in the container without src/,
    // so they set the pragma themselves.
    for (const script of ['reset-admin.js', 'scripts/migrate-encryption.ts']) {
      const source = fs.readFileSync(path.join(SERVER_ROOT, script), 'utf8');
      expect(source, script).toMatch(/PRAGMA temp_store = MEMORY|pragma\('temp_store = MEMORY'\)/);
    }
  });
});
