import type Database from 'better-sqlite3';

/**
 * The five document providers and the fields their connection form asks for.
 *
 * Shared by the migration that introduces the tables and by `seeds.ts`, so a
 * fresh install and an upgraded one end up with the same rows. Both call sites
 * use INSERT OR IGNORE, which is what lets an operator rename or re-sort a row
 * without a later boot undoing it.
 *
 * `label` and `hint` are i18n key suffixes, never display text: the client
 * resolves them as `docsync.<label>`, the same way the photo provider form
 * resolves `memories.<label>`.
 *
 * Nextcloud and OpenCloud are separate rows although one WebDAV adapter serves
 * both: the fields differ (a Nextcloud login name and app password against a
 * folder, an OpenCloud username and app token against a space), and an operator
 * scanning the addon shelf should find the product they actually run.
 */

export interface ProviderRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface ProviderFieldRow {
  provider_id: string;
  field_key: string;
  label: string;
  input_type: 'text' | 'url' | 'password' | 'checkbox';
  placeholder: string | null;
  hint: string | null;
  required: 0 | 1;
  secret: 0 | 1;
  sort_order: number;
}

export const DOCUMENT_PROVIDERS: ProviderRow[] = [
  {
    id: 'paperless',
    name: 'Paperless-ngx',
    description: 'Two-way document sync with a Paperless-ngx instance, scoped by tag',
    icon: 'FileText',
    sort_order: 0,
  },
  {
    id: 'papra',
    name: 'Papra',
    description: 'Two-way document sync with a Papra organisation, scoped by tag',
    icon: 'FileText',
    sort_order: 1,
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Two-way document sync with a Nextcloud folder over WebDAV',
    icon: 'Cloud',
    sort_order: 2,
  },
  {
    id: 'opencloud',
    name: 'OpenCloud',
    description: 'Two-way document sync with an OpenCloud space over WebDAV',
    icon: 'Cloud',
    sort_order: 3,
  },
  {
    id: 'synologydrive',
    name: 'Synology Drive',
    description: 'Two-way document sync with a folder on a Synology NAS',
    icon: 'HardDrive',
    sort_order: 4,
  },
];

/**
 * `allow_insecure_tls` defaults to 0 on every provider, unlike the Synology
 * photo provider, where skipping verification is the stored default. A LAN
 * instance with a self-signed certificate is common enough to need the switch
 * and not common enough to justify shipping it on.
 */
export const DOCUMENT_PROVIDER_FIELDS: ProviderFieldRow[] = [
  // Paperless-ngx: token auth, tag scope.
  {
    provider_id: 'paperless',
    field_key: 'base_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://paperless.example.com',
    hint: null,
    required: 1,
    secret: 0,
    sort_order: 0,
  },
  {
    provider_id: 'paperless',
    field_key: 'api_token',
    label: 'providerApiToken',
    input_type: 'password',
    placeholder: 'API token',
    hint: 'hintPaperlessToken',
    required: 1,
    secret: 1,
    sort_order: 1,
  },
  {
    provider_id: 'paperless',
    field_key: 'allow_insecure_tls',
    label: 'allowInsecureTls',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    sort_order: 2,
  },

  // Papra: bearer key, and an organisation the key must already belong to.
  {
    provider_id: 'papra',
    field_key: 'base_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://papra.example.com',
    hint: null,
    required: 1,
    secret: 0,
    sort_order: 0,
  },
  {
    provider_id: 'papra',
    field_key: 'api_key',
    label: 'providerApiKey',
    input_type: 'password',
    placeholder: 'ppapi_…',
    hint: 'hintPapraKey',
    required: 1,
    secret: 1,
    sort_order: 1,
  },
  {
    provider_id: 'papra',
    field_key: 'organization_id',
    label: 'providerOrganization',
    input_type: 'text',
    placeholder: 'org_…',
    hint: 'hintPapraOrg',
    required: 1,
    secret: 0,
    sort_order: 2,
  },
  {
    provider_id: 'papra',
    field_key: 'allow_insecure_tls',
    label: 'allowInsecureTls',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    sort_order: 3,
  },

  // Nextcloud: an app password, never the account password. The latter breaks
  // the moment the account turns on 2FA or logs in through OIDC.
  {
    provider_id: 'nextcloud',
    field_key: 'base_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://cloud.example.com',
    hint: null,
    required: 1,
    secret: 0,
    sort_order: 0,
  },
  {
    provider_id: 'nextcloud',
    field_key: 'login_name',
    label: 'providerUsername',
    input_type: 'text',
    placeholder: 'username',
    hint: 'hintNextcloudLogin',
    required: 1,
    secret: 0,
    sort_order: 1,
  },
  {
    provider_id: 'nextcloud',
    field_key: 'app_password',
    label: 'providerAppPassword',
    input_type: 'password',
    placeholder: 'app password',
    hint: 'hintNextcloudAppPassword',
    required: 1,
    secret: 1,
    sort_order: 2,
  },
  {
    provider_id: 'nextcloud',
    field_key: 'base_path',
    label: 'providerBasePath',
    input_type: 'text',
    placeholder: '/TREK',
    hint: 'hintBasePath',
    required: 0,
    secret: 0,
    sort_order: 3,
  },
  {
    provider_id: 'nextcloud',
    field_key: 'allow_insecure_tls',
    label: 'allowInsecureTls',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    sort_order: 4,
  },

  // OpenCloud: auth-app token, spaces instead of folders.
  {
    provider_id: 'opencloud',
    field_key: 'base_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://opencloud.example.com',
    hint: null,
    required: 1,
    secret: 0,
    sort_order: 0,
  },
  {
    provider_id: 'opencloud',
    field_key: 'username',
    label: 'providerUsername',
    input_type: 'text',
    placeholder: 'username',
    hint: null,
    required: 1,
    secret: 0,
    sort_order: 1,
  },
  {
    provider_id: 'opencloud',
    field_key: 'app_token',
    label: 'providerAppToken',
    input_type: 'password',
    placeholder: 'app token',
    hint: 'hintOpenCloudToken',
    required: 1,
    secret: 1,
    sort_order: 2,
  },
  {
    provider_id: 'opencloud',
    field_key: 'allow_insecure_tls',
    label: 'allowInsecureTls',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    sort_order: 3,
  },

  // Synology: DSM has no app tokens at all, so this is a real account. The OTP
  // is used once to obtain a device token, which is what gets stored.
  {
    provider_id: 'synologydrive',
    field_key: 'base_url',
    label: 'providerUrl',
    input_type: 'url',
    placeholder: 'https://nas.example.com:5001',
    hint: 'hintSynologyUrl',
    required: 1,
    secret: 0,
    sort_order: 0,
  },
  {
    provider_id: 'synologydrive',
    field_key: 'username',
    label: 'providerUsername',
    input_type: 'text',
    placeholder: 'username',
    hint: 'hintSynologyUser',
    required: 1,
    secret: 0,
    sort_order: 1,
  },
  {
    provider_id: 'synologydrive',
    field_key: 'password',
    label: 'providerPassword',
    input_type: 'password',
    placeholder: 'password',
    hint: null,
    required: 1,
    secret: 1,
    sort_order: 2,
  },
  {
    provider_id: 'synologydrive',
    field_key: 'otp_code',
    label: 'providerOTP',
    input_type: 'text',
    placeholder: '123456',
    hint: 'hintSynologyOtp',
    required: 0,
    secret: 1,
    sort_order: 3,
  },
  {
    provider_id: 'synologydrive',
    field_key: 'base_path',
    label: 'providerBasePath',
    input_type: 'text',
    placeholder: '/trek',
    hint: 'hintBasePath',
    required: 0,
    secret: 0,
    sort_order: 4,
  },
  {
    provider_id: 'synologydrive',
    field_key: 'allow_insecure_tls',
    label: 'allowInsecureTls',
    input_type: 'checkbox',
    placeholder: null,
    hint: null,
    required: 0,
    secret: 0,
    sort_order: 5,
  },
];

export function seedDocumentProviders(db: Database.Database): void {
  const insertProvider = db.prepare(
    'INSERT OR IGNORE INTO document_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
  );
  for (const p of DOCUMENT_PROVIDERS) insertProvider.run(p.id, p.name, p.description, p.icon, p.sort_order);

  const insertField = db.prepare(
    `INSERT OR IGNORE INTO document_provider_fields
       (provider_id, field_key, label, input_type, placeholder, hint, required, secret, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const f of DOCUMENT_PROVIDER_FIELDS) {
    insertField.run(
      f.provider_id,
      f.field_key,
      f.label,
      f.input_type,
      f.placeholder,
      f.hint,
      f.required,
      f.secret,
      f.sort_order,
    );
  }
}

export const DOCUMENT_PROVIDER_SEED_IDS = DOCUMENT_PROVIDERS.map((p) => p.id);
