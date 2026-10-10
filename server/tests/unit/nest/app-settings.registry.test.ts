import {
  ADMIN_FORM_SETTING_KEYS,
  APP_SETTINGS,
  ENCRYPTED_APP_SETTING_KEYS,
  MANAGED_LOCKED_APP_SETTING_KEYS,
  MASKED_ADMIN_SETTING_KEYS,
  PUBLIC_CONFIG_SETTING_KEYS,
  isOidcConfigured,
  isOidcConfiguredIn,
  readAppSetting,
  resolveAppSetting,
  type AppSettingDef,
} from '../../../src/nest/common/app-settings.registry';
import { MANAGED_LOCKED_SETTING_KEYS } from '../../../src/nest/common/managed';

import { afterEach, describe, expect, it, vi } from 'vitest';

/** A stand-in for AppSettingsRepository.getValue over a fixed set of rows. */
function repoOf(rows: Record<string, string>) {
  const getValue = vi.fn(async (key: string) => (key in rows ? rows[key] : null));
  return { getValue };
}

afterEach(() => vi.unstubAllEnvs());

describe('the derived key lists', () => {
  it('APPSET-001: the admin form answers the keys it always has, in the same order', () => {
    expect([...ADMIN_FORM_SETTING_KEYS]).toEqual([
      'allow_registration',
      'allowed_file_types',
      'require_mfa',
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_pass',
      'smtp_from',
      'smtp_skip_tls_verify',
      'notification_channels',
      'admin_webhook_url',
      'admin_ntfy_server',
      'admin_ntfy_topic',
      'admin_ntfy_token',
      'notify_trip_reminder',
      'password_login',
      'password_registration',
      'oidc_login',
      'oidc_registration',
      'passkey_login',
      'webauthn_rp_id',
      'webauthn_origins',
      'places_provider',
    ]);
  });

  it('APPSET-002: the masked and the encrypted keys', () => {
    expect([...MASKED_ADMIN_SETTING_KEYS].sort()).toEqual(['admin_ntfy_token', 'admin_webhook_url', 'smtp_pass']);
    expect([...ENCRYPTED_APP_SETTING_KEYS].sort()).toEqual([
      'admin_ntfy_token',
      'admin_webhook_url',
      'oidc_client_secret',
      'smtp_pass',
    ]);
    expect((APP_SETTINGS.smtp_pass as AppSettingDef).encrypted).toBe('always');
    expect((APP_SETTINGS.admin_webhook_url as AppSettingDef).encrypted).toBe('if-plain');
  });

  it('APPSET-003: the public config reads the keys it always read', () => {
    expect([...PUBLIC_CONFIG_SETTING_KEYS].sort()).toEqual(
      [
        'places_provider',
        'oidc_display_name',
        'oidc_issuer',
        'oidc_client_id',
        'require_mfa',
        'notification_channel',
        'notify_trip_reminder',
        'smtp_host',
        'notification_channels',
        'places_photos_enabled',
        'places_autocomplete_enabled',
        'places_details_enabled',
        'places_enrich_enabled',
        'place_shadow_enabled',
      ].sort(),
    );
  });

  it('APPSET-004: a registered key is managed-locked exactly when the managed list names it', () => {
    const locked = new Set<string>(MANAGED_LOCKED_SETTING_KEYS);
    const registered = Object.keys(APP_SETTINGS);
    expect([...MANAGED_LOCKED_APP_SETTING_KEYS].sort()).toEqual(registered.filter((k) => locked.has(k)).sort());
  });

  it('APPSET-005: every documented default is a value its schema accepts', () => {
    for (const [key, def] of Object.entries(APP_SETTINGS) as Array<[string, AppSettingDef]>) {
      if (def.default !== null) expect(def.schema.safeParse(def.default).success, key).toBe(true);
    }
  });
});

describe('reading', () => {
  it('APPSET-010: readAppSetting answers what getValue answers', async () => {
    const repo = repoOf({ require_mfa: 'true' });
    expect(await readAppSetting(repo, 'require_mfa')).toBe('true');
    expect(await readAppSetting(repo, 'smtp_host')).toBeNull();
    expect(repo.getValue).toHaveBeenCalledWith('smtp_host');
  });

  it('APPSET-011: resolveAppSetting takes a non-empty environment value over the stored one', async () => {
    const repo = repoOf({ smtp_host: 'stored.example' });
    vi.stubEnv('SMTP_HOST', 'env.example');
    expect(await resolveAppSetting(repo, 'smtp_host')).toBe('env.example');
    vi.stubEnv('SMTP_HOST', '');
    expect(await resolveAppSetting(repo, 'smtp_host')).toBe('stored.example');
    // A key without an environment variable reads the row.
    expect(await resolveAppSetting(repoOf({ require_mfa: 'true' }), 'require_mfa')).toBe('true');
  });

  it('APPSET-012: every env-backed key reads its own variable, the secrets included', async () => {
    // The two secrets are read past the register by their callers (they are stored
    // encrypted), so this is the one place their mapping is pinned.
    const variables: Record<string, [string, string]> = {
      smtp_host: ['SMTP_HOST', 'smtp.env.example'],
      smtp_port: ['SMTP_PORT', '2525'],
      smtp_user: ['SMTP_USER', 'mailer'],
      smtp_pass: ['SMTP_PASS', 'env-secret'],
      smtp_from: ['SMTP_FROM', 'trek@env.example'],
      oidc_issuer: ['OIDC_ISSUER', 'https://idp.env.example'],
      oidc_client_id: ['OIDC_CLIENT_ID', 'trek-env'],
      oidc_client_secret: ['OIDC_CLIENT_SECRET', 'oidc-env-secret'],
      oidc_display_name: ['OIDC_DISPLAY_NAME', 'Company SSO'],
      oidc_discovery_url: ['OIDC_DISCOVERY_URL', 'https://idp.env.example/.well-known/openid-configuration'],
    };
    const withEnv = (Object.entries(APP_SETTINGS) as Array<[string, AppSettingDef]>)
      .filter(([, def]) => def.env)
      .map(([key]) => key);
    expect(withEnv.sort()).toEqual(Object.keys(variables).sort());

    const keys = Object.keys(variables) as Array<keyof typeof APP_SETTINGS>;
    const stored = Object.fromEntries(keys.map((key) => [key, `stored-${key}`]));
    const resolveAll = () => Promise.all(keys.map((key) => resolveAppSetting(repoOf(stored), key)));

    for (const [name] of Object.values(variables)) vi.stubEnv(name, '');
    expect(await resolveAll()).toEqual(keys.map((key) => `stored-${key}`));
    for (const [name, value] of Object.values(variables)) vi.stubEnv(name, value);
    expect(await resolveAll()).toEqual(keys.map((key) => variables[key][1]));
  });
});

describe('isOidcConfigured', () => {
  it('APPSET-020: wants an issuer and a client id, from either side, and nothing else', async () => {
    vi.stubEnv('OIDC_ISSUER', '');
    vi.stubEnv('OIDC_CLIENT_ID', '');
    expect(await isOidcConfigured(repoOf({}))).toBe(false);
    expect(await isOidcConfigured(repoOf({ oidc_issuer: 'https://idp' }))).toBe(false);
    expect(await isOidcConfigured(repoOf({ oidc_issuer: 'https://idp', oidc_client_id: 'trek' }))).toBe(true);
    expect(await isOidcConfigured(repoOf({ oidc_issuer: '', oidc_client_id: 'trek' }))).toBe(false);
    vi.stubEnv('OIDC_ISSUER', 'https://idp');
    expect(await isOidcConfigured(repoOf({ oidc_client_id: 'trek' }))).toBe(true);
  });

  it('APPSET-021: does not read the client id when there is no issuer', async () => {
    vi.stubEnv('OIDC_ISSUER', '');
    const repo = repoOf({});
    await isOidcConfigured(repo);
    expect(repo.getValue).not.toHaveBeenCalledWith('oidc_client_id');
  });

  it('APPSET-022: the batch form answers the same over values already read', () => {
    vi.stubEnv('OIDC_ISSUER', '');
    vi.stubEnv('OIDC_CLIENT_ID', '');
    expect(isOidcConfiguredIn(new Map())).toBe(false);
    expect(
      isOidcConfiguredIn(
        new Map([
          ['oidc_issuer', 'https://idp'],
          ['oidc_client_id', 'trek'],
        ]),
      ),
    ).toBe(true);
    vi.stubEnv('OIDC_CLIENT_ID', 'trek');
    expect(isOidcConfiguredIn(new Map([['oidc_issuer', 'https://idp']]))).toBe(true);
  });
});
