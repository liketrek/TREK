import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { runSeeds } from '../../../src/db/seeds';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

// The Immich self-signed switch and the two settings rows are pinned at schema
// version 243 (#2475). Later migrations are appended after it, so a case that
// replays it rewinds to just before it; the steps after it are idempotent.
const IMMICH_TLS_VERSION = 243;

type FieldRow = { field_key: string; input_type: string; settings_key: string | null; payload_key: string | null; sort_order: number };

function immichFields(db: Database.Database): FieldRow[] {
  return db
    .prepare(
      "SELECT field_key, input_type, settings_key, payload_key, sort_order FROM photo_provider_fields WHERE provider_id = 'immich' ORDER BY sort_order",
    )
    .all() as FieldRow[];
}

const EXPECTED_FIELDS: FieldRow[] = [
  { field_key: 'immich_url', input_type: 'url', settings_key: 'immich_url', payload_key: 'immich_url', sort_order: 0 },
  { field_key: 'immich_api_key', input_type: 'password', settings_key: null, payload_key: 'immich_api_key', sort_order: 1 },
  { field_key: 'immich_allow_insecure_tls', input_type: 'checkbox', settings_key: 'allow_insecure_tls', payload_key: 'allow_insecure_tls', sort_order: 2 },
  { field_key: 'immich_auto_upload', input_type: 'checkbox', settings_key: 'auto_upload', payload_key: 'auto_upload', sort_order: 5 },
];

function replay(db: Database.Database): void {
  db.prepare('UPDATE schema_version SET version = ?').run(IMMICH_TLS_VERSION - 1);
  runMigrations(db);
}

describe('Immich provider fields and the self-signed switch (#2475)', () => {
  let db: Database.Database;

  afterEach(() => db?.close());

  it('a fresh install shows every Immich setting, the auto-upload toggle included', () => {
    // database.ts runs schema, migrations, seeds in that order. On an empty
    // database the migrations find no Immich provider row yet, so the seeds
    // are what has to bring the rows along.
    db = new Database(':memory:');
    createTables(db);
    runMigrations(db);
    // An existing user keeps the admin seeding out of this.
    db.exec("INSERT INTO users (username, email, password_hash) VALUES ('someone', 'someone@example.test', 'x')");
    runSeeds(db);

    expect(immichFields(db)).toEqual(EXPECTED_FIELDS);
    const label = db
      .prepare("SELECT label FROM photo_provider_fields WHERE provider_id = 'immich' AND field_key = 'immich_allow_insecure_tls'")
      .get();
    // The Synology label, so every locale already has the words.
    expect(label).toEqual({ label: 'skipSSLVerification' });
  });

  it('the switch is off for every user until they turn it on', () => {
    db = new Database(':memory:');
    createTables(db);
    runMigrations(db);
    db.exec("INSERT INTO users (username, email, password_hash) VALUES ('someone', 'someone@example.test', 'x')");

    expect(db.prepare('SELECT immich_allow_insecure_tls AS v FROM users').get()).toEqual({ v: 0 });
  });

  it('an install that already had the Immich provider gets both rows once, and a replay changes nothing', () => {
    db = new Database(':memory:');
    createTables(db);
    runMigrations(db);
    // What an upgraded fresh install looked like: the seeds of an older release
    // added the provider with only its URL and key.
    db.exec(`
      INSERT INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES ('immich', 'Immich', 'Immich photo provider', 'Image', 0, 0);
      INSERT INTO photo_provider_fields (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order) VALUES
        ('immich', 'immich_url', 'providerUrl', 'url', 'https://immich.example.com', 1, 0, 'immich_url', 'immich_url', 0),
        ('immich', 'immich_api_key', 'providerApiKey', 'password', 'API Key', 1, 1, NULL, 'immich_api_key', 1);
    `);

    replay(db);
    expect(immichFields(db)).toEqual(EXPECTED_FIELDS);

    replay(db);
    expect(immichFields(db)).toEqual(EXPECTED_FIELDS);
  });

  it('a replay keeps what a user already chose', () => {
    db = new Database(':memory:');
    createTables(db);
    runMigrations(db);
    db.exec(
      "INSERT INTO users (username, email, password_hash, immich_allow_insecure_tls) VALUES ('someone', 'someone@example.test', 'x', 1)",
    );

    replay(db);

    expect(db.prepare('SELECT immich_allow_insecure_tls AS v FROM users').get()).toEqual({ v: 1 });
  });
});
