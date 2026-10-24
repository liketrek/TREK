import type { PluginMetaMigrations } from '../entities/PluginMetaMigrations.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * Plan 3j Task 2 note: this repository's ONLY method today is the uninstall
 * cascade's own delete (PR44) — the rest of this table's surface (a plugin's own
 * `ctx.db.migrate` ledger) belongs to whichever later task converts `plugin-data
 * .service.ts`'s host-side counterpart, if any (R-out-of-scope carve-out: the
 * plugin's own sqlite file is untouched by this program).
 */
export class PluginMetaMigrationsRepository extends TrekRepository<PluginMetaMigrations> {
  /** PR44 (uninstall cascade, `deleteData` branch) — `DELETE FROM plugin_meta_migrations WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }
}
