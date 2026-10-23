import type { User } from '../../types';
import { DomainError } from '../common/domain-error';
import { requireTripWrite, restTripWriter, type TripWriter } from '../common/trip-writer';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { BudgetService } from './budget.service';
import { Injectable } from '@nestjs/common';

/** The fields a new expense takes, as BudgetService.create reads them. */
export type BudgetItemCreateInput = Parameters<BudgetService['create']>[1];

/**
 * Budget writes as use cases, one method each, for every surface: the trip
 * gate, the write and the events it sends, after its commit.
 *
 * Only the create lives here so far. The MCP tool that adds an expense together
 * with its split sent budget:members-updated on top of budget:created, which the
 * REST route never sent for the same write; both now run this one method. The
 * other budget writes still send from their adapters, and send the same there.
 */
@Injectable()
export class BudgetWritesService {
  constructor(
    private readonly budget: BudgetService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  /** The REST caller of a budget use case: its events skip the socket that sent the request. */
  restWriter(tripId: string, user: User, socketId: string | undefined): TripWriter {
    return restTripWriter(this.realtime, tripId, user, socketId);
  }

  /**
   * Add an expense. A booking or a place it links to must be on the same trip
   * (#2084), and a booking mirrors the total of its expenses, so a linked one
   * has its price worked out again before budget:created goes out. The item
   * already carries its members, so no members-updated follows.
   */
  async createItem(tripId: string | number, data: BudgetItemCreateInput, writer: TripWriter) {
    await requireTripWrite(
      {
        access: { findAccessible: (id, userId) => this.budget.verifyTripAccess(id, userId) },
        permissions: this.permissions,
      },
      'budget_edit',
      tripId,
      writer,
    );
    const refusal = await this.budget.linkRefusal(tripId, data);
    if (refusal) throw new DomainError(400, refusal);
    const item = await this.budget.create(String(tripId), data);
    if (item.reservation_id) await this.budget.resyncReservationPrice(tripId, item.reservation_id, writer.socketId);
    writer.events.emit('budget:created', { item });
    return item;
  }
}
