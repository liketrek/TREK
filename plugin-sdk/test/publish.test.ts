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

describe('publish — a released artifact is immutable', () => {
  let tmp: string;
  let dir: string;

  beforeEach(() => {
    calls.length = 0;
    releaseExistsOnRemote = false;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-'));
    scaffold('immutable-plug', 'integration', tmp);
    dir = path.join(tmp, 'immutable-plug');
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
