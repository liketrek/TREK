import {
  StorageInvalidKeyError,
  StorageNotFoundError,
  type ObjectStat,
  type StorageDriver,
} from '../../../../src/nest/storage/storage.types';

import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * The parameterized driver contract suite — the groundwork's real product
 * (spec, Testing). Every driver must pass it: LocalDriver and MirrorDriver in
 * v1; a future S3 driver imports this same suite (against MinIO/localstack)
 * and must pass before touching TREK code.
 *
 * Not a `.test.ts` on purpose: vitest only collects files matching the
 * `*.test.ts` include, so this suite runs exclusively through a driver's own
 * spec file.
 */

export interface DriverHarness {
  driver: StorageDriver;
  /** Create a temp file whose ownership put() may take (LocalTempFile source). */
  makeTempFile(contents: string | Buffer): Promise<string>;
  cleanup(): Promise<void>;
}

const INVALID_KEYS = ['../x', '/abs', 'a\\b', 'a//b', '.tmp/x', 'a/.h', 'a\u0000b'];

export function describeStorageDriver(name: string, makeHarness: () => Promise<DriverHarness>): void {
  describe(`storage driver contract: ${name}`, () => {
    let h: DriverHarness;

    beforeEach(async () => {
      h = await makeHarness();
    });
    afterEach(async () => {
      await h.cleanup();
    });

    async function readAll(key: string, range?: { start: number; end?: number }): Promise<Buffer> {
      const { stream } = await h.driver.getStream(key, range);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
      return Buffer.concat(chunks);
    }

    async function listAll(prefix: string): Promise<ObjectStat[]> {
      const out: ObjectStat[] = [];
      for await (const stat of h.driver.list(prefix)) out.push(stat);
      return out;
    }

    it('roundtrips a stream source and stats its size', async () => {
      await h.driver.put('a/stream.bin', Readable.from(Buffer.from('hello storage')));
      expect((await readAll('a/stream.bin')).toString()).toBe('hello storage');
      const stat = await h.driver.stat('a/stream.bin');
      expect(stat).toMatchObject({ key: 'a/stream.bin', size: 13 });
      expect(stat!.mtimeMs).toBeGreaterThan(0);
    });

    it('roundtrips a LocalTempFile source and consumes the temp file', async () => {
      const tmp = await h.makeTempFile('from tmp file');
      await h.driver.put('a/tmpfile.bin', { tmpPath: tmp });
      expect((await readAll('a/tmpfile.bin')).toString()).toBe('from tmp file');
      expect(fs.existsSync(tmp)).toBe(false); // ownership transferred
    });

    it('overwrites an existing key', async () => {
      await h.driver.put('a/over.bin', Readable.from('first'));
      await h.driver.put('a/over.bin', Readable.from('second!'));
      expect((await readAll('a/over.bin')).toString()).toBe('second!');
      expect((await h.driver.stat('a/over.bin'))!.size).toBe(7);
    });

    it('serves closed and open-ended byte ranges', async () => {
      await h.driver.put('a/range.bin', Readable.from('0123456789'));
      expect((await readAll('a/range.bin', { start: 2, end: 5 })).toString()).toBe('2345');
      expect((await readAll('a/range.bin', { start: 7 })).toString()).toBe('789');
    });

    it('returns the full-object stat on a ranged read', async () => {
      // Pins LocalDriver parity for remote drivers: size is the TOTAL object
      // size (S3: from the 206 Content-Range total), never the range length.
      await h.driver.put('a/rstat.bin', Readable.from('0123456789'));
      const { stream, stat } = await h.driver.getStream('a/rstat.bin', { start: 2, end: 5 });
      for await (const _ of stream) void _; // drain so the harness can clean up
      expect(stat).toMatchObject({ key: 'a/rstat.bin', size: 10 });
    });

    it('roundtrips a zero-byte stream source', async () => {
      await h.driver.put('a/empty.bin', Readable.from([]));
      expect((await readAll('a/empty.bin')).length).toBe(0);
      expect((await h.driver.stat('a/empty.bin'))!.size).toBe(0);
      await h.driver.delete('a/empty.bin');
      expect(await h.driver.stat('a/empty.bin')).toBeNull();
    });

    it('roundtrips a zero-byte LocalTempFile source and consumes the temp file', async () => {
      const tmp = await h.makeTempFile('');
      await h.driver.put('a/empty-tmpfile.bin', { tmpPath: tmp });
      expect((await readAll('a/empty-tmpfile.bin')).length).toBe(0);
      expect((await h.driver.stat('a/empty-tmpfile.bin'))!.size).toBe(0);
      expect(fs.existsSync(tmp)).toBe(false); // ownership transferred
      await h.driver.delete('a/empty-tmpfile.bin');
      expect(await h.driver.stat('a/empty-tmpfile.bin')).toBeNull();
    });

    it('rejects getStream on a missing key with StorageNotFoundError', async () => {
      await expect(h.driver.getStream('a/nope.bin')).rejects.toBeInstanceOf(StorageNotFoundError);
    });

    it('stats a missing key as null', async () => {
      expect(await h.driver.stat('a/nope.bin')).toBeNull();
    });

    it('deletes idempotently', async () => {
      await h.driver.put('a/gone.bin', Readable.from('x'));
      await h.driver.delete('a/gone.bin');
      expect(await h.driver.stat('a/gone.bin')).toBeNull();
      await expect(h.driver.delete('a/gone.bin')).resolves.toBeUndefined();
    });

    it('lists by prefix with full keys and sizes', async () => {
      await h.driver.put('a/one.bin', Readable.from('11'));
      await h.driver.put('a/sub/two.bin', Readable.from('222'));
      await h.driver.put('b/three.bin', Readable.from('3'));

      const underA = await listAll('a/');
      expect(underA.map((s) => s.key).sort()).toEqual(['a/one.bin', 'a/sub/two.bin']);
      expect(underA.find((s) => s.key === 'a/sub/two.bin')!.size).toBe(3);

      const everything = await listAll('');
      expect(everything.map((s) => s.key).sort()).toEqual(['a/one.bin', 'a/sub/two.bin', 'b/three.bin']);
    });

    it.each(INVALID_KEYS)('rejects invalid key %j on every method', async (key) => {
      await expect(h.driver.put(key, Readable.from('x'))).rejects.toBeInstanceOf(StorageInvalidKeyError);
      await expect(h.driver.getStream(key)).rejects.toBeInstanceOf(StorageInvalidKeyError);
      await expect(h.driver.stat(key)).rejects.toBeInstanceOf(StorageInvalidKeyError);
      await expect(h.driver.delete(key)).rejects.toBeInstanceOf(StorageInvalidKeyError);
    });

    it('leaves no object and no visible partial when the source stream errors', async () => {
      const boom = new Readable({
        read() {
          this.push('partial bytes');
          this.destroy(new Error('source exploded'));
        },
      });
      await expect(h.driver.put('a/broken.bin', boom)).rejects.toThrow();
      expect(await h.driver.stat('a/broken.bin')).toBeNull();
      expect((await listAll('')).map((s) => s.key)).toEqual([]);
    });

    it('honors the getSpoolDir contract', async () => {
      const spool = h.driver.getSpoolDir?.() ?? null;
      if (spool === null) return; // drivers with no local filesystem
      expect(fs.existsSync(spool)).toBe(true);
      // Spool contents are invisible to the abstraction by construction.
      fs.writeFileSync(path.join(spool, 'leftover.part'), 'junk');
      expect((await listAll('')).map((s) => s.key)).toEqual([]);
    });
  });
}
