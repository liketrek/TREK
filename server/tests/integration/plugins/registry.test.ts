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
import { createHash, generateKeyPairSync, sign as edSign } from 'node:crypto';

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
      api_version INTEGER, min_trek_version TEXT, permissions TEXT, capabilities TEXT DEFAULT '{}', dependencies TEXT DEFAULT '{}', operator_egress INTEGER DEFAULT 0, granted_permissions TEXT, status TEXT, enabled INTEGER DEFAULT 0, config TEXT,
      source_repo TEXT, source_commit TEXT, sha256 TEXT, reviewed_at TEXT, author_pubkey TEXT, updated_at TEXT);
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
  delete (REGISTRY.plugins[0] as { authorPublicKey?: string }).authorPublicKey;
  delete (REGISTRY.plugins[0].versions[0] as { signature?: string }).signature;
  delete process.env.TREK_PLUGINS_DATA_DIR;
  delete process.env.TREK_PLUGINS_DIR;
  fs.rmSync(dataRoot, { recursive: true, force: true });
  fs.rmSync(codeRoot, { recursive: true, force: true });
});

/** Ed25519 keypair as (raw 32-byte pubkey base64, raw-signature signer). */
function signingKey() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    pubB64: (publicKey.export({ format: 'der', type: 'spki' }).subarray(-32) as Buffer).toString('base64'),
    sign: (b: Buffer) => (edSign(null, b, privateKey) as Buffer).toString('base64'),
  };
}
function stageSignedArtifact(pubB64: string, sig: (b: Buffer) => string): Buffer {
  const artifact = makeArtifact({ id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', permissions: ['db:own'] });
  REGISTRY.plugins[0].versions[0].sha256 = createHash('sha256').update(artifact).digest('hex');
  (REGISTRY.plugins[0] as { authorPublicKey?: string }).authorPublicKey = pubB64;
  (REGISTRY.plugins[0].versions[0] as { signature?: string }).signature = sig(artifact);
  safeDownload.mockResolvedValue({ bytes: artifact, sha256: REGISTRY.plugins[0].versions[0].sha256 });
  return artifact;
}

describe('PluginRegistryService', () => {
  it('browse maps the aggregated registry to metadata', async () => {
    const list = await svc.browse();
    expect(list).toEqual([
      expect.objectContaining({ id: 'flight-tracker', name: 'Flight', latest: '1.0.0', minTrekVersion: '3.2.0', reviewedAt: '2026-06-20' }),
    ]);
  });

  it('browse exposes a screenshot url pinned at the reviewed commit', async () => {
    const list = await svc.browse();
    expect(list[0].screenshotUrl).toBe(`https://raw.githubusercontent.com/acme/trek-flight/${'a'.repeat(40)}/docs/screenshot.png`);
  });

  it('detail merges registry metadata with a live manifest preview', async () => {
    safeDownload.mockResolvedValue({
      bytes: Buffer.from(JSON.stringify({
        id: 'flight-tracker', permissions: ['db:read:trips', 'http:outbound'], egress: ['api.example.com'],
        settings: [{ key: 'api_key', label: 'API Key', input_type: 'password', scope: 'instance', required: true, secret: true }],
        license: 'MIT', icon: 'Plane',
      })),
      sha256: 'unused',
    });
    const d = await svc.detail('flight-tracker');
    expect(safeDownload).toHaveBeenCalledWith(
      `https://raw.githubusercontent.com/acme/trek-flight/${'a'.repeat(40)}/trek-plugin.json`,
      expect.any(Number),
    );
    expect(d).toMatchObject({
      id: 'flight-tracker', repo: 'acme/trek-flight', latest: '1.0.0', reviewedAt: '2026-06-20',
      screenshotUrl: `https://raw.githubusercontent.com/acme/trek-flight/${'a'.repeat(40)}/docs/screenshot.png`,
      manifest: {
        permissions: ['db:read:trips', 'http:outbound'],
        egress: ['api.example.com'],
        settings: [{ key: 'api_key', label: 'API Key', inputType: 'password', scope: 'instance', required: true }],
        license: 'MIT', icon: 'Plane',
      },
    });
  });

  it('detail soft-fails the manifest fetch (registry metadata still renders)', async () => {
    safeDownload.mockRejectedValue(new Error('offline'));
    const d = await svc.detail('flight-tracker');
    expect(d).toMatchObject({ id: 'flight-tracker', manifest: null });
  });

  it('detail tolerates a malformed manifest shape', async () => {
    safeDownload.mockResolvedValue({
      bytes: Buffer.from(JSON.stringify({ permissions: 'not-an-array', settings: [{ label: 'no key' }], egress: [7, 'ok.host'] })),
      sha256: 'unused',
    });
    const d = (await svc.detail('flight-tracker')) as { manifest: { permissions: string[]; egress: string[]; settings: unknown[] } };
    expect(d.manifest).toMatchObject({ permissions: [], egress: ['ok.host'], settings: [] });
  });

  it('detail surfaces operatorEgress, so the pre-install review can say the host list is not the whole story', async () => {
    safeDownload.mockResolvedValue({
      bytes: Buffer.from(JSON.stringify({ permissions: ['http:outbound:gotify.net'], egress: ['gotify.net'], operatorEgress: true })),
      sha256: 'unused',
    });
    const d = (await svc.detail('flight-tracker')) as { manifest: { operatorEgress: boolean; egress: string[] } };
    expect(d.manifest).toMatchObject({ egress: ['gotify.net'], operatorEgress: true });
  });

  it('detail defaults operatorEgress to false (an ordinary plugin must not claim it)', async () => {
    safeDownload.mockResolvedValue({
      bytes: Buffer.from(JSON.stringify({ permissions: [], egress: ['api.example.com'] })),
      sha256: 'unused',
    });
    const d = (await svc.detail('flight-tracker')) as { manifest: { operatorEgress: boolean } };
    expect(d.manifest.operatorEgress).toBe(false);
  });

  it('detail is cached per plugin (one manifest fetch across calls)', async () => {
    safeDownload.mockResolvedValue({ bytes: Buffer.from('{}'), sha256: 'unused' });
    await svc.detail('flight-tracker');
    await svc.detail('flight-tracker');
    expect(safeDownload).toHaveBeenCalledTimes(1);
  });

  it('detail does not negative-cache a failed manifest fetch (next open retries)', async () => {
    safeDownload.mockRejectedValueOnce(new Error('github hiccup'));
    const first = (await svc.detail('flight-tracker')) as { manifest: unknown };
    expect(first.manifest).toBeNull();
    safeDownload.mockResolvedValue({ bytes: Buffer.from(JSON.stringify({ permissions: ['db:own'] })), sha256: 'unused' });
    const second = (await svc.detail('flight-tracker')) as { manifest: { permissions: string[] } };
    expect(second.manifest).toMatchObject({ permissions: ['db:own'] });
    expect(safeDownload).toHaveBeenCalledTimes(2);
  });

  it('detail rejects an unknown plugin id', async () => {
    await expect(svc.detail('ghost')).rejects.toThrow(RegistryError);
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

  it('force refresh bypasses the cache and busts the CDN', async () => {
    const spy = vi.fn(async () => ({ ok: true, json: async () => REGISTRY }) as unknown as Response);
    vi.stubGlobal('fetch', spy);
    __clearRegistryCacheForTests();
    await svc.fetchRegistry();       // primes the 30-min cache (fetch #1)
    await svc.fetchRegistry(true);   // force → refetches despite the warm cache
    expect(spy).toHaveBeenCalledTimes(2);
    const [url, opts] = spy.mock.calls[1] as unknown as [string | URL, { headers?: Record<string, string> }];
    expect(String(url)).toMatch(/[?&]_=\d+/);            // cache-buster query
    expect(opts.headers?.['Cache-Control']).toBe('no-cache');
  });

  // ── Sideload (upload your own plugin) ────────────────────────────────────────
  it('sideload: stage + commit installs an uploaded plugin INACTIVE as local:upload', () => {
    const zip = makeArtifact({ id: 'my-upload', name: 'Uploaded', version: '2.0.0', type: 'widget', permissions: ['db:own'] });
    const staged = svc.stageUpload(zip);
    expect(staged.id).toBe('my-upload');
    expect(staged.version).toBe('2.0.0');

    svc.commitUpload(staged);

    const row = testDb.prepare('SELECT status, source_repo, reviewed_at, version FROM plugins WHERE id = ?').get('my-upload') as
      { status: string; source_repo: string | null; reviewed_at: string | null; version: string } | undefined;
    expect(row?.status).toBe('inactive');       // never auto-activates
    expect(row?.source_repo).toBe('local:upload');
    expect(row?.reviewed_at).toBeNull();        // unsigned + unreviewed → flagged in the UI
    expect(row?.version).toBe('2.0.0');
    expect(fs.existsSync(path.join(codeRoot, 'my-upload', 'trek-plugin.json'))).toBe(true);
    expect(fs.existsSync(staged.stagingDir)).toBe(false); // staging cleaned up
  });

  it('sideload: rejects an oversized archive', () => {
    expect(() => svc.stageUpload(Buffer.alloc(50 * 1024 * 1024 + 8192))).toThrow(/50MB|exceed/i);
  });

  it('sideload: rejects an archive without a manifest', () => {
    const empty = zlib.gzipSync(Buffer.alloc(1024, 0)); // valid gzip, empty tar
    expect(() => svc.stageUpload(empty)).toThrow(/trek-plugin\.json/);
  });

  it('sideload: forces INACTIVE even when replacing a plugin that was active', () => {
    const zip = () => makeArtifact({ id: 'my-upload', name: 'Uploaded', version: '2.0.0', type: 'widget', permissions: ['db:own'] });
    svc.commitUpload(svc.stageUpload(zip()));                                            // first install
    testDb.prepare("UPDATE plugins SET status = 'active', enabled = 1 WHERE id = 'my-upload'").run(); // admin activated it
    svc.commitUpload(svc.stageUpload(zip()));                                            // re-upload replaces the code
    const row = testDb.prepare('SELECT status, enabled FROM plugins WHERE id = ?').get('my-upload') as { status: string; enabled: number };
    expect(row.status).toBe('inactive');   // discoverPlugins keeps the old status; commitUpload floors it back to inactive
    expect(row.enabled).toBe(0);
  });

  it('soft-fails on a non-ok registry response', async () => {
    __clearRegistryCacheForTests();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response));
    expect((await svc.fetchRegistry()).plugins).toEqual([]);
  });

  it('rejects a version that is not listed', async () => {
    await expect(svc.install('flight-tracker', { version: '9.9.9' })).rejects.toThrow(/not found/);
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

  it('installs a signed plugin and pins the author key (TOFU)', async () => {
    const k = signingKey();
    stageSignedArtifact(k.pubB64, k.sign);
    await expect(svc.install('flight-tracker')).resolves.toEqual({ id: 'flight-tracker', version: '1.0.0' });
    const row = testDb.prepare("SELECT author_pubkey FROM plugins WHERE id='flight-tracker'").get() as { author_pubkey: string };
    expect(row.author_pubkey).toBe(k.pubB64);
  });

  it('rejects a signed plugin whose signature does not verify', async () => {
    const k = signingKey();
    stageSignedArtifact(k.pubB64, () => k.sign(Buffer.from('different bytes')));
    await expect(svc.install('flight-tracker')).rejects.toThrow(/signature verification failed/);
  });

  it('rejects an update whose author key differs from the pinned one (TOFU mismatch)', async () => {
    const a = signingKey();
    stageSignedArtifact(a.pubB64, a.sign);
    await svc.install('flight-tracker');
    const b = signingKey();
    stageSignedArtifact(b.pubB64, b.sign); // valid signature, but a different author key
    await expect(svc.install('flight-tracker')).rejects.toThrow(/author signing key changed/);
  });

  it('rejects a half-signed entry (key without a signature)', async () => {
    const artifact = makeArtifact({ id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', permissions: ['db:own'] });
    REGISTRY.plugins[0].versions[0].sha256 = createHash('sha256').update(artifact).digest('hex');
    (REGISTRY.plugins[0] as { authorPublicKey?: string }).authorPublicKey = signingKey().pubB64; // no version signature
    safeDownload.mockResolvedValue({ bytes: artifact, sha256: REGISTRY.plugins[0].versions[0].sha256 });
    await expect(svc.install('flight-tracker')).rejects.toThrow(/incomplete signature/);
  });

  it('refuses to downgrade a previously-signed plugin to an unsigned update', async () => {
    const k = signingKey();
    stageSignedArtifact(k.pubB64, k.sign);
    await svc.install('flight-tracker');
    // now offer an unsigned update
    const artifact = makeArtifact({ id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', permissions: ['db:own'] });
    REGISTRY.plugins[0].versions[0].sha256 = createHash('sha256').update(artifact).digest('hex');
    delete (REGISTRY.plugins[0] as { authorPublicKey?: string }).authorPublicKey;
    delete (REGISTRY.plugins[0].versions[0] as { signature?: string }).signature;
    safeDownload.mockResolvedValue({ bytes: artifact, sha256: REGISTRY.plugins[0].versions[0].sha256 });
    await expect(svc.install('flight-tracker')).rejects.toThrow(/unsigned/);
  });
});

describe('PluginRegistryService.resolveVersion (latest compatible)', () => {
  const MULTI = {
    schemaVersion: 1,
    plugins: [{
      id: 'multi', name: 'Multi', author: 'a', description: 'many versions', repo: 'a/b', type: 'integration',
      versions: [
        { version: '2.1.0', gitTag: 'v2.1.0', commitSha: 'a'.repeat(40), downloadUrl: 'https://codeload.github.com/a/b/tar.gz/x', sha256: '', minTrekVersion: '3.4.0' },
        { version: '2.0.0', gitTag: 'v2.0.0', commitSha: 'a'.repeat(40), downloadUrl: 'https://codeload.github.com/a/b/tar.gz/y', sha256: '', minTrekVersion: '3.2.0' },
        { version: '1.5.0', gitTag: 'v1.5.0', commitSha: 'a'.repeat(40), downloadUrl: 'https://codeload.github.com/a/b/tar.gz/z', sha256: '', minTrekVersion: '3.0.0' },
      ],
    }],
  };
  const stub = () => { __clearRegistryCacheForTests(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => MULTI }) as unknown as Response)); };

  it('picks the highest version compatible with the running TREK', async () => {
    process.env.APP_VERSION = '3.3.0'; stub();
    expect((await svc.resolveVersion('multi')).version).toBe('2.0.0'); // 2.1.0 needs 3.4.0 > host
    delete process.env.APP_VERSION;
  });
  it('picks the highest version satisfying a semver range', async () => {
    process.env.APP_VERSION = '3.3.0'; stub();
    expect((await svc.resolveVersion('multi', '>=1.0.0 <2.0.0')).version).toBe('1.5.0');
    delete process.env.APP_VERSION;
  });
  it('throws when nothing satisfies the constraint', async () => {
    process.env.APP_VERSION = '3.3.0'; stub();
    await expect(svc.resolveVersion('multi', '>=9.0.0')).rejects.toThrow(RegistryError);
    delete process.env.APP_VERSION;
  });
  it('throws for a plugin not in the registry', async () => {
    stub();
    await expect(svc.resolveVersion('nope')).rejects.toThrow(/not in registry/);
  });
});
