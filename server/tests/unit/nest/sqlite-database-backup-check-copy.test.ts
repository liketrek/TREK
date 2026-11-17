/**
 * SqliteDatabaseBackup.checkCopy: a kept copy (the demo baseline) is put back
 * only when it is a SQLite file; a Postgres dump an engine switch left under
 * the same name, an empty file or a missing one is refused with a reason.
 */
import { SqliteDatabaseBackup } from '../../../src/nest/backup/sqlite-database-backup';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';

import Database from 'better-sqlite3';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let dir: string;
const backup = new SqliteDatabaseBackup({ file: ':memory:' } as unknown as DatabaseLifecycle, {} as never);

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'trek-check-copy-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('SqliteDatabaseBackup.checkCopy', () => {
  it('SQLCOPY-001: a SQLite file passes', async () => {
    const file = path.join(dir, 'travel-baseline.db');
    const db = new Database(file);
    db.exec('CREATE TABLE t (x INTEGER)');
    db.close();
    await expect(backup.checkCopy(file)).resolves.toBeNull();
  });

  it('SQLCOPY-002: anything else is refused, naming the file', async () => {
    const dump = path.join(dir, 'dump.db');
    writeFileSync(dump, 'PGDMP\u0001\u000e\u0000 not sqlite at all');
    await expect(backup.checkCopy(dump)).resolves.toBe(`${dump} is not a SQLite database`);
    const empty = path.join(dir, 'empty.db');
    writeFileSync(empty, '');
    await expect(backup.checkCopy(empty)).resolves.toBe(`${empty} is not a SQLite database`);
    await expect(backup.checkCopy(path.join(dir, 'missing.db'))).resolves.toMatch(/missing\.db cannot be read/);
  });
});
