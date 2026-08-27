/**
 * Key rotation — the SDK half of `allow-key-change`.
 *
 * The registry has always had a legitimate rotation path (a maintainer applies the
 * `allow-key-change` label; every admin re-trusts the plugin), but the SDK refused a changed key
 * at every choke point with no way to say "yes, on purpose". These tests pin the deliberate
 * path: `--allow-key-change` on the publishing commands, and `rotate-key` for rotating without
 * shipping a version. The accidental path — a different key with NO flag — must keep refusing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { generateKeypair, verifyArtifact } from '../src/cli/sign.js';
import { buildEntry } from '../src/cli/entry.js';
import { rotateKey } from '../src/cli/rotate-key.js';
import { NETWORK_CHECKS } from '../src/cli/checks/network.js';
import type { CheckContext, RegistryEntry } from '../src/cli/checks/types.js';

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const COMMIT = 'c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00';

let tmp: string;
let oldKeyPath: string;
let oldPublicKey: string;
let newKeyPath: string;
let newPublicKey: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rotate-key-'));
  oldKeyPath = path.join(tmp, 'old.key');
  oldPublicKey = generateKeypair(oldKeyPath).publicKey;
  newKeyPath = path.join(tmp, 'new.key');
  newPublicKey = generateKeypair(newKeyPath).publicKey;
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

describe('entry --merge with a changed key', () => {
  let dir: string;
  let zipPath: string;
  let mergePath: string;

  beforeEach(() => {
    dir = path.join(tmp, 'plug');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'trek-plugin.json'), JSON.stringify({
      id: 'rotate-plug', name: 'Rotate Plug', version: '1.1.0', type: 'integration',
      trek: '>=4.0.0 <5.0.0', author: 'Someone', description: 'x',
    }));
    zipPath = path.join(dir, 'plugin.zip');
    fs.writeFileSync(zipPath, Buffer.from('fresh artifact bytes'));
    mergePath = path.join(tmp, 'existing.json');
    fs.writeFileSync(mergePath, JSON.stringify({
      id: 'rotate-plug', name: 'Rotate Plug', author: 'Someone', description: 'x',
      repo: 'someone/trek-plugin-rotate-plug', type: 'integration',
      authorPublicKey: oldPublicKey,
      versions: [{
        version: '1.0.0', gitTag: 'v1.0.0', commitSha: COMMIT,
        downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip',
        sha256: 'aa'.repeat(32), trek: '>=4.0.0 <5.0.0', size: 10, apiVersion: 1,
        nativeModules: false, publishedAt: '2026-01-01T00:00:00Z', signature: 'old-key-sig',
      }],
    }));
  });

  const build = (allowKeyChange?: boolean) => buildEntry({
    dir, repo: 'someone/trek-plugin-rotate-plug', tag: 'v1.1.0', zipPath,
    commit: COMMIT, mergePath, signKeyPath: newKeyPath, now: '2026-08-28T00:00:00Z',
    allowKeyChange,
  });

  it('still REFUSES a changed key without the flag — and now names it', () => {
    expect(build).toThrow(/differs/i);
    expect(build).toThrow(/--allow-key-change/);
  });

  it('with --allow-key-change: adopts the NEW key and strips the old-key signatures for retro-signing', () => {
    const entry = build(true);
    expect(entry.authorPublicKey).toBe(newPublicKey);
    const fresh = entry.versions.find((v) => v.version === '1.1.0')!;
    expect(verifyArtifact(Buffer.from('fresh artifact bytes'), fresh.signature!, newPublicKey)).toBe(true);
    // The old version's signature was made with the OLD key — dead weight under the new one.
    // Stripping it hands the version to the existing retro-sign pass, which re-signs it with
    // the new key from the pinned artifact bytes.
    const old = entry.versions.find((v) => v.version === '1.0.0')!;
    expect(old.signature).toBeUndefined();
  });

  it('with --allow-key-change but NO --sign: refuses — a rotation cannot ship unsigned', () => {
    expect(() => buildEntry({
      dir, repo: 'someone/trek-plugin-rotate-plug', tag: 'v1.1.0', zipPath,
      commit: COMMIT, mergePath, now: '2026-08-28T00:00:00Z', allowKeyChange: true,
    })).toThrow(/--sign/);
  });
});

describe('signing-downgrade check under an intended rotation', () => {
  const signingDowngrade = NETWORK_CHECKS.find((c) => c.id === 'network.signing-downgrade')!;

  const publishedEntry = () => ({
    id: 'rotate-plug', authorPublicKey: oldPublicKey,
    versions: [{ version: '1.0.0', signature: 'old-sig' }],
  });

  const localEntry = (over: Partial<RegistryEntry> = {}): RegistryEntry => ({
    id: 'rotate-plug', name: 'Rotate Plug', author: 'Someone', description: 'x',
    repo: 'someone/trek-plugin-rotate-plug', type: 'integration',
    authorPublicKey: newPublicKey,
    versions: [{
      version: '1.1.0', gitTag: 'v1.1.0', commitSha: COMMIT,
      downloadUrl: 'https://github.com/x/y/releases/download/v1.1.0/plugin.zip',
      sha256: 'bb'.repeat(32), trek: '>=4.0.0 <5.0.0', size: 10, apiVersion: 1,
      nativeModules: false, publishedAt: '2026-08-28T00:00:00Z', signature: 'new-sig',
    }],
    ...over,
  });

  const ctx = (over: Partial<CheckContext> = {}): CheckContext => ({
    dir: tmp, exists: () => false, entry: localEntry(), ...over,
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, text: async () => JSON.stringify(publishedEntry()),
    }) as unknown as Response);
  });

  it('still FAILS a changed key without rotation intent', async () => {
    const r = await signingDowngrade.run(ctx());
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/allow-key-change/);
  });

  it('passes a changed key when the rotation is declared (allowKeyChange)', async () => {
    const r = await signingDowngrade.run(ctx({ allowKeyChange: true }));
    expect(r.status).toBe('pass');
    expect(r.detail).toMatch(/rotat/i);
  });

  it('a declared rotation still FAILS when any version is left unsigned', async () => {
    const entry = localEntry({
      versions: [
        localEntry().versions[0],
        { ...localEntry().versions[0], version: '1.0.0', signature: undefined },
      ],
    });
    const r = await signingDowngrade.run(ctx({ entry, allowKeyChange: true }));
    expect(r.status).toBe('fail');
    expect(r.fix).toMatch(/1\.0\.0/);
  });

  it('allowKeyChange changes nothing when the key did NOT change', async () => {
    const entry = localEntry({ authorPublicKey: oldPublicKey });
    entry.versions[0].signature = 'signed-with-old-key';
    const r = await signingDowngrade.run(ctx({ entry, allowKeyChange: true }));
    expect(r.status).toBe('pass');
    expect(r.detail ?? '').not.toMatch(/rotat/i);
  });
});

describe('rotate-key — rotate a published plugin to a new key without shipping a version', () => {
  const V1_BYTES = Buffer.from('v1.0.0 artifact');
  const V11_BYTES = Buffer.from('v1.1.0 artifact');
  let published: Record<string, unknown> | null;

  beforeEach(() => {
    published = {
      id: 'rotate-plug', name: 'Rotate Plug', author: 'Someone', description: 'x',
      repo: 'someone/trek-plugin-rotate-plug', type: 'integration',
      authorPublicKey: oldPublicKey,
      versions: [
        { version: '1.1.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.1.0/plugin.zip', sha256: sha(V11_BYTES), signature: 'old-sig-11' },
        { version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES), signature: 'old-sig-10' },
      ],
    };
    vi.stubGlobal('fetch', async (url: string) => {
      const u = String(url);
      if (u.includes('registry/plugins/rotate-plug.json')) {
        if (!published) return { ok: false, status: 404 } as Response;
        return { ok: true, text: async () => JSON.stringify(published), json: async () => published } as unknown as Response;
      }
      if (u.includes('v1.0.0')) return { ok: true, arrayBuffer: async () => V1_BYTES } as unknown as Response;
      if (u.includes('v1.1.0')) return { ok: true, arrayBuffer: async () => V11_BYTES } as unknown as Response;
      return { ok: false, status: 404 } as Response;
    });
  });

  it('writes a fully rotated entry with --out: new key, every version re-signed', async () => {
    const out = path.join(tmp, 'rotated.json');
    const r = await rotateKey({ id: 'rotate-plug', keyPath: newKeyPath, out, log: () => {} });
    expect(r.rotatedVersions).toEqual(['1.1.0', '1.0.0']);
    expect(r.outPath).toBe(out);
    const written = JSON.parse(fs.readFileSync(out, 'utf8')) as {
      authorPublicKey: string; versions: Array<{ version: string; signature: string }>;
    };
    expect(written.authorPublicKey).toBe(newPublicKey);
    expect(verifyArtifact(V11_BYTES, written.versions[0].signature, newPublicKey)).toBe(true);
    expect(verifyArtifact(V1_BYTES, written.versions[1].signature, newPublicKey)).toBe(true);
  });

  it('reads the plugin id from the directory manifest when no --id is given', async () => {
    const dir = path.join(tmp, 'plug-dir');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'trek-plugin.json'), JSON.stringify({ id: 'rotate-plug' }));
    const out = path.join(tmp, 'rotated-from-dir.json');
    const r = await rotateKey({ dir, keyPath: newKeyPath, out, log: () => {} });
    expect(r.id).toBe('rotate-plug');
  });

  it('REFUSES when the plugin is not in the registry — nothing published, nothing to rotate', async () => {
    published = null;
    await expect(rotateKey({ id: 'rotate-plug', keyPath: newKeyPath, out: path.join(tmp, 'x.json'), log: () => {} }))
      .rejects.toThrow(/not (published|in the registry)/i);
  });

  it('REFUSES when no plugin id can be resolved at all', async () => {
    const empty = path.join(tmp, 'not-a-plugin');
    fs.mkdirSync(empty, { recursive: true });
    await expect(rotateKey({ dir: empty, keyPath: newKeyPath, out: path.join(tmp, 'x.json'), log: () => {} }))
      .rejects.toThrow(/--id|trek-plugin\.json/);
  });
});
