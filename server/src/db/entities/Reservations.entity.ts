import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ReservationsRepository } from '../repositories/Reservations.repository';
import { DbTimestampType } from '../types';
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
  [EntityRepositoryType]?: ReservationsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  day?: Ref<Days> | null;
  day_id?: number | null;
  endDay?: Ref<Days> | null;
  end_day_id?: number | null;
  place?: Ref<Places> | null;
  place_id?: number | null;
  assignment?: Ref<DayAssignments> | null;
  assignment_id?: number | null;
  title!: string;
  accommodation_id?: string | null;
  reservation_time?: string | null;
  reservation_end_time?: string | null;
  location?: string | null;
  confirmation_number?: string | null;
  notes?: string | null;
  status?: string | null = 'pending';
  type?: string | null = 'other';
  created_at?: string | null;
  metadata?: string | null;
  day_plan_position?: number | null;
  needs_review: number & Opt = 0;
  external_source?: string | null;
  external_id?: string | null;
  external_owner_user_id?: number | null;
  external_synced_at?: string | null;
  sync_enabled?: number | null = 1;
  external_hash?: string | null;
  url?: string | null;
  ingest_state: string & Opt = 'live';
  budget_items_collection = new Collection<BudgetItems>(this);
  file_links_collection = new Collection<FileLinks>(this);
  reservation_day_positions_collection = new Collection<ReservationDayPositions>(this);
  reservation_endpoints_collection = new Collection<ReservationEndpoints>(this);
  reservation_travelers_collection = new Collection<ReservationTravelers>(this);
  trip_files_collection = new Collection<TripFiles>(this);
}

export const ReservationsSchema = defineEntity({
  class: Reservations,
  repository: () => ReservationsRepository,
  uniques: [
    {
      name: 'idx_reservations_external',
      properties: ['external_source', 'external_id', 'trip_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_reservations_trip_id'),
    trip_id: p.integer().persist(false).index('idx_reservations_trip_id'),
    day: () => p.manyToOne(Days).ref().nullable().hidden().index('idx_reservations_day_id'),
    day_id: p.integer().nullable().persist(false).index('idx_reservations_day_id'),
    endDay: () => p.manyToOne(Days).ref().nullable().hidden(),
    end_day_id: p.integer().nullable().persist(false),
    place: () => p.manyToOne(Places).ref().nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    assignment: () => p.manyToOne(DayAssignments).ref().nullable().hidden(),
    assignment_id: p.integer().nullable().persist(false),
    title: p.text(),
    accommodation_id: p.text().nullable(),
    reservation_time: p.text().nullable(),
    reservation_end_time: p.text().nullable(),
    location: p.text().nullable(),
    confirmation_number: p.text().nullable(),
    notes: p.text().nullable(),
    status: p.text().nullable(),
    type: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    metadata: p.text().nullable(),
    day_plan_position: p.double().nullable().defaultRaw(`NULL`),
    needs_review: p.integer().default(0),
    external_source: p.text().nullable(),
    external_id: p.text().nullable(),
    external_owner_user_id: p.integer().nullable(),
    external_synced_at: p.text().nullable(),
    sync_enabled: p.integer().nullable(),
    external_hash: p.text().nullable(),
    url: p.text().nullable(),
    ingest_state: p.text().default('live'),
    budget_items_collection: () => p.oneToMany(BudgetItems).mappedBy('reservation').hidden(),
    file_links_collection: () => p.oneToMany(FileLinks).mappedBy('reservation').hidden(),
    reservation_day_positions_collection: () => p.oneToMany(ReservationDayPositions).mappedBy('reservation').hidden(),
    reservation_endpoints_collection: () => p.oneToMany(ReservationEndpoints).mappedBy('reservation').hidden(),
    reservation_travelers_collection: () => p.oneToMany(ReservationTravelers).mappedBy('reservation').hidden(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('reservation').hidden(),
  },
});
