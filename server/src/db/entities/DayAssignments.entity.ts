import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { AssignmentParticipants } from './AssignmentParticipants.entity';
import { Days } from './Days.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { RoadtripDayBoundaries } from './RoadtripDayBoundaries.entity';

export class DayAssignments {
  id?: number | null;
  day!: Ref<Days>;
  place!: Ref<Places>;
  orderIndex?: number | null = 0;
  notes?: string | null;
  reservationStatus?: string | null = 'none';
  reservationNotes?: string | null;
  reservationDatetime?: string | null;
  createdAt?: Date | null;
  assignmentTime?: string | null;
  assignmentEndTime?: string | null;
  legTransportMode?: string | null;
  incomingLegTransportMode?: string | null;
  endDay: number & Opt = 0;
  accommodationId?: number | null;
  assignmentParticipantsCollection = new Collection<AssignmentParticipants>(this);
  fileLinksCollection = new Collection<FileLinks>(this);
  reservationsCollection = new Collection<Reservations>(this);
  roadtripDayBoundariesCollection = new Collection<RoadtripDayBoundaries>(this);
  roadtripDayBoundariesCollection1 = new Collection<RoadtripDayBoundaries>(this);
}

export class DayAssignmentsRepository extends EntityRepository<DayAssignments> {}

export const DayAssignmentsSchema = defineEntity({
  class: DayAssignments,
  repository: () => DayAssignmentsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    day: () => p.manyToOne(Days).ref().deleteRule('cascade').index('idx_day_assignments_day_id'),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').index('idx_day_assignments_place_id'),
    orderIndex: p.integer().nullable(),
    notes: p.text().nullable(),
    reservationStatus: p.text().nullable(),
    reservationNotes: p.text().nullable(),
    reservationDatetime: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    assignmentTime: p.text().nullable(),
    assignmentEndTime: p.text().nullable(),
    legTransportMode: p.text().nullable(),
    incomingLegTransportMode: p.text().nullable(),
    endDay: p.integer(),
    accommodationId: p.integer().nullable().index('idx_day_assignments_accommodation_id'),
    assignmentParticipantsCollection: () => p.oneToMany(AssignmentParticipants).mappedBy('assignment'),
    fileLinksCollection: () => p.oneToMany(FileLinks).mappedBy('assignment'),
    reservationsCollection: () => p.oneToMany(Reservations).mappedBy('assignment'),
    roadtripDayBoundariesCollection: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('fromAssignment'),
    roadtripDayBoundariesCollection1: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('toAssignment'),
  },
});
