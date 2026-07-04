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
import { readJsonFile } from './json.js';

interface Fixtures {
  config?: Record<string, unknown>;
  trips?: Record<number, { members: number[]; data?: unknown; places?: unknown[]; reservations?: unknown[] }>;
  users?: Record<number, unknown>;
}
interface PluginRouteLike { method: string; path: string; auth?: boolean; handler: (req: unknown, ctx: unknown) => Promise<{ status: number; headers?: Record<string, string>; body?: unknown }>; }
interface PluginLike { onLoad?: (ctx: unknown) => unknown; routes?: PluginRouteLike[]; }

class PermissionDenied extends Error {}

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
        async query(sql: string, ...args: unknown[]) { return sq.prepare(sql).all(...flatBind(args)) as unknown[]; },
        async exec(sql: string, ...args: unknown[]) {
          if (args.length) { const r = sq.prepare(sql).run(...flatBind(args)); return { changes: Number(r.changes ?? 0) }; }
          sq.exec(sql); return { changes: 0 };
        },
        async migrate(id: string, sql: string) { if (applied.has(id)) return { applied: false }; sq.exec(sql); applied.add(id); return { applied: true }; },
      },
    };
  } catch {
    return {
      note: 'db:own → in-memory stub (upgrade to Node 22.5+ for a real SQLite dev db)',
      close: () => {},
      db: {
        async query() { return []; },
        async exec() { return { changes: 0 }; },
        async migrate() { return { applied: true }; },
      },
    };
  }
}

interface SqliteDb { prepare(sql: string): { all(...a: unknown[]): unknown[]; run(...a: unknown[]): { changes?: number | bigint } }; exec(sql: string): void; close(): void; }
interface PluginContextDb { query(sql: string, ...a: unknown[]): Promise<unknown[]>; exec(sql: string, ...a: unknown[]): Promise<{ changes: number }>; migrate(id: string, sql: string): Promise<{ applied: boolean }>; }

function createDevContext(id: string, grants: Set<string>, fx: Fixtures, db: PluginContextDb, broadcasts: unknown[]) {
  const need = (perm: string, method: string) => { if (!grants.has(perm)) throw new PermissionDenied(`PERMISSION_DENIED: ${method} requires ${perm}`); };
  const member = (tripId: number, asUser: number) => {
    const t = fx.trips?.[tripId];
    if (!t || !t.members.includes(asUser)) throw new Error(`RESOURCE_FORBIDDEN: no access to trip ${tripId}`);
    return t;
  };
  return {
    id, config: Object.freeze({ ...(fx.config ?? {}) }),
    db: {
      query: (sql: string, ...a: unknown[]) => { need('db:own', 'db.query'); return db.query(sql, ...a); },
      exec: (sql: string, ...a: unknown[]) => { need('db:own', 'db.exec'); return db.exec(sql, ...a); },
      migrate: (mid: string, sql: string) => { need('db:own', 'db.migrate'); return db.migrate(mid, sql); },
    },
    trips: {
      getById: async (t: number, u: number) => { need('db:read:trips', 'trips.getById'); return member(t, u).data ?? null; },
      getPlaces: async (t: number, u: number) => { need('db:read:trips', 'trips.getPlaces'); return member(t, u).places ?? []; },
      getReservations: async (t: number, u: number) => { need('db:read:trips', 'trips.getReservations'); return member(t, u).reservations ?? []; },
    },
    users: { getById: async (uid: number) => { need('db:read:users', 'users.getById'); return fx.users?.[uid] ?? null; } },
    ws: {
      broadcastToTrip: async (t: number, event: string, data: unknown) => { need('ws:broadcast:trip', 'ws.broadcastToTrip'); broadcasts.push({ kind: 'trip', target: t, event, data }); },
      broadcastToUser: async (u: number, event: string, data: unknown) => { need('ws:broadcast:user', 'ws.broadcastToUser'); broadcasts.push({ kind: 'user', target: u, event, data }); },
    },
    log: {
      info: (m: string) => console.log(`  [plugin] ${m}`),
      warn: (m: string) => console.warn(`  [plugin] ${m}`),
      error: (m: string) => console.error(`  [plugin] ${m}`),
    },
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
  const ctx = createDevContext(id, grants, fx, db, broadcasts);

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
    if (url.pathname === '/') return send(200, dashboard(id, String(manifest.type), plugin.routes ?? [], dbNote, broadcasts.length), 'text/html; charset=utf-8');

    // Static plugin UI at /ui (page/widget client bundle)
    if (url.pathname === '/ui' || url.pathname.startsWith('/ui/')) {
      const relFile = url.pathname === '/ui' ? 'index.html' : url.pathname.slice('/ui/'.length);
      const file = path.join(abs, 'client', relFile);
      if (!file.startsWith(path.join(abs, 'client'))) return send(403, 'forbidden');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(404, 'not found — build your client/ bundle');
      const raw = fs.readFileSync(file);
      const type = contentType(file);
      // Only the HTML doc is rewritten (live-reload inject) as a string; every other
      // asset is sent as the raw Buffer — a UTF-8 round-trip corrupts binary files.
      const body: string | Buffer = type.startsWith('text/html')
        ? String(raw).replace('</body>', `${LIVE_RELOAD}</body>`)
        : raw;
      return send(200, body, type);
    }

    // Plugin API routes mounted under /api/<route path>
    if (url.pathname.startsWith('/api/')) {
      const pluginPath = url.pathname.slice('/api'.length); // "/api/hello" -> "/hello"
      const route = (plugin.routes ?? []).find((r) => r.method.toUpperCase() === request.method && r.path === pluginPath);
      if (!route) return send(404, `no ${request.method} route ${pluginPath}`);
      const anon = url.searchParams.get('_anon') === '1';
      if (route.auth !== false && anon) return send(401, 'this route requires auth (drop ?_anon=1 to send the dev user)');
      const user = anon ? null : { id: 1, username: 'dev', isAdmin: true };
      const body = await readBody(request);
      const query: Record<string, unknown> = {}; url.searchParams.forEach((v, k) => { if (k !== '_anon') query[k] = v; });
      try {
        const r = await route.handler({ method: route.method, path: route.path, query, body, user }, ctx);
        const out = typeof r.body === 'string' || Buffer.isBuffer(r.body) ? String(r.body) : JSON.stringify(r.body ?? null);
        return send(r.status ?? 200, out, r.headers?.['content-type'] || 'application/json; charset=utf-8', r.headers ?? {});
      } catch (e) {
        const denied = e instanceof PermissionDenied;
        return send(denied ? 403 : 500, (e instanceof Error ? e.message : String(e)));
      }
    }
    return send(404, 'not found');
  }

  const port = opts.port ?? 4317;
  await new Promise<void>((resolve, reject) => {
    server.once('error', (e: NodeJS.ErrnoException) =>
      reject(e.code === 'EADDRINUSE' ? new Error(`port ${port} is already in use — pass --port <n> to pick another`) : e));
    server.listen(port, resolve);
  });
  const routes = plugin.routes ?? [];
  console.log(`\n  trek-plugin dev — ${id} (${String(manifest.type)})`);
  console.log(`  ${dbNote}`);
  console.log(`  granted: ${[...grants].join(', ') || '(none)'}`);
  console.log(`\n  ▸ http://localhost:${port}/        dashboard`);
  if (String(manifest.type) !== 'integration') console.log(`  ▸ http://localhost:${port}/ui      your plugin UI`);
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
  const ui = type !== 'integration' ? `<p><a href="/ui">▸ open your plugin UI (/ui)</a></p>` : '';
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
