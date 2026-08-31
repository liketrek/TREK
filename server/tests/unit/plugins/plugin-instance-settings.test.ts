/**
 * Instance-wide plugin settings (#plugins): the admin-owned counterpart of the
 * per-user settings form. Proves: the field list serves ONLY `scope:'instance'`
 * declarations (in declared order, with the metadata the form renders from), the
 * admin list carries a count so the UI can gate its menu item without a fetch,
 * saving through the controller re-spawns an ACTIVE plugin (config is handed to
 * the child once, in its init envelope), and an inactive plugin is left alone.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null } };
});
vi.mock('../../../src/db/database', () => dbMock);
import { db as dbConn } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
vi.mock('../../../src/config', () => ({ JWT_SECRET: 'x'.repeat(40), ENCRYPTION_KEY: 'a'.repeat(64), updateJwtSecret: () => {} }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import type { PluginRegistryService } from '../../../src/nest/plugins/registry/registry.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { createPluginRuntime } from '../../helpers/plugin-host';

function install(id: string) {
  testDb
    .prepare(
      `INSERT OR REPLACE INTO plugins (id, name, status, enabled, version, permissions, granted_permissions, capabilities, config)
       VALUES (?, ?, 'inactive', 0, '1.0.0', '[]', '[]', '{}', '{}')`,
    )
    .run(id, id);
}

function declareField(pluginId: string, key: string, scope: 'instance' | 'user', opts: { secret?: boolean; required?: boolean; sortOrder?: number; options?: string } = {}) {
  testDb
    .prepare(
      `INSERT INTO plugin_settings_fields (plugin_id, field_key, label, input_type, placeholder, hint, required, secret, scope, options, sort_order)
       VALUES (?, ?, ?, 'text', NULL, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(pluginId, key, key, opts.required ? 1 : 0, opts.secret ? 1 : 0, scope, opts.options ?? null, opts.sortOrder ?? 0);
}

const svc = () => {
  const dbs = new DatabaseService(dbConn);
  return new PluginsService(dbs, new AddonsService(dbs));
};

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});
beforeEach(() => {
  testDb.prepare('DELETE FROM plugins').run();
  testDb.prepare('DELETE FROM plugin_settings_fields').run();
  process.env.TREK_PLUGINS_ENABLED = 'true';
});

describe('instance settings fields', () => {
  it('INS-001 — lists only the instance-scope fields, in declared order, with form metadata', () => {
    install('p');
    declareField('p', 'apiUrl', 'instance', { required: true, sortOrder: 1 });
    declareField('p', 'apiKey', 'instance', { secret: true, sortOrder: 0 });
    declareField('p', 'units', 'user', { sortOrder: 2 }); // must never leak into the admin form

    const fields = svc().instanceSettingsFields('p');
    expect(fields.map((f) => f.key)).toEqual(['apiKey', 'apiUrl']);
    expect(fields[0]).toMatchObject({ secret: true, required: false, input_type: 'text' });
    expect(fields[1]).toMatchObject({ secret: false, required: true });
  });

  it('INS-002 — parses select options like the user form does', () => {
    install('p');
    declareField('p', 'mode', 'instance', { options: '["fast","slow"]' });
    expect(svc().instanceSettingsFields('p')[0].options).toEqual(['fast', 'slow']);
  });

  it('INS-003 — the admin list carries the instance-field count (gates the menu item)', () => {
    install('with-fields');
    install('plain');
    declareField('with-fields', 'apiKey', 'instance', { secret: true });
    declareField('with-fields', 'apiUrl', 'instance');
    declareField('with-fields', 'units', 'user'); // user fields must not count

    const plugins = svc().list().plugins;
    expect(plugins.find((p) => p.id === 'with-fields')).toMatchObject({ instanceSettingsCount: 2 });
    expect(plugins.find((p) => p.id === 'plain')).toMatchObject({ instanceSettingsCount: 0 });
  });
});

describe('respawn on save (runtime)', () => {
  it('INS-004 — an inactive plugin is left alone (no respawn, reports false)', async () => {
    install('p');
    const rt = createPluginRuntime(new DatabaseService(dbConn));
    await expect(rt.respawnIfActive('p')).resolves.toBe(false);
  });

  it('INS-005 — an active plugin is stopped and re-activated so the child re-reads config', async () => {
    install('p');
    const rt = createPluginRuntime(new DatabaseService(dbConn));
    const calls: string[] = [];
    vi.spyOn(rt, 'isActive').mockReturnValue(true);
    vi.spyOn(rt, 'activate').mockImplementation(async () => { calls.push('activate'); });
    const sup = (rt as unknown as { supervisor: { disable: (id: string) => Promise<void> } }).supervisor;
    vi.spyOn(sup, 'disable').mockImplementation(async () => { calls.push('disable'); });

    await expect(rt.respawnIfActive('p')).resolves.toBe(true);
    expect(calls).toEqual(['disable', 'activate']); // stop first, then bring back up
  });
});

describe('admin config endpoints (controller)', () => {
  const controllerWith = (runtime: Partial<PluginRuntimeService>) =>
    new PluginsController(
      svc(),
      runtime as PluginRuntimeService,
      {} as PluginRegistryService,
      { isManaged: () => false } as unknown as RuntimeEnvService,
    );

  it('INS-006 — GET :id/config returns the fields alongside the (masked) values', () => {
    install('p');
    declareField('p', 'apiUrl', 'instance');
    testDb.prepare("UPDATE plugins SET config = '{\"apiUrl\":\"https://x.example\"}' WHERE id = 'p'").run();

    const out = controllerWith({}).getConfig('p');
    expect(out.config).toEqual({ apiUrl: 'https://x.example' });
    expect(out.fields.map((f: Record<string, unknown>) => f.key)).toEqual(['apiUrl']);
  });

  it('INS-007 — PUT :id/config saves, respawns an active plugin, and reports it', async () => {
    install('p');
    declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => true);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', { apiUrl: 'https://y.example' });
    expect(out.config).toEqual({ apiUrl: 'https://y.example' });
    expect(out.restarted).toBe(true);
    expect(respawnIfActive).toHaveBeenCalledWith('p');
  });

  it('INS-008 — PUT :id/config on an inactive plugin saves without a restart', async () => {
    install('p');
    declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => false);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', { apiUrl: 'https://y.example' });
    expect(out.restarted).toBe(false);
  });
});
