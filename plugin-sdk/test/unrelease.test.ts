import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// unrelease shells out to git + gh; drive those from here so we can assert what it deletes.
const calls: Array<{ bin: string; args: string[] }> = [];
let releaseExistsOnRemote = false;
let remoteTagOnOrigin = false;
let localTagExists = false;

vi.mock('node:child_process', () => ({
  execFileSync: (bin: string, args: string[]) => {
    calls.push({ bin, args });
    if (bin === 'gh' && args[0] === 'release' && args[1] === 'view') {
      if (!releaseExistsOnRemote) throw new Error('release not found');
      return Buffer.from('');
    }
    if (bin === 'git' && args.includes('ls-remote')) {
      return Buffer.from(remoteTagOnOrigin ? 'abc\trefs/tags/v1.0.0' : '');
    }
    if (bin === 'git' && args.includes('rev-parse')) {
      if (!localTagExists) throw new Error('unknown revision');
      return Buffer.from('abc');
    }
    return Buffer.from('');
  },
}));

const { unrelease } = await import('../src/cli/unrelease.js');

/** The published registry index the immutability guard consults. */
let indexBody: unknown = { plugins: [] };
let indexFails = false;

describe('unrelease — delete a stranded tag + release safely', () => {
  let tmp: string;

  beforeEach(() => {
    calls.length = 0;
    releaseExistsOnRemote = false;
    remoteTagOnOrigin = false;
    localTagExists = false;
    indexBody = { plugins: [] };
    indexFails = false;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unrelease-'));
    fs.writeFileSync(path.join(tmp, 'trek-plugin.json'), JSON.stringify({ id: 'doomed-plug', version: '1.0.0' }));
    vi.stubGlobal('fetch', async () => {
      if (indexFails) throw new Error('offline');
      return { ok: true, json: async () => indexBody } as Response;
    });
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  const run = (yes?: boolean) => unrelease({
    dir: tmp, tag: 'v1.0.0', repo: 'someone/trek-plugin-doomed-plug', yes, log: () => {},
  });

  it('REFUSES when that version is published in the registry — those artifacts are immutable', async () => {
    indexBody = { plugins: [{ id: 'doomed-plug', versions: [{ version: '1.0.0' }] }] };
    releaseExistsOnRemote = true;
    await expect(run(true)).rejects.toThrow(/published in the registry/i);
    expect(calls.some((c) => c.bin === 'gh' && c.args[1] === 'delete')).toBe(false);
  });

  it('deletes the release, remote tag, and local tag when they exist', async () => {
    releaseExistsOnRemote = true;
    remoteTagOnOrigin = true;
    localTagExists = true;
    const { deleted } = await run();
    expect(deleted).toEqual(['release', 'remote tag', 'local tag']);
    expect(calls.some((c) => c.bin === 'gh' && c.args[0] === 'release' && c.args[1] === 'delete' && c.args.includes('--yes'))).toBe(true);
    expect(calls.some((c) => c.bin === 'git' && c.args.includes(':refs/tags/v1.0.0'))).toBe(true);
    expect(calls.some((c) => c.bin === 'git' && c.args.includes('tag') && c.args.includes('-d'))).toBe(true);
  });

  it('reports what was already absent without failing', async () => {
    const { deleted } = await run();
    expect(deleted).toEqual([]);
  });

  it('when the registry cannot be checked, refuses without --yes and proceeds with it', async () => {
    indexFails = true;
    localTagExists = true;
    await expect(run()).rejects.toThrow(/--yes/);
    const { deleted } = await run(true);
    expect(deleted).toEqual(['local tag']);
  });

  it('a different published version of the same plugin does not block this tag', async () => {
    indexBody = { plugins: [{ id: 'doomed-plug', versions: [{ version: '0.9.0' }] }] };
    localTagExists = true;
    const { deleted } = await run();
    expect(deleted).toEqual(['local tag']);
  });
});
