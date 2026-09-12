import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { HttpException, Injectable } from '@nestjs/common';
import {
  ROADTRIP_PREFERENCE_KEYS,
  roadtripPreferencesSchema,
  roadtripPreferencesUpdateSchema,
  type RoadtripPreferences,
} from '@trek/shared';

@Injectable()
export class RoadtripPreferencesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  read(tripId: number): RoadtripPreferences {
    const settings: Record<string, unknown> = {};
    for (const row of this.db.all<{ key: string; value: string }>(
      'SELECT key, value FROM roadtrip_preferences WHERE trip_id = ?',
      tripId,
    )) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    const preferences: Record<string, unknown> = {};
    for (const key of ROADTRIP_PREFERENCE_KEYS) {
      const parsed = roadtripPreferencesSchema.shape[key].safeParse(settings[key]);
      if (parsed.success && parsed.data !== undefined) preferences[key] = parsed.data;
    }
    return roadtripPreferencesSchema.parse(preferences);
  }

  update(tripId: number, patch: RoadtripPreferences): RoadtripPreferences {
    const validated = roadtripPreferencesUpdateSchema.parse(patch);
    const saved = this.db.transaction(() => {
      const next = { ...this.read(tripId), ...validated };
      if (next.roadtrip_day_start && next.roadtrip_day_end && next.roadtrip_day_end <= next.roadtrip_day_start) {
        throw new HttpException({ error: 'Day end must be later than day start.' }, 400);
      }
      for (const [key, value] of Object.entries(validated)) {
        this.db.run(
          'INSERT INTO roadtrip_preferences (trip_id, key, value) VALUES (?, ?, ?) ON CONFLICT(trip_id, key) DO UPDATE SET value = excluded.value',
          tripId,
          key,
          JSON.stringify(value),
        );
      }
      return this.read(tripId);
    });
    this.realtime.broadcast(String(tripId), 'roadtripPreferences:changed', { preferences: saved });
    return saved;
  }
}
