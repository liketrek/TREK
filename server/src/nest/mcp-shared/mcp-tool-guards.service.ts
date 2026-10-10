import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import type { TripEventSink, TripWriter } from '../common/trip-writer';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * The impure MCP tool guards that used to live as plain functions in
 * src/mcp/tools/_shared.ts, reaching the db Proxy, a permissions.bridge
 * instance (no longer exists — see auth.service.ts:116) and the
 * websocket broadcast functions as module globals. The @McpController domain classes are
 * ordinary Nest providers, so they inject this instead. The pure result
 * helpers (noAccess/permissionDenied/adminRequired and the
 * src/nest-mcp re-exports) stay in _shared.ts — they carry no dependencies.
 *
 * Plan 4 Task 1: the trip's `user_id` and both `role` reads moved off
 * `DatabaseService` onto `TripsRepository.getOwnerId`/`UsersRepository
 * .getRole` — both already existed with the exact narrow column set this
 * class needs (a trip-ownership lookup and a role lookup are each used by
 * several other domains already converted).
 */
@Injectable()
export class McpToolGuardsService {
  constructor(
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Broadcast a tool's change to the trip room.
   *
   * `onlyUserIds` scopes delivery the way the REST routes already scope theirs:
   * pass the users who may see the thing that changed, and the event is sent to
   * those users' sockets rather than to everyone in the room. Omitting it keeps
   * the room-wide behaviour, which is right for anything the whole trip shares.
   *
   * It is optional rather than required because most tools change something
   * everybody can see — but a tool that touches a restricted row and forgets it
   * pushes that row onto every other member's screen, which is #1976: a private
   * packing item, ticked off through MCP, landed in every other member's
   * IndexedDB and stayed there.
   */
  safeBroadcast(tripId: number, event: string, payload: Record<string, unknown>, onlyUserIds?: number[] | null): void {
    try {
      // Legacy MCP call sites pass event names as plain strings; route through
      // the facade's implementation signature (its typed overloads are for new
      // call sites). Runtime is a pure pass-through to the transport's
      // broadcast.
      const send = this.realtime.broadcast as (
        t: number | string,
        e: string,
        p: Record<string, unknown>,
        sid?: number | string,
        uid?: number,
      ) => void;
      const body = { ...payload, _source: 'mcp' };

      // Room-wide, and called with three arguments exactly as before: the
      // facade preserves its caller's arity, and padding the optionals with
      // explicit undefineds would change what every existing mock records.
      if (onlyUserIds == null) {
        send(tripId, event, body);
        return;
      }
      for (const uid of new Set(onlyUserIds)) {
        if (uid != null) send(tripId, event, body, undefined, uid);
      }
    } catch (err) {
      console.error(`[MCP] broadcast failed for ${event}:`, (err as Error | undefined)?.message ?? err);
    }
  }

  /**
   * RBAC gate for MCP tools, mirroring the checkPermission() calls the REST/Nest
   * routes run. Call this after canAccessTrip() with the same action key the
   * matching REST route uses. Returns true when the user may perform `action`
   * on `tripId`.
   */
  async hasTripPermission(action: string, tripId: number | string, userId: number): Promise<boolean> {
    const tripOwnerId = await this.trips.getOwnerId(tripId);
    if (tripOwnerId === null) return false;
    const role = await this.users.getRole(userId);
    return this.permissions.checkPermission(action, role ?? 'user', tripOwnerId, userId, tripOwnerId !== userId);
  }

  /**
   * The tool caller as a trip use case takes it: its role for the permission
   * check, and safeBroadcast as the way the write's events leave, so they keep
   * the MCP marker and a failed broadcast never fails the tool.
   */
  async tripWriter(tripId: number, userId: number): Promise<TripWriter> {
    const role = (await this.users.getRole(userId)) ?? 'user';
    return { userId, role, surface: 'mcp', events: this.tripEvents(tripId) };
  }

  /** safeBroadcast in the shape of a TripEventSink. MCP skips no socket, so both doors are the same. */
  tripEvents(tripId: number): TripEventSink {
    return {
      // The three-argument call when nothing scopes it, as every tool made it.
      emit: (event, payload, onlyUserIds) =>
        onlyUserIds === undefined
          ? this.safeBroadcast(tripId, event, payload as Record<string, unknown>)
          : this.safeBroadcast(tripId, event, payload as Record<string, unknown>, onlyUserIds && [...onlyUserIds]),
      emitAll: (event, payload) => this.safeBroadcast(tripId, event, payload as Record<string, unknown>),
    };
  }

  /** True when the user has the global admin role (mirrors REST `user.role === 'admin'` gates). */
  async isAdminUser(userId: number): Promise<boolean> {
    return (await this.users.getRole(userId)) === 'admin';
  }
}
