import { BudgetItemMembers } from '../../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../../../src/db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../../../src/db/entities/BudgetItems.entity';
import { CollabMessages } from '../../../../src/db/entities/CollabMessages.entity';
import { DayAccommodations } from '../../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../../src/db/entities/Days.entity';
import { FileLinks } from '../../../../src/db/entities/FileLinks.entity';
import { PackingBags } from '../../../../src/db/entities/PackingBags.entity';
import { PackingItems } from '../../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { ReservationEndpoints } from '../../../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../../../src/db/entities/Reservations.entity';
import { RoadtripPreferences } from '../../../../src/db/entities/RoadtripPreferences.entity';
import { TodoItems } from '../../../../src/db/entities/TodoItems.entity';
import { TravelTransferChunks } from '../../../../src/db/entities/TravelTransferChunks.entity';
import { TravelTransferObjects } from '../../../../src/db/entities/TravelTransferObjects.entity';
import { TravelTransferOperations } from '../../../../src/db/entities/TravelTransferOperations.entity';
import { TravelTransferSilentTasks } from '../../../../src/db/entities/TravelTransferSilentTasks.entity';
import { TripFiles } from '../../../../src/db/entities/TripFiles.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import { DEFAULT_CLIENT_SCOPES } from '../../../../src/mcp/scopes';
import type { McpContext } from '../../../../src/nest-mcp';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { TodoModule } from '../../../../src/nest/todo/todo.module';
import { TodoService } from '../../../../src/nest/todo/todo.service';
import { allowed } from '../../../../src/nest/travel-transfer/transfer-authority';
import { TransferStaging } from '../../../../src/nest/travel-transfer/transfer-staging';
import {
  CHUNK,
  FORMAT,
  canonical,
  sha,
  validateGraph,
  scopedMerge,
  type Graph,
  type ApplyInput,
} from '../../../../src/nest/travel-transfer/transfer-wire';
import { TravelTransferModule } from '../../../../src/nest/travel-transfer/travel-transfer.module';
import { TravelTransferService } from '../../../../src/nest/travel-transfer/travel-transfer.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { insertRow, updateRows, countRows, findRow, findRows, deleteRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

async function serial<T>(values: T[], run: (value: T) => Promise<unknown>) {
  await values.reduce(async (previous, value) => {
    await previous;
    await run(value);
  }, Promise.resolve());
}

const record = (id: string, visibility: 'trip' | 'private' = 'trip') => ({
  id,
  kind: id === 'trip' ? 'trip' : 'source:history',
  fields:
    id === 'trip'
      ? { title: 'Synthetic transfer', notes: null, start_date: null, end_date: null }
      : { text: 'Historical text', author: 'Source person', occurred: '1999-12-31' },
  references: {},
  visibility,
  source: { fields: {} },
});
function fixture(): Graph {
  const records = [record('trip'), record('message')];
  for (const r of records) r.source.fields = Object.fromEntries(Object.keys(r.fields).map((k) => [k, 'present']));
  return validateGraph({
    format: FORMAT,
    trip: 'source-trip',
    revision: 'source-rev',
    complete: true,
    records,
    originals: [],
  });
}

describe('travel transfer runtime on migrated TREK database', () => {
  let db: ReturnType<typeof createSnapshotTestDb>, t: TestModule, orm: MikroORM;
  let service: TravelTransferService, staging: TransferStaging, ctx: McpContext;
  let storageRoot: string, driver: LocalDriver;
  async function boot() {
    t = await createTestModule({
      db,
      imports: [TravelTransferModule, TodoModule],
      overrides: [
        {
          provide: StorageRegistryService,
          useValue: {
            resolve: (category: string) => ({ driver, keyPrefix: category + '/', backendName: 'transfer-test' }),
            tempDir: () => storageRoot,
            replicaFailures: () => [],
          },
        },
      ],
    });
    orm = t.get(MikroORM);
    service = t.get(TravelTransferService);
    staging = t.get(TransferStaging);
  }
  beforeEach(async () => {
    db = createSnapshotTestDb();
    storageRoot = await mkdtemp(join(tmpdir(), 'trek-native-transfer-'));
    driver = new LocalDriver({ id: 'transfer-test', root: storageRoot });
    driver.init({ cleanSpool: true });
    await boot();
    const { user } = await makeUser(orm);
    ctx = {
      userId: user.id,
      clientId: 'synthetic-client',
      scopes: ['transfer:read', 'transfer:write'],
      isStaticToken: false,
      reauthorize: async () => true,
    };
  });
  afterEach(async () => {
    await t?.close();
    db?.close();
    await rm(storageRoot, { recursive: true, force: true });
  });
  async function stage(
    graph = fixture(),
    trip: string | null = null,
    operation = 'op',
    privateData = false,
  ): Promise<ApplyInput> {
    const bytes = Buffer.from(canonical(graph)),
      hash = sha(bytes);
    await serial(
      Array.from({ length: Math.ceil(bytes.length / CHUNK) }, (_, i) => i * CHUNK),
      async (offset) => {
        const part = bytes.subarray(offset, offset + CHUNK);
        await staging.accept(
          ctx,
          {
            trip_id: trip,
            include_private: privateData,
            operation_id: operation,
            id: 'payload',
            sha256: hash,
            offset,
            total: bytes.length,
            chunk_sha256: sha(part),
            data: part.toString('base64'),
          },
          true,
        );
      },
    );
    return {
      trip_id: trip,
      operation_id: operation,
      include_private: privateData,
      payload_digest: hash,
      expected_revision: trip ? graph.revision : null,
      original_ids: graph.originals.map((o) => o.id),
    };
  }
  async function original(
    bytes: Buffer,
    operation = 'op',
    trip: string | null = null,
    privateData = false,
    id = 'original',
  ) {
    await serial(
      Array.from({ length: Math.max(1, Math.ceil(bytes.length / CHUNK)) }, (_, i) => i * CHUNK),
      async (offset) => {
        const part = bytes.subarray(offset, offset + CHUNK);
        await staging.accept(ctx, {
          trip_id: trip,
          include_private: privateData,
          operation_id: operation,
          id,
          sha256: sha(bytes),
          offset,
          total: bytes.length,
          chunk_sha256: sha(part),
          data: part.toString('base64'),
        });
      },
    );
  }
  it('requires separate explicit OAuth scopes and withholds incomplete native capability', () => {
    expect(DEFAULT_CLIENT_SCOPES).not.toContain('transfer:read');
    expect(DEFAULT_CLIENT_SCOPES).not.toContain('transfer:write');
    for (const overrides of [
      { scopes: null },
      { clientId: null },
      { isStaticToken: true },
      { scopes: ['trips:write'] },
    ])
      expect(allowed({ ...ctx, ...overrides }, true)).toBe(false);
    expect(allowed({ ...ctx, scopes: ['transfer:write'] }, false)).toBe(false);
    expect(service.capabilities().features).toContain('complete-snapshots');
  });
  it('creates once, retains historical authorship, and recovers a lost response after container reconstruction', async () => {
    const request = await stage();
    expect(await service.receipt(ctx, request)).toEqual({
      state: 'not_applied',
      payload_digest: request.payload_digest,
    });
    const receipt = await service.apply(ctx, request);
    await t.close();
    await boot();
    expect(await service.receipt(ctx, request)).toEqual(receipt);
    expect(await service.apply(ctx, request)).toEqual(receipt);
    expect(await countRows(orm, Trips, {})).toBe(1);
    const page = await service.snapshot(ctx, receipt.trip_id, null, null, false);
    expect(page.records.find((r) => r.id === 'message')).toEqual(fixture().records[1]);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
  it('returns original binary bytes, including NUL and a chunk boundary, without decoding', async () => {
    const bytes = Buffer.alloc(CHUNK + 101, 0x81);
    bytes[0] = 0;
    await original(bytes);
    const graph = fixture();
    graph.originals = [{ id: 'original', record: 'message', size: bytes.length, sha256: sha(bytes) }];
    const receipt = await service.apply(ctx, await stage(graph));
    const data = await service.readOriginal(ctx, receipt.trip_id, receipt.revision, 'original', CHUNK - 11, 50);
    expect(Buffer.from(data.data, 'base64')).toEqual(bytes.subarray(CHUNK - 11, CHUNK + 39));
    expect(data.sha256).toBe(sha(bytes));
    expect(data.chunk_sha256).toBe(sha(bytes.subarray(CHUNK - 11, CHUNK + 39)));
  });
  it('supports empty originals and deterministic replay', async () => {
    const bytes = Buffer.alloc(0);
    await original(bytes);
    await original(bytes);
    const graph = fixture();
    graph.originals = [{ id: 'original', record: 'message', size: 0, sha256: sha(bytes) }];
    const receipt = await service.apply(ctx, await stage(graph));
    expect((await service.readOriginal(ctx, receipt.trip_id, receipt.revision, 'original', 0, CHUNK)).data).toBe('');
    expect(await countRows(orm, TravelTransferChunks, {})).toBe(2);
  });
  it('rejects changed chunk metadata, holes, invalid base64 and corrupt hashes', async () => {
    const bytes = Buffer.from('bytes');
    await original(bytes);
    const input = {
      trip_id: null,
      include_private: false,
      operation_id: 'op',
      id: 'original',
      sha256: sha(bytes),
      offset: 0,
      total: 5,
      chunk_sha256: sha(bytes),
      data: bytes.toString('base64'),
    };
    await serial(
      [{ data: '!!!!' }, { offset: CHUNK }, { sha256: 'f'.repeat(64) }, { chunk_sha256: 'f'.repeat(64) }, { total: 6 }],
      async (changes) => {
        await expect(staging.accept(ctx, { ...input, ...changes })).rejects.toThrow();
      },
    );
    expect((await findRows(orm, TravelTransferChunks, {})).filter((c) => c.data !== '')).toHaveLength(1);
  });
  it('rolls back bad final whole-file hashes and publishes nothing', async () => {
    const bytes = Buffer.from('bad');
    await expect(
      staging.accept(ctx, {
        trip_id: null,
        include_private: false,
        operation_id: 'op',
        id: 'bad',
        sha256: '0'.repeat(64),
        offset: 0,
        total: 3,
        chunk_sha256: sha(bytes),
        data: bytes.toString('base64'),
      }),
    ).rejects.toThrow('hash mismatch');
    expect(await countRows(orm, TravelTransferOperations, {})).toBe(0);
  });
  it('binds operation, digest, audience, target and exact apply request', async () => {
    const request = await stage();
    const result = await service.apply(ctx, request);
    await expect(service.receipt(ctx, { ...request, include_private: true })).rejects.toThrow('scope changed');
    await expect(service.receipt(ctx, { ...request, payload_digest: '1'.repeat(64) })).rejects.toThrow(
      'digest changed',
    );
    await expect(service.receipt(ctx, { ...request, trip_id: result.trip_id })).rejects.toThrow('scope changed');
    await expect(service.apply(ctx, { ...request, expected_revision: 'wrong' })).rejects.toThrow('replay changed');
  });
  it('does not share receipts between clients or accounts', async () => {
    const request = await stage();
    await service.apply(ctx, request);
    expect((await service.receipt({ ...ctx, clientId: 'other' }, request)).state).toBe('not_applied');
    const { user } = await makeUser(orm);
    expect((await service.receipt({ ...ctx, userId: user.id }, request)).state).toBe('not_applied');
  });
  it('rechecks OAuth and ownership for receipt, snapshot and original replay', async () => {
    const request = await stage(),
      result = await service.apply(ctx, request);
    await expect(service.receipt({ ...ctx, reauthorize: async () => false }, request)).rejects.toThrow('OAuth');
    const { user } = await makeUser(orm);
    await updateRows(orm, Trips, { id: Number(result.trip_id) }, { user: user.id });
    await expect(service.receipt(ctx, request)).rejects.toThrow('owner');
    await expect(service.snapshot(ctx, result.trip_id, null, null, false)).rejects.toThrow('owner');
    await expect(service.snapshot({ ...ctx, userId: user.id }, result.trip_id, null, null, true)).rejects.toThrow(
      'different account',
    );
  });
  it('detects native edits between review and apply without overwriting them', async () => {
    const result = await service.apply(ctx, await stage());
    const page = await service.snapshot(ctx, result.trip_id, null, null, false);
    const { next_cursor: _, ...graph } = page;
    const request = await stage(graph, result.trip_id, 'update');
    await updateRows(orm, Trips, { id: Number(result.trip_id) }, { title: 'Concurrent edit' });
    await expect(service.apply(ctx, request)).rejects.toThrow('changed since review');
    expect((await findRow(orm, Trips, { id: Number(result.trip_id) })).title).toBe('Concurrent edit');
  });
  it('projects an ordinary native trip and its planner days', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Native trip' });
    await insertRow(orm, Days, { trip, day_number: 1 });
    const snapshot = await service.snapshot(ctx, String(trip), null, null, false);
    expect(snapshot.records.find((r) => r.kind === 'days')?.fields.position).toBe(1);
  });
  it('observes native currency edits while preserving reminder configuration', async () => {
    const created = await service.apply(ctx, await stage());
    const page = await service.snapshot(ctx, created.trip_id, null, null, false);
    const { next_cursor: _, ...graph } = page;
    const pending = await stage(graph, created.trip_id, 'settings-edit');
    await updateRows(orm, Trips, { id: Number(created.trip_id) }, { currency: 'USD', reminder_days: 3 });
    expect(
      (await service.snapshot(ctx, created.trip_id, null, null, false)).records.find((r) => r.id === 'trip')?.fields
        .currency,
    ).toBe('USD');
    await expect(service.apply(ctx, pending)).rejects.toThrow('changed since review');
    expect((await findRow(orm, Trips, { id: Number(created.trip_id) })).reminder_days).toBe(3);
  });
  it('preserves unselected private history during a shared-only apply', async () => {
    const graph = fixture();
    const privateRecord = record('private', 'private');
    privateRecord.source.fields = Object.fromEntries(Object.keys(privateRecord.fields).map((k) => [k, 'present']));
    graph.records.push(privateRecord);
    const created = await service.apply(ctx, await stage(graph, null, 'private-create', true));
    const { next_cursor: _, ...shared } = await service.snapshot(ctx, created.trip_id, null, null, false);
    shared.records[1].fields.text = 'Shared edit';
    await service.apply(ctx, await stage(shared, created.trip_id, 'shared-update'));
    const full = await service.snapshot(ctx, created.trip_id, null, null, true);
    expect(full.records.find((r) => r.id === 'private')).toEqual(privateRecord);
    const collision = structuredClone(shared);
    collision.records.push({ ...privateRecord, visibility: 'trip' });
    expect(() => scopedMerge(graph, collision, false)).toThrow('unselected identity');
  });
  it('refuses missing originals and never creates a partial trip', async () => {
    const graph = fixture();
    graph.originals = [{ id: 'missing', record: 'message', size: 1, sha256: sha('x') }];
    await expect(service.apply(ctx, await stage(graph))).rejects.toThrow('Missing verified original');
    expect(await countRows(orm, Trips, {})).toBe(0);
  });
  it('rejects incomplete manifests, duplicate identities, missing references and reserved markers', () => {
    const graph = fixture();
    for (const change of [
      (g: Graph) => {
        g.records[1].source.fields = {};
      },
      (g: Graph) => {
        g.records.push(g.records[1]);
      },
      (g: Graph) => {
        g.records[1].references.target = 'missing';
      },
      (g: Graph) => {
        g.records[1].fields.text = { $transfer: 'absent' };
      },
    ]) {
      const candidate = structuredClone(graph);
      change(candidate);
      expect(() => validateGraph(candidate)).toThrow();
    }
  });
  it('reserves declared bytes before accepting a large upload and enforces account quota', async () => {
    const part = Buffer.alloc(CHUNK, 1);
    await serial(['one', 'two', 'three', 'four'], async (id) => {
      await staging.accept(ctx, {
        trip_id: null,
        include_private: false,
        operation_id: 'op',
        id,
        sha256: sha(id),
        offset: 0,
        total: 512 * CHUNK,
        chunk_sha256: sha(part),
        data: part.toString('base64'),
      });
    });
    await expect(original(Buffer.from('x'), 'other-op')).rejects.toThrow('quota');
    expect(await countRows(orm, TravelTransferObjects, {})).toBe(4);
  });
  it('serializes simultaneous retries into one durable create', async () => {
    const request = await stage();
    const [a, b] = await Promise.all([service.apply(ctx, request), service.apply(ctx, request)]);
    expect(a).toEqual(b);
    expect(await countRows(orm, Trips, {})).toBe(1);
  });
  it('does not commit a chunk if consent changes during the request', async () => {
    let calls = 0;
    ctx.reauthorize = async () => ++calls === 1;
    await expect(original(Buffer.from('revoked'))).rejects.toThrow('OAuth');
    expect(await countRows(orm, TravelTransferChunks, {})).toBe(0);
  });
  it('rejects malformed and inaccessible IDs, changed snapshot revisions and cursors', async () => {
    await serial(['0', '-1', '1x', '9007199254740993', '99999'], async (id) => {
      await expect(service.snapshot(ctx, id, null, null, false)).rejects.toThrow();
    });
    const result = await service.apply(ctx, await stage());
    await expect(service.snapshot(ctx, result.trip_id, 'wrong', null, false)).rejects.toThrow('changed');
    await serial(['0', '-1', 'bad', '99999'], async (cursor) => {
      await expect(service.snapshot(ctx, result.trip_id, null, cursor, false)).rejects.toThrow('cursor');
    });
    await expect(service.readOriginal(ctx, result.trip_id, 'wrong', 'absent', 0, 1)).rejects.toThrow('changed');
    await expect(service.readOriginal(ctx, result.trip_id, result.revision, 'absent', 0, 1)).rejects.toThrow(
      'unavailable',
    );
  });
  it('paginates bounded trip lists and metadata without dropping history', async () => {
    await service.apply(ctx, await stage());
    await service.apply(ctx, await stage(fixture(), null, 'second'));
    const first = await service.trips(ctx, null, 1),
      second = await service.trips(ctx, first.next_cursor, 1);
    expect(first.trips).toHaveLength(1);
    expect(second.trips).toHaveLength(1);
    expect(second.next_cursor).toBe(null);
    expect(first.trips[0].id).not.toBe(second.trips[0].id);
    await serial(['bad', '-1', '9007199254740993'], async (cursor) => {
      await expect(service.trips(ctx, cursor, 1)).rejects.toThrow('cursor');
    });
    const graph = fixture();
    for (let i = 0; i < 4; i++)
      graph.records.push({
        ...graph.records[1],
        id: 'long-' + i,
        fields: { ...graph.records[1].fields, text: 'x'.repeat(CHUNK / 2) },
      });
    const result = await service.apply(ctx, await stage(graph, null, 'paged'));
    async function readPages(cursor: string | null = null): Promise<number> {
      const page = await service.snapshot(ctx, result.trip_id, result.revision, cursor, false);
      expect(Buffer.byteLength(canonical(page))).toBeLessThan(CHUNK);
      return page.records.length + (page.next_cursor ? await readPages(page.next_cursor) : 0);
    }
    expect(await readPages()).toBe(graph.records.length);
    const oversized = fixture();
    oversized.records[1].fields.text = 'x'.repeat(CHUNK);
    await expect(service.apply(ctx, await stage(oversized, null, 'oversized'))).rejects.toThrow('page limit');
    expect(await countRows(orm, Trips, {})).toBe(3);
  });
  it('retains absent fields, exact empty values, extensions and root references', async () => {
    const graph = fixture();
    delete graph.records[0].fields.notes;
    delete graph.records[0].source.fields.notes;
    graph.records[0].references.source = 'message';
    graph.records[1].fields.text = '';
    graph.records[1].source.fields.text = 'empty';
    const result = await service.apply(ctx, await stage(graph));
    expect((await service.snapshot(ctx, result.trip_id, null, null, false)).records).toEqual(graph.records);
  });
  it('validates native root values and refuses private data without selection', async () => {
    await serial(
      [
        ['title', ''],
        ['notes', 'x'.repeat(2001)],
        ['start_date', '2025-02-30'],
        ['end_date', 123],
      ],
      async ([key, value]) => {
        const graph = fixture();
        graph.records[0].fields[String(key)] = value;
        await expect(service.apply(ctx, await stage(graph, null, 'invalid-' + key))).rejects.toThrow();
      },
    );
    const graph = fixture();
    graph.records[0].fields.start_date = '2025-03-01';
    graph.records[0].fields.end_date = '2025-02-01';
    await expect(service.apply(ctx, await stage(graph, null, 'backward'))).rejects.toThrow('precedes');
    graph.records[0].fields.start_date = null;
    graph.records[0].fields.end_date = null;
    graph.records[1].visibility = 'private';
    await expect(service.apply(ctx, await stage(graph, null, 'private-unselected'))).rejects.toThrow('Private records');
    const result = await service.apply(ctx, await stage(graph, null, 'private-selected', true));
    expect((await service.snapshot(ctx, result.trip_id, null, null, false)).records).toHaveLength(1);
  });
  it('preserves immutable originals after their association is removed', async () => {
    const bytes = Buffer.from('version one');
    await original(bytes);
    const graph = fixture();
    graph.originals = [{ id: 'original', record: 'message', size: bytes.length, sha256: sha(bytes) }];
    const result = await service.apply(ctx, await stage(graph));
    const { next_cursor: _, ...without } = await service.snapshot(ctx, result.trip_id, null, null, false);
    without.originals = [];
    await service.apply(ctx, await stage(without, result.trip_id, 'remove'));
    const { next_cursor: __, ...replacement } = await service.snapshot(ctx, result.trip_id, null, null, false);
    const different = Buffer.from('version two');
    await original(different, 'replace', result.trip_id);
    replacement.originals = [{ id: 'original', record: 'message', size: different.length, sha256: sha(different) }];
    await expect(service.apply(ctx, await stage(replacement, result.trip_id, 'replace'))).rejects.toThrow('immutable');
  });
  it('round trips native planner rows and updates the same mapped identities without notifications', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Native source', currency: 'AUD' });
    const day = await insertRow(orm, Days, { trip, day_number: 1, date: '2027-02-01' });
    const place = await insertRow(orm, Places, { trip, name: 'Museum', lat: -33.8, lng: 151.2 });
    const stay = await insertRow(orm, DayAccommodations, {
      trip,
      place,
      startDay: day,
      endDay: day,
      notes: 'Two nights',
    });
    const item = await insertRow(orm, DayAssignments, { day, place, accommodation_id: stay, order_index: 2 });
    const booking = await insertRow(orm, Reservations, {
      trip,
      day,
      place,
      assignment: item,
      title: 'Museum ticket',
      type: 'event',
    });
    await insertRow(orm, ReservationEndpoints, {
      reservation: booking,
      role: 'from',
      name: 'Station',
      lat: -33.8,
      lng: 151.2,
    });
    await insertRow(orm, TodoItems, { trip, name: 'Pack', checked: 1 });
    const bag = await insertRow(orm, PackingBags, { trip, name: 'Backpack', weight_limit_grams: 7500 });
    await insertRow(orm, PackingItems, { trip, bag, name: 'Jacket', quantity: 2, weight_grams: 550 });
    await insertRow(orm, BudgetItems, {
      trip,
      name: 'Tickets',
      total_price: 12.25,
      currency: 'AUD',
      reservation: booking,
    });
    await insertRow(orm, CollabMessages, { trip, user: ctx.userId, text: 'Historical message', origin: 'assistant' });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, true);
    expect(graph.records.find((r) => r.kind === 'chat_messages')?.fields.origin).toBe('assistant');
    if (process.env.TREK_TRANSFER_FIXTURE) await writeFile(process.env.TREK_TRANSFER_FIXTURE, canonical(graph));
    const created = await service.apply(ctx, await stage(graph, null, 'native-copy', true));
    const target = Number(created.trip_id);
    expect(await countRows(orm, Places, { trip: target })).toBe(1);
    expect(await countRows(orm, Days, { trip: target })).toBe(1);
    expect(await countRows(orm, Reservations, { trip: target })).toBe(1);
    expect(await countRows(orm, CollabMessages, { trip: target })).toBe(0);
    const firstPlace = (await findRows(orm, Places, { trip: target }))[0];
    const { next_cursor: _ignored, ...edited } = await service.snapshot(ctx, created.trip_id, null, null, true);
    const projected = edited.records.find((r) => r.kind === 'places');
    if (!projected) throw new Error('Missing mapped place');
    projected.fields.name = 'Museum and gallery';
    await service.apply(ctx, await stage(edited, created.trip_id, 'native-edit', true));
    expect((await findRow(orm, Places, { id: firstPlace.id })).name).toBe('Museum and gallery');
    expect(await countRows(orm, Places, { trip: target })).toBe(1);
    await updateRows(orm, Places, { id: firstPlace.id }, { name: 'Edited in native planner' });
    const updated = await service.snapshot(ctx, created.trip_id, null, null, true);
    expect(updated.records.find((r) => r.id === projected.id)?.fields.name).toBe('Edited in native planner');
    expect(updated.records.find((r) => r.kind === 'chat_messages')?.fields.text).toBe('Historical message');
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
  it('deletes a mapped native place without removing retained places or broadcasting historical changes', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Source places' });
    await insertRow(orm, Places, { trip, name: 'Remove this place' });
    await insertRow(orm, Places, { trip, name: 'Keep this place' });
    const { next_cursor: _, ...source } = await service.snapshot(ctx, String(trip), null, null, false);
    const copied = await service.apply(ctx, await stage(source, null, 'copy-places'));
    const { next_cursor: _ignored, ...edited } = await service.snapshot(ctx, copied.trip_id, null, null, false);
    edited.records = edited.records.filter((r) => r.kind !== 'places' || r.fields.name !== 'Remove this place');
    const request = await stage(edited, copied.trip_id, 'remove-place');
    const receipt = await service.apply(ctx, request);
    expect((await findRows(orm, Places, { trip: Number(copied.trip_id) })).map((p) => p.name)).toEqual([
      'Keep this place',
    ]);
    expect(
      (await service.snapshot(ctx, String(trip), null, null, false)).records.filter((r) => r.kind === 'places'),
    ).toHaveLength(2);
    expect(await service.apply(ctx, request)).toEqual(receipt);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
  it('swaps native day positions atomically and refuses stale child edits', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Reorder' });
    const first = await insertRow(orm, Days, { trip, day_number: 1, title: 'First' });
    const second = await insertRow(orm, Days, { trip, day_number: 2, title: 'Second' });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    for (const r of graph.records.filter((r) => r.kind === 'days')) r.fields.position = 3 - Number(r.fields.position);
    await service.apply(ctx, await stage(graph, String(trip), 'swap'));
    expect((await findRow(orm, Days, { id: first })).day_number).toBe(2);
    expect((await findRow(orm, Days, { id: second })).day_number).toBe(1);
    const { next_cursor: _ignored, ...stale } = await service.snapshot(ctx, String(trip), null, null, false);
    const request = await stage(stale, String(trip), 'stale-child');
    await updateRows(orm, Days, { id: second }, { notes: 'Concurrent native child edit' });
    await expect(service.apply(ctx, request)).rejects.toThrow('changed since review');
  });
  it('keeps other people private packing items out and refuses cascades into them', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Private packing' });
    const { user: other } = await makeUser(orm);
    const bag = await insertRow(orm, PackingBags, { trip, name: 'Shared bag' });
    const secret = await insertRow(orm, PackingItems, {
      trip,
      bag,
      name: 'Private medication',
      is_private: 1,
      owner: other.id,
    });
    await insertRow(orm, PackingItems, { trip, name: 'Own private item', is_private: 1, owner: ctx.userId });
    const full = await service.snapshot(ctx, String(trip), null, null, true);
    expect(canonical(full)).not.toContain('Private medication');
    expect(full.records.find((r) => r.kind === 'packing_items')?.visibility).toBe('private');
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    expect(canonical(graph)).not.toContain('Own private item');
    graph.records = graph.records.filter((r) => r.kind !== 'packing_bags');
    await expect(service.apply(ctx, await stage(graph, String(trip), 'cascade'))).rejects.toThrow('private record');
    expect(await countRows(orm, PackingItems, { id: secret })).toBe(1);
  });
  it('does not treat forged source metadata as a grant to a different trip row', async () => {
    const otherTrip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Unrelated' });
    const place = await insertRow(orm, Places, { trip: otherTrip, name: 'Untouched' });
    const graph = fixture();
    graph.records.push({
      id: 'foreign-place',
      kind: 'places',
      visibility: 'trip',
      fields: { name: 'New place' },
      references: {},
      source: { native: { table: 'places', id: place }, fields: { name: 'present' } },
    });
    const result = await service.apply(ctx, await stage(graph));
    expect((await findRow(orm, Places, { id: place })).name).toBe('Untouched');
    expect(await countRows(orm, Places, { trip: Number(result.trip_id) })).toBe(1);
  });
  it('propagates native deletion and rejects invalid scalar values transactionally', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Native deletion' });
    const place = await insertRow(orm, Places, { trip, name: 'Removed later' });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    await service.apply(ctx, await stage(graph, String(trip), 'bind'));
    await deleteRows(orm, Places, { id: place });
    expect(
      (await service.snapshot(ctx, String(trip), null, null, false)).records.some((r) => r.kind === 'places'),
    ).toBe(false);
    const bad = fixture();
    bad.records.push({
      id: 'bad',
      kind: 'days',
      visibility: 'trip',
      fields: { position: 'not a number' },
      references: {},
      source: { fields: { position: 'present' } },
    });
    const before = await countRows(orm, Trips, {});
    await expect(service.apply(ctx, await stage(bad, null, 'bad'))).rejects.toThrow('Invalid native field type');
    expect(await countRows(orm, Trips, {})).toBe(before);
  });
  it('exports real native original bytes and imports them into native files with associations', async () => {
    const bytes = Buffer.alloc(CHUNK + 43, 0x93);
    bytes[0] = 0;
    const storage = t.get(StorageService);
    await storage.put('files', 'native-original.bin', Readable.from(bytes));
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Native files' });
    const place = await insertRow(orm, Places, { trip, name: 'Gallery' });
    const file = await insertRow(orm, TripFiles, {
      trip,
      filename: 'native-original.bin',
      original_name: 'Tickets.pdf',
      file_size: bytes.length,
    });
    await insertRow(orm, FileLinks, { file, place });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    expect(graph.originals).toHaveLength(1);
    expect(graph.originals[0].sha256).toBe(sha(bytes));
    const range = await service.readOriginal(ctx, String(trip), graph.revision, graph.originals[0].id, CHUNK - 7, 40);
    expect(Buffer.from(range.data, 'base64')).toEqual(bytes.subarray(CHUNK - 7, CHUNK + 33));
    await original(bytes, 'file-copy', null, false, graph.originals[0].id);
    const copy = await service.apply(ctx, await stage(graph, null, 'file-copy'));
    const native = (await findRows(orm, TripFiles, { trip: Number(copy.trip_id) }))[0];
    expect(native.original_name).toBe('Tickets.pdf');
    expect(native.mime_type).toBe('application/octet-stream');
    expect(await countRows(orm, FileLinks, { file: native.id })).toBe(1);
    const copied = await service.readOriginal(ctx, copy.trip_id, copy.revision, graph.originals[0].id, 0, CHUNK);
    expect(Buffer.from(copied.data, 'base64')).toEqual(bytes.subarray(0, CHUNK));
    expect(await service.apply(ctx, await stage(graph, null, 'file-copy'))).toEqual(copy);
    expect(await countRows(orm, TripFiles, { trip: Number(copy.trip_id) })).toBe(1);
  });
  it('refuses missing originals and observes changed native file hashes', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Missing file' });
    await insertRow(orm, TripFiles, { trip, filename: 'missing.bin', original_name: 'Original' });
    await expect(service.snapshot(ctx, String(trip), null, null, false)).rejects.toThrow('original unavailable');
    const storage = t.get(StorageService);
    await storage.put('files', 'missing.bin', Readable.from(Buffer.from('first')));
    const before = await service.snapshot(ctx, String(trip), null, null, false);
    await storage.put('files', 'missing.bin', Readable.from(Buffer.from('changed bytes')));
    await expect(service.snapshot(ctx, String(trip), before.revision, null, false)).rejects.toThrow(
      'changed during snapshot',
    );
    await expect(
      service.readOriginal(ctx, String(trip), before.revision, before.originals[0].id, 0, 5),
    ).rejects.toThrow('changed before original read');
  });
  it('keeps private imported documents out of the shared native file table', async () => {
    const graph = fixture(),
      bytes = Buffer.from('Private booking');
    graph.records.push({
      id: 'private-doc',
      kind: 'documents',
      visibility: 'private',
      fields: { original_name: 'Private.txt' },
      references: {},
      source: { fields: { original_name: 'present' } },
    });
    graph.originals.push({ id: 'private-bytes', record: 'private-doc', sha256: sha(bytes), size: bytes.length });
    await original(bytes, 'private-file', null, true, 'private-bytes');
    const copy = await service.apply(ctx, await stage(graph, null, 'private-file', true));
    expect(await countRows(orm, TripFiles, { trip: Number(copy.trip_id) })).toBe(0);
    expect((await service.snapshot(ctx, copy.trip_id, null, null, false)).originals).toHaveLength(0);
    expect(
      Buffer.from(
        (await service.readOriginal(ctx, copy.trip_id, copy.revision, 'private-bytes', 0, 100)).data,
        'base64',
      ),
    ).toEqual(bytes);
  });
  it('mutes imported task reminders, preserves no-op native reminders, and resumes on native edit', async () => {
    const trip = await insertRow(orm, Trips, {
      user: ctx.userId,
      title: 'Reminders',
      start_date: '2027-02-01',
      reminder_days: 7,
    });
    const task = await insertRow(orm, TodoItems, { trip, name: 'Native task', due_date: '2027-02-01', checked: 0 });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    await service.apply(ctx, await stage(graph, String(trip), 'no-op-task'));
    expect(await countRows(orm, TravelTransferSilentTasks, {})).toBe(0);
    const copy = await service.apply(ctx, await stage(graph, null, 'copy-task'));
    const copied = (await findRows(orm, TodoItems, { trip: Number(copy.trip_id) }))[0];
    const repo = orm.em.fork().getRepository(TodoItems);
    expect(await repo.claimReminder(copied.id)).toBe(false);
    expect((await repo.listDueForReminder('2027-02-01', '2027-02-02')).map((r) => r.id)).toEqual([task]);
    await t.get(TodoService).updateItem(copy.trip_id, copied.id, { name: 'Explicit native edit' }, ['name']);
    expect((await repo.listDueForReminder('2027-02-01', '2027-02-02')).map((r) => r.id)).toContain(copied.id);
    const { next_cursor: _next, ...changed } = await service.snapshot(ctx, String(trip), null, null, false);
    const root = changed.records.find((r) => r.id === 'trip');
    if (!root) throw new Error('Missing root');
    root.fields.start_date = '2027-02-02';
    await service.apply(ctx, await stage(changed, String(trip), 'date-change'));
    expect((await findRow(orm, Trips, { id: trip })).reminder_days).toBe(7);
    expect((await findRow(orm, Trips, { id: trip })).reminder_sent_for).toBe('2027-02-02');
  });
  it('does not vacate a day position whose value is unknown and rejects forged raw booleans', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Known and unknown' });
    const day = await insertRow(orm, Days, { trip, day_number: 1 });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, false);
    const record = graph.records.find((r) => r.kind === 'days');
    if (!record) throw new Error('Missing day');
    record.source.fields.position = 'unknown';
    await service.apply(ctx, await stage(graph, String(trip), 'unknown-day'));
    expect((await findRow(orm, Days, { id: day })).day_number).toBe(1);
    const forged = fixture();
    forged.records.push({
      id: 'bad-task',
      kind: 'tasks',
      visibility: 'trip',
      references: {},
      fields: { title: 'Bad', checked: true, trek_native_values: { checked: 2 } },
      source: { fields: { title: 'present', checked: 'present', trek_native_values: 'extension' } },
    });
    await expect(service.apply(ctx, await stage(forged, null, 'bad-flag'))).rejects.toThrow('Invalid native boolean');
  });
  it('imports the graph returned by Memories after a real PostgreSQL round trip', async () => {
    const graph = validateGraph(
      JSON.parse(await readFile(join(__dirname, '../../../fixtures/travel-transfer/memories-native.json'), 'utf8')),
    );
    const result = await service.apply(ctx, await stage(graph, null, 'memories-return', true));
    const trip = Number(result.trip_id);
    expect(await countRows(orm, Places, { trip })).toBe(1);
    expect(await countRows(orm, Reservations, { trip })).toBe(1);
    expect(await countRows(orm, PackingItems, { trip })).toBe(1);
    expect((await findRows(orm, TodoItems, { trip }))[0].checked).toBe(0);
    const snapshot = await service.snapshot(ctx, result.trip_id, null, null, true);
    expect(snapshot.records.slice().sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      graph.records.slice().sort((a, b) => a.id.localeCompare(b.id)),
    );
    const sourceHistory = graph.records.find((r) => r.kind === 'chat_messages');
    expect(snapshot.records.find((r) => r.id === sourceHistory?.id)).toEqual(sourceHistory);
  });
  it('preserves composite relationships and source people without granting accounts or memberships', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Relationships' });
    const { user: other } = await makeUser(orm);
    const expense = await insertRow(orm, BudgetItems, { trip, name: 'Shared bill', total_price: 25 });
    await insertRow(orm, BudgetItemMembers, { budgetItem: expense, user: other.id, amount: 25 });
    await insertRow(orm, BudgetItemPayers, { budgetItem: expense, user: ctx.userId, amount: 25 });
    const bag = await insertRow(orm, PackingBags, { trip, name: 'Shared bag' });
    const em = orm.em.fork();
    const nativeBag = await em.findOneOrFail(PackingBags, bag);
    nativeBag.packing_bag_members.add(em.getReference(Users, other.id));
    await em.flush();
    await insertRow(orm, RoadtripPreferences, { trip, key: 'route_mode', value: 'scenic' });
    const { next_cursor: _, ...graph } = await service.snapshot(ctx, String(trip), null, null, true);
    expect(graph.records.filter((r) => r.kind === 'travellers')).toHaveLength(2);
    expect(graph.records.find((r) => r.kind === 'expense_shares')?.references.traveller_id).toBe(
      'trek:traveller:' + other.id,
    );
    const member = graph.records.find((r) => r.kind === 'trek:packing_bag_members');
    expect(member?.references.bag_id).toBe(graph.records.find((r) => r.kind === 'packing_bags')?.id);
    expect(member?.fields.trek_user_id).toMatchObject({ id: String(other.id) });
    expect(graph.records.find((r) => r.kind === 'trek:roadtrip_preferences')?.fields).toMatchObject({
      key: 'route_mode',
      value: 'scenic',
    });
    expect(canonical(graph)).not.toContain(other.email);
    const target = await service.apply(ctx, await stage(graph, null, 'history-copy', true));
    expect(await countRows(orm, TripMembers, { trip: Number(target.trip_id) })).toBe(0);
    expect(
      (await service.snapshot(ctx, target.trip_id, null, null, true)).records.find((r) => r.id === member?.id),
    ).toEqual(member);
  });
  it('retires superseded byte chunks but keeps current originals, immutable identities and durable receipts', async () => {
    const bytes = Buffer.from('retained bytes');
    await original(bytes, 'first');
    const graph = fixture();
    graph.originals = [{ id: 'original', record: 'message', size: bytes.length, sha256: sha(bytes) }];
    const firstRequest = await stage(graph, null, 'first');
    const first = await service.apply(ctx, firstRequest);
    const { next_cursor: _cursor, ...current } = await service.snapshot(ctx, first.trip_id, null, null, false);
    await original(bytes, 'second', first.trip_id);
    await service.apply(ctx, await stage(current, first.trip_id, 'second'));
    const stored = await findRows(orm, TravelTransferObjects, { source_id: 'original:original' });
    expect(stored.map((o) => o.verified).sort()).toEqual([0, 1]);
    expect((await findRows(orm, TravelTransferChunks, {})).filter((c) => c.data !== '')).toHaveLength(1);
    expect(await service.receipt(ctx, firstRequest)).toEqual(first);
    expect(await service.apply(ctx, firstRequest)).toEqual(first);
  });
  it('streams a full 512 MiB original through staging, native apply and bounded readback', async () => {
    const part = Buffer.alloc(CHUNK, 0xa3),
      hash = createHash('sha256');
    for (let i = 0; i < 512; i++) hash.update(part);
    const digest = hash.digest('hex'),
      encoded = part.toString('base64'),
      chunkDigest = sha(part);
    await serial(
      Array.from({ length: 512 }, (_, i) => i * CHUNK),
      async (offset) => {
        await staging.accept(ctx, {
          trip_id: null,
          include_private: false,
          operation_id: 'large',
          id: 'large',
          sha256: digest,
          offset,
          total: 512 * CHUNK,
          chunk_sha256: chunkDigest,
          data: encoded,
        });
      },
    );
    const graph = fixture();
    graph.records.push({
      id: 'large-document',
      kind: 'documents',
      visibility: 'trip',
      fields: { original_name: 'Synthetic-512MiB.bin' },
      references: {},
      source: { fields: { original_name: 'present' } },
    });
    graph.originals = [{ id: 'large', record: 'large-document', size: 512 * CHUNK, sha256: digest }];
    const applied = await service.apply(ctx, await stage(graph, null, 'large'));
    const result = await service.readOriginal(ctx, applied.trip_id, applied.revision, 'large', 512 * CHUNK - 43, CHUNK);
    expect(result.total).toBe(512 * CHUNK);
    expect(result.sha256).toBe(digest);
    expect(Buffer.from(result.data, 'base64')).toEqual(part.subarray(0, 43));
  }, 120_000);
});
