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
    id TEXT PRIMARY KEY, status TEXT, permissions TEXT DEFAULT '[]', granted_permissions TEXT DEFAULT '[]',
    config TEXT DEFAULT '{}', last_error TEXT, updated_at TEXT);
    CREATE TABLE plugin_error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, level TEXT, message TEXT, ts TEXT);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, scope TEXT, secret INTEGER);`);
  return { testDb: db };
});
vi.mock('../../../src/db/database', () => ({ db: testDb, canAccessTrip: () => undefined }));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';

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

  testDb.prepare("INSERT INTO plugins (id, status, granted_permissions, config) VALUES ('counter','active','[\"db:own\"]','{}')").run();
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

  it('onModuleInit is a no-op when the runtime is disabled', () => {
    process.env.TREK_PLUGINS_ENABLED = 'false';
    expect(() => new PluginRuntimeService().onModuleInit()).not.toThrow();
    process.env.TREK_PLUGINS_ENABLED = 'true';
  });

  it('deactivate stops the plugin and marks it inactive', async () => {
    await runtime.deactivate('counter');
    expect(runtime.isActive('counter')).toBe(false);
    const row = testDb.prepare("SELECT status FROM plugins WHERE id = 'counter'").get() as { status: string };
    expect(row.status).toBe('inactive');
  });

  it('tolerates malformed granted_permissions / config JSON on activate', async () => {
    fs.mkdirSync(path.join(codeRoot, 'messy', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'messy', 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    testDb.prepare("INSERT INTO plugins (id, status, granted_permissions, config) VALUES ('messy','inactive','not-json','not-json')").run();
    const rt = new PluginRuntimeService();
    await rt.activate('messy'); // must not throw despite the garbage JSON
    expect(rt.isActive('messy')).toBe(true);
    await rt.deactivate('messy');
  });

  it('onModuleInit boots plugins that are active in the DB', async () => {
    fs.mkdirSync(path.join(codeRoot, 'booter', 'server'), { recursive: true });
    fs.writeFileSync(path.join(codeRoot, 'booter', 'server', 'index.js'), 'module.exports = { async onLoad() {} };');
    testDb.prepare("INSERT INTO plugins (id, status, granted_permissions, config) VALUES ('booter','active','[]','{}')").run();

    const rt = new PluginRuntimeService();
    rt.onModuleInit(); // fire-and-forget spawn
    for (let i = 0; i < 40 && !rt.isActive('booter'); i++) await new Promise((r) => setTimeout(r, 50));
    expect(rt.isActive('booter')).toBe(true);
    await rt.deactivate('booter');
  });

  it('onModuleDestroy tears down cleanly', async () => {
    await expect(new PluginRuntimeService().onModuleDestroy()).resolves.toBeUndefined();
  });
});
