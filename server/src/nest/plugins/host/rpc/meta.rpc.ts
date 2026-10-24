import { DayAccommodations } from '../../../../db/entities/DayAccommodations.entity';
import { Days } from '../../../../db/entities/Days.entity';
import { Places } from '../../../../db/entities/Places.entity';
import { PluginEntityMetadata } from '../../../../db/entities/PluginEntityMetadata.entity';
import { Reservations } from '../../../../db/entities/Reservations.entity';
import { Trips } from '../../../../db/entities/Trips.entity';
import type { DayAccommodationsRepository } from '../../../../db/repositories/DayAccommodations.repository';
import type { DaysRepository } from '../../../../db/repositories/Days.repository';
import type { PlacesRepository } from '../../../../db/repositories/Places.repository';
import type { PluginEntityMetadataRepository } from '../../../../db/repositories/PluginEntityMetadata.repository';
import type { ReservationsRepository } from '../../../../db/repositories/Reservations.repository';
import type { TripsRepository } from '../../../../db/repositories/Trips.repository';
import { PluginGuards } from '../../../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../../../nest-rpc/rpc-errors';
import { PluginController, PluginMethod } from '../../../../nest-rpc/rpc-kit/decorators';
import type { PluginRpcContext } from '../../../../nest-rpc/rpc-kit/types';
import { num, str } from '../../../../nest-rpc/rpc-params';
import { InjectRepository } from '@mikro-orm/nestjs';

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
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this reuses the `trips: TripsRepository` param below (findAccessible).
    private readonly guards: PluginGuards,
    @InjectRepository(PluginEntityMetadata) private readonly meta: PluginEntityMetadataRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(Places) private readonly places: PlacesRepository,
    @InjectRepository(Days) private readonly days: DaysRepository,
    @InjectRepository(Reservations) private readonly reservations: ReservationsRepository,
    @InjectRepository(DayAccommodations) private readonly dayAccommodations: DayAccommodationsRepository,
  ) {}

  @PluginMethod('meta.get', { permission: 'db:meta' })
  async get(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const { entityType, entityId } = await this.resolveEntity(params, ctx, false);
    const value = await this.meta.findValue(ctx.pluginId, entityType, entityId, str(params.key, 'key')); // MR1 — Plan 3j
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  @PluginMethod('meta.set', { permission: 'db:meta' })
  async set(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const { entityType, entityId } = await this.resolveEntity(params, ctx, true);
    const key = str(params.key, 'key');
    if (key.length > META_KEY_MAX) throw new BadParams(`metadata key too long (>${META_KEY_MAX} chars)`);
    const json = JSON.stringify(params.value ?? null);
    if (json.length > META_VALUE_MAX) throw new BadParams(`metadata value too large (>${META_VALUE_MAX} bytes)`);
    // MR2/MR3/MR4 — Plan 3j Task 7 fix (must-land 2): one atomic call, not
    // three separately-awaited ones (task-7-review.md's concurrent-cap-bypass).
    const written = await this.meta.upsertValueCapped(ctx.pluginId, entityType, entityId, key, json, META_KEYS_MAX);
    if (!written) throw new BadParams(`too many metadata keys on this ${entityType} (max ${META_KEYS_MAX})`);
    return { key, value: params.value ?? null };
  }

  @PluginMethod('meta.list', { permission: 'db:meta' })
  async list(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const { entityType, entityId } = await this.resolveEntity(params, ctx, false);
    const rows = await this.meta.listForEntity(ctx.pluginId, entityType, entityId); // MR5 — Plan 3j
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
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const { entityType, entityId } = await this.resolveEntity(params, ctx, true);
    const deleted = await this.meta.deleteValue(ctx.pluginId, entityType, entityId, str(params.key, 'key')); // MR6 — Plan 3j
    return { deleted };
  }

  /**
   * Validates the target and gates it: a supported entity type, an entity that
   * resolves to a trip the acting user can access, and for a write that entity's own
   * edit permission.
   */
  private async resolveEntity(
    params: Record<string, unknown>,
    ctx: PluginRpcContext,
    write: boolean,
  ): Promise<{ entityType: string; entityId: number }> {
    const entityType = str(params.entityType, 'entityType');
    if (!META_ENTITY_TYPES.has(entityType)) {
      throw new BadParams(`invalid entityType "${entityType}" (${[...META_ENTITY_TYPES].join('|')})`);
    }
    const entityId = num(params.entityId, 'entityId');
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('metadata requires an authenticated user context');
    const tripId = await this.entityTrip(entityType, entityId);
    if (tripId === undefined || !(await this.trips.findAccessible(tripId, ctx.actingUserId))) {
      throw new ForbiddenResource(`no access to ${entityType} ${entityId}`);
    }
    if (write && !(await this.guards.canEditAs(EDIT_ACTION[entityType], tripId, ctx.actingUserId))) {
      throw new ForbiddenResource(`no permission to edit ${entityType} ${entityId}`);
    }
    return { entityType, entityId };
  }

  /**
   * MR8/MR9 (Plan 3j Task 5) — R12's "one method per target table, no
   * dynamic identifier dispatch" precedent (`PlacesRepository.findTripId`/
   * `ReservationsRepository.findTripId`'s own docstrings): the legacy
   * `` SELECT trip_id FROM ${table} WHERE id = ? `` string-interpolated a
   * table name off a fixed 4-entry map (never request-controlled) — this
   * dispatches over the SAME closed `entityType` union onto one typed read
   * per table instead, so no identifier is ever interpolated into SQL here.
   */
  private async entityTrip(entityType: string, entityId: number): Promise<number | undefined> {
    switch (entityType) {
      case 'trip':
        return (await this.trips.existsById(entityId)) ? entityId : undefined; // MR8 — Plan 3j
      case 'place':
        return await this.places.findTripId(entityId); // MR9 — Plan 3j
      case 'day':
        return await this.days.findTripId(entityId); // MR9 — Plan 3j
      case 'reservation':
        return await this.reservations.findTripId(entityId); // MR9 — Plan 3j
      case 'accommodation':
        return await this.dayAccommodations.getTripId(entityId); // MR9 — Plan 3j
      default:
        return undefined;
    }
  }
}
