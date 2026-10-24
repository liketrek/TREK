import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourActivitiesRepository } from '../repositories/TourActivities.repository';
import { DbTimestampType } from '../types';
import { DayAssignments } from './DayAssignments.entity';
import { Tours } from './Tours.entity';
import { Users } from './Users.entity';

export class TourActivities {
  [EntityRepositoryType]?: TourActivitiesRepository;
  id!: number & Opt;
  place!: Ref<Tours>;
  place_id!: number;
  trackPlace!: Ref<Tours>;
  track_place_id!: number;
  assignment?: Ref<DayAssignments> | null;
  assignment_id?: number | null;
  assigned_by?: number | null;
  assigned_at!: string & Opt;
  assignedByRef?: Ref<Users> | null;
}

export const TourActivitiesSchema = defineEntity({
  class: TourActivities,
  repository: () => TourActivitiesRepository,
  uniques: [
    {
      name: 'idx_tour_activities_assignment',
      where: 'assignment_id IS NOT NULL',
      properties: ['assignment_id'],
    },
    { properties: ['trackPlace'] },
  ],
  properties: {
    id: p.integer().primary(),
    place: () => p.manyToOne(Tours).ref().name('place_id').deleteRule('cascade').hidden().index('idx_tour_activities_place'),
    place_id: p.integer().persist(false).index('idx_tour_activities_place'),
    trackPlace: () => p.manyToOne(Tours).ref().joinColumn('track_place_id').deleteRule('cascade').hidden(),
    track_place_id: p.integer().persist(false),
    assignment: () => p.manyToOne(DayAssignments).ref().nullable().hidden(),
    assignment_id: p.integer().nullable().persist(false),
    assigned_by: p.integer().nullable().persist(false).index('idx_tour_activities_assigned_by'),
    assigned_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    assignedByRef: () => p.manyToOne(Users).ref().joinColumn('assigned_by').nullable().hidden().index('idx_tour_activities_assigned_by'),
  },
});
