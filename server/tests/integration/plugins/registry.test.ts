/**
 * TREK-side registry service (#plugins, M5): browse the aggregated registry and
 * install a pinned version through the full verify -> extract -> validate ->
 * move -> register pipeline (with the network download mocked).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

const { safeDownload } = vi.hoisted(() => ({ safeDownload: vi.fn() }));
vi.mock('../../../src/nest/plugins/install/safe-fetch', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  safeDownload,
}));

const { testDb } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE plugins (id TEXT PRIMARY KEY, name TEXT, description TEXT, type TEXT, icon TEXT, version TEXT,
      api_version INTEGER, min_trek_version TEXT, permissions TEXT, capabilities TEXT DEFAULT '{}', granted_permissions TEXT, status TEXT, config TEXT,
      source_repo TEXT, source_commit TEXT, sha256 TEXT, reviewed_at TEXT, updated_at TEXT);
    CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, label TEXT, input_type TEXT, placeholder TEXT, hint TEXT, required INTEGER, secret INTEGER, scope TEXT, options TEXT, oauth_config TEXT, sort_order INTEGER);
    CREATE TABLE plugin_error_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, level TEXT, message TEXT, ts TEXT);`);
  return { testDb: db };
});
vi.mock('../../../src/db/database', () => ({ db: testDb, canAccessTrip: () => undefined }));

import { PluginRegistryService, RegistryError, __clearRegistryCacheForTests } from '../../../src/nest/plugins/registry/registry.service';

// ── tiny tar.gz builder (wraps the plugin in a codeload-style top dir) ────────
function tarHeader(name: string, size: number, typeflag = '0'): Buffer {
  const h = Buffer.alloc(512, 0);
  h.write(name, 0); h.write('0000644', 100); h.write('0000000', 108); h.write('0000000', 116);
  h.write(size.toString(8).padStart(11, '0'), 124); h.write('00000000000', 136);
  h.write('        ', 148); h.write(typeflag, 156); h.write('ustar\0', 257); h.write('00', 263);
  let sum = 0; for (let i = 0; i < 512; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return h;
}
function makeArtifact(manifest: object): Buffer {
  const files = [
    { name: 'plug-abc/', type: '5' as const, data: '' },
    { name: 'plug-abc/trek-plugin.json', type: '0' as const, data: JSON.stringify(manifest) },
    { name: 'plug-abc/server/', type: '5' as const, data: '' },
    { name: 'plug-abc/server/index.js', type: '0' as const, data: 'module.exports={}' },
  ];
  const parts: Buffer[] = [];
  for (const f of files) {
    const body = Buffer.from(f.data);
    parts.push(tarHeader(f.name, f.type === '5' ? 0 : body.length, f.type));
    if (f.type === '0') { parts.push(body); const pad = (512 - (body.length % 512)) % 512; if (pad) parts.push(Buffer.alloc(pad, 0)); }
  }
  parts.push(Buffer.alloc(1024, 0));
  return zlib.gzipSync(Buffer.concat(parts));
}

const REGISTRY = {
  schemaVersion: 1,
  plugins: [
    {
      id: 'flight-tracker', name: 'Flight', author: 'Acme', description: 'flights', repo: 'acme/trek-flight',
      type: 'widget', reviewedAt: '2026-06-20',
      versions: [{ version: '1.0.0', gitTag: 'v1.0.0', commitSha: 'a'.repeat(40), downloadUrl: 'https://codeload.github.com/acme/trek-flight/tar.gz/aaaa', sha256: '', minTrekVersion: '3.2.0' }],
    },
  ],
};

let dataRoot: string;
let codeRoot: string;
let svc: PluginRegistryService;

beforeEach(() => {
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-data-'));
  codeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-code-'));
  process.env.TREK_PLUGINS_DATA_DIR = dataRoot;
  process.env.TREK_PLUGINS_DIR = codeRoot;
  testDb.exec('DELETE FROM plugins; DELETE FROM plugin_settings_fields; DELETE FROM plugin_error_log');
  __clearRegistryCacheForTests();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => REGISTRY }) as unknown as Response));
  svc = new PluginRegistryService();
});
afterEach(() => {
  vi.unstubAllGlobals();
  safeDownload.mockReset();
  delete process.env.TREK_PLUGINS_DATA_DIR;
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(dataRoot, { recursive: true, force: true });
  fs.rmSync(codeRoot, { recursive: true, force: true });
});

describe('PluginRegistryService', () => {
  it('browse maps the aggregated registry to metadata', async () => {
    const list = await svc.browse();
    expect(list).toEqual([
      expect.objectContaining({ id: 'flight-tracker', name: 'Flight', latest: '1.0.0', minTrekVersion: '3.2.0', reviewedAt: '2026-06-20' }),
    ]);
  });

  it('fetchRegistry soft-fails to an empty registry on a cold cache', async () => {
    __clearRegistryCacheForTests();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect((await new PluginRegistryService().fetchRegistry()).plugins).toEqual([]);
  });

  it('installs a pinned version end to end (verify -> extract -> register inactive)', async () => {
    const artifact = makeArtifact({ id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', permissions: ['db:own'] });
    const sha = createHash('sha256').update(artifact).digest('hex');
    REGISTRY.plugins[0].versions[0].sha256 = sha;
    safeDownload.mockResolvedValue({ bytes: artifact, sha256: sha });

    const out = await svc.install('flight-tracker');
    expect(out).toEqual({ id: 'flight-tracker', version: '1.0.0' });

    // moved into place + registered inactive with provenance
    expect(fs.existsSync(path.join(codeRoot, 'flight-tracker', 'trek-plugin.json'))).toBe(true);
    const row = testDb.prepare("SELECT status, source_repo, source_commit FROM plugins WHERE id='flight-tracker'").get() as { status: string; source_repo: string; source_commit: string };
    expect(row).toMatchObject({ status: 'inactive', source_repo: 'acme/trek-flight', source_commit: 'a'.repeat(40) });
    // no staging left behind
    const staging = path.join(dataRoot, '.staging');
    expect(!fs.existsSync(staging) || fs.readdirSync(staging).length === 0).toBe(true);
  });

  it('rejects an sha256 mismatch', async () => {
    const artifact = makeArtifact({ id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget' });
    REGISTRY.plugins[0].versions[0].sha256 = 'b'.repeat(64);
    safeDownload.mockResolvedValue({ bytes: artifact, sha256: 'c'.repeat(64) });
    await expect(svc.install('flight-tracker')).rejects.toThrow(/integrity/);
  });

  it('rejects an unknown plugin id', async () => {
    await expect(svc.install('ghost')).rejects.toThrow(RegistryError);
  });

  it('caches the registry (one fetch across calls)', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => REGISTRY }) as unknown as Response);
    vi.stubGlobal('fetch', spy);
    __clearRegistryCacheForTests();
    await svc.fetchRegistry();
    await svc.fetchRegistry();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('soft-fails on a non-ok registry response', async () => {
    __clearRegistryCacheForTests();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response));
    expect((await svc.fetchRegistry()).plugins).toEqual([]);
  });

  it('rejects a version that is not listed', async () => {
    await expect(svc.install('flight-tracker', '9.9.9')).rejects.toThrow(/not found/);
  });

  it('rejects an archive without a manifest', async () => {
    const parts = [Buffer.alloc(1024, 0)]; // empty tar
    const empty = zlib.gzipSync(Buffer.concat(parts));
    REGISTRY.plugins[0].versions[0].sha256 = createHash('sha256').update(empty).digest('hex');
    safeDownload.mockResolvedValue({ bytes: empty, sha256: REGISTRY.plugins[0].versions[0].sha256 });
    await expect(svc.install('flight-tracker')).rejects.toThrow(/no trek-plugin.json/);
  });

  it('rejects a manifest id that does not match the registry id', async () => {
    const artifact = makeArtifact({ id: 'other-id', name: 'X', version: '1.0.0', type: 'widget' });
    REGISTRY.plugins[0].versions[0].sha256 = createHash('sha256').update(artifact).digest('hex');
    safeDownload.mockResolvedValue({ bytes: artifact, sha256: REGISTRY.plugins[0].versions[0].sha256 });
    await expect(svc.install('flight-tracker')).rejects.toThrow(/!=/);
  });
});
