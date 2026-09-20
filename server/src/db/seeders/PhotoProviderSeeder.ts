import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

interface PhotoProviderRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: 0 | 1;
  sort_order: number;
}

interface PhotoProviderFieldRow {
  provider_id: string;
  field_key: string;
  label: string;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  required: 0 | 1;
  secret: 0 | 1;
  settings_key: string | null;
  payload_key: string;
  sort_order: number;
}

const PROVIDERS: PhotoProviderRow[] = [
  { id: 'immich', name: 'Immich', description: 'Immich photo provider', icon: 'Image', enabled: 0, sort_order: 0 },
  {
    id: 'synologyphotos',
    name: 'Synology Photos',
    description: 'Synology Photos integration with separate account settings',
    icon: 'Image',
    enabled: 0,
    sort_order: 1,
  },
];

/** `label` and `hint` are i18n key suffixes the client resolves as `memories.<label>`, never display text. */
const FIELDS: PhotoProviderFieldRow[] = [
  {
    provider_id: 'immich',
    field_key: 'immich_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://immich.example.com',
    hint: null,
    required: 1,
    secret: 0,
    settings_key: 'immich_url',
    payload_key: 'immich_url',
    sort_order: 0,
  },
  {
    provider_id: 'immich',
    field_key: 'immich_api_key',
    label: 'providerApiKey',
    input_type: 'password',
    placeholder: 'API Key',
    hint: null,
    required: 1,
    secret: 1,
    settings_key: null,
    payload_key: 'immich_api_key',
    sort_order: 1,
  },
  {
    provider_id: 'synologyphotos',
    field_key: 'synology_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://synology.example.com/photo',
    hint: 'providerUrlHintSynology',
    required: 1,
    secret: 0,
    settings_key: 'synology_url',
    payload_key: 'synology_url',
    sort_order: 0,
  },
  {
    provider_id: 'synologyphotos',
    field_key: 'synology_username',
    label: 'providerUsername',
    input_type: 'text',
    placeholder: 'Username',
    hint: null,
    required: 1,
    secret: 0,
    settings_key: 'synology_username',
    payload_key: 'synology_username',
    sort_order: 1,
  },
  {
    provider_id: 'synologyphotos',
    field_key: 'synology_password',
    label: 'providerPassword',
    input_type: 'password',
    placeholder: 'Password',
    hint: null,
    required: 1,
    secret: 1,
    settings_key: null,
    payload_key: 'synology_password',
    sort_order: 2,
  },
  {
    provider_id: 'synologyphotos',
    field_key: 'synology_otp',
    label: 'providerOTP',
    input_type: 'text',
    placeholder: '123456',
    hint: null,
    required: 0,
    secret: 0,
    settings_key: null,
    payload_key: 'synology_otp',
    sort_order: 3,
  },
  {
    provider_id: 'synologyphotos',
    field_key: 'synology_skip_ssl',
    label: 'skipSSLVerification',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    settings_key: 'synology_skip_ssl',
    payload_key: 'synology_skip_ssl',
    sort_order: 4,
  },
];

/** Seeds the photo providers and the fields their connection form asks for. */
export class PhotoProviderSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();

    for (const p of PROVIDERS) {
      await connection.execute(
        'INSERT OR IGNORE INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.description, p.icon, p.enabled, p.sort_order],
      );
    }

    for (const f of FIELDS) {
      await connection.execute(
        `INSERT OR IGNORE INTO photo_provider_fields
           (provider_id, field_key, label, input_type, placeholder, hint, required, secret, settings_key, payload_key, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          f.provider_id,
          f.field_key,
          f.label,
          f.input_type,
          f.placeholder,
          f.hint,
          f.required,
          f.secret,
          f.settings_key,
          f.payload_key,
          f.sort_order,
        ],
      );
    }
  }
}
