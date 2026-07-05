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
    onLog: (_id, level, msg, meta) => events.push({ topic: '__log', data: { level, msg, meta } }),
  };
  return new PluginSupervisor(createRpcHost, hooks, tuning);
}

/**
 * Pull the `meta` of a named `ctx.log.info(msg, meta)` call. Fixtures report
 * structured diagnostics this way now that the child's raw `process.send` is
 * sealed off (installIpcGuard) — the SDK log channel is the only route out.
 */
function logMeta<T = Record<string, unknown>>(events: Array<{ topic: string; data: unknown }>, msg: string): T {
  const hit = events.find((e) => e.topic === '__log' && (e.data as { msg?: string }).msg === msg);
  return (hit && (hit.data as { meta?: unknown }).meta) as T;
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
          ctx.log.info('diag', { value: rows[0] && rows[0].v, tripsDenied });
        }
      };`,
    );

    await sup.activate('hello', new Set(['db:own']), { greeting: 'hi there' });
    expect(sup.isActive('hello')).toBe(true);

    const diag = logMeta<{ value: string; tripsDenied: boolean }>(events, 'diag');
    expect(diag).toBeTruthy();
    expect(diag.value).toBe('hi there'); // instance config reached the child, db round-trip worked
    expect(diag.tripsDenied).toBe(true); // ungranted db:read:trips was refused across the fork boundary
    // the plugin's ctx.log surfaced through the supervisor's log hook
    expect(events.some((e) => e.topic === '__log')).toBe(true);
  });

  it('dispatches invoke.hook + invoke.event across the fork (provider hooks + event subscriptions)', async () => {
    const events: Array<{ topic: string; data: unknown }> = [];
    sup = makeSupervisor(events);
    writePlugin(
      'provider',
      `module.exports = {
        hooks: {
          placeDetailProvider: { async getDetails(placeId, ctx) { return [{ label: 'placeId', value: String(placeId) }]; } },
        },
        events: [
          { on: 'place:created', async handler(e, ctx) { ctx.log.info('got-event', e); } },
          { on: 'other:thing', handler() { throw new Error('non-matching subscription must not run'); } },
        ],
      };`,
    );
    await sup.activate('provider', new Set(['hook:place-detail-provider', 'events:subscribe']), {});

    // host->plugin hook: the child runs getDetails(7, ctx) and returns its result
    const hookRes = await sup.invoke('provider', 'invoke.hook', { hook: 'placeDetailProvider', fn: 'getDetails', args: [7] }, { actingUserId: 5 });
    expect(hookRes).toEqual([{ label: 'placeId', value: '7' }]);

    // host->plugin event: ONLY the matching subscription runs (the 'other:thing' one throws if hit)
    await sup.invoke('provider', 'invoke.event', { event: 'place:created', tripId: 3 }, { actingUserId: undefined });
    const got = logMeta<{ event: string; tripId: number }>(events, 'got-event');
    expect(got).toEqual({ event: 'place:created', tripId: 3 });
  });

  it('seals the raw IPC surface: a plugin cannot forge/sniff over process.send/on(message), and a forged init cannot reopen egress', async () => {
    const events: Array<{ topic: string; data: unknown }> = [];
    sup = makeSupervisor(events);

    // The plugin runs each raw-IPC attack in try/catch and reports the outcome
    // over the ONLY channel it still has — the SDK log (ctx.log → realSend).
    // No egress is granted, so a fetch to an undeclared host must fail with an
    // `egress:` error; if a forged `init` reopened egress, the second fetch would
    // instead fail with a network error (or succeed) — that is the discriminator.
    writePlugin(
      'attacker',
      `module.exports = {
        async onLoad(ctx) {
          const results = {};
          const probe = (name, fn) => { try { fn(); results[name] = 'NOT_BLOCKED'; } catch { results[name] = 'blocked'; } };
          probe('send_evt', () => process.send({ k: 'evt', topic: 'loaded', data: { routes: [{ i: 0, method: 'GET', path: '/pwned', auth: false }] } }));
          probe('on_message', () => process.on('message', () => {}));
          probe('once_message', () => process.once('message', () => {}));
          probe('prepend_message', () => process.prependListener('message', () => {}));
          probe('removeAll_message', () => process.removeAllListeners('message'));
          probe('removeAll_bare', () => process.removeAllListeners());
          probe('forged_req', () => process.send({ k: 'req', method: 'trips.getById', params: { tripId: 1, _inv: 'forged' } }));
          probe('disconnect', () => process.disconnect());

          const fetchOutcome = async () => {
            try { await fetch('https://blocked.example/x'); return 'NO_ERROR'; }
            catch (e) { return /egress/.test(e.message) ? 'egress' : 'other'; }
          };
          const egressBefore = await fetchOutcome();
          // process.emit is intentionally NOT sealed (Node delivers inbound IPC
          // through it); the one-shot init guard must make this forged init a no-op.
          let emitThrew = false;
          try { process.emit('message', { k: 'evt', topic: 'init', data: { egress: ['*'] } }); }
          catch { emitThrew = true; }
          const egressAfter = await fetchOutcome();

          // the legit SDK channel must still round-trip through the captured realSend
          const legit = await ctx.db.query('SELECT 1 AS ok');

          ctx.log.info('attacks', { results, egressBefore, egressAfter, emitThrew, legit: legit[0] && legit[0].ok });
        },
      };`,
    );

    await sup.activate('attacker', new Set(['db:own']), {});
    // Sealing the IPC surface must NOT prevent a benign plugin from loading.
    expect(sup.isActive('attacker')).toBe(true);

    const a = logMeta<{
      results: Record<string, string>;
      egressBefore: string;
      egressAfter: string;
      emitThrew: boolean;
      legit: number;
    }>(events, 'attacks');
    expect(a).toBeTruthy();

    // Every raw-IPC operation is blocked.
    expect(a.results.send_evt).toBe('blocked'); // can't forge lifecycle/evt envelopes
    expect(a.results.on_message).toBe('blocked'); // can't add a 'message' listener to eavesdrop
    expect(a.results.once_message).toBe('blocked');
    expect(a.results.prepend_message).toBe('blocked');
    expect(a.results.removeAll_message).toBe('blocked'); // can't unhook the trusted handler
    expect(a.results.removeAll_bare).toBe('blocked');
    expect(a.results.forged_req).toBe('blocked'); // can't forge a req with someone else's _inv
    expect(a.results.disconnect).toBe('blocked');

    // The forged `init` (via the un-sealed process.emit) is a no-op: egress stays sealed.
    expect(a.egressBefore).toBe('egress');
    expect(a.egressAfter).toBe('egress');
    expect(a.emitThrew).toBe(false);

    // The legitimate transport still works — the seal (incl. the channel lock)
    // did not break realSend.
    expect(a.legit).toBe(1);

    // The host never registered the forged route table (the real plugin declares none).
    expect(sup.routesOf('attacker').some((r) => r.path === '/pwned')).toBe(false);
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
        async onLoad(ctx) {
          ctx.log.info('diag', { api: PLUGIN_API_VERSION, fn: typeof definePlugin, testingError });
        },
        routes: [{ method: 'GET', path: '/hello', auth: true, async handler() { return { status: 200 }; } }],
      });`,
    );

    await sup.activate('scaffolded', new Set(['db:own']), {});
    expect(sup.isActive('scaffolded')).toBe(true);

    const diag = logMeta<{ api: number; fn: string; testingError: string }>(events, 'diag');
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
