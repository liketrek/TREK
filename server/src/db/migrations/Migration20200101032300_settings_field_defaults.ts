import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 203 (`db/migrations.ts`).
 *
 * Settings-field defaults (#plugins, PR-87 feedback). A manifest `default` is the
 * field's effective value when nothing is stored — the settings form pre-fills it and
 * the runtime resolves it (settings-defaults.ts); it was previously accepted by the
 * manifest and silently dropped here. JSON-encoded so string/number/boolean round-trip.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032300_settings_field_defaults extends Migration {
  override name = 'Migration20200101032300_settings_field_defaults';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugin_settings_fields', 'default_value', `default_value TEXT`);
  }
}
