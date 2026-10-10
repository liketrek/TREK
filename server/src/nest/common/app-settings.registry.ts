import { z } from 'zod';
import { readEnv } from '../../app-config';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';

/**
 * The instance-wide settings (`app_settings`) the server reads by name, in one
 * typed register.
 *
 * Every entry says what the stored text means (`schema`), what a reader takes
 * when the row is missing (`default`), which environment variable wins over it
 * (`env`), and how it is handled: part of the admin settings form (`adminForm`,
 * in the form's order), answered masked to that form (`masked`), stored
 * encrypted (`encrypted`), held by the operator on a managed install
 * (`managedLocked`), read for the public app config (`publicConfig`).
 *
 * The key lists that used to be typed out by hand (the admin form's keys, its
 * masked and encrypted ones, the public config's reads) are derived from here,
 * and code outside this module names a setting through {@link readAppSetting} or
 * {@link resolveAppSetting}, whose key is checked against the register: ESLint
 * refuses a literal `appSettings.getValue('...')` anywhere else.
 *
 * Stored values are text, as they have always been. A reader that needs a
 * boolean or a number still converts at its own site, the way it did before;
 * the register only fixes the name and documents the meaning.
 */

/** `'true'`/`'false'`; most readers take anything but `'false'` as on. */
const flag = z.enum(['true', 'false']);
const text = z.string();
/** A whole number written as text. */
const intText = z.string().regex(/^\d+$/);

type Env = ReturnType<typeof readEnv>;

export interface AppSettingDef {
  readonly schema: z.ZodType<string>;
  /** What the readers take for a missing row (documentation; each reader applies it itself). */
  readonly default: string | null;
  /** The environment value that wins over the stored one when it is non-empty. */
  readonly env?: (env: Env) => string | null | undefined;
  readonly adminForm?: true;
  readonly masked?: true;
  /** `always`: encrypted on every write. `if-plain`: encrypted unless it already is. Read back with `decrypt_api_key`. */
  readonly encrypted?: 'always' | 'if-plain';
  readonly managedLocked?: true;
  readonly publicConfig?: true;
}

// The admin form's keys come first, in the order the form has always answered them.
export const APP_SETTINGS = {
  allow_registration: { schema: flag, default: 'true', adminForm: true },
  allowed_file_types: { schema: text, default: null, adminForm: true },
  require_mfa: { schema: flag, default: 'false', adminForm: true, publicConfig: true },
  smtp_host: { schema: text, default: null, env: (e) => e.smtp.host, adminForm: true, managedLocked: true, publicConfig: true },
  smtp_port: { schema: intText, default: null, env: (e) => e.smtp.port, adminForm: true, managedLocked: true },
  smtp_user: { schema: text, default: null, env: (e) => e.smtp.user, adminForm: true, managedLocked: true },
  smtp_pass: { schema: text, default: null, env: (e) => e.smtp.pass, adminForm: true, masked: true, encrypted: 'always', managedLocked: true },
  smtp_from: { schema: text, default: null, env: (e) => e.smtp.from, adminForm: true, managedLocked: true },
  smtp_skip_tls_verify: { schema: flag, default: 'false', adminForm: true, managedLocked: true },
  notification_channels: { schema: text, default: null, adminForm: true, publicConfig: true },
  admin_webhook_url: { schema: text, default: null, adminForm: true, masked: true, encrypted: 'if-plain' },
  admin_ntfy_server: { schema: text, default: null, adminForm: true },
  admin_ntfy_topic: { schema: text, default: null, adminForm: true },
  admin_ntfy_token: { schema: text, default: null, adminForm: true, masked: true, encrypted: 'if-plain' },
  notify_trip_reminder: { schema: flag, default: 'true', adminForm: true, publicConfig: true },
  password_login: { schema: flag, default: 'true', adminForm: true },
  password_registration: { schema: flag, default: 'true', adminForm: true },
  oidc_login: { schema: flag, default: 'true', adminForm: true, managedLocked: true },
  oidc_registration: { schema: flag, default: 'true', adminForm: true, managedLocked: true },
  passkey_login: { schema: flag, default: 'false', adminForm: true },
  webauthn_rp_id: { schema: text, default: null, adminForm: true, managedLocked: true },
  webauthn_origins: { schema: text, default: null, adminForm: true, managedLocked: true },
  // 'auto' (what every install had before Amap existed), 'google', 'amap' or
  // 'openstreetmap'; the maps domain validates it (isPlacesProviderChoice).
  places_provider: { schema: text, default: 'auto', adminForm: true, publicConfig: true },

  // Read by name elsewhere.
  oidc_issuer: { schema: text, default: null, env: (e) => e.oidc.issuer, publicConfig: true },
  oidc_client_id: { schema: text, default: null, env: (e) => e.oidc.clientId, publicConfig: true },
  oidc_client_secret: { schema: text, default: null, env: (e) => e.oidc.clientSecret, encrypted: 'if-plain' },
  oidc_display_name: { schema: text, default: 'SSO', env: (e) => e.oidc.displayName, publicConfig: true },
  oidc_discovery_url: { schema: text, default: null, env: (e) => e.oidc.discoveryUrl },
  /** The legacy single switch, read only while none of the four login toggles has a row. */
  oidc_only: { schema: flag, default: 'false' },
  notification_channel: { schema: text, default: 'none', publicConfig: true },
  notify_todo_due: { schema: flag, default: 'true' },
  places_photos_enabled: { schema: flag, default: 'true', publicConfig: true },
  places_autocomplete_enabled: { schema: flag, default: 'true', publicConfig: true },
  places_details_enabled: { schema: flag, default: 'true', publicConfig: true },
  places_enrich_enabled: { schema: flag, default: 'true', publicConfig: true },
  place_shadow_enabled: { schema: flag, default: 'false', publicConfig: true },
  bag_tracking_enabled: { schema: flag, default: 'false' },
  route_usage_enabled: { schema: flag, default: 'false' },
  airtrail_sync_enabled: { schema: flag, default: 'true' },
  airtrail_poll_interval_minutes: { schema: intText, default: null },
  dawarich_poll_interval_minutes: { schema: intText, default: null },
  /** The release the admins were last notified about (the version-check job's memory). */
  last_notified_version: { schema: text, default: null },
} as const satisfies Record<string, AppSettingDef>;

export type AppSettingKey = keyof typeof APP_SETTINGS;

const ENTRIES = Object.entries(APP_SETTINGS) as Array<[AppSettingKey, AppSettingDef]>;
const keysWhere = (pick: (def: AppSettingDef) => unknown): AppSettingKey[] => ENTRIES.filter(([, def]) => pick(def)).map(([key]) => key);

/** The admin settings form's keys, in the order its answer has always listed them. */
export const ADMIN_FORM_SETTING_KEYS: readonly AppSettingKey[] = keysWhere((d) => d.adminForm);
/** The form's keys answered as `••••••••` rather than their value. */
export const MASKED_ADMIN_SETTING_KEYS: ReadonlySet<AppSettingKey> = new Set(keysWhere((d) => d.masked));
/** The keys stored encrypted. */
export const ENCRYPTED_APP_SETTING_KEYS: ReadonlySet<AppSettingKey> = new Set(keysWhere((d) => d.encrypted));
/** The registered keys a managed install withholds from its admin (the rest of that list is user settings and profile columns). */
export const MANAGED_LOCKED_APP_SETTING_KEYS: readonly AppSettingKey[] = keysWhere((d) => d.managedLocked);
/** The keys the public app config reads, in one query. */
export const PUBLIC_CONFIG_SETTING_KEYS: readonly AppSettingKey[] = keysWhere((d) => d.publicConfig);

type AppSettingsReader = Pick<AppSettingsRepository, 'getValue'>;

/** The stored text of a registered setting, or null when it has no row: exactly what `getValue` answers. */
export function readAppSetting(repo: AppSettingsReader, key: AppSettingKey): Promise<string | null> {
  return repo.getValue(key);
}

/**
 * The environment value when it is set and non-empty, else the stored text
 * (`env || stored`, the rule every env-over-settings reader has followed).
 * A setting without an environment variable reads as {@link readAppSetting}.
 */
export async function resolveAppSetting(repo: AppSettingsReader, key: AppSettingKey): Promise<string | null> {
  const def: AppSettingDef = APP_SETTINGS[key];
  return def.env?.(readEnv()) || (await repo.getValue(key));
}

/**
 * Whether sign-in through OIDC is set up: an issuer and a client id, each from
 * the environment or the setting, an empty value counting as unset. The client
 * secret is not asked for here: the login toggles, the public config and the
 * lockout guard never did. Building the provider config (OidcService) needs it
 * and checks it there.
 */
export async function isOidcConfigured(repo: AppSettingsReader): Promise<boolean> {
  return !!((await resolveAppSetting(repo, 'oidc_issuer')) && (await resolveAppSetting(repo, 'oidc_client_id')));
}

/** {@link isOidcConfigured} over values already read in one batch (`AppSettingsRepository.getValues`). */
export function isOidcConfiguredIn(values: ReadonlyMap<string, string>): boolean {
  const env = readEnv();
  return !!((env.oidc.issuer || values.get('oidc_issuer')) && (env.oidc.clientId || values.get('oidc_client_id')));
}
