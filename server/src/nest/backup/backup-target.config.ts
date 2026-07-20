/**
 * Configuration for the external S3-compatible backup target.
 *
 * A single target, stored in the `app_settings` key/value table exactly the way
 * the SMTP settings are (see authService's admin settings) rather than in a
 * dedicated table: one target is all Phase 1 promises, and a `storage_targets`
 * table with named targets is only worth its migration once multiple
 * destinations actually land.
 *
 * The secret access key is encrypted at rest with `apiKeyCrypto`, the same
 * helper `smtp_pass` and `admin_ntfy_token` use.
 *
 * CRITICAL: `backup_s3_secret_access_key` is listed in
 * `server/scripts/migrate-encryption.ts`. Any further encrypted key added here
 * must be added there in the same commit, or rotating ENCRYPTION_KEY silently
 * orphans it and the target stops authenticating with no error until the next
 * backup runs.
 *
 * Environment variables (`BACKUP_S3_*`) take precedence over the stored values,
 * matching how `SMTP_PASS` overrides the stored `smtp_pass`. An install that
 * configures the target through env is read-only in the admin UI — the form
 * reports `managed_by_env` rather than accepting an edit that would not apply.
 */
import { db } from '../../db/database';
import { decrypt_api_key, maybe_encrypt_api_key } from '../../services/apiKeyCrypto';
import { MASKED_SECRET, type S3BackupTargetRequest, type S3BackupTargetResponse } from '@trek/shared';

/** Resolved target, with the secret in plaintext. Server-side use only. */
export interface S3TargetConfig {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  requireTls: boolean;
}

const SETTING_KEYS = {
  enabled: 'backup_s3_enabled',
  endpoint: 'backup_s3_endpoint',
  region: 'backup_s3_region',
  bucket: 'backup_s3_bucket',
  prefix: 'backup_s3_prefix',
  accessKeyId: 'backup_s3_access_key_id',
  secretAccessKey: 'backup_s3_secret_access_key',
  forcePathStyle: 'backup_s3_force_path_style',
  requireTls: 'backup_s3_require_tls',
} as const;

/** The one encrypted key in this module — keep migrate-encryption.ts in sync. */
export const ENCRYPTED_TARGET_SETTING_KEYS = [SETTING_KEYS.secretAccessKey];

function readSetting(key: string): string {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? '';
}

function writeSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

function envBool(raw: string | undefined): boolean | null {
  if (raw === undefined) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return null;
}

function storedBool(raw: string, fallback: boolean): boolean {
  if (raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

/**
 * True when the target is configured through environment variables. The bucket
 * is the discriminator: a target without one cannot address anything, so an
 * install that sets BACKUP_S3_BUCKET has committed to env-based config.
 */
export function isManagedByEnv(): boolean {
  return !!process.env.BACKUP_S3_BUCKET?.trim();
}

/** Resolve the effective target — env first, then the stored settings. */
export function resolveS3Target(): S3TargetConfig {
  if (isManagedByEnv()) {
    const enabled = envBool(process.env.BACKUP_S3_ENABLED);
    return {
      // A bucket configured via env is on unless explicitly disabled — an
      // operator who set the variables meant to use them.
      enabled: enabled ?? true,
      endpoint: process.env.BACKUP_S3_ENDPOINT?.trim() ?? '',
      region: process.env.BACKUP_S3_REGION?.trim() || 'us-east-1',
      bucket: process.env.BACKUP_S3_BUCKET!.trim(),
      prefix: normalizePrefix(process.env.BACKUP_S3_PREFIX ?? ''),
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID?.trim() ?? '',
      secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY ?? '',
      forcePathStyle: envBool(process.env.BACKUP_S3_FORCE_PATH_STYLE) ?? false,
      requireTls: envBool(process.env.BACKUP_S3_REQUIRE_TLS) ?? true,
    };
  }

  return {
    enabled: storedBool(readSetting(SETTING_KEYS.enabled), false),
    endpoint: readSetting(SETTING_KEYS.endpoint),
    region: readSetting(SETTING_KEYS.region) || 'us-east-1',
    bucket: readSetting(SETTING_KEYS.bucket),
    prefix: normalizePrefix(readSetting(SETTING_KEYS.prefix)),
    accessKeyId: readSetting(SETTING_KEYS.accessKeyId),
    // decrypt_api_key passes legacy plaintext straight through and returns null
    // on a failed decrypt (wrong ENCRYPTION_KEY) — treat that as "no secret"
    // rather than sending garbage to the SDK as a credential.
    secretAccessKey: decrypt_api_key(readSetting(SETTING_KEYS.secretAccessKey)) ?? '',
    forcePathStyle: storedBool(readSetting(SETTING_KEYS.forcePathStyle), false),
    requireTls: storedBool(readSetting(SETTING_KEYS.requireTls), true),
  };
}

/**
 * Normalise a key prefix to `some/path/` (no leading slash, one trailing slash)
 * so object keys concatenate predictably. An empty prefix stays empty.
 */
export function normalizePrefix(raw: string): string {
  const trimmed = raw.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed === '' ? '' : `${trimmed}/`;
}

/** True when the target has everything it needs to talk to a bucket. */
export function isTargetUsable(cfg: S3TargetConfig): boolean {
  return !!(cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey);
}

/** The admin-facing view. The secret is reported as set/unset, never returned. */
export function readS3TargetForClient(): S3BackupTargetResponse {
  const cfg = resolveS3Target();
  return {
    enabled: cfg.enabled,
    endpoint: cfg.endpoint,
    region: cfg.region,
    bucket: cfg.bucket,
    prefix: cfg.prefix,
    access_key_id: cfg.accessKeyId,
    secret_access_key_set: !!cfg.secretAccessKey,
    force_path_style: cfg.forcePathStyle,
    require_tls: cfg.requireTls,
    managed_by_env: isManagedByEnv(),
  };
}

/**
 * Persist a partial update. Only the fields present in the body are written, so
 * the form can PUT a subset. A `secret_access_key` echoing MASKED_SECRET (what
 * a read hands the client) means "keep what is stored" — without this, opening
 * the form and pressing save would overwrite the real secret with the mask.
 */
export function saveS3Target(patch: S3BackupTargetRequest): void {
  const write: [string, string][] = [];

  if (patch.enabled !== undefined) write.push([SETTING_KEYS.enabled, String(patch.enabled)]);
  if (patch.endpoint !== undefined) write.push([SETTING_KEYS.endpoint, patch.endpoint.trim()]);
  if (patch.region !== undefined) write.push([SETTING_KEYS.region, patch.region.trim()]);
  if (patch.bucket !== undefined) write.push([SETTING_KEYS.bucket, patch.bucket.trim()]);
  if (patch.prefix !== undefined) write.push([SETTING_KEYS.prefix, normalizePrefix(patch.prefix)]);
  if (patch.access_key_id !== undefined) write.push([SETTING_KEYS.accessKeyId, patch.access_key_id.trim()]);
  if (patch.force_path_style !== undefined) write.push([SETTING_KEYS.forcePathStyle, String(patch.force_path_style)]);
  if (patch.require_tls !== undefined) write.push([SETTING_KEYS.requireTls, String(patch.require_tls)]);

  if (patch.secret_access_key !== undefined && patch.secret_access_key !== MASKED_SECRET) {
    const secret = patch.secret_access_key.trim();
    // An explicit empty string clears the credential; anything else is stored
    // encrypted. maybe_encrypt_api_key returns null for empty input, which is
    // why the empty case is handled separately rather than through it.
    write.push([SETTING_KEYS.secretAccessKey, secret === '' ? '' : (maybe_encrypt_api_key(secret) ?? '')]);
  }

  for (const [key, value] of write) writeSetting(key, value);
}
