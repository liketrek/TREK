import { PluginController, PluginMethod } from '../rpc-kit/decorators';
import { PluginGuards } from '../plugin-guards.service';
import { BadParams, ForbiddenResource } from '../rpc-errors';
import { num, str } from '../rpc-params';
import type { PluginRpcContext } from '../rpc-kit/types';
import { DatabaseService } from '../../../database/database.service';

/** Core entities a plugin may attach its own db:meta to. */
const META_ENTITY_TYPES: ReadonlySet<string> = new Set(['trip', 'place', 'day', 'reservation', 'accommodation']);

// Quotas: a cheap disk-DoS guard on the shared trek.db volume. Generous for real use,
// small enough to bound abuse.
const META_VALUE_MAX = 64 * 1024; // serialized JSON bytes per value
const META_KEY_MAX = 256; // key length (the key is attacker-controlled too)
const META_KEYS_MAX = 100; // keys per (plugin, entity)

/** Which edit permission an entity type rides on. Accommodations ride on days. */
const EDIT_ACTION: Record<string, string> = {
  trip: 'trip_edit',
  place: 'place_edit',
  reservation: 'reservation_edit',
  day: 'day_edit',
  accommodation: 'day_edit',
};

/** Each of these tables has a NOT NULL trip_id, so the gate resolves the owning trip. */
const ENTITY_TABLE: Record<string, string> = {
  place: 'places',
  day: 'days',
  reservation: 'reservations',
  accommodation: 'day_accommodations',
};

/**
 * A plugin's OWN namespaced key/value store, attached to a core entity (#plugins).
 *
 * The rows are not core data, but the entity they hang off must belong to a trip the
 * acting user can access, so a plugin cannot stash or read metadata against another
 * tenant's rows. Writes additionally need that entity's edit permission, so a
 * read-only member cannot overwrite metadata an editor created.
 *
 * Every row is tagged with the plugin id, so one plugin never sees another's keys.
 */
@PluginController()
export class MetaRpc {
  constructor(
    private readonly db: DatabaseService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('meta.get', { permission: 'db:meta' })
  get(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const { entityType, entityId } = this.resolveEntity(params, ctx, false);
    const row = this.db
      .prepare('SELECT value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
      .get(ctx.pluginId, entityType, entityId, str(params.key, 'key')) as { value: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch {
      return null;
    }
  }

  @PluginMethod('meta.set', { permission: 'db:meta' })
  set(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const { entityType, entityId } = this.resolveEntity(params, ctx, true);
    const key = str(params.key, 'key');
    if (key.length > META_KEY_MAX) throw new BadParams(`metadata key too long (>${META_KEY_MAX} chars)`);
    const json = JSON.stringify(params.value ?? null);
    if (json.length > META_VALUE_MAX) throw new BadParams(`metadata value too large (>${META_VALUE_MAX} bytes)`);
    const exists = this.db
      .prepare('SELECT 1 FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
      .get(ctx.pluginId, entityType, entityId, key);
    if (!exists) {
      const { n } = this.db
        .prepare('SELECT COUNT(*) AS n FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=?')
        .get(ctx.pluginId, entityType, entityId) as { n: number };
      if (n >= META_KEYS_MAX) throw new BadParams(`too many metadata keys on this ${entityType} (max ${META_KEYS_MAX})`);
    }
    this.db
      .prepare(`INSERT INTO plugin_entity_metadata (plugin_id, entity_type, entity_id, key, value, updated_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                    ON CONFLICT(plugin_id, entity_type, entity_id, key)
                    DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .run(ctx.pluginId, entityType, entityId, key, json);
    return { key, value: params.value ?? null };
  }

  @PluginMethod('meta.list', { permission: 'db:meta' })
  list(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const { entityType, entityId } = this.resolveEntity(params, ctx, false);
    const rows = this.db
      .prepare('SELECT key, value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? ORDER BY key')
      .all(ctx.pluginId, entityType, entityId) as Array<{ key: string; value: string }>;
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.value);
      } catch {
        out[r.key] = null;
      }
    }
    return out;
  }

  @PluginMethod('meta.delete', { permission: 'db:meta' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const { entityType, entityId } = this.resolveEntity(params, ctx, true);
    const res = this.db
      .prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
      .run(ctx.pluginId, entityType, entityId, str(params.key, 'key'));
    return { deleted: res.changes > 0 };
  }

  /**
   * Validates the target and gates it: a supported entity type, an entity that
   * resolves to a trip the acting user can access, and for a write that entity's own
   * edit permission.
   */
  private resolveEntity(
    params: Record<string, unknown>,
    ctx: PluginRpcContext,
    write: boolean,
  ): { entityType: string; entityId: number } {
    const entityType = str(params.entityType, 'entityType');
    if (!META_ENTITY_TYPES.has(entityType)) {
      throw new BadParams(`invalid entityType "${entityType}" (${[...META_ENTITY_TYPES].join('|')})`);
    }
    const entityId = num(params.entityId, 'entityId');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('metadata requires an authenticated user context');
    const tripId = this.entityTrip(entityType, entityId);
    if (tripId === undefined || !this.db.canAccessTrip(tripId, ctx.actingUserId)) {
      throw new ForbiddenResource(`no access to ${entityType} ${entityId}`);
    }
    if (write && !this.guards.canEditAs(EDIT_ACTION[entityType], tripId, ctx.actingUserId)) {
      throw new ForbiddenResource(`no permission to edit ${entityType} ${entityId}`);
    }
    return { entityType, entityId };
  }

  private entityTrip(entityType: string, entityId: number): number | undefined {
    if (entityType === 'trip') {
      return (this.db.prepare('SELECT id FROM trips WHERE id = ?').get(entityId) as { id: number } | undefined)?.id;
    }
    // The table name comes from a fixed map, never from the request.
    const table = ENTITY_TABLE[entityType];
    return (this.db.prepare(`SELECT trip_id FROM ${table} WHERE id = ?`).get(entityId) as { trip_id: number } | undefined)?.trip_id;
  }
}
