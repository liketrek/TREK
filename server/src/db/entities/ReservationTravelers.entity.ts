import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ReservationTravelersRepository } from '../repositories/ReservationTravelers.repository';
import { Reservations } from './Reservations.entity';
import { Users } from './Users.entity';

export class ReservationTravelers {
  [EntityRepositoryType]?: ReservationTravelersRepository;
  id!: number & Opt;
  reservation!: Ref<Reservations>;
  reservation_id!: number;
  user!: Ref<Users>;
  user_id!: number;
}

export const ReservationTravelersSchema = defineEntity({
  class: ReservationTravelers,
  repository: () => ReservationTravelersRepository,
  uniques: [{ properties: ['reservation', 'user'] }],
  properties: {
    id: p.integer().primary(),
    reservation: () => p.manyToOne(Reservations).ref().deleteRule('cascade').hidden().index('idx_reservation_travelers_res'),
    reservation_id: p.integer().persist(false).index('idx_reservation_travelers_res'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_reservation_travelers_user'),
    user_id: p.integer().persist(false).index('idx_reservation_travelers_user'),
  },
});
