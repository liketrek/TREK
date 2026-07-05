import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { definePlugin, PLUGIN_API_VERSION, validateManifest, createMockHost } from '../src/index.js';
import { scaffold } from '../src/cli/create.js';
import { validatePluginDir } from '../src/cli/validate.js';
import { makeZip, listZipNames } from '../src/zip.js';
import { packPluginDir } from '../src/cli/pack.js';
import { buildEntry } from '../src/cli/entry.js';
import { generateKeypair, signArtifact, publicKeyBase64, verifyArtifact, loadPrivateKey } from '../src/cli/sign.js';

/** A central-directory zip reader mirroring the TREK server's, to prove round-trip. */
function readZip(buf: Buffer): Record<string, Buffer> {
  let e = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  const count = buf.readUInt16LE(e + 8);
  let p = buf.readUInt32LE(e + 16);
  const out: Record<string, Buffer> = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const dataStart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const comp = buf.subarray(dataStart, dataStart + compSize);
    out[name] = method === 0 ? Buffer.from(comp) : zlib.inflateRawSync(comp);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

describe('definePlugin + api version', () => {
  it('returns the definition and exposes the api version', () => {
    const def = { onLoad: async () => {} };
    expect(definePlugin(def)).toBe(def);
    expect(PLUGIN_API_VERSION).toBe(1);
  });
});

describe('validateManifest', () => {
  const base = { id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', apiVersion: 1 };
  it('accepts a valid manifest', () => {
    expect(validateManifest(base).ok).toBe(true);
  });
  it('collects every problem', () => {
    const r = validateManifest({ id: 'Bad', version: '1.x', type: 'nope', permissions: ['fs:read'] });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(2);
  });
  it('requires egress when http:outbound is declared', () => {
    expect(validateManifest({ ...base, permissions: ['http:outbound'] }).ok).toBe(false);
    expect(validateManifest({ ...base, permissions: ['http:outbound'], egress: ['api.x.com'] }).ok).toBe(true);
  });
  it('rejects native modules and non-objects', () => {
    expect(validateManifest({ ...base, nativeModules: true }).ok).toBe(false);
    expect(validateManifest('nope').ok).toBe(false);
  });
});

describe('createMockHost', () => {
  it('enforces the granted permission set', async () => {
    const { ctx } = createMockHost({ grants: ['db:own'] });
    await expect(ctx.db.migrate('1', 'CREATE TABLE t (x)')).resolves.toEqual({ applied: true });
    await expect(ctx.trips.getById(1, 1)).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('membership-checks trip reads and records broadcasts', async () => {
    const { ctx, broadcasts } = createMockHost({
      grants: ['db:read:trips', 'ws:broadcast:trip'],
      trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
    });
    await expect(ctx.trips.getById(1, 99)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    expect(await ctx.trips.getById(1, 42)).toEqual({ id: 1, name: 'Japan' });
    await ctx.ws.broadcastToTrip(1, 'ping', { a: 1 });
    expect(broadcasts).toEqual([{ kind: 'trip', target: 1, event: 'ping', data: { a: 1 } }]);
  });

  it('returns canned db.query results + records logs', async () => {
    const { ctx, logs } = createMockHost({ grants: ['db:own'], queryResults: { 'SELECT 1': [{ n: 1 }] } });
    expect(await ctx.db.query('SELECT 1')).toEqual([{ n: 1 }]);
    ctx.log.info('hi');
    expect(logs).toEqual([{ level: 'info', msg: 'hi' }]);
  });

  it('gates costs reads/writes on the grant, addon, membership and edit permission', async () => {
    const { ctx } = createMockHost({
      grants: ['db:read:costs', 'db:write:costs'],
      actingUserId: 42,
      trips: {
        1: { members: [42], costs: [{ id: 5, name: 'Hotel' }] },
        2: { members: [42], costs: [{ id: 6, name: 'Food' }], canEditCosts: false },
      },
    });
    // read: trip-scoped + cross-trip aggregate
    expect(await ctx.costs.getByTrip(1)).toEqual([{ id: 5, name: 'Hotel' }]);
    expect(await ctx.costs.listMine()).toEqual([{ id: 5, name: 'Hotel' }, { id: 6, name: 'Food' }]);
    // write: allowed where the user may edit, refused where they may not
    expect(await ctx.costs.create(1, { name: 'Taxi' })).toMatchObject({ trip_id: 1, name: 'Taxi' });
    await expect(ctx.costs.create(2, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // update: edits an existing item where allowed, refused without edit permission
    expect(await ctx.costs.update(1, 5, { name: 'Hostel' })).toMatchObject({ id: 5, name: 'Hostel' });
    await expect(ctx.costs.update(2, 6, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // update: a missing item is refused
    await expect(ctx.costs.update(1, 999, { name: 'X' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // delete: removes where allowed, refused without edit permission / when missing
    expect(await ctx.costs.delete(1, 5)).toEqual({ deleted: true });
    await expect(ctx.costs.delete(2, 6)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    await expect(ctx.costs.delete(1, 999)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('gates planner writes (places/days/itinerary/trips) on grant, membership and edit permission', async () => {
    const { ctx } = createMockHost({
      grants: ['db:write:places', 'db:write:days', 'db:write:itinerary', 'db:write:trips'],
      actingUserId: 42,
      trips: {
        1: { members: [42], data: { id: 1, title: 'Japan' } },
        2: { members: [42], canEditPlaces: false },
      },
    });
    // create + assign on a trip the user may edit
    const place = await ctx.places.create(1, { name: 'Fushimi Inari' });
    expect(place).toMatchObject({ trip_id: 1, name: 'Fushimi Inari' });
    const day = await ctx.days.create(1, { notes: 'Day 1' });
    expect(await ctx.itinerary.assign(1, (day as { id: number }).id, (place as { id: number }).id))
      .toMatchObject({ day_id: (day as { id: number }).id });
    expect(await ctx.trips.update(1, { title: 'Renamed' })).toMatchObject({ title: 'Renamed' });
    // refused where the user may not edit
    await expect(ctx.places.create(2, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('refuses a planner write without the matching write scope', async () => {
    const { ctx } = createMockHost({ grants: ['db:read:trips'], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ctx.places.create(1, { name: 'X' })).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('ctx.meta stores/reads/lists/deletes namespaced metadata, gated on db:meta', async () => {
    const { ctx } = createMockHost({ grants: ['db:meta'], actingUserId: 42, trips: { 1: { members: [42] } } });
    await ctx.meta.set('trip', 1, 'rating', 5);
    expect(await ctx.meta.get('trip', 1, 'rating')).toBe(5);
    expect(await ctx.meta.list('trip', 1)).toEqual({ rating: 5 });
    expect(await ctx.meta.delete('trip', 1, 'rating')).toEqual({ deleted: true });
    expect(await ctx.meta.get('trip', 1, 'rating')).toBe(null);
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ungranted.ctx.meta.get('trip', 1, 'x')).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('refuses costs when the permission is missing or the addon is disabled', async () => {
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ungranted.ctx.costs.getByTrip(1)).rejects.toThrow(/PERMISSION_DENIED/);

    const addonOff = createMockHost({
      grants: ['db:read:costs'],
      actingUserId: 42,
      budgetAddonEnabled: false,
      trips: { 1: { members: [42], costs: [] } },
    });
    await expect(addonOff.ctx.costs.getByTrip(1)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });
});

describe('scaffold + validate CLIs', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('scaffolds a widget plugin that then validates (with README warnings)', () => {
    scaffold('my-widget', 'widget', tmp);
    const dir = path.join(tmp, 'my-widget');
    expect(fs.existsSync(path.join(dir, 'trek-plugin.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'server', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'client', 'index.html'))).toBe(true);

    const r = validatePluginDir(dir);
    expect(r.ok).toBe(true); // manifest + files valid
    expect(r.warnings.some((w) => /placeholder|screenshot/.test(w))).toBe(true); // README is the unfilled template
  });

  it('scaffolds a client that opts into the design kit via the marker (source stays one line)', () => {
    scaffold('kit-plug', 'widget', tmp);
    const html = fs.readFileSync(path.join(tmp, 'kit-plug', 'client', 'index.html'), 'utf8');
    expect(html).toContain('<!-- trek:ui -->'); // the one-line opt-in
    expect(html).toContain('trek.onContext');   // uses the bridge the marker installs
    expect(html).not.toContain('--glass-bg');    // kit is NOT pre-inlined in the source
  });

  it('scaffolds a trip-page plugin (a tab inside the trip) with a client UI', () => {
    scaffold('trip-diary', 'trip-page', tmp);
    const dir = path.join(tmp, 'trip-diary');
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8'));
    expect(m.type).toBe('trip-page');
    expect(fs.existsSync(path.join(dir, 'client', 'index.html'))).toBe(true); // non-integration → gets a UI
    expect(validatePluginDir(dir).ok).toBe(true);
  });

  it('pack expands the design-kit marker into the archived client HTML', () => {
    scaffold('kit-plug', 'widget', tmp);
    const out = path.join(tmp, 'kit-plug.zip');
    packPluginDir(path.join(tmp, 'kit-plug'), out);
    const html = readZip(fs.readFileSync(out))['client/index.html'].toString('utf8');
    expect(html).not.toContain('<!-- trek:ui -->'); // expanded away
    expect(html).toContain('.trek-glass');          // kit CSS inlined
    expect(html).toContain('window.trek');          // bridge inlined
  });

  it('scaffolds a CommonJS package.json with the SDK as a devDependency only', () => {
    scaffold('my-widget', 'widget', tmp);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'my-widget', 'package.json'), 'utf8'));
    expect(pkg.type).toBe('commonjs');
    expect(pkg.private).toBe(true);
    expect(pkg.devDependencies['trek-plugin-sdk']).toMatch(/^\^\d/);
    expect(pkg.dependencies).toBeUndefined(); // runtime deps are the author's call; the SDK never is one
  });

  it('applies author, description, and permissions from options', () => {
    scaffold('opt-plug', 'integration', tmp, { author: 'Jane', description: 'Does X', permissions: ['db:own', 'db:read:trips'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'opt-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.author).toBe('Jane');
    expect(m.description).toBe('Does X');
    expect(m.permissions).toEqual(['db:own', 'db:read:trips']);
  });

  it('rejects an invalid plugin name', () => {
    expect(() => scaffold('Bad Name', 'widget', tmp)).toThrow(/invalid plugin id/);
  });

  it('tolerates a UTF-8 BOM in trek-plugin.json (Windows editors add one)', () => {
    scaffold('bom-plug', 'integration', tmp);
    const mp = path.join(tmp, 'bom-plug', 'trek-plugin.json');
    fs.writeFileSync(mp, '\uFEFF' + fs.readFileSync(mp, 'utf8'));
    expect(validatePluginDir(path.join(tmp, 'bom-plug')).ok).toBe(true);
  });

  it('validatePluginDir flags a missing manifest', () => {
    expect(validatePluginDir(tmp).ok).toBe(false);
  });
});

describe('dev-server SDK injection', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inject-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('makes require(trek-plugin-sdk) resolve from the package itself — no npm install', async () => {
    const { installSdkInjection } = await import('../src/cli/dev.js');
    const { createRequire } = await import('node:module');
    installSdkInjection();
    // A scaffold-shaped CJS entry that requires the SDK without any node_modules.
    // The injected surface must MATCH the prod child shim: definePlugin +
    // PLUGIN_API_VERSION only, subpaths throw the same pointed error.
    fs.writeFileSync(path.join(tmp, 'entry.cjs'),
      "const sdkShim = require('trek-plugin-sdk');\n" +
      "let testingError = '';\n" +
      "try { require('trek-plugin-sdk/testing'); } catch (e) { testingError = e.message; }\n" +
      'module.exports = { def: sdkShim.definePlugin({ routes: [] }), api: sdkShim.PLUGIN_API_VERSION, keys: Object.keys(sdkShim).sort(), testingError };\n');
    const req = createRequire(path.join(tmp, 'entry.cjs'));
    const mod = req(path.join(tmp, 'entry.cjs')) as { def: unknown; api: number; keys: string[]; testingError: string };
    expect(mod.def).toEqual({ routes: [] });
    expect(mod.api).toBe(1);
    expect(mod.keys).toEqual(['PLUGIN_API_VERSION', 'definePlugin']); // prod parity — no dev-only extras
    expect(mod.testingError).toMatch(/build\/test-time/);
  });
});

describe('dev db bind shapes', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devdb-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  // Without node:sqlite (Node < 22.5) createDevDb falls back to the [] stub and
  // there is no bind behaviour to test.
  const hasNodeSqlite = (() => {
    try { createRequire(import.meta.url)('node:sqlite'); return true; } catch { return false; }
  })();

  it.runIf(hasNodeSqlite)('accepts spread args AND a single array of them, like the real host', async () => {
    const { createDevDb } = await import('../src/cli/dev.js');
    const { db, close } = createDevDb(path.join(tmp, 'db.sqlite'));
    try {
      await db.migrate('001', 'CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT)');
      await db.exec('INSERT INTO kv (k, v) VALUES (?, ?)', ['a', '1']); // array form (better-sqlite3 style)
      await db.exec('INSERT INTO kv (k, v) VALUES (?, ?)', 'b', '2'); // spread form
      expect(await db.query('SELECT v FROM kv WHERE k = ?', ['a'])).toEqual([{ v: '1' }]);
      expect(await db.query('SELECT v FROM kv WHERE k = ?', 'b')).toEqual([{ v: '2' }]);
    } finally {
      close();
    }
  });
});

describe('reference plugin (examples/koffi)', () => {
  const dir = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');

  it('passes the same validation authors run', () => {
    const r = validatePluginDir(dir);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has a valid, minimal-permission hero-widget manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8')) as {
      capabilities?: { widget?: { slot?: string } };
    };
    const res = validateManifest(manifest);
    expect(res.ok).toBe(true);
    expect(res.manifest?.permissions).toEqual(['db:read:trips']);
    expect(manifest.capabilities?.widget?.slot).toBe('hero');
  });
});

describe('makeZip', () => {
  it('round-trips through a central-directory reader (installer-compatible)', () => {
    const files = [
      { name: 'trek-plugin.json', data: Buffer.from('{"id":"x"}') },
      { name: 'server/index.js', data: Buffer.from('module.exports={}\n'.repeat(200)) },
    ];
    const zip = makeZip(files);
    expect(zip.subarray(0, 2).toString()).toBe('PK'); // local file header magic
    const back = readZip(zip);
    expect(Object.keys(back).sort()).toEqual(['server/index.js', 'trek-plugin.json']);
    expect(back['trek-plugin.json'].toString()).toBe('{"id":"x"}');
    expect(back['server/index.js'].length).toBe(files[1].data.length);
  });
});

describe('pack + entry (publishing automation)', () => {
  const koffi = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('packs the canonical layout, excludes docs/, and reports sha256 + size', () => {
    const out = path.join(tmp, 'plugin.zip');
    const r = packPluginDir(koffi, out);
    expect(r.files).toEqual(['README.md', 'client/index.html', 'server/index.js', 'trek-plugin.json']);
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.size).toBeGreaterThan(0);
    const back = readZip(fs.readFileSync(out));
    expect(back['trek-plugin.json']).toBeTruthy();
    expect(Object.keys(back).some((n) => n.startsWith('docs/'))).toBe(false); // screenshot served from repo, not shipped
  });

  it('refuses a plugin that ships a native binary', () => {
    const bad = path.join(tmp, 'bad');
    fs.mkdirSync(path.join(bad, 'server'), { recursive: true });
    fs.writeFileSync(path.join(bad, 'trek-plugin.json'), JSON.stringify({ id: 'bad-plug', name: 'Bad', version: '1.0.0', type: 'integration', permissions: [], egress: [] }));
    fs.writeFileSync(path.join(bad, 'server', 'index.js'), 'module.exports={}');
    fs.writeFileSync(path.join(bad, 'server', 'thing.node'), Buffer.from([1, 2, 3]));
    fs.writeFileSync(path.join(bad, 'README.md'), '# Bad\n![x](x.png)\ncontent');
    expect(() => packPluginDir(bad, path.join(tmp, 'x.zip'))).toThrow(/native binaries/);
  });

  it('builds a registry entry with sha256/size/commit/minTrekVersion filled in', () => {
    const out = path.join(tmp, 'plugin.zip');
    const packed = packPluginDir(koffi, out);
    const entry = buildEntry({
      dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out,
      commit: 'a'.repeat(40), now: '2026-07-04T00:00:00.000Z',
    });
    expect(entry.id).toBe('koffi');
    expect(entry.type).toBe('widget');
    const v = entry.versions[0];
    expect(v.sha256).toBe(packed.sha256);
    expect(v.size).toBe(packed.size);
    expect(v.commitSha).toBe('a'.repeat(40));
    expect(v.minTrekVersion).toBe('3.2.0');
    expect(v.downloadUrl).toBe('https://github.com/mauriceboe/trek-plugin-koffi/releases/download/v1.0.0/plugin.zip');
    expect(v.nativeModules).toBe(false);
  });

  it('--merge prepends the new version onto an existing entry, newest-first', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const existingPath = path.join(tmp, 'koffi.json');
    fs.writeFileSync(existingPath, JSON.stringify({
      id: 'koffi', name: 'Koffi', author: 'TREK', description: 'x', repo: 'mauriceboe/trek-plugin-koffi', type: 'widget',
      versions: [{ version: '0.9.0', gitTag: 'v0.9.0', commitSha: 'b'.repeat(40), downloadUrl: 'https://github.com/x/y/releases/download/v0.9.0/plugin.zip', sha256: 'c'.repeat(64), minTrekVersion: '3.2.0', size: 10, apiVersion: 1, nativeModules: false, publishedAt: '2026-01-01T00:00:00.000Z' }],
    }));
    const merged = buildEntry({
      dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out,
      commit: 'a'.repeat(40), mergePath: existingPath, now: '2026-07-04T00:00:00.000Z',
    });
    expect(merged.versions.map((v) => v.version)).toEqual(['1.0.0', '0.9.0']);
  });
});

describe('listZipNames', () => {
  it('lists central-directory entries of a makeZip archive', () => {
    const zip = makeZip([{ name: 'a.js', data: Buffer.from('x') }, { name: 'server/b.js', data: Buffer.from('y'.repeat(100)) }]);
    expect(listZipNames(zip).sort()).toEqual(['a.js', 'server/b.js']);
  });
});

describe('sign + keygen (author signatures, TOFU)', () => {
  const koffi = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sign-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('keygen writes a private key and returns a schema-length public key', () => {
    const keyPath = path.join(tmp, 'k.pem');
    const { publicKey } = generateKeypair(keyPath);
    expect(fs.existsSync(keyPath)).toBe(true);
    expect(publicKey.length).toBeGreaterThanOrEqual(40); // registry schema minLength
    expect(() => generateKeypair(keyPath)).toThrow(/already exists/); // never clobbers a key
  });

  it('a signature round-trips through the server-shaped verifier', () => {
    const keyPath = path.join(tmp, 'k.pem');
    generateKeypair(keyPath);
    const key = loadPrivateKey(keyPath);
    const bytes = Buffer.from('the exact plugin.zip bytes ' + 'x'.repeat(60));
    const sig = signArtifact(bytes, key);
    expect(sig.length).toBeGreaterThanOrEqual(40);
    expect(verifyArtifact(bytes, sig, publicKeyBase64(key))).toBe(true);
    expect(verifyArtifact(Buffer.concat([bytes, Buffer.from('!')]), sig, publicKeyBase64(key))).toBe(false);
  });

  it('entry --sign fills signature + authorPublicKey that verify against the artifact', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const keyPath = path.join(tmp, 'k.pem');
    const { publicKey } = generateKeypair(keyPath);
    const entry = buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out, commit: 'a'.repeat(40), signKeyPath: keyPath, now: '2026-07-04T00:00:00.000Z' });
    expect(entry.authorPublicKey).toBe(publicKey);
    const sig = entry.versions[0].signature;
    expect(sig).toBeTruthy();
    expect(verifyArtifact(fs.readFileSync(out), sig!, entry.authorPublicKey!)).toBe(true);
  });

  it('refuses to sign an update with a different key than the one already published', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const key1 = path.join(tmp, 'k1.pem');
    generateKeypair(key1);
    const existing = buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out, commit: 'a'.repeat(40), signKeyPath: key1, now: '2026-07-04T00:00:00.000Z' });
    const existingPath = path.join(tmp, 'koffi.json');
    fs.writeFileSync(existingPath, JSON.stringify({ ...existing, versions: existing.versions.map((v) => ({ ...v, version: '0.9.0', gitTag: 'v0.9.0' })) }));
    const key2 = path.join(tmp, 'k2.pem');
    generateKeypair(key2);
    expect(() => buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.1.0', zipPath: out, commit: 'a'.repeat(40), mergePath: existingPath, signKeyPath: key2, now: '2026-07-04T00:00:00.000Z' })).toThrow(/differs from the one already published/);
  });
});

describe('mock-host inter-plugin (plugins.call + events.emit)', () => {
  it('calls a configured dependency export and records the call', async () => {
    const { ctx, calls } = createMockHost({
      pluginExports: { 'dep-lib': { greet: (args: any) => ({ hi: args?.who }) } },
    });
    const r = await ctx.plugins.call('dep-lib', 'greet', { who: 'ada' });
    expect(r).toEqual({ hi: 'ada' });
    expect(calls.some((c) => c.method === 'plugins.call')).toBe(true);
  });

  it('throws RESOURCE_FORBIDDEN calling an export that is not configured', async () => {
    const { ctx } = createMockHost({ pluginExports: { 'dep-lib': {} } });
    await expect(ctx.plugins.call('dep-lib', 'nope', {})).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    await expect(ctx.plugins.call('other', 'greet', {})).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('records emitted events', () => {
    const { ctx, emitted } = createMockHost({});
    ctx.events.emit('rate.updated', { pair: 'USD/EUR' });
    expect(emitted).toEqual([{ name: 'rate.updated', payload: { pair: 'USD/EUR' } }]);
  });
});

describe('validateManifest capabilities.provides/emits', () => {
  const base = { id: 'my-plug', name: 'My Plug', version: '1.0.0', type: 'integration', permissions: ['db:own'] };
  it('accepts well-formed provides + emits', () => {
    const r = validateManifest({ ...base, capabilities: { provides: ['computeRate'], emits: ['rate.updated'] } });
    expect(r.ok).toBe(true);
  });
  it('rejects a malformed export/event name and a non-array', () => {
    expect(validateManifest({ ...base, capabilities: { provides: ['bad name!'] } }).ok).toBe(false);
    expect(validateManifest({ ...base, capabilities: { emits: 'nope' } }).ok).toBe(false);
  });
});
