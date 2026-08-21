import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import type { Response } from 'express';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import type { ReplicaFailure } from '../../../../src/nest/storage/drivers/mirror.driver';
import type { StorageRegistryService, ResolvedCategory } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import {
  StorageInvalidKeyError,
  StorageNotFoundError,
  type ByteRange,
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

/**
 * A driver whose `getLocalPath` resolves to a path that is NOT on disk, but
 * whose `getStream` still succeeds — the façade-level stand-in for a
 * MirrorDriver whose primary lost the file (failed delete, disk hiccup, …)
 * while a replica still holds it. `getLocalPath` on MirrorDriver only ever
 * consults the primary (mirror.driver.ts), so the façade must never trust
 * that path as proof of presence — it has to fs-check it and fall through to
 * the stream branch (which is what actually reaches the replica) when it's
 * gone.
 */
function makeGhostLocalPathFixture(contents: string): Fixture & { driverCalls: string[] } {
  const fx = makeFixture('files/');
  const driverCalls: string[] = [];
  const bytes = Buffer.from(contents);
  const stat: ObjectStat = { key: 'files/ghost.bin', size: bytes.length, mtimeMs: 1 };
  const ghostPath = path.join(fx.root, 'files', 'ghost.bin'); // resolvable, but never written
  const driver: StorageDriver = {
    id: 'stub-ghost-local',
    put: async () => undefined,
    getStream: async (key: string) => {
      driverCalls.push(`getStream:${key}`);
      return { stream: Readable.from(bytes), stat: { ...stat, key } };
    },
    stat: async (key: string) => ({ ...stat, key }), // the composite still resolves the object
    delete: async () => undefined,
    list: async function* () {
      yield* [] as ObjectStat[];
    },
    getLocalPath: () => ghostPath,
  };
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix: 'files/', backendName: 'stub-ghost-local' }),
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

  it('falls through to the stream branch when getLocalPath resolves but the file is not actually on disk', async () => {
    // Composite-driver stand-in (task C9-i): the façade must fs-check the
    // local path itself rather than trust driver.stat() as "the file is at
    // localPath" — driver.stat here still says present (a replica has it).
    const fx = makeGhostLocalPathFixture('replica bytes');

    const result = await fx.storage.withLocalFile('files', 'ghost.bin', async (absPath) =>
      fs.readFileSync(absPath, 'utf8'),
    );

    expect(result).toBe('replica bytes');
    expect(fx.driverCalls).toEqual(['getStream:files/ghost.bin']); // reached the stream branch
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
  res: Response & { headersSent: boolean; statusCode: number };
  sendFileCalls: Array<{ name: string; root: string }>;
  headers: Record<string, string>;
  body: () => Promise<string>;
}

/** What the serving path reads off `res.req` — express always populates it. */
interface ReqInit {
  method?: string;
  headers?: Record<string, string | string[]>;
}

// Real headersSent semantics (mirroring http.ServerResponse): flips true on
// the FIRST write/end, before that point it's false — never a static value.
// This matters here specifically: the remote branch's abort-swallow is
// gated on `res.headersSent`, so a mock that fakes it as an inert boolean
// would hide a regression where the gate stops actually gating (see CRITICAL
// finding on task C3 review: the pre-fix code swallowed a pre-header S3
// source ECONNRESET as if it were a client abort).
function makeRes(req: ReqInit = {}): MockRes {
  const sink = new PassThrough();
  const sendFileCalls: Array<{ name: string; root: string }> = [];
  const headers: Record<string, string> = {};
  const collected: Buffer[] = [];
  sink.on('data', (c: Buffer) => collected.push(c));
  const res = Object.assign(sink, {
    headersSent: false,
    statusCode: 200,
    // The remote branch reads res.req for method + conditional/Range headers,
    // exactly as the local branch's res.sendFile already does. It must be a
    // real EventEmitter: node's end-of-stream (which pipeline() drives) treats
    // a `.req` on the destination as an http request and cleans up listeners
    // on it — a plain object literal there throws
    // "stream.req.removeListener is not a function" out of pipeline.
    req: Object.assign(new EventEmitter(), { method: req.method ?? 'GET', headers: req.headers ?? {} }),
    setHeader: (key: string, value: string) => {
      // Node's real ServerResponse.setHeader THROWS ERR_INVALID_CHAR on a
      // control character in the value. Reproduced here because it is
      // reachable in production: Content-Disposition is built from
      // client-supplied filenames (files-download.controller.ts feeds it
      // multer's originalname), so a name carrying a CR/LF makes staging
      // fail mid-serve — a mock that silently accepts anything would hide
      // the resource leak that failure can cause.
      if (/[\r\n]/.test(String(value))) {
        throw Object.assign(new Error(`Invalid character in header content ["${key}"]`), {
          code: 'ERR_INVALID_CHAR',
        });
      }
      headers[key] = value;
      return res;
    },
    // Node's getHeader is case-insensitive; the serving path uses it to see
    // whether the CALLER already staged a Content-Type (trek-photo-cache
    // does, for its extension-less `.bin` objects), so the mock must be too
    // — a case-sensitive lookup here would hide a real precedence bug.
    getHeader: (key: string): string | undefined => {
      const found = Object.keys(headers).find((name) => name.toLowerCase() === key.toLowerCase());
      return found === undefined ? undefined : headers[found];
    },
    // express's res.set — the form every caller actually uses to stage
    // headers before handing the response to sendToResponse.
    set: (key: string, value: string) => {
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

  it('falls through to the stream branch when getLocalPath resolves but the file is not actually on disk', async () => {
    // Composite-driver stand-in (task C9-i): sendToResponse must not use
    // driver.stat() as "the file is at localPath" — it fs-checks localPath
    // itself, and on absence falls through to the branch that actually
    // reaches a MirrorDriver's replica.
    const fx = makeGhostLocalPathFixture('replica bytes');
    const mock = makeRes();

    await fx.storage.sendToResponse('files', 'ghost.bin', mock.res, { contentType: 'image/jpeg' });

    expect(mock.sendFileCalls).toEqual([]); // the local path was never trusted
    expect(fx.driverCalls).toEqual(['getStream:files/ghost.bin']);
    expect(mock.headers['Content-Type']).toBe('image/jpeg');
    expect(await mock.body()).toBe('replica bytes');
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

// Remote-serving parity (task C4). The local branch inherits express send's
// content-type / ETag / Last-Modified / conditional-GET / Range / HEAD
// machinery from res.sendFile; a path-less backend has none of it, so the
// stream branch has to reproduce the same contract from one pre-flight stat.
// This suite pins the wiring — the state machine itself is proved in
// http-serving.test.ts.
describe('StorageService sendToResponse — remote serving parity', () => {
  const MTIME = 5000;
  const LAST_MODIFIED = new Date(MTIME).toUTCString();
  const BODY = 'abcdefghij'; // 10 bytes: indices 0-9

  interface ServingFixture {
    storage: StorageService;
    getStreamCalls: Array<{ key: string; range?: ByteRange }>;
    statCalls: string[];
    /** Whether the most recently opened driver stream was destroyed. */
    streamDestroyed: () => boolean;
  }

  function makeServingFixture(
    opts: { body?: string; mtimeMs?: number; etag?: string; missing?: boolean; vanishesBeforeGet?: boolean } = {},
  ): ServingFixture {
    const tempDir = makeTmpDir();
    const bytes = Buffer.from(opts.body ?? BODY);
    const base: ObjectStat = {
      key: 'photo.jpg',
      size: bytes.length,
      mtimeMs: opts.mtimeMs ?? MTIME,
      etag: opts.etag,
    };
    const getStreamCalls: Array<{ key: string; range?: ByteRange }> = [];
    const statCalls: string[] = [];
    let destroyed = false;
    const driver: StorageDriver = {
      id: 'stub-serving',
      put: async () => undefined,
      getStream: async (key: string, range?: ByteRange) => {
        getStreamCalls.push({ key, range });
        // `vanishesBeforeGet` is the stat→get delete race: the pre-flight stat
        // resolved, the object was gone by the time the body was opened.
        if (opts.missing || opts.vanishesBeforeGet) throw new StorageNotFoundError(key);
        const slice = range ? bytes.subarray(range.start, (range.end ?? bytes.length - 1) + 1) : bytes;
        // The returned stream stands in for an open S3 socket / fd: whoever
        // takes it owns closing it, so destruction has to be observable.
        const stream = Readable.from(slice);
        const origDestroy = stream.destroy.bind(stream);
        stream.destroy = ((err?: Error) => {
          destroyed = true;
          return origDestroy(err);
        }) as typeof stream.destroy;
        return { stream, stat: { ...base, key } };
      },
      stat: async (key: string) => {
        statCalls.push(key);
        return opts.missing ? null : { ...base, key };
      },
      delete: async () => undefined,
      list: async function* () {
        yield* [] as ObjectStat[];
      },
      // no getLocalPath — the universal fallback branch
    };
    const registry = {
      resolve: (): ResolvedCategory => ({ driver, keyPrefix: '', backendName: 'stub-serving' }),
      tempDir: () => tempDir,
      replicaFailures: () => [],
    } as unknown as StorageRegistryService;
    return { storage: new StorageService(registry), getStreamCalls, statCalls, streamDestroyed: () => destroyed };
  }

  describe('content type', () => {
    it('defaults Content-Type from the key extension', async () => {
      const fx = makeServingFixture();
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);
      expect(mock.headers['Content-Type']).toBe('image/jpeg');
    });

    it('falls back to application/octet-stream for an unknown extension', async () => {
      const fx = makeServingFixture();
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'blob.weird', mock.res);
      expect(mock.headers['Content-Type']).toBe('application/octet-stream');
    });

    it('lets an explicit opts.contentType win over the derived one', async () => {
      const fx = makeServingFixture();
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res, {
        contentType: 'image/webp',
        disposition: 'attachment; filename="p.webp"',
      });
      expect(mock.headers['Content-Type']).toBe('image/webp');
      expect(mock.headers['Content-Disposition']).toBe('attachment; filename="p.webp"');
    });

    it('keeps a Content-Type the caller staged on the response itself', async () => {
      // trek-photo-cache.service.ts's exact shape: its objects are
      // extension-less `.bin` blobs whose real type lives in a meta table, so
      // it res.set()s the type and passes no opts. Deriving over that would
      // ship every S3-backed cached thumbnail as application/octet-stream.
      const fx = makeServingFixture();
      const mock = makeRes();
      mock.res.set('Content-Type', 'image/webp');
      mock.res.set('Cache-Control', 'public, max-age=3600');

      await fx.storage.sendToResponse('photos-trek', 'cached.bin', mock.res);

      expect(mock.headers['Content-Type']).toBe('image/webp');
      expect(mock.headers['Cache-Control']).toBe('public, max-age=3600');
      expect(await mock.body()).toBe(BODY);
    });

    it('lets opts.contentType override even a staged header', async () => {
      const fx = makeServingFixture();
      const mock = makeRes();
      mock.res.set('Content-Type', 'image/webp');

      await fx.storage.sendToResponse('photos-trek', 'cached.bin', mock.res, { contentType: 'image/avif' });

      expect(mock.headers['Content-Type']).toBe('image/avif');
    });
  });

  describe('validators', () => {
    it('emits the driver ETag, Last-Modified and Accept-Ranges', async () => {
      const fx = makeServingFixture({ etag: '"s3tag"' });
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);
      expect(mock.headers['ETag']).toBe('"s3tag"');
      expect(mock.headers['Last-Modified']).toBe(LAST_MODIFIED);
      expect(mock.headers['Accept-Ranges']).toBe('bytes');
      expect(mock.headers['Content-Length']).toBe('10');
      expect(await mock.body()).toBe(BODY);
    });

    it('derives a weak size-mtime ETag when the driver has none', async () => {
      const fx = makeServingFixture();
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);
      expect(mock.headers['ETag']).toBe(`W/"a-${MTIME.toString(16)}"`);
    });

    it('emits NO ETag and NO Last-Modified when the backend reports mtimeMs 0', async () => {
      // S3-compatible backends can answer without a LastModified; a 1970
      // header would be "fresh forever" to any revalidating client.
      const fx = makeServingFixture({ mtimeMs: 0 });
      const mock = makeRes();
      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);
      expect(mock.headers['ETag']).toBeUndefined();
      expect(mock.headers['Last-Modified']).toBeUndefined();
      expect(await mock.body()).toBe(BODY); // still served, just uncached
    });
  });

  describe('conditional GET', () => {
    it('answers 304 to a matching If-None-Match with validators, no body and no getStream', async () => {
      const fx = makeServingFixture({ etag: '"s3tag"' });
      const mock = makeRes({ headers: { 'if-none-match': '"s3tag"' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(304);
      expect(mock.headers['ETag']).toBe('"s3tag"');
      expect(mock.headers['Last-Modified']).toBe(LAST_MODIFIED);
      expect(mock.headers['Content-Length']).toBeUndefined();
      expect(mock.headers['Content-Type']).toBeUndefined();
      expect(fx.getStreamCalls).toEqual([]); // the whole point: one HEAD, zero bytes fetched
      expect(fx.statCalls).toEqual(['photo.jpg']);
      expect(await mock.body()).toBe('');
    });

    it('answers 304 to an If-Modified-Since at or after the mtime', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ headers: { 'if-modified-since': LAST_MODIFIED } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(304);
      expect(fx.getStreamCalls).toEqual([]);
    });

    it('serves 200 when the If-None-Match tag is stale', async () => {
      const fx = makeServingFixture({ etag: '"s3tag"' });
      const mock = makeRes({ headers: { 'if-none-match': '"old"' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(200);
      expect(await mock.body()).toBe(BODY);
    });
  });

  describe('range requests', () => {
    it('answers 206 with Content-Range, the adjusted length, and passes the range to the driver', async () => {
      const fx = makeServingFixture({ etag: '"s3tag"' });
      const mock = makeRes({ headers: { range: 'bytes=2-5' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(206);
      expect(mock.headers['Content-Range']).toBe('bytes 2-5/10');
      expect(mock.headers['Content-Length']).toBe('4');
      expect(mock.headers['Accept-Ranges']).toBe('bytes');
      expect(fx.getStreamCalls).toEqual([{ key: 'photo.jpg', range: { start: 2, end: 5 } }]);
      expect(await mock.body()).toBe('cdef');
    });

    it('resolves an open-ended range against the pre-stat size', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ headers: { range: 'bytes=7-' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.headers['Content-Range']).toBe('bytes 7-9/10');
      expect(fx.getStreamCalls[0].range).toEqual({ start: 7, end: 9 });
      expect(await mock.body()).toBe('hij');
    });

    it('clamps an end past EOF instead of asking the driver for bytes that do not exist', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ headers: { range: 'bytes=8-9999' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.headers['Content-Range']).toBe('bytes 8-9/10');
      expect(fx.getStreamCalls[0].range).toEqual({ start: 8, end: 9 });
    });

    it('resolves a suffix range from the pre-stat size (the reason the path stats first)', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ headers: { range: 'bytes=-3' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(206);
      expect(mock.headers['Content-Range']).toBe('bytes 7-9/10');
      expect(fx.getStreamCalls[0].range).toEqual({ start: 7, end: 9 });
      expect(await mock.body()).toBe('hij');
    });

    it('answers 416 with Content-Range bytes */size and never touches the driver body', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ headers: { range: 'bytes=50-60' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(416);
      expect(mock.headers['Content-Range']).toBe('bytes */10');
      expect(fx.getStreamCalls).toEqual([]);
      expect(await mock.body()).toBe('');
    });

    it('serves the full 200 for a multi-range or malformed Range (no multipart/byteranges)', async () => {
      for (const range of ['bytes=0-1,4-5', 'bytes=abc']) {
        const fx = makeServingFixture();
        const mock = makeRes({ headers: { range } });

        await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

        expect(mock.res.statusCode).toBe(200);
        expect(mock.headers['Content-Range']).toBeUndefined();
        expect(mock.headers['Content-Length']).toBe('10');
        expect(fx.getStreamCalls[0].range).toBeUndefined();
        expect(await mock.body()).toBe(BODY);
      }
    });

    it('honours a strong If-Range match and ignores the range on a mismatch', async () => {
      const hit = makeServingFixture({ etag: '"s3tag"' });
      const hitRes = makeRes({ headers: { range: 'bytes=2-5', 'if-range': '"s3tag"' } });
      await hit.storage.sendToResponse('photos-trek', 'photo.jpg', hitRes.res);
      expect(hitRes.res.statusCode).toBe(206);

      const miss = makeServingFixture({ etag: '"s3tag"' });
      const missRes = makeRes({ headers: { range: 'bytes=2-5', 'if-range': '"changed"' } });
      await miss.storage.sendToResponse('photos-trek', 'photo.jpg', missRes.res);
      expect(missRes.res.statusCode).toBe(200);
      expect(missRes.headers['Content-Length']).toBe('10');
      expect(await missRes.body()).toBe(BODY);
    });
  });

  describe('HEAD', () => {
    it('sends the full headers with no body and no getStream call', async () => {
      const fx = makeServingFixture({ etag: '"s3tag"' });
      const mock = makeRes({ method: 'HEAD' });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(200);
      expect(mock.headers['Content-Length']).toBe('10');
      expect(mock.headers['Content-Type']).toBe('image/jpeg');
      expect(mock.headers['ETag']).toBe('"s3tag"');
      expect(mock.headers['Accept-Ranges']).toBe('bytes');
      expect(fx.getStreamCalls).toEqual([]);
      expect(await mock.body()).toBe('');
    });

    it('answers a ranged HEAD with 206 headers, still without fetching bytes', async () => {
      const fx = makeServingFixture();
      const mock = makeRes({ method: 'HEAD', headers: { range: 'bytes=2-5' } });

      await fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res);

      expect(mock.res.statusCode).toBe(206);
      expect(mock.headers['Content-Range']).toBe('bytes 2-5/10');
      expect(mock.headers['Content-Length']).toBe('4');
      expect(fx.getStreamCalls).toEqual([]);
      expect(await mock.body()).toBe('');
    });
  });

  it('destroys the already-opened stream when header staging throws (no leaked S3 socket)', async () => {
    // The body opens before headers are staged, so staging is now the last
    // thing that can fail with a live stream in hand — and it CAN fail:
    // res.setHeader raises ERR_INVALID_CHAR on a control character, and
    // files-download.controller.ts builds Content-Disposition out of
    // multer's client-supplied originalname. Nothing pipes the stream on
    // that path, so nothing else would ever close it.
    const fx = makeServingFixture();
    const mock = makeRes();

    await expect(
      fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res, {
        disposition: 'attachment; filename="evil\r\nX-Injected: 1"',
      }),
    ).rejects.toMatchObject({ code: 'ERR_INVALID_CHAR' });

    expect(fx.getStreamCalls).toHaveLength(1); // the body WAS opened…
    expect(fx.streamDestroyed()).toBe(true); // …and closed again before the throw escaped
    expect(mock.res.headersSent).toBe(false);
  });

  it('leaves the response pristine when getStream fails after a ranged decision', async () => {
    // The stat→get delete race on a Range request. A caller that recovers on
    // the SAME response object — trek-photo-cache.service.ts falls back to a
    // cache miss on `StorageNotFoundError && !res.headersSent`, and
    // photo-resolver.service.ts then re-serves through that very res — would
    // otherwise inherit a 206 status and a stale Content-Range from an
    // attempt that never produced a byte, even if the retry serves in full.
    const fx = makeServingFixture({ vanishesBeforeGet: true });
    const mock = makeRes({ headers: { range: 'bytes=2-5' } });

    await expect(fx.storage.sendToResponse('photos-trek', 'photo.jpg', mock.res)).rejects.toBeInstanceOf(
      StorageNotFoundError,
    );

    expect(mock.res.headersSent).toBe(false);
    expect(mock.res.statusCode).toBe(200); // never left on 206
    expect(mock.headers).toEqual({}); // no Content-Range / Content-Length / validator residue
    expect(fx.getStreamCalls).toEqual([{ key: 'photo.jpg', range: { start: 2, end: 5 } }]);
  });

  it('throws StorageNotFoundError from the pre-flight stat, before any header is set', async () => {
    const fx = makeServingFixture({ missing: true });
    const mock = makeRes();

    await expect(fx.storage.sendToResponse('photos-trek', 'gone.jpg', mock.res)).rejects.toBeInstanceOf(
      StorageNotFoundError,
    );
    expect(mock.headers).toEqual({});
    expect(fx.getStreamCalls).toEqual([]); // the miss costs one HEAD, not a GET
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
