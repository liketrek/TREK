import { engineDdl } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A trip can switch a trip addon (lists, costs, files, collab, road trip,
 * tours) on or off for itself, whatever the instance says.
 *
 * No row means the trip follows the instance switch in `addons.enabled`. A row
 * is the owner's explicit choice in either direction: `enabled` 1 turns the
 * addon on for this trip although the admin switched it off, 0 hides it here
 * although it is on everywhere else. Going back to the instance setting
 * deletes the row. Nothing of the addon's data is touched either way.
 *
 * The rows go with their trip, and with their addon should an addon row ever
 * be removed. The primary key leads with `trip_id`, which covers the trip's
 * foreign key; `addon_id` gets an index of its own for the addon's.
 */
export class Migration20200101046490_a_trip_can_switch_its_own_addons extends Migration {
  override name = 'Migration20200101046490_a_trip_can_switch_its_own_addons';

  override up(): void {
    engineDdl(this, {
      sqlite: [
        `CREATE TABLE trip_addon_overrides (
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          addon_id TEXT NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
          enabled INTEGER NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (trip_id, addon_id)
        )`,
        'CREATE INDEX idx_trip_addon_overrides_addon_id ON trip_addon_overrides(addon_id)',
      ],
      postgres: [
        'create table "trip_addon_overrides" ("trip_id" bigint not null, "addon_id" text not null, "enabled" bigint not null, "updated_at" text null default to_char((CURRENT_TIMESTAMP AT TIME ZONE \'UTC\'), \'YYYY-MM-DD HH24:MI:SS\'), primary key ("trip_id", "addon_id"))',
        'create index "idx_trip_addon_overrides_addon_id" on "trip_addon_overrides" ("addon_id")',
        'alter table "trip_addon_overrides" add constraint "trip_addon_overrides_trip_id_addon_id_unique" unique ("trip_id", "addon_id")',
        'alter table "trip_addon_overrides" add constraint "trip_addon_overrides_trip_id_foreign" foreign key ("trip_id") references "trips" ("id") on update cascade on delete cascade',
        'alter table "trip_addon_overrides" add constraint "trip_addon_overrides_addon_id_foreign" foreign key ("addon_id") references "addons" ("id") on update cascade on delete cascade',
      ],
    });
  }
}
