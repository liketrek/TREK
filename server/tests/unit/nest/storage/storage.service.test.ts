import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import type { Response } from 'express';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import type { ReplicaFailure } from '../../../../src/nest/storage/drivers/mirror.driver';
import type { StorageRegistryService, ResolvedCategory } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import {
  StorageInvalidKeyError,
  StorageNotFoundError,
  type ObjectStat,
  type StorageDriver,
} from '../../../../src/nest/storage/storage.types';

// Facade over a stub registry (the weather.controller.test.ts casting style)
// backed by a REAL LocalDriver, so key composition, prefix stripping, and both
// sendToResponse/withLocalFile branches are exercised against actual files.

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-facade-'));
  tmpDirs.push(dir);
  return dir;
}

interface Fixture {
  storage: StorageService;
  driver: LocalDriver;
  root: string;
  tempDir: string;
  failures: ReplicaFailure[];
}

function makeFixture(keyPrefix = 'files/'): Fixture {
  const root = makeTmpDir();
  const tempDir = makeTmpDir();
  const driver = new LocalDriver({ id: 'stub-local', root });
  driver.init({ cleanSpool: true });
  const failures: ReplicaFailure[] = [];
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix, backendName: 'stub-local' }),
    tempDir: () => tempDir,
    replicaFailures: () => failures,
  } as unknown as StorageRegistryService;
  return { storage: new StorageService(registry), driver, root, tempDir, failures };
}

/** A driver with no getLocalPath — the remote-driver branch every helper must handle. */
function makeStreamOnlyFixture(contents: string): Fixture & { driverCalls: string[] } {
  const fx = makeFixture('');
  const driverCalls: string[] = [];
  const bytes = Buffer.from(contents);
  const stat: ObjectStat = { key: 'remote.bin', size: bytes.length, mtimeMs: 1 };
  const streamOnly: StorageDriver = {
    id: 'stub-remote',
    put: async () => undefined,
    getStream: async (key: string) => {
      driverCalls.push(`getStream:${key}`);
      return { stream: Readable.from(bytes), stat: { ...stat, key } };
    },
    stat: async (key: string) => ({ ...stat, key }),
    delete: async () => undefined,
    list: async function* () {
      yield* [] as ObjectStat[];
    },
    // no getLocalPath, no getSpoolDir
  };
  const registry = {
    resolve: (): ResolvedCategory => ({ driver: streamOnly, keyPrefix: '', backendName: 'stub-remote' }),
    tempDir: () => fx.tempDir,
    replicaFailures: () => fx.failures,
  } as unknown as StorageRegistryService;
  return { ...fx, storage: new StorageService(registry), driverCalls };
}

afterEach(() => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe('StorageService key composition', () => {
  it('composes keyPrefix + name on writes and strips it back in list()', async () => {
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'a.pdf', Readable.from('doc'));
    await fx.storage.put('files', 'nested/b.pdf', Readable.from('doc2'));

    // on disk under the driver prefix
    expect(fs.existsSync(path.join(fx.root, 'files/a.pdf'))).toBe(true);

    const names: string[] = [];
    for await (const stat of fx.storage.list('files')) names.push(stat.key);
    expect(names.sort()).toEqual(['a.pdf', 'nested/b.pdf']); // category-relative

    const nested: string[] = [];
    for await (const stat of fx.storage.list('files', 'nested/')) nested.push(stat.key);
    expect(nested).toEqual(['nested/b.pdf']);
  });

  it('rejects a name that composes into an invalid key', async () => {
    const fx = makeFixture('files/');
    await expect(fx.storage.put('files', '../escape.bin', Readable.from('x'))).rejects.toBeInstanceOf(
      StorageInvalidKeyError,
    );
    await expect(fx.storage.stat('files', '.tmp/spool.part')).rejects.toBeInstanceOf(StorageInvalidKeyError);
  });

  it('delegates stat/exists/delete/getStream with the composed key', async () => {
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'c.bin', Readable.from('12345'));

    expect((await fx.storage.stat('files', 'c.bin'))!.size).toBe(5);
    expect(await fx.storage.exists('files', 'c.bin')).toBe(true);
    expect(await fx.storage.exists('files', 'nope.bin')).toBe(false);

    const { stream, stat } = await fx.storage.getStream('files', 'c.bin', { start: 1, end: 3 });
    expect(stat.size).toBe(5);
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(Buffer.from(c as Buffer));
    expect(Buffer.concat(chunks).toString()).toBe('234');

    await fx.storage.delete('files', 'c.bin');
    expect(await fx.storage.exists('files', 'c.bin')).toBe(false);
  });
});

describe('StorageService spool + temp dirs', () => {
  it('spoolDirFor returns the backend spool for local drivers and tempDir() otherwise', () => {
    const fx = makeFixture();
    expect(fx.storage.spoolDirFor('files')).toBe(path.join(fs.realpathSync(fx.root), '.tmp'));
    expect(fx.storage.tempDir()).toBe(fx.tempDir);

    const remote = makeStreamOnlyFixture('x');
    expect(remote.storage.spoolDirFor('files')).toBe(remote.tempDir);
  });
});

describe('StorageService withLocalFile', () => {
  it('hands local drivers their real path', async () => {
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'img.jpg', Readable.from('jpeg bytes'));

    const result = await fx.storage.withLocalFile('files', 'img.jpg', async (absPath) => {
      expect(absPath).toBe(path.join(fs.realpathSync(fx.root), 'files/img.jpg'));
      return fs.readFileSync(absPath, 'utf8');
    });
    expect(result).toBe('jpeg bytes');
  });

  it('throws StorageNotFoundError for a local miss', async () => {
    const fx = makeFixture('files/');
    await expect(fx.storage.withLocalFile('files', 'ghost.jpg', async () => 'never')).rejects.toBeInstanceOf(
      StorageNotFoundError,
    );
  });

  it('downloads to tempDir for path-less drivers and cleans up, even when fn throws', async () => {
    const remote = makeStreamOnlyFixture('remote bytes');

    let seenPath = '';
    const result = await remote.storage.withLocalFile('files', 'remote.bin', async (absPath) => {
      seenPath = absPath;
      return fs.readFileSync(absPath, 'utf8');
    });
    expect(result).toBe('remote bytes');
    expect(seenPath.startsWith(remote.tempDir + path.sep)).toBe(true);
    expect(fs.existsSync(seenPath)).toBe(false); // cleaned up

    await expect(
      remote.storage.withLocalFile('files', 'remote.bin', async (absPath) => {
        seenPath = absPath;
        throw new Error('processing failed');
      }),
    ).rejects.toThrow('processing failed');
    expect(fs.existsSync(seenPath)).toBe(false); // cleaned up on throw too
  });
});

describe('StorageService getLocalPathOrNull', () => {
  it('returns the real path for a local driver whose object exists on disk', async () => {
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'img.jpg', Readable.from('jpeg bytes'));

    const localPath = await fx.storage.getLocalPathOrNull('files', 'img.jpg');
    expect(localPath).toBe(path.join(fs.realpathSync(fx.root), 'files/img.jpg'));
  });

  it('returns null for a path-less (remote) driver', async () => {
    const remote = makeStreamOnlyFixture('remote bytes');
    expect(await remote.storage.getLocalPathOrNull('files', 'remote.bin')).toBeNull();
    // The probe never falls back to streaming itself — it's a pure locality check.
    expect(remote.driverCalls).toEqual([]);
  });

  it('returns null for a local miss (no fs.existsSync throw)', async () => {
    const fx = makeFixture('files/');
    expect(await fx.storage.getLocalPathOrNull('files', 'ghost.jpg')).toBeNull();
  });

  it('fail-safe: returns null when the local path exists in the driver API but the file has vanished from disk', async () => {
    // Binding controller ruling: "local path available" means the path exists
    // on disk. Simulates a file deleted between storage.list() and this call
    // (or by another process) — the caller must fall back to streaming rather
    // than push a path that will 404/throw when read.
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'raced.jpg', Readable.from('bytes'));
    fs.rmSync(path.join(fs.realpathSync(fx.root), 'files/raced.jpg'));

    expect(await fx.storage.getLocalPathOrNull('files', 'raced.jpg')).toBeNull();
  });

  it('rejects a name that composes into an invalid key', async () => {
    const fx = makeFixture('files/');
    await expect(fx.storage.getLocalPathOrNull('files', '../escape.bin')).rejects.toBeInstanceOf(
      StorageInvalidKeyError,
    );
  });
});

interface MockRes {
  res: Response & { headersSent: boolean };
  sendFileCalls: Array<{ name: string; root: string }>;
  headers: Record<string, string>;
  body: () => Promise<string>;
}

// Real headersSent semantics (mirroring http.ServerResponse): flips true on
// the FIRST write/end, before that point it's false — never a static value.
// This matters here specifically: the remote branch's abort-swallow is
// gated on `res.headersSent`, so a mock that fakes it as an inert boolean
// would hide a regression where the gate stops actually gating (see CRITICAL
// finding on task C3 review: the pre-fix code swallowed a pre-header S3
// source ECONNRESET as if it were a client abort).
function makeRes(): MockRes {
  const sink = new PassThrough();
  const sendFileCalls: Array<{ name: string; root: string }> = [];
  const headers: Record<string, string> = {};
  const collected: Buffer[] = [];
  sink.on('data', (c: Buffer) => collected.push(c));
  const res = Object.assign(sink, {
    headersSent: false,
    setHeader: (key: string, value: string) => {
      headers[key] = value;
      return res;
    },
    sendFile: (name: string, opts: { root: string }, cb: (err?: Error) => void) => {
      sendFileCalls.push({ name, root: opts.root });
      cb();
    },
  });
  const realWrite = sink.write.bind(sink) as (...a: unknown[]) => unknown;
  const realEnd = sink.end.bind(sink) as (...a: unknown[]) => unknown;
  res.write = ((...args: unknown[]) => {
    res.headersSent = true;
    return realWrite(...args);
  }) as unknown as typeof res.write;
  res.end = ((...args: unknown[]) => {
    res.headersSent = true;
    return realEnd(...args);
  }) as unknown as typeof res.end;
  return {
    res: res as unknown as MockRes['res'],
    sendFileCalls,
    headers,
    // sendToResponse resolves on 'finish', so by the time a test reads the
    // body the sink has already flushed everything into `collected`.
    body: async () => Buffer.concat(collected).toString(),
  };
}

describe('StorageService sendToResponse', () => {
  it('serves local files via root-relative res.sendFile (the files-download quirk)', async () => {
    const fx = makeFixture('files/');
    await fx.storage.put('files', 'doc.pdf', Readable.from('%PDF'));

    const mock = makeRes();
    await fx.storage.sendToResponse('files', 'doc.pdf', mock.res, {
      contentType: 'application/pdf',
      disposition: 'inline',
    });

    expect(mock.sendFileCalls).toEqual([
      { name: 'doc.pdf', root: path.join(fs.realpathSync(fx.root), 'files') },
    ]);
    expect(mock.headers['Content-Type']).toBe('application/pdf');
    expect(mock.headers['Content-Disposition']).toBe('inline');
  });

  it('throws StorageNotFoundError on a miss (callers decide 404/204/next())', async () => {
    const fx = makeFixture('files/');
    const mock = makeRes();
    await expect(fx.storage.sendToResponse('files', 'ghost.pdf', mock.res)).rejects.toBeInstanceOf(
      StorageNotFoundError,
    );
    expect(mock.sendFileCalls).toEqual([]);
  });

  it('stream-pipes with Content-Length for path-less drivers', async () => {
    const remote = makeStreamOnlyFixture('streamed body');
    const mock = makeRes();

    await remote.storage.sendToResponse('files', 'remote.bin', mock.res, { contentType: 'image/jpeg' });

    expect(mock.sendFileCalls).toEqual([]); // no local fast-path available
    expect(mock.headers['Content-Length']).toBe(String('streamed body'.length));
    expect(mock.headers['Content-Type']).toBe('image/jpeg');
    expect(await mock.body()).toBe('streamed body');
  });

  // Local (res.sendFile) branch: a client abort mid-download surfaces
  // through the sendFile callback's err argument, never a throw. Mirrors the
  // exact contract storageStaticHandler (platform.routes.ts) implements
  // caller-side for the /uploads/* static mounts.
  describe('local branch — sendFile callback abort tolerance', () => {
    function makeAbortRes(err: { code?: string; syscall?: string } | undefined): MockRes {
      const mock = makeRes();
      mock.res.sendFile = ((_name: string, _opts: unknown, cb: (e?: Error) => void) => {
        cb(err as Error | undefined);
      }) as unknown as Response['sendFile'];
      return mock;
    }

    it('resolves (not rejects) when sendFile fails with ECONNABORTED', async () => {
      const fx = makeFixture('files/');
      await fx.storage.put('files', 'doc.pdf', Readable.from('%PDF'));
      const mock = makeAbortRes({ code: 'ECONNABORTED' });

      await expect(fx.storage.sendToResponse('files', 'doc.pdf', mock.res)).resolves.toBeUndefined();
    });

    it('resolves (not rejects) when sendFile fails with syscall write (broken pipe)', async () => {
      const fx = makeFixture('files/');
      await fx.storage.put('files', 'doc.pdf', Readable.from('%PDF'));
      const mock = makeAbortRes({ syscall: 'write' });

      await expect(fx.storage.sendToResponse('files', 'doc.pdf', mock.res)).resolves.toBeUndefined();
    });

    it('rejects on a real sendFile error unrelated to a client abort', async () => {
      const fx = makeFixture('files/');
      await fx.storage.put('files', 'doc.pdf', Readable.from('%PDF'));
      const boom = Object.assign(new Error('disk read error'), { code: 'EIO' });
      const mock = makeAbortRes(boom);

      await expect(fx.storage.sendToResponse('files', 'doc.pdf', mock.res)).rejects.toBe(boom);
    });
  });

  // Remote (pipeline) branch: pipeline destroys BOTH ends on any failure —
  // the fix for the S3 keep-alive socket leak — while a client abort must
  // still resolve the caller's promise rather than reject/500.
  describe('remote branch — pipeline abort tolerance and source cleanup', () => {
    function makeAbortingStreamFixture(err: { code?: string; syscall?: string; message?: string }) {
      const fx = makeFixture('');
      let destroyed = false;
      const stream = new PassThrough();
      const origDestroy = stream.destroy.bind(stream);
      stream.destroy = ((e?: Error) => {
        destroyed = true;
        return origDestroy(e);
      }) as typeof stream.destroy;
      const stat: ObjectStat = { key: 'remote.bin', size: 100, mtimeMs: 1 };
      const streamOnly: StorageDriver = {
        id: 'stub-remote-abort',
        put: async () => undefined,
        getStream: async () => ({ stream, stat }),
        stat: async () => stat,
        delete: async () => undefined,
        list: async function* () {
          yield* [] as ObjectStat[];
        },
      };
      const registry = {
        resolve: (): ResolvedCategory => ({ driver: streamOnly, keyPrefix: '', backendName: 'stub-remote-abort' }),
        tempDir: () => fx.tempDir,
        replicaFailures: () => fx.failures,
      } as unknown as StorageRegistryService;
      return {
        storage: new StorageService(registry),
        stream,
        isSourceDestroyed: () => destroyed,
        fail: () => stream.destroy(Object.assign(new Error(err.message ?? 'aborted'), err)),
      };
    }

    it('resolves and destroys the source stream on a POST-header ERR_STREAM_PREMATURE_CLOSE (real mid-download client abort)', async () => {
      const fx = makeAbortingStreamFixture({});
      const mock = makeRes();
      const pending = fx.storage.sendToResponse('files', 'remote.bin', mock.res);
      // A real "mid-download" abort only happens after at least one chunk
      // has already reached res — push one through before aborting, so
      // res.headersSent genuinely flips true (the gate this test exists to
      // exercise), not just because the mock says so.
      fx.stream.write(Buffer.from('partial'));
      await new Promise((resolve) => setImmediate(resolve));
      expect(mock.res.headersSent).toBe(true);
      // Destroying the destination mid-pipe is what a real client abort does
      // to res — pipeline reports it as ERR_STREAM_PREMATURE_CLOSE.
      mock.res.destroy();

      await expect(pending).resolves.toBeUndefined();
      expect(fx.isSourceDestroyed()).toBe(true); // no leaked S3 keep-alive socket
    });

    it('resolves (swallows) a POST-header source ECONNRESET — a genuine mid-download network drop looks identical to a client abort', async () => {
      const fx = makeAbortingStreamFixture({ code: 'ECONNRESET' });
      const mock = makeRes();
      const pending = fx.storage.sendToResponse('files', 'remote.bin', mock.res);
      fx.stream.write(Buffer.from('partial'));
      await new Promise((resolve) => setImmediate(resolve));
      expect(mock.res.headersSent).toBe(true);
      fx.fail();

      await expect(pending).resolves.toBeUndefined();
    });

    // CRITICAL regression case (task C3 review): the driver's raw source
    // stream (e.g. the S3 SDK's HTTP response) can itself throw an
    // abort-LOOKING code (ECONNRESET/ERR_STREAM_PREMATURE_CLOSE) for a real
    // reason — a network blip — with NO client involved at all, before any
    // byte has reached res. The pre-fix code swallowed this unconditionally
    // and resolved sendToResponse as a silent empty-body success; the fix
    // gates the swallow on res.headersSent so a pre-header failure of ANY
    // code — including one that looks abort-like — always rejects, and the
    // caller's miss contract (404/204/next()) still runs.
    it('rejects a PRE-header source ECONNRESET (a real S3 network blip, not a client abort)', async () => {
      const fx = makeAbortingStreamFixture({ code: 'ECONNRESET' });
      const mock = makeRes();
      const pending = fx.storage.sendToResponse('files', 'remote.bin', mock.res);
      await new Promise((resolve) => setImmediate(resolve));
      expect(mock.res.headersSent).toBe(false); // no bytes ever reached res
      fx.fail();

      await expect(pending).rejects.toThrow('aborted');
    });

    it('rejects a PRE-header source error unrelated to any abort code', async () => {
      const fx = makeAbortingStreamFixture({ code: 'EPIPE_UNRELATED', message: 'upstream reset' });
      const mock = makeRes();
      const pending = fx.storage.sendToResponse('files', 'remote.bin', mock.res);
      await new Promise((resolve) => setImmediate(resolve));
      expect(mock.res.headersSent).toBe(false);
      fx.fail();

      await expect(pending).rejects.toThrow('upstream reset');
    });

    it('rejects a POST-header source error once headers are sent but the error is not abort-like', async () => {
      const fx = makeAbortingStreamFixture({ code: 'EIO', message: 'disk read error' });
      const mock = makeRes();
      const pending = fx.storage.sendToResponse('files', 'remote.bin', mock.res);
      fx.stream.write(Buffer.from('partial'));
      await new Promise((resolve) => setImmediate(resolve));
      expect(mock.res.headersSent).toBe(true);
      fx.fail();

      await expect(pending).rejects.toThrow('disk read error');
    });
  });
});

describe('StorageService health', () => {
  it('surfaces the registry replica-failure ring', () => {
    const fx = makeFixture();
    fx.failures.push({ backend: 'nas', key: 'backup-1.zip', op: 'put', error: 'disk full', at: 1 });
    expect(fx.storage.health().replicaFailures).toHaveLength(1);
    expect(fx.storage.health().replicaFailures[0].backend).toBe('nas');
  });
});
