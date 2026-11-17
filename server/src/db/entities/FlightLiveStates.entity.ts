import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { FlightLiveStatesRepository } from '../repositories/FlightLiveStates.repository';
import { DbTimestampType } from '../types';

export class FlightLiveStates {
  [EntityRepositoryType]?: FlightLiveStatesRepository;
  [PrimaryKeyProp]?: ['callsign', 'service_date', 'origin', 'destination'];
  callsign!: string;
  service_date!: string;
  origin!: string;
  destination!: string;
  phase: string & Opt = 'scheduled';
  departed_at?: string | null;
  landed_at?: string | null;
  lat?: number | null;
  lng?: number | null;
  altitude_ft?: number | null;
  ground_speed_kt?: number | null;
  track_deg?: number | null;
  vertical_rate_fpm?: number | null;
  on_ground?: number | null;
  registration?: string | null;
  aircraft_type?: string | null;
  source?: string | null;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  fetched_at?: string | null;
  next_poll_at?: string | null;
  fail_count: number & Opt = 0;
  departed_notified: number & Opt = 0;
  landed_notified: number & Opt = 0;
  delay_notified: number & Opt = 0;
}

export const FlightLiveStatesSchema = defineEntity({
  class: FlightLiveStates,
  repository: () => FlightLiveStatesRepository,
  properties: {
    callsign: p.text().primary(),
    service_date: p.text().primary(),
    origin: p.text().primary(),
    destination: p.text().primary(),
    phase: p.text().default('scheduled'),
    departed_at: p.type(DbTimestampType).nullable(),
    landed_at: p.type(DbTimestampType).nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    altitude_ft: p.double().nullable(),
    ground_speed_kt: p.double().nullable(),
    track_deg: p.double().nullable(),
    vertical_rate_fpm: p.double().nullable(),
    on_ground: p.integer().nullable(),
    registration: p.text().nullable(),
    aircraft_type: p.text().nullable(),
    source: p.text().nullable(),
    first_seen_at: p.type(DbTimestampType).nullable(),
    last_seen_at: p.type(DbTimestampType).nullable(),
    fetched_at: p.type(DbTimestampType).nullable(),
    next_poll_at: p.type(DbTimestampType).nullable(),
    fail_count: p.integer().default(0),
    departed_notified: p.integer().default(0),
    landed_notified: p.integer().default(0),
    delay_notified: p.integer().default(0),
  },
});
