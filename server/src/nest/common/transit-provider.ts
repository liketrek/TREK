import { TRANSIT_PROVIDERS, type TransitProvider } from '@trek/shared';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';

/**
 * Which backend answers /api/transit (#1699), stored as one `app_settings` row.
 *
 * Kept as plain functions rather than a service (the instance-api-keys.ts
 * precedent) because two modules need the value and neither should own the
 * other: AddonsService writes it from the admin panel, TransitService reads it
 * per request. One reader, one writer, one key — no mirrored copy.
 *
 * Plan 4 Task 1: both functions take an `AppSettingsRepository` instead of a
 * `DatabaseService` — the exact single-key `ON CONFLICT(key) DO UPDATE` shape
 * `AppSettingsRepository.setValue` already established for this table (3i's
 * inventory note on the two distinct `app_settings` upsert shapes — this file
 * used the `ON CONFLICT` spelling, not `INSERT OR REPLACE`, preserved as-is).
 */
export const TRANSIT_PROVIDER_SETTING = 'transit_provider';

/** Free, keyless, and what every install has today. Also the fallback. */
export const DEFAULT_TRANSIT_PROVIDER: TransitProvider = 'transitous';

function isTransitProvider(value: unknown): value is TransitProvider {
  return typeof value === 'string' && (TRANSIT_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Reads fail-safe: a missing row, or a value written by a newer version that
 * this one does not know, resolves to Transitous. The alternative is billing an
 * admin's Google key because a string did not parse.
 */
export async function readTransitProvider(appSettings: AppSettingsRepository): Promise<TransitProvider> {
  const value = await appSettings.getValue(TRANSIT_PROVIDER_SETTING);
  return isTransitProvider(value) ? value : DEFAULT_TRANSIT_PROVIDER;
}

export async function writeTransitProvider(appSettings: AppSettingsRepository, provider: TransitProvider): Promise<TransitProvider> {
  await appSettings.setValue(TRANSIT_PROVIDER_SETTING, provider);
  return provider;
}
