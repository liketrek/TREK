// Migrates one database and serialises it for the test run to reuse.
//
// Run as a child process under tsx by tests/global-setup.ts — not imported by
// it. vitest's globalSetup executes in the main process outside vitest's
// transform pipeline, where Node's native resolver rejects the extensionless
// imports these CommonJS-target modules use ('../migration-utils'). tsx resolves
// them, and it is already how `gen:plugin-facts` runs TypeScript directly.
import { schemaSnapshotPath, writeSchemaSnapshot } from '../src/db/schema-snapshot';

import fs from 'node:fs';

async function main(): Promise<void> {
  // Delete first, and load database.ts only afterwards — in test mode `initDb()`
  // opens a copy of this snapshot when one exists, so a leftover from the last
  // run would have this process migrating an already-migrated database and
  // seeding it twice. Static imports are evaluated before any of this runs,
  // hence the dynamic ones below.
  fs.rmSync(schemaSnapshotPath(), { force: true });

  const { getRawConnection } = await import('../src/db/database');
  const { createStandaloneOrm, runSchemaBootstrap } = await import('../src/db/orm');

  // The shared driver binds to the connection database.ts opened on import, so
  // this migrates that in-memory database and it can be serialised straight
  // after.
  const orm = await createStandaloneOrm();
  try {
    await runSchemaBootstrap(orm);
    writeSchemaSnapshot(getRawConnection().serialize());
    console.log(`[test-db] schema snapshot written to ${schemaSnapshotPath()}`);
  } finally {
    // Closing destroys Kysely's client, which closes the handle — after the
    // snapshot has been taken.
    await orm.close(true);
  }
}

main().catch((err: unknown) => {
  console.error('[test-db] failed to build the schema snapshot:', err);
  process.exit(1);
});
