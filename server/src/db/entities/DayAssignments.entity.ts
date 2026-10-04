import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DayAssignmentsRepository } from '../repositories/DayAssignments.repository';
import { DbTimestampType } from '../types';
import { AssignmentParticipants } from './AssignmentParticipants.entity';
import { Days } from './Days.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { RoadtripDayBoundaries } from './RoadtripDayBoundaries.entity';

export class DayAssignments {
  [EntityRepositoryType]?: DayAssignmentsRepository;
  id!: number & Opt;
  day!: Ref<Days>;
  day_id!: number;
  place!: Ref<Places>;
  place_id!: number;
  order_index?: number | null = 0;
  notes?: string | null;
  reservation_status?: string | null = 'none';
  reservation_notes?: string | null;
  reservation_datetime?: string | null;
  created_at?: string | null;
  assignment_time?: string | null;
  assignment_end_time?: string | null;
  leg_transport_mode?: string | null;
  incoming_leg_transport_mode?: string | null;
  end_day: number & Opt = 0;
  accommodation_id?: number | null;
  route_excluded: number & Opt = 0;
  assignment_participants_collection = new Collection<AssignmentParticipants>(this);
  file_links_collection = new Collection<FileLinks>(this);
  reservations_collection = new Collection<Reservations>(this);
  roadtrip_day_boundaries_collection = new Collection<RoadtripDayBoundaries>(this);
  roadtrip_day_boundaries_collection1 = new Collection<RoadtripDayBoundaries>(this);
}

export const DayAssignmentsSchema = defineEntity({
  class: DayAssignments,
  repository: () => DayAssignmentsRepository,
  properties: {
    id: p.integer().primary(),
    day: () => p.manyToOne(Days).ref().deleteRule('cascade').hidden().index('idx_day_assignments_day_id'),
    day_id: p.integer().persist(false).index('idx_day_assignments_day_id'),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').hidden().index('idx_day_assignments_place_id'),
    place_id: p.integer().persist(false).index('idx_day_assignments_place_id'),
    order_index: p.integer().nullable(),
    notes: p.text().nullable(),
    reservation_status: p.text().nullable(),
    reservation_notes: p.text().nullable(),
    reservation_datetime: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    assignment_time: p.text().nullable(),
    assignment_end_time: p.text().nullable(),
    leg_transport_mode: p.text().nullable(),
    incoming_leg_transport_mode: p.text().nullable(),
    end_day: p.integer().default(0),
    accommodation_id: p.integer().nullable().index('idx_day_assignments_accommodation_id'),
    route_excluded: p.integer().default(0),
    assignment_participants_collection: () => p.oneToMany(AssignmentParticipants).mappedBy('assignment').hidden(),
    file_links_collection: () => p.oneToMany(FileLinks).mappedBy('assignment').hidden(),
    reservations_collection: () => p.oneToMany(Reservations).mappedBy('assignment').hidden(),
    roadtrip_day_boundaries_collection: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('fromAssignment').hidden(),
    roadtrip_day_boundaries_collection1: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('toAssignment').hidden(),
  },
});
