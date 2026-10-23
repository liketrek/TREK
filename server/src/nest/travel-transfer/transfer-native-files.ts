import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageService } from '../storage/storage.service';
import type { ObjectStat, ServedCategory } from '../storage/storage.types';
import { TransferNative } from './transfer-native';
import { canonical, fail, MAX_ORIGINAL, sha, type Graph } from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

type Projection = Awaited<ReturnType<TransferNative['project']>>;
export interface NativeFileSource {
  record: string;
  category: ServedCategory;
  name: string;
}
export interface HashedNativeFile extends NativeFileSource {
  size: number;
  digest: string;
  stamp: string;
}
export type MaterializedFiles = Record<string, { filename: string; file_size: number; mime_type: string }>;
const fingerprint = (stat: ObjectStat): string =>
  canonical({ size: stat.size, mtime: stat.mtimeMs, etag: stat.etag ?? null });

@Injectable()
export class TransferNativeFiles {
  constructor(
    @InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository,
    private readonly native: TransferNative,
    private readonly storage: StorageService,
    private readonly uow: UnitOfWork,
  ) {}
  sources(projection: Projection, cover: string | null | undefined): NativeFileSource[] {
    const files: NativeFileSource[] = [];
    for (const [record, binding] of Object.entries(projection.bindings)) {
      if (!['trip_files', 'photos'].includes(binding.table)) continue;
      const row = projection.rows[binding.table].find((r) => r.id === binding.key.id);
      if (!row || typeof row.filename !== 'string') fail('Native original unavailable', 422);
      files.push({ record, category: binding.table === 'trip_files' ? 'files' : 'photos', name: row.filename });
    }
    if (cover) {
      if (!cover.startsWith('/uploads/covers/')) fail('External cover original is unavailable for transfer', 422);
      files.push({ record: 'trip', category: 'covers', name: cover.slice('/uploads/covers/'.length) });
    }
    for (const file of files)
      if (!file.name || file.name.includes('/') || file.name.includes('\\') || file.name === '.' || file.name === '..')
        fail('Invalid native original storage key', 422);
    return files;
  }
  async prepare(trip: number): Promise<HashedNativeFile[]> {
    const sources = await this.uow.transactional(async () =>
      this.sources(await this.native.project(trip), (await this.store.trip(trip))?.cover_image),
    );
    const files: HashedNativeFile[] = [];
    // Storage I/O must never occupy the database transaction/mutex.
    await sources.reduce(async (previous, source) => {
      await previous;
      files.push(await this.hash(source));
    }, Promise.resolve());
    return files;
  }
  private async hash(source: NativeFileSource): Promise<HashedNativeFile> {
    const stat = await this.storage.stat(source.category, source.name);
    if (!stat) fail('Native original unavailable', 422);
    if (stat.size > MAX_ORIGINAL || stat.size < 0) fail('Native original exceeds transfer limit', 413);
    const stamp = fingerprint(stat),
      id = sha(canonical([source.category, source.name]));
    const cached = await this.store.fileHash(id);
    if (cached?.stamp === stamp && cached.size === stat.size)
      return { ...source, size: stat.size, digest: cached.digest, stamp };
    const opened = await this.storage.getStream(source.category, source.name);
    const hash = createHash('sha256');
    let size = 0;
    try {
      for await (const chunk of opened.stream) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > MAX_ORIGINAL || size > stat.size) fail('Native original changed while hashing');
        hash.update(bytes);
      }
    } finally {
      opened.stream.destroy();
    }
    const after = await this.storage.stat(source.category, source.name);
    if (!after || size !== stat.size || fingerprint(after) !== stamp) fail('Native original changed while hashing');
    const digest = hash.digest('hex');
    await this.store.saveFileHash(id, stamp, size, digest);
    return { ...source, size, digest, stamp };
  }
  enrich(graph: Graph, sources: NativeFileSource[], files: HashedNativeFile[]): Graph {
    const selected = sources.map((source) => {
      const file = files.find(
        (f) => f.record === source.record && f.category === source.category && f.name === source.name,
      );
      if (!file) fail('Native original associations changed during snapshot');
      return file;
    });
    const ids = new Set(sources.map((s) => s.record));
    const originals = graph.originals.filter((o) => !ids.has(o.record));
    for (const file of selected) {
      const previous = graph.originals.find(
        (o) => o.record === file.record && o.sha256 === file.digest && o.size === file.size,
      );
      originals.push({
        id: previous?.id ?? 'native:' + sha(canonical([file.record, file.digest])),
        record: file.record,
        size: file.size,
        sha256: file.digest,
      });
    }
    return { ...graph, originals };
  }
  async read(file: HashedNativeFile, offset: number, limit: number): Promise<Buffer> {
    if (offset === file.size) return Buffer.alloc(0);
    const end = Math.min(file.size, offset + limit) - 1;
    const opened = await this.storage.getStream(file.category, file.name, { start: offset, end });
    const parts: Buffer[] = [];
    let size = 0;
    try {
      if (fingerprint(opened.stat) !== file.stamp) fail('Native original changed before reading');
      for await (const chunk of opened.stream) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += part.length;
        if (size > end - offset + 1) fail('Storage returned an invalid original range');
        parts.push(part);
      }
    } finally {
      opened.stream.destroy();
    }
    const after = await this.storage.stat(file.category, file.name);
    if (size !== end - offset + 1 || !after || fingerprint(after) !== file.stamp)
      fail('Native original changed during reading');
    return Buffer.concat(parts);
  }
  async materialize(operation: string, graph: Graph): Promise<MaterializedFiles> {
    const objects = await this.store.objects(operation),
      prepared: MaterializedFiles = Object.create(null);
    try {
      await graph.records
        .filter((r) => r.kind === 'documents' && r.visibility === 'trip')
        .reduce(async (previous, record) => {
          await previous;
          const manifest = graph.originals.find((o) => o.record === record.id);
          if (!manifest) fail('Document original is missing', 422);
          const object = objects.find((o) => o.source_id === 'original:' + manifest.id);
          if (!object || !object.verified || object.digest !== manifest.sha256 || object.size !== manifest.size)
            fail('Missing verified document original', 422);
          // The name is derived from a private, server-bound staged object, never from the source filename.
          const filename = 'transfer-' + object.id + '.bin';
          prepared[record.id] = { filename, file_size: object.size, mime_type: 'application/octet-stream' };
          const objectId = object.id,
            objectSize = object.size,
            objectDigest = object.digest;
          const hash = createHash('sha256');
          let offset = 0,
            done = false;
          const bytes: AsyncIterableIterator<Buffer> = {
            [Symbol.asyncIterator]() {
              return this;
            },
            next: async () => {
              if (done) return { value: undefined, done: true };
              if (offset >= objectSize) {
                done = true;
                if (hash.digest('hex') !== objectDigest) fail('Staged original hash changed');
                return { value: undefined, done: true };
              }
              const chunk = await this.store.chunk(objectId, offset);
              if (!chunk) fail('Staged original disappeared');
              const data = Buffer.from(chunk.data, 'base64');
              hash.update(data);
              offset += data.length;
              return { value: data, done: false };
            },
          };
          if (!(await this.store.fileIsLinked(filename)))
            await this.storage.put('files', filename, Readable.from(bytes), {
              contentType: 'application/octet-stream',
            });
        }, Promise.resolve());
      return prepared;
    } catch (error) {
      await this.cleanup(prepared);
      throw error;
    }
  }
  async preparedHashes(prepared: MaterializedFiles): Promise<HashedNativeFile[]> {
    const result: HashedNativeFile[] = [];
    await Object.entries(prepared).reduce(async (previous, [record, file]) => {
      await previous;
      const hashed = await this.hash({ record, category: 'files', name: file.filename });
      const staged = await this.store.object(file.filename.slice('transfer-'.length, -'.bin'.length));
      if (!staged || !staged.verified || hashed.digest !== staged.digest || hashed.size !== staged.size)
        fail('Materialized original hash changed');
      result.push(hashed);
    }, Promise.resolve());
    return result;
  }
  async cleanup(prepared: MaterializedFiles): Promise<void> {
    await Object.values(prepared).reduce(async (previous, file) => {
      await previous;
      if (!(await this.store.fileIsLinked(file.filename))) await this.storage.delete('files', file.filename);
    }, Promise.resolve());
  }
}
