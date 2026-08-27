import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { MASKED_SETTING_VALUE, normalizeAppearance } from '@trek/shared';
import { readEnv } from '../../app-config';

const ENCRYPTED_SETTING_KEYS = new Set([
  'webhook_url',
  'ntfy_token',
  'mapbox_access_token',
  'carto_api_key',
  'llm_api_key',
]);
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
  // CARTO stamps an "API KEY REQUIRED" watermark into keyless tiles (#2054), and
  // the key is per-instance rather than per-person: defaultable so one admin
  // value clears the watermark for everybody at once.
  'carto_api_key',
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

const DEFAULTABLE_USER_SETTING_KEY_SET = new Set<string>(DEFAULTABLE_USER_SETTING_KEYS);

const VALID_VALUES: Partial<Record<DefaultableKey, unknown[]>> = {
  temperature_unit: ['fahrenheit', 'celsius'],
  distance_unit: ['metric', 'imperial'],
  time_format: ['12h', '24h'],
  dark_mode: [true, false, 'light', 'dark', 'auto'],
  map_provider: ['leaflet', 'mapbox-gl', 'maplibre-gl'],
  llm_provider: ['local', 'openai', 'anthropic'],
};

const BOOLEAN_KEYS = new Set<DefaultableKey>(['blur_booking_codes', 'mapbox_3d_enabled', 'mapbox_quality_mode', 'llm_multimodal']);

/**
 * #1772: per-user LLM settings a non-admin must not write. Both of them pick
 * the address this server sends its own LLM requests to (provider 'local' means
 * nothing but "an endpoint I name"), and the SSRF guard in front of those
 * requests allows loopback/LAN on purpose so a self-hosted Ollama works. Only
 * whoever runs the instance can judge what is reachable from it.
 *
 * Clearing stays open to everyone: both Settings sections always send
 * `llm_base_url: ''` while the field is hidden, so a row written before this
 * rule cleans itself up on the next save instead of blocking it.
 */
export function isAdminOnlyLlmSetting(key: string, value: unknown): boolean {
  if (key === 'llm_base_url') return typeof value === 'string' && value.trim() !== '';
  if (key === 'llm_provider') return value === 'local';
  return false;
}

function parseValue(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return raw; }
}

function serializeValue(key: string, value: unknown): string {
  // The appearance blob drives the DOM on the client — normalize it on the way
  // in so a malformed/partial/future-versioned payload can never be stored (and
  // thus never reach the writer). Unknown/invalid fields collapse to the default.
  if (key === 'appearance') value = normalizeAppearance(value);
  // null and undefined both mean "cleared" and store '' — the legacy code stored
  // the string "null" for null, which leaked back out of getDecryptedUserSetting
  // as a literal four-character "null" (e.g. as an LLM API key).
  const raw = value === null || value === undefined ? ''
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (ENCRYPTED_SETTING_KEYS.has(key)) return maybe_encrypt_api_key(raw) ?? raw;
  return raw;
}

/**
 * Per-user key/value preferences and the admin-set instance-wide defaults
 * (`default_user_setting_*` rows in app_settings). SQL, masking/merge behavior
 * and secret encryption moved from the legacy services/settingsService.
 * Post-migration fixes over the legacy code: null serializes as '' like
 * undefined (a stored "null" leaked out of getDecryptedUserSetting as the
 * literal string), and bulk upserts skip masked-sentinel values (mirroring the
 * single-upsert no-op, so a bulk save echoing a masked secret can never
 * destroy the stored secret) and return the count actually written.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly db: DatabaseService) {}

  getAdminUserDefaults(): Record<string, unknown> {
    const rows = this.db.all<{ key: string; value: string }>(
      "SELECT key, value FROM app_settings WHERE key LIKE 'default_user_setting_%'"
    );
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

  setAdminUserDefaults(partial: Record<string, unknown>): void {
    const upsert = this.db.prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    );
    const del = this.db.prepare("DELETE FROM app_settings WHERE key = ?");

    this.db.transaction(() => {
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
    });
  }

  getUserSettings(userId: number): Record<string, unknown> {
    const adminDefaults = this.getAdminUserDefaults();

    const rows = this.db.all<{ key: string; value: string }>('SELECT key, value FROM settings WHERE user_id = ?', userId);
    const userSettings: Record<string, unknown> = {};
    for (const row of rows) {
      if (MASKED_SETTING_KEYS.has(row.key)) {
        userSettings[row.key] = row.value ? MASKED_SETTING_VALUE : '';
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

    // Admin defaults fill in for keys the user hasn't explicitly set. For a
    // defaultable key an *empty* user value counts as "not set": the client's
    // Settings save always writes every field (a blank Mapbox token included), so
    // an empty string would otherwise shadow the admin/system-wide default and the
    // user could never fall back to it — even after clearing their own value
    // (#1634). Non-defaultable keys keep their exact stored value.
    //
    // Seed from the admin defaults, but mask any encrypted secret (e.g. a shared
    // llm_api_key) exactly like the per-user path above: getUserSettings is the
    // client-facing accessor and must never hand back a secret in cleartext — not
    // even one inherited from an admin default (the fall-through above widened the
    // set of users who inherit it). The server reads the real value via
    // getAdminUserDefaults / getDecryptedUserSetting, which don't mask.
    const merged: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(adminDefaults)) {
      merged[key] = MASKED_SETTING_KEYS.has(key) ? (value ? MASKED_SETTING_VALUE : '') : value;
    }
    for (const [key, value] of Object.entries(userSettings)) {
      if (
        DEFAULTABLE_USER_SETTING_KEY_SET.has(key) &&
        (value === '' || value === null || value === undefined) &&
        key in adminDefaults
      ) {
        continue; // empty user value → keep the admin default
      }
      merged[key] = value;
    }

    // On a centrally administered install the map credential comes with the
    // instance, so it is injected here rather than stored per user: the token is
    // the operator's, it is a public pk.* that has to reach the browser anyway,
    // and nobody should be able to save a different one over it. GL is the
    // default there too, since a token is always present.
    const managedMaps = readEnv().maps;
    if (readEnv().managed.enabled && managedMaps.mapboxToken) {
      merged.mapbox_access_token = managedMaps.mapboxToken;
      if (!merged.map_provider || merged.map_provider === 'leaflet') {
        merged.map_provider = 'mapbox-gl';
      }
    }
    // Injected the same way, but without touching map_provider: a CARTO key only
    // says whose basemap account the tiles are billed to, nothing about which
    // renderer the user wants.
    if (readEnv().managed.enabled && managedMaps.cartoKey) {
      merged.carto_api_key = managedMaps.cartoKey;
    }

    return merged;
  }

  upsertSetting(userId: number, key: string, value: unknown) {
    this.db.run(`
    INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `, userId, key, serializeValue(key, value));
  }

  bulkUpsertSettings(userId: number, settings: Record<string, unknown>) {
    const upsert = this.db.prepare(`
    INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `);
    let written = 0;
    this.db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        // The client echoes redacted secrets back unchanged — skip them so a
        // bulk save can never overwrite a stored secret with the mask (the
        // single-upsert route has the same no-op in the controller).
        if (value === MASKED_SETTING_VALUE) continue;
        upsert.run(userId, key, serializeValue(key, value));
        written++;
      }
    });
    return written;
  }

  /**
   * Read a single per-user setting, decrypting it if it's an encrypted key.
   * Unlike getUserSettings (which MASKS encrypted keys for the client), this
   * returns the plaintext — for server-side use only (e.g. the LLM config
   * resolver needs the real API key). Returns null when unset.
   */
  getDecryptedUserSetting(userId: number, key: string): string | null {
    const row = this.db.get<{ value: string }>('SELECT value FROM settings WHERE user_id = ? AND key = ?', userId, key);
    if (!row || row.value === '' || row.value == null) return null;
    if (ENCRYPTED_SETTING_KEYS.has(key)) return decrypt_api_key(row.value);
    try {
      const parsed = JSON.parse(row.value);
      return typeof parsed === 'string' ? parsed : row.value;
    } catch {
      return row.value;
    }
  }
}
