import type { DbSettings } from '../../../app-config';
import type { EngineId } from '../../../app-config/db-settings';
import { postgresTarget, type DatabaseEngine } from '../../../db/engine';
import type { PluginDataStore } from '../../../db/engine/plugin-data';
import { PRIVILEGED_ROLE_PLUGIN_REFUSAL, PrivilegedRoleGate } from '../../../db/engine/postgres/plugin-data-checks';
import {
  dropPluginSchema,
  PluginDataSlots,
  pluginDataSlots,
  poolClients,
  PostgresPluginDataStore,
} from '../../../db/engine/postgres/plugin-data-store';
import { SqlitePluginDataStore } from '../../../db/engine/sqlite/plugin-data-store';
import { logWarn } from '../../audit/audit-log.logger';
import { DATABASE_ENGINE, DATABASE_SETTINGS } from '../../database/database-engine.module';
import { pluginDataDir, pluginDbFile } from '../paths';
import { removePluginData } from './plugin-data.service';
import { MikroORM } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '@mikro-orm/sql';
import { Inject, Injectable, type OnApplicationBootstrap, type Provider } from '@nestjs/common';

import type { Kysely } from 'kysely';
import fs from 'node:fs';

/**
 * Where plugins keep their own data (`db:own`), bound to the engine TREK runs
 * on (`PLUGIN_DATA`): a SQLite file per plugin beside TREK's own file, or a
 * schema per plugin in TREK's Postgres database, so a Postgres install
 * writes no SQLite file to the data volume. The host opens a plugin's store
 * through it and erases a plugin's data through it on uninstall.
 */
export interface PluginDataBackend {
  /** The engine a plugin's SQL runs on, which `db.engine` tells the plugin. */
  readonly engine: EngineId;
  /** A store for the plugin `pluginId`, opened on first use. */
  open(pluginId: string): PluginDataStore;
  /** Deletes everything the plugin `pluginId` stored: its database and its data directory. */
  erase(pluginId: string): Promise<void>;
}

export const PLUGIN_DATA = Symbol('PLUGIN_DATA');

/** Each plugin's own SQLite file under the plugin data directory (`db/engine/sqlite/plugin-data-store.ts`). */
@Injectable()
export class SqlitePluginDataBackend implements PluginDataBackend {
  readonly engine = 'sqlite' as const;

  open(pluginId: string): PluginDataStore {
    return new SqlitePluginDataStore(pluginId, pluginDbFile(pluginId));
  }

  async erase(pluginId: string): Promise<void> {
    removePluginData(pluginId);
  }
}

/**
 * Each plugin's own schema in TREK's Postgres database
 * (`db/engine/postgres/plugin-data-store.ts`). Each call checks a client
 * out of the ORM's pool for itself; erasing a plugin runs on the ORM's Kysely
 * client. The plugin's data directory is still created, for the files a plugin
 * keeps beside its database, and it is what marks a plugin uninstalled with
 * its data kept (the erasure queue reads it).
 *
 * While TREK's role is privileged (`PRIVILEGED_ROLE_SQL`), every store refuses
 * its calls (`plugin-data-checks.ts`), and the boot log says so once.
 */
@Injectable()
export class PostgresPluginDataBackend implements PluginDataBackend, OnApplicationBootstrap {
  readonly engine = 'postgres' as const;
  /** Shared by every plugin's store; made on first use, since on SQLite this provider is built but never used. */
  private slots: PluginDataSlots | null = null;
  /** Shared by every plugin's store, so the role is read once per pool connection. */
  private readonly roleGate = new PrivilegedRoleGate();

  constructor(
    private readonly orm: MikroORM,
    @Inject(DATABASE_SETTINGS) private readonly settings: DbSettings,
  ) {}

  /** On Postgres, says in the boot log when plugin databases are refused because of TREK's role. */
  async onApplicationBootstrap(): Promise<void> {
    if (!postgresTarget(this.settings)) return;
    try {
      const client = await poolClients(this.orm.em.getConnection())();
      try {
        if (await this.roleGate.privileged(client)) logWarn(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
      } finally {
        client.release();
      }
    } catch (err) {
      logWarn(
        `Could not check whether TREK's role may run plugin SQL: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  open(pluginId: string): PluginDataStore {
    fs.mkdirSync(pluginDataDir(pluginId), { recursive: true });
    const connect = poolClients(this.orm.em.getConnection());
    return new PostgresPluginDataStore(pluginId, connect, this.sharedSlots(), {}, this.roleGate);
  }

  async erase(pluginId: string): Promise<void> {
    await dropPluginSchema(this.client(), pluginId);
    removePluginData(pluginId);
  }

  private sharedSlots(): PluginDataSlots {
    if (this.slots === null) {
      const target = postgresTarget(this.settings);
      if (!target) throw new Error('The Postgres plugin data store was used without TREK_DB_URL.');
      this.slots = new PluginDataSlots(pluginDataSlots(target.poolMax));
    }
    return this.slots;
  }

  /** The Kysely client on the ORM's pool. */
  private client(): Kysely<object> {
    return (this.orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
  }
}

/** The two backends, and `PLUGIN_DATA` bound to the one for the engine in use. */
export const PLUGIN_DATA_PROVIDERS: Provider[] = [
  SqlitePluginDataBackend,
  PostgresPluginDataBackend,
  {
    provide: PLUGIN_DATA,
    useFactory: (
      engine: DatabaseEngine,
      sqlite: SqlitePluginDataBackend,
      postgres: PostgresPluginDataBackend,
    ): PluginDataBackend => ({ sqlite, postgres })[engine.id],
    inject: [DATABASE_ENGINE, SqlitePluginDataBackend, PostgresPluginDataBackend],
  },
];
