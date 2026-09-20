import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { BudgetItems } from './BudgetItems.entity';
import { DayAssignments } from './DayAssignments.entity';
import { Days } from './Days.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { ReservationDayPositions } from './ReservationDayPositions.entity';
import { ReservationEndpoints } from './ReservationEndpoints.entity';
import { ReservationTravelers } from './ReservationTravelers.entity';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';

export class Reservations {
  id?: number | null;
  trip!: Ref<Trips>;
  day?: Ref<Days> | null;
  endDay?: Ref<Days> | null;
  place?: Ref<Places> | null;
  assignment?: Ref<DayAssignments> | null;
  title!: string;
  accommodationId?: string | null;
  reservationTime?: string | null;
  reservationEndTime?: string | null;
  location?: string | null;
  confirmationNumber?: string | null;
  notes?: string | null;
  status?: string | null = 'pending';
  type?: string | null = 'other';
  createdAt?: Date | null;
  metadata?: string | null;
  dayPlanPosition?: unknown | null;
  needsReview: number & Opt = 0;
  externalSource?: string | null;
  externalId?: string | null;
  externalOwnerUserId?: number | null;
  externalSyncedAt?: string | null;
  syncEnabled?: number | null = 1;
  externalHash?: string | null;
  url?: string | null;
  ingestState: string & Opt = 'live';
  budgetItemsCollection = new Collection<BudgetItems>(this);
  fileLinksCollection = new Collection<FileLinks>(this);
  reservationDayPositionsCollection = new Collection<ReservationDayPositions>(this);
  reservationEndpointsCollection = new Collection<ReservationEndpoints>(this);
  reservationTravelersCollection = new Collection<ReservationTravelers>(this);
  tripFilesCollection = new Collection<TripFiles>(this);
}

export class ReservationsRepository extends EntityRepository<Reservations> {}

export const ReservationsSchema = defineEntity({
  class: Reservations,
  repository: () => ReservationsRepository,
  uniques: [
    {
      name: 'idx_reservations_external',
      properties: ['externalSource', 'externalId', 'trip'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_reservations_trip_id'),
    day: () => p.manyToOne(Days).ref().nullable().index('idx_reservations_day_id'),
    endDay: () => p.manyToOne(Days).ref().nullable(),
    place: () => p.manyToOne(Places).ref().nullable(),
    assignment: () => p.manyToOne(DayAssignments).ref().nullable(),
    title: p.text(),
    accommodationId: p.text().nullable(),
    reservationTime: p.text().nullable(),
    reservationEndTime: p.text().nullable(),
    location: p.text().nullable(),
    confirmationNumber: p.text().nullable(),
    notes: p.text().nullable(),
    status: p.text().nullable(),
    type: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    metadata: p.text().nullable(),
    dayPlanPosition: p.double().nullable(),
    needsReview: p.integer(),
    externalSource: p.text().nullable(),
    externalId: p.text().nullable(),
    externalOwnerUserId: p.integer().nullable(),
    externalSyncedAt: p.text().nullable(),
    syncEnabled: p.integer().nullable(),
    externalHash: p.text().nullable(),
    url: p.text().nullable(),
    ingestState: p.text(),
    budgetItemsCollection: () => p.oneToMany(BudgetItems).mappedBy('reservation'),
    fileLinksCollection: () => p.oneToMany(FileLinks).mappedBy('reservation'),
    reservationDayPositionsCollection: () => p.oneToMany(ReservationDayPositions).mappedBy('reservation'),
    reservationEndpointsCollection: () => p.oneToMany(ReservationEndpoints).mappedBy('reservation'),
    reservationTravelersCollection: () => p.oneToMany(ReservationTravelers).mappedBy('reservation'),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('reservation'),
  },
});
