/**
 * Real-socket repro for the audit's open question ("does a client abort
 * mid-download take the process down?") — task C3. Everything else touching
 * this fix is exercised at the unit level (storage.service.test.ts,
 * maps.controller.test.ts, share.controller.test.ts, exception-filter.test.ts)
 * against mocked streams; this suite is the one place a *real* TCP client
 * destroys a *real* connection mid-transfer, so the sendFile ECONNABORTED
 * path and the pipeline() premature-close path are proven against actual
 * socket/eos semantics, not a mock's approximation of them.
 *
 * A bare express() + http.Server wraps StorageService directly — no need to
 * boot the full Nest app for this, since sendToResponse is the one place
 * every byte-serving caller (files-download, journey-public,
 * photo-resolver, trek-photo-cache, backup, /uploads/photos) funnels
 * through, per storage.service.ts's own docblock.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { LocalDriver } from '../../src/nest/storage/drivers/local.driver';
import type { StorageRegistryService, ResolvedCategory } from '../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../src/nest/storage/storage.service';
import type { ObjectStat, StorageDriver } from '../../src/nest/storage/storage.types';

/** Trickles chunks on a timer so a real client has time to abort mid-stream
 *  regardless of machine/CI speed — the S3-network-latency stand-in. */
class SlowReadable extends Readable {
  private sent = 0;
  private destroyedFlag = false;
  constructor(private readonly totalChunks = 40) {
    super();
  }
  override _read(): void {
    if (this.sent >= this.totalChunks) {
      this.push(null);
      return;
    }
    this.sent++;
    setTimeout(() => this.push(Buffer.alloc(2048, 'x')), 5);
  }
  override _destroy(err: Error | null, cb: (err: Error | null) => void): void {
    this.destroyedFlag = true;
    cb(err);
  }
  get wasDestroyed(): boolean {
    return this.destroyedFlag;
  }
}

/** Fails before ever pushing a byte — the S3-SDK-network-blip stand-in: a
 *  source error with NO client involved at all, before any header has gone
 *  out. Used to prove a pre-header failure still rejects (the caller's
 *  miss/error contract must run), even when the failure carries a code that
 *  looks abort-like (ECONNRESET). */
class FailingBeforeFirstByteReadable extends Readable {
  override _read(): void {
    process.nextTick(() => this.destroy(Object.assign(new Error('simulated S3 network blip'), { code: 'ECONNRESET' })));
  }
}

function makeRemoteFixture(): { storage: StorageService; lastStream: () => SlowReadable | undefined } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-abort-'));
  let last: SlowReadable | undefined;
  const stat: ObjectStat = { key: 'remote.bin', size: 40 * 2048, mtimeMs: 1 };
  const driver: StorageDriver = {
    id: 'stub-remote-abort',
    put: async () => undefined,
    getStream: async () => {
      last = new SlowReadable();
      return { stream: last, stat };
    },
    stat: async () => stat,
    delete: async () => undefined,
    list: async function* () {
      yield* [] as ObjectStat[];
    },
  };
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix: '', backendName: 'stub-remote-abort' }),
    tempDir: () => tmpDir,
    replicaFailures: () => [],
  } as unknown as StorageRegistryService;
  return { storage: new StorageService(registry), lastStream: () => last };
}

function makeFailingRemoteFixture(): { storage: StorageService } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-abort-fail-'));
  const stat: ObjectStat = { key: 'remote.bin', size: 40 * 2048, mtimeMs: 1 };
  const driver: StorageDriver = {
    id: 'stub-remote-fail',
    put: async () => undefined,
    getStream: async () => ({ stream: new FailingBeforeFirstByteReadable(), stat }),
    stat: async () => stat,
    delete: async () => undefined,
    list: async function* () {
      yield* [] as ObjectStat[];
    },
  };
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix: '', backendName: 'stub-remote-fail' }),
    tempDir: () => tmpDir,
    replicaFailures: () => [],
  } as unknown as StorageRegistryService;
  return { storage: new StorageService(registry) };
}

function makeLocalFixture(): { storage: StorageService; root: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-abort-local-'));
  const driver = new LocalDriver({ id: 'stub-local-abort', root });
  driver.init({ cleanSpool: true });
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix: '', backendName: 'stub-local-abort' }),
    tempDir: () => root,
    replicaFailures: () => [],
  } as unknown as StorageRegistryService;
  return { storage: new StorageService(registry), root };
}

describe('storage stream abort — real socket (C3 repro)', () => {
  let unhandled: unknown[] = [];
  const onUnhandled = (err: unknown) => unhandled.push(err);

  beforeEach(() => {
    unhandled = [];
    process.on('unhandledRejection', onUnhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled);
  });

  describe('remote (pipeline) branch', () => {
    let server: http.Server;
    let baseUrl: string;
    let fx: ReturnType<typeof makeRemoteFixture>;
    let outcome: { settled: 'resolved' | 'rejected' | 'pending'; error?: unknown };

    beforeAll(async () => {
      fx = makeRemoteFixture();
      const app = express();
      app.get('/slow', (_req, res) => {
        outcome = { settled: 'pending' };
        fx.storage
          .sendToResponse('files', 'remote.bin', res)
          .then(() => {
            outcome = { settled: 'resolved' };
          })
          .catch((error: unknown) => {
            outcome = { settled: 'rejected', error };
          });
      });
      server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('resolves cleanly (no 500, no unhandled rejection) and destroys the source stream (no S3 socket leak)', async () => {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`${baseUrl}/slow`, (res) => {
          res.once('data', () => {
            // Abort mid-transfer: headers + at least one chunk are already
            // on the wire, the SlowReadable is still trickling out the rest.
            req.destroy();
          });
          res.on('error', () => {}); // expected once we destroy the socket
        });
        req.on('error', () => {}); // ECONNRESET after our own destroy — expected
        req.on('close', () => resolve());
        setTimeout(() => reject(new Error('timed out waiting for the aborted request to close')), 5000);
      });

      // Give the server's pipeline() rejection handler a tick to settle and
      // the source's _destroy to run.
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(outcome.settled).toBe('resolved'); // swallowed, not a 500/rejection
      expect(outcome.error).toBeUndefined();
      expect(fx.lastStream()?.wasDestroyed).toBe(true); // the leak fix
      expect(unhandled).toEqual([]); // the audit's "does it take the process down" question

      // The process/server is still alive and serving — prove it with one
      // more full, un-aborted request.
      const finalBody: string = await new Promise((resolve, reject) => {
        http
          .get(`${baseUrl}/slow`, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', reject);
          })
          .on('error', reject);
      });
      expect(finalBody.length).toBe(40 * 2048);
    }, 10000);
  });

  // CRITICAL regression case (task C3 review): a source failure BEFORE any
  // byte reaches the client — no client abort involved at all — must still
  // reject sendToResponse over a real connection, so the route's own
  // miss/error handling actually runs instead of silently answering a
  // truncated 200 with an empty body.
  //
  // Note on what's actually observable here: node:stream/promises'
  // `pipeline()` destroys EVERY stream in the pipeline on any single
  // failure — including the destination (`res`) — as part of its own
  // cleanup, confirmed empirically (`dst.destroyed === true` by the time
  // pipeline's rejection is caught, even for a purely source-side, pre-any-
  // write error). So a caller's own fallback write attempted from its catch
  // block (`res.status(502).json(...)`) is reliably a safe, silent no-op —
  // Node's OutgoingMessage swallows writes after destroy rather than
  // throwing — not a delivered response body. What this test can and does
  // pin: the promise REJECTS (the miss/error contract genuinely runs,
  // instead of being silently swallowed as if it were a client abort), that
  // safe no-op write doesn't crash the process or the request, and the
  // server survives to serve the next, unrelated request correctly.
  describe('remote (pipeline) branch — pre-header source failure', () => {
    let server: http.Server;
    let baseUrl: string;
    let outcome: { settled: 'resolved' | 'rejected' | 'pending'; error?: unknown };

    beforeAll(async () => {
      const fx = makeFailingRemoteFixture();
      const app = express();
      app.get('/broken', (_req, res) => {
        outcome = { settled: 'pending' };
        fx.storage
          .sendToResponse('files', 'remote.bin', res)
          .then(() => {
            outcome = { settled: 'resolved' };
          })
          .catch((error: unknown) => {
            outcome = { settled: 'rejected', error };
            // The caller's own miss/error contract: prove it actually RUNS
            // (as opposed to sendToResponse silently resolving and this
            // branch never executing at all) — even though, per the note
            // above, the write itself is a no-op onto an already-destroyed
            // response.
            if (!res.headersSent) res.status(502).json({ error: 'upstream failure' });
          });
      });
      app.get('/ok', (_req, res) => res.status(200).json({ ok: true }));
      server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('rejects (the miss/error contract genuinely fires) instead of silently resolving as a fake empty success', async () => {
      // The connection ends one way or another (a delivered body, or the
      // destroyed-response no-op surfacing as a raw close) — either way,
      // within the timeout, proving the server isn't stuck.
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`${baseUrl}/broken`, (res) => {
          res.resume();
          res.on('end', () => resolve());
          res.on('error', () => resolve()); // a destroyed-response close is expected here
        });
        req.on('error', () => resolve()); // socket hang up is expected here too
        setTimeout(() => reject(new Error('timed out — the server got stuck')), 5000);
      });

      expect(outcome.settled).toBe('rejected'); // NOT silently swallowed as a client abort
      expect((outcome.error as { code?: string } | undefined)?.code).toBe('ECONNRESET');
      expect(unhandled).toEqual([]);

      // The process/server survived and correctly serves an unrelated,
      // ordinary request afterward — the real "did this take the process
      // down" proof.
      const ok: { status: number; body: unknown } = await new Promise((resolve, reject) => {
        http
          .get(`${baseUrl}/ok`, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }));
            res.on('error', reject);
          })
          .on('error', reject);
      });
      expect(ok).toEqual({ status: 200, body: { ok: true } });
    }, 10000);
  });

  describe('local (res.sendFile) branch', () => {
    let server: http.Server;
    let baseUrl: string;
    let fx: ReturnType<typeof makeLocalFixture>;
    let outcome: { settled: 'resolved' | 'rejected' | 'pending'; error?: unknown };

    beforeAll(async () => {
      fx = makeLocalFixture();
      // A large-enough file that writing it to the socket isn't instantaneous.
      await fx.storage.put('files', 'big.bin', Readable.from(Buffer.alloc(20 * 1024 * 1024, 'y')));
      const app = express();
      app.get('/big', (_req, res) => {
        outcome = { settled: 'pending' };
        fx.storage
          .sendToResponse('files', 'big.bin', res)
          .then(() => {
            outcome = { settled: 'resolved' };
          })
          .catch((error: unknown) => {
            outcome = { settled: 'rejected', error };
          });
      });
      server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('resolves cleanly (no 500, no unhandled rejection) when the client aborts mid-download', async () => {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`${baseUrl}/big`, (res) => {
          res.once('data', () => {
            req.destroy();
          });
          res.on('error', () => {});
        });
        req.on('error', () => {});
        req.on('close', () => resolve());
        setTimeout(() => reject(new Error('timed out waiting for the aborted request to close')), 5000);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(outcome.settled).toBe('resolved');
      expect(outcome.error).toBeUndefined();
      expect(unhandled).toEqual([]);
    }, 10000);
  });
});
