import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Reservations } from './Reservations.entity';

export class ReservationEndpoints {
  id?: number | null;
  reservation!: Ref<Reservations>;
  role!: string;
  sequence: number & Opt = 0;
  name!: string;
  code?: string | null;
  lat!: unknown;
  lng!: unknown;
  timezone?: string | null;
  localTime?: string | null;
  localDate?: string | null;
  createdAt?: Date | null;
}

export class ReservationEndpointsRepository extends EntityRepository<ReservationEndpoints> {}

export const ReservationEndpointsSchema = defineEntity({
  class: ReservationEndpoints,
  repository: () => ReservationEndpointsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    reservation: () => p.manyToOne(Reservations).ref().deleteRule('cascade').index('idx_reservation_endpoints_reservation_id'),
    role: p.text(),
    sequence: p.integer(),
    name: p.text(),
    code: p.text().nullable(),
    lat: p.double(),
    lng: p.double(),
    timezone: p.text().nullable(),
    localTime: p.text().nullable(),
    localDate: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
