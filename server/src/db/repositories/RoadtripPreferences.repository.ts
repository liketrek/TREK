import type { RoadtripPreferences } from '../entities/RoadtripPreferences.entity';
import { TrekRepository } from './_shared/trek-repository';

/** RPF1's raw row — the JSON parse (with its raw-string fallback) stays in the service. */
export interface RoadtripPreferenceRow {
  key: string;
  value: string;
}

/**
 * `roadtrip_preferences` — a trip-scoped key/value store, one row per
 * preference key, values JSON-encoded in the service.
 */
export class RoadtripPreferencesRepository extends TrekRepository<RoadtripPreferences> {
  /** RPF1 — `SELECT key, value FROM roadtrip_preferences WHERE trip_id = ?` (no ORDER BY, matching the legacy statement). */
  async listForTrip(trip_id: number): Promise<RoadtripPreferenceRow[]> {
    return await this.qb('r')
      .select(['r.key', 'r.value'])
      .where({ trip: trip_id })
      .execute<RoadtripPreferenceRow[]>('all', false);
  }

  /**
   * RPF3 — `INSERT INTO roadtrip_preferences (trip_id, key, value) VALUES
   * (?, ?, ?) ON CONFLICT(trip_id, key) DO UPDATE SET value = excluded.value`.
   *
   * `onConflictFields: ['trip', 'key']` — the composite PK
   * (`[PrimaryKeyProp]?: ['trip', 'key']`); `onConflictMergeFields:
   * ['value']` matches the legacy SET list exactly (never touches `trip`/
   * `key`, the key itself).
   */
  async upsertValue(trip_id: number, key: string, value: string): Promise<void> {
    await this.upsert(
      { trip: trip_id, key, value },
      { onConflictFields: ['trip', 'key'], onConflictAction: 'merge', onConflictMergeFields: ['value'] },
    );
  }
}
