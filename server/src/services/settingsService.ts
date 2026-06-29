import { db } from '../db/database';
import { decrypt_api_key, maybe_encrypt_api_key } from './apiKeyCrypto';
import { normalizeAppearance } from '@trek/shared';

const ENCRYPTED_SETTING_KEYS = new Set(['webhook_url', 'ntfy_token', 'mapbox_access_token', 'llm_api_key']);
// Encrypted keys that are masked (••••••••) when returned to the client.
// Keys not in this set but in ENCRYPTED_SETTING_KEYS are decrypted and returned.
const MASKED_SETTING_KEYS = new Set(['webhook_url', 'ntfy_token', 'llm_api_key']);

export const DEFAULTABLE_USER_SETTING_KEYS = [
  'temperature_unit',
  'distance_unit',
  'dark_mode',
  'time_format',
  // Instance-wide default currency for Costs (new users inherit it until they
  // pick their own). Free-form ISO code, validated on the client.
  'default_currency',
  'blur_booking_codes',
  'map_tile_url',
  // Instance-wide GL map defaults: admins can set Mapbox token/style or
  // tokenless MapLibre/OpenFreeMap style defaults for new users (#920).
  'map_provider',
  'mapbox_access_token',
  'mapbox_style',
  'maplibre_style',
  'mapbox_3d_enabled',
  'mapbox_quality_mode',
  // Per-user LLM fallback config for booking import (used when the admin has not
  // set instance-wide config on the llm_parsing addon). See llmConfig.ts.
  'llm_provider',
  'llm_model',
  'llm_base_url',
  'llm_multimodal',
  'llm_api_key',
] as const;

type DefaultableKey = typeof DEFAULTABLE_USER_SETTING_KEYS[number];

const VALID_VALUES: Partial<Record<DefaultableKey, unknown[]>> = {
  temperature_unit: ['fahrenheit', 'celsius'],
  distance_unit: ['metric', 'imperial'],
  time_format: ['12h', '24h'],
  dark_mode: [true, false, 'light', 'dark', 'auto'],
  map_provider: ['leaflet', 'mapbox-gl', 'maplibre-gl'],
  llm_provider: ['local', 'openai', 'anthropic'],
};

const BOOLEAN_KEYS = new Set<DefaultableKey>(['blur_booking_codes', 'mapbox_3d_enabled', 'mapbox_quality_mode', 'llm_multimodal']);

function parseValue(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return raw; }
}

export function getAdminUserDefaults(): Record<string, unknown> {
  const rows = db.prepare(
    "SELECT key, value FROM app_settings WHERE key LIKE 'default_user_setting_%'"
  ).all() as { key: string; value: string }[];
  const defaults: Record<string, unknown> = {};
  for (const row of rows) {
    const settingKey = row.key.slice('default_user_setting_'.length);
    if (ENCRYPTED_SETTING_KEYS.has(settingKey)) {
      defaults[settingKey] = row.value ? (decrypt_api_key(row.value) ?? '') : '';
    } else {
      defaults[settingKey] = parseValue(row.value);
    }
  }
  return defaults;
}

export function setAdminUserDefaults(partial: Record<string, unknown>): void {
  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const del = db.prepare("DELETE FROM app_settings WHERE key = ?");

  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(partial)) {
      if (!(DEFAULTABLE_USER_SETTING_KEYS as readonly string[]).includes(key)) {
        throw new Error(`Invalid setting key: ${key}`);
      }
      const typedKey = key as DefaultableKey;
      const appKey = `default_user_setting_${key}`;

      // null/undefined means "reset to built-in default" — delete the row
      if (value === null || value === undefined) {
        del.run(appKey);
        continue;
      }

      if (BOOLEAN_KEYS.has(typedKey) && typeof value !== 'boolean') {
        throw new Error(`Setting ${key} must be a boolean`);
      }
      const allowed = VALID_VALUES[typedKey];
      if (allowed && !allowed.includes(value)) {
        throw new Error(`Invalid value for ${key}: ${value}`);
      }

      // Encrypt sensitive defaults (the shared Mapbox token) at rest, like the
      // per-user equivalents; everything else is stored as plain JSON.
      const stored = ENCRYPTED_SETTING_KEYS.has(key)
        ? (maybe_encrypt_api_key(String(value)) ?? String(value))
        : JSON.stringify(value);
      upsert.run(appKey, stored);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getUserSettings(userId: number): Record<string, unknown> {
  const adminDefaults = getAdminUserDefaults();

  const rows = db.prepare('SELECT key, value FROM settings WHERE user_id = ?').all(userId) as { key: string; value: string }[];
  const userSettings: Record<string, unknown> = {};
  for (const row of rows) {
    if (MASKED_SETTING_KEYS.has(row.key)) {
      userSettings[row.key] = row.value ? '••••••••' : '';
      continue;
    }
    if (ENCRYPTED_SETTING_KEYS.has(row.key)) {
      userSettings[row.key] = row.value ? (decrypt_api_key(row.value) ?? '') : '';
      continue;
    }
    try {
      userSettings[row.key] = JSON.parse(row.value);
    } catch {
      userSettings[row.key] = row.value;
    }
  }

  // Admin defaults fill in only for keys the user hasn't explicitly set
  return { ...adminDefaults, ...userSettings };
}

function serializeValue(key: string, value: unknown): string {
  // The appearance blob drives the DOM on the client — normalize it on the way
  // in so a malformed/partial/future-versioned payload can never be stored (and
  // thus never reach the writer). Unknown/invalid fields collapse to the default.
  if (key === 'appearance') value = normalizeAppearance(value);
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value !== undefined ? value : '');
  if (ENCRYPTED_SETTING_KEYS.has(key)) return maybe_encrypt_api_key(raw) ?? raw;
  return raw;
}

export function upsertSetting(userId: number, key: string, value: unknown) {
  db.prepare(`
    INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `).run(userId, key, serializeValue(key, value));
}

export function bulkUpsertSettings(userId: number, settings: Record<string, unknown>) {
  const upsert = db.prepare(`
    INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `);
  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(userId, key, serializeValue(key, value));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return Object.keys(settings).length;
}

/**
 * Read a single per-user setting, decrypting it if it's an encrypted key.
 * Unlike getUserSettings (which MASKS encrypted keys for the client), this
 * returns the plaintext — for server-side use only (e.g. the LLM config
 * resolver needs the real API key). Returns null when unset.
 */
export function getDecryptedUserSetting(userId: number, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?').get(userId, key) as { value: string } | undefined;
  if (!row || row.value === '' || row.value == null) return null;
  if (ENCRYPTED_SETTING_KEYS.has(key)) return decrypt_api_key(row.value);
  try {
    const parsed = JSON.parse(row.value);
    return typeof parsed === 'string' ? parsed : row.value;
  } catch {
    return row.value;
  }
}
