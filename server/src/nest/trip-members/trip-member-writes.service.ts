import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import type { User } from '../../types';
import { BudgetService } from '../budget/budget.service';
import { restTripWriter, type TripWriter } from '../common/trip-writer';
import { RealtimeService } from '../realtime/realtime.service';
import { TripMembersService } from './trip-members.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * The roster writes of a trip, one method per use case, for REST and MCP alike.
 *
 * Each runs the write through TripMembersService, whose methods stay silent
 * building blocks, and sends what the room needs once it is committed. Before
 * this only the MCP tools announced a member coming or going, and only REST sent
 * the invitation, so a tab never learnt of a member added in the planner, and a
 * person added through MCP was never told.
 *
 * The callers keep their own gates (trip access, member_manage, owner only),
 * which already agreed.
 */
@Injectable()
export class TripMemberWritesService {
  constructor(
    private readonly roster: TripMembersService,
    private readonly budget: BudgetService,
    private readonly realtime: RealtimeService,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  /** REST's writer for a roster change: the room minus the tab that sent the request. */
  restWriter(tripId: string | number, user: Pick<User, 'id' | 'role'>, socketId: string | undefined): TripWriter {
    return restTripWriter(this.realtime, tripId, user, socketId);
  }

  /** Puts an account on the trip: the room gets the member, the person an invitation. */
  async addMember(tripId: string | number, identifier: string, tripOwnerId: number, writer: TripWriter) {
    const result = await this.roster.addMember(tripId, identifier, tripOwnerId, writer.userId);
    writer.events.emit('member:added', { member: result.member });
    // The invitation names who sent it by name, as the route does with its session user.
    const actor = { id: writer.userId, username: (await this.users.findById(writer.userId))?.username ?? '' };
    this.roster.notifyInvite(String(tripId), actor, result.targetUserId, result.tripTitle, result.member.email);
    return result;
  }

  /** Takes somebody off the trip, the writer themselves included when they leave. */
  async removeMember(tripId: number, targetUserId: number, writer: TripWriter): Promise<void> {
    await this.roster.removeMember(tripId, targetUserId);
    writer.events.emit('member:removed', { userId: targetUserId });
  }

  /** A companion without an account. No invitation: a guest has no inbox. */
  async createGuest(tripId: string | number, name: string, writer: TripWriter) {
    const created = await this.roster.createGuest(tripId, name, writer.userId);
    writer.events.emit('member:added', { member: created.member });
    return created;
  }

  /** False for somebody who is no guest of this trip. The event carries the id and the new name, never the row. */
  async renameGuest(tripId: string | number, guestId: number, name: string, writer: TripWriter): Promise<boolean> {
    if (!(await this.roster.renameGuest(tripId, guestId, name))) return false;
    writer.events.emit('member:updated', { member: { id: guestId, username: name.trim() } });
    return true;
  }

  /**
   * False for somebody who is no guest of this trip. Deleting a guest hands their
   * share of every expense they were part of to the rest of its split, and clears
   * them as the legacy payer of any expense, so each of those expenses goes out
   * again after the member, as it now reads.
   */
  async deleteGuest(tripId: string | number, guestId: number, writer: TripWriter): Promise<boolean> {
    // Read first: the rows that name the guest go with the guest.
    const shared = (await this.budget.listBudgetItems(tripId))
      .filter((item) => item.paid_by_user_id === guestId || item.members?.some((member) => member.user_id === guestId))
      .map((item) => item.id);
    if (!(await this.roster.deleteGuest(tripId, guestId))) return false;
    writer.events.emit('member:removed', { userId: guestId });
    const resplit = await Promise.all(shared.map((itemId) => this.budget.getBudgetItem(itemId, tripId)));
    for (const item of resplit) {
      if (item) writer.events.emit('budget:updated', { item });
    }
    return true;
  }
}
