import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Reservations } from './Reservations.entity';
import { Users } from './Users.entity';

export class ReservationTravelers {
  id?: number | null;
  reservation!: Ref<Reservations>;
  user!: Ref<Users>;
}

export class ReservationTravelersRepository extends EntityRepository<ReservationTravelers> {}

export const ReservationTravelersSchema = defineEntity({
  class: ReservationTravelers,
  repository: () => ReservationTravelersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    reservation: () => p.manyToOne(Reservations).ref().index('idx_reservation_travelers_res'),
    user: () => p.manyToOne(Users).ref().index('idx_reservation_travelers_user'),
  },
});
