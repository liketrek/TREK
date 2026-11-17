/**
 * PARITY-PG — the schema a Postgres database ends with after its bootstrap
 * (the baseline, then every migration after its cut) is the schema the
 * entities describe, as scripts/generate-pg-baseline.ts writes it for
 * Postgres (src/db/engine/postgres/schema-adjust.ts). MikroORM's comparator
 * reads the live database and must find nothing to change: a migration after
 * the cut that left Postgres behind SQLite, or a baseline that drifted from
 * the entities, fails here. It runs on the lane's database, never skipped.
 *
 * Which of the comparator's statements change nothing, and how each kind is
 * proven so, is src/db/engine/postgres/entity-schema-diff.ts: the same
 * definition `npm run gen:pg-migration` uses to print the Postgres side of a
 * new migration, so what the tool prints is what this test holds.
 */
import { diffAgainstEntities } from '../../src/db/engine/postgres/entity-schema-diff';

import { describe, expect, it } from 'vitest';

describe('PARITY-PG', () => {
  it('PARITY-PG-001: the bootstrapped database holds exactly the schema the entities generate for Postgres', async () => {
    const url = process.env.TREK_DB_URL;
    if (!url) throw new Error('PARITY-PG runs in the Postgres lane, which sets TREK_DB_URL');
    const diff = await diffAgainstEntities(url);
    // A statement here is a change a migration after the cut still owes Postgres:
    // `npm run gen:pg-migration` prints it for the migration's engineDdl postgres array.
    expect(diff.changes).toEqual([]);
    expect(diff.fingerprint.after).toBe(diff.fingerprint.before);
    // Every hand-ported trigger is in the database, on its table.
    expect(diff.missingTriggers).toEqual([]);
  }, 60_000);
});
