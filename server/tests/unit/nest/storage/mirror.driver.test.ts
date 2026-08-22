import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import {
  MirrorDriver,
  type BackfillHooks,
  type ReplicaFailure,
} from '../../../../src/nest/storage/drivers/mirror.driver';
import {
  StorageBackendError,
  StorageNotFoundError,
  type StorageDriver,
} from '../../../../src/nest/storage/storage.types';
import { describeStorageDriver, type DriverHarness } from './storage-driver.contract';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trek-mirror-'));
}

function makeLocal(id: string): { driver: LocalDriver; root: string } {
  const root = makeTmpDir();
  const driver = new LocalDriver({ id, root });
  driver.init({ cleanSpool: true });
  return { driver, root };
}

interface MirrorFixture {
  mirror: MirrorDriver;
  primary: LocalDriver;
  replica: LocalDriver;
  spool: string;
  failures: ReplicaFailure[];
  dirs: string[];
}

function makeMirror(): MirrorFixture {
  const p = makeLocal('primary-local');
  const r = makeLocal('replica-local');
  const spool = makeTmpDir();
  const failures: ReplicaFailure[] = [];
  const mirror = new MirrorDriver({
    id: 'backup-mirror',
    primary: p.driver,
    replicas: [r.driver],
    tempDir: () => spool,
    onReplicaFailure: (f) => failures.push(f),
  });
  return { mirror, primary: p.driver, replica: r.driver, spool, failures, dirs: [p.root, r.root, spool] };
}

async function makeHarness(): Promise<DriverHarness> {
  const fx = makeMirror();
  const tmpFiles = makeTmpDir();
  let counter = 0;
  return {
    driver: fx.mirror,
    makeTempFile: async (contents) => {
      const p = path.join(tmpFiles, `src-${counter++}.tmp`);
      fs.writeFileSync(p, contents);
      return p;
    },
    cleanup: async () => {
      for (const dir of [...fx.dirs, tmpFiles]) fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

describeStorageDriver('MirrorDriver', makeHarness);

async function readAll(driver: StorageDriver, key: string): Promise<string> {
  const { stream } = await driver.getStream(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString();
}

describe('MirrorDriver specifics', () => {
  const cleanups: string[] = [];
  const track = (fx: MirrorFixture): MirrorFixture => {
    cleanups.push(...fx.dirs);
    return fx;
  };

  afterEach(() => {
    vi.restoreAllMocks();
    while (cleanups.length) fs.rmSync(cleanups.pop()!, { recursive: true, force: true });
  });

  it('lands a stream put in the primary AND every replica', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-1.zip', Readable.from('zip bytes'));
    expect(await readAll(fx.primary, 'backup-1.zip')).toBe('zip bytes');
    expect(await readAll(fx.replica, 'backup-1.zip')).toBe('zip bytes');
  });

  it('resolves put and reports when a replica write fails', async () => {
    const fx = track(makeMirror());
    vi.spyOn(fx.replica, 'put').mockRejectedValueOnce(new StorageBackendError('replica disk full'));

    await expect(fx.mirror.put('backup-2.zip', Readable.from('payload'))).resolves.toBeUndefined();

    expect(await readAll(fx.primary, 'backup-2.zip')).toBe('payload');
    expect(fx.failures).toHaveLength(1);
    expect(fx.failures[0]).toMatchObject({ backend: 'replica-local', key: 'backup-2.zip', op: 'put' });
    expect(fx.failures[0].error).toContain('replica disk full');
  });

  it("reports a replica failure with the wrapped cause chain, not just the wrapper's message", async () => {
    const fx = track(makeMirror());
    const raw = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:9000'), { code: 'ECONNREFUSED' });
    vi.spyOn(fx.replica, 'put').mockRejectedValueOnce(
      new StorageBackendError("put failed for 'backup-3.zip' on 's3'", raw),
    );

    await expect(fx.mirror.put('backup-3.zip', Readable.from('payload'))).resolves.toBeUndefined();

    expect(fx.failures).toHaveLength(1);
    expect(fx.failures[0].error).toContain("put failed for 'backup-3.zip' on 's3'");
    expect(fx.failures[0].error).toContain('ECONNREFUSED');
  });

  it('rejects put and never touches replicas when the primary write fails', async () => {
    const fx = track(makeMirror());
    vi.spyOn(fx.primary, 'put').mockRejectedValueOnce(new StorageBackendError('primary gone'));
    const replicaPut = vi.spyOn(fx.replica, 'put');

    await expect(fx.mirror.put('backup-3.zip', Readable.from('x'))).rejects.toBeInstanceOf(StorageBackendError);
    expect(replicaPut).not.toHaveBeenCalled();
    expect(fx.failures).toHaveLength(0);
  });

  it('falls back to a replica when the primary read ERRORS', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-4.zip', Readable.from('mirrored'));
    vi.spyOn(fx.primary, 'getStream').mockRejectedValueOnce(new StorageBackendError('primary io error'));

    expect(await readAll(fx.mirror, 'backup-4.zip')).toBe('mirrored');
  });

  it('falls back to a replica on a plain primary miss (binding decision: a read succeeds if ANY member holds it)', async () => {
    const fx = track(makeMirror());
    // Plant the object only on the replica: per the widened invariant a
    // primary miss now DOES consult replicas, for both getStream and stat.
    await fx.replica.put('only-on-replica.zip', Readable.from('ghost'));
    const replicaGet = vi.spyOn(fx.replica, 'getStream');

    expect(await readAll(fx.mirror, 'only-on-replica.zip')).toBe('ghost');
    expect(replicaGet).toHaveBeenCalled();
    expect((await fx.mirror.stat('only-on-replica.zip'))?.size).toBe('ghost'.length);
  });

  it('stays a genuine miss when neither the primary nor any replica holds the object', async () => {
    const fx = track(makeMirror());
    await expect(fx.mirror.getStream('nowhere.zip')).rejects.toBeInstanceOf(StorageNotFoundError);
    expect(await fx.mirror.stat('nowhere.zip')).toBeNull();
  });

  it('falls back for stat and list on primary error', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-5.zip', Readable.from('12345'));

    vi.spyOn(fx.primary, 'stat').mockRejectedValueOnce(new StorageBackendError('io'));
    expect((await fx.mirror.stat('backup-5.zip'))!.size).toBe(5);

    vi.spyOn(fx.primary, 'list').mockImplementationOnce(() => {
      throw new StorageBackendError('io');
    });
    const keys: string[] = [];
    for await (const stat of fx.mirror.list('')) keys.push(stat.key);
    expect(keys).toEqual(['backup-5.zip']);
  });

  it('fans delete out to all targets, tolerating a miss on either side', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-6.zip', Readable.from('bye'));
    await fx.replica.delete('backup-6.zip'); // already gone on the replica

    await fx.mirror.delete('backup-6.zip');
    expect(await fx.primary.stat('backup-6.zip')).toBeNull();
    expect(await fx.replica.stat('backup-6.zip')).toBeNull();
    expect(fx.failures).toHaveLength(0); // idempotent miss is not a failure
  });

  it('has no spool dir of its own and delegates getLocalPath to the primary', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-7.zip', Readable.from('here'));

    expect(fx.mirror.getSpoolDir()).toBeNull();
    const local = fx.mirror.getLocalPath('backup-7.zip');
    expect(local).toBe(fx.primary.getLocalPath('backup-7.zip'));
  });

  it('leaves no spool leftovers in tempDir on success or failure', async () => {
    const fx = track(makeMirror());
    await fx.mirror.put('backup-8.zip', Readable.from('ok'));
    expect(fs.readdirSync(fx.spool)).toEqual([]);

    vi.spyOn(fx.primary, 'put').mockRejectedValueOnce(new StorageBackendError('nope'));
    await expect(fx.mirror.put('backup-9.zip', Readable.from('fail'))).rejects.toThrow();
    expect(fs.readdirSync(fx.spool)).toEqual([]);
  });
});

describe('MirrorDriver.stat null-continue fallback loop', () => {
  interface TriFixture {
    mirror: MirrorDriver;
    primary: LocalDriver;
    replicaA: LocalDriver;
    replicaB: LocalDriver;
    dirs: string[];
  }

  function makeTriMirror(): TriFixture {
    const p = makeLocal('primary-local');
    const a = makeLocal('replica-a');
    const b = makeLocal('replica-b');
    const spool = makeTmpDir();
    const mirror = new MirrorDriver({
      id: 'tri-mirror',
      primary: p.driver,
      replicas: [a.driver, b.driver],
      tempDir: () => spool,
    });
    return { mirror, primary: p.driver, replicaA: a.driver, replicaB: b.driver, dirs: [p.root, a.root, b.root, spool] };
  }

  const cleanups: string[] = [];
  afterEach(() => {
    vi.restoreAllMocks();
    while (cleanups.length) fs.rmSync(cleanups.pop()!, { recursive: true, force: true });
  });

  it('a replica returning null does not short-circuit the search — the next replica still gets a look', async () => {
    const fx = makeTriMirror();
    cleanups.push(...fx.dirs);
    await fx.replicaB.put('deep.zip', Readable.from('found on b'));
    vi.spyOn(fx.primary, 'stat').mockRejectedValueOnce(new StorageBackendError('primary io error'));
    const statA = vi.spyOn(fx.replicaA, 'stat');

    const result = await fx.mirror.stat('deep.zip');

    expect(result?.size).toBe('found on b'.length);
    expect(statA).toHaveBeenCalled(); // replicaA WAS consulted (and missed) before replicaB answered
  });

  it('a replica that itself errors during the search is treated as a miss, not a hard failure', async () => {
    const fx = makeTriMirror();
    cleanups.push(...fx.dirs);
    await fx.replicaB.put('deep-2.zip', Readable.from('found on b again'));
    vi.spyOn(fx.primary, 'stat').mockRejectedValueOnce(new StorageBackendError('primary io error'));
    vi.spyOn(fx.replicaA, 'stat').mockRejectedValueOnce(new StorageBackendError('replica-a unreachable'));

    const result = await fx.mirror.stat('deep-2.zip');

    expect(result?.size).toBe('found on b again'.length);
  });

  it('rethrows the remembered primary error only when every replica also misses', async () => {
    const fx = makeTriMirror();
    cleanups.push(...fx.dirs);
    const boom = new StorageBackendError('primary io error');
    vi.spyOn(fx.primary, 'stat').mockRejectedValueOnce(boom);

    await expect(fx.mirror.stat('nowhere.zip')).rejects.toBe(boom);
  });
});

describe('MirrorDriver.backfill polish', () => {
  const cleanups: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    while (cleanups.length) fs.rmSync(cleanups.pop()!, { recursive: true, force: true });
  });

  function setup(): {
    mirror: MirrorDriver;
    primary: LocalDriver;
    replica: StorageDriver;
    primaryRoot: string;
    failures: ReplicaFailure[];
  } {
    const p = makeLocal('primary-local');
    const r = makeLocal('replica-local');
    const spool = makeTmpDir();
    const failures: ReplicaFailure[] = [];
    const mirror = new MirrorDriver({
      id: 'backup-mirror',
      primary: p.driver,
      replicas: [r.driver],
      tempDir: () => spool,
      onReplicaFailure: (f) => failures.push(f),
    });
    cleanups.push(p.root, r.root, spool);
    return { mirror, primary: p.driver, replica: r.driver, primaryRoot: p.root, failures };
  }

  function hooks(): BackfillHooks {
    return { onProgress: () => undefined, isCancelled: () => false };
  }

  it('MIRROR-BF-020 backfill puts carry a contentType derived from the key', async () => {
    const fx = setup();
    await fx.primary.put('files/a.pdf', Readable.from('pdf bytes'));
    const putSpy = vi.spyOn(fx.replica, 'put');

    await fx.mirror.backfill(['files/'], hooks());

    const call = putSpy.mock.calls.find(([key]) => key === 'files/a.pdf')!;
    expect(call[2]).toEqual({ contentType: 'application/pdf' });
  });

  it('MIRROR-BF-021 a replica STAT failure reports op stat, not put', async () => {
    const fx = setup();
    await fx.primary.put('files/a.pdf', Readable.from('pdf bytes'));
    vi.spyOn(fx.replica, 'stat').mockRejectedValueOnce(new Error('probe down'));

    await fx.mirror.backfill(['files/'], hooks());

    expect(fx.failures.some((f) => f.op === 'stat')).toBe(true);
  });

  it('MIRROR-BF-022 done never exceeds total, and total settles to done on completion', async () => {
    const fx = setup();
    await fx.primary.put('files/a.txt', Readable.from('a'));
    await fx.primary.put('files/b.txt', Readable.from('b'));

    const snapshots: Array<{ done: number; total: number }> = [];
    const result = await fx.mirror.backfill(['files/'], {
      onProgress: (p) => {
        snapshots.push({ done: p.done, total: p.total });
        if (snapshots.length === 1) fs.writeFileSync(path.join(fx.primaryRoot, 'files', 'late.txt'), 'x');
      },
      isCancelled: () => false,
    });

    for (const s of snapshots) expect(s.done).toBeLessThanOrEqual(s.total);
    expect(result.total).toBe(result.done);
  });
});
