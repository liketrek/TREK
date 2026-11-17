/**
 * The plugin data port (src/nest/plugins/host/plugin-data.backend.ts): the
 * backend `PLUGIN_DATA` binds is the engine's, the SQLite one keeps a file per
 * plugin, and the Postgres one opens a schema store and writes no SQLite file.
 * The Postgres store against a real database is the Postgres lane's
 * tests/postgres/plugin-data.test.ts.
 */
import type { DbSettings } from '../../../src/app-config';
import type { DatabaseEngine } from '../../../src/db/engine';
import { PostgresPluginDataStore } from '../../../src/db/engine/postgres/plugin-data-store';
import {
  PLUGIN_DATA,
  PLUGIN_DATA_PROVIDERS,
  PostgresPluginDataBackend,
  SqlitePluginDataBackend,
} from '../../../src/nest/plugins/host/plugin-data.backend';
import { PluginDataDb } from '../../../src/nest/plugins/host/plugin-data.service';
import type { MikroORM } from '@mikro-orm/core';
import type { FactoryProvider } from '@nestjs/common';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugin-data-port-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

/** An ORM whose Kysely client records the SQL it is handed. */
function fakeOrm(executed: string[]): MikroORM {
  const client = {
    executeQuery: async (query: { sql: string }) => {
      executed.push(query.sql);
      return { rows: [] };
    },
  };
  return { em: { getConnection: () => ({ getClient: () => client }) } } as unknown as MikroORM;
}

const POSTGRES = { engine: 'postgres', url: 'postgres://trek@db/trek', poolMax: 4 } as unknown as DbSettings;
const SQLITE = { engine: 'sqlite' } as unknown as DbSettings;

describe('plugin data port', () => {
  it('PLUGDATA-001: PLUGIN_DATA is the backend of the engine TREK runs on', () => {
    const binding = PLUGIN_DATA_PROVIDERS.find(
      (p): p is FactoryProvider => typeof p === 'object' && 'provide' in p && p.provide === PLUGIN_DATA,
    );
    expect(binding).toBeDefined();
    const sqlite = new SqlitePluginDataBackend();
    const postgres = new PostgresPluginDataBackend(fakeOrm([]), POSTGRES);
    const pick = (id: 'sqlite' | 'postgres') => binding?.useFactory({ id } as DatabaseEngine, sqlite, postgres);
    expect(pick('sqlite')).toBe(sqlite);
    expect(pick('postgres')).toBe(postgres);
    expect(sqlite.engine).toBe('sqlite');
    expect(postgres.engine).toBe('postgres');
  });

  it("PLUGDATA-002: on SQLite a plugin's data is a file of its own, and erasing removes its directory", async () => {
    const backend = new SqlitePluginDataBackend();
    const store = backend.open('sqlite-one');
    expect(store).toBeInstanceOf(PluginDataDb);
    expect(store.engine).toBe('sqlite');
    store.close();
    expect(fs.existsSync(path.join(tmp, 'sqlite-one', 'plugin.db'))).toBe(true);
    await backend.erase('sqlite-one');
    expect(fs.existsSync(path.join(tmp, 'sqlite-one'))).toBe(false);
  });

  it('PLUGDATA-003: on Postgres a plugin gets a schema store and its data directory, but no SQLite file', async () => {
    const executed: string[] = [];
    const backend = new PostgresPluginDataBackend(fakeOrm(executed), POSTGRES);
    const store = backend.open('pg-one');
    expect(store).toBeInstanceOf(PostgresPluginDataStore);
    expect(store.engine).toBe('postgres');
    expect(fs.readdirSync(path.join(tmp, 'pg-one'))).toEqual([]);
    expect(executed).toEqual([]);

    await backend.erase('pg-one');
    expect(executed).toEqual(['drop schema if exists "trek_plugin_pg_one" cascade']);
    expect(fs.existsSync(path.join(tmp, 'pg-one'))).toBe(false);
  });

  it('PLUGDATA-004: the Postgres backend refuses to open a store without a Postgres database', () => {
    const backend = new PostgresPluginDataBackend(fakeOrm([]), SQLITE);
    expect(() => backend.open('pg-two')).toThrow(/without TREK_DB_URL/);
  });

  it('PLUGDATA-005: a closed Postgres store refuses new calls, so the host opens a fresh one', async () => {
    const backend = new PostgresPluginDataBackend(fakeOrm([]), POSTGRES);
    const store = backend.open('pg-three');
    expect(store.isOpen()).toBe(true);
    store.close();
    expect(store.isOpen()).toBe(false);
    await expect(store.query('SELECT 1')).rejects.toThrow('The database connection is not open');
    await expect(store.query('SELECT * FROM public.users')).rejects.toThrow('The database connection is not open');
  });
});
