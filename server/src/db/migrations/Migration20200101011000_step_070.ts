import { execUnlessTableMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

const PROVIDER_FIELDS: [string, string, string, string, string, number, number, string | null, string, number][] = [
  [
    'synologyphotos',
    'synology_url',
    'providerUrl',
    'url',
    'https://synology.example.com',
    1,
    0,
    'synology_url',
    'synology_url',
    0,
  ],
  [
    'synologyphotos',
    'synology_username',
    'providerUsername',
    'text',
    'Username',
    1,
    0,
    'synology_username',
    'synology_username',
    1,
  ],
  [
    'synologyphotos',
    'synology_password',
    'providerPassword',
    'password',
    'Password',
    1,
    1,
    null,
    'synology_password',
    2,
  ],
];

/**
 * Legacy migration step 70 (`db/migrations.ts`).
 *
 * Seed the Synology Photos provider and its fields in existing databases. Both
 * statements are skipped when the provider tables do not exist yet — on those
 * installs the seeder creates the rows instead.
 */
export class Migration20200101011000_step_070 extends Migration {
  override name = 'Migration20200101011000_step_070';

  override async up(): Promise<void> {
    await execUnlessTableMissing(
      this,
      `
      INSERT INTO photo_providers (id, name, description, icon, enabled, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        icon = excluded.icon,
        enabled = excluded.enabled,
        sort_order = excluded.sort_order
    `,
      [
        'synologyphotos',
        'Synology Photos',
        'Synology Photos integration with separate account settings',
        'Image',
        0,
        1,
      ],
    );

    for (const field of PROVIDER_FIELDS) {
      await execUnlessTableMissing(
        this,
        `
        INSERT INTO photo_provider_fields
        (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider_id, field_key) DO UPDATE SET
          label = excluded.label,
          input_type = excluded.input_type,
          placeholder = excluded.placeholder,
          required = excluded.required,
          secret = excluded.secret,
          settings_key = excluded.settings_key,
          payload_key = excluded.payload_key,
          sort_order = excluded.sort_order
      `,
        field,
      );
    }
  }
}
