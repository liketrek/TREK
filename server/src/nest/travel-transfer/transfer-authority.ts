import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import type { McpContext } from '../../nest-mcp';
import { fail } from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

export function allowed(ctx: McpContext, write: boolean): boolean {
  return !!ctx.clientId && !ctx.isStaticToken && !!ctx.scopes?.includes(write ? 'transfer:write' : 'transfer:read');
}
export function tripId(value: string | null): number | null {
  if (value === null) return null;
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) fail('Invalid trip ID', 422);
  return Number(value);
}
@Injectable()
export class TransferAuthority {
  constructor(@InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository) {}
  async check(ctx: McpContext, target: string | null, write: boolean) {
    if (!allowed(ctx, write) || !ctx.reauthorize || !(await ctx.reauthorize()))
      fail('Current OAuth transfer consent is required', 403);
    const user = await this.store.user(ctx.userId);
    if (!user) fail('Account unavailable', 403);
    const id = tripId(target);
    if (id !== null) {
      const trip = await this.store.trip(id);
      if (!trip || trip.user_id !== ctx.userId) fail('Only the current trip owner can transfer this trip', 403);
      const graph = await this.store.graph(id);
      // Private imported material never follows ownership to another account.
      if (graph && graph.user_id !== ctx.userId) fail('Transfer data belongs to a different account', 403);
    }
    return id;
  }
}
