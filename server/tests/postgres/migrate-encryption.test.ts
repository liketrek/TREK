/**
 * PGROT-001..004: the encryption key rotation (`scripts/migrate-encryption.ts`)
 * on the lane's Postgres database, through the same rotation the command runs:
 * every kind of store is re-encrypted under the new key in one transaction
 * that takes the engine's write lock, the `jsonb` addon config included; a
 * second run finds everything on the new key and changes nothing; a value
 * neither key opens is reported while the rest commits; and a statement that
 * fails rolls the whole rotation back.
 *
 * The command around it (prompts, the pg_dump copy, the key file) is covered
 * in the SQLite lane (`tests/unit/db/maintenance-scripts-postgres.test.ts`):
 * the copy needs a pg_dump at least as new as the server, which the lane's
 * runner does not have for every major it tests.
 */
import { rotateOnPostgres } from '../../scripts/migrate-encryption';
import { buildOrmConfig, resolveEngine, type DatabaseEngine } from '../../src/db/engine';
import { Users } from '../../src/db/entities/Users.entity';
import { updateRows } from '../helpers/factories/rows';
import { readAppSetting, readUserSetting, setAppSetting, setUserSetting } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { MikroORM, type EntityManager } from '@mikro-orm/core';

import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const OLD_KEY = 'pg-rotation-old-key';
const NEW_KEY = 'pg-rotation-new-key';
const ENCRYPTED_PREFIX = 'enc:v1:';

const apiKeyFor = (key: string) => crypto.createHash('sha256').update(`${key}:api_keys:v1`).digest();
const mfaKeyFor = (key: string) => crypto.createHash('sha256').update(`${key}:mfa:v1`).digest();

function seal(derived: Buffer, plain: string): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derived, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]);
}

function open(derived: Buffer, sealed: Buffer): string | null {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', derived, sealed.subarray(0, 12));
    decipher.setAuthTag(sealed.subarray(12, 28));
    return Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

const encryptApi = (key: string, plain: string) =>
  `${ENCRYPTED_PREFIX}${seal(apiKeyFor(key), plain).toString('base64')}`;
const decryptApi = (key: string, value: string) =>
  value.startsWith(ENCRYPTED_PREFIX)
    ? open(apiKeyFor(key), Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64'))
    : null;
const encryptMfa = (key: string, plain: string) => seal(mfaKeyFor(key), plain).toString('base64');
const decryptMfa = (key: string, value: string) => open(mfaKeyFor(key), Buffer.from(value, 'base64'));

let orm: MikroORM;
let engine: DatabaseEngine;

/** Plain SQL on the lane's database, outside any transaction. */
function sql<T>(text: string, params: unknown[] = []): Promise<T[]> {
  return orm.em.getConnection().execute(text, params, 'all') as Promise<T[]>;
}

beforeAll(async () => {
  engine = resolveEngine();
  orm = await MikroORM.init({ ...buildOrmConfig(engine), pool: { min: 0, max: 2 } });
}, 60_000);

afterAll(async () => {
  await orm?.close(true);
});

describe('migrate-encryption.ts on Postgres', () => {
  let userId: number;

  it('PGROT-001: re-encrypts every kind of store under the new key, under the write lock', async () => {
    const { user } = await makeUser(orm);
    userId = user.id;
    await updateRows(
      orm,
      Users,
      { id: userId },
      {
        maps_api_key: encryptApi(OLD_KEY, 'maps-secret'),
        mfa_secret: encryptMfa(OLD_KEY, 'JBSWY3DPEHPK3PXP'),
      },
    );
    await setAppSetting(orm, 'smtp_pass', encryptApi(OLD_KEY, 'smtp-secret'));
    await setAppSetting(
      orm,
      'storage.backends',
      JSON.stringify([{ name: 'bucket', type: 's3', options: { secretAccessKey: encryptApi(OLD_KEY, 's3-secret') } }]),
    );
    await setUserSetting(orm, userId, 'llm_api_key', encryptApi(OLD_KEY, 'llm-user-secret'));
    await sql('INSERT INTO addons (id, name, config) VALUES (?, ?, ?)', [
      'pgrot-addon',
      'Rotation addon',
      JSON.stringify({ apiKey: encryptApi(OLD_KEY, 'addon-secret'), model: 'kept' }),
    ]);
    await sql('INSERT INTO plugins (id, name, config) VALUES (?, ?, ?)', [
      'pgrot-plugin',
      'Rotation plugin',
      JSON.stringify({ token: encryptApi(OLD_KEY, 'plugin-secret'), plain: 'kept' }),
    ]);
    await sql('INSERT INTO plugin_settings_fields (plugin_id, field_key, secret, scope) VALUES (?, ?, 1, ?)', [
      'pgrot-plugin',
      'token',
      'instance',
    ]);

    const taken: EntityManager[] = [];
    const locking: Pick<DatabaseEngine, 'serializeWrites'> = {
      async serializeWrites(em) {
        taken.push(em);
        await engine.serializeWrites(em);
        // The advisory lock is held by the rotation's own transaction.
        const held = (await em
          .getConnection()
          .execute(
            "SELECT count(*)::int AS n FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()",
            [],
            'all',
            em.getTransactionContext(),
          )) as { n: number }[];
        expect(held[0].n).toBe(1);
      },
    };

    const result = await rotateOnPostgres(orm, locking, OLD_KEY, NEW_KEY);

    expect(taken).toHaveLength(1);
    expect(result.errors).toEqual([]);
    expect(result.migrated).toBe(7);

    const [userRow] = await sql<{ maps_api_key: string; mfa_secret: string }>(
      'SELECT maps_api_key, mfa_secret FROM users WHERE id = ?',
      [userId],
    );
    expect(decryptApi(NEW_KEY, userRow.maps_api_key)).toBe('maps-secret');
    expect(decryptMfa(NEW_KEY, userRow.mfa_secret)).toBe('JBSWY3DPEHPK3PXP');
    expect(decryptApi(NEW_KEY, (await readAppSetting(orm, 'smtp_pass')) as string)).toBe('smtp-secret');
    const backends = JSON.parse((await readAppSetting(orm, 'storage.backends')) as string) as {
      options: { secretAccessKey: string };
    }[];
    expect(decryptApi(NEW_KEY, backends[0].options.secretAccessKey)).toBe('s3-secret');
    expect(decryptApi(NEW_KEY, (await readUserSetting(orm, userId, 'llm_api_key')) as string)).toBe('llm-user-secret');

    // jsonb on Postgres: read back parsed, written back as JSON, the other fields kept.
    const [addon] = await sql<{ config: { apiKey: string; model: string } }>('SELECT config FROM addons WHERE id = ?', [
      'pgrot-addon',
    ]);
    expect(addon.config.model).toBe('kept');
    expect(decryptApi(NEW_KEY, addon.config.apiKey)).toBe('addon-secret');

    const [plugin] = await sql<{ config: string }>('SELECT config FROM plugins WHERE id = ?', ['pgrot-plugin']);
    const pluginConfig = JSON.parse(plugin.config) as { token: string; plain: string };
    expect(pluginConfig.plain).toBe('kept');
    expect(decryptApi(NEW_KEY, pluginConfig.token)).toBe('plugin-secret');
  });

  it('PGROT-002: a second run finds every value on the new key and changes nothing', async () => {
    const before = await sql<{ value: string }>("SELECT value FROM app_settings WHERE key = 'smtp_pass'");
    const result = await rotateOnPostgres(orm, engine, OLD_KEY, NEW_KEY);
    expect(result.migrated).toBe(0);
    expect(result.alreadyMigrated).toBe(7);
    expect(result.errors).toEqual([]);
    const after = await sql<{ value: string }>("SELECT value FROM app_settings WHERE key = 'smtp_pass'");
    expect(after).toEqual(before);
  });

  it('PGROT-003: reports a value neither key opens and commits the rest', async () => {
    await setAppSetting(orm, 'admin_ntfy_token', encryptApi('a-third-key', 'unknown'));
    await setUserSetting(orm, userId, 'ntfy_token', encryptApi(NEW_KEY, 'next'));
    await setUserSetting(orm, userId, 'webhook_url', encryptApi(OLD_KEY, 'https://hook.example'));

    const result = await rotateOnPostgres(orm, engine, OLD_KEY, NEW_KEY);

    expect(result.errors).toEqual(['app_settings.admin_ntfy_token: decryption failed with both keys']);
    expect(result.migrated).toBe(1);
    expect(decryptApi(NEW_KEY, (await readUserSetting(orm, userId, 'webhook_url')) as string)).toBe(
      'https://hook.example',
    );
  });

  it('PGROT-004: a statement that fails rolls the whole rotation back', async () => {
    await setAppSetting(orm, 'smtp_pass', encryptApi(OLD_KEY, 'smtp-again'));
    await setAppSetting(orm, 'admin_ntfy_token', encryptApi(OLD_KEY, 'ntfy-again'));
    const before = await sql<{ key: string; value: string }>(
      "SELECT key, value FROM app_settings WHERE key IN ('smtp_pass', 'admin_ntfy_token') ORDER BY key",
    );

    // Renamed inside the rotation's own transaction, users.id makes the users
    // block fail after the app_settings rows were already updated there.
    const broken: Pick<DatabaseEngine, 'serializeWrites'> = {
      async serializeWrites(em) {
        await engine.serializeWrites(em);
        await em
          .getConnection()
          .execute('ALTER TABLE users RENAME COLUMN id TO id_renamed_for_test', [], 'run', em.getTransactionContext());
      },
    };

    await expect(rotateOnPostgres(orm, broken, OLD_KEY, NEW_KEY)).rejects.toThrow();

    const after = await sql<{ key: string; value: string }>(
      "SELECT key, value FROM app_settings WHERE key IN ('smtp_pass', 'admin_ntfy_token') ORDER BY key",
    );
    expect(after).toEqual(before);
    const columns = await sql<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'id'",
    );
    expect(columns).toHaveLength(1);
  });
});
