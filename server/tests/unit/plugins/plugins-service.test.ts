/**
 * The read-side plugin service + controller (#plugins, M0). Lists installed
 * plugins and reports whether the runtime is enabled (TREK_PLUGINS_ENABLED).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { testDb } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE plugins (
    id TEXT PRIMARY KEY, name TEXT, description TEXT, type TEXT, icon TEXT, version TEXT,
    status TEXT, reviewed_at TEXT, source_repo TEXT, config TEXT DEFAULT '{}', updated_at TEXT,
    sort_order INTEGER DEFAULT 0);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, scope TEXT, secret INTEGER);`);
  return { testDb: db };
});
vi.mock('../../../src/db/database', () => ({ db: testDb }));

import { PluginsService } from '../../../src/nest/plugins/plugins.service';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';

beforeEach(() => {
  testDb.exec('DELETE FROM plugins');
  testDb.exec('DELETE FROM plugin_settings_fields');
  delete process.env.TREK_PLUGINS_ENABLED;
});
afterEach(() => {
  delete process.env.TREK_PLUGINS_ENABLED;
});

describe('PluginsService.list', () => {
  it('returns the installed plugins and the runtime-enabled flag', () => {
    testDb
      .prepare('INSERT INTO plugins (id, name, description, type, status, version) VALUES (?,?,?,?,?,?)')
      .run('flight', 'Flight', 'desc', 'widget', 'inactive', '1.0.0');
    process.env.TREK_PLUGINS_ENABLED = 'true';

    const out = new PluginsService().list();
    expect(out.enabled).toBe(true);
    expect(out.plugins).toHaveLength(1);
    expect(out.plugins[0]).toMatchObject({ id: 'flight', name: 'Flight', status: 'inactive' });
  });

  it('reports disabled when the kill switch is off (default)', () => {
    const out = new PluginsService().list();
    expect(out.enabled).toBe(false);
    expect(out.plugins).toEqual([]);
  });

  it('controller delegates to the service', () => {
    const svc = { list: vi.fn(() => ({ enabled: false, plugins: [] })) } as unknown as PluginsService;
    const runtime = {} as unknown as import('../../../src/nest/plugins/plugin-runtime.service').PluginRuntimeService;
    const res = new PluginsController(svc, runtime).list();
    expect(svc.list).toHaveBeenCalled();
    expect(res).toEqual({ enabled: false, plugins: [] });
  });
});

describe('PluginsController M2 endpoints', () => {
  const svc = {
    getInstanceConfig: vi.fn(() => ({ a: 1 })),
    updateInstanceConfig: vi.fn(() => ({ a: 2 })),
  } as unknown as PluginsService;

  beforeEach(() => {
    (svc.getInstanceConfig as ReturnType<typeof vi.fn>).mockClear();
    (svc.updateInstanceConfig as ReturnType<typeof vi.fn>).mockClear();
    process.env.TREK_PLUGINS_ENABLED = 'true';
  });

  it('get/update config delegate to the service', () => {
    const rt = { activate: vi.fn(), deactivate: vi.fn(), isActive: vi.fn() } as never;
    const c = new PluginsController(svc, rt);
    expect(c.getConfig('x')).toEqual({ config: { a: 1 } });
    expect(c.updateConfig('x', { a: 2 })).toEqual({ config: { a: 2 } });
  });

  it('activate spawns via the runtime when enabled', async () => {
    const rt = { activate: vi.fn(async () => {}), isActive: vi.fn(() => true) } as never;
    const out = await new PluginsController(svc, rt).activate('x');
    expect(out).toEqual({ status: 'active' });
  });

  it('activate is 503 when the runtime is disabled', async () => {
    process.env.TREK_PLUGINS_ENABLED = 'false';
    const rt = { activate: vi.fn(), isActive: vi.fn() } as never;
    await expect(new PluginsController(svc, rt).activate('x')).rejects.toMatchObject({ status: 503 });
  });

  it('activate surfaces an activation error as 400', async () => {
    const rt = { activate: vi.fn(async () => { throw new Error('bad code'); }), isActive: vi.fn(() => false) } as never;
    await expect(new PluginsController(svc, rt).activate('x')).rejects.toMatchObject({ status: 400 });
  });

  it('deactivate stops the plugin', async () => {
    const rt = { deactivate: vi.fn(async () => {}) } as never;
    expect(await new PluginsController(svc, rt).deactivate('x')).toEqual({ status: 'inactive' });
  });
});

describe('PluginsService instance config', () => {
  it('encrypts secret fields on write and masks them on read; keeps plaintext for non-secrets', () => {
    testDb.prepare("INSERT INTO plugins (id, name, status, config) VALUES ('x','X','inactive','{}')").run();
    testDb.prepare("INSERT INTO plugin_settings_fields (plugin_id, field_key, scope, secret) VALUES ('x','api_key','instance',1)").run();

    const svc = new PluginsService();
    const masked = svc.updateInstanceConfig('x', { api_key: 'super-secret', server: 'https://h' });
    // client gets the masked view
    expect(masked.api_key).toBe('••••••••');
    expect(masked.server).toBe('https://h');

    // stored value is encrypted, not plaintext
    const stored = JSON.parse((testDb.prepare("SELECT config FROM plugins WHERE id='x'").get() as { config: string }).config);
    expect(stored.api_key).not.toBe('super-secret');
    expect(String(stored.api_key)).toMatch(/^enc:/);
    expect(stored.server).toBe('https://h');

    // an unchanged mask does not overwrite the stored secret
    svc.updateInstanceConfig('x', { api_key: '••••••••' });
    const still = JSON.parse((testDb.prepare("SELECT config FROM plugins WHERE id='x'").get() as { config: string }).config);
    expect(still.api_key).toBe(stored.api_key);

    expect(svc.getInstanceConfig('x').api_key).toBe('••••••••');
  });

  it('throws for an unknown plugin', () => {
    expect(() => new PluginsService().updateInstanceConfig('nope', {})).toThrow(/not found/);
    expect(() => new PluginsService().getInstanceConfig('nope')).toThrow(/not found/);
  });
});
