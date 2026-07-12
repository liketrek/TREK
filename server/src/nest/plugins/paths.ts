import fs from 'node:fs';
import path from 'node:path';

/**
 * Filesystem layout for the plugin system (#plugins). Code and data are two
 * separate trees so the child can be given a read-only view of its code and a
 * read-write view of only its own data (M1 sets the env; the container runtime
 * in v2 enforces the mounts).
 *
 * Defaults sit under the persisted data dir (server/data), overridable by env
 * so a Docker deployment can point them at dedicated volumes.
 */

const DATA_ROOT = path.resolve(__dirname, '../../../data');

// Read lazily so a deployment (or a test) can point these at dedicated volumes
// via env without import-order surprises.
export function pluginsCodeRoot(): string {
  return process.env.TREK_PLUGINS_DIR || path.join(DATA_ROOT, 'plugins');
}
export function pluginsDataRoot(): string {
  return process.env.TREK_PLUGINS_DATA_DIR || path.join(DATA_ROOT, 'plugins-data');
}

/** A plugin's installed code directory (contains trek-plugin.json + server/index.js). */
export function pluginCodeDir(id: string): string {
  return path.join(pluginsCodeRoot(), id);
}

/**
 * The plugin code dir with symlinks resolved. The data root is often a symlink
 * (Docker mounts `server/data` -> a volume), and the OS permission model checks
 * REAL paths — forking the child from the real path keeps path resolution from
 * ever touching the symlinked parent (which would need a broad read grant).
 * Falls back to the lexical path if the dir does not exist yet.
 */
export function pluginRealCodeDir(id: string): string {
  try {
    return fs.realpathSync(pluginCodeDir(id));
  } catch {
    return pluginCodeDir(id);
  }
}

/**
 * Give a plugin its own `package.json` (only if it ships none) so Node resolves
 * the child's module type AT the plugin root and never walks up into the data
 * dir — which, under the permission model, is denied (that's the whole point).
 * Defaults to CommonJS, matching the plain `module.exports` plugins ship.
 */
export function ensurePluginModuleType(codeDir: string): void {
  try {
    const pkg = path.join(codeDir, 'package.json');
    if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, '{"type":"commonjs"}\n');
  } catch {
    /* best effort — a missing package.json only matters under --permission */
  }
}

/** A plugin's writable data directory (its own sqlite file + any blobs). */
export function pluginDataDir(id: string): string {
  return path.join(pluginsDataRoot(), id);
}

/** The plugin's own sqlite file — opened by the HOST, reached by the plugin only via RPC. */
export function pluginDbFile(id: string): string {
  return path.join(pluginDataDir(id), 'plugin.db');
}

/**
 * The child bootstrap entry + the execArgv to fork it with.
 *
 * Prod/dev run the tsc output, so the sibling `runtime/plugin-host-entry.js`
 * exists and forks as plain node. Under vitest the code runs from `src` as TS,
 * so no `.js` sibling exists — fall back to the `.ts` source loaded via tsx (a
 * prod dependency). This keeps the fork path identical in tests and production.
 */
export function resolveChildEntry(): { entry: string; execArgv: string[]; forkCwd?: string; jsMode: boolean } {
  const js = path.join(__dirname, 'runtime', 'plugin-host-entry.js');
  const ts = path.join(__dirname, 'runtime', 'plugin-host-entry.ts');
  if (!fs.existsSync(js) && fs.existsSync(ts)) {
    // tsx (dev/test only) is resolved relative to the child's cwd, so the child
    // must run from a dir where `tsx` is on the node_modules chain (the server
    // root) — NOT the plugin dir. The plugin itself is still loaded by absolute
    // path via createRequire, so this doesn't weaken the prod isolation, where
    // the .js branch below keeps cwd at the plugin dir. tsx compiles TS on the
    // fly and walks node_modules, so the OS-level permission model can't be
    // applied here — it is a prod-only hardening (jsMode).
    return { entry: ts, execArgv: ['--import', 'tsx'], forkCwd: process.cwd(), jsMode: false };
  }
  return { entry: js, execArgv: ['--max-old-space-size=192'], jsMode: true };
}

/**
 * The compiled server code root (…/dist), computed from this module's location.
 * The plugin child needs read access to it to load its bootstrap + SDK; it must
 * NOT be granted the data root (trek.db, .jwt_secret, .encryption_key live there).
 */
export function serverCodeRoot(): string {
  // __dirname = …/dist/nest/plugins  →  …/dist
  return path.resolve(__dirname, '../..');
}

/**
 * Node OS-level permission-model flags for a plugin child (#plugins, #2 security
 * hardening). `--permission` denies filesystem write, child_process, worker
 * threads and native addons outright; `--allow-fs-read` is scoped to exactly the
 * code the child must load (the compiled server dir + this plugin's own code
 * dir). Result: the child can no longer read trek.db / the secret files or shell
 * out, closing the direct-filesystem and RCE escapes that bypass the RPC layer.
 * Empty (opt-out) when TREK_PLUGIN_PERMISSIONS=off.
 */
let warnedPermissionsOff = false;
export function pluginPermissionArgs(pluginId: string): string[] {
  if ((process.env.TREK_PLUGIN_PERMISSIONS ?? 'on').toLowerCase() === 'off') {
    // The OS permission jail is the boundary that stops an installed plugin from
    // reading trek.db / the secret files / shelling out. Turning it off makes plugin
    // isolation crash-only — surface that loudly once so an operator can't leave it
    // off by accident.
    if (!warnedPermissionsOff) {
      warnedPermissionsOff = true;
      // eslint-disable-next-line no-console
      console.warn('[plugins] TREK_PLUGIN_PERMISSIONS=off — the OS permission jail is DISABLED; installed plugins run with full Node access to this process. Only use this on a machine you fully trust.');
    }
    return [];
  }
  const codeRoot = serverCodeRoot();
  return [
    '--permission',
    `--allow-fs-read=${codeRoot}`,
    // The server package.json sits one level above dist and Node reads it to
    // resolve the child's module type. Grant just that file — never its dir,
    // which also holds the `data` symlink to trek.db and the secret files.
    `--allow-fs-read=${path.join(codeRoot, '..', 'package.json')}`,
    // The plugin's own code, by REAL path (see pluginRealCodeDir).
    `--allow-fs-read=${pluginRealCodeDir(pluginId)}`,
  ];
}
