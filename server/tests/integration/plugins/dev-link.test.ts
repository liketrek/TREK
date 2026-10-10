/**
 * Dev-link (#plugins, developer experience): register a plugin from a LOCAL build
 * dir and hot-reload it against real data. Proves the link symlinks the source and
 * registers it INACTIVE as `local:link`, the gates (dev-only flag, absolute path,
 * built artifact, native binaries, don't-clobber-a-real-plugin, reload only a link),
 * and a full link -> activate -> reload loop through a real isolated child.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// Plan 3j Task 3: `discoverPlugins` (called from `runtime.link`) is repository-backed
// now (DI1–DI8) — a native `em.insert()` writes every `Opt`-defaulted entity column
// (`sort_order`, `installed_at`, `crash_count`, `update_hold`, …), not only the ones
// the legacy raw `INSERT` statement named, so a hand-trimmed `:memory:` table missing
// those columns throws inside `discoverPlugins`'s own try/catch (silently: the plugin
// lands in `skipped`, not `discovered`). A real MikroORM over the full migrated schema
// (`createSnapshotTestDb` + `createTestOrm`) replaces the old hand-rolled table set,
// same fix `registry.test.ts` needed.
import { createSnapshotTestDb } from '../../helpers/db-mock';

import { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { sharedTestOrm } from '../../helpers/test-uow';
import { findRow } from '../../helpers/factories/rows';
import { makePlugin } from '../../helpers/factories/plugins';
import { Plugins } from '../../../src/db/entities/Plugins.entity';

const testDb = createSnapshotTestDb();
const dbConn = testDb;

let codeRoot: string;
let dataRoot: string;
let srcRoot: string; // the "developer's" source lives OUTSIDE the plugins volume
let runtime: PluginRuntimeService;

const ROUTE = (v: string) =>
  `module.exports = { routes: [{ method: 'GET', path: '/v', auth: false, async handler() { return { status: 200, body: JSON.stringify({ v: ${v} }) }; } }] };`;

function writeSource(id: string, opts: { index?: string; native?: boolean; noBuild?: boolean; trek?: string } = {}): string {
  const dir = path.join(srcRoot, id);
  fs.mkdirSync(path.join(dir, 'server'), { recursive: true });
  // dev-link requires a `trek` range like any other install front door; `opts.trek`
  // overrides it to exercise the gate.
  fs.writeFileSync(path.join(dir, 'trek-plugin.json'), JSON.stringify({ id, name: id, version: '1.0.0', type: 'integration', permissions: [], trek: opts.trek ?? '>=3.0.0' }));
  if (!opts.noBuild) fs.writeFileSync(path.join(dir, 'server', 'index.js'), opts.index ?? 'module.exports = {};');
  if (opts.native) fs.writeFileSync(path.join(dir, 'server', 'addon.node'), '\0');
  return dir;
}

beforeAll(async () => {
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-link-code-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-link-data-'));
  srcRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-link-src-'));
  process.env.TREK_PLUGINS_DIR = codeRoot;
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
  process.env.TREK_PLUGINS_ENABLED = 'true';
  process.env.TREK_PLUGINS_DEV_LINK = '1';
  runtime = await createPluginRuntime(dbConn);
});

afterAll(async () => {
  await runtime?.onModuleDestroy();
  for (const r of [codeRoot, dataRoot, srcRoot]) fs.rmSync(r, { recursive: true, force: true });
  delete process.env.TREK_PLUGINS_DIR;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  delete process.env.TREK_PLUGINS_ENABLED;
  delete process.env.TREK_PLUGINS_DEV_LINK;
  testDb.close();
});

describe('PluginRuntimeService dev-link', () => {
  it('links a local dir: symlinks the source in and registers it inactive as local:link', async () => {
    const dir = writeSource('linkplug');
    const res = await runtime.link(dir);
    expect(res).toMatchObject({ id: 'linkplug', version: '1.0.0', replaced: false });

    const dest = path.join(codeRoot, 'linkplug');
    // a link (POSIX symlink or Windows junction) that resolves to the source build
    expect(fs.existsSync(path.join(dest, 'server', 'index.js'))).toBe(true);
    expect(fs.realpathSync(dest)).toBe(fs.realpathSync(dir));

    const row = await findRow(await sharedTestOrm(dbConn), Plugins, { id: 'linkplug' });
    expect(row).toMatchObject({ source_repo: 'local:link', status: 'inactive', enabled: 0 });
  });

  it('re-linking an existing link updates it in place (replaced=true)', async () => {
    const dir = writeSource('linkplug');
    const res = await runtime.link(dir);
    expect(res.replaced).toBe(true);
  });

  it('rejects a non-absolute path, a missing manifest, a missing build, and native binaries', async () => {
    await expect(runtime.link('relative/dir')).rejects.toThrow(/absolute/);
    await expect(runtime.link(path.join(srcRoot, 'ghost-dir'))).rejects.toThrow(/trek-plugin\.json/);
    await expect(runtime.link(writeSource('nobuild', { noBuild: true }))).rejects.toThrow(/server\/index\.js|build/);
    await expect(runtime.link(writeSource('nativeplug', { native: true }))).rejects.toThrow(/native/);
  });

  it('links a dir outside its TREK range when TREK_PLUGINS_IGNORE_TREK_RANGE is set, and says so', async () => {
    process.env.APP_VERSION = '3.3.0';
    process.env.TREK_PLUGINS_IGNORE_TREK_RANGE = '1';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await expect(runtime.link(writeSource('oldplug-bypass', { trek: '>=2.0.0 <3.0.0' }))).resolves.toMatchObject({
        id: 'oldplug-bypass', trekRangeBypassed: { trekRange: '>=2.0.0 <3.0.0', hostVersion: '3.3.0' },
      });
      await expect(runtime.link(writeSource('rangeless-bypass', { trek: '' }))).resolves.toMatchObject({
        id: 'rangeless-bypass', trekRangeBypassed: { trekRange: null, hostVersion: '3.3.0' },
      });
      // A dir that fits is a plain link — no marker to alarm anyone with.
      await expect(runtime.link(writeSource('fits-bypass'))).resolves.toMatchObject({ trekRangeBypassed: null });
    } finally {
      warn.mockRestore();
      delete process.env.APP_VERSION;
      delete process.env.TREK_PLUGINS_IGNORE_TREK_RANGE;
    }
  });

  it('rejects a local dir whose TREK range this server does not satisfy', async () => {
    // Dev-link is the third install front door, and it hands TREK code to RUN against real
    // data — the fact that the author is standing right there is not a reason to skip the
    // check that the code supports the host it is about to be spawned on.
    process.env.APP_VERSION = '3.3.0';
    try {
      await expect(runtime.link(writeSource('oldplug', { trek: '>=2.0.0 <3.0.0' }))).rejects.toMatchObject({
        code: 'TREK_VERSION_INCOMPATIBLE',
      });
      await expect(runtime.link(writeSource('rangeless', { trek: '' }))).rejects.toThrow(/missing "trek"/);
    } finally {
      delete process.env.APP_VERSION;
    }
  });

  it('refuses to clobber a real (non-linked) installed plugin of the same id', async () => {
    await makePlugin(await sharedTestOrm(dbConn), 'installed', {
      name: 'X', type: 'integration', version: '1.0.0', status: 'inactive', source_repo: 'local:upload',
    });
    await expect(runtime.link(writeSource('installed'))).rejects.toThrow(/already installed/);
  });

  it('is disabled unless TREK_PLUGINS_DEV_LINK=1', async () => {
    delete process.env.TREK_PLUGINS_DEV_LINK;
    try {
      await expect(runtime.link(writeSource('gated'))).rejects.toThrow(/disabled/);
      await expect(runtime.reload('linkplug')).rejects.toThrow(/disabled/);
    } finally {
      process.env.TREK_PLUGINS_DEV_LINK = '1';
    }
  });

  it('reload rejects an unknown or non-linked plugin', async () => {
    await expect(runtime.reload('ghost')).rejects.toThrow(/not found/);
    await expect(runtime.reload('installed')).rejects.toThrow(/not dev-linked/);
  });

  it('links, activates through a real isolated child, and reload() re-forks it (the hot-reload primitive)', async () => {
    const dir = writeSource('live', { index: ROUTE('1') });
    await runtime.link(dir);
    await runtime.activate('live');
    expect(runtime.isActive('live')).toBe(true);

    const before = (await runtime.invoke('live', 'invoke.route', { routeId: 0, req: {} })) as { body: string };
    expect(JSON.parse(before.body).v).toBe(1);

    await runtime.reload('live'); // deactivate -> activate, same grants, no re-consent
    expect(runtime.isActive('live')).toBe(true);

    const after = (await runtime.invoke('live', 'invoke.route', { routeId: 0, req: {} })) as { body: string };
    expect(JSON.parse(after.body).v).toBe(1);

    await runtime.deactivate('live').catch(() => {});
  });
});
