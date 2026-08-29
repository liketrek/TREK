import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { StorageInvalidKeyError } from '../../../../src/nest/storage/storage.types';
import { describeStorageDriver, type DriverHarness } from './storage-driver.contract';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it, expect, vi, afterEach } from 'vitest';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trek-storage-'));
}

async function makeHarness(): Promise<DriverHarness> {
  const root = makeTmpDir();
  const tmpFiles = makeTmpDir();
  const driver = new LocalDriver({ id: 'test-local', root });
  driver.init({ cleanSpool: true });
  let counter = 0;
  return {
    driver,
    makeTempFile: async (contents) => {
      const p = path.join(tmpFiles, `src-${counter++}.tmp`);
      fs.writeFileSync(p, contents);
      return p;
    },
    cleanup: async () => {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(tmpFiles, { recursive: true, force: true });
    },
  };
}

describeStorageDriver('LocalDriver', makeHarness);

describe('LocalDriver specifics', () => {
  const dirs: string[] = [];
  const tmp = (): string => {
    const d = makeTmpDir();
    dirs.push(d);
    return d;
  };

  afterEach(() => {
    vi.restoreAllMocks();
    while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
  });

  it('realpaths a symlinked root and confines keys to the real directory', async () => {
    // Docker symlinks BOTH storage anchors (/app/server/uploads → /app/uploads,
    // /app/server/data → /app/data), so this is the deployed shape, not an edge.
    const realdir = tmp();
    const link = path.join(tmp(), 'uploads-link');
    fs.symlinkSync(realdir, link);

    const driver = new LocalDriver({ id: 'sym', root: link });
    driver.init();
    await driver.put('files/x.bin', Readable.from('sym'));

    const local = driver.getLocalPath('files/x.bin');
    expect(local.startsWith(fs.realpathSync(realdir) + path.sep)).toBe(true);
    expect(fs.readFileSync(local, 'utf8')).toBe('sym');
    expect(() => driver.getLocalPath('../escape')).toThrow(StorageInvalidKeyError);
  });

  it('cleans aged spool leftovers only at boot, never on reload-style init', () => {
    const driver = new LocalDriver({ id: 'spool', root: tmp() });
    driver.init();
    const stray = path.join(driver.getSpoolDir(), 'leftover.part');
    fs.writeFileSync(stray, 'in-flight upload');
    // Crash leftover: old enough to clear the reap age gate.
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(stray, old, old);

    driver.init(); // reload(): must NOT delete an in-flight upload's spool file
    expect(fs.existsSync(stray)).toBe(true);

    driver.init({ cleanSpool: true }); // boot: crash leftovers are reclaimed
    expect(fs.existsSync(stray)).toBe(false);
  });

  it('the boot spool sweep spares fresh entries (another process may be mid-upload)', () => {
    const driver = new LocalDriver({ id: 'spool-fresh', root: tmp() });
    driver.init();
    const inflight = path.join(driver.getSpoolDir(), 'inflight.part');
    fs.writeFileSync(inflight, 'spooling right now');

    driver.init({ cleanSpool: true });
    expect(fs.existsSync(inflight)).toBe(true);
  });

  it('creates its root, spool, and category prefix dirs at init', () => {
    const root = path.join(tmp(), 'nested', 'uploads');
    const driver = new LocalDriver({ id: 'pfx', root });
    driver.init({ ensurePrefixes: ['files', 'photos/trek'] });

    expect(fs.statSync(path.join(root, '.tmp')).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(root, 'files')).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(root, 'photos/trek')).isDirectory()).toBe(true);
  });

  it('falls back to copy+unlink when a temp-file rename crosses volumes (EXDEV)', async () => {
    const root = tmp();
    const driver = new LocalDriver({ id: 'exdev', root });
    driver.init();
    const src = path.join(tmp(), 'other-volume.bin');
    fs.writeFileSync(src, 'exdev payload');

    vi.spyOn(fs.promises, 'rename').mockRejectedValueOnce(
      Object.assign(new Error('EXDEV: cross-device link not permitted'), { code: 'EXDEV' }),
    );

    await driver.put('files/moved.bin', { tmpPath: src });
    expect(fs.readFileSync(path.join(root, 'files/moved.bin'), 'utf8')).toBe('exdev payload');
    expect(fs.existsSync(src)).toBe(false);
  });

  it('commits stream puts via a same-volume spool rename', async () => {
    const root = tmp();
    const driver = new LocalDriver({ id: 'samevol', root });
    driver.init();

    const renameSpy = vi.spyOn(fs.promises, 'rename');
    await driver.put('files/spooled.bin', Readable.from('data'));

    const [from, to] = renameSpy.mock.calls.at(-1)!;
    expect(String(from).startsWith(path.join(fs.realpathSync(root), '.tmp') + path.sep)).toBe(true);
    expect(String(to)).toBe(path.join(fs.realpathSync(root), 'files/spooled.bin'));
  });

  it('lists a missing prefix as empty', async () => {
    const driver = new LocalDriver({ id: 'empty', root: tmp() });
    driver.init();
    const seen: unknown[] = [];
    for await (const stat of driver.list('nope/')) seen.push(stat);
    expect(seen).toEqual([]);
  });
});
