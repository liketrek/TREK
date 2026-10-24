import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TRANSFER_RECEIPT, TRANSFER_ORIGINALS } from '../../db/json-columns';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import type { McpContext } from '../../nest-mcp';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { UnitOfWork } from '../database/unit-of-work';
import { TransferAuthority } from './transfer-authority';
import { TransferGraph } from './transfer-graph';
import { TransferNative } from './transfer-native';
import { TransferNativeFiles } from './transfer-native-files';
import { TransferStaging } from './transfer-staging';
import {
  canonical,
  CHUNK,
  FORMAT,
  MAX_ORIGINAL,
  sha,
  fail,
  scopedMerge,
  validateGraph,
  type ApplyInput,
  type OperationInput,
  type Graph,
} from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TravelTransferService {
  constructor(
    @InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository,
    private readonly authority: TransferAuthority,
    private readonly graphs: TransferGraph,
    private readonly native: TransferNative,
    private readonly files: TransferNativeFiles,
    private readonly staging: TransferStaging,
    private readonly uow: UnitOfWork,
  ) {}
  capabilities() {
    return {
      format: FORMAT,
      features: [
        'complete-snapshots',
        'field-manifests',
        'original-chunks',
        'historical-attribution',
        'silent-apply',
        'conditional-apply',
        'durable-receipts',
        'protected-extensions',
        'graph-staging',
        'idempotent-trip-create',
        'scoped-apply',
      ],
      max_original_bytes: MAX_ORIGINAL,
      chunk_bytes: CHUNK,
      unavailable: [],
    };
  }
  async trips(ctx: McpContext, cursor: string | null, limit: number) {
    await this.authority.check(ctx, null, false);
    if (cursor !== null && !/^[1-9][0-9]*$/.test(cursor)) fail('Invalid cursor', 422);
    const after = cursor === null ? 0 : Number(cursor);
    if (!Number.isSafeInteger(after)) fail('Invalid cursor', 422);
    const rows = await this.store.trips(ctx.userId, after, limit + 1);
    return {
      trips: rows.slice(0, limit).map((r) => ({ id: String(r.id), title: r.title })),
      next_cursor: rows.length > limit ? String(rows[limit - 1].id) : null,
    };
  }
  async snapshot(
    ctx: McpContext,
    target: string,
    revision: string | null,
    cursor: string | null,
    privateData: boolean,
  ) {
    const id = await this.authority.check(ctx, target, false);
    if (id === null) fail('Trip required', 422);
    const files = await this.files.prepare(id, privateData, revision !== null);
    const graph = await this.uow.transactional(() => this.graphs.snapshot(id, privateData, files));
    if (revision !== null && revision !== graph.revision) fail('Trip changed during snapshot');
    if (cursor !== null && (!revision || !/^\d+$/.test(cursor))) fail('Invalid snapshot cursor', 422);
    const offset = cursor === null ? 0 : Number(cursor);
    const entries = [
      ...graph.records.map((value) => ({ kind: 'records' as const, value })),
      ...graph.originals.map((value) => ({ kind: 'originals' as const, value })),
    ];
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= entries.length) fail('Invalid snapshot cursor', 422);
    const page: Graph & { next_cursor: string | null } = {
      ...graph,
      records: [],
      originals: [],
      next_cursor: null as string | null,
    };
    let size = Buffer.byteLength(canonical(page)),
      next = offset;
    for (; next < entries.length; next++) {
      const entry = entries[next],
        bytes = Buffer.byteLength(canonical(entry.value)) + 1;
      if (size + bytes > CHUNK - 256) {
        if (next === offset) fail('One record exceeds the snapshot page limit', 413);
        break;
      }
      if (entry.kind === 'records') page.records.push(entry.value);
      else page.originals.push(entry.value);
      size += bytes;
    }
    page.next_cursor = next < entries.length ? String(next) : null;
    await this.authority.check(ctx, target, false);
    return page;
  }
  async readOriginal(ctx: McpContext, target: string, revision: string, id: string, offset: number, limit: number) {
    const trip = await this.authority.check(ctx, target, false);
    if (trip === null) fail('Trip required', 422);
    let includePrivate = false;
    let files = await this.files.prepare(trip, false, true);
    let graph = await this.graphs.snapshot(trip, false, files);
    if (graph.revision !== revision) {
      includePrivate = true;
      files = await this.files.prepare(trip, true, true);
      graph = await this.graphs.snapshot(trip, true, files);
    }
    if (graph.revision !== revision) fail('Trip changed before original read');
    const original = graph.originals.find((o) => o.id === id);
    if (!original || offset > original.size) fail('Original unavailable', 404);
    const native = files.find(
      (file) => file.record === original.record && file.digest === original.sha256 && file.size === original.size,
    );
    if (native) {
      const data = await this.files.read(native, offset, limit);
      await this.authority.check(ctx, target, false);
      // A long provider read must not return bytes after linked-journal access or associations change.
      const current = await this.uow.transactional(() => this.graphs.snapshot(trip, includePrivate, files));
      if (current.revision !== revision) fail('Trip changed during original read');
      return {
        offset,
        total: original.size,
        sha256: original.sha256,
        chunk_sha256: sha(data),
        data: data.toString('base64'),
      };
    }
    const saved = await this.store.graph(trip);
    if (!saved) fail('Original unavailable', 404);
    const objectId = decodeJson(TRANSFER_ORIGINALS, saved.originals)[id];
    const object = objectId && (await this.store.object(objectId));
    if (!object || !object.verified || object.digest !== original.sha256 || object.size !== original.size)
      fail('Original unavailable', 404);
    const base = Math.floor(offset / CHUNK) * CHUNK;
    // At most two chunks are read for an unaligned bounded range.
    const positions = Array.from(
      { length: Math.ceil((Math.min(offset + limit, original.size) - base) / CHUNK) },
      (_, i) => base + i * CHUNK,
    );
    const chunks = await Promise.all(positions.map((pos) => this.store.chunk(objectId, pos)));
    const bytes = Buffer.concat(
      chunks.map((chunk) => {
        if (!chunk) fail('Original unavailable', 404);
        return Buffer.from(chunk.data, 'base64');
      }),
    );
    const data = bytes.subarray(offset - base, offset - base + limit);
    await this.authority.check(ctx, target, false);
    const current = await this.uow.transactional(() => this.graphs.snapshot(trip, includePrivate, files));
    if (current.revision !== revision) fail('Trip changed during original read');
    return {
      offset,
      total: original.size,
      sha256: original.sha256,
      chunk_sha256: sha(data),
      data: data.toString('base64'),
    };
  }
  async receipt(ctx: McpContext, input: OperationInput) {
    const op = await this.staging.operation(ctx, input, false);
    if (op?.payload_digest && op.payload_digest !== input.payload_digest) fail('Operation digest changed');
    return op?.receipt
      ? decodeJson(TRANSFER_RECEIPT, op.receipt).response
      : { state: 'not_applied', payload_digest: input.payload_digest };
  }
  async apply(ctx: McpContext, input: ApplyInput) {
    const initial = await this.staging.existing(ctx, input);
    if (!initial || initial.payload_digest !== input.payload_digest) fail('No matching staged graph');
    const existingFiles = !initial.receipt && input.trip_id ? await this.files.prepare(Number(input.trip_id)) : [];
    const prepared = initial.receipt
      ? {}
      : await this.files.materialize(initial.id, await this.stagedGraph(initial.id));
    try {
      const fileHashes = [...existingFiles, ...(await this.files.preparedHashes(prepared))];
      return await this.uow.transactional(async () => {
        const op = await this.staging.operation(ctx, input, false);
        if (!op || op.payload_digest !== input.payload_digest) fail('No matching staged graph');
        if (op.receipt) {
          const prior = decodeJson(TRANSFER_RECEIPT, op.receipt);
          if (prior.request !== sha(canonical(input))) fail('Apply replay changed');
          return prior.response;
        }
        if ((input.trip_id === null) !== (input.expected_revision === null))
          fail('Expected revision is required for an existing trip');
        const incoming = await this.stagedGraph(op.id);
        if (input.trip_id !== null && incoming.trip !== input.trip_id) fail('Graph target changed');
        // Verify exact bytes, not reserialised floats (Python and JS spell small geometry floats differently).
        const previous = input.trip_id === null ? null : await this.graphs.full(Number(input.trip_id), existingFiles);
        if (
          previous &&
          (await this.graphs.snapshot(Number(input.trip_id), input.include_private, existingFiles)).revision !==
            input.expected_revision
        )
          fail('Trip changed since review');
        const graph = previous ? scopedMerge(previous, incoming, input.include_private) : incoming;
        if (!input.include_private && incoming.records.some((r) => r.visibility === 'private'))
          fail('Private records require explicit selection');
        const fields = this.graphs.rootFields(graph);
        if (canonical([...input.original_ids].sort()) !== canonical(incoming.originals.map((o) => o.id).sort()))
          fail('Original manifest changed');
        const old = previous ? await this.store.graph(Number(input.trip_id)) : null;
        const originals: Record<string, string> = Object.assign(
          Object.create(null),
          old ? decodeJson(TRANSFER_ORIGINALS, old.originals) : {},
        );
        const staged = await this.store.objects(op.id);
        // Serial verification avoids queuing thousands of original reads.
        await graph.originals.reduce(async (previousCheck, file) => {
          await previousCheck;
          const retired = originals[file.id] ? await this.store.object(originals[file.id]) : null;
          if (retired && (retired.digest !== file.sha256 || retired.size !== file.size))
            fail('Original IDs are immutable');
          const former = previous?.originals.find((o) => o.id === file.id);
          if (former && (former.sha256 !== file.sha256 || former.size !== file.size))
            fail('Original IDs are immutable');
          const candidate =
            staged.find((o) => o.source_id === 'original:' + file.id) ??
            (originals[file.id] ? await this.store.object(originals[file.id]) : null);
          if (!candidate || !candidate.verified || candidate.digest !== file.sha256 || candidate.size !== file.size)
            fail('Missing verified original');
          originals[file.id] = candidate.id;
        }, Promise.resolve());
        await this.authority.check(ctx, input.trip_id, true);
        const target =
          input.trip_id === null ? await this.store.createTrip(ctx.userId, fields.title) : Number(input.trip_id);
        // No ordinary mutator calls: no notifications, author impersonation, date cascading or membership edits.
        await this.store.updateTrip(target, fields);
        graph.trip = String(target);
        const bindings = await this.native.apply(
          target,
          graph,
          input.trip_id === null ? null : await this.native.project(target),
          prepared,
        );
        await this.store.saveGraph(target, ctx.userId, graph, originals, bindings);
        const projected = await this.native.project(target);
        await this.store.saveGraph(target, ctx.userId, graph, originals, projected.bindings);
        const result = await this.graphs.snapshot(target, input.include_private, fileHashes);
        const response = {
          state: 'applied' as const,
          payload_digest: input.payload_digest,
          trip_id: String(target),
          revision: result.revision,
        };
        await this.store.updateOp(op.id, {
          receipt: encodeJson(TRANSFER_RECEIPT, { request: sha(canonical(input)), response }),
        });
        await this.staging.retireSuperseded(ctx.userId);
        return response;
      });
    } finally {
      await this.files.cleanup(prepared);
    }
  }
  private async stagedGraph(operation: string): Promise<Graph> {
    const raw = await this.staging.graphBytes(operation);
    const op = await this.store.op(operation);
    if (!op || sha(raw) !== op.payload_digest) fail('Graph digest changed');
    let decoded: unknown;
    try {
      decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
    } catch {
      fail('Invalid graph JSON', 422);
    }
    return validateGraph(decoded);
  }
}
