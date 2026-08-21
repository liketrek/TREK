import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { MirrorDriver, type ReplicaFailure } from '../../../../src/nest/storage/drivers/mirror.driver';

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-backfill-'));
  tmpDirs.push(dir);
  return dir;
}
afterEach(() => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

function makeLocal(id: string): { driver: LocalDriver; root: string } {
  const root = makeTmpDir();
  const driver = new LocalDriver({ id, root });
  driver.init({ ensurePrefixes: [], cleanSpool: false });
  return { driver, root };
}

async function put(driver: LocalDriver, key: string, body: string): Promise<void> {
  await driver.put(key, Readable.from(body));
}

function makeMirror(primary: LocalDriver, replicas: LocalDriver[], onReplicaFailure?: (f: ReplicaFailure) => void): MirrorDriver {
  return new MirrorDriver({ id: 'm', primary, replicas, tempDir: () => makeTmpDir(), onReplicaFailure });
}

const HOOKS = { onProgress: () => undefined, isCancelled: () => false };

function emptyAsyncIterable(): AsyncIterable<never> {
  return {
    [Symbol.asyncIterator]() {
      return { next: () => Promise.resolve({ done: true, value: undefined }) };
    },
  };
}

describe('MirrorDriver.backfill', () => {
  it('BKFL-001 copies missing objects to every replica, scoped to the given prefixes', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: replica, root: replicaRoot } = makeLocal('r');
    await put(primary, 'backups/a.zip', 'aaa');
    await put(primary, 'covers/skip.jpg', 'not in scope');
    const result = await makeMirror(primary, [replica]).backfill(['backups/'], HOOKS);
    expect(result).toMatchObject({ done: 1, total: 1, copied: 1, skipped: 0, failed: 0, deleted: 0, cancelled: false });
    expect(fs.readFileSync(path.join(replicaRoot, 'backups/a.zip'), 'utf8')).toBe('aaa');
    expect(fs.existsSync(path.join(replicaRoot, 'covers/skip.jpg'))).toBe(false); // scope rule
  });

  it('BKFL-002 skips size-matched objects and re-copies size mismatches', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: replica, root: replicaRoot } = makeLocal('r');
    await put(primary, 'backups/same.zip', 'equal');
    await put(replica, 'backups/same.zip', 'eq2al'); // same size → skipped
    await put(primary, 'backups/diff.zip', 'longer-content');
    await put(replica, 'backups/diff.zip', 'short'); // size mismatch → re-copied
    const result = await makeMirror(primary, [replica]).backfill(['backups/'], HOOKS);
    expect(result).toMatchObject({ done: 2, copied: 1, skipped: 1, failed: 0, deleted: 0 });
    expect(fs.readFileSync(path.join(replicaRoot, 'backups/diff.zip'), 'utf8')).toBe('longer-content');
    expect(fs.readFileSync(path.join(replicaRoot, 'backups/same.zip'), 'utf8')).toBe('eq2al'); // untouched
  });

  it('BKFL-003 a failing replica reports through the failure hook, counts failed, and the run continues', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: good, root: goodRoot } = makeLocal('good');
    const bad = {
      id: 'bad',
      stat: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockRejectedValue(new Error('replica on fire')),
      list: () => emptyAsyncIterable(), // holds nothing itself — keeps the sweep phase a no-op for this mock
    } as unknown as LocalDriver;
    const failures: ReplicaFailure[] = [];
    await put(primary, 'backups/a.zip', 'aaa');
    await put(primary, 'backups/b.zip', 'bbb');
    const result = await makeMirror(primary, [bad, good], (f) => failures.push(f)).backfill(['backups/'], HOOKS);
    expect(result).toMatchObject({ done: 2, copied: 2, failed: 2, deleted: 0, cancelled: false }); // good got both; bad failed both
    expect(failures).toHaveLength(2);
    expect(failures[0]).toMatchObject({ backend: 'bad', op: 'put' });
    expect(failures[0]!.error).toContain('replica on fire');
    expect(fs.existsSync(path.join(goodRoot, 'backups/b.zip'))).toBe(true);
  });

  it('BKFL-004 cancel stops after the in-flight key', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: replica } = makeLocal('r');
    for (let i = 0; i < 5; i++) await put(primary, `backups/${i}.zip`, `content-${i}`);
    let examined = 0;
    const hooks = {
      onProgress: (p: { done: number }) => {
        examined = p.done;
      },
      isCancelled: () => examined >= 2,
    };
    const result = await makeMirror(primary, [replica]).backfill(['backups/'], hooks);
    expect(result.cancelled).toBe(true);
    expect(result.done).toBeLessThan(5);
  });

  it('BKFL-005 a primary error aborts (propagates) instead of being swallowed', async () => {
    const { driver: replica } = makeLocal('r');
    const explodingPrimary = {
      id: 'p',
      list: () => ({
        [Symbol.asyncIterator]() {
          return {
            next: () => Promise.reject(new Error('primary listing failed')),
          };
        },
      }),
    } as unknown as LocalDriver;
    await expect(makeMirror(explodingPrimary, [replica]).backfill(['backups/'], HOOKS)).rejects.toThrow(
      'primary listing failed',
    );
  });

  it('BKFL-006 the sweep deletes replica keys absent from the primary key-set', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: replica, root: replicaRoot } = makeLocal('r');
    await put(primary, 'backups/a.zip', 'aaa');
    await put(replica, 'backups/a.zip', 'aaa'); // matches the primary — untouched
    await put(replica, 'backups/stale.zip', 'gone'); // absent from the primary — swept
    const result = await makeMirror(primary, [replica]).backfill(['backups/'], HOOKS);
    expect(result).toMatchObject({ deleted: 1, failed: 0, cancelled: false });
    expect(fs.existsSync(path.join(replicaRoot, 'backups/stale.zip'))).toBe(false);
    expect(fs.existsSync(path.join(replicaRoot, 'backups/a.zip'))).toBe(true);
  });

  it('BKFL-007 the race gate spares a replica key the primary regained since the copy loop', async () => {
    const { driver: primary } = makeLocal('p');
    const { driver: replica, root: replicaRoot } = makeLocal('r');
    await put(replica, 'backups/regained.zip', 'back'); // on the replica only, per the copy loop's enumeration
    // Simulate the primary regaining the object between the copy loop and the
    // sweep phase: list() never yields it (so it never enters the primary
    // key-set), but stat() — the sweep's race gate — reports it exists.
    const wrapped = {
      id: primary.id,
      list: (prefix: string) => primary.list(prefix),
      getStream: (key: string, range?: unknown) => (primary.getStream as (k: string, r?: unknown) => unknown)(key, range),
      stat: async (key: string) =>
        key === 'backups/regained.zip' ? { key, size: 4, mtimeMs: Date.now() } : primary.stat(key),
    } as unknown as LocalDriver;
    const result = await makeMirror(wrapped, [replica]).backfill(['backups/'], HOOKS);
    expect(result).toMatchObject({ deleted: 0, failed: 0, cancelled: false });
    expect(fs.existsSync(path.join(replicaRoot, 'backups/regained.zip'))).toBe(true); // spared by the race gate
  });

  it('BKFL-008 a replica list failure during the sweep is reported, skips that replica, and the run continues', async () => {
    const { driver: primary } = makeLocal('p');
    await put(primary, 'backups/a.zip', 'aaa');
    const bad = {
      id: 'bad',
      stat: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      list: () => {
        throw new Error('replica listing failed');
      },
    } as unknown as LocalDriver;
    const { driver: good, root: goodRoot } = makeLocal('good');
    await put(good, 'backups/stale.zip', 'stale'); // extra on the good replica — still swept once bad is skipped
    const failures: ReplicaFailure[] = [];
    const result = await makeMirror(primary, [bad, good], (f) => failures.push(f)).backfill(['backups/'], HOOKS);
    expect(failures.some((f) => f.backend === 'bad' && f.op === 'list')).toBe(true);
    expect(fs.existsSync(path.join(goodRoot, 'backups/stale.zip'))).toBe(false); // the good replica's sweep still ran
    expect(result.deleted).toBe(1);
  });

  it('BKFL-009 cancel mid-sweep stops after the in-flight key', async () => {
    const { driver: primary } = makeLocal('p'); // empty — every replica key is a sweep candidate
    const { driver: replica } = makeLocal('r');
    for (let i = 0; i < 5; i++) await put(replica, `backups/stale-${i}.zip`, `x`);
    let deleted = 0;
    const hooks = {
      onProgress: (p: { deleted: number }) => {
        deleted = p.deleted;
      },
      isCancelled: () => deleted >= 2,
    };
    const result = await makeMirror(primary, [replica]).backfill(['backups/'], hooks);
    expect(result.cancelled).toBe(true);
    expect(result.deleted).toBeGreaterThanOrEqual(2);
    expect(result.deleted).toBeLessThan(5);
  });
});
