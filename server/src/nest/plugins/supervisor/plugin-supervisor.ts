import { randomUUID } from 'node:crypto';
import { fork, type ChildProcess } from 'node:child_process';
import { resolveChildEntry, pluginCodeDir } from '../paths';
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
  rpcHost: PluginRpcHost;
  child: ChildProcess | null;
  status: PluginStatus;
  crashes: number[]; // crash timestamps (ms)
  lastBeat: number;
  routes: PluginRouteInfo[];
  jobs: string[];
  pending: Map<string, Pending>; // host→child invokes awaiting a response
  activation?: { resolve: () => void; reject: (e: Error) => void };
}

export interface SupervisorTuning {
  heartbeatTimeoutMs?: number;
  crashWindowMs?: number;
  crashLimit?: number;
  backoffCapMs?: number;
  killGraceMs?: number;
}

const DEFAULTS: Required<SupervisorTuning> = {
  heartbeatTimeoutMs: 20_000, // 3–4 missed 5s beats
  crashWindowMs: 5 * 60_000,
  crashLimit: 5,
  backoffCapMs: 30_000,
  killGraceMs: 3000,
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
  activate(id: string, granted: ReadonlySet<string>, config: Record<string, unknown> = {}): Promise<void> {
    if (this.running.has(id)) return Promise.resolve();
    const sup: Supervised = {
      id,
      granted,
      config,
      rpcHost: this.createRpcHost(id, granted),
      child: null,
      status: 'starting',
      crashes: [],
      lastBeat: Date.now(),
      routes: [],
      jobs: [],
      pending: new Map(),
    };
    this.running.set(id, sup);
    this.ensureSweep();
    return new Promise<void>((resolve, reject) => {
      sup.activation = { resolve, reject };
      this.spawn(sup);
    });
  }

  /** Stop a plugin: ask it to unload, then kill. Idempotent. */
  async disable(id: string): Promise<void> {
    const sup = this.running.get(id);
    if (!sup) return;
    this.running.delete(id);
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

  /** Send a host→child request (invoke a route or job) and await its response. */
  invoke(id: string, method: string, params: Record<string, unknown>, timeoutMs = 30_000): Promise<unknown> {
    const sup = this.running.get(id);
    if (!sup || sup.status !== 'active' || !sup.child) {
      return Promise.reject(new Error(`plugin ${id} is not active`));
    }
    return new Promise((resolve, reject) => {
      const reqId = randomUUID();
      const timer = setTimeout(() => {
        sup.pending.delete(reqId);
        reject(new Error('plugin invoke timed out'));
      }, timeoutMs);
      timer.unref?.();
      sup.pending.set(reqId, { resolve, reject, timer });
      sup.child!.send({ k: 'req', id: reqId, method, params } satisfies Envelope);
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
    const { entry, execArgv, forkCwd } = resolveChildEntry();
    const child = fork(entry, [sup.id, pluginCodeDir(sup.id)], {
      cwd: forkCwd ?? pluginCodeDir(sup.id),
      execArgv,
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
      // A ctx.* call from the plugin — dispatch through its capability host.
      const res = await sup.rpcHost.dispatch(msg as RpcRequest);
      sup.child?.send(res);
      return;
    }

    if (msg.k === 'res') {
      // A response to a host→child invoke (route/job).
      const p = sup.pending.get(msg.id);
      if (!p) return;
      sup.pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error((msg as RpcError).error.message));
      return;
    }

    if (msg.k === 'evt') {
      switch (msg.topic) {
        case 'hello':
          sup.child?.send({ k: 'evt', topic: 'init', data: { config: sup.config } } satisfies Envelope);
          break;
        case 'heartbeat':
          sup.lastBeat = Date.now();
          break;
        case 'loaded': {
          sup.lastBeat = Date.now();
          const d = msg.data as { routes?: PluginRouteInfo[]; jobs?: string[] };
          sup.routes = d.routes ?? [];
          sup.jobs = d.jobs ?? [];
          this.setStatus(sup, 'active');
          sup.activation?.resolve();
          sup.activation = undefined;
          break;
        }
        case 'load-error': {
          const message = (msg.data as { message?: string })?.message || 'plugin load failed';
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
          this.hooks.onEvent?.(sup.id, msg.topic, msg.data);
      }
    }
  }

  private rejectPending(sup: Supervised, reason: string): void {
    for (const p of sup.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    sup.pending.clear();
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

  /** Kill any active plugin that has stopped sending heartbeats (drives the crash path). */
  reapStale(now = Date.now()): void {
    for (const sup of this.running.values()) {
      if (sup.status === 'active' && now - sup.lastBeat > this.tuning.heartbeatTimeoutMs) {
        this.hooks.onLog?.(sup.id, 'warn', 'missed heartbeats; killing');
        sup.child?.kill('SIGKILL');
      }
    }
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
