import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Days } from './Days.entity';
import { Reservations } from './Reservations.entity';

export class ReservationDayPositions {
  [PrimaryKeyProp]?: ['reservation', 'day'];
  reservation!: Ref<Reservations>;
  day!: Ref<Days>;
  position!: unknown;
}

export class ReservationDayPositionsRepository extends EntityRepository<ReservationDayPositions> {}

export const ReservationDayPositionsSchema = defineEntity({
  class: ReservationDayPositions,
  repository: () => ReservationDayPositionsRepository,
  properties: {
    reservation: () => p.manyToOne(Reservations).primary().ref(),
    day: () => p.manyToOne(Days).primary().ref(),
    position: p.double(),
  },
});
