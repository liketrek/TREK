import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// publish shells out to git + gh; drive those from here so we can assert what it WOULD run.
const calls: Array<{ bin: string; args: string[] }> = [];
let releaseExistsOnRemote = false;

vi.mock('node:child_process', () => ({
  execFileSync: (bin: string, args: string[]) => {
    calls.push({ bin, args });
    if (bin === 'gh' && args[0] === 'release' && args[1] === 'view') {
      if (!releaseExistsOnRemote) throw new Error('release not found');
      return Buffer.from('');
    }
    // `git rev-parse <tag>^{commit}` — pretend the tag does not exist yet.
    if (bin === 'git' && args.includes('rev-parse')) throw new Error('unknown revision');
    return Buffer.from('');
  },
}));

const { publishPlugin } = await import('../src/cli/publish.js');
const { scaffold } = await import('../src/cli/create.js');
const { makePublishable } = await import('./helpers.js');

describe('publish — a released artifact is immutable', () => {
  let tmp: string;
  let dir: string;

  beforeEach(() => {
    calls.length = 0;
    releaseExistsOnRemote = false;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-'));
    scaffold('immutable-plug', 'integration', tmp);
    dir = path.join(tmp, 'immutable-plug');
    // publish now gates on the registry's checks BEFORE it packs or releases, so a bare scaffold
    // never reaches the `gh` calls these tests are about. Document the plugin first.
    makePublishable(dir);
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  const run = (force?: boolean) => publishPlugin({
    dir, repo: 'someone/trek-plugin-immutable-plug', tag: 'v1.0.0',
    now: '2026-01-01T00:00:00Z', skipPreflight: true, force, log: () => {},
  });

  it('REFUSES to overwrite an existing release, and never uploads', async () => {
    releaseExistsOnRemote = true;
    // The registry pins the artifact's sha256. Rewriting the bytes of a release that is
    // already in the registry breaks that pin for everyone who installed that version.
    await expect(run()).rejects.toThrow(/already exists/i);
    expect(calls.some((c) => c.bin === 'gh' && c.args.includes('upload'))).toBe(false);
    expect(calls.some((c) => c.bin === 'gh' && c.args.includes('--clobber'))).toBe(false);
  });

  it('--force overwrites deliberately (for a release never merged into the registry)', async () => {
    releaseExistsOnRemote = true;
    await run(true).catch(() => {}); // submit/preflight are stubbed out; we only care about the gh calls
    const upload = calls.find((c) => c.bin === 'gh' && c.args.includes('upload'));
    expect(upload?.args).toContain('--clobber');
  });

  it('creates the release normally when it does not exist yet', async () => {
    releaseExistsOnRemote = false;
    await run().catch(() => {});
    expect(calls.some((c) => c.bin === 'gh' && c.args[1] === 'create')).toBe(true);
    expect(calls.some((c) => c.args.includes('--clobber'))).toBe(false);
  });

  it('keeps plugin.zip — the entry sha256 must be hashed from the uploaded bytes', async () => {
    await run().catch(() => {});
    // A re-pack on another machine/SDK version can produce different bytes (CRLF, walk
    // order), so deleting the artifact after publishing made a follow-up `entry`/`sign` wrong.
    expect(fs.existsSync(path.join(dir, 'plugin.zip'))).toBe(true);
  });
});

/**
 * The reorder, and why it is the most important thing in this file.
 *
 * publish used to run: pack → tag + GitHub release → preflight → submit. So the checks that
 * catch an unwritten README or a missing screenshot ran AFTER the release was cut — and a release
 * is immutable in the only sense that matters, because the registry pins its sha256. An author
 * who failed preflight had already burned their v1.0.0 tag, and the only way out was to throw it
 * away and cut a v1.0.1 whose sole change was the README.
 *
 * So: when a local gate fails, NOTHING may happen. No zip, no tag, no push, no release.
 */
describe('publish — the local gates run before anything is cut', () => {
  let tmp: string;
  let dir: string;

  beforeEach(() => {
    calls.length = 0;
    releaseExistsOnRemote = false;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-gate-'));
    scaffold('gated-plug', 'integration', tmp);
    dir = path.join(tmp, 'gated-plug');
    // Deliberately NOT made publishable: this is a fresh scaffold, exactly what a first-time
    // author has when they reach for `publish` too early.
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  const run = () => publishPlugin({
    dir, repo: 'someone/trek-plugin-gated-plug', tag: 'v1.0.0',
    now: '2026-01-01T00:00:00Z', skipPreflight: true, log: () => {},
  });

  it('refuses an undocumented plugin and names what is wrong', async () => {
    await expect(run()).rejects.toThrow(/would be rejected by the registry/i);
    await expect(run()).rejects.toThrow(/prose|screenshot/i);
  });

  it('packs nothing, tags nothing, pushes nothing, releases nothing', async () => {
    await run().catch(() => {});

    expect(fs.existsSync(path.join(dir, 'plugin.zip'))).toBe(false);
    expect(calls.some((c) => c.bin === 'git' && c.args.includes('tag'))).toBe(false);
    expect(calls.some((c) => c.bin === 'git' && c.args.includes('push'))).toBe(false);
    expect(calls.some((c) => c.bin === 'gh')).toBe(false);
  });

  it('goes through once the plugin is documented', async () => {
    makePublishable(dir);
    await run().catch(() => {}); // submit is not stubbed; we only care that it got past the gate
    expect(calls.some((c) => c.bin === 'gh' && c.args[1] === 'create')).toBe(true);
  });
});

/**
 * The signing half of the same trap.
 *
 * TREK pins the author key on first install. A plugin that shipped SIGNED and then publishes
 * UNSIGNED is refused on every instance that already has it (SIGNATURE_MISSING) — the update is
 * not merely rejected, it strands every existing user on the version they have.
 *
 * `preflight` has always caught this. But preflight is step 4, and the immutable GitHub release is
 * cut at step 3 — so the author learned it with their tag already burned, for a fact that was
 * knowable before a single byte was packed. The check belongs in step 1, and this pins it there.
 */
describe('publish — a signed plugin cannot quietly go unsigned', () => {
  let tmp: string;
  let dir: string;

  beforeEach(() => {
    calls.length = 0;
    releaseExistsOnRemote = false;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-sign-'));
    scaffold('signed-plug', 'integration', tmp);
    dir = path.join(tmp, 'signed-plug');
    makePublishable(dir);
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  /** Pretend the registry already lists this plugin as signed, without hitting the network. */
  const publishedSigned = {
    hasKey: true,
    keyPath: '/nonexistent/signing.key',
    publishedSigned: true,
    publishedKey: 'a-published-key',
  };

  const run = (signKeyPath?: string) => publishPlugin({
    dir, repo: 'someone/trek-plugin-signed-plug', tag: 'v2.0.0',
    now: '2026-01-01T00:00:00Z', skipPreflight: true, signKeyPath,
    signing: publishedSigned, log: () => {},
  });

  it('refuses, and names what it would have broken', async () => {
    await expect(run(undefined)).rejects.toThrow(/published SIGNED/i);
    await expect(run(undefined)).rejects.toThrow(/strand every existing user/i);
  });

  it('cuts no release — the whole point of checking at step 1', async () => {
    await run(undefined).catch(() => {});
    expect(fs.existsSync(path.join(dir, 'plugin.zip'))).toBe(false);
    expect(calls.some((c) => c.bin === 'git' && c.args.includes('tag'))).toBe(false);
    expect(calls.some((c) => c.bin === 'gh')).toBe(false);
  });
});
