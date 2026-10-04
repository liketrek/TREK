/**
 * The Immich self-signed switch and the two settings rows (#2475), legacy step
 * 243, on the real `Migration20200101040400_immich_learns_the_switch_synology_airtrail_and`.
 *
 * The legacy test rewound `schema_version` to just before the step and ran the
 * runner again. Here a replay runs the migration class directly a second time
 * (bypassing the Migrator's "already applied, skip" bookkeeping), and a fresh
 * install is the whole chain followed by the `PhotoProviderSeeder`, the order
 * `db/orm.ts` runs them in at boot.
 */
import { Migration20200101040400_immich_learns_the_switch_synology_airtrail_and as TargetMigration } from '../../../src/db/migrations/Migration20200101040400_immich_learns_the_switch_synology_airtrail_and';
import { PhotoProviderSeeder } from '../../../src/db/seeders/PhotoProviderSeeder';
import {
  createMigrationOrm,
  migrateTo,
  migratorOf,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { afterEach, describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101040400_immich_learns_the_switch_synology_airtrail_and';

type FieldRow = {
  field_key: string;
  input_type: string;
  settings_key: string | null;
  payload_key: string | null;
  sort_order: number;
};

function immichFields(orm: MikroORM): Promise<FieldRow[]> {
  return rawQuery<FieldRow>(
    orm,
    "SELECT field_key, input_type, settings_key, payload_key, sort_order FROM photo_provider_fields WHERE provider_id = 'immich' ORDER BY sort_order",
  );
}

const EXPECTED_FIELDS: FieldRow[] = [
  { field_key: 'immich_url', input_type: 'url', settings_key: 'immich_url', payload_key: 'immich_url', sort_order: 0 },
  {
    field_key: 'immich_api_key',
    input_type: 'password',
    settings_key: null,
    payload_key: 'immich_api_key',
    sort_order: 1,
  },
  {
    field_key: 'immich_allow_insecure_tls',
    input_type: 'checkbox',
    settings_key: 'allow_insecure_tls',
    payload_key: 'allow_insecure_tls',
    sort_order: 2,
  },
  {
    field_key: 'immich_auto_upload',
    input_type: 'checkbox',
    settings_key: 'auto_upload',
    payload_key: 'auto_upload',
    sort_order: 5,
  },
];

async function migrateToJustBefore(orm: MikroORM): Promise<void> {
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
}

describe('Immich provider fields and the self-signed switch (#2475)', () => {
  let orm: MikroORM | undefined;

  afterEach(async () => {
    await orm?.close(true);
    orm = undefined;
  });

  it('a fresh install shows every Immich setting, the auto-upload toggle included', async () => {
    // Boot runs the migrations, then the seeders. On an empty database the
    // migration finds no Immich provider row yet, so the seeder is what has to
    // bring the rows along.
    orm = await createMigrationOrm();
    await migratorOf(orm).up();
    // An existing user keeps the admin seeding out of this.
    await rawExec(
      orm,
      "INSERT INTO users (username, email, password_hash) VALUES ('someone', 'someone@example.test', 'x')",
    );
    await new PhotoProviderSeeder().run(orm.em);

    expect(await immichFields(orm)).toEqual(EXPECTED_FIELDS);
    const label = await rawQuery(
      orm,
      "SELECT label FROM photo_provider_fields WHERE provider_id = 'immich' AND field_key = 'immich_allow_insecure_tls'",
    );
    // The Synology label, so every locale already has the words.
    expect(label).toEqual([{ label: 'skipSSLVerification' }]);
  }, 30000);

  it('the switch is off for every user until they turn it on', async () => {
    orm = await createMigrationOrm();
    await migratorOf(orm).up();
    await rawExec(
      orm,
      "INSERT INTO users (username, email, password_hash) VALUES ('someone', 'someone@example.test', 'x')",
    );

    expect(await rawQuery(orm, 'SELECT immich_allow_insecure_tls AS v FROM users')).toEqual([{ v: 0 }]);
  }, 30000);

  it('an install that already had the Immich provider gets both rows once, and a replay changes nothing', async () => {
    orm = await createMigrationOrm();
    await migrateToJustBefore(orm);
    // What an upgraded fresh install looked like: the seeds of an older release
    // added the provider with only its URL and key.
    await rawExec(
      orm,
      "INSERT INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES ('immich', 'Immich', 'Immich photo provider', 'Image', 0, 0)",
    );
    await rawExec(
      orm,
      `INSERT INTO photo_provider_fields (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order) VALUES
        ('immich', 'immich_url', 'providerUrl', 'url', 'https://immich.example.com', 1, 0, 'immich_url', 'immich_url', 0),
        ('immich', 'immich_api_key', 'providerApiKey', 'password', 'API Key', 1, 1, NULL, 'immich_api_key', 1)`,
    );

    await migrateTo(orm, TARGET);
    expect(await immichFields(orm)).toEqual(EXPECTED_FIELDS);

    await runMigrationDirect(orm, TargetMigration);
    expect(await immichFields(orm)).toEqual(EXPECTED_FIELDS);
  }, 30000);

  it('a replay keeps what a user already chose', async () => {
    orm = await createMigrationOrm();
    await migrateTo(orm, TARGET);
    await rawExec(
      orm,
      "INSERT INTO users (username, email, password_hash, immich_allow_insecure_tls) VALUES ('someone', 'someone@example.test', 'x', 1)",
    );

    await runMigrationDirect(orm, TargetMigration);

    expect(await rawQuery(orm, 'SELECT immich_allow_insecure_tls AS v FROM users')).toEqual([{ v: 1 }]);
  }, 30000);
});
