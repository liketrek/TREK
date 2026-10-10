/**
 * Boot migration: strip the legacy 'files/' prefix from trip_files.filename.
 *
 * Collab note attachments historically stored 'files/<name>' while the file
 * manager stored bare names in the same column; the storage layer addresses
 * objects as category + bare name, so existing prefixed rows are normalized
 * once at boot (storage slice 2). Ported off the legacy runner (Task 0
 * triage: PORT) onto the real `Migration20200101031600_storage_slice_2`:
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one migration, assert.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, it, expect } from 'vitest';

const TARGET = 'Migration20200101031600_storage_slice_2';

describe('trip_files files/-prefix migration', () => {
  it('strips the files/ prefix from legacy collab rows and leaves bare rows alone', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      await migrateTo(orm, names[idx - 1]);

      // Minimal FK chain: user → trip → trip_files rows.
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')");
      await rawExec(
        orm,
        "INSERT INTO trip_files (trip_id, filename, original_name) VALUES (1, 'files/aaa.pdf', 'a.pdf'), (1, 'bbb.pdf', 'b.pdf')",
      );

      await migrateTo(orm, TARGET);

      const rows = await rawQuery<{ filename: string }>(orm, 'SELECT filename FROM trip_files ORDER BY id');
      expect(rows.map((r) => r.filename)).toEqual(['aaa.pdf', 'bbb.pdf']);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
