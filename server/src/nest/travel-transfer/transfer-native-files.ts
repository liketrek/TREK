import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageService } from '../storage/storage.service';
import type { ObjectStat, ServedCategory } from '../storage/storage.types';
import { TransferNative } from './transfer-native';
import { TransferPhotoFiles } from './transfer-photo-files';
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
  photo?: { user: number; id: number };
  document?: { user: number; trip: number; id: number };
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
    private readonly photos: TransferPhotoFiles,
    private readonly storage: StorageService,
    private readonly uow: UnitOfWork,
  ) {}
  sources(projection: Projection, cover: string | null | undefined, includePrivate = true): NativeFileSource[] {
    const files: NativeFileSource[] = [];
    const selected = new Set(
      projection.records.filter((r) => includePrivate || r.visibility === 'trip').map((r) => r.id),
    );
    for (const [record, binding] of Object.entries(projection.bindings)) {
      if (!selected.has(record)) continue;
      if (binding.table === 'document_sync_items') {
        const row = projection.rows.document_sync_items.find((r) => r.id === binding.key.id);
        if (row?.remote_id && !row.remote_missing_at && !row.remote_trashed_at)
          files.push({
            record,
            category: 'files',
            name: `remote-${row.id}`,
            document: { user: projection.owner, trip: projection.trip, id: Number(row.id) },
          });
        continue;
      }
      if (binding.table === 'trek_photos') {
        const row = projection.rows.trek_photos.find((r) => r.id === binding.key.id);
        if (!row) fail('Photo association unavailable');
        files.push({
          record,
          category: 'journey',
          name: `photo-${row.id}`,
          photo: { user: projection.owner, id: Number(row.id) },
        });
        continue;
      }
      if (binding.table === 'journeys') {
        const row = projection.rows.journeys.find((r) => r.id === binding.key.id);
        if (typeof row?.cover_image === 'string' && row.cover_image) {
          const path = row.cover_image.replace(/^\/uploads\//, '');
          const match = /^(journey|covers)\/([^/]+)$/.exec(path);
          if (!match) fail('Journey cover original is unavailable', 422);
          files.push({ record, category: match[1] as ServedCategory, name: match[2] });
        }
        continue;
      }
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
  async prepare(trip: number, includePrivate = true): Promise<HashedNativeFile[]> {
    const sources = await this.uow.transactional(async () =>
      this.sources(await this.native.project(trip), (await this.store.trip(trip))?.cover_image, includePrivate),
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
    if (source.document) {
      const { size, digest } = await this.photos.document(
        source.document.user,
        source.document.trip,
        source.document.id,
      );
      return { ...source, size, digest, stamp: digest };
    }
    if (source.photo) {
      const { size, digest } = await this.photos.consume(source.photo.user, source.photo.id);
      return { ...source, size, digest, stamp: digest };
    }
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
        (f) =>
          f.record === source.record &&
          f.category === source.category &&
          f.name === source.name &&
          canonical(f.photo ?? null) === canonical(source.photo ?? null) &&
          canonical(f.document ?? null) === canonical(source.document ?? null),
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
    if (file.document) {
      const current = await this.photos.document(file.document.user, file.document.trip, file.document.id, {
        offset,
        limit,
      });
      if (current.digest !== file.digest || current.size !== file.size)
        fail('External original changed during transfer');
      return current.bytes;
    }
    if (file.photo) {
      const current = await this.photos.consume(file.photo.user, file.photo.id, { offset, limit });
      if (current.digest !== file.digest || current.size !== file.size) fail('Photo original changed during transfer');
      return current.bytes;
    }
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
      // A concurrent apply may be preparing this same operation. Retain it until staging expires.
      const object = await this.store.object(file.filename.slice('transfer-'.length, -'.bin'.length));
      const operation = object && (await this.store.op(object.operation_id));
      if (operation && !operation.receipt && operation.expires_at >= Date.now()) return;
      if (!(await this.store.fileIsLinked(file.filename))) await this.storage.delete('files', file.filename);
    }, Promise.resolve());
  }
  /** Restart-safe: enumerate only our storage namespace; missing staging rows are recoverable orphans. */
  async sweep() {
    for await (const file of this.storage.list('files')) {
      if (!/^transfer-[a-f0-9]{64}\.bin$/.test(file.key) || file.mtimeMs > Date.now() - 26 * 60 * 60 * 1000) continue;
      await this.cleanup({
        orphan: { filename: file.key, file_size: file.size, mime_type: 'application/octet-stream' },
      });
    }
  }
}
