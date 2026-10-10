import { checkBackupDatabase } from '../../../src/nest/backup/backup-archive';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('checkBackupDatabase and the release that made the backup', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-backup-version-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const backupWith = (recorded: string[]): void => {
    const db = new Database(path.join(dir, 'travel.db'));
    for (const table of ['users', 'trips', 'trip_members', 'places', 'days'])
      db.exec(`CREATE TABLE ${table} (id INTEGER)`);
    db.exec('CREATE TABLE mikro_orm_migrations (id INTEGER PRIMARY KEY, name TEXT, executed_at TEXT)');
    // test-sql-allow: a bare backup file before any boot, which no ORM is bound to.
    const insert = db.prepare('INSERT INTO mikro_orm_migrations (name) VALUES (?)');
    for (const name of recorded) insert.run(name);
    db.close();
  };

  it('BACKUPVER-001: refuses a backup a newer TREK made, before anything is swapped', () => {
    backupWith(['Migration20200101000000_baseline_schema', 'Migration20990101000000_from_a_newer_release']);
    expect(checkBackupDatabase(dir)).toEqual({
      error: 'This backup was made by a newer TREK version. Update TREK before restoring it.',
      status: 400,
    });
  });

  it('BACKUPVER-002: accepts a backup this release or an older one made', () => {
    backupWith(['Migration20200101000000_baseline_schema', 'Migration20200101042000_tours']);
    expect(checkBackupDatabase(dir)).toBeNull();
  });

  it('BACKUPVER-003: accepts a pre-ORM backup without the migrations table', () => {
    const db = new Database(path.join(dir, 'travel.db'));
    for (const table of ['users', 'trips', 'trip_members', 'places', 'days'])
      db.exec(`CREATE TABLE ${table} (id INTEGER)`);
    db.close();
    expect(checkBackupDatabase(dir)).toBeNull();
  });
});
