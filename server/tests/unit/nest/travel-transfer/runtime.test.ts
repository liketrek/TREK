import { Days } from '../../../../src/db/entities/Days.entity';
import { TravelTransferChunks } from '../../../../src/db/entities/TravelTransferChunks.entity';
import { TravelTransferObjects } from '../../../../src/db/entities/TravelTransferObjects.entity';
import { TravelTransferOperations } from '../../../../src/db/entities/TravelTransferOperations.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import { DEFAULT_CLIENT_SCOPES } from '../../../../src/mcp/scopes';
import type { McpContext } from '../../../../src/nest-mcp';
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
import { insertRow, updateRows, countRows, findRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

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
  async function boot() {
    t = await createTestModule({ db, imports: [TravelTransferModule] });
    orm = t.get(MikroORM);
    service = t.get(TravelTransferService);
    staging = t.get(TransferStaging);
  }
  beforeEach(async () => {
    db = createSnapshotTestDb();
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
    expect(service.capabilities().features).not.toContain('complete-snapshots');
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
    expect(await countRows(orm, TravelTransferChunks, {})).toBe(1);
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
  it('refuses an incomplete snapshot of an ordinary native trip', async () => {
    const trip = await insertRow(orm, Trips, { user: ctx.userId, title: 'Native trip' });
    await insertRow(orm, Days, { trip, day_number: 1 });
    await expect(service.snapshot(ctx, String(trip), null, null, false)).rejects.toThrow('No data was omitted');
  });
  it('refuses native settings added outside the initial root projector', async () => {
    const created = await service.apply(ctx, await stage());
    const page = await service.snapshot(ctx, created.trip_id, null, null, false);
    const { next_cursor: _, ...graph } = page;
    const pending = await stage(graph, created.trip_id, 'settings-edit');
    await updateRows(orm, Trips, { id: Number(created.trip_id) }, { currency: 'USD', reminder_days: 3 });
    await expect(service.snapshot(ctx, created.trip_id, null, null, false)).rejects.toThrow('settings projection');
    await expect(service.apply(ctx, pending)).rejects.toThrow('settings projection');
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
    await serial(['one', 'two'], async (id) => {
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
    expect(await countRows(orm, TravelTransferObjects, {})).toBe(2);
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
});
