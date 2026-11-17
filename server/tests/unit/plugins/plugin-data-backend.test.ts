/**
 * The plugin data port (src/nest/plugins/host/plugin-data.backend.ts): the
 * backend `PLUGIN_DATA` binds is the engine's, the SQLite one keeps a file per
 * plugin, and the Postgres one opens a schema store and writes no SQLite file.
 * The Postgres store against a real database is the Postgres lane's
 * tests/postgres/plugin-data.test.ts.
 */
import type { DbSettings } from '../../../src/app-config';
import type { DatabaseEngine } from '../../../src/db/engine';
import { PRIVILEGED_ROLE_PLUGIN_REFUSAL } from '../../../src/db/engine/postgres/plugin-data-checks';
import { PostgresPluginDataStore } from '../../../src/db/engine/postgres/plugin-data-store';
import { PRIVILEGED_ROLE_DESCRIPTION } from '../../../src/db/engine/postgres/server-checks';
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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { logWarn } = vi.hoisted(() => ({ logWarn: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/audit/audit-log.logger')>()),
  logWarn,
}));

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-plugin-data-port-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

/**
 * An ORM whose Kysely client records the SQL it is handed, and whose pool
 * hands out a client answering the role check with `privileged` (or failing
 * with it, when it is an Error).
 */
function fakeOrm(executed: string[], privileged: boolean | Error = false, released: boolean[] = []): MikroORM {
  const client = {
    executeQuery: async (query: { sql: string }) => {
      executed.push(query.sql);
      return { rows: [] };
    },
  };
  const pgClient = {
    query: async (sql: string) => {
      executed.push(sql);
      if (privileged instanceof Error) throw privileged;
      return { rows: [{ privileged }], rowCount: 1 };
    },
    release: (destroy?: boolean) => released.push(destroy === true),
  };
  const pool = { connect: async () => pgClient };
  return {
    em: { getConnection: () => ({ getClient: () => client, getNativeClient: async () => pool }) },
  } as unknown as MikroORM;
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

  it("PLUGDATA-006: on Postgres the boot log says when TREK's role keeps plugin databases refused, and why", async () => {
    logWarn.mockClear();
    const released: boolean[] = [];
    await new PostgresPluginDataBackend(fakeOrm([], true, released), POSTGRES).onApplicationBootstrap();
    expect(logWarn).toHaveBeenCalledWith(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
    expect(PRIVILEGED_ROLE_PLUGIN_REFUSAL).toContain(PRIVILEGED_ROLE_DESCRIPTION);
    expect(released).toEqual([false]);

    logWarn.mockClear();
    await new PostgresPluginDataBackend(fakeOrm([], false), POSTGRES).onApplicationBootstrap();
    await new PostgresPluginDataBackend(fakeOrm([], true), SQLITE).onApplicationBootstrap();
    expect(logWarn).not.toHaveBeenCalled();

    await new PostgresPluginDataBackend(fakeOrm([], new Error('down')), POSTGRES).onApplicationBootstrap();
    expect(logWarn).toHaveBeenCalledWith("Could not check whether TREK's role may run plugin SQL: down");
  });

  it('PLUGDATA-007: the stores of one backend share its role check, so a connection is asked once', async () => {
    const executed: string[] = [];
    const backend = new PostgresPluginDataBackend(fakeOrm(executed, true), POSTGRES);
    await backend.onApplicationBootstrap();
    await expect(backend.open('pg-four').query('SELECT 1')).rejects.toThrow(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
    await expect(backend.open('pg-five').query('SELECT 1')).rejects.toThrow(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
    expect(executed.filter((sql) => sql.includes('as privileged'))).toHaveLength(1);
  });
});
