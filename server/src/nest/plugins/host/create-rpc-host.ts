import { db, canAccessTrip } from '../../../db/database';
import { broadcast, broadcastToUser } from '../../../websocket';
import { PluginDataDb } from './plugin-data.service';
import { PluginRpcHost } from './rpc-host';
import { appendAudit } from './plugin-audit';

/**
 * Wires a plugin's capability host to the REAL privileged modules (#plugins,
 * M1). This is the ONLY plugin file that imports db/websocket — it runs in the
 * host (parent), never in the child. Broadcasts are force-namespaced to
 * `plugin:{id}:{event}` so a plugin can't forge a core event.
 */

const dataDbs = new Map<string, PluginDataDb>();

export function getPluginDataDb(id: string): PluginDataDb {
  let d = dataDbs.get(id);
  if (!d) {
    d = new PluginDataDb(id);
    dataDbs.set(id, d);
  }
  return d;
}

export function closePluginDataDb(id: string): void {
  dataDbs.get(id)?.close();
  dataDbs.delete(id);
}

export function createRealRpcHost(id: string, granted: ReadonlySet<string>): PluginRpcHost {
  return new PluginRpcHost(id, granted, {
    data: getPluginDataDb(id),
    db,
    canAccessTrip: (tripId, userId) => canAccessTrip(tripId, userId),
    // Two users "share a trip" when both are owner-or-member of the same trip.
    canSeeUser: (actingUserId, targetUserId) =>
      !!db
        .prepare(
          `SELECT 1 FROM trips t
             LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
             LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
            WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
              AND (t.user_id = ? OR m2.user_id IS NOT NULL)
            LIMIT 1`,
        )
        .get(actingUserId, targetUserId, actingUserId, targetUserId),
    broadcastToTrip: (tripId, event, payload) => broadcast(tripId, `plugin:${id}:${event}`, payload),
    broadcastToUser: (userId, payload) => broadcastToUser(userId, { type: `plugin:${id}`, ...payload }),
    audit: (entry) => appendAudit(db, entry),
  });
}
