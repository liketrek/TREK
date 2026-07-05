/**
 * End-to-end M2: the runtime service activates a plugin from its DB row and its
 * HTTP route works through the host→child invoke path, using its own isolated
 * db. Proves the full activate → route → deactivate loop.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { testDb } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE plugins (
    id TEXT PRIMARY KEY, status TEXT, enabled INTEGER DEFAULT 0, version TEXT, permissions TEXT DEFAULT '[]', granted_permissions TEXT DEFAULT '',
    config TEXT DEFAULT '{}', dependencies TEXT DEFAULT '{}', capabilities TEXT DEFAULT '{}', last_error TEXT, updated_at TEXT);
    CREATE TABLE plugin_error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, level TEXT, message TEXT, ts TEXT);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, scope TEXT, secret INTEGER);
    CREATE TABLE settings (user_id INTEGER, key TEXT, value TEXT);
    CREATE TABLE plugin_entity_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, entity_type TEXT, entity_id INTEGER, key TEXT, value TEXT, updated_at TEXT);
    CREATE TABLE addons (id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0);`);
  return { testDb: db };
});
vi.mock('../../../src/db/database', () => ({ db: testDb, canAccessTrip: () => undefined }));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { PluginRuntimeService, PluginDependencyError } from '../../../src/nest/plugins/plugin-runtime.service';
import { DependencyCycleError } from '../../../src/nest/plugins/dependencies';

let codeRoot: string;
let dataRoot: string;
let runtime: PluginRuntimeService;

beforeAll(() => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-rt-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-rt-data-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
  process.env.TREK_PLUGINS_ENABLED = 'true';

  const dir = path.join(codeRoot, 'counter', 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.js'),
    `module.exports = {
      async onLoad(ctx) { await ctx.db.migrate('001', 'CREATE TABLE hits (n INTEGER)'); },
      routes: [
        { method: 'GET', path: '/count', auth: true, async handler(req, ctx) {
          await ctx.db.exec('INSERT INTO hits (n) VALUES (1)');
          const rows = await ctx.db.query('SELECT COUNT(*) AS c FROM hits');
          return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ count: rows[0].c, user: req.user }) };
        }},
        { method: 'GET', path: '/boom', auth: false, async handler() { throw new Error('route fail'); } },
      ]
    };`,
  );

  testDb.prepare("INSERT INTO plugins (id, status, permissions, config) VALUES ('counter','active','[\"db:own\"]','{}')").run();
  runtime = new PluginRuntimeService();
});

afterAll(async () => {
  await runtime?.deactivate('counter').catch(() => {});
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  delete process.env.TREK_PLUGINS_ENABLED;
  fs.rmSync(codeRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});

describe('PluginRuntimeService (M2 end-to-end)', () => {
  it('activates a plugin and serves its route through the isolated child', async () => {
    await runtime.activate('counter');
    expect(runtime.isActive('counter')).toBe(true);
    expect(runtime.routesOf('counter')).toEqual([
      { i: 0, method: 'GET', path: '/count', auth: true },
      { i: 1, method: 'GET', path: '/boom', auth: false },
    ]);

    const r1 = (await runtime.invoke('counter', 'invoke.route', {
      routeId: 0,
      req: { method: 'GET', path: '/count', query: {}, body: null, user: { id: 5, username: 'ada', isAdmin: false } },
    })) as { status: number; body: string };
    expect(r1.status).toBe(200);
    const parsed = JSON.parse(r1.body);
    expect(parsed.count).toBe(1);
    expect(parsed.user).toEqual({ id: 5, username: 'ada', isAdmin: false });

    // its own db persists across invokes
    const r2 = (await runtime.invoke('counter', 'invoke.route', {
      routeId: 0,
      req: { method: 'GET', path: '/count', query: {}, body: null, user: { id: 5, username: 'ada', isAdmin: false } },
    })) as { body: string };
    expect(JSON.parse(r2.body).count).toBe(2);

    // DB status was persisted active by the supervisor hook
    const row = testDb.prepare("SELECT status FROM plugins WHERE id = 'counter'").get() as { status: string };
    expect(row.status).toBe('active');
  });

  it('invoke on a plugin that is not running rejects', async () => {
    await expect(runtime.invoke('never-activated', 'invoke.route', { routeId: 0, req: {} })).rejects.toThrow(/not active/);
  });

  it('a route that throws surfaces as a rejected invoke', async () => {
    await expect(
      runtime.invoke('counter', 'invoke.route', { routeId: 1, req: { method: 'GET', path: '/boom', query: {}, body: null, user: null } }),
    ).rejects.toThrow(/route fail/);
  });

  it('activate throws for an unknown plugin id', async () => {
    await expect(runtime.activate('ghost')).rejects.toThrow(/not found/);
  });

  it('re-consent gate: activating a consented plugin with WIDER permissions is refused without consent', async () => {
    // consented to db:own; a version now declaring db:read:users too must not auto-grant
    testDb.prepare("INSERT INTO plugins (id, status, permissions, granted_permissions, config) VALUES ('widener','inactive','[\"db:own\",\"db:read:users\"]','[\"db:own\"]','{}')").run();
    await expect(runtime.activate('widener')).rejects.toThrow(/re-consent|new permissions/);
    // the key case: a plugin consented to ZERO perms ('[]') is still "consented" —
    // a later widening to db:own is blocked, not silently granted.
    testDb.prepare("INSERT INTO plugins (id, status, permissions, granted_permissions, config) VALUES ('zeroperm','inactive','[\"db:own\"]','[]','{}')").run();
    await expect(runtime.activate('zeroperm')).rejects.toThrow(/re-consent|new permissions/);
    // (a NEVER-consented plugin — granted '' — consenting to its declared set on
    // first activate is covered by the 'counter' happy-path test above.)
  });

  it('onModuleInit is a no-op when the runtime is disabled', () => {
    process.env.TREK_PLUGINS_ENABLED = 'false';
    expect(() => new PluginRuntimeService().onModuleInit()).not.toThrow();
    process.env.TREK_PLUGINS_ENABLED = 'true';
  });

  it('deactivate stops the plugin and clears the enabled intent', async () => {
    await runtime.deactivate('counter');
    expect(runtime.isActive('counter')).toBe(false);
    const row = testDb.prepare("SELECT status, enabled FROM plugins WHERE id = 'counter'").get() as { status: string; enabled: number };
    expect(row.status).toBe('inactive');
    expect(row.enabled).toBe(0);
  });

  it('activate sets the enabled intent so it survives a reboot', async () => {
    await runtime.deactivate('counter');
    await runtime.activate('counter');
    const row = testDb.prepare("SELECT enabled FROM plugins WHERE id = 'counter'").get() as { enabled: number };
    expect(row.enabled).toBe(1);
  });

  it('tolerates malformed granted_permissions / config JSON on activate', async () => {
    fs.mkdirSync(path.join(codeRoot, 'messy', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'messy', 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    testDb.prepare("INSERT INTO plugins (id, status, permissions, config) VALUES ('messy','inactive','not-json','not-json')").run();
    const rt = new PluginRuntimeService();
    await rt.activate('messy'); // must not throw despite the garbage JSON
    expect(rt.isActive('messy')).toBe(true);
    await rt.deactivate('messy');
  });

  it('onModuleInit boots every ENABLED plugin — even one left in error state', async () => {
    fs.mkdirSync(path.join(codeRoot, 'booter', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'booter', 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    // status='error' from a previous crash, but enabled=1 → must still boot
    testDb.prepare("INSERT INTO plugins (id, status, enabled, granted_permissions, config) VALUES ('booter','error',1,'[]','{}')").run();

    const rt = new PluginRuntimeService();
    rt.onModuleInit(); // fire-and-forget spawn
    for (let i = 0; i < 40 && !rt.isActive('booter'); i++) await new Promise((r) => setTimeout(r, 50));
    expect(rt.isActive('booter')).toBe(true);
    await rt.deactivate('booter');
  });

  it('onModuleInit does NOT boot a disabled plugin', async () => {
    fs.mkdirSync(path.join(codeRoot, 'sleeper', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'sleeper', 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    testDb.prepare("INSERT INTO plugins (id, status, enabled, granted_permissions, config) VALUES ('sleeper','inactive',0,'[]','{}')").run();

    const rt = new PluginRuntimeService();
    rt.onModuleInit();
    await new Promise((r) => setTimeout(r, 300));
    expect(rt.isActive('sleeper')).toBe(false);
  });

  it('outboundHostsOf extracts declared http:outbound hosts', () => {
    testDb.prepare("INSERT INTO plugins (id, status, granted_permissions, config) VALUES ('net','inactive','[\"db:own\",\"http:outbound:api.x.com\",\"http:outbound:*.y.com\"]','{}')").run();
    const rt = new PluginRuntimeService();
    expect(rt.outboundHostsOf('net')).toEqual(['api.x.com', '*.y.com']);
    expect(rt.outboundHostsOf('missing')).toEqual([]);
  });

  it('uninstall removes the code, DB rows, settings and (with deleteData) data', async () => {
    fs.mkdirSync(path.join(codeRoot, 'gone', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'gone', 'server', 'index.js'), 'module.exports={}');
    testDb.prepare("INSERT INTO plugins (id, status, permissions, config) VALUES ('gone','inactive','[]','{}')").run();
    testDb.prepare("INSERT INTO plugin_settings_fields (plugin_id, field_key, scope, secret) VALUES ('gone','k','instance',0)").run();
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (1, 'plugin:gone:units', 'metric')").run();

    await new PluginRuntimeService().uninstall('gone', true);

    expect(fs.existsSync(path.join(codeRoot, 'gone'))).toBe(false);
    expect(testDb.prepare("SELECT COUNT(*) c FROM plugins WHERE id='gone'").get()).toMatchObject({ c: 0 });
    expect(testDb.prepare("SELECT COUNT(*) c FROM plugin_settings_fields WHERE plugin_id='gone'").get()).toMatchObject({ c: 0 });
    expect(testDb.prepare("SELECT COUNT(*) c FROM settings WHERE key LIKE 'plugin:gone:%'").get()).toMatchObject({ c: 0 });
  });

  it('the egress guard blocks a fetch to an undeclared host', async () => {
    fs.mkdirSync(path.join(codeRoot, 'nettry', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'nettry', 'server', 'index.js'),
      "module.exports = { async onLoad() { await fetch('https://blocked.example/x'); } };");
    testDb.prepare("INSERT INTO plugins (id, status, permissions, config) VALUES ('nettry','inactive','[]','{}')").run();
    // no http:outbound granted -> egress guard blocks all outbound -> onLoad throws
    await expect(new PluginRuntimeService().activate('nettry')).rejects.toThrow(/egress/);
    await new PluginRuntimeService().deactivate('nettry').catch(() => {});
  });

  it('onModuleDestroy tears down cleanly', async () => {
    await expect(new PluginRuntimeService().onModuleDestroy()).resolves.toBeUndefined();
  });
});

describe('PluginRuntimeService.update (re-consent gate)', () => {
  const fakeRegistry = (impl: () => void) =>
    ({ install: vi.fn(async () => { impl(); return { id: 'x', version: '2.0.0' }; }) }) as unknown as import('../../../src/nest/plugins/registry/registry.service').PluginRegistryService;

  const seed = (id: string, enabled: number, permissions: string[], granted: string[]) => {
    fs.mkdirSync(path.join(codeRoot, id, 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, id, 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    testDb.prepare('INSERT INTO plugins (id, status, enabled, permissions, granted_permissions, config) VALUES (?,?,?,?,?,?)')
      .run(id, enabled ? 'active' : 'inactive', enabled, JSON.stringify(permissions), JSON.stringify(granted), '{}');
  };

  it('restarts transparently when the new version requests no new permissions', async () => {
    seed('upd-same', 1, ['db:own'], ['db:own']);
    const rt = new PluginRuntimeService(fakeRegistry(() => {})); // declared perms unchanged
    await rt.activate('upd-same');
    const res = await rt.update('upd-same');
    expect(res).toMatchObject({ activated: true, newPermissions: [], newEgress: [] });
    expect(rt.isActive('upd-same')).toBe(true);
    await rt.deactivate('upd-same');
  });

  it('leaves the plugin inactive and reports the delta when new rights are requested', async () => {
    seed('upd-wider', 1, ['db:own'], ['db:own']);
    const rt = new PluginRuntimeService(
      fakeRegistry(() => {
        testDb.prepare("UPDATE plugins SET permissions = ? WHERE id = 'upd-wider'")
          .run(JSON.stringify(['db:own', 'db:read:trips', 'http:outbound:api.new.com']));
      }),
    );
    await rt.activate('upd-wider');
    const res = await rt.update('upd-wider');
    expect(res.activated).toBe(false);
    expect(res.newPermissions).toEqual(['db:read:trips']);
    expect(res.newEgress).toEqual(['api.new.com']);
    expect(rt.isActive('upd-wider')).toBe(false);
    expect(testDb.prepare("SELECT enabled FROM plugins WHERE id='upd-wider'").get()).toMatchObject({ enabled: 0 });
  });

  it('a disabled plugin stays disabled even with no new permissions', async () => {
    seed('upd-off', 0, ['db:own'], ['db:own']);
    const res = await new PluginRuntimeService(fakeRegistry(() => {})).update('upd-off');
    expect(res).toMatchObject({ activated: false, newPermissions: [], newEgress: [] });
  });

  it('throws for an unknown plugin id', async () => {
    await expect(new PluginRuntimeService(fakeRegistry(() => {})).update('ghost-upd')).rejects.toThrow(/not found/);
  });

  it('throws if no registry service is wired', async () => {
    seed('upd-noreg', 0, ['db:own'], ['db:own']);
    await expect(new PluginRuntimeService().update('upd-noreg')).rejects.toThrow(/registry service unavailable/);
  });
});

describe('PluginRuntimeService dependency gating', () => {
  const deps = (d: { requiredAddons?: string[]; pluginDependencies?: { id: string; version: string }[] }) =>
    JSON.stringify({ requiredAddons: d.requiredAddons ?? [], pluginDependencies: d.pluginDependencies ?? [] });
  const insertPlugin = (id: string, dependencies: string, enabled = 0, version = '1.0.0') =>
    testDb.prepare("INSERT INTO plugins (id, status, enabled, version, permissions, granted_permissions, config, dependencies) VALUES (?, 'inactive', ?, ?, '[]', '[]', '{}', ?)")
      .run(id, enabled, version, dependencies);
  const cleanup = (...ids: string[]) => { for (const id of ids) testDb.prepare('DELETE FROM plugins WHERE id = ?').run(id); };

  it('blocks activation when a required addon is disabled', async () => {
    testDb.prepare("INSERT OR REPLACE INTO addons (id, enabled) VALUES ('budget', 0)").run();
    insertPlugin('needs-budget', deps({ requiredAddons: ['budget'] }));
    await expect(runtime.activate('needs-budget')).rejects.toMatchObject({ code: 'ADDON_DISABLED' });
    expect((testDb.prepare('SELECT enabled FROM plugins WHERE id = ?').get('needs-budget') as { enabled: number }).enabled).toBe(0);
    cleanup('needs-budget');
  });

  it('activates once the required addon is enabled', async () => {
    testDb.prepare("INSERT OR REPLACE INTO addons (id, enabled) VALUES ('budget', 1)").run();
    insertPlugin('needs-budget2', deps({ requiredAddons: ['budget'] }));
    // No code on disk → the supervisor spawn fails, but the addon gate passed (it did
    // not throw PluginDependencyError). Assert it got past the gate to the spawn.
    await expect(runtime.activate('needs-budget2')).rejects.not.toBeInstanceOf(PluginDependencyError);
    cleanup('needs-budget2');
  });

  it('blocks activation when a plugin dependency is missing', async () => {
    insertPlugin('needs-ghost', deps({ pluginDependencies: [{ id: 'ghost', version: '*' }] }));
    await expect(runtime.activate('needs-ghost')).rejects.toMatchObject({ code: 'DEPENDENCY_MISSING' });
    cleanup('needs-ghost');
  });

  it('blocks activation when a dependency version does not satisfy the range', async () => {
    insertPlugin('dep-lib', deps({}), 1, '1.0.0');
    insertPlugin('needs-v2', deps({ pluginDependencies: [{ id: 'dep-lib', version: '>=2.0.0' }] }));
    const err = await runtime.activate('needs-v2').catch((e) => e);
    expect(err).toBeInstanceOf(PluginDependencyError);
    expect(err.detail.versionMismatch).toEqual([{ id: 'dep-lib', wanted: '>=2.0.0', installed: '1.0.0' }]);
    cleanup('needs-v2', 'dep-lib');
  });

  it('refuses a dependency cycle', async () => {
    insertPlugin('cyc-a', deps({ pluginDependencies: [{ id: 'cyc-b', version: '*' }] }));
    insertPlugin('cyc-b', deps({ pluginDependencies: [{ id: 'cyc-a', version: '*' }] }));
    await expect(runtime.activate('cyc-a')).rejects.toBeInstanceOf(DependencyCycleError);
    cleanup('cyc-a', 'cyc-b');
  });

  it('deactivateForDisabledAddon disables plugins requiring the addon and their dependents', async () => {
    insertPlugin('base-b', deps({ requiredAddons: ['budget'] }), 1);
    insertPlugin('dependent-b', deps({ pluginDependencies: [{ id: 'base-b', version: '*' }] }), 1);
    insertPlugin('unrelated-b', deps({}), 1);
    const disabled = await runtime.deactivateForDisabledAddon('budget');
    expect(disabled.sort()).toEqual(['base-b', 'dependent-b']);
    expect((testDb.prepare('SELECT enabled FROM plugins WHERE id = ?').get('base-b') as { enabled: number }).enabled).toBe(0);
    expect((testDb.prepare('SELECT enabled FROM plugins WHERE id = ?').get('unrelated-b') as { enabled: number }).enabled).toBe(1);
    cleanup('base-b', 'dependent-b', 'unrelated-b');
  });

  it('deactivateWithDependents cascades to (transitive) dependents, dependents first', async () => {
    insertPlugin('lib-x', deps({}), 1);
    insertPlugin('mid-x', deps({ pluginDependencies: [{ id: 'lib-x', version: '*' }] }), 1);
    insertPlugin('top-x', deps({ pluginDependencies: [{ id: 'mid-x', version: '*' }] }), 1);
    insertPlugin('other-x', deps({}), 1);
    const disabled = await runtime.deactivateWithDependents('lib-x');
    expect(disabled).toEqual(['top-x', 'mid-x', 'lib-x']); // deepest dependent first, root last
    for (const id of ['lib-x', 'mid-x', 'top-x']) {
      expect((testDb.prepare('SELECT enabled FROM plugins WHERE id = ?').get(id) as { enabled: number }).enabled).toBe(0);
    }
    expect((testDb.prepare('SELECT enabled FROM plugins WHERE id = ?').get('other-x') as { enabled: number }).enabled).toBe(1);
    cleanup('lib-x', 'mid-x', 'top-x', 'other-x');
  });
});

describe('PluginRuntimeService inter-plugin (exports + events)', () => {
  beforeAll(async () => {
    fs.mkdirSync(path.join(codeRoot, 'lib', 'server'), { recursive: true });
    fs.writeFileSync(
      path.join(codeRoot, 'lib', 'server', 'index.js'),
      `module.exports = {
        async onLoad(ctx) { ctx.events.emit('ping', { hi: true }); },
        exports: { async greet(args) { return { greeting: 'hi ' + (args && args.who), from: 'lib' }; } },
        routes: [],
      };`,
    );
    fs.mkdirSync(path.join(codeRoot, 'consumer', 'server'), { recursive: true });
    fs.writeFileSync(
      path.join(codeRoot, 'consumer', 'server', 'index.js'),
      `module.exports = {
        subscriptions: [{ plugin: 'lib', event: 'ping', async handler(payload, ctx) { ctx.log.info('got ping', payload); } }],
        routes: [{ method: 'GET', path: '/call', auth: false, async handler(_req, ctx) {
          const r = await ctx.plugins.call('lib', 'greet', { who: 'consumer' });
          return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) };
        } }],
      };`,
    );
    testDb.prepare("INSERT INTO plugins (id, status, version, permissions, config, capabilities, dependencies) VALUES ('lib','inactive','1.5.0','[]','{}',?,'{}')")
      .run(JSON.stringify({ provides: ['greet'], emits: ['ping'] }));
    testDb.prepare("INSERT INTO plugins (id, status, version, permissions, config, capabilities, dependencies) VALUES ('consumer','inactive','1.0.0','[]','{}','{}',?)")
      .run(JSON.stringify({ requiredAddons: [], pluginDependencies: [{ id: 'lib', version: '>=1.0.0 <2.0.0' }] }));
    await runtime.activate('lib');
    await runtime.activate('consumer');
  });
  afterAll(async () => {
    await runtime.deactivate('consumer').catch(() => {});
    await runtime.deactivate('lib').catch(() => {});
  });

  it('routes ctx.plugins.call through the host to the dependency export', async () => {
    const res = (await runtime.invoke('consumer', 'invoke.route', {
      routeId: 0,
      req: { method: 'GET', path: '/call', query: {}, body: null, user: { id: 7, username: 'x', isAdmin: false } },
    })) as { status: number; body: string };
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ greeting: 'hi consumer', from: 'lib' });
  });

  it('refuses a call from a non-dependent and to an undeclared export', async () => {
    await expect(runtime.callPlugin('lib', 'consumer', 'anything', {}, 7)).rejects.toThrow(/does not declare|not active|does not export/);
    await expect(runtime.callPlugin('consumer', 'lib', 'nope', {}, 7)).rejects.toThrow(/does not export/);
  });

  it('emitPluginEvent validates the declared event and fans out without throwing', () => {
    expect(() => runtime.emitPluginEvent('lib', 'ping', { x: 1 })).not.toThrow();
    expect(() => runtime.emitPluginEvent('lib', 'not-declared', {})).toThrow(/does not declare event/);
  });
});
