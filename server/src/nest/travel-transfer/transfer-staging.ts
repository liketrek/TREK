import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TRANSFER_RECEIPT } from '../../db/json-columns';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import type { McpContext } from '../../nest-mcp';
import { decodeJson } from '../../utils/json-column';
import { UnitOfWork } from '../database/unit-of-work';
import { TransferAuthority, tripId } from './transfer-authority';
import {
  canonical,
  CHUNK,
  MAX_GRAPH,
  MAX_ORIGINAL,
  MAX_RECORDS,
  sha,
  fail,
  type ChunkInput,
  type OperationInput,
} from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';

const LIFETIME = 24 * 60 * 60 * 1000;
// Includes committed bytes. Repeated writes cannot turn receipts into unbounded uploads.
const ACCOUNT_BYTES = 1024 * CHUNK;
@Injectable()
export class TransferStaging {
  constructor(
    @InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository,
    private readonly authority: TransferAuthority,
    private readonly uow: UnitOfWork,
  ) {}
  key(ctx: McpContext, operation: string) {
    return sha(canonical([ctx.userId, ctx.clientId, operation]));
  }
  async existing(ctx: McpContext, input: Omit<OperationInput, 'payload_digest'>) {
    await this.authority.check(ctx, input.trip_id, true);
    if (!ctx.clientId) fail('OAuth client required', 403);
    const key = this.key(ctx, input.operation_id);
    const op = await this.store.op(key);
    if (op && ((op.target_id ?? null) !== tripId(input.trip_id) || !!op.include_private !== input.include_private))
      fail('Operation scope changed');
    if (op?.receipt) {
      const result = decodeJson(TRANSFER_RECEIPT, op.receipt).response;
      await this.authority.check(ctx, result.trip_id, true);
    }
    if (op && !op.receipt && op.expires_at < Date.now()) fail('Transfer staging expired', 410);
    return op;
  }
  async operation(ctx: McpContext, input: Omit<OperationInput, 'payload_digest'>, create: boolean) {
    return this.uow.transactional(async () => {
      let op = await this.existing(ctx, input);
      const key = this.key(ctx, input.operation_id);
      if (!ctx.clientId) fail('OAuth client required', 403);
      if (!op && create) {
        await this.store.expire(ctx.userId, Date.now());
        if ((await this.store.active(ctx.userId)).length >= 64) fail('Too many staged operations', 429);
        await this.store.addOp({
          id: key,
          user: ctx.userId,
          client_id: ctx.clientId,
          operation_id: input.operation_id,
          target: tripId(input.trip_id),
          include_private: Number(input.include_private),
          created_at: Date.now(),
          expires_at: Date.now() + LIFETIME,
        });
        op = await this.store.op(key);
      }
      return op;
    });
  }
  async accept(ctx: McpContext, input: ChunkInput, graph = false) {
    // Hash/size validation happens before opening a transaction or allocating database space.
    const bytes = Buffer.from(input.data, 'base64');
    if (
      bytes.toString('base64') !== input.data ||
      sha(bytes) !== input.chunk_sha256 ||
      input.offset % CHUNK !== 0 ||
      bytes.length !== Math.min(CHUNK, input.total - input.offset) ||
      input.offset > input.total ||
      input.total > (graph ? MAX_GRAPH : MAX_ORIGINAL) ||
      input.total < (graph ? 1 : 0)
    )
      fail('Invalid original chunk', 422);
    return this.uow.transactional(async () => {
      const op = await this.operation(ctx, input, true);
      if (!op) fail('Operation unavailable');
      if (graph && op.payload_digest && op.payload_digest !== input.sha256) fail('Operation digest changed');
      const source = (graph ? 'graph:' : 'original:') + input.id;
      const id = sha(canonical([op.id, source]));
      let obj = await this.store.object(id);
      if (!obj) {
        if (op.receipt) fail('Operation is already applied');
        if ((await this.store.objects(op.id)).length >= MAX_RECORDS + 1) fail('Too many staged objects', 413);
        if ((await this.store.reservedBytes(ctx.userId)) + input.total > ACCOUNT_BYTES)
          fail('Transfer account quota exceeded', 413);
        if (input.offset !== 0) fail('Chunk has a gap');
        await this.store.addObject({
          id,
          operation: op.id,
          source_id: source,
          digest: input.sha256,
          size: input.total,
        });
        obj = await this.store.object(id);
      }
      if (!obj) fail('Staged object unavailable');
      if (obj.digest !== input.sha256 || obj.size !== input.total) fail('Original identity changed');
      const prior = await this.store.chunk(id, input.offset);
      if (prior) {
        if (prior.data !== input.data) fail('Chunk replay changed');
      } else {
        if (op.receipt || obj.received !== input.offset) fail('Chunk is out of order');
        await this.store.addChunk(id, input.offset, input.data);
        const received = input.offset + bytes.length;
        if (received === input.total) {
          const hash = createHash('sha256');
          // Chain bounded chunk reads: only one original chunk is held at a time.
          await Array.from({ length: Math.max(1, Math.ceil(input.total / CHUNK)) }, (_, i) => i * CHUNK).reduce(
            async (previous, offset) => {
              await previous;
              const row = await this.store.chunk(id, offset);
              if (!row) fail('Incomplete original');
              hash.update(Buffer.from(row.data, 'base64'));
            },
            Promise.resolve(),
          );
          if (hash.digest('hex') !== obj.digest) fail('Original hash mismatch', 422);
        }
        await this.store.advance(id, received, received === input.total);
      }
      if (graph && !op.payload_digest) await this.store.updateOp(op.id, { payload_digest: input.sha256 });
      await this.authority.check(ctx, input.trip_id, true);
      return { next_offset: input.offset + bytes.length, sha256: obj.digest };
    });
  }
  async graphBytes(operation: string) {
    const obj = (await this.store.objects(operation)).find((o) => o.source_id === 'graph:payload');
    if (!obj || !obj.verified || obj.size > MAX_GRAPH) fail('Graph is not fully staged');
    // Only metadata is assembled in memory; original byte reads stay bounded.
    return Buffer.concat((await this.store.chunks(obj.id)).map((c) => Buffer.from(c.data, 'base64')));
  }
}
