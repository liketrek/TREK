/**
 * End-to-end proof of the isolated plugin runtime (#plugins, M1). Forks a REAL
 * child process, loads a fixture plugin, and verifies:
 *   - onLoad runs isolated and its ctx.db round-trips through RPC to the host,
 *   - an ungranted capability is refused across the fork boundary,
 *   - a plugin that throws in onLoad fails activation without touching the host,
 *   - disable() tears the child down.
 * The child runs its own process — its crash/throw can never reach this test.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PluginSupervisor, type SupervisorHooks, type SupervisorTuning } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { PluginRpcHost, type HostDeps } from '../../../src/nest/plugins/host/rpc-host';
import { PluginDataDb } from '../../../src/nest/plugins/host/plugin-data.service';

let codeRoot: string;
let dataRoot: string;
let sup: PluginSupervisor;

const broadcasts: unknown[] = [];

function writePlugin(id: string, source: string): void {
  const dir = path.join(codeRoot, id, 'server');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.js'), source);
}

function makeSupervisor(events: Array<{ topic: string; data: unknown }>, tuning: SupervisorTuning = {}): PluginSupervisor {
  const createRpcHost = (id: string, granted: ReadonlySet<string>): PluginRpcHost => {
    const deps: HostDeps = {
      data: new PluginDataDb(id),
      db: { prepare: () => ({ all: () => [], get: () => null }) },
      canAccessTrip: () => undefined,
      broadcastToTrip: (tripId, event, payload) => broadcasts.push({ tripId, event, payload }),
      broadcastToUser: () => {},
    };
    return new PluginRpcHost(id, granted, deps);
  };
  const hooks: SupervisorHooks = {
    onEvent: (_id, topic, data) => events.push({ topic, data }),
    onLog: (_id, level, msg) => events.push({ topic: '__log', data: { level, msg } }),
  };
  return new PluginSupervisor(createRpcHost, hooks, tuning);
}

beforeAll(() => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-pdata-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
});
afterAll(async () => {
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(codeRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});
afterEach(async () => {
  await sup?.shutdownAll();
});

describe('PluginSupervisor — isolated runtime', () => {
  it('loads a plugin in a child process: ctx.db round-trips and an ungranted capability is denied', async () => {
    const events: Array<{ topic: string; data: unknown }> = [];
    sup = makeSupervisor(events);

    writePlugin(
      'hello',
      `module.exports = {
        async onLoad(ctx) {
          await ctx.db.migrate('001', 'CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT)');
          await ctx.db.exec('INSERT INTO kv (k, v) VALUES (?, ?)', ['greeting', ctx.config.greeting || 'none']);
          const rows = await ctx.db.query('SELECT v FROM kv WHERE k = ?', 'greeting');
          let tripsDenied = false;
          try { await ctx.trips.getById(1, 42); } catch (e) { tripsDenied = /PERMISSION_DENIED/.test(e.message); }
          ctx.log.info('selftest complete');
          process.send({ k: 'evt', topic: 'diag', data: { value: rows[0] && rows[0].v, tripsDenied } });
        }
      };`,
    );

    await sup.activate('hello', new Set(['db:own']), { greeting: 'hi there' });
    expect(sup.isActive('hello')).toBe(true);

    const diag = events.find((e) => e.topic === 'diag')?.data as { value: string; tripsDenied: boolean };
    expect(diag).toBeTruthy();
    expect(diag.value).toBe('hi there'); // instance config reached the child, db round-trip worked
    expect(diag.tripsDenied).toBe(true); // ungranted db:read:trips was refused across the fork boundary
    // the plugin's ctx.log surfaced through the supervisor's log hook
    expect(events.some((e) => e.topic === '__log')).toBe(true);
  });

  it('injects require(trek-plugin-sdk) — a scaffold-style plugin loads with no node_modules', async () => {
    const events: Array<{ topic: string; data: unknown }> = [];
    sup = makeSupervisor(events);

    writePlugin(
      'scaffolded',
      `const { definePlugin, PLUGIN_API_VERSION } = require('trek-plugin-sdk');
      let testingError = '';
      try { require('trek-plugin-sdk/testing'); } catch (e) { testingError = e.message; }
      module.exports = definePlugin({
        async onLoad() {
          process.send({ k: 'evt', topic: 'diag', data: { api: PLUGIN_API_VERSION, fn: typeof definePlugin, testingError } });
        },
        routes: [{ method: 'GET', path: '/hello', auth: true, async handler() { return { status: 200 }; } }],
      });`,
    );

    await sup.activate('scaffolded', new Set(['db:own']), {});
    expect(sup.isActive('scaffolded')).toBe(true);

    const diag = events.find((e) => e.topic === 'diag')?.data as { api: number; fn: string; testingError: string };
    expect(diag).toBeTruthy();
    expect(diag.api).toBe(1); // the injected shim, not a vendored copy
    expect(diag.fn).toBe('function');
    expect(diag.testingError).toMatch(/build\/test-time/); // subpaths fail with a pointed message
  });

  it('a plugin that throws in onLoad fails activation and is marked error — the host survives', async () => {
    const events: Array<{ topic: string; data: unknown }> = [];
    sup = makeSupervisor(events);
    writePlugin('boom', `module.exports = { async onLoad() { throw new Error('kaboom'); } };`);

    await expect(sup.activate('boom', new Set(['db:own']), {})).rejects.toThrow(/kaboom/);
    expect(sup.isActive('boom')).toBe(false);
    expect(sup.statusOf('boom')).toBe('error');
  });

  it('disable() stops a running plugin', async () => {
    sup = makeSupervisor([]);
    writePlugin('stopme', `module.exports = { async onLoad() {} };`);
    await sup.activate('stopme', new Set(), {});
    expect(sup.isActive('stopme')).toBe(true);
    await sup.disable('stopme');
    expect(sup.isActive('stopme')).toBe(false);
  });

  it('auto-disables a plugin that keeps crashing (backoff + crash limit)', async () => {
    sup = makeSupervisor([], { crashLimit: 3, backoffCapMs: 5, crashWindowMs: 60_000 });
    // Exits during onLoad every time -> never reaches "loaded" -> crash loop.
    writePlugin('crasher', `module.exports = { async onLoad() { process.exit(1); } };`);
    await expect(sup.activate('crasher', new Set(), {})).rejects.toThrow(/crashed repeatedly/);
    expect(sup.statusOf('crasher')).toBe('error');
  });

  it('reaps a plugin that stops sending heartbeats', async () => {
    // heartbeatTimeoutMs -1 => any active plugin is "stale"; crashLimit 1 => reap = terminal error.
    sup = makeSupervisor([], { heartbeatTimeoutMs: -1, crashLimit: 1, crashWindowMs: 60_000 });
    writePlugin('idle', `module.exports = { async onLoad() {} };`);
    await sup.activate('idle', new Set(), {});
    expect(sup.isActive('idle')).toBe(true);

    sup.reapStale(); // manual tick — kills the stale child
    await new Promise((r) => setTimeout(r, 400)); // let SIGKILL -> exit -> onCrash settle
    expect(sup.statusOf('idle')).toBe('error');
  });

  it('force-kills a plugin that ignores shutdown (kill grace)', async () => {
    sup = makeSupervisor([], { killGraceMs: 60 });
    // onUnload blocks forever -> shutdown never completes -> SIGKILL after the grace.
    writePlugin('sticky', `module.exports = { async onLoad() {}, async onUnload() { while (true) {} } };`);
    await sup.activate('sticky', new Set(), {});
    await sup.disable('sticky'); // resolves via the kill-grace SIGKILL path
    expect(sup.isActive('sticky')).toBe(false);
  });
});
