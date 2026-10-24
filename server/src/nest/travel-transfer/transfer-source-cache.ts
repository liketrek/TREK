import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import { DomainError } from '../common/domain-error';
import { StorageService } from '../storage/storage.service';
import type { ObjectStat } from '../storage/storage.types';
import { canonical, fail, MAX_ORIGINAL, sha } from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { createHash, randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';

export interface TransferSource {
  stream: Readable;
  sourceStamp: string;
  expectedSize: number | null;
  expectedDigest: string | null;
  check: () => Promise<void>;
}
export interface PreparedSource {
  name: string;
  stamp: string;
  sourceStamp: string;
  size: number;
  digest: string;
}
const PREFIX = 'transfer-source-';
const NAME = /^transfer-source-[a-f0-9]{48}\.bin$/;
const TTL = 26 * 60 * 60 * 1000;
const QUOTA = 4 * 1024 * 1024 * 1024;
const fingerprint = (stat: ObjectStat) => sha(canonical([stat.size, stat.mtimeMs, stat.etag ?? null]));

/** Private immutable snapshot bytes. Never linked to trip_files or served through a public upload route. */
@Injectable()
export class TransferSourceCache {
  private writing = false;
  constructor(
    @InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository,
    private readonly storage: StorageService,
  ) {}
  async get(id: string): Promise<PreparedSource> {
    const row = await this.store.fileHash(id);
    const match =
      row && /^source-v1:(transfer-source-[a-f0-9]{48}\.bin):([a-f0-9]{64}):([a-f0-9]{64})$/.exec(row.stamp);
    if (!row || !match) fail('Prepared original expired; request a fresh snapshot');
    const file = { name: match[1], stamp: match[2], sourceStamp: match[3], size: row.size, digest: row.digest };
    const stat = await this.storage.stat('files', file.name);
    if (!stat || stat.mtimeMs < Date.now() - TTL || fingerprint(stat) !== file.stamp)
      fail('Prepared original expired or changed; request a fresh snapshot');
    return file;
  }
  async prepare(id: string, open: () => Promise<TransferSource>): Promise<PreparedSource> {
    // No wait queue retaining credentials or request contexts; one bounded writer in this runtime.
    if (this.writing) fail('Original preparation is busy; retry the snapshot', 429);
    this.writing = true;
    const name = PREFIX + randomBytes(24).toString('hex') + '.bin';
    let original: TransferSource | undefined;
    try {
      await this.sweep(MAX_ORIGINAL);
      original = await open();
      if (!/^[a-f0-9]{64}$/.test(original.sourceStamp)) fail('Original source cannot be verified', 422);
      const hash = createHash('sha256');
      let size = 0;
      const source = original;
      const counted = Readable.from(
        (async function* () {
          for await (const chunk of source.stream) {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += bytes.length;
            if (size > MAX_ORIGINAL || (source.expectedSize !== null && size > source.expectedSize))
              fail('Original exceeds transfer limit', 413);
            hash.update(bytes);
            yield bytes;
          }
        })(),
      );
      await this.storage.put('files', name, counted, { contentType: 'application/octet-stream' });
      const digest = hash.digest('hex');
      if (
        (source.expectedSize !== null && source.expectedSize !== size) ||
        (source.expectedDigest && source.expectedDigest !== digest)
      )
        fail('Original changed during preparation');
      await source.check();
      const stat = await this.storage.stat('files', name);
      if (!stat || stat.size !== size) fail('Prepared original is incomplete');
      const stamp = fingerprint(stat);
      await this.store.saveFileHash(id, `source-v1:${name}:${stamp}:${source.sourceStamp}`, size, digest);
      return { name, stamp, sourceStamp: source.sourceStamp, size, digest };
    } catch (error) {
      await this.storage.delete('files', name);
      if (error instanceof DomainError) throw error;
      // Stream and storage failures may contain provider URLs or credentials.
      return fail('Photo original could not be read completely', 422);
    } finally {
      original?.stream.destroy();
      this.writing = false;
    }
  }
  async read(file: PreparedSource, offset: number, limit: number, open: () => Promise<TransferSource>) {
    // A cache hit is never evidence of current provider access. Open the actual original, then cancel its body.
    const current = await open();
    current.stream.destroy();
    if (
      current.sourceStamp !== file.sourceStamp ||
      (current.expectedSize !== null && current.expectedSize !== file.size) ||
      (current.expectedDigest && current.expectedDigest !== file.digest)
    )
      fail('Original source changed during transfer');
    await current.check();
    let bytes = Buffer.alloc(0);
    if (offset < file.size) {
      const end = Math.min(file.size, offset + limit) - 1;
      const opened = await this.storage.getStream('files', file.name, { start: offset, end });
      const parts: Buffer[] = [];
      let size = 0;
      try {
        if (fingerprint(opened.stat) !== file.stamp) fail('Prepared original changed');
        for await (const part of opened.stream) {
          const buffer = Buffer.isBuffer(part) ? part : Buffer.from(part);
          size += buffer.length;
          if (size > end - offset + 1) fail('Invalid prepared original range');
          parts.push(buffer);
        }
      } finally {
        opened.stream.destroy();
      }
      const after = await this.storage.stat('files', file.name);
      if (size !== end - offset + 1 || !after || fingerprint(after) !== file.stamp) fail('Prepared original changed');
      bytes = Buffer.concat(parts);
    }
    await current.check();
    return bytes;
  }
  /** Only this private namespace is eligible for eviction; active readers fail closed if an object was evicted. */
  async sweep(reserve = 0) {
    const files: ObjectStat[] = [];
    for await (const file of this.storage.list('files')) if (NAME.test(file.key)) files.push(file);
    files.sort((a, b) => a.mtimeMs - b.mtimeMs);
    let total = files.reduce((sum, file) => sum + file.size, 0);
    await files.reduce(async (previous, file) => {
      await previous;
      if (file.mtimeMs >= Date.now() - TTL && total + reserve <= QUOTA) return;
      await this.storage.delete('files', file.key);
      total -= file.size;
    }, Promise.resolve());
  }
}
