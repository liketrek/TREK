import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripJournalLinksRepository } from '../repositories/TripJournalLinks.repository';
import { Journeys } from './Journeys.entity';
import { TripJournalLinkMembers } from './TripJournalLinkMembers.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripJournalLinks {
  [EntityRepositoryType]?: TripJournalLinksRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  journey!: Ref<Journeys>;
  journey_id!: number;
  linked_by?: number | null;
  created_at!: number;
  linkedByRef?: Ref<Users> | null;
  trip_journal_link_members_collection = new Collection<TripJournalLinkMembers>(this);
}

export const TripJournalLinksSchema = defineEntity({
  class: TripJournalLinks,
  repository: () => TripJournalLinksRepository,
  uniques: [{ properties: ['trip'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden().index('idx_trip_journal_links_journey'),
    journey_id: p.integer().persist(false).index('idx_trip_journal_links_journey'),
    linked_by: p.integer().nullable().persist(false).index('idx_trip_journal_links_linked_by'),
    created_at: p.integer(),
    linkedByRef: () => p.manyToOne(Users).ref().joinColumn('linked_by').nullable().hidden().index('idx_trip_journal_links_linked_by'),
    trip_journal_link_members_collection: () => p.oneToMany(TripJournalLinkMembers).mappedBy('link').hidden(),
  },
});
