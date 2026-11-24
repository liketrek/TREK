/**
 * SCHEMAGAP: the boot's check that every table and column the entities map
 * exists (src/db/schema-gaps.ts). Silent on a database the migrations built,
 * so it never troubles a healthy install; on one an old upgrade left without
 * a column, it names the column once per start and lets the start go on.
 */
import { schemaGaps, warnAboutSchemaGaps } from '../../../src/db/schema-gaps';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { Logger } from '@nestjs/common';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let db: Database.Database;
let t: TestOrm;

beforeEach(async () => {
  db = createSnapshotTestDb();
  t = await createTestOrm(db);
});

afterEach(async () => {
  await t.close();
  db.close();
  vi.restoreAllMocks();
});

describe('schemaGaps', () => {
  it('SCHEMAGAP-001: finds nothing on a database the migrations built, and says nothing', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    expect(await schemaGaps(t.orm)).toEqual([]);
    await warnAboutSchemaGaps(t.orm);
    expect(warn).not.toHaveBeenCalled();
  });

  it('SCHEMAGAP-002: names a missing column by table and column, and a missing table as a whole', async () => {
    db.exec('ALTER TABLE users DROP COLUMN mfa_backup_codes');
    db.exec('ALTER TABLE users DROP COLUMN immich_access_token');
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DROP TABLE bucket_list');
    expect(await schemaGaps(t.orm)).toEqual(
      expect.arrayContaining(['users.mfa_backup_codes', 'users.immich_access_token', 'the table bucket_list']),
    );
    expect(await schemaGaps(t.orm)).toHaveLength(3);
  });

  it('SCHEMAGAP-003: the warning names what is missing, says what fails, and asks for a report', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    db.exec('ALTER TABLE users DROP COLUMN mfa_backup_codes');
    await warnAboutSchemaGaps(t.orm);
    expect(warn).toHaveBeenCalledTimes(1);
    const [line] = warn.mock.calls[0] as [string];
    expect(line).toMatch(
      /^The database lacks 1 table\(s\) or column\(s\) this TREK version uses: users\.mfa_backup_codes\. /,
    );
    expect(line).toContain('a move to Postgres refuses the file');
    expect(line).toContain('please report it with this message');
  });

  it('SCHEMAGAP-004: past twenty it names the first twenty and counts the rest', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    const optional: Array<{ name: string }> = await t.em
      .getConnection()
      .execute(`SELECT name FROM pragma_table_info('users') WHERE pk = 0 AND "notnull" = 0`);
    let dropped = 0;
    for (const { name } of optional) {
      try {
        db.exec(`ALTER TABLE users DROP COLUMN "${name}"`);
        dropped++;
      } catch {
        // indexed or referenced columns stay
      }
      if (dropped === 22) break;
    }
    expect(dropped).toBe(22);
    await warnAboutSchemaGaps(t.orm);
    expect(warn.mock.calls[0]?.[0]).toMatch(/lacks 22 table\(s\) or column\(s\) .* and 2 more\. /);
  });

  it('SCHEMAGAP-005: a check that cannot run is logged and the start goes on', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    const connection = t.orm.em.getConnection();
    vi.spyOn(connection, 'execute').mockRejectedValueOnce(new Error('no such module: fts5'));
    vi.spyOn(t.orm.em, 'getConnection').mockReturnValue(connection);
    await expect(warnAboutSchemaGaps(t.orm)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'Could not check the database for tables and columns this TREK version uses (no such module: fts5); ' +
        'the start goes on without that check.',
    );
  });
});
