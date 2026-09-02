/**
 * Instance-wide plugin settings (#plugins): the admin-owned counterpart of the
 * per-user settings form. Proves: the field list serves ONLY `scope:'instance'`
 * declarations (in declared order, with the metadata the form renders from), the
 * admin list carries a count so the UI can gate its menu item without a fetch,
 * saving through the controller re-spawns an ACTIVE plugin (config is handed to
 * the child once, in its init envelope), and an inactive plugin is left alone.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Request } from 'express';

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
import { discoverPlugins } from '../../../src/nest/plugins/install/discovery';

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

/**
 * Installs a real plugin through the manifest -> discovery pipeline (not a direct
 * `declareField` row), so `default`-handling tests exercise `parseSettings`/
 * `parseSettingDefault` in manifest.ts, not just the settingsFields() read path.
 */
let codeRoot: string;
function installFixturePlugin(opts: { settings: Array<Record<string, unknown>> }) {
  const dir = path.join(codeRoot, 'fixture-id', 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(codeRoot, 'fixture-id', 'trek-plugin.json'),
    JSON.stringify({ id: 'fixture-id', name: 'Fixture', version: '1.0.0', type: 'integration', trek: '>=4.0.0 <5.0.0', settings: opts.settings }),
  );
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports={}');
  discoverPlugins(testDb);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});
beforeEach(() => {
  testDb.prepare('DELETE FROM plugins').run();
  testDb.prepare('DELETE FROM plugin_settings_fields').run();
  process.env.TREK_PLUGINS_ENABLED = 'true';
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ins-settings-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(codeRoot, { recursive: true, force: true });
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

  it('INS-010 — persists a settings-field default and serves it on the fields list', () => {
    installFixturePlugin({ settings: [{ key: 'oauth_authorize_url', required: true, default: 'https://auth.openbnb.org/authorize' }] });
    const fields = svc().instanceSettingsFields('fixture-id');
    expect(fields[0].default).toBe('https://auth.openbnb.org/authorize');
  });

  it('INS-013 — drops a default the field cannot take: non-boolean on a checkbox, or not one of the select options', () => {
    installFixturePlugin({
      settings: [
        { key: 'on', input_type: 'checkbox', default: 'true' },
        { key: 'mode', input_type: 'select', options: ['fast', 'slow'], default: 'warp' },
        { key: 'mode_ok', input_type: 'select', options: [{ value: 'a', label: 'A' }], default: 'a' },
        { key: 'on_ok', input_type: 'checkbox', default: true },
      ],
    });
    const byKey = Object.fromEntries(svc().instanceSettingsFields('fixture-id').map((f) => [f.key, f.default]));
    expect(byKey).toEqual({ on: undefined, mode: undefined, mode_ok: 'a', on_ok: true });
  });

  it('INS-011 — drops a default on a secret field at parse time', () => {
    installFixturePlugin({ settings: [{ key: 'token', secret: true, default: 'leak' }] });
    expect(svc().instanceSettingsFields('fixture-id')[0].default).toBeUndefined();
  });
});

describe('required settings are enforced on save', () => {
  it('refuses a save that leaves a required instance field empty', () => {
    installFixturePlugin({ settings: [{ key: 'client_id', required: true }] });
    expect(() => svc().updateInstanceConfig('fixture-id', { client_id: '   ' })).toThrow(/Missing required setting "client_id"/);
  });

  it('accepts a partial patch when the required field is already stored', () => {
    installFixturePlugin({ settings: [{ key: 'client_id', required: true }, { key: 'note', required: false }] });
    const s = svc();
    s.updateInstanceConfig('fixture-id', { client_id: 'abc' });
    expect(() => s.updateInstanceConfig('fixture-id', { note: 'hi' })).not.toThrow();
  });

  it('accepts a user-scope partial patch when the required user field is already stored', () => {
    installFixturePlugin({ settings: [{ key: 'api_key', scope: 'user', required: true }, { key: 'units', scope: 'user' }] });
    const s = svc();
    s.updateUserConfig('fixture-id', 1, { api_key: 'sk-1' });
    expect(() => s.updateUserConfig('fixture-id', 1, { units: 'metric' })).not.toThrow();
  });

  it('refuses a user-settings save that leaves a required user field empty', () => {
    installFixturePlugin({ settings: [{ key: 'api_key', scope: 'user', required: true }] });
    expect(() => svc().updateUserConfig('fixture-id', 1, { api_key: '' })).toThrow(/Missing required setting "api_key"/);
  });

  it('exempts checkbox fields from required enforcement (consent, not a settings field)', () => {
    installFixturePlugin({ settings: [{ key: 'accept_terms', input_type: 'checkbox', required: true }, { key: 'note', required: false }] });
    // accept_terms is left entirely unset (never patched, nothing stored) — a
    // non-checkbox required field in this state would throw.
    expect(() => svc().updateInstanceConfig('fixture-id', { note: 'hi' })).not.toThrow();
  });

  it('a required field with a manifest default is satisfied by the default', () => {
    installFixturePlugin({ settings: [{ key: 'region', required: true, default: 'eu' }, { key: 'note', required: false }] });
    // region is never patched and nothing is stored — the runtime will see the default,
    // so refusing the save here would contradict what the child actually gets.
    expect(() => svc().updateInstanceConfig('fixture-id', { note: 'hi' })).not.toThrow();
  });

  it('a stored secret (non-empty ciphertext) counts as filled on a later partial patch', () => {
    installFixturePlugin({ settings: [{ key: 'api_key', secret: true, required: true }, { key: 'note', required: false }] });
    const s = svc();
    s.updateInstanceConfig('fixture-id', { api_key: 'sk-real' });
    expect(() => s.updateInstanceConfig('fixture-id', { api_key: '••••••••', note: 'hi' })).not.toThrow();
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

    const out = controllerWith({ actionsOf: () => [] }).getConfig('p');
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

  it('INS-009 — PUT :id/config with no body is an empty patch, not a crash', async () => {
    install('p');
    declareField('p', 'apiUrl', 'instance');
    const respawnIfActive = vi.fn(async () => false);

    const out = await controllerWith({ respawnIfActive }).updateConfig('p', undefined as never);
    expect(out.config).toEqual({});
    expect(out.restarted).toBe(false);
  });
});

describe('defaults reach the child at spawn', () => {
  it('INS-012 — an unset instance field is handed to the child as its manifest default; a stored value wins', async () => {
    installFixturePlugin({
      settings: [
        { key: 'api_url', default: 'https://api.example' },
        { key: 'retries', input_type: 'number', default: 3 },
        { key: 'note' },
      ],
    });
    const s = svc();
    s.updateInstanceConfig('fixture-id', { api_url: 'https://mine.example' });

    const rt = createPluginRuntime(new DatabaseService(dbConn));
    const sup = (rt as unknown as { supervisor: { activate: (...a: unknown[]) => Promise<void> } }).supervisor;
    const activate = vi.spyOn(sup, 'activate').mockResolvedValue(undefined);

    await rt.activate('fixture-id');

    expect(activate).toHaveBeenCalledTimes(1);
    const config = activate.mock.calls[0][2] as Record<string, unknown>;
    expect(config).toEqual({ api_url: 'https://mine.example', retries: 3 }); // note: no default, no value → absent
  });
});

describe('plugin_actions.scope migration', () => {
  it('MIG-ACT-001 — the column exists on a migrated DB and defaults to user', () => {
    const cols = testDb.prepare("SELECT name FROM pragma_table_info('plugin_actions')").all() as Array<{ name: string }>;
    expect(cols.some((c) => c.name === 'scope')).toBe(true);
    testDb.prepare("INSERT INTO plugin_actions (plugin_id, action_key, label, hint, danger, sort_order) VALUES ('m', 'k', 'K', NULL, 0, 0)").run();
    expect((testDb.prepare("SELECT scope FROM plugin_actions WHERE plugin_id='m'").get() as { scope: string }).scope).toBe('user');
    testDb.prepare("DELETE FROM plugin_actions WHERE plugin_id='m'").run();
  });
});

describe('instance-scope actions (admin)', () => {
  function declareAction(pluginId: string, key: string, scope: 'user' | 'instance') {
    testDb.prepare('INSERT INTO plugin_actions (plugin_id, action_key, label, hint, danger, scope, sort_order) VALUES (?, ?, ?, NULL, 0, ?, 0)')
      .run(pluginId, key, key, scope);
  }
  const adminReq = { user: { id: 42 } } as unknown as Request;
  function controller(invoke = vi.fn(async () => ({ ok: true, message: 'pong' }))) {
    const rt = createPluginRuntime(new DatabaseService(dbConn));
    // isActive normally reflects the supervisor's live child map, which nothing here
    // spawns — so it's stubbed to read the same DB status the test itself flips,
    // mirroring what an actually-activated plugin would report.
    const isActive = (id: string) => !!testDb.prepare("SELECT 1 FROM plugins WHERE id = ? AND status = 'active'").get(id);
    const runtime = Object.assign(rt, { invokeAction: invoke, isActive }) as unknown as PluginRuntimeService;
    const c = new PluginsController(svc(), runtime, {} as unknown as PluginRegistryService, { isManaged: () => false } as unknown as RuntimeEnvService);
    return { c, invoke };
  }

  beforeEach(() => { testDb.prepare('DELETE FROM plugin_actions').run(); });

  it('ACT-ADM-001 — GET config lists the instance actions and none of the user ones', () => {
    install('p');
    declareAction('p', 'purge', 'instance');
    declareAction('p', 'testConnection', 'user');
    const { c } = controller();
    expect(c.getConfig('p').actions).toEqual([{ key: 'purge', label: 'purge', hint: undefined, danger: false, scope: 'instance' }]);
  });

  it('ACT-ADM-002 — POST runs the action as the clicking admin in the instance scope', async () => {
    install('p');
    testDb.prepare("UPDATE plugins SET status = 'active', enabled = 1 WHERE id = 'p'").run();
    const { c, invoke } = controller();
    expect(await c.runAction('p', 'purge', adminReq)).toEqual({ ok: true, message: 'pong' });
    expect(invoke).toHaveBeenCalledWith('p', 'purge', 42, 'instance');
  });

  it('ACT-ADM-003 — an inactive plugin answers 404 like the user route', async () => {
    install('p');
    const { c, invoke } = controller();
    await expect(c.runAction('p', 'purge', adminReq)).rejects.toMatchObject({ status: 404, response: { error: 'Plugin is not active' } });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('ACT-ADM-004 — a refused key is a failed RESULT, not a server error', async () => {
    install('p');
    testDb.prepare("UPDATE plugins SET status = 'active', enabled = 1 WHERE id = 'p'").run();
    const { c } = controller(vi.fn(async () => { throw new Error('plugin p did not declare action "x" in scope instance'); }));
    expect(await c.runAction('p', 'x', adminReq)).toEqual({ ok: false, message: 'plugin p did not declare action "x" in scope instance' });
  });
});
