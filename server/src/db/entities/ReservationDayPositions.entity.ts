import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ReservationDayPositionsRepository } from '../repositories/ReservationDayPositions.repository';
import { Days } from './Days.entity';
import { Reservations } from './Reservations.entity';

export class ReservationDayPositions {
  [EntityRepositoryType]?: ReservationDayPositionsRepository;
  [PrimaryKeyProp]?: ['reservation', 'day'];
  reservation!: Ref<Reservations>;
  reservation_id!: number;
  day!: Ref<Days>;
  day_id!: number;
  position!: number;
}

export const ReservationDayPositionsSchema = defineEntity({
  class: ReservationDayPositions,
  repository: () => ReservationDayPositionsRepository,
  uniques: [{ properties: ['reservation', 'day'] }],
  properties: {
    reservation: () => p.manyToOne(Reservations).primary().ref().hidden(),
    reservation_id: p.integer().persist(false),
    day: () => p.manyToOne(Days).primary().ref().hidden(),
    day_id: p.integer().persist(false),
    position: p.double(),
  },
});
