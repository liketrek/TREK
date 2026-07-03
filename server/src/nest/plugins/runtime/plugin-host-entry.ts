/**
 * The isolated plugin child bootstrap (#plugins, M1).
 *
 * Runs as a forked node process (`dist/nest/plugins/runtime/plugin-host-entry.js`)
 * with a scrubbed env — NO JWT_SECRET, NO db path, NO inherited process.env. It
 * loads the plugin's own code and turns every ctx call into an RPC message to
 * the parent, which is the only side holding real capabilities.
 *
 * MUST NOT import any privileged server module (db, config, websocket). Its only
 * imports are the pure protocol + SDK.
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import { createPluginContext, type ChildTransport, type PluginContext, type PluginDefinition } from './plugin-sdk';
import type { Envelope, RpcError } from '../protocol/envelope';

const pluginId = process.argv[2] || process.env.TREK_PLUGIN_ID || 'unknown';
const pluginDir = process.argv[3] || '';

const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let seq = 0;

function send(msg: Envelope): void {
  process.send?.(msg);
}

const transport: ChildTransport = {
  rpc(method, params) {
    return new Promise((resolve, reject) => {
      const id = `${++seq}`;
      pending.set(id, { resolve, reject });
      send({ k: 'req', id, method, params });
    });
  },
  emit(topic, data) {
    send({ k: 'evt', topic, data });
  },
};

let def: PluginDefinition | null = null;
let ctx: PluginContext | null = null;

async function boot(config: Record<string, unknown>): Promise<void> {
  try {
    // createRequire works whether this bootstrap runs as CJS (prod dist) or ESM
    // (tsx in tests), so `require` being undefined in ESM never bites us.
    const entry = path.join(pluginDir, 'server', 'index.js');
    const requirePlugin = createRequire(entry);
    const mod = requirePlugin(entry);
    def = mod && mod.default ? (mod.default as PluginDefinition) : (mod as PluginDefinition);
    ctx = createPluginContext(pluginId, config, transport);
    if (typeof def.onLoad === 'function') await def.onLoad(ctx);
    // Report the declared routes (with their index = routeId) and job ids so the
    // host can proxy HTTP and schedule jobs without re-parsing the manifest.
    const routes = (def.routes ?? []).map((r, i) => ({ i, method: r.method, path: r.path, auth: r.auth !== false }));
    const jobs = (def.jobs ?? []).map((j) => j.id);
    send({ k: 'evt', topic: 'loaded', data: { routes, jobs } });
    // An immediate first heartbeat confirms liveness without waiting a full interval.
    send({ k: 'evt', topic: 'heartbeat', data: { rss: process.memoryUsage().rss } });
  } catch (e) {
    send({ k: 'evt', topic: 'load-error', data: { message: errMsg(e), stack: errStack(e) } });
  }
}

/** Handle a host→child request: run a declared route or job with the plugin ctx. */
async function handleInvoke(req: { id: string; method: string; params: Record<string, unknown> }): Promise<void> {
  const respond = (ok: boolean, payload: unknown) =>
    send(
      ok
        ? { k: 'res', id: req.id, ok: true, result: payload }
        : { k: 'res', id: req.id, ok: false, error: { code: 'PLUGIN_ERROR', message: String(payload) } },
    );
  try {
    if (!def || !ctx) throw new Error('plugin not loaded');
    if (req.method === 'invoke.route') {
      const routeId = req.params.routeId as number;
      const route = def.routes?.[routeId];
      if (!route) throw new Error(`no route ${routeId}`);
      const pluginReq = req.params.req as Parameters<NonNullable<typeof route.handler>>[0];
      const result = await route.handler(pluginReq, ctx);
      respond(true, result);
    } else if (req.method === 'invoke.job') {
      const jobId = req.params.jobId as string;
      const job = def.jobs?.find((j) => j.id === jobId);
      if (!job) throw new Error(`no job ${jobId}`);
      await job.handler(ctx);
      respond(true, { ok: true });
    } else {
      respond(false, `unknown invoke ${req.method}`);
    }
  } catch (e) {
    respond(false, errMsg(e));
  }
}

async function shutdown(): Promise<void> {
  try {
    if (def && typeof def.onUnload === 'function' && ctx) await def.onUnload(ctx);
  } catch {
    /* best effort */
  }
  clearInterval(heartbeat);
  process.exit(0);
}

process.on('message', (raw: unknown) => {
  const msg = raw as Envelope;
  if (!msg || typeof msg !== 'object') return;
  if (msg.k === 'req') {
    // A host→child invoke (route / job).
    void handleInvoke({ id: msg.id, method: msg.method, params: (msg.params ?? {}) as Record<string, unknown> });
    return;
  }
  if (msg.k === 'res') {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) {
      p.resolve(msg.result);
    } else {
      const em = (msg as RpcError).error;
      p.reject(new Error(`${em.code}: ${em.message}`));
    }
    return;
  }
  if (msg.k === 'evt') {
    if (msg.topic === 'init') void boot(((msg.data as { config?: Record<string, unknown> })?.config) ?? {});
    else if (msg.topic === 'shutdown') void shutdown();
  }
});

// Ask the host for the init payload (instance config), then wait for it.
send({ k: 'evt', topic: 'hello', data: {} });

// Liveness — unref so it never keeps the process alive on its own.
const heartbeat = setInterval(() => {
  send({ k: 'evt', topic: 'heartbeat', data: { rss: process.memoryUsage().rss } });
}, 5000);
heartbeat.unref?.();

// A plugin that throws asynchronously must not take the host down — it only
// crashes THIS child, which the supervisor detects and restarts/disables.
process.on('uncaughtException', (e) => {
  send({ k: 'evt', topic: 'load-error', data: { message: errMsg(e), stack: errStack(e) } });
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  send({ k: 'evt', topic: 'load-error', data: { message: errMsg(e), stack: errStack(e) } });
  process.exit(1);
});

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
function errStack(e: unknown): string | undefined {
  return e instanceof Error ? e.stack : undefined;
}
