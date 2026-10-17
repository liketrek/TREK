/**
 * The legacy `schema_version` marker a fresh install gets
 * (`src/db/seeders/SchemaVersionSeeder.ts`).
 *
 * Nothing on this release reads that row — `legacy-baseline.ts` stops at the
 * first `mikro_orm_migrations` row — but a rollback to a release still running
 * the positional `db/migrations.ts` chain does: it replays every step above the
 * marker, and step 242 (the booked-night reseat) moves nights it already seated.
 * So the marker has to be the chain's last step, and the migrations' own
 * `Legacy migration step N` docstrings are the source of truth for which step
 * that is — the same derivation LEGACYMAP-001 pins.
 */
import { buildLegacyStepMap } from '../../../src/db/legacy-baseline';
import { SchemaVersionSeeder } from '../../../src/db/seeders/SchemaVersionSeeder';
import { createMigrationOrm, migratorOf, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('SchemaVersionSeeder — the legacy marker on a fresh install', () => {
  let orm: MikroORM;
  let finalStep: number;

  beforeEach(async () => {
    orm = await createMigrationOrm();
    finalStep = buildLegacyStepMap(await migratorOf(orm).getPending()).finalStep;
    await migratorOf(orm).up();
  });

  afterEach(async () => {
    await orm.close(true);
  });

  const marker = () => rawQuery<{ id: number; version: number }>(orm, 'SELECT id, version FROM schema_version');

  it('SEEDVER-001: stamps the last legacy step, so a rollback to the last positional-runner release replays nothing', async () => {
    await new SchemaVersionSeeder().run(orm.em);
    expect(await marker()).toEqual([{ id: 1, version: finalStep }]);
  });

  it('SEEDVER-002: seeding again leaves the one row it found', async () => {
    await new SchemaVersionSeeder().run(orm.em);
    await new SchemaVersionSeeder().run(orm.em);
    expect(await marker()).toEqual([{ id: 1, version: finalStep }]);
  });
});
