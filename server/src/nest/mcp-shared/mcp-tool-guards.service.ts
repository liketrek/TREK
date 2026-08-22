import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * The impure MCP tool guards that used to live as plain functions in
 * src/mcp/tools/_shared.ts, reaching the db Proxy, permissions.bridge and the
 * src/websocket stub as module globals. The @McpController domain classes are
 * ordinary Nest providers, so they inject this instead. The pure result
 * helpers (noAccess/permissionDenied/adminRequired/MAX_MCP_TRIP_DAYS and the
 * src/nest-mcp re-exports) stay in _shared.ts — they carry no dependencies.
 */
@Injectable()
export class McpToolGuardsService {
  constructor(
    private readonly db: DatabaseService,
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
      // call sites). Runtime is a pure pass-through to src/websocket's
      // broadcast, so the 100+ per-file vi.mock stubs keep intercepting.
      const send = this.realtime.broadcast as (
        t: number | string, e: string, p: Record<string, unknown>, sid?: number | string, uid?: number,
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
  hasTripPermission(action: string, tripId: number | string, userId: number): boolean {
    const trip = this.db.get<{ user_id?: number }>('SELECT user_id FROM trips WHERE id = ?', tripId);
    if (!trip) return false;
    const userRow = this.db.get<{ role?: string }>('SELECT role FROM users WHERE id = ?', userId);
    const tripOwnerId = typeof trip.user_id === 'number' ? trip.user_id : null;
    return this.permissions.checkPermission(action, userRow?.role ?? 'user', tripOwnerId, userId, tripOwnerId !== userId);
  }

  /** True when the user has the global admin role (mirrors REST `user.role === 'admin'` gates). */
  isAdminUser(userId: number): boolean {
    const userRow = this.db.get<{ role?: string }>('SELECT role FROM users WHERE id = ?', userId);
    return userRow?.role === 'admin';
  }
}
