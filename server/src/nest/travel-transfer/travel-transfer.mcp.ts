import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  type McpContext,
} from '../../nest-mcp';
import { allowed } from './transfer-authority';
import { TransferStaging } from './transfer-staging';
import {
  canonical,
  listSchema,
  snapshotSchema,
  readSchema,
  writeSchema,
  stageSchema,
  applySchema,
  receiptSchema,
  type ListInput,
  type SnapshotInput,
  type ReadInput,
  type ChunkInput,
  type StageInput,
  type ApplyInput,
  type OperationInput,
} from './transfer-wire';
import { TravelTransferService } from './travel-transfer.service';

// Compact JSON keeps the negotiated metadata page budget on the actual wire.
function ok(value: unknown) {
  return { content: [{ type: 'text' as const, text: canonical(value) }] };
}

@McpController()
export class TravelTransferMcp {
  constructor(
    private readonly transfer: TravelTransferService,
    private readonly staging: TransferStaging,
  ) {}
  @Tool({
    name: 'travel_transfer_capabilities',
    description:
      'Describe supported transfer guarantees and remaining native-domain limits. A missing guarantee blocks full sync.',
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => allowed(ctx, false) || allowed(ctx, true),
  })
  capabilities() {
    return ok(this.transfer.capabilities());
  }
  @Tool({
    name: 'travel_transfer_list_trips',
    description: 'List owned trips for explicit pairing. Listing does not guarantee native-domain transfer support.',
    inputSchema: listSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => allowed(ctx, false),
  })
  async trips(input: ListInput, ctx: McpContext) {
    return ok(await this.transfer.trips(ctx, input.cursor, input.limit));
  }
  @Tool({
    name: 'travel_transfer_snapshot',
    description:
      'Read a revision-bound transfer graph page. Rejects unprojected native domains without omitting their data.',
    inputSchema: snapshotSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => allowed(ctx, false),
  })
  async snapshot(input: SnapshotInput, ctx: McpContext) {
    return ok(await this.transfer.snapshot(ctx, input.trip_id, input.revision, input.cursor, input.include_private));
  }
  @Tool({
    name: 'travel_transfer_read_original',
    description: 'Read exact original bytes from an authorised snapshot, in bounded base64 chunks.',
    inputSchema: readSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => allowed(ctx, false),
  })
  async read(input: ReadInput, ctx: McpContext) {
    return ok(
      await this.transfer.readOriginal(ctx, input.trip_id, input.revision, input.id, input.offset, input.limit),
    );
  }
  @Tool({
    name: 'travel_transfer_write_original',
    description: 'Stage verified original chunks privately. Does not publish or modify a trip.',
    inputSchema: writeSchema,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: (ctx) => allowed(ctx, true),
  })
  async write(input: ChunkInput, ctx: McpContext) {
    return ok(await this.staging.accept(ctx, input));
  }
  @Tool({
    name: 'travel_transfer_stage_graph',
    description: 'Stage bounded JSON chunks for a reviewed transfer. Replays must match exactly.',
    inputSchema: stageSchema,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: (ctx) => allowed(ctx, true),
  })
  async stage(input: StageInput, ctx: McpContext) {
    const result = await this.staging.accept(ctx, { ...input, id: 'payload', sha256: input.payload_digest }, true);
    return ok({ next_offset: result.next_offset, payload_digest: input.payload_digest });
  }
  @Tool({
    name: 'travel_transfer_apply',
    description:
      'Atomically apply a staged graph and record a durable receipt. Historical source records stay protected; no messages, invites or notifications are sent.',
    inputSchema: applySchema,
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: (ctx) => allowed(ctx, true),
  })
  async apply(input: ApplyInput, ctx: McpContext) {
    return ok(await this.transfer.apply(ctx, input));
  }
  @Tool({
    name: 'travel_transfer_receipt',
    description:
      'Reconcile an operation after a lost response, under current OAuth and trip ownership. Never infer success from a title.',
    inputSchema: receiptSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => allowed(ctx, true),
  })
  async receipt(input: OperationInput, ctx: McpContext) {
    return ok(await this.transfer.receipt(ctx, input));
  }
}
