import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fork, type ChildProcess } from 'node:child_process';
import { resolveChildEntry, pluginCodeDir, pluginRealCodeDir, pluginPermissionArgs, ensurePluginModuleType } from '../paths';
import type { Envelope, RpcError, RpcRequest } from '../protocol/envelope';
import type { PluginRpcHost } from '../host/rpc-host';
import { scheduleJobs, stopJobs, type ScheduledJob } from '../host/plugin-jobs';
import { SNAPSHOT_GRANT, type PluginEventMeta } from '../../../plugin-event-sink';
import { RpcRateLimiter, DEFAULT_RPC_LIMIT } from '../host/rate-limit';

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
  jobs: ScheduledJob[]; // declared background jobs (id + cron schedule)
  jobTasks?: ReturnType<typeof scheduleJobs>; // live node-cron tasks (only when jobs:run granted)
  hooks: string[]; // provider hooks the plugin implements (e.g. 'placeDetailProvider')
  events: string[]; // core events the plugin subscribes to (names or '*')
  exports: string[]; // functions the plugin exposes to dependents (ctx.plugins.call)
  subscriptions: Array<{ plugin: string; event: string }>; // other-plugin events it listens to
  pending: Map<string, Pending>; // host→child invokes awaiting a response
  invocations: Map<string, number | undefined>; // reqId -> acting user of that invoke (undefined = no user, e.g. a job)
  rpcLimiter: RpcRateLimiter; // caps this plugin's ctx.* call rate + concurrency (host-loop DoS guard)
  activation?: { resolve: () => void; reject: (e: Error) => void };
  activationTimer?: ReturnType<typeof setTimeout>; // deadline for the plugin to reach 'active'
  respawnTimer?: ReturnType<typeof setTimeout>; // crash-backoff restart timer (identity-guarded)
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
  tableContributor: 'hook:table-contributor',
  mapMarkerProvider: 'hook:map-marker-provider',
  pdfSectionProvider: 'hook:pdf-section-provider',
  atlasLayerProvider: 'hook:atlas-layer-provider',
  journalEntryProvider: 'hook:journal-entry-provider',
  tripCardProvider: 'hook:trip-card-provider',
};

export class PluginSupervisor {
  private running = new Map<string, Supervised>();
  private sweep: ReturnType<typeof setInterval> | null = null;
  private readonly tuning: Required<SupervisorTuning>;
  // Best-effort redelivery buffer: core events that fire while a subscriber is
  // mid-restart ('starting'/'error') are held here and replayed once it is active
  // again — closing the "event lost during the restart window" gap. In-memory only
  // (no persistence, so no DB writes on the broadcast fast-path), bounded per plugin
  // and TTL'd. Grants + snapshot gating are re-evaluated at replay time from the
  // CURRENT grant set, never trusted from when the event was buffered.
  private readonly pendingEvents = new Map<string, Array<{ tripId: number; event: string; meta?: PluginEventMeta; expiresAt: number }>>();
  private static readonly EVENT_BUFFER_MAX = 200;        // events held per plugin (drop oldest past this)
  private static readonly EVENT_BUFFER_TTL_MS = 15 * 60_000; // a buffered event older than this is dropped unreplayed

  constructor(
    private readonly createRpcHost: (id: string, granted: ReadonlySet<string>) => PluginRpcHost,
    private readonly hooks: SupervisorHooks = {},
    tuning: SupervisorTuning = {},
  ) {
    this.tuning = { ...DEFAULTS, ...tuning };
  }

  /** Spawn a plugin and resolve once it reports `loaded` (or reject on load error). */
  activate(id: string, granted: ReadonlySet<string>, config: Record<string, unknown> = {}, egress: string[] = []): Promise<void> {
    const existing = this.running.get(id);
    if (existing) {
      // A live plugin (starting/active) is idempotent — already activated.
      if (existing.status === 'starting' || existing.status === 'active') return Promise.resolve();
      // A DEAD entry (error after a load-failure or crash-auto-disable) otherwise
      // blocks re-activation forever, so the admin's "enable" button is a silent
      // no-op after any failure. Drop it and re-spawn fresh — its rpcHost was
      // already disposed on the way into that state.
      this.running.delete(id);
    }
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
      rpcLimiter: new RpcRateLimiter(DEFAULT_RPC_LIMIT, Date.now()),
    };
    this.running.set(id, sup);
    this.ensureSweep();
    const promise = new Promise<void>((resolve, reject) => {
      sup.activation = { resolve, reject };
      this.armActivationDeadline(sup);
      this.spawn(sup);
    });
    // Activation can be rejected by a timeout, a load-error, a crash-out, or a shutdown
    // mid-start. That must reach a caller that awaits activate(), but must NOT crash the
    // process as an unhandled rejection when a caller fires activate() without awaiting
    // (a boot reconcile, a test). A no-op terminal handler on a SEPARATE branch marks the
    // rejection handled; the returned promise still rejects for a real awaiter.
    promise.catch(() => {});
    return promise;
  }

  /** Kill a plugin that never reaches 'active' within the deadline (a stuck onLoad
   * would otherwise hang + peg a busy core with no reaper coverage — the reaper only
   * watches ACTIVE plugins). Used for BOTH the first activation and every crash-respawn,
   * so a plugin that hangs on load after a crash can't run away. */
  private armActivationDeadline(sup: Supervised): void {
    this.clearActivationTimer(sup);
    sup.activationTimer = setTimeout(async () => {
      if (sup.status === 'active') return;
      this.hooks.onLog?.(sup.id, 'error', 'activation timed out; killing');
      this.setStatus(sup, 'error', 'activation timed out');
      sup.activation?.reject(new Error('plugin did not finish loading in time'));
      sup.activation = undefined;
      this.running.delete(sup.id);
      this.pendingEvents.delete(sup.id); // don't orphan the buffered-event queue
      // await the kill (SIGTERM grace) before closing the plugin db, so a ctx.*
      // RPC from the dying child can't hit an already-disposed handle.
      await this.kill(sup);
      sup.rpcHost.dispose();
    }, this.tuning.activationTimeoutMs);
    sup.activationTimer.unref?.();
  }

  private clearActivationTimer(sup: Supervised): void {
    if (sup.activationTimer) {
      clearTimeout(sup.activationTimer);
      sup.activationTimer = undefined;
    }
    // The crash-backoff restart timer is cleared at the same lifecycle transitions
    // (disable / auto-disable / activation-timeout / going active) so a pending restart
    // can't fire after the entry is gone or replaced. It is also identity-guarded on fire.
    if (sup.respawnTimer) {
      clearTimeout(sup.respawnTimer);
      sup.respawnTimer = undefined;
    }
  }

  /** Stop a plugin: ask it to unload, then kill. Idempotent. */
  async disable(id: string): Promise<void> {
    const sup = this.running.get(id);
    if (!sup) return;
    this.running.delete(id);
    this.pendingEvents.delete(id); // a deliberately-stopped plugin keeps no buffered events
    this.clearActivationTimer(sup);
    this.setStatus(sup, 'stopped');
    await this.kill(sup);
    sup.rpcHost.dispose();
  }

  isActive(id: string): boolean {
    return this.running.get(id)?.status === 'active';
  }
  /** The ids of every currently-active plugin — lets a DB sweep scope its window to
   * plugins that can actually be delivered to, so inactive plugins' rows can't starve
   * the LIMIT out from under active ones. */
  activeIds(): string[] {
    const out: string[] = [];
    for (const [id, sup] of this.running) if (sup.status === 'active') out.push(id);
    return out;
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
   * The event name + tripId + a { entity, entityId } hint are sent, plus — ONLY for
   * a plugin whose granted set includes the family's db:read:* permission — the
   * whitelisted field snapshot the sink derived. The grant is the authorization
   * basis (the same fields that grant's read methods return); no acting user is
   * ever synthesized, so nothing beyond the snapshot is dereferenceable from the
   * handler.
   */
  deliverEvent(tripId: number, event: string, meta?: PluginEventMeta): void {
    for (const [id, sup] of this.running) {
      if (!sup.granted.has('events:subscribe')) continue;
      if (!sup.events.includes(event) && !sup.events.includes('*')) continue;
      if (sup.status === 'active') {
        this.sendEvent(sup, tripId, event, meta);
      } else if (sup.status === 'starting' || sup.status === 'error') {
        // Subscribed but mid-restart / recovering: hold the event and replay on activation.
        this.bufferEvent(id, tripId, event, meta);
      }
      // 'stopped' is a deliberate disable — drop, exactly as before.
    }
  }

  /** Invoke one active subscriber with an event, applying snapshot gating from its
   * CURRENT grants. Fire-and-forget: a broadcast must never block on a plugin. */
  private sendEvent(sup: Supervised, tripId: number, event: string, meta?: PluginEventMeta): void {
    const { snapshot, ...hint } = meta ?? {};
    const grant = hint.entity ? SNAPSHOT_GRANT[hint.entity] : undefined;
    const withSnapshot = snapshot !== undefined && grant !== undefined && sup.granted.has(grant);
    this.invoke(sup.id, 'invoke.event', { event, tripId, ...hint, ...(withSnapshot ? { snapshot } : {}) }, { actingUserId: undefined, timeoutMs: 5000 }).catch(() => {
      /* a subscriber that errors or times out is ignored — events are best-effort */
    });
  }

  /** Append an event to a subscriber's bounded redelivery buffer (drop-oldest past the cap). */
  private bufferEvent(id: string, tripId: number, event: string, meta?: PluginEventMeta): void {
    let q = this.pendingEvents.get(id);
    if (!q) { q = []; this.pendingEvents.set(id, q); }
    q.push({ tripId, event, meta, expiresAt: Date.now() + PluginSupervisor.EVENT_BUFFER_TTL_MS });
    if (q.length > PluginSupervisor.EVENT_BUFFER_MAX) q.splice(0, q.length - PluginSupervisor.EVENT_BUFFER_MAX);
  }

  /** Replay buffered events to a plugin that just went active. Re-checks the grant +
   * the current subscription list and drops anything expired, so a grant revoked or a
   * subscription dropped while the plugin was down never leaks through. */
  private flushPendingEvents(sup: Supervised): void {
    const q = this.pendingEvents.get(sup.id);
    if (!q) return;
    this.pendingEvents.delete(sup.id);
    if (!sup.granted.has('events:subscribe')) return;
    const now = Date.now();
    for (const item of q) {
      if (item.expiresAt <= now) continue;
      if (!sup.events.includes(item.event) && !sup.events.includes('*')) continue;
      this.sendEvent(sup, item.tripId, item.event, item.meta);
    }
  }

  /**
   * Fire a due scheduled task on an active plugin — userless, exactly like a cron
   * job (no acting user, so trip reads are refused; own db + declared egress only).
   * No-op if the plugin isn't active; the caller leaves the row so it fires on the
   * next sweep after reactivation. Fire-and-forget with a job-length timeout.
   */
  deliverScheduled(id: string, name: string, payload: unknown): void {
    const sup = this.running.get(id);
    if (!sup || sup.status !== 'active') return;
    void this.invoke(id, 'invoke.scheduled', { name, payload }, { actingUserId: undefined, timeoutMs: 60_000 }).catch(() => {
      /* a scheduled task that errors/times out is ignored — best-effort like jobs */
    });
  }

  /**
   * Ask an active plugin to erase its own data for a deleted user (GDPR erasure).
   * Userless — the plugin only learns the userId and acts on its own db. Resolves
   * true only when the plugin ACKs, which is the caller's signal to drop the durable
   * queue row; anything else (inactive, no grant, error, timeout) resolves false so
   * the erasure is retried on a later sweep / after the plugin reactivates.
   */
  async deliverUserErasure(id: string, userId: number): Promise<boolean> {
    const sup = this.running.get(id);
    if (!sup || sup.status !== 'active') return false;
    // NB: no grant re-check here. The row was only enqueued because the plugin held
    // hook:user-data and may hold the user's data; if it later dropped the grant, the
    // erasure is still a DUTY, not a gated capability — refusing it would strand the
    // data forever. deleteUserData is userless and touches only the plugin's own db.
    try {
      await this.invoke(id, 'invoke.deleteUserData', { userId }, { actingUserId: undefined, timeoutMs: 30_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Collect what an active plugin holds about a user (GDPR portability). Userless,
   * gated by the same hook:user-data grant. Returns the plugin's exported payload,
   * or undefined if it is inactive, ungranted, doesn't implement the hook, or errors.
   */
  async collectUserExport(id: string, userId: number): Promise<{ ok: true; data: unknown } | { ok: false } | undefined> {
    const sup = this.running.get(id);
    if (!sup || sup.status !== 'active' || !sup.granted.has('hook:user-data')) return undefined; // not applicable
    try {
      const res = (await this.invoke(id, 'invoke.exportUserData', { userId }, { actingUserId: undefined, timeoutMs: 30_000 })) as { data?: unknown } | undefined;
      return { ok: true, data: res?.data };
    } catch {
      return { ok: false }; // errored/timed out — the caller flags this as incomplete, not "no data"
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
    // Mark every entry deliberately stopped and drop it from `running` BEFORE the kills,
    // so the child 'exit'/'stderr' listeners take the early-return path in onExit instead
    // of the CRASH path — which would write crash-accounting rows to the DB. That matters
    // because a restore calls shutdownAll AFTER closeDb(): a crash-path DB write would then
    // hit the closed connection, throw from an EventEmitter listener, and take the whole
    // process down mid-restore. (It also stops a normal shutdown from logging phantom
    // 'crashed' rows + persisting status 'starting'.) Set the field directly, NOT via
    // setStatus, so no onStatus DB hook fires while the core DB may be closed.
    for (const s of all) {
      s.status = 'stopped';
      this.clearActivationTimer(s);
      // Fail any in-flight activate() HTTP request instead of leaving it hung forever.
      s.activation?.reject(new Error('plugin host shutting down'));
      s.activation = undefined;
    }
    this.running.clear();
    // Drop every buffered event: after a live restore these carry pre-restore tripIds/
    // snapshots, and replaying them into the restored data on a re-activation would be wrong.
    this.pendingEvents.clear();
    await Promise.all(all.map((s) => this.kill(s)));
    for (const s of all) s.rpcHost.dispose();
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
      const req = msg as RpcRequest;
      // Rate limit BEFORE dispatch: every ctx.* call runs synchronously on the host
      // thread (better-sqlite3 + the router), so an unthrottled `while (true)` loop
      // in a plugin freezes the whole instance — including this supervisor's reap
      // sweep. A throttled call is refused with HOST_ERROR (retryable) rather than
      // executed; a legitimate plugin never hits the generous burst.
      if (!sup.rpcLimiter.tryAcquire(Date.now())) {
        sup.child?.send({ k: 'res', id: req.id, ok: false, error: { code: 'HOST_ERROR', message: 'rate limit exceeded — slow down ctx.* calls' } } satisfies RpcError);
        return;
      }
      const inv = req.params as { _inv?: unknown } | undefined;
      const actingUserId = typeof inv?._inv === 'string' ? sup.invocations.get(inv._inv) : undefined;
      try {
        const res = await sup.rpcHost.dispatch(req, actingUserId);
        sup.child?.send(res);
      } finally {
        sup.rpcLimiter.release();
      }
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
          // Only a still-starting entry that is still THE current one may go active.
          // A late `loaded` (child finished onLoad during the kill grace, or the IPC
          // buffer delivered it after 'exit') must not resurrect a stopped/removed
          // plugin or re-register routes on an active one — otherwise its jobs get
          // scheduled against a dead/replaced supervisor and fire twice after re-enable.
          if (this.running.get(sup.id) !== sup || sup.status !== 'starting') break;
          sup.lastBeat = Date.now();
          const d = msg.data as {
            routes?: PluginRouteInfo[]; jobs?: ScheduledJob[]; hooks?: string[]; events?: string[];
            exports?: string[]; subscriptions?: Array<{ plugin: string; event: string }>;
          };
          sup.routes = d.routes ?? [];
          sup.jobs = Array.isArray(d.jobs)
            ? d.jobs.filter((j): j is ScheduledJob => !!j && typeof j.id === 'string' && typeof j.schedule === 'string')
            : [];
          sup.hooks = d.hooks ?? [];
          sup.events = d.events ?? [];
          sup.exports = Array.isArray(d.exports) ? d.exports.filter((e): e is string => typeof e === 'string') : [];
          sup.subscriptions = Array.isArray(d.subscriptions)
            ? d.subscriptions.filter((s): s is { plugin: string; event: string } => !!s && typeof s.plugin === 'string' && typeof s.event === 'string')
            : [];
          this.clearActivationTimer(sup);
          this.setStatus(sup, 'active');
          // Start the plugin's background jobs (opt-in via jobs:run). A job carries no
          // acting user, so its trip reads are refused; it can only touch its own db /
          // egress. Wrapped so a scheduling hiccup can never break activation.
          try {
            sup.jobTasks = scheduleJobs(sup.granted, sup.jobs, (jobId) => {
              void this.invoke(sup.id, 'invoke.job', { jobId }, { actingUserId: undefined, timeoutMs: 60_000 }).catch(() => {});
            });
          } catch {
            /* a scheduler error must never stop a plugin from going live */
          }
          // Replay any events that fired while the plugin was (re)starting.
          this.flushPendingEvents(sup);
          sup.activation?.resolve();
          sup.activation = undefined;
          break;
        }
        case 'load-error': {
          const message = (msg.data as { message?: string })?.message || 'plugin load failed';
          // Same guard as `loaded`: a late load-error from a child that was already
          // stopped/replaced must not overwrite the current entry's status or re-dispose
          // a handle the disable path already tore down.
          if (this.running.get(sup.id) !== sup || sup.status !== 'starting') break;
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
    // The dead child's node-cron tasks keep ticking (node-cron holds them, not the
    // child). Stop them here — otherwise every crash-restart cycle leaks a task-set
    // AND re-schedules a fresh one, so the job fires N+1 times per tick after N
    // crashes (duplicate egress/db side effects). kill() already does this for the
    // clean-stop path; the crash/auto-disable path reaches this instead.
    stopJobs(sup.jobTasks);
    sup.jobTasks = undefined;
    // A clean stop we asked for isn't a crash.
    if (sup.status === 'stopped' || sup.status === 'error') return;
    if (!this.running.has(sup.id)) return;

    sup.crashes.push(Date.now());
    const recent = sup.crashes.filter((t) => t > Date.now() - this.tuning.crashWindowMs);
    sup.crashes = recent; // trim: drop timestamps outside the window so the array can't grow unbounded
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
    // Cancel the previous activation deadline: a crash late in the activation budget
    // leaves it armed, and if it fired during this backoff wait it would mark the entry
    // 'error' and silently cancel the scheduled retry. (Clears the respawnTimer slot too,
    // which we set immediately below.)
    this.clearActivationTimer(sup);
    this.setStatus(sup, 'starting');
    sup.respawnTimer = setTimeout(() => {
      // Identity + status check, not just presence: a disable + re-enable in the backoff
      // window replaces `running[id]` with a NEW sup, so `running.has(id)` would still be
      // true and this stale timer would respawn a GHOST child from the old entry. Only
      // respawn when the entry is still THIS one and still awaiting its restart.
      if (this.running.get(sup.id) !== sup || sup.status !== 'starting') return;
      this.spawn(sup);
      // A respawn needs the SAME activation deadline as a first activation — otherwise a
      // plugin that hangs in onLoad after a crash sits in 'starting' forever, pegging a
      // core and buffering events that never flush (the reaper ignores non-active).
      this.armActivationDeadline(sup);
    }, delay);
    sup.respawnTimer.unref?.();
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
    // Expire buffered events whose TTL passed without a flush (a subscriber stuck in
    // 'error'/'starting' would otherwise pin its queue until it happens to reactivate).
    for (const [id, q] of this.pendingEvents) {
      const live = q.filter((e) => e.expiresAt > now);
      if (live.length === 0) this.pendingEvents.delete(id);
      else if (live.length !== q.length) this.pendingEvents.set(id, live);
    }
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
    // Stop the plugin's cron jobs first so no tick fires against a dying/gone child
    // (and nothing leaks across a deactivate/reactivate).
    stopJobs(sup.jobTasks);
    sup.jobTasks = undefined;
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
