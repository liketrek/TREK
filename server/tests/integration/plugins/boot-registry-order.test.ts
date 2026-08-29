/**
 * Boot-order regression (#plugins): the RPC registry must be scanned before the
 * runtime auto-activates the plugins an admin had enabled.
 *
 * The bug this pins: PluginRuntimeService booted enabled plugins from
 * onModuleInit, and Nest fires same-module onModuleInit hooks in providers-array
 * declaration order — where the runtime service is listed BEFORE
 * PluginRpcRegistryService. Each boot activation builds its PluginRpcHost
 * synchronously (bindInto snapshots the registry at construction), so every host
 * was bound from a STILL-EMPTY registry: the plugin's first RPC on activation
 * (typically ctx.db.migrate in onLoad) came back PERMISSION_DENIED and the plugin
 * landed in error state on every cold boot, until an admin deactivated and
 * reactivated it by hand. The fix moves the boot reconcile to
 * onApplicationBootstrap, which Nest guarantees runs after EVERY module's
 * onModuleInit — so this suite assembles a real Nest module mirroring the
 * production declaration order (runtime provider first, registry scan later) and
 * asserts the plugin still comes up clean.
 */
import { db as dbConn } from '../../../src/db/database';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PluginRpcHostFactory } from '../../../src/nest/plugins/host/plugin-rpc-host.factory';
import { PluginRpcRegistry } from '../../../src/nest/plugins/host/rpc-kit/registry';
import type { PluginRpcRegistryService } from '../../../src/nest/plugins/host/rpc-kit/registry.service';
import { DbRpc } from '../../../src/nest/plugins/host/rpc/db.rpc';
import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { testDb } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE plugins (
    id TEXT PRIMARY KEY, status TEXT, enabled INTEGER DEFAULT 0, version TEXT, api_version INTEGER DEFAULT 1, permissions TEXT DEFAULT '[]', operator_egress INTEGER DEFAULT 0, granted_permissions TEXT DEFAULT '',
    config TEXT DEFAULT '{}', dependencies TEXT DEFAULT '{}', capabilities TEXT DEFAULT '{}', last_error TEXT, updated_at TEXT,
    trek_range TEXT DEFAULT '>=3.0.0',
    source_repo TEXT, author_pubkey TEXT, update_block_code TEXT, update_block_detail TEXT, update_block_version TEXT);
    CREATE TABLE plugin_error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, level TEXT, message TEXT, ts TEXT);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, scope TEXT, secret INTEGER);
    CREATE TABLE settings (user_id INTEGER, key TEXT, value TEXT);
    CREATE TABLE plugin_entity_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, entity_type TEXT, entity_id INTEGER, key TEXT, value TEXT, updated_at TEXT);
    CREATE TABLE plugin_user_config (plugin_id TEXT, user_id INTEGER, field_key TEXT, value TEXT, PRIMARY KEY (plugin_id, user_id, field_key));
    CREATE TABLE plugin_meta_migrations (plugin_id TEXT, migration_id TEXT, PRIMARY KEY (plugin_id, migration_id));
    CREATE TABLE plugin_capability_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, acting_user_id INTEGER, method TEXT, resource TEXT, code TEXT, ts TEXT, prev_hash TEXT, hash TEXT);
    CREATE TABLE plugin_scheduled_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT NOT NULL, name TEXT NOT NULL, due_at INTEGER NOT NULL, payload TEXT NOT NULL DEFAULT 'null', every_ms INTEGER, created_at TEXT DEFAULT (datetime('now')), UNIQUE(plugin_id, name));
    CREATE TABLE plugin_user_erasure_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT NOT NULL, user_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(plugin_id, user_id));
    CREATE TABLE addons (id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0);
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  return { testDb: db };
});
vi.mock('../../../src/db/database', () => ({ db: testDb, canAccessTrip: () => undefined }));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

let codeRoot: string;
let dataRoot: string;
let mod: TestingModule;

beforeAll(() => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-boot-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-boot-data-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
  process.env.TREK_PLUGINS_ENABLED = 'true';

  // The exact shape the bug bit: a plugin that runs its own-db migration as the
  // first thing its onLoad does — what every db-backed plugin's activation looks like.
  const dir = path.join(codeRoot, 'migrator', 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.js'),
    `module.exports = { async onLoad(ctx) { await ctx.db.migrate('001', 'CREATE TABLE t (n INTEGER)'); } };`,
  );
  // The row a container recreate leaves behind: enabled, already consented to
  // db:own. Seeded 'inactive' (not the 'active' a real shutdown leaves) so the
  // poll below only terminates on a status the THIS-boot supervisor wrote.
  testDb
    .prepare(
      "INSERT INTO plugins (id, status, enabled, permissions, granted_permissions, config) VALUES ('migrator','inactive',1,'[\"db:own\"]','[\"db:own\"]','{}')",
    )
    .run();
});

afterAll(async () => {
  await mod?.close();
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  delete process.env.TREK_PLUGINS_ENABLED;
  fs.rmSync(codeRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});

describe('plugin boot vs registry scan ordering', () => {
  it("BOOT-REG-001 a plugin enabled before a restart activates cleanly even though the registry scan runs in a LATER provider's onModuleInit", async () => {
    const dbs = new DatabaseService(dbConn);
    const userSettings = new PluginUserSettingsService(dbs);
    // Empty at construction — exactly what PluginRpcRegistryService is before its
    // own onModuleInit scan has run.
    const registry = new PluginRpcRegistry();
    const hostFactory = new PluginRpcHostFactory(dbs, registry as unknown as PluginRpcRegistryService);

    mod = await Test.createTestingModule({
      providers: [
        // Mirrors plugins-runtime.module.ts: the runtime service is DECLARED BEFORE
        // the provider that populates the registry, so Nest fires its onModuleInit
        // (if it had one) first. The boot reconcile must therefore not live there.
        {
          provide: PluginRuntimeService,
          useFactory: () =>
            new PluginRuntimeService(
              dbs,
              new AuditService(dbs),
              new AddonsService(dbs),
              userSettings,
              undefined,
              hostFactory,
            ),
        },
        {
          provide: 'REGISTRY_SCAN',
          useFactory: () => ({
            onModuleInit() {
              registry.register(new DbRpc(userSettings));
            },
          }),
        },
      ],
    }).compile();
    await mod.init();

    // Boot activation is fire-and-forget; wait for the supervisor to settle the row.
    const runtime = mod.get(PluginRuntimeService);
    let row = { status: 'starting', last_error: null as string | null };
    for (let i = 0; i < 100; i++) {
      row = testDb.prepare("SELECT status, last_error FROM plugins WHERE id='migrator'").get() as typeof row;
      if (row.status === 'active' || row.status === 'error') break;
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(row.last_error).toBeNull();
    expect(row.status).toBe('active');
    expect(runtime.isActive('migrator')).toBe(true);
  });
});
