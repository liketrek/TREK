import type { User } from '../../types';
import { DomainError } from '../common/domain-error';
import { restTripWriter, type TripWriter } from '../common/trip-writer';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TripsService, type DeleteTripInfo } from './trips.service';
import { Injectable } from '@nestjs/common';

/** The fields a new trip takes, as TripsService.create reads them. */
type TripCreateInput = Parameters<TripsService['create']>[1];

/**
 * Who adds a trip to their own list. `role` is for the trip_create check; REST's
 * `socketId` is the tab that asked, which shows the new trip from its own answer
 * and is left out of the ping. MCP has none, so every tab of the user hears it.
 */
export interface TripListWriter {
  userId: number;
  role: string;
  socketId: string | undefined;
}

/**
 * The trip writes whose events every surface sends the same way: a trip created
 * or copied tells its owner's other tabs that the trip list changed, and a
 * deleted trip tells the trip room. TripsService holds the writes themselves and
 * sends nothing; the controller and the MCP tools are adapters over this.
 *
 * The update broadcast stays with its callers, which already sent it alike. What
 * they share for it is the permission list (tripUpdatePermissions in
 * trips.helpers.ts).
 */
@Injectable()
export class TripWritesService {
  constructor(
    private readonly trips: TripsService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  /** REST's writer for a trip: the room minus the tab that sent the request. */
  restWriter(tripId: string | number, user: Pick<User, 'id' | 'role'>, socketId: string | undefined): TripWriter {
    return restTripWriter(this.realtime, tripId, user, socketId);
  }

  /**
   * Creates a trip with its days. REST checks trip_create before its own date
   * checks, so the gate here only ever refuses an MCP caller.
   */
  async create(input: TripCreateInput, writer: TripListWriter) {
    await this.requireCreate(writer);
    const created = await this.trips.create(writer.userId, input);
    this.announceList(writer);
    return created;
  }

  /** Copies a trip the writer can open into a new one they own, and returns its id. */
  async copy(sourceTripId: string | number, title: string | undefined, writer: TripListWriter): Promise<number> {
    await this.requireCreate(writer);
    const newTripId = await this.trips.copy(sourceTripId, writer.userId, title);
    this.announceList(writer);
    return newTripId;
  }

  /** Deletes a trip and tells everyone in its room, once the delete is committed. */
  async remove(tripId: string | number, writer: TripWriter): Promise<DeleteTripInfo> {
    const info = await this.trips.remove(tripId, writer.userId, writer.role);
    writer.events.emit('trip:deleted', { id: info.tripId });
    return info;
  }

  private async requireCreate(writer: TripListWriter): Promise<void> {
    if (!(await this.permissions.checkPermission('trip_create', writer.role, null, writer.userId, false))) {
      throw new DomainError(403, 'No permission to create trips', {
        mcpMessage: 'You do not have permission to create trips.',
      });
    }
  }

  /** A ping, not the trip: the dashboard of every other tab reads its list again. */
  private announceList(writer: TripListWriter): void {
    this.realtime.broadcastToUser(writer.userId, { type: 'trips:changed' }, writer.socketId);
  }
}
