import type { DB } from '../kysely/db';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import type { SqlEntityManager } from '@mikro-orm/sql';

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
    provider_id: 'immich',
    field_key: 'immich_allow_insecure_tls',
    label: 'skipSSLVerification',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    settings_key: 'allow_insecure_tls',
    payload_key: 'allow_insecure_tls',
    sort_order: 2,
  },
  {
    provider_id: 'immich',
    field_key: 'immich_auto_upload',
    label: 'immichAutoUpload',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    settings_key: 'auto_upload',
    payload_key: 'auto_upload',
    sort_order: 5,
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

/** Seeds the photo providers and the fields their connection form asks for, leaving a row that is already there alone. */
export class PhotoProviderSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const db = (em as SqlEntityManager).getKysely<Pick<DB, 'photo_providers' | 'photo_provider_fields'>>();

    for (const p of PROVIDERS) {
      await db
        .insertInto('photo_providers')
        .values({
          id: p.id,
          name: p.name,
          description: p.description,
          icon: p.icon,
          enabled: p.enabled,
          sort_order: p.sort_order,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    for (const f of FIELDS) {
      await db
        .insertInto('photo_provider_fields')
        .values({
          provider_id: f.provider_id,
          field_key: f.field_key,
          label: f.label,
          input_type: f.input_type,
          placeholder: f.placeholder,
          hint: f.hint,
          required: f.required,
          secret: f.secret,
          settings_key: f.settings_key,
          payload_key: f.payload_key,
          sort_order: f.sort_order,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
}
