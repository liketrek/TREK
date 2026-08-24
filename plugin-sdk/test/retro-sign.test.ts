import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { generateKeypair, loadPrivateKey, publicKeyBase64, verifyArtifact } from '../src/cli/sign.js';
import { retroSignVersions } from '../src/cli/retro-sign.js';

const V1_BYTES = Buffer.from('the exact bytes of the v1.0.0 release asset');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('retro-sign — first signed update signs the older versions too', () => {
  let tmp: string;
  let keyPath: string;
  let publicKey: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-sign-'));
    keyPath = path.join(tmp, 'signing.key');
    publicKey = generateKeypair(keyPath).publicKey;
    vi.stubGlobal('fetch', async (url: string) => {
      if (String(url).includes('v1.0.0')) return { ok: true, arrayBuffer: async () => V1_BYTES } as unknown as Response;
      return { ok: false, status: 404 } as Response;
    });
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  const entry = (v1: Partial<{ sha256: string; signature: string }> = {}) => ({
    id: 'retro-plug',
    authorPublicKey: publicKey,
    versions: [
      { version: '1.1.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.1.0/plugin.zip', sha256: 'deadbeef', signature: 'already-signed' },
      { version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES), ...v1 },
    ],
  });

  it('downloads, verifies, and signs each unsigned older version', async () => {
    const e = entry();
    const signed = await retroSignVersions(e, keyPath, () => {});
    expect(signed).toEqual(['1.0.0']);
    const sig = e.versions[1].signature!;
    expect(verifyArtifact(V1_BYTES, sig, publicKey)).toBe(true);
    expect(e.versions[0].signature).toBe('already-signed'); // untouched
  });

  it('REFUSES when the downloaded bytes no longer hash to the pinned sha256', async () => {
    const e = entry({ sha256: 'not-the-real-hash' });
    await expect(retroSignVersions(e, keyPath, () => {})).rejects.toThrow(/1\.0\.0.*sha256/is);
    expect(e.versions[1].signature).toBeUndefined();
  });

  it('REFUSES a key that does not match the entry authorPublicKey', async () => {
    const otherKey = path.join(tmp, 'other.key');
    generateKeypair(otherKey);
    await expect(retroSignVersions(entry(), otherKey, () => {})).rejects.toThrow(/key/i);
  });

  it('is a no-op for an unsigned entry or one with nothing to sign', async () => {
    const unsignedEntry = { id: 'x', versions: [{ version: '1.0.0', downloadUrl: 'u', sha256: 'h' }] };
    expect(await retroSignVersions(unsignedEntry, keyPath, () => {})).toEqual([]);
    const fullySigned = entry({ signature: 'sig' });
    expect(await retroSignVersions(fullySigned, keyPath, () => {})).toEqual([]);
  });

  it('names every version whose artifact could not be fetched', async () => {
    const e = entry();
    e.versions[1].downloadUrl = 'https://github.com/x/y/releases/download/v9.9.9/plugin.zip'; // 404s
    await expect(retroSignVersions(e, keyPath, () => {})).rejects.toThrow(/1\.0\.0/);
  });

  it('key sanity: publicKeyBase64 round-trips through loadPrivateKey', () => {
    expect(publicKeyBase64(loadPrivateKey(keyPath))).toBe(publicKey);
  });
});
