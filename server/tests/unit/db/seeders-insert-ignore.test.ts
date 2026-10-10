/**
 * The addon, photo-provider and document-provider seeders run again on every
 * schema bootstrap and on a backup restore. They used to spell SQLite's
 * `INSERT OR IGNORE`; they are query-builder inserts that do nothing on
 * conflict now, and these tests pin the behaviour that has to survive that:
 * a second run adds nothing, and a row an operator changed keeps the change.
 */
import { AddonSeeder } from '../../../src/db/seeders/AddonSeeder';
import { DocumentProviderSeeder } from '../../../src/db/seeders/DocumentProviderSeeder';
import { PhotoProviderSeeder } from '../../../src/db/seeders/PhotoProviderSeeder';
import { createMigrationOrm, migratorOf, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('seeders that leave existing rows alone', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await createMigrationOrm();
    await migratorOf(orm).up();
  });

  afterEach(async () => {
    await orm.close(true);
  });

  const count = async (table: string) =>
    (await rawQuery<{ n: number }>(orm, `SELECT COUNT(*) AS n FROM ${table}`))[0].n;

  it('SEEDIGN-001: AddonSeeder adds nothing the second time and keeps an operator toggle', async () => {
    await new AddonSeeder().run(orm.em);
    const seeded = await count('addons');
    expect(seeded).toBeGreaterThan(0);

    await rawExec(orm, "UPDATE addons SET enabled = 1 - enabled, sort_order = 99 WHERE id = 'mcp'");
    const [before] = await rawQuery<{ enabled: number }>(orm, "SELECT enabled FROM addons WHERE id = 'mcp'");

    await new AddonSeeder().run(orm.em);
    expect(await count('addons')).toBe(seeded);
    expect(await rawQuery(orm, "SELECT enabled, sort_order FROM addons WHERE id = 'mcp'")).toEqual([
      { enabled: before.enabled, sort_order: 99 },
    ]);
  });

  it('SEEDIGN-002: AddonSeeder restores a deleted default addon', async () => {
    await new AddonSeeder().run(orm.em);
    await rawExec(orm, "DELETE FROM addons WHERE id = 'collab'");

    await new AddonSeeder().run(orm.em);
    expect(await rawQuery(orm, "SELECT id, type, icon FROM addons WHERE id = 'collab'")).toEqual([
      { id: 'collab', type: 'trip', icon: 'Users' },
    ]);
  });

  it('SEEDIGN-003: PhotoProviderSeeder seeds providers and fields once, keeping a renamed provider', async () => {
    await new PhotoProviderSeeder().run(orm.em);
    const providers = await count('photo_providers');
    const fields = await count('photo_provider_fields');
    expect(providers).toBeGreaterThan(0);
    expect(fields).toBeGreaterThan(0);

    await rawExec(orm, "UPDATE photo_providers SET name = 'Renamed' WHERE id = 'synologyphotos'");
    await new PhotoProviderSeeder().run(orm.em);

    expect(await count('photo_providers')).toBe(providers);
    expect(await count('photo_provider_fields')).toBe(fields);
    expect(await rawQuery(orm, "SELECT name FROM photo_providers WHERE id = 'synologyphotos'")).toEqual([
      { name: 'Renamed' },
    ]);
  });

  it('SEEDIGN-004: DocumentProviderSeeder seeds providers disabled and fields once', async () => {
    await new DocumentProviderSeeder().run(orm.em);
    const providers = await count('document_providers');
    const fields = await count('document_provider_fields');
    expect(providers).toBeGreaterThan(0);
    expect(await rawQuery(orm, 'SELECT DISTINCT enabled FROM document_providers')).toEqual([{ enabled: 0 }]);

    await new DocumentProviderSeeder().run(orm.em);
    expect(await count('document_providers')).toBe(providers);
    expect(await count('document_provider_fields')).toBe(fields);
  });
});
