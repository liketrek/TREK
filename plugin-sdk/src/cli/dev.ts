/**
 * trek-plugin dev — run your plugin locally with a real request loop and hot
 * reload, without a full TREK. It loads server/index.js through the same
 * definePlugin contract, injects a ctx that enforces your manifest's granted
 * permissions (an ungranted call still throws PERMISSION_DENIED, so you catch
 * missing grants), backs db:own with a real SQLite file when the runtime has
 * node:sqlite, serves your routes over HTTP and your page/widget UI, and reloads
 * on every save.
 *
 * Dependency-free: node:http + node:sqlite (when present) + built-ins.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import * as sdk from '../index.js';
import { injectTrekUi } from '../ui/kit.js';
import { readJsonFile } from './json.js';

// Dev fixtures ARE mock-host options — the dev ctx delegates every non-db-own
// capability to a grant-enforcing mock host, so dev-fixtures.json can seed the full
// surface (trips, costs, packing, files, users, settings, weather, ai, …), exactly the
// shape a mock-host unit test uses. `actingUserId` binds the dev user (like the prod
// invocation user), defaulting to 1.
type Fixtures = NonNullable<Parameters<typeof sdk.createMockHost>[0]>;
interface PluginRouteLike { method: string; path: string; auth?: boolean; handler: (req: unknown, ctx: unknown) => Promise<{ status: number; headers?: Record<string, string>; body?: unknown }>; }
type Handler = (...a: unknown[]) => unknown;
interface PluginLike {
  onLoad?: (ctx: unknown) => unknown;
  routes?: PluginRouteLike[];
  jobs?: Array<{ id: string; handler: Handler }>;
  scheduled?: Handler;
  events?: Array<{ on: string; handler: Handler }>;
  deleteUserData?: Handler;
  exportUserData?: Handler;
  hooks?: Record<string, Record<string, Handler>>;
}

class PermissionDenied extends Error {}

// The same SQL guards the real host's PluginDataDb applies (plugin-data.service.ts):
// forbidden statement types, an sql-length cap, a result-row cap, and — inside tx() —
// no transaction control plus a batch-size cap. Without them a statement production
// refuses would silently work in dev, and the author would debug a phantom.
const MAX_SQL_LENGTH = 100_000;
const FORBIDDEN_SQL = /\b(ATTACH|DETACH|VACUUM|PRAGMA|RECURSIVE|LOAD_EXTENSION)\b/i;
const TX_CONTROL = /^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|END)\b/i;
const MAX_TX_OPS = 100;
const MAX_ROWS = 100_000;

function guardSql(sql: string): void {
  if (typeof sql !== 'string') throw new Error('sql must be a string');
  if (sql.length > MAX_SQL_LENGTH) throw new Error('sql too long');
  if (FORBIDDEN_SQL.test(sql)) throw new Error('statement type not allowed for plugin databases');
}

/** Strip LEADING comments/whitespace so a COMMIT hidden behind a comment can't slip
 * past the start-anchored TX_CONTROL check (mirrors the host's tx() guard). */
function stripLeadingComments(sql: string): string {
  return String(sql ?? '').replace(/^(?:\s|--[^\n]*\n?|\/\*[\s\S]*?\*\/)*/, '');
}

// The credential-free inbound-header allowlist TREK's proxy forwards to auth:false
// routes (webhooks) — never Cookie/Authorization/session. Kept in lockstep with
// SAFE_INBOUND_HEADERS in plugins-proxy.controller.ts.
const SAFE_INBOUND_HEADERS = new Set([
  'content-type', 'user-agent', 'x-request-id', 'x-idempotency-key',
  'x-hub-signature', 'x-hub-signature-256', 'x-github-event', 'x-github-delivery',
  'stripe-signature',
  'svix-id', 'svix-timestamp', 'svix-signature',
  'x-gitlab-event', 'x-gitlab-token',
  'x-signature', 'x-signature-256', 'x-webhook-signature', 'x-event-type',
]);

function pickInboundHeaders(raw: http.IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!SAFE_INBOUND_HEADERS.has(k.toLowerCase())) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
  }
  return out;
}

/**
 * Accept both bind shapes the real host accepts: spread positional args AND a
 * single array of them (better-sqlite3 binds an array; node:sqlite does not,
 * so a plugin using the array form would fail only in dev).
 */
function flatBind(args: unknown[]): unknown[] {
  return args.length === 1 && Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
}

/** A dev db backed by node:sqlite if available, else an in-memory recorder that returns []. */
export function createDevDb(dbFile: string): { db: PluginContextDb; note: string; close: () => void } {
  try {
    // node:sqlite is available on Node 22.5+ (experimental). Fall back gracefully if not.
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as { DatabaseSync: new (p: string) => SqliteDb };
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    const sq = new DatabaseSync(dbFile);
    const applied = new Set<string>();
    return {
      note: `db:own → real SQLite at ${dbFile}`,
      close: () => { try { sq.close(); } catch { /* ignore */ } },
      db: {
        async query(sql: string, ...args: unknown[]) {
          guardSql(sql);
          const rows = sq.prepare(sql).all(...flatBind(args)) as unknown[];
          if (rows.length > MAX_ROWS) throw new Error(`query returned more than ${MAX_ROWS} rows`);
          return rows;
        },
        async exec(sql: string, ...args: unknown[]) {
          guardSql(sql);
          if (args.length) { const r = sq.prepare(sql).run(...flatBind(args)); return { changes: Number(r.changes ?? 0) }; }
          sq.exec(sql); return { changes: 0 };
        },
        async migrate(id: string, sql: string) { guardSql(sql); if (applied.has(id)) return { applied: false }; sq.exec(sql); applied.add(id); return { applied: true }; },
      },
    };
  } catch {
    return {
      note: 'db:own → in-memory stub (upgrade to Node 22.5+ for a real SQLite dev db)',
      close: () => {},
      db: {
        async query(sql: string) { guardSql(sql); return []; },
        async exec(sql: string) { guardSql(sql); return { changes: 0 }; },
        async migrate(_id: string, sql: string) { guardSql(sql); return { applied: true }; },
      },
    };
  }
}

interface SqliteDb { prepare(sql: string): { all(...a: unknown[]): unknown[]; run(...a: unknown[]): { changes?: number | bigint } }; exec(sql: string): void; close(): void; }
interface PluginContextDb { query(sql: string, ...a: unknown[]): Promise<unknown[]>; exec(sql: string, ...a: unknown[]): Promise<{ changes: number }>; migrate(id: string, sql: string): Promise<{ applied: boolean }>; }

function createDevContext(id: string, grants: Set<string>, fx: Fixtures, db: PluginContextDb, broadcasts: unknown[]) {
  const need = (perm: string, method: string) => { if (!grants.has(perm)) throw new PermissionDenied(`PERMISSION_DENIED: ${method} requires ${perm}`); };
  // Full parity: delegate EVERY capability to a grant-enforcing mock host (the same one
  // used in unit tests), so ctx.costs/packing/files/notify/ai/settings/scheduler/meta/
  // oauth/weather/rates/journal/… all work in dev instead of throwing TypeErrors — then
  // override just the three surfaces dev does natively: db:own (real node:sqlite so your
  // migrations/queries actually persist), ws broadcasts (captured for the dashboard),
  // and logging (to the dev console). The mock enforces the SAME grants, so a missing
  // permission fails identically here and in production.
  // Default the dev acting user to 1 (like the prod invocation user) so the documented
  // one-arg calls work on a fresh scaffold — without this, a fixtures file that omits
  // actingUserId leaves the mock userless and every user-bound capability throws.
  const mock = sdk.createMockHost({ ...fx, actingUserId: fx.actingUserId ?? 1, grants: [...grants] });
  const isRead = (sql: string) => /^\s*(SELECT|WITH|VALUES)\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
  const devDb = {
    query: (sql: string, ...a: unknown[]) => { need('db:own', 'db.query'); return db.query(sql, ...a); },
    exec: (sql: string, ...a: unknown[]) => { need('db:own', 'db.exec'); return db.exec(sql, ...a); },
    migrate: (mid: string, sql: string) => { need('db:own', 'db.migrate'); return db.migrate(mid, sql); },
    // A functional (not strictly atomic) tx over the real dev db so read-modify-write
    // batches work in dev; production runs it in one better-sqlite3 transaction.
    tx: async (ops: Array<{ sql: string; args?: unknown[] }>) => {
      need('db:own', 'db.tx');
      // Validate the WHOLE batch up front, like the host's PluginDataDb.tx — a bad
      // op must fail before anything ran, not leave earlier writes behind.
      if (!Array.isArray(ops)) throw new Error('tx requires an array of { sql, args }');
      if (ops.length > MAX_TX_OPS) throw new Error(`tx allows at most ${MAX_TX_OPS} statements`);
      for (const op of ops) {
        guardSql(op?.sql as string);
        if (TX_CONTROL.test(stripLeadingComments(op?.sql as string))) throw new Error('transaction-control statements are not allowed inside tx()');
      }
      const results: Array<{ changes?: number; rows?: unknown[] }> = [];
      for (const op of ops) {
        if (isRead(op.sql)) results.push({ rows: await db.query(op.sql, ...(op.args ?? [])) as unknown[] });
        else { const r = await db.exec(op.sql, ...(op.args ?? [])) as { changes?: number }; results.push({ changes: r?.changes ?? 0 }); }
      }
      return { results };
    },
  };
  const wrap = (base: typeof mock.ctx, actingUserId: number | undefined) => ({
    ...base,
    id,
    db: devDb,
    ws: {
      // Same target gates as production: a trip room only for a member acting user,
      // a user push only to the acting user themself.
      broadcastToTrip: async (t: number, event: string, data: unknown) => {
        need('ws:broadcast:trip', 'ws.broadcastToTrip');
        if (actingUserId === undefined) throw new Error('RESOURCE_FORBIDDEN: broadcasts require an authenticated user context');
        const trip = fx.trips?.[t];
        if (!trip || !trip.members.includes(actingUserId)) throw new Error(`RESOURCE_FORBIDDEN: no access to trip ${t}`);
        broadcasts.push({ kind: 'trip', target: t, event, data });
      },
      broadcastToUser: async (u: number, event: string, data: unknown) => {
        need('ws:broadcast:user', 'ws.broadcastToUser');
        if (actingUserId === undefined || u !== actingUserId) throw new Error('RESOURCE_FORBIDDEN: a plugin may only broadcast to the acting user');
        broadcasts.push({ kind: 'user', target: u, event, data });
      },
    },
    log: {
      info: (m: string) => console.log(`  [plugin] ${m}`),
      warn: (m: string) => console.warn(`  [plugin] ${m}`),
      error: (m: string) => console.error(`  [plugin] ${m}`),
    },
  });
  // Routes (and hooks) run user-bound; jobs, scheduled tasks, event deliveries and the
  // GDPR handlers run with NO acting user — exactly the split production makes, so a
  // membership read from a job fails here the same way it would in TREK.
  return {
    ctx: wrap(mock.ctx, fx.actingUserId ?? 1),
    userlessCtx: wrap(mock.userlessCtx, undefined),
  };
}

/**
 * Serve `require('trek-plugin-sdk')` from THIS package, exactly like the TREK
 * child process does at runtime — so `dev` works on a fresh scaffold with no
 * npm install, and what loads here is what loads in production. That parity is
 * the point: the injected surface is the SAME minimal frozen shim the prod
 * child serves (definePlugin + PLUGIN_API_VERSION), and subpaths fail with the
 * same pointed error. validateManifest/createMockHost stay available where they
 * belong — in your tests, which load the installed package without this patch.
 */
let sdkInjected = false;
export function installSdkInjection(): void {
  if (sdkInjected) return;
  const nodeModule = createRequire(import.meta.url)('node:module') as {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
  };
  const realLoad = nodeModule._load;
  if (typeof realLoad !== 'function') return;
  sdkInjected = true;
  const shim = Object.freeze({ definePlugin: sdk.definePlugin, PLUGIN_API_VERSION: sdk.PLUGIN_API_VERSION });
  nodeModule._load = function (request: string, parent: unknown, isMain: boolean): unknown {
    if (request === 'trek-plugin-sdk') return shim;
    if (request.startsWith('trek-plugin-sdk/')) {
      throw new Error(`${request} is a build/test-time module — only 'trek-plugin-sdk' itself is injected inside TREK`);
    }
    return realLoad.call(this, request, parent, isMain);
  };
}

function loadFixtures(dir: string): Fixtures {
  const p = path.join(dir, 'dev-fixtures.json');
  if (fs.existsSync(p)) { try { return readJsonFile<Fixtures>(p); } catch { console.warn('warning: dev-fixtures.json is not valid JSON — ignoring'); } }
  return {};
}

/** Watch a directory tree with per-dir fs.watch (works on every platform, unlike recursive). */
function watchTree(root: string, onChange: () => void): void {
  const skip = new Set(['node_modules', '.git', '.trek-dev']);
  const watch = (d: string) => {
    try {
      fs.watch(d, (_e, f) => { if (!f || !skip.has(f)) onChange(); });
      for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory() && !skip.has(e.name)) watch(path.join(d, e.name));
    } catch { /* dir vanished */ }
  };
  if (fs.existsSync(root)) watch(root);
}

export async function runDev(dir: string, opts: { port?: number } = {}): Promise<void> {
  const abs = path.resolve(dir);
  const manifestPath = path.join(abs, 'trek-plugin.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`no trek-plugin.json in ${abs}`);
  const manifest = readJsonFile<Record<string, unknown>>(manifestPath);
  const id = String(manifest.id);
  const grants = new Set(Array.isArray(manifest.permissions) ? (manifest.permissions as string[]) : []);
  const fx = loadFixtures(abs);
  const { db, note: dbNote, close: closeDb } = createDevDb(path.join(abs, '.trek-dev', 'db.sqlite'));
  const broadcasts: unknown[] = [];
  installSdkInjection();
  const req = createRequire(path.join(abs, 'server', 'index.js'));

  let plugin: PluginLike = {};
  let version = 0;
  const { ctx, userlessCtx } = createDevContext(id, grants, fx, db, broadcasts);
  const port = opts.port ?? 4317;

  // Block a browser-initiated cross-site request to the side-effectful endpoints:
  // modern browsers stamp Sec-Fetch-Site (anything but same-origin is another site;
  // 'none' is the user's own address bar and stays allowed), and every browser sends
  // Origin on cross-origin fetches — refuse an Origin that isn't this dev server.
  // curl/devtools-on-the-page pass both checks.
  const isCrossSite = (request: http.IncomingMessage): boolean => {
    const site = request.headers['sec-fetch-site'];
    if (typeof site === 'string' && site !== 'same-origin' && site !== 'none') return true;
    const origin = request.headers['origin'];
    if (typeof origin === 'string' && origin !== `http://localhost:${port}` && origin !== `http://127.0.0.1:${port}`) return true;
    return false;
  };

  const load = async () => {
    const entry = path.join(abs, 'server', 'index.js');
    if (!fs.existsSync(entry)) { console.error('  server/index.js is missing — build your plugin'); plugin = {}; return; }
    for (const k of Object.keys(req.cache)) if (k.startsWith(abs) && !k.includes('node_modules')) delete req.cache[k];
    try {
      const mod = req(entry) as PluginLike & { default?: PluginLike };
      plugin = mod.default ?? mod;
      await plugin.onLoad?.(ctx);
      version++;
      console.log(`  ↻ loaded ${plugin.routes?.length ?? 0} route(s)`);
    } catch (e) {
      // A plugin whose load/onLoad throws would fail activation in TREK — don't
      // keep serving its routes here, or dev would hide exactly that failure.
      plugin = {};
      console.error('  ✗ plugin failed to load:', e instanceof Error ? e.message : e);
    }
  };
  await load();

  let timer: NodeJS.Timeout | null = null;
  const reload = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => { console.log('  change detected'); void load(); }, 120); };
  watchTree(path.join(abs, 'server'), reload);
  watchTree(path.join(abs, 'client'), reload);

  const server = http.createServer((request, res) => { void handle(request, res); });

  async function handle(request: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(request.url || '/', 'http://localhost');
    const send = (status: number, body: string | Buffer, type = 'text/plain; charset=utf-8', headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'content-type': type, ...headers }); res.end(body);
    };

    if (url.pathname === '/__dev/version') return send(200, String(version));

    // Fire a NON-route entry point against the dev ctx — the half the dev server used to
    // be unable to reach. GET /__dev/fire/<kind>[/<name>][/<fn>], e.g.
    //   /__dev/fire/job/refresh · /__dev/fire/scheduled/daily · /__dev/fire/event/place:created
    //   /__dev/fire/hook/tripCardProvider/getCards · /__dev/fire/deleteUserData
    // Query params become the payload/args; a JSON body is used verbatim when present.
    if (url.pathname.startsWith('/__dev/fire/')) {
      // These endpoints are side-effectful (fire a job, wipe user data, …). Even bound to
      // loopback, a drive-by <img src="http://127.0.0.1:PORT/__dev/fire/deleteUserData?…">
      // from an open browser tab could hit them — block a cross-site request.
      if (isCrossSite(request)) return send(403, 'cross-site request refused');
      const [kind, name, fn] = url.pathname.slice('/__dev/fire/'.length).split('/');
      const bodyRaw = await readBody(request); // already JSON-parsed when sent as application/json
      let payload: unknown = bodyRaw;
      if (typeof bodyRaw === 'string') { try { payload = JSON.parse(bodyRaw); } catch { payload = bodyRaw; } }
      if (payload === undefined) { const q: Record<string, string> = {}; url.searchParams.forEach((v, k) => { q[k] = v; }); if (Object.keys(q).length) payload = q; }
      try {
        // Jobs, scheduled tasks, events and the GDPR handlers run with NO acting user in
        // production — fire them against the userless ctx so a membership read fails here
        // exactly like it would in TREK. Hooks stay user-bound.
        let out: unknown;
        if (kind === 'job') { const j = plugin.jobs?.find((x) => x.id === name); if (!j) return send(404, `no job "${name}"`); out = await j.handler(userlessCtx); }
        else if (kind === 'scheduled') { if (!plugin.scheduled) return send(404, 'plugin has no scheduled handler'); out = await plugin.scheduled({ name, payload }, userlessCtx); }
        else if (kind === 'event') { for (const s of plugin.events ?? []) if (s.on === name || s.on === '*') await s.handler({ event: name, tripId: 0, ...(payload as object) }, userlessCtx); out = { delivered: true }; }
        else if (kind === 'deleteUserData') { if (!plugin.deleteUserData) return send(404, 'no deleteUserData handler'); out = await plugin.deleteUserData({ userId: Number((payload as { userId?: unknown })?.userId ?? name ?? 0) }, userlessCtx); }
        else if (kind === 'exportUserData') { if (!plugin.exportUserData) return send(404, 'no exportUserData handler'); out = await plugin.exportUserData({ userId: Number((payload as { userId?: unknown })?.userId ?? name ?? 0) }, userlessCtx); }
        else if (kind === 'hook') { const impl = plugin.hooks?.[name]; if (!impl || typeof impl[fn] !== 'function') return send(404, `no hook ${name}.${fn}`); out = await impl[fn](...(Array.isArray(payload) ? payload : payload != null ? [payload] : []), ctx); }
        else return send(400, `unknown fire kind "${kind}"`);
        return send(200, JSON.stringify(out ?? { ok: true }, null, 2), 'application/json; charset=utf-8');
      } catch (e) {
        const denied = e instanceof PermissionDenied;
        return send(denied ? 403 : 500, e instanceof Error ? e.message : String(e));
      }
    }

    if (url.pathname === '/') return send(200, dashboard(id, String(manifest.type), plugin.routes ?? [], dbNote, broadcasts.length), 'text/html; charset=utf-8');

    // Faithful host preview: embeds /ui in a sandboxed opaque-origin iframe (exactly
    // like TREK) and plays the host — posts trek:context (with a theme/accent toggle),
    // proxies trek:invoke to your /api routes, and honours resize/notify/navigate. This
    // is where the design kit actually renders themed.
    if (url.pathname === '/preview' && String(manifest.type) !== 'integration') {
      return send(200, preview(id, String(manifest.type)), 'text/html; charset=utf-8');
    }

    // Static plugin UI at /ui (page/widget client bundle)
    if (url.pathname === '/ui' || url.pathname.startsWith('/ui/')) {
      const relFile = url.pathname === '/ui' ? 'index.html' : url.pathname.slice('/ui/'.length);
      const file = path.join(abs, 'client', relFile);
      if (!file.startsWith(path.join(abs, 'client'))) return send(403, 'forbidden');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(404, 'not found — build your client/ bundle');
      const raw = fs.readFileSync(file);
      const type = contentType(file);
      // Only the HTML doc is rewritten (expand the `<!-- trek:ui -->` marker into the
      // design kit, then inject live-reload) as a string; every other asset is sent as
      // the raw Buffer — a UTF-8 round-trip corrupts binary files.
      const body: string | Buffer = type.startsWith('text/html')
        ? injectTrekUi(String(raw)).replace('</body>', `${LIVE_RELOAD}</body>`)
        : raw;
      return send(200, body, type);
    }

    // Plugin API routes mounted under /api/<route path>
    if (url.pathname.startsWith('/api/')) {
      // Same drive-by guard as /__dev/fire: routes are side-effectful against the real
      // dev db with no auth — an off-site page must not reach them on 127.0.0.1.
      if (isCrossSite(request)) return send(403, 'cross-site request refused');
      const pluginPath = url.pathname.slice('/api'.length); // "/api/hello" -> "/hello"
      const route = (plugin.routes ?? []).find((r) => r.method.toUpperCase() === request.method && r.path === pluginPath);
      if (!route) return send(404, `no ${request.method} route ${pluginPath}`);
      const anon = url.searchParams.get('_anon') === '1';
      if (route.auth !== false && anon) return send(401, 'this route requires auth (drop ?_anon=1 to send the dev user)');
      // The dev user matches the ctx's acting user and is a regular account — the prod
      // proxy never hands a plugin an admin session it didn't authenticate.
      const user = anon ? null : { id: fx.actingUserId ?? 1, username: 'dev', isAdmin: false };
      const body = await readBody(request);
      const query: Record<string, unknown> = {}; url.searchParams.forEach((v, k) => { if (k !== '_anon') query[k] = v; });
      // headers is always present on a PluginRequest; only auth:false routes (webhooks)
      // receive the allowlisted, credential-free inbound subset — like the prod proxy.
      const headers = route.auth === false ? pickInboundHeaders(request.headers) : {};
      try {
        const r = await route.handler({ method: route.method, path: route.path, query, body, headers, user }, ctx);
        const out = typeof r.body === 'string' || Buffer.isBuffer(r.body) ? String(r.body) : JSON.stringify(r.body ?? null);
        return send(r.status ?? 200, out, r.headers?.['content-type'] || 'application/json; charset=utf-8', r.headers ?? {});
      } catch (e) {
        const denied = e instanceof PermissionDenied;
        return send(denied ? 403 : 500, (e instanceof Error ? e.message : String(e)));
      }
    }
    return send(404, 'not found');
  }

  await new Promise<void>((resolve, reject) => {
    server.once('error', (e: NodeJS.ErrnoException) =>
      reject(e.code === 'EADDRINUSE' ? new Error(`port ${port} is already in use — pass --port <n> to pick another`) : e));
    // Bind loopback only: the dev server serves the plugin's routes AND the side-effectful
    // /__dev/fire endpoints against a real db with no auth — never expose that to the LAN.
    server.listen(port, '127.0.0.1', resolve);
  });
  const routes = plugin.routes ?? [];
  console.log(`\n  trek-plugin dev — ${id} (${String(manifest.type)})`);
  console.log(`  ${dbNote}`);
  console.log(`  granted: ${[...grants].join(', ') || '(none)'}`);
  console.log(`\n  ▸ http://localhost:${port}/        dashboard`);
  if (String(manifest.type) !== 'integration') {
    console.log(`  ▸ http://localhost:${port}/preview themed host preview`);
    console.log(`  ▸ http://localhost:${port}/ui      your plugin UI (raw)`);
  }
  for (const r of routes) console.log(`  ▸ ${r.method.padEnd(4)} http://localhost:${port}/api${r.path}${r.auth === false ? '  (public)' : ''}`);
  console.log('\n  editing server/ or client/ hot-reloads. Ctrl+C to stop.\n');

  const shutdown = () => { closeDb(); server.close(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      if ((req.headers['content-type'] || '').includes('application/json')) { try { return resolve(JSON.parse(raw)); } catch { /* raw */ } }
      resolve(raw);
    });
    req.on('error', () => resolve(undefined));
  });
}

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' } as Record<string, string>)[ext] || 'application/octet-stream';
}

const LIVE_RELOAD = `<script>let __v;setInterval(async()=>{try{const v=await(await fetch('/__dev/version')).text();if(__v&&v!==__v)location.reload();__v=v;}catch(e){}},1000)</script>`;

function dashboard(id: string, type: string, routes: PluginRouteLike[], dbNote: string, bcasts: number): string {
  const rows = routes.length
    ? routes.map((r) => `<tr><td><code>${r.method}</code></td><td><a href="/api${r.path}">/api${r.path}</a></td><td>${r.auth === false ? 'public' : 'auth'}</td></tr>`).join('')
    : '<tr><td colspan="3" style="opacity:.6">no routes declared</td></tr>';
  const ui = type !== 'integration'
    ? `<p><a href="/preview">▸ open the themed host preview (/preview)</a> &nbsp;·&nbsp; <a href="/ui">raw /ui</a></p>`
    : '';
  return `<!doctype html><meta charset="utf-8"><title>${id} · trek-plugin dev</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:3rem auto;padding:0 1rem;color:#111}
h1{font-size:1.4rem}code{background:#f3f4f6;padding:.1em .35em;border-radius:4px}
table{border-collapse:collapse;width:100%;margin:1rem 0}td{border-bottom:1px solid #eee;padding:.5rem .4rem;text-align:left}
.muted{color:#6b7280;font-size:.9rem}a{color:#4f46e5}@media(prefers-color-scheme:dark){body{background:#111827;color:#e5e7eb}code{background:#1f2937}td{border-color:#374151}}</style>
<h1>${id} <span class="muted">· ${type}</span></h1>
<p class="muted">${dbNote} · ${bcasts} ws broadcast(s) captured</p>
${ui}
<table><tr><th>Method</th><th>URL</th><th>Auth</th></tr>${rows}</table>
<p class="muted">Add <code>?_anon=1</code> to a route to hit it as an unauthenticated request. Edit <code>server/</code> or <code>client/</code> and this reloads.</p>
${LIVE_RELOAD}`;
}

/**
 * A faithful host preview for a page/widget plugin. Loads /ui in a sandboxed,
 * opaque-origin iframe (no allow-same-origin — exactly TREK's isolation) and plays
 * the host over postMessage: it sends trek:context (with a theme/accent/appearance
 * toggle), proxies trek:invoke to the dev server's /api routes with the dev user,
 * and surfaces resize/notify/navigate. This is where the design kit renders themed.
 */
function preview(id: string, type: string): string {
  const maxW = type === 'widget' ? '440px' : '1000px';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${id} · preview</title>
<style>
*{box-sizing:border-box}
body{margin:0;font:14px/1.5 system-ui,-apple-system,sans-serif;background:#f4f5f7;color:#111827}
body.dark{background:#0e0e11;color:#e5e7eb}
header{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:inherit;z-index:2}
body.dark header{border-color:#27272a}
header strong{font-weight:600}.sp{flex:1}
label{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;opacity:.85}
select,button{font:inherit;font-size:13px;padding:5px 10px;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:inherit;cursor:pointer}
body.dark select,body.dark button{background:#1c1c21;border-color:#3f3f46;color:#e5e7eb}
.stage{padding:28px 20px;display:flex;justify-content:center}
.wrap{width:100%;max-width:${maxW}}
iframe{width:100%;border:0;background:transparent;min-height:120px;display:block}
.hint{font-size:12px;opacity:.55;text-align:center;padding:0 16px 20px}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:3}
.toast.on{opacity:.96}
</style></head>
<body>
<header>
  <strong>${id}</strong><span style="opacity:.5">· ${type} preview</span>
  <span class="sp"></span>
  <label>Theme <select id="theme"><option value="light">light</option><option value="dark">dark</option></select></label>
  <label>Accent <select id="accent"><option value="default">default</option><option value="indigo">indigo</option><option value="teal">teal</option><option value="rose">rose</option></select></label>
  <label><input type="checkbox" id="rm"> reduce motion</label>
  <label><input type="checkbox" id="nt"> no transparency</label>
  <label><input type="checkbox" id="trip" checked> trip context</label>
</header>
<div class="stage"><div class="wrap"><iframe id="f" src="/ui" sandbox="allow-scripts allow-forms" referrerpolicy="no-referrer" title="${id}"></iframe></div></div>
<p class="hint">The frame runs sandboxed at an opaque origin, exactly like TREK — <code>trek.invoke()</code> is proxied to your /api routes as the dev user.</p>
<div class="toast" id="toast"></div>
<script>
var f=document.getElementById('f');
var LA={"default":{"--accent":"#111827","--accent-text":"#fff","--accent-hover":"#1f2937","--accent-subtle":"#f1f5f9"},
indigo:{"--accent":"#4f46e5","--accent-text":"#fff","--accent-hover":"#4338ca","--accent-subtle":"#eef2ff"},
teal:{"--accent":"#0d9488","--accent-text":"#fff","--accent-hover":"#0f766e","--accent-subtle":"#f0fdfa"},
rose:{"--accent":"#e11d48","--accent-text":"#fff","--accent-hover":"#be123c","--accent-subtle":"#fff1f2"}};
var DA={"default":{"--accent":"#e4e4e7","--accent-text":"#09090b","--accent-hover":"#d4d4d8","--accent-subtle":"rgba(255,255,255,.08)"},
indigo:{"--accent":"#818cf8","--accent-text":"#09090b","--accent-hover":"#a5b4fc","--accent-subtle":"rgba(129,140,248,.18)"},
teal:{"--accent":"#2dd4bf","--accent-text":"#09090b","--accent-hover":"#5eead4","--accent-subtle":"rgba(45,212,191,.18)"},
rose:{"--accent":"#fb7185","--accent-text":"#09090b","--accent-hover":"#fda4af","--accent-subtle":"rgba(251,113,133,.18)"}};
function val(id){return document.getElementById(id);}
function ctx(){
  var theme=val("theme").value, accent=val("accent").value;
  document.body.classList.toggle("dark", theme==="dark");
  var tokens={}; var src=theme==="dark"?DA[accent]:LA[accent]; for(var k in src){tokens[k]=src[k];}
  return {type:"trek:context",theme:theme,locale:"en",hostOrigin:location.origin,
    tripId: val("trip").checked?42:null, userId:"1",
    user:{name:"Dev User",avatar:null,isAdmin:true},
    appearance:{scheme:accent,density:"comfortable",reducedMotion:val("rm").checked,noTransparency:val("nt").checked},
    formats:{locale:"en",currency:"EUR",timeFormat:"24h",distanceUnit:"metric",temperatureUnit:"celsius",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone},
    tokens:tokens};
}
function postCtx(){ if(f.contentWindow) f.contentWindow.postMessage(ctx(),"*"); }
var tt; function toast(msg){var el=document.getElementById("toast");el.textContent=msg;el.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){el.classList.remove("on");},2200);}
window.addEventListener("message", function(ev){
  if(ev.source!==f.contentWindow) return;
  var m=ev.data; if(!m||typeof m!=="object") return;
  if(m.type==="trek:ready"||m.type==="trek:context:request"){ postCtx(); }
  else if(m.type==="trek:resize"){ if(m.height>0) f.style.height=Math.min(m.height,2000)+"px"; }
  else if(m.type==="trek:notify"){ toast((m.level?("["+m.level+"] "):"")+(m.message||"")); }
  else if(m.type==="trek:navigate"){ toast("navigate \\u2192 "+m.to); }
  else if(m.type==="trek:openExternal"){ toast("openExternal \\u2192 "+m.url); try{ var u=new URL(String(m.url||"")); if(u.protocol==="https:"||u.protocol==="http:") window.open(u.href,"_blank","noopener,noreferrer"); }catch(e){} }
  else if(m.type==="trek:confirm"){
    // Mirror the host contract so trek.confirm() resolves in the preview too.
    var ok=window.confirm((m.title?m.title+"\\n\\n":"")+(m.message||""));
    f.contentWindow.postMessage({type:"trek:confirm:result",requestId:m.requestId,confirmed:ok},"*");
  }
  else if(m.type==="trek:invoke"){
    fetch("/api"+m.sub,{method:m.method||"GET",headers:{"content-type":"application/json"},body:m.body!=null?JSON.stringify(m.body):undefined})
      .then(function(r){var ct=r.headers.get("content-type")||"";return (ct.indexOf("json")>=0?r.json():r.text());})
      .then(function(data){ f.contentWindow.postMessage({type:"trek:response",requestId:m.requestId,data:data},"*"); })
      .catch(function(e){ f.contentWindow.postMessage({type:"trek:error",requestId:m.requestId,code:"error",message:String(e&&e.message||e)},"*"); });
  }
});
["theme","accent","rm","nt","trip"].forEach(function(id){ val(id).addEventListener("change",postCtx); });
f.addEventListener("load", function(){ f.style.height="120px"; postCtx(); });
var __v; setInterval(function(){ fetch("/__dev/version").then(function(r){return r.text();}).then(function(v){ if(__v&&v!==__v){ f.src=f.src; } __v=v; }).catch(function(){}); },1000);
</script>
</body></html>`;
}
