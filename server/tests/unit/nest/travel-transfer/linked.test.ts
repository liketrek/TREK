import { Addons } from '../../../../src/db/entities/Addons.entity';
import { BudgetItems } from '../../../../src/db/entities/BudgetItems.entity';
import { Categories } from '../../../../src/db/entities/Categories.entity';
import { CollectionPlaces } from '../../../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../../../src/db/entities/Collections.entity';
import { DocumentConnections } from '../../../../src/db/entities/DocumentConnections.entity';
import { DocumentSyncItems } from '../../../../src/db/entities/DocumentSyncItems.entity';
import { JourneyContributors } from '../../../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../../../src/db/entities/JourneyEntries.entity';
import { JourneyEntryPhotos } from '../../../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { JourneyTrips } from '../../../../src/db/entities/JourneyTrips.entity';
import { Journeys } from '../../../../src/db/entities/Journeys.entity';
import { PhotoProviders } from '../../../../src/db/entities/PhotoProviders.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { Tags } from '../../../../src/db/entities/Tags.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../../../src/db/entities/TripAlbumLinks.entity';
import { TripDocumentLinks } from '../../../../src/db/entities/TripDocumentLinks.entity';
import { TripFiles } from '../../../../src/db/entities/TripFiles.entity';
import { TripJournalLinks } from '../../../../src/db/entities/TripJournalLinks.entity';
import { TripPhotos } from '../../../../src/db/entities/TripPhotos.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import type { McpContext } from '../../../../src/nest-mcp';
import { DocSyncTransferService } from '../../../../src/nest/doc-sync/doc-sync-transfer.service';
import { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import { docOk, type RemoteDocument } from '../../../../src/nest/doc-sync/document-provider';
import { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
import { PhotoProviderRegistry } from '../../../../src/nest/memories/photo-provider.registry';
import { ImmichPhotoProvider } from '../../../../src/nest/memories/providers/immich.provider';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { TransferRetentionJob } from '../../../../src/nest/travel-transfer/transfer-retention.job';
import { TransferSourceCache } from '../../../../src/nest/travel-transfer/transfer-source-cache';
import { TransferStaging } from '../../../../src/nest/travel-transfer/transfer-staging';
import { canonical, CHUNK, sha, validateGraph, type Graph } from '../../../../src/nest/travel-transfer/transfer-wire';
import { TravelTransferModule } from '../../../../src/nest/travel-transfer/travel-transfer.module';
import { TravelTransferService } from '../../../../src/nest/travel-transfer/travel-transfer.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { insertRow, updateRows, deleteRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { mkdtemp, rm, utimes, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('linked native transfer with real ACLs and storage', () => {
  let db: ReturnType<typeof createSnapshotTestDb>, t: TestModule, orm: MikroORM, ctx: McpContext;
  let root: string, service: TravelTransferService, storage: StorageService, trip: number;
  let data: Buffer, open: ReturnType<typeof vi.fn>;
  beforeEach(async () => {
    db = createSnapshotTestDb();
    root = await mkdtemp(join(tmpdir(), 'transfer-linked-'));
    const driver = new LocalDriver({ id: 'test', root });
    driver.init({ cleanSpool: true });
    t = await createTestModule({
      db,
      imports: [TravelTransferModule],
      overrides: [
        {
          provide: StorageRegistryService,
          useValue: {
            resolve: (category: string) => ({ driver, keyPrefix: category + '/', backendName: 'test' }),
            tempDir: () => root,
            replicaFailures: () => [],
          },
        },
      ],
    });
    orm = t.get(MikroORM);
    service = t.get(TravelTransferService);
    storage = t.get(StorageService);
    const { user } = await makeUser(orm);
    ctx = {
      userId: user.id,
      clientId: 'linked-test',
      scopes: ['transfer:read', 'transfer:write'],
      isStaticToken: false,
      reauthorize: async () => true,
    };
    trip = await insertRow(orm, Trips, { user: user.id, title: 'Linked synthetic trip' });
    await updateRows(orm, PhotoProviders, { id: 'immich' }, { enabled: 1 });
    await updateRows(orm, Addons, { id: 'journey' }, { enabled: true });
    data = Buffer.from('original movie bytes\0—not a playback rendition');
    open = vi.spyOn(t.get(ImmichPhotoProvider), 'openOriginal').mockImplementation(async () => ({
      stream: Readable.from(data),
      contentType: 'video/quicktime',
      sourceStamp: sha(data),
    }));
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await t?.close();
    db?.close();
    await rm(root, { recursive: true, force: true });
  });
  async function photo(owner = ctx.userId, shared = 1) {
    const id = await insertRow(orm, TrekPhotos, {
      owner,
      provider: 'immich',
      asset_id: 'source-asset',
      media_type: 'video',
      passphrase: 'secret-not-exported',
    });
    const link = await insertRow(orm, TripPhotos, { trip, user: owner, photo: id, shared });
    return { id, link };
  }
  async function snapshot(privateData = true) {
    const { next_cursor, ...graph } = await service.snapshot(ctx, String(trip), null, null, privateData);
    expect(next_cursor).toBeNull();
    return graph;
  }
  async function copy(
    graph: Graph,
    operation = 'copy',
    target: string | null = null,
    bytesById?: Record<string, string>,
  ) {
    const staging = t.get(TransferStaging);
    const originalBytes = await Promise.all(
      graph.originals.map(async (original) => {
        if (bytesById) return { original, bytes: Buffer.from(bytesById[original.id], 'base64') };
        const part = await service.readOriginal(ctx, String(trip), graph.revision, original.id, 0, CHUNK);
        return { original, bytes: Buffer.from(part.data, 'base64') };
      }),
    );
    await originalBytes.reduce(async (p, { original, bytes }) => {
      await p;
      await staging.accept(ctx, {
        trip_id: target,
        include_private: true,
        operation_id: operation,
        id: original.id,
        sha256: original.sha256,
        offset: 0,
        total: original.size,
        chunk_sha256: sha(bytes),
        data: bytes.toString('base64'),
      });
    }, Promise.resolve());
    const bytes = Buffer.from(canonical(graph)),
      digest = sha(bytes);
    await staging.accept(
      ctx,
      {
        trip_id: target,
        include_private: true,
        operation_id: operation,
        id: 'payload',
        sha256: digest,
        offset: 0,
        total: bytes.length,
        chunk_sha256: digest,
        data: bytes.toString('base64'),
      },
      true,
    );
    return service.apply(ctx, {
      trip_id: target,
      include_private: true,
      operation_id: operation,
      expected_revision: target ? graph.revision : null,
      payload_digest: digest,
      original_ids: graph.originals.map((o) => o.id),
    });
  }
  it('transfers provider originals and associations without a preview or secret, and retains them after restart', async () => {
    await photo();
    const graph = await snapshot(false);
    expect(graph.originals).toHaveLength(1);
    expect(graph.originals[0].sha256).toBe(sha(data));
    expect(canonical(graph)).not.toContain('secret-not-exported');
    const copyResult = await copy(graph);
    const restored = await service.snapshot(ctx, copyResult.trip_id, null, null, true);
    expect(restored.records).toEqual(graph.records);
    expect(restored.originals).toEqual(graph.originals);
    open.mockRejectedValue(new Error('upstream no longer connected'));
    const bytes = await service.readOriginal(ctx, copyResult.trip_id, restored.revision, graph.originals[0].id, 2, 9);
    expect(Buffer.from(bytes.data, 'base64')).toEqual(data.subarray(2, 11));
  });
  it('downloads a provider original once for bounded snapshot range reads', async () => {
    await photo();
    data = Buffer.alloc(2 * CHUNK, 37);
    let consumed = 0;
    open.mockImplementation(async () => ({
      stream: Readable.from(
        (async function* () {
          for (let offset = 0; offset < data.length; offset += CHUNK) {
            consumed += CHUNK;
            yield data.subarray(offset, offset + CHUNK);
          }
        })(),
      ),
      contentType: 'video/quicktime',
      sourceStamp: sha(data),
    }));
    const graph = await snapshot(false);
    await Promise.all(
      [0, CHUNK].map(async (offset) => {
        const read = await service.readOriginal(
          ctx,
          String(trip),
          graph.revision,
          graph.originals[0].id,
          offset,
          CHUNK,
        );
        expect(Buffer.from(read.data, 'base64')).toEqual(data.subarray(offset, offset + CHUNK));
      }),
    );
    expect(consumed).toBe(data.length);
    expect(open).toHaveBeenCalledTimes(3); // One preparation and current provider authorization for each range.
  });
  it('refuses cached bytes after provider denial, rebinding, or cache expiry', async () => {
    await photo();
    const graph = await snapshot(false);
    const read = () => service.readOriginal(ctx, String(trip), graph.revision, graph.originals[0].id, 0, 9);
    open.mockRejectedValueOnce(new Error('Provider denied'));
    await expect(read()).rejects.toThrow('Provider denied');
    open.mockResolvedValueOnce({
      stream: Readable.from(data),
      contentType: 'video/quicktime',
      sourceStamp: sha('new server'),
    });
    await expect(read()).rejects.toThrow('source changed');
    await storage.put('files', 'unrelated.bin', Readable.from('preserved'));
    for await (const file of storage.list('files'))
      if (file.key.startsWith('transfer-source-'))
        await utimes(join(root, 'files', file.key), new Date(0), new Date(0));
    await t.get(TransferSourceCache).sweep();
    await expect(read()).rejects.toThrow('expired');
    expect(await storage.exists('files', 'unrelated.bin')).toBe(true);
    expect((await snapshot(false)).originals).toEqual(graph.originals);
  });
  it('pins exact snapshot bytes when a provider has no version validator, and refreshes on a new snapshot', async () => {
    await photo();
    open.mockImplementation(async () => ({
      stream: Readable.from(data),
      contentType: 'video/quicktime',
      sourceStamp: sha('same binding, no etag'),
    }));
    const graph = await snapshot(false),
      original = Buffer.from(data);
    data = Buffer.alloc(data.length, 31);
    const read = await service.readOriginal(ctx, String(trip), graph.revision, graph.originals[0].id, 0, CHUNK);
    expect(Buffer.from(read.data, 'base64')).toEqual(original);
    const refreshed = await snapshot(false);
    expect(refreshed.revision).not.toBe(graph.revision);
    expect(refreshed.originals[0].sha256).toBe(sha(data));
    await expect(
      service.readOriginal(ctx, String(trip), graph.revision, graph.originals[0].id, 0, CHUNK),
    ).rejects.toThrow('changed');
  });
  it('evicts only the oldest prepared originals when reserving bounded cache space', async () => {
    const names = [1, 2, 3].map((n) => 'transfer-source-' + String(n).repeat(48) + '.bin');
    await Promise.all(
      names.map(async (name, i) => {
        await storage.put('files', name, Readable.from('x'));
        const when = new Date(Date.now() - (3 - i) * 1000);
        await utimes(join(root, 'files', name), when, when);
      }),
    );
    await storage.put('files', 'transfer-unrelated.bin', Readable.from('preserved'));
    await t.get(TransferSourceCache).sweep(4 * 1024 * 1024 * 1024 - 2);
    expect(await storage.exists('files', names[0])).toBe(false);
    expect(await storage.exists('files', names[1])).toBe(true);
    expect(await storage.exists('files', names[2])).toBe(true);
    expect(await storage.exists('files', 'transfer-unrelated.bin')).toBe(true);
  });
  it('streams a 512 MiB provider original once and reads its boundary chunks from private storage', async () => {
    await photo();
    const block = Buffer.alloc(64 * 1024, 29),
      total = 512 * CHUNK;
    let consumed = 0;
    open.mockImplementation(async () => ({
      stream: Readable.from(
        (async function* () {
          for (let n = 0; n < total / block.length; n++) {
            consumed += block.length;
            yield block;
          }
        })(),
      ),
      contentType: 'video/quicktime',
      sourceStamp: sha('large original version 1'),
    }));
    const graph = await snapshot(false);
    expect(graph.originals[0].size).toBe(total);
    await Promise.all(
      [0, total - CHUNK].map(async (offset) => {
        const read = await service.readOriginal(
          ctx,
          String(trip),
          graph.revision,
          graph.originals[0].id,
          offset,
          CHUNK,
        );
        expect(Buffer.from(read.data, 'base64')).toEqual(Buffer.alloc(CHUNK, 29));
      }),
    );
    expect(consumed).toBe(total);
    expect(open).toHaveBeenCalledTimes(3);
  }, 60_000);
  it('omits another persons private photo and rechecks sharing revocation', async () => {
    const other = (await makeUser(orm)).user.id;
    const { link } = await photo(other, 0);
    expect((await snapshot()).originals).toHaveLength(0);
    expect(open).not.toHaveBeenCalled();
    await updateRows(orm, TripPhotos, { id: link }, { shared: 1 });
    const before = await snapshot();
    expect(before.originals).toHaveLength(1);
    await updateRows(orm, TripPhotos, { id: link }, { shared: 0 });
    await expect(
      service.readOriginal(ctx, String(trip), before.revision, before.originals[0].id, 0, 9),
    ).rejects.toThrow('changed');
  });
  it('refuses altered bytes, unknown providers and interrupted streams', async () => {
    const { id } = await photo();
    const before = await snapshot();
    data = Buffer.from('edited bytes');
    await expect(
      service.readOriginal(ctx, String(trip), before.revision, before.originals[0].id, 0, 9),
    ).rejects.toThrow('changed');
    open.mockImplementation(async () => ({
      stream: Readable.from(
        (async function* () {
          yield Buffer.from('partial');
          throw new Error('https://private/?token=secret');
        })(),
      ),
      contentType: 'image/jpeg',
      sourceStamp: sha(data),
    }));
    await expect(snapshot()).rejects.toThrow('could not be read completely');
    vi.spyOn(t.get(PhotoProviderRegistry), 'get').mockReturnValue(undefined);
    await expect(snapshot()).rejects.toThrow('does not support original');
    await updateRows(orm, TrekPhotos, { id }, { provider: 'local', file_path: 'journey/../secret' });
    await expect(snapshot()).rejects.toThrow('Invalid local');
  });
  it('reads local journey originals and covers through storage, preserving the private audience', async () => {
    const journey = await insertRow(orm, Journeys, {
      user: ctx.userId,
      title: 'Private journal',
      created_at: 1,
      updated_at: 2,
      cover_image: 'journey/cover.bin',
    });
    await insertRow(orm, JourneyTrips, { journey, trip, added_at: 1 });
    const p = await insertRow(orm, TrekPhotos, {
      provider: 'local',
      owner: ctx.userId,
      file_path: 'journey/picture.bin',
    });
    await insertRow(orm, JourneyPhotos, { journey, photo: p, owner_id: ctx.userId, shared: 1, created_at: 2 });
    await storage.put('journey', 'cover.bin', Readable.from('cover'));
    await storage.put('journey', 'picture.bin', Readable.from(data));
    const graph = await snapshot();
    expect(graph.originals).toHaveLength(2);
    expect(graph.records.filter((r) => r.kind.startsWith('source:')).every((r) => r.visibility === 'private')).toBe(
      true,
    );
    expect((await snapshot(false)).originals).toHaveLength(0);
    const copied = await copy(graph);
    expect((await service.snapshot(ctx, copied.trip_id, null, null, true)).originals).toEqual(graph.originals);
  });
  it('keeps linked journey text private and excludes foreign drafts, their photos and credentials', async () => {
    const other = (await makeUser(orm)).user.id;
    const journey = await insertRow(orm, Journeys, {
      user: other,
      title: 'Other journal',
      created_at: 1,
      updated_at: 2,
    });
    await insertRow(orm, TripJournalLinks, { trip, journey, linkedByRef: ctx.userId, created_at: 2 });
    const draft = await insertRow(orm, JourneyEntries, {
      journey,
      author: other,
      type: 'entry',
      title: 'FOREIGN-DRAFT',
      entry_date: '2026-10-23',
      created_at: 1,
      updated_at: 2,
      is_draft: 1,
    });
    await insertRow(orm, JourneyEntries, {
      journey,
      author: other,
      type: 'entry',
      title: 'Published source',
      story: 'Historical writing',
      entry_date: '2026-10-23',
      created_at: 1,
      updated_at: 2,
      visibility: 'shared',
    });
    const p = await insertRow(orm, TrekPhotos, { provider: 'immich', owner: other, asset_id: 'draft-asset' });
    const jp = await insertRow(orm, JourneyPhotos, { journey, photo: p, owner_id: other, shared: 1, created_at: 1 });
    await insertRow(orm, JourneyEntryPhotos, { entry: draft, journeyPhoto: jp, created_at: 1 });
    expect(canonical(await snapshot())).not.toContain('Historical writing');
    await insertRow(orm, JourneyContributors, { journey, user: ctx.userId, role: 'viewer', added_at: 1 });
    const graph = await snapshot();
    expect(canonical(graph)).toContain('Historical writing');
    expect(canonical(graph)).not.toContain('FOREIGN-DRAFT');
    expect(graph.originals).toHaveLength(0);
    expect(canonical(await snapshot(false))).not.toContain('Historical writing');
    const copyResult = await copy(graph);
    const restored = await service.snapshot(ctx, copyResult.trip_id, null, null, true);
    expect(restored.records).toEqual(graph.records);
    await deleteRows(orm, JourneyContributors, { journey, user: ctx.userId });
    expect(canonical(await snapshot())).not.toContain('Historical writing');
  });
  it('keeps shared-photo album passphrases and external-document connection secrets out of graphs', async () => {
    const album = await insertRow(orm, TripAlbumLinks, {
      trip,
      user: ctx.userId,
      provider: 'immich',
      album_id: 'album',
      album_name: 'Photos',
      passphrase: 'ALBUM-SECRET',
    });
    const { link } = await photo();
    await updateRows(orm, TripPhotos, { id: link }, { albumLink: album });
    const connection = await insertRow(orm, DocumentConnections, {
      trip,
      provider: 'paperless',
      ownerUser: ctx.userId,
      base_url: 'https://docs.invalid',
      secrets: 'CONNECTION-SECRET',
    });
    await insertRow(orm, TripDocumentLinks, {
      trip,
      connection,
      provider_id: 'paperless',
      remote_scope_key: 'tag:1',
      webhook_token: 'WEBHOOK-SECRET',
      webhook_secret: 'WEBHOOK-KEY',
    });
    const graph = await snapshot();
    for (const secret of ['ALBUM-SECRET', 'CONNECTION-SECRET', 'WEBHOOK-SECRET', 'WEBHOOK-KEY'])
      expect(canonical(graph)).not.toContain(secret);
    expect(graph.records.some((r) => r.kind === 'source:document_providers')).toBe(true);
  });
  it('exports category definitions rather than losing the meaning of local IDs', async () => {
    const category = await insertRow(orm, Categories, { user: ctx.userId, name: 'Synthetic places', color: '#123456' });
    const place = await insertRow(orm, Places, { trip, category, name: 'Historic cafe' });
    const collection = await insertRow(orm, Collections, { owner: ctx.userId, name: 'Unrelated collection' });
    await insertRow(orm, CollectionPlaces, {
      collection,
      owner: ctx.userId,
      category,
      name: 'PRIVATE-COLLECTION-PLACE',
    });
    const tag = await insertRow(orm, Tags, { user: ctx.userId, name: 'Keep this cafe', color: '#123456' });
    const other = (await makeUser(orm)).user.id;
    const foreign = await insertRow(orm, Tags, { user: other, name: 'FOREIGN-PRIVATE-TAG' });
    const em = orm.em.fork();
    const nativePlace = await em.findOneOrFail(Places, place);
    nativePlace.place_tags.add(em.getReference(Tags, tag), em.getReference(Tags, foreign));
    await em.flush();
    const graph = await snapshot();
    expect(canonical(graph)).toContain('Synthetic places');
    expect(canonical(graph)).toContain('Keep this cafe');
    expect(canonical(graph)).not.toContain('FOREIGN-PRIVATE-TAG');
    expect(canonical(graph)).not.toContain('PRIVATE-COLLECTION-PLACE');
    expect(canonical(await snapshot(false))).not.toContain('Keep this cafe');
  });
  it('sweeps old unlinked import files after process death but preserves linked and active files', async () => {
    const names = ['a', 'b', 'c'].map((letter) => 'transfer-' + letter.repeat(64) + '.bin');
    await Promise.all(
      names.map(async (name) => {
        await storage.put('files', name, Readable.from('bytes'));
        await utimes(join(root, 'files', name), 1, 1);
      }),
    );
    await insertRow(orm, TripFiles, { trip, filename: names[1], original_name: 'retained' });
    // A recent file cannot be swept even if its DB transaction has not started yet.
    await utimes(join(root, 'files', names[2]), new Date(), new Date());
    await t.get(TransferRetentionJob).sweep();
    expect(await storage.stat('files', names[0])).toBeNull();
    expect(await storage.stat('files', names[1])).not.toBeNull();
    expect(await storage.stat('files', names[2])).not.toBeNull();
  });
  it('downloads current external originals only from the saved document scope, and rejects scope/revision changes', async () => {
    const connection = await insertRow(orm, DocumentConnections, {
      trip,
      provider: 'paperless',
      ownerUser: ctx.userId,
      base_url: 'https://docs.invalid',
    });
    const link = await insertRow(orm, TripDocumentLinks, {
      trip,
      connection,
      provider_id: 'paperless',
      remote_scope_key: 'tag:1',
    });
    const item = await insertRow(orm, DocumentSyncItems, {
      trip,
      link,
      trek_doc_uid: 'synthetic-doc',
      remote_id: 'document-1',
    });
    vi.spyOn(t.get(DocSyncService), 'isSwitchedOff').mockResolvedValue(false);
    const provider = t.get(DocumentProviderRegistry).get('paperless');
    if (!provider) throw new Error('Missing built-in provider');
    const remote: RemoteDocument = {
      remoteId: 'document-1',
      name: 'Ticket.pdf',
      size: data.length,
      mimeType: 'application/pdf',
      remoteVersion: 'one',
      contentHash: sha(data),
      remoteModifiedAt: null,
      isDeleted: false,
    };
    const listing = vi
      .spyOn(provider, 'list')
      .mockResolvedValue(docOk({ documents: [remote], cursor: null, cursorUnchanged: false, truncated: false }));
    const fetch = vi
      .spyOn(provider, 'fetch')
      .mockImplementation(async () =>
        docOk({ body: Readable.from(data), size: data.length, mimeType: 'application/pdf', remoteVersion: 'one' }),
      );
    const graph = await snapshot();
    expect(graph.originals).toHaveLength(1);
    expect(graph.originals[0].sha256).toBe(sha(data));
    const result = await copy(graph);
    expect((await service.snapshot(ctx, result.trip_id, null, null, true)).originals).toEqual(graph.originals);
    const port = t.get(DocSyncTransferService);
    const other = (await makeUser(orm)).user.id;
    await expect(port.openOriginal(other, trip, item)).rejects.toThrow('unavailable');
    await expect(port.openOriginal(ctx.userId, trip, item + 100)).rejects.toThrow('unavailable');
    const anotherTrip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Different scope' });
    await updateRows(orm, DocumentConnections, { id: connection }, { trip: anotherTrip });
    await expect(port.openOriginal(ctx.userId, trip, item)).rejects.toThrow('connection unavailable');
    await updateRows(orm, DocumentConnections, { id: connection }, { trip });
    // Irrelevant health-check timestamps do not invalidate otherwise current access.
    const accepted = await port.openOriginal(ctx.userId, trip, item);
    await updateRows(
      orm,
      DocumentConnections,
      { id: connection },
      { last_probe_state: 'ok', updated_at: '2026-10-23' },
    );
    await accepted.check();
    await updateRows(orm, TripDocumentLinks, { id: link }, { remote_scope_key: 'tag:2' });
    await expect(accepted.check()).rejects.toThrow('access changed');
    accepted.stream.destroy();
    await updateRows(orm, TripDocumentLinks, { id: link }, { remote_scope_key: 'tag:1' });
    listing.mockRejectedValueOnce(new Error('credential URL must not escape'));
    await expect(snapshot()).rejects.toThrow('External provider unavailable');
    fetch.mockRejectedValueOnce(new Error('credential URL must not escape'));
    await expect(snapshot()).rejects.toThrow('External provider unavailable');
    listing.mockResolvedValue(docOk({ documents: [], cursor: null, cursorUnchanged: false, truncated: false }));
    await expect(snapshot()).rejects.toThrow('no longer belongs');
    listing.mockResolvedValue(docOk({ documents: [remote], cursor: null, cursorUnchanged: false, truncated: true }));
    await expect(snapshot()).rejects.toThrow('Cannot verify');
    listing.mockResolvedValue(docOk({ documents: [remote], cursor: null, cursorUnchanged: false, truncated: false }));
    fetch.mockImplementation(async () =>
      docOk({ body: Readable.from(data), size: data.length, mimeType: 'application/pdf', remoteVersion: 'two' }),
    );
    await expect(snapshot()).rejects.toThrow('changed');
    await updateRows(orm, TripDocumentLinks, { id: link }, { last_sync_state: 'orphaned' });
    await expect(snapshot()).rejects.toThrow('connection unavailable');
  });
  it('does not fetch unselected private provider originals', async () => {
    await photo(ctx.userId, 0);
    expect((await snapshot(false)).originals).toHaveLength(0);
    expect(open).not.toHaveBeenCalled();
  });
  it('rechecks photo access after streaming', async () => {
    const other = (await makeUser(orm)).user.id;
    const { link } = await photo(other, 1);
    open.mockImplementation(async () => {
      await updateRows(orm, TripPhotos, { id: link }, { shared: 0 });
      return { stream: Readable.from(data), contentType: 'video/quicktime', sourceStamp: sha(data) };
    });
    await expect(snapshot()).rejects.toThrow('Photo unavailable');
  });
  it('produces a synthetic linked-journey original fixture for PostgreSQL cross-application acceptance', async () => {
    const journey = await insertRow(orm, Journeys, {
      user: ctx.userId,
      title: 'Synthetic journey',
      created_at: 1,
      updated_at: 2,
    });
    await insertRow(orm, JourneyTrips, { journey, trip, added_at: 1 });
    const entry = await insertRow(orm, JourneyEntries, {
      journey,
      author: ctx.userId,
      type: 'entry',
      title: 'A remembered day',
      story: 'Synthetic original writing',
      entry_date: '2026-10-23',
      created_at: 1,
      updated_at: 2,
      visibility: 'shared',
    });
    const { id } = await photo();
    const jp = await insertRow(orm, JourneyPhotos, {
      journey,
      photo: id,
      owner_id: ctx.userId,
      shared: 1,
      caption: 'Original video',
      created_at: 1,
    });
    await insertRow(orm, JourneyEntryPhotos, { entry, journeyPhoto: jp, created_at: 1 });
    const graph = await snapshot();
    expect(graph.records.some((r) => r.kind === 'source:journal_entries')).toBe(true);
    const first = await copy(graph, 'first');
    const imported = await service.snapshot(ctx, first.trip_id, null, null, true);
    expect(imported.records).toEqual(graph.records);
    if (process.env.TREK_LINKED_FIXTURE)
      await writeFile(
        process.env.TREK_LINKED_FIXTURE,
        JSON.stringify(
          { graph, originals: Object.fromEntries(graph.originals.map((o) => [o.id, data.toString('base64')])) },
          null,
          2,
        ),
      );
  });
  it('imports the linked graph and exact original returned by Memories PostgreSQL, then syncs a native edit', async () => {
    const fixture: { graph: Graph; originals: Record<string, string> } = JSON.parse(
      await readFile(join(__dirname, '../../../fixtures/travel-transfer/memories-linked.json'), 'utf8'),
    );
    const graph = validateGraph(fixture.graph);
    const imported = await copy(graph, 'postgres-return', null, fixture.originals);
    const target = imported.trip_id;
    const snapshot = await service.snapshot(ctx, target, null, null, true);
    expect(snapshot.records.slice().sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      graph.records.slice().sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(snapshot.originals).toEqual(graph.originals);
    const manifest = graph.originals[0];
    const original = await service.readOriginal(ctx, target, snapshot.revision, manifest.id, 0, CHUNK);
    expect(original.data).toBe(fixture.originals[manifest.id]);
    await updateRows(orm, Trips, { id: Number(target) }, { title: 'Native edit after round trip' });
    const { next_cursor: _, ...changed } = await service.snapshot(ctx, target, null, null, true);
    expect(changed.records.find((r) => r.id === 'trip')?.fields.title).toBe('Native edit after round trip');
    expect(
      changed.records
        .filter((r) => r.id !== 'trip')
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id)),
    ).toEqual(
      graph.records
        .filter((r) => r.id !== 'trip')
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
    // A subsequent full apply retains identities/history/bytes and accepts the exact current revision.
    await copy(changed, 'postgres-second-sync', target, fixture.originals);
    expect((await service.snapshot(ctx, target, null, null, true)).records).toEqual(changed.records);
  });
  it('rechecks linked-journal membership after reading an original also shared on the trip', async () => {
    const owner = (await makeUser(orm)).user.id;
    const journey = await insertRow(orm, Journeys, { user: owner, title: 'Linked', created_at: 1, updated_at: 1 });
    await insertRow(orm, JourneyTrips, { journey, trip, added_at: 1 });
    await insertRow(orm, JourneyContributors, { journey, user: ctx.userId, role: 'viewer', added_at: 1 });
    const { id } = await photo();
    await insertRow(orm, JourneyPhotos, { journey, photo: id, owner_id: ctx.userId, shared: 1, created_at: 1 });
    const graph = await snapshot();
    // The prepared bytes still require a fresh provider access check before the range read.
    let reads = 0;
    open.mockImplementation(async () => {
      reads++;
      if (reads === 1) await deleteRows(orm, JourneyContributors, { journey, user: ctx.userId });
      return { stream: Readable.from(data), contentType: 'video/quicktime', sourceStamp: sha(data) };
    });
    await expect(service.readOriginal(ctx, String(trip), graph.revision, graph.originals[0].id, 0, 9)).rejects.toThrow(
      'changed',
    );
    expect(reads).toBe(1);
  });
  it('retains ticket line prices and named historical participants without mapping their IDs to accounts', async () => {
    const guest = (await makeUser(orm)).user;
    const ticket = JSON.stringify({
      items: [{ name: 'Museum', price: '12.250', parts: [ctx.userId, guest.id], extension: 'preserved' }],
    });
    await insertRow(orm, BudgetItems, { trip, name: 'Tickets', total_price: 12.25, ticket_json: ticket });
    const graph = await snapshot();
    const expense = graph.records.find((r) => r.kind === 'expenses');
    expect(expense?.fields.trek_ticket_json).toBe(ticket);
    expect(expense?.fields.trek_ticket_participants).toContainEqual({
      id: String(guest.id),
      name: guest.display_name || guest.username,
    });
    expect(canonical(graph)).not.toContain(guest.email);
    const imported = await copy(graph, 'ticket-copy');
    expect(
      (await service.snapshot(ctx, imported.trip_id, null, null, true)).records.find((r) => r.id === expense?.id),
    ).toEqual(expense);
  });
  it('keeps the scheduler lease until the orphan sweep finishes', async () => {
    const registrar = t.get(CronRegistrarService),
      job = t.get(TransferRetentionJob);
    vi.spyOn(registrar, 'isEnabled').mockReturnValue(true);
    vi.spyOn(registrar, 'runOnBoot').mockResolvedValue(undefined);
    const registered = vi.spyOn(registrar, 'register').mockReturnValue(true);
    let finish: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.spyOn(job, 'sweep').mockReturnValue(pending);
    job.onApplicationBootstrap();
    const tick = registered.mock.calls[0][2]();
    expect(tick).toBe(pending);
    finish();
    await tick;
  });
});
