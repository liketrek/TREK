import type { TripAddonOverrides } from '../entities/TripAddonOverrides.entity';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';
import { TrekRepository } from './_shared/trek-repository';

/** One trip's explicit choice for one addon: on or off, whatever the instance says. */
interface TripAddonOverrideRow {
  addon_id: string;
  enabled: boolean;
}

type OverridesKyselyDB = Pick<DB, 'trip_addon_overrides'>;
type OverridesAccessKyselyDB = Pick<DB, 'trip_addon_overrides' | 'trips' | 'trip_members'>;

/**
 * `trip_addon_overrides`: a sparse, trip-scoped override of the instance's addon
 * switch. No row means the trip follows `addons.enabled`; a row is the owner's
 * explicit on (1) or off (0). Resetting to the instance setting deletes the row,
 * so a trip never holds a row that merely repeats the default it inherits.
 */
export class TripAddonOverridesRepository extends TrekRepository<TripAddonOverrides> {
  /** Every override the trip holds, in addon id order. */
  async listForTrip(trip_id: number): Promise<TripAddonOverrideRow[]> {
    const rows = await this.kysely<OverridesKyselyDB>()
      .selectFrom('trip_addon_overrides')
      .select(['addon_id', 'enabled'])
      .where('trip_id', '=', trip_id)
      .orderBy('addon_id')
      .execute();
    return rows.map((row) => ({ addon_id: row.addon_id, enabled: row.enabled === 1 }));
  }

  /** The trip's override for one addon: true or false, or null when it follows the instance. */
  async findForTrip(trip_id: number, addon_id: string): Promise<boolean | null> {
    const row = await this.kysely<OverridesKyselyDB>()
      .selectFrom('trip_addon_overrides')
      .select('enabled')
      .where('trip_id', '=', trip_id)
      .where('addon_id', '=', addon_id)
      .executeTakeFirst();
    return row ? row.enabled === 1 : null;
  }

  /** The choices these trips made for one addon; a trip that follows the instance has no row. */
  async listForTrips(
    trip_ids: readonly number[],
    addon_id: string,
  ): Promise<Array<{ trip_id: number; enabled: boolean }>> {
    if (trip_ids.length === 0) return [];
    const rows = await this.kysely<OverridesKyselyDB>()
      .selectFrom('trip_addon_overrides')
      .select(['trip_id', 'enabled'])
      .where('addon_id', '=', addon_id)
      .where('trip_id', 'in', [...trip_ids])
      .execute();
    return rows.map((row) => ({ trip_id: row.trip_id, enabled: row.enabled === 1 }));
  }

  /** Sets the trip's choice for one addon, replacing an earlier one, and stamps when. */
  async upsertOverride(trip_id: number, addon_id: string, enabled: boolean): Promise<void> {
    const value = enabled ? 1 : 0;
    const at = dbNow();
    await this.kysely<OverridesKyselyDB>()
      .insertInto('trip_addon_overrides')
      .values({ trip_id, addon_id, enabled: value, updated_at: at })
      .onConflict((oc) => oc.columns(['trip_id', 'addon_id']).doUpdateSet({ enabled: value, updated_at: at }))
      .execute();
  }

  /** Drops the trip's choice for one addon, so the instance setting applies again. */
  async deleteOverride(trip_id: number, addon_id: string): Promise<void> {
    await this.kysely<OverridesKyselyDB>()
      .deleteFrom('trip_addon_overrides')
      .where('trip_id', '=', trip_id)
      .where('addon_id', '=', addon_id)
      .execute();
  }

  /**
   * Gives a copied trip the choices of the trip it was copied from, in one
   * statement. The new trip holds no rows yet, so the conflict target only
   * keeps a repeated copy from failing.
   */
  async copyForTrip(from_trip_id: number, to_trip_id: number): Promise<void> {
    await this.kysely<OverridesKyselyDB>()
      .insertInto('trip_addon_overrides')
      .columns(['trip_id', 'addon_id', 'enabled', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('trip_addon_overrides as o')
          .select([eb.val(to_trip_id).as('trip_id'), 'o.addon_id', 'o.enabled', eb.val(dbNow()).as('updated_at')])
          .where('o.trip_id', '=', from_trip_id),
      )
      .onConflict((oc) => oc.columns(['trip_id', 'addon_id']).doNothing())
      .execute();
  }

  /**
   * Whether any trip the user owns or is a member of switched the addon on for
   * itself. Routes without a trip (a library, a search across trips) open on
   * that when the instance switch is off.
   */
  async anyEnabledForUser(user_id: number, addon_id: string): Promise<boolean> {
    const row = await this.kysely<OverridesAccessKyselyDB>()
      .selectFrom('trip_addon_overrides as o')
      .innerJoin('trips as t', 't.id', 'o.trip_id')
      .leftJoin('trip_members as m', (join) => join.onRef('m.trip_id', '=', 't.id').on('m.user_id', '=', user_id))
      .select('o.trip_id')
      .where('o.addon_id', '=', addon_id)
      .where('o.enabled', '=', 1)
      .where((eb) => eb.or([eb('t.user_id', '=', user_id), eb('m.user_id', 'is not', null)]))
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  }
}
