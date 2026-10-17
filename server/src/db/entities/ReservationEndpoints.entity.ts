import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ReservationEndpointsRepository } from '../repositories/ReservationEndpoints.repository';
import { DbTimestampType } from '../types';
import { Reservations } from './Reservations.entity';

export class ReservationEndpoints {
  [EntityRepositoryType]?: ReservationEndpointsRepository;
  id!: number & Opt;
  reservation!: Ref<Reservations>;
  reservation_id!: number;
  role!: string;
  sequence: number & Opt = 0;
  name!: string;
  code?: string | null;
  lat!: number;
  lng!: number;
  timezone?: string | null;
  local_time?: string | null;
  local_date?: string | null;
  created_at?: string | null;
}

export const ReservationEndpointsSchema = defineEntity({
  class: ReservationEndpoints,
  repository: () => ReservationEndpointsRepository,
  properties: {
    id: p.integer().primary(),
    reservation: () => p.manyToOne(Reservations).ref().deleteRule('cascade').hidden().index('idx_reservation_endpoints_reservation_id'),
    reservation_id: p.integer().persist(false).index('idx_reservation_endpoints_reservation_id'),
    role: p.text(),
    sequence: p.integer().default(0),
    name: p.text(),
    code: p.text().nullable(),
    lat: p.double(),
    lng: p.double(),
    timezone: p.text().nullable(),
    local_time: p.text().nullable(),
    local_date: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
