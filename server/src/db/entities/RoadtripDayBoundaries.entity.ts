import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { RoadtripDayBoundariesRepository } from '../repositories/RoadtripDayBoundaries.repository';
import { DayAssignments } from './DayAssignments.entity';
import { Trips } from './Trips.entity';

export class RoadtripDayBoundaries {
  [EntityRepositoryType]?: RoadtripDayBoundariesRepository;
  [PrimaryKeyProp]?: ['trip', 'day_number'];
  trip!: Ref<Trips>;
  trip_id!: number;
  day_number!: number;
  fromAssignment!: Ref<DayAssignments>;
  from_assignment_id!: number;
  toAssignment?: Ref<DayAssignments> | null;
  to_assignment_id?: number | null;
  fraction!: number;
}

export const RoadtripDayBoundariesSchema = defineEntity({
  class: RoadtripDayBoundaries,
  repository: () => RoadtripDayBoundariesRepository,
  uniques: [{ properties: ['trip', 'day_number'] }],
  checks: [
    {
      name: 'roadtrip_day_boundaries_fraction_check',
      expression: 'fraction BETWEEN 0 AND 1',
    },
    {
      name: 'roadtrip_day_boundaries_day_number_check',
      expression: 'day_number >= 1',
    },
  ],
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    day_number: p.integer().primary(),
    fromAssignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').hidden().index('idx_roadtrip_day_boundaries_from_assignment_id'),
    from_assignment_id: p.integer().persist(false).index('idx_roadtrip_day_boundaries_from_assignment_id'),
    toAssignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').nullable().hidden().index('idx_roadtrip_day_boundaries_to_assignment_id'),
    to_assignment_id: p.integer().nullable().persist(false).index('idx_roadtrip_day_boundaries_to_assignment_id'),
    fraction: p.double(),
  },
});
