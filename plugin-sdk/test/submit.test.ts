import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

const calls: Array<{ bin: string; args: string[] }> = [];
let failSync = false;
/** Seeded into the fake fork clone as the plugin's existing registry entry (update case). */
let existingEntry: unknown = null;
let lastCloneDir = '';

// submit's git()/gh() run execFileSync with encoding:'utf8', which returns STRINGS — the
// mock must too, or `.trim()` explodes on a Buffer.
vi.mock('node:child_process', () => ({
  execFileSync: (bin: string, args: string[]) => {
    calls.push({ bin, args });
    if (bin === 'gh' && args[0] === 'api') return 'someone';
    if (bin === 'gh' && args[0] === 'repo' && args[1] === 'sync' && failSync) throw new Error('fork has diverged');
    if (bin === 'gh' && args[0] === 'repo' && args[1] === 'clone') {
      lastCloneDir = args[3];
      if (existingEntry !== null) {
        const p = path.join(lastCloneDir, 'registry', 'plugins', `${(existingEntry as { id: string }).id}.json`);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, JSON.stringify(existingEntry, null, 2));
      }
      return '';
    }
    if (bin === 'gh' && args[0] === 'pr' && args[1] === 'create') return 'https://github.com/liketrek/TREK-Plugins/pull/999';
    return '';
  },
}));

const { submitEntry } = await import('../src/cli/submit.js');
const { generateKeypair } = await import('../src/cli/sign.js');
const { verifyArtifact } = await import('../src/cli/sign.js');

const V1_BYTES = Buffer.from('old release asset bytes');
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('submit — fork sync and retro-signing', () => {
  let tmp: string;
  let keyPath: string;
  let publicKey: string;

  beforeEach(() => {
    calls.length = 0;
    failSync = false;
    existingEntry = null;
    lastCloneDir = '';
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'submit-'));
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

  const freshEntry = (signed = false) => ({
    id: 'sync-plug',
    name: 'Sync Plug',
    ...(signed ? { authorPublicKey: publicKey } : {}),
    versions: [{
      version: '1.1.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.1.0/plugin.zip',
      sha256: 'deadbeef', ...(signed ? { signature: 'fresh-sig' } : {}),
    }],
  });

  it('fast-forwards the fork from the registry before branching', async () => {
    await submitEntry(freshEntry(), {});
    const sync = calls.find((c) => c.bin === 'gh' && c.args[0] === 'repo' && c.args[1] === 'sync');
    expect(sync?.args).toContain('someone/TREK-Plugins');
    expect(sync?.args).toContain('--source');
    expect(sync?.args).toContain('liketrek/TREK-Plugins');
  });

  it('a diverged fork warns but does not stop the submit', async () => {
    failSync = true;
    const { prUrl } = await submitEntry(freshEntry(), {});
    expect(prUrl).toContain('/pull/999');
  });

  it('retro-signs unsigned older versions on the first signed update', async () => {
    existingEntry = {
      id: 'sync-plug', name: 'Sync Plug',
      versions: [{ version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES) }],
    };
    await submitEntry(freshEntry(true), { signKeyPath: keyPath, keep: true });
    const written = JSON.parse(fs.readFileSync(path.join(lastCloneDir, 'registry', 'plugins', 'sync-plug.json'), 'utf8')) as {
      versions: Array<{ version: string; signature?: string }>;
    };
    const v1 = written.versions.find((v) => v.version === '1.0.0')!;
    expect(v1.signature).toBeDefined();
    expect(verifyArtifact(V1_BYTES, v1.signature!, publicKey)).toBe(true);
    fs.rmSync(lastCloneDir, { recursive: true, force: true });
  });

  it('refuses a first signed update when no key is available to retro-sign the older versions', async () => {
    existingEntry = {
      id: 'sync-plug', name: 'Sync Plug',
      versions: [{ version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES) }],
    };
    await expect(submitEntry(freshEntry(true), {})).rejects.toThrow(/--sign/);
  });
});

describe('submit — key rotation', () => {
  let tmp: string;
  let oldKeyPath: string;
  let oldPublicKey: string;
  let newKeyPath: string;
  let newPublicKey: string;

  beforeEach(() => {
    calls.length = 0;
    failSync = false;
    lastCloneDir = '';
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'submit-rotate-'));
    oldKeyPath = path.join(tmp, 'old.key');
    oldPublicKey = generateKeypair(oldKeyPath).publicKey;
    newKeyPath = path.join(tmp, 'new.key');
    newPublicKey = generateKeypair(newKeyPath).publicKey;
    existingEntry = {
      id: 'sync-plug', name: 'Sync Plug', authorPublicKey: oldPublicKey,
      versions: [{ version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES), signature: 'old-key-sig' }],
    };
    vi.stubGlobal('fetch', async (url: string) => {
      if (String(url).includes('v1.0.0')) return { ok: true, arrayBuffer: async () => V1_BYTES } as unknown as Response;
      return { ok: false, status: 404 } as Response;
    });
  });
  afterEach(() => {
    existingEntry = null;
    fs.rmSync(tmp, { recursive: true, force: true });
    if (lastCloneDir) fs.rmSync(lastCloneDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  const freshWithNewKey = () => ({
    id: 'sync-plug', name: 'Sync Plug', authorPublicKey: newPublicKey,
    versions: [{
      version: '1.1.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.1.0/plugin.zip',
      sha256: 'deadbeef', signature: 'new-key-sig',
    }],
  });

  const writtenEntry = () => JSON.parse(fs.readFileSync(path.join(lastCloneDir, 'registry', 'plugins', 'sync-plug.json'), 'utf8')) as {
    authorPublicKey?: string;
    versions: Array<{ version: string; signature?: string }>;
  };

  it('still REFUSES an update under a different key without allowKeyChange', async () => {
    await expect(submitEntry(freshWithNewKey(), { signKeyPath: newKeyPath })).rejects.toThrow(/original key/i);
  });

  it('with allowKeyChange: adopts the new key and RE-SIGNS the older versions with it', async () => {
    await submitEntry(freshWithNewKey(), { signKeyPath: newKeyPath, allowKeyChange: true, keep: true });
    const written = writtenEntry();
    expect(written.authorPublicKey).toBe(newPublicKey);
    const v1 = written.versions.find((v) => v.version === '1.0.0')!;
    expect(verifyArtifact(V1_BYTES, v1.signature!, newPublicKey)).toBe(true);
  });

  it('a rotation PR says so — title and body ask for the allow-key-change label', async () => {
    await submitEntry(freshWithNewKey(), { signKeyPath: newKeyPath, allowKeyChange: true, keep: true });
    const pr = calls.find((c) => c.bin === 'gh' && c.args[0] === 'pr' && c.args[1] === 'create')!;
    const title = pr.args[pr.args.indexOf('--title') + 1];
    const body = pr.args[pr.args.indexOf('--body') + 1];
    expect(title).toMatch(/key rotation/i);
    expect(body).toMatch(/allow-key-change/);
    expect(body).toMatch(/re-trust/i);
  });

  it('rotateOnly: replaces the entry wholesale (no new version) with a rotation PR', async () => {
    const rotated = {
      id: 'sync-plug', name: 'Sync Plug', authorPublicKey: newPublicKey,
      versions: [{ version: '1.0.0', downloadUrl: 'https://github.com/x/y/releases/download/v1.0.0/plugin.zip', sha256: sha(V1_BYTES), signature: 'new-key-sig-10' }],
    };
    await submitEntry(rotated, { keep: true, rotateOnly: true });
    const written = writtenEntry();
    expect(written.authorPublicKey).toBe(newPublicKey);
    expect(written.versions).toHaveLength(1);
    expect(written.versions[0].signature).toBe('new-key-sig-10');
    const pr = calls.find((c) => c.bin === 'gh' && c.args[0] === 'pr' && c.args[1] === 'create')!;
    const title = pr.args[pr.args.indexOf('--title') + 1];
    const body = pr.args[pr.args.indexOf('--body') + 1];
    expect(title).toMatch(/rotate/i);
    expect(body).toMatch(/allow-key-change/);
  });
});
