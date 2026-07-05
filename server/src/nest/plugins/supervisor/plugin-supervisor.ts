import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fork, type ChildProcess } from 'node:child_process';
import { resolveChildEntry, pluginCodeDir, pluginRealCodeDir, pluginPermissionArgs, ensurePluginModuleType } from '../paths';
import type { Envelope, RpcError, RpcRequest } from '../protocol/envelope';
import type { PluginRpcHost } from '../host/rpc-host';

export interface PluginRouteInfo {
  i: number;
  method: string;
  path: string;
  auth: boolean;
}

/**
 * Owns the lifecycle of every running plugin child (#plugins, M1): spawn on
 * activate, route RPC between the child and its capability host, watch
 * heartbeats, and restart-with-backoff / auto-disable on crashes. A child dying
 * — segfault, throw, OOM, infinite loop — only ever kills the child; the Nest
 * event loop never hiccups. That is what finally makes "a plugin can't crash
 * TREK" true.
 */

export type PluginStatus = 'starting' | 'active' | 'error' | 'stopped';

export interface SupervisorHooks {
  onStatus?(id: string, status: PluginStatus, error?: string): void;
  onLog?(id: string, level: string, msg: string, meta?: unknown): void;
  /** Any non-lifecycle event the child emits (e.g. a plugin's own signals). */
  onEvent?(id: string, topic: string, data: unknown): void;
}

interface Pending {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface Supervised {
  id: string;
  granted: ReadonlySet<string>;
  config: Record<string, unknown>;
  egress: string[];
  rpcHost: PluginRpcHost;
  child: ChildProcess | null;
  status: PluginStatus;
  crashes: number[]; // crash timestamps (ms)
  lastBeat: number;
  lastRss: number; // last reported resident set size (bytes)
  routes: PluginRouteInfo[];
  jobs: string[];
  hooks: string[]; // provider hooks the plugin implements (e.g. 'placeDetailProvider')
  events: string[]; // core events the plugin subscribes to (names or '*')
  exports: string[]; // functions the plugin exposes to dependents (ctx.plugins.call)
  subscriptions: Array<{ plugin: string; event: string }>; // other-plugin events it listens to
  pending: Map<string, Pending>; // host→child invokes awaiting a response
  invocations: Map<string, number | undefined>; // reqId -> acting user of that invoke (undefined = no user, e.g. a job)
  activation?: { resolve: () => void; reject: (e: Error) => void };
  activationTimer?: ReturnType<typeof setTimeout>; // deadline for the plugin to reach 'active'
}

export interface SupervisorTuning {
  heartbeatTimeoutMs?: number;
  crashWindowMs?: number;
  crashLimit?: number;
  backoffCapMs?: number;
  killGraceMs?: number;
  maxRssBytes?: number;
  activationTimeoutMs?: number;
}

const DEFAULTS: Required<SupervisorTuning> = {
  heartbeatTimeoutMs: 20_000, // 3–4 missed 5s beats
  crashWindowMs: 5 * 60_000,
  crashLimit: 5,
  backoffCapMs: 30_000,
  killGraceMs: 3000,
  // A plugin that never reaches 'loaded' (e.g. a synchronous infinite loop in
  // onLoad) must not hang the admin's activate() forever nor peg a core unreaped.
  activationTimeoutMs: 30_000,
  // Hard RSS ceiling — the real memory cap. --max-old-space-size only bounds the
  // V8 heap; Buffers/ArrayBuffers/native allocations sail past it, so a plugin
  // could OOM the box while staying "under" the heap limit. Overridable via env.
  maxRssBytes: (Number(process.env.TREK_PLUGIN_MAX_RSS_MB) || 300) * 1024 * 1024,
};

// A plugin may only act as a provider for a hook it BOTH implements (reported by
// the child at load) AND was granted the matching hook:* permission for. The child
// reports Object.keys(def.hooks) with no knowledge of grants, so the grant check
// must happen host-side here — otherwise the hook:* consent is never enforced.
const HOOK_PERMISSION: Readonly<Record<string, string>> = {
  photoProvider: 'hook:photo-provider',
  calendarSource: 'hook:calendar-source',
  placeDetailProvider: 'hook:place-detail-provider',
  warningProvider: 'hook:trip-warning-provider',
};

export class PluginSupervisor {
  private running = new Map<string, Supervised>();
  private sweep: ReturnType<typeof setInterval> | null = null;
  private readonly tuning: Required<SupervisorTuning>;

  constructor(
    private readonly createRpcHost: (id: string, granted: ReadonlySet<string>) => PluginRpcHost,
    private readonly hooks: SupervisorHooks = {},
    tuning: SupervisorTuning = {},
  ) {
    this.tuning = { ...DEFAULTS, ...tuning };
  }

  /** Spawn a plugin and resolve once it reports `loaded` (or reject on load error). */
  activate(id: string, granted: ReadonlySet<string>, config: Record<string, unknown> = {}, egress: string[] = []): Promise<void> {
    if (this.running.has(id)) return Promise.resolve();
    const sup: Supervised = {
      id,
      granted,
      config,
      egress,
      rpcHost: this.createRpcHost(id, granted),
      child: null,
      status: 'starting',
      crashes: [],
      lastBeat: Date.now(),
      lastRss: 0,
      routes: [],
      jobs: [],
      hooks: [],
      events: [],
      exports: [],
      subscriptions: [],
      pending: new Map(),
      invocations: new Map(),
    };
    this.running.set(id, sup);
    this.ensureSweep();
    return new Promise<void>((resolve, reject) => {
      sup.activation = { resolve, reject };
      // Deadline: if the plugin never reports 'loaded' (stuck onLoad), reject the
      // activation and kill the child rather than hanging + leaking a busy core.
      sup.activationTimer = setTimeout(async () => {
        if (sup.status === 'active') return;
        this.hooks.onLog?.(sup.id, 'error', 'activation timed out; killing');
        this.setStatus(sup, 'error', 'activation timed out');
        sup.activation?.reject(new Error('plugin did not finish loading in time'));
        sup.activation = undefined;
        this.running.delete(sup.id);
        // await the kill (SIGTERM grace) before closing the plugin db, so a ctx.*
        // RPC from the dying child can't hit an already-disposed handle.
        await this.kill(sup);
        sup.rpcHost.dispose();
      }, this.tuning.activationTimeoutMs);
      sup.activationTimer.unref?.();
      this.spawn(sup);
    });
  }

  private clearActivationTimer(sup: Supervised): void {
    if (sup.activationTimer) {
      clearTimeout(sup.activationTimer);
      sup.activationTimer = undefined;
    }
  }

  /** Stop a plugin: ask it to unload, then kill. Idempotent. */
  async disable(id: string): Promise<void> {
    const sup = this.running.get(id);
    if (!sup) return;
    this.running.delete(id);
    this.clearActivationTimer(sup);
    this.setStatus(sup, 'stopped');
    await this.kill(sup);
    sup.rpcHost.dispose();
  }

  isActive(id: string): boolean {
    return this.running.get(id)?.status === 'active';
  }
  statusOf(id: string): PluginStatus | null {
    return this.running.get(id)?.status ?? null;
  }
  /** The plugin's declared HTTP routes (populated once it reports `loaded`). */
  routesOf(id: string): PluginRouteInfo[] {
    return this.running.get(id)?.routes ?? [];
  }

  /**
   * Ids of ACTIVE plugins that may act as a given provider hook — they implement it
   * (reported at load) AND hold the matching hook:* grant the admin consented to.
   * An unknown hook, or one with no permission mapping, resolves to nobody.
   */
  providersOf(hook: string): string[] {
    const perm = HOOK_PERMISSION[hook];
    if (!perm) return [];
    const out: string[] = [];
    for (const [id, sup] of this.running) {
      if (sup.status === 'active' && sup.hooks.includes(hook) && sup.granted.has(perm)) out.push(id);
    }
    return out;
  }

  /** Callable export names an ACTIVE plugin reported at load (ctx.plugins.call target). */
  exportsOf(id: string): string[] {
    const sup = this.running.get(id);
    return sup && sup.status === 'active' ? sup.exports : [];
  }

  /** Ids of ACTIVE plugins that subscribed to `event` emitted by `sourceId`. */
  subscribersOf(sourceId: string, event: string): string[] {
    const out: string[] = [];
    for (const [id, sup] of this.running) {
      if (sup.status === 'active' && sup.subscriptions.some((s) => s.plugin === sourceId && s.event === event)) out.push(id);
    }
    return out;
  }

  /**
   * Announce a core event to every plugin that subscribed to it (or to '*') AND holds
   * the 'events:subscribe' grant. Fire-and-forget: the invoke is NOT awaited (a core
   * broadcast must never block on a plugin) and carries no user (trip reads refused).
   * Only the event name + tripId are sent — never the payload.
   */
  deliverEvent(tripId: number, event: string): void {
    for (const [id, sup] of this.running) {
      if (sup.status !== 'active' || !sup.granted.has('events:subscribe')) continue;
      if (!sup.events.includes(event) && !sup.events.includes('*')) continue;
      this.invoke(id, 'invoke.event', { event, tripId }, { actingUserId: undefined, timeoutMs: 5000 }).catch(() => {
        /* a subscriber that errors or times out is ignored — events are best-effort */
      });
    }
  }

  /**
   * Send a host→child request (invoke a route or job) and await its response.
   * `actingUserId` binds the authenticated user of this invocation on the HOST
   * side: any trip read the child makes while handling it is membership-checked
   * against THIS user, never against an id the plugin passes. A job carries no
   * user (undefined) and therefore cannot read user-scoped data.
   */
  invoke(
    id: string,
    method: string,
    params: Record<string, unknown>,
    opts: { timeoutMs?: number; actingUserId?: number } = {},
  ): Promise<unknown> {
    const { timeoutMs = 30_000, actingUserId } = opts;
    const sup = this.running.get(id);
    if (!sup || sup.status !== 'active' || !sup.child) {
      return Promise.reject(new Error(`plugin ${id} is not active`));
    }
    return new Promise((resolve, reject) => {
      const reqId = randomUUID();
      const timer = setTimeout(() => {
        sup.pending.delete(reqId);
        sup.invocations.delete(reqId);
        reject(new Error('plugin invoke timed out'));
      }, timeoutMs);
      timer.unref?.();
      sup.pending.set(reqId, { resolve, reject, timer });
      // The child echoes this reqId as `_inv` on its trip reads; the host resolves
      // the acting user from here, so the plugin cannot name an arbitrary user.
      sup.invocations.set(reqId, actingUserId);
      sup.child!.send({ k: 'req', id: reqId, method, params: { ...params, _inv: reqId } } satisfies Envelope);
    });
  }

  async shutdownAll(): Promise<void> {
    if (this.sweep) clearInterval(this.sweep);
    this.sweep = null;
    const all = [...this.running.values()];
    await Promise.all(all.map((s) => this.kill(s)));
    for (const s of all) s.rpcHost.dispose();
    this.running.clear();
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private spawn(sup: Supervised): void {
    const { entry, execArgv, forkCwd, jsMode } = resolveChildEntry();
    // Prod (compiled) children get the OS permission model — a real kernel-level
    // fs/child_process/native jail on top of the env scrub and RPC boundary.
    // Use the plugin's REAL path + ensure it has a package.json so the sandboxed
    // child can resolve its own module type without a broad read grant.
    const codeDir = jsMode ? pluginRealCodeDir(sup.id) : pluginCodeDir(sup.id);
    if (jsMode) ensurePluginModuleType(codeDir);
    const argv = jsMode ? [...execArgv, ...pluginPermissionArgs(sup.id)] : execArgv;
    const child = fork(entry, [sup.id, codeDir], {
      cwd: forkCwd ?? codeDir,
      execArgv: argv,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      // Whitelist env — nothing inherited. No JWT_SECRET, no DB creds, no PATH-leaked secrets.
      env: {
        NODE_ENV: process.env.NODE_ENV ?? 'production',
        TZ: process.env.TZ ?? '',
        PATH: process.env.PATH ?? '',
        TREK_PLUGIN_ID: sup.id,
      },
    });
    sup.child = child;
    sup.lastBeat = Date.now();

    child.on('message', (raw: unknown) => this.onMessage(sup, raw as Envelope));
    child.on('exit', (code, signal) => this.onExit(sup, code, signal));
    child.on('error', (e) => this.hooks.onLog?.(sup.id, 'error', `child error: ${e.message}`));
    child.stdout?.on('data', (b) => this.hooks.onLog?.(sup.id, 'info', String(b).trimEnd()));
    child.stderr?.on('data', (b) => this.hooks.onLog?.(sup.id, 'error', String(b).trimEnd()));
  }

  private async onMessage(sup: Supervised, msg: Envelope): Promise<void> {
    if (!msg || typeof msg !== 'object') return;

    if (msg.k === 'req') {
      // A ctx.* call from the plugin — dispatch through its capability host. The
      // acting user comes from the invocation the child is currently handling
      // (its `_inv` reqId → our invocation map), NOT from anything the plugin can
      // set in the call params.
      const inv = (msg as RpcRequest).params as { _inv?: unknown } | undefined;
      const actingUserId = typeof inv?._inv === 'string' ? sup.invocations.get(inv._inv) : undefined;
      const res = await sup.rpcHost.dispatch(msg as RpcRequest, actingUserId);
      sup.child?.send(res);
      return;
    }

    if (msg.k === 'res') {
      // A response to a host→child invoke (route/job).
      const p = sup.pending.get(msg.id);
      if (!p) return;
      sup.pending.delete(msg.id);
      sup.invocations.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error((msg as RpcError).error.message));
      return;
    }

    if (msg.k === 'evt') {
      switch (msg.topic) {
        case 'hello':
          sup.child?.send({ k: 'evt', topic: 'init', data: { config: sup.config, egress: sup.egress } } satisfies Envelope);
          break;
        case 'heartbeat': {
          sup.lastBeat = Date.now();
          const rss = (msg.data as { rss?: number })?.rss;
          if (typeof rss === 'number') sup.lastRss = rss;
          break;
        }
        case 'loaded': {
          // Ignore a duplicate/forged `loaded` after activation — a plugin must
          // not be able to re-register its route table once it is live.
          if (sup.status === 'active') break;
          sup.lastBeat = Date.now();
          const d = msg.data as {
            routes?: PluginRouteInfo[]; jobs?: string[]; hooks?: string[]; events?: string[];
            exports?: string[]; subscriptions?: Array<{ plugin: string; event: string }>;
          };
          sup.routes = d.routes ?? [];
          sup.jobs = d.jobs ?? [];
          sup.hooks = d.hooks ?? [];
          sup.events = d.events ?? [];
          sup.exports = Array.isArray(d.exports) ? d.exports.filter((e): e is string => typeof e === 'string') : [];
          sup.subscriptions = Array.isArray(d.subscriptions)
            ? d.subscriptions.filter((s): s is { plugin: string; event: string } => !!s && typeof s.plugin === 'string' && typeof s.event === 'string')
            : [];
          this.clearActivationTimer(sup);
          this.setStatus(sup, 'active');
          sup.activation?.resolve();
          sup.activation = undefined;
          break;
        }
        case 'load-error': {
          const message = (msg.data as { message?: string })?.message || 'plugin load failed';
          this.clearActivationTimer(sup);
          this.setStatus(sup, 'error', message);
          sup.activation?.reject(new Error(message));
          sup.activation = undefined;
          await this.kill(sup);
          sup.rpcHost.dispose();
          break;
        }
        case 'log': {
          const d = msg.data as { level?: string; msg?: string; meta?: unknown };
          this.hooks.onLog?.(sup.id, d.level || 'info', d.msg || '', d.meta);
          break;
        }
        default:
          // Strict inbound whitelist: the legitimate child→host `evt` topics all
          // have explicit cases above. Anything else is a compromised/buggy child
          // (or, historically, code that reached the raw channel) — drop it rather
          // than forward it blindly. `onEvent` stays on SupervisorHooks, reserved
          // for a future SDK-sanctioned custom-event channel, but is not invoked
          // for arbitrary topics.
          this.hooks.onLog?.(sup.id, 'warn', `dropped unknown plugin event topic: ${msg.topic}`);
      }
    }
  }

  private rejectPending(sup: Supervised, reason: string): void {
    for (const p of sup.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    sup.pending.clear();
    sup.invocations.clear();
  }

  private onExit(sup: Supervised, code: number | null, signal: string | null): void {
    sup.child = null;
    // In-flight host→child invokes can never complete now.
    this.rejectPending(sup, 'plugin exited');
    // A clean stop we asked for isn't a crash.
    if (sup.status === 'stopped' || sup.status === 'error') return;
    if (!this.running.has(sup.id)) return;

    sup.crashes.push(Date.now());
    const recent = sup.crashes.filter((t) => t > Date.now() - this.tuning.crashWindowMs);
    if (recent.length >= this.tuning.crashLimit) {
      this.clearActivationTimer(sup);
      this.setStatus(sup, 'error', `auto-disabled after ${recent.length} crashes`);
      sup.activation?.reject(new Error('plugin crashed repeatedly'));
      sup.activation = undefined;
      sup.rpcHost.dispose();
      return;
    }
    const delay = Math.min(this.tuning.backoffCapMs, 1000 * 2 ** (recent.length - 1));
    this.hooks.onLog?.(sup.id, 'warn', `crashed (code=${code} sig=${signal}); restarting in ${delay}ms`);
    this.setStatus(sup, 'starting');
    const timer = setTimeout(() => {
      if (this.running.has(sup.id)) this.spawn(sup);
    }, delay);
    timer.unref?.();
  }

  private ensureSweep(): void {
    if (this.sweep) return;
    this.sweep = setInterval(() => this.reapStale(), 5000);
    this.sweep.unref?.();
  }

  /**
   * Kill any active plugin that has stopped sending heartbeats OR blown its RSS
   * ceiling (drives the crash/backoff path, so a repeat offender auto-disables).
   */
  reapStale(now = Date.now()): void {
    for (const sup of this.running.values()) {
      if (sup.status !== 'active') continue;
      const rss = this.childRss(sup);
      if (now - sup.lastBeat > this.tuning.heartbeatTimeoutMs) {
        this.hooks.onLog?.(sup.id, 'warn', 'missed heartbeats; killing');
        sup.child?.kill('SIGKILL');
      } else if (rss > this.tuning.maxRssBytes) {
        this.hooks.onLog?.(
          sup.id,
          'warn',
          `exceeded memory ceiling (${Math.round(rss / 1048576)}MB > ${Math.round(this.tuning.maxRssBytes / 1048576)}MB); killing`,
        );
        sup.child?.kill('SIGKILL');
      }
    }
  }

  /**
   * Resident memory of the child, measured HOST-side from the OS — never trusting
   * the child's self-reported heartbeat rss (a malicious plugin can spoof it).
   * On Linux (prod runs in a Linux container) this reads /proc/<pid>/statm; where
   * that isn't available (dev on win/mac) it falls back to the reported value.
   */
  private childRss(sup: Supervised): number {
    const pid = sup.child?.pid;
    if (pid) {
      try {
        // VmRSS is reported in kB and is page-size-independent (statm pages would
        // undercount on 16K/64K-page kernels, loosening the cap).
        const m = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^VmRSS:\s+(\d+)\s+kB/m);
        if (m) return Number(m[1]) * 1024;
      } catch {
        /* not Linux / process gone — fall back */
      }
    }
    return sup.lastRss;
  }

  private async kill(sup: Supervised): Promise<void> {
    const child = sup.child;
    if (!child) return;
    sup.child = null;
    child.send?.({ k: 'evt', topic: 'shutdown', data: {} } satisfies Envelope);
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, this.tuning.killGraceMs);
      t.unref?.();
      child.once('exit', () => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  private setStatus(sup: Supervised, status: PluginStatus, error?: string): void {
    sup.status = status;
    this.hooks.onStatus?.(sup.id, status, error);
  }
}
