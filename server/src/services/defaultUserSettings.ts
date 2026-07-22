import { db } from '../db/database';
import { DEFAULTABLE_USER_SETTING_KEYS } from './settingsService';

const PREFIX = 'DEFAULT_USER_SETTING_';

/**
 * On startup: write any DEFAULT_USER_SETTING_<KEY> env vars into app_settings
 * as default_user_setting_<key> — only if no value is already stored.
 * This lets operators seed instance defaults without touching the UI.
 */
export function applyDefaultUserSettingsFromEnv(): void {
  for (const key of DEFAULTABLE_USER_SETTING_KEYS) {
    const envKey = PREFIX + key.toUpperCase();
    const envVal = process.env[envKey];
    if (envVal === undefined) continue;

    const appKey = `default_user_setting_${key}`;
    const existing = db.prepare(
      'SELECT value FROM app_settings WHERE key = ?'
    ).get(appKey) as { value: string } | undefined;

    if (existing) continue;

    db.prepare(
      'INSERT INTO app_settings (key, value) VALUES (?, ?)'
    ).run(appKey, envVal);
  }
}
