import { DayAssignments } from './DayAssignments.entity';
import { Trips } from './Trips.entity';
import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';

















export class RoadtripDayBoundaries {
  [PrimaryKeyProp]?: ['trip', 'dayNumber'];
  trip!: Ref<Trips>;
  dayNumber!: number;
  fromAssignment!: Ref<DayAssignments>;
  toAssignment?: Ref<DayAssignments> | null;
  fraction!: number; // was `unknown`
}

export class RoadtripDayBoundariesRepository extends EntityRepository<RoadtripDayBoundaries> {}

export const RoadtripDayBoundariesSchema = defineEntity({
  class: RoadtripDayBoundaries,
  repository: () => RoadtripDayBoundariesRepository,
  checks: [
    {
      name: 'roadtrip_day_boundaries_fraction_check',
      expression: 'fraction BETWEEN 0 AND 1',
    },
    {
      name: 'roadtrip_day_boundaries_day_number_check',
      expression: 'day_number BETWEEN 1 AND 366',
    },
  ],
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade'),
    dayNumber: p.integer().primary(),
    fromAssignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade'),
    toAssignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').nullable(),
    fraction: p.double(),
  },
});
