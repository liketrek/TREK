import { RoadtripPreferences as RoadtripPreferencesEntity } from '../../db/entities/RoadtripPreferences.entity';
import type { RoadtripPreferencesRepository } from '../../db/repositories/RoadtripPreferences.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { RealtimeService } from '../realtime/realtime.service';
import { InjectRepository } from '@mikro-orm/nestjs';
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
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
    @InjectRepository(RoadtripPreferencesEntity) private readonly preferencesRepo: RoadtripPreferencesRepository,
  ) {}

  /** RPF1 — `RoadtripPreferencesRepository.listForTrip`, with the legacy JSON parse (raw-string fallback) unchanged. */
  async read(tripId: number): Promise<RoadtripPreferences> {
    const settings: Record<string, unknown> = {};
    for (const row of await this.preferencesRepo.listForTrip(tripId)) {
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

  async update(tripId: number, patch: RoadtripPreferences, socketId?: string): Promise<RoadtripPreferences> {
    const validated = roadtripPreferencesUpdateSchema.parse(patch);
    const saved = await this.uow.transactional(async () => {
      const next = { ...(await this.read(tripId)), ...validated };
      if (next.roadtrip_day_start && next.roadtrip_day_end && next.roadtrip_day_end <= next.roadtrip_day_start) {
        throw new HttpException({ error: 'Day end must be later than day start.' }, 400);
      }
      // RPF3 — `RoadtripPreferencesRepository.upsertValue`.
      for (const [key, value] of Object.entries(validated)) {
        await this.preferencesRepo.upsertValue(tripId, key, JSON.stringify(value));
      }
      // RPF1's read-after-write, inside the same transaction (§18.10) — `find`-based,
      // so `TrekRepository`'s `disableIdentityMap: true` default already keeps this
      // fresh against the upsert just above.
      return await this.read(tripId);
    });
    // The saving tab is left out, like every other trip mutation: it already has
    // the answer, and its own echo costs it a second store commit and the route
    // recompute that follows. The MCP tool passes none, which is right — nobody
    // there is holding the result already.
    this.realtime.broadcast(String(tripId), 'roadtripPreferences:changed', { preferences: saved }, socketId);
    return saved;
  }
}
