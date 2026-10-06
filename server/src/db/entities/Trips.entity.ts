import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripsRepository } from '../repositories/Trips.repository';
import { DbTimestampType } from '../types';
import { BudgetCategoryOrder } from './BudgetCategoryOrder.entity';
import { BudgetItems } from './BudgetItems.entity';
import { BudgetSettlements } from './BudgetSettlements.entity';
import { CollabLinks } from './CollabLinks.entity';
import { CollabMessages } from './CollabMessages.entity';
import { CollabNotes } from './CollabNotes.entity';
import { CollabPolls } from './CollabPolls.entity';
import { DawarichVisitSuggestions } from './DawarichVisitSuggestions.entity';
import { DayAccommodations } from './DayAccommodations.entity';
import { DayNotes } from './DayNotes.entity';
import { Days } from './Days.entity';
import { DocumentConnections } from './DocumentConnections.entity';
import { DocumentSyncItems } from './DocumentSyncItems.entity';
import { InviteTokens } from './InviteTokens.entity';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyTrips } from './JourneyTrips.entity';
import { PackingBags } from './PackingBags.entity';
import { PackingCategoryAssignees } from './PackingCategoryAssignees.entity';
import { PackingItems } from './PackingItems.entity';
import { Photos } from './Photos.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { RoadtripDayBoundaries } from './RoadtripDayBoundaries.entity';
import { RoadtripPreferences } from './RoadtripPreferences.entity';
import { ShareTokens } from './ShareTokens.entity';
import { TodoCategoryAssignees } from './TodoCategoryAssignees.entity';
import { TodoItems } from './TodoItems.entity';
import { TripAlbumLinks } from './TripAlbumLinks.entity';
import { TripDocumentLinks } from './TripDocumentLinks.entity';
import { TripFiles } from './TripFiles.entity';
import { TripInviteTokens } from './TripInviteTokens.entity';
import { TripMembers } from './TripMembers.entity';
import { TripPhotos } from './TripPhotos.entity';
import { Users } from './Users.entity';

export class Trips {
  [EntityRepositoryType]?: TripsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  title!: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  currency?: string | null = 'EUR';
  cover_image?: string | null;
  is_archived?: number | null = 0;
  reminder_days?: number | null = 3;
  feed_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  budget_category_order_collection = new Collection<BudgetCategoryOrder>(this);
  budget_items_collection = new Collection<BudgetItems>(this);
  budget_settlements_collection = new Collection<BudgetSettlements>(this);
  collab_links_collection = new Collection<CollabLinks>(this);
  collab_messages_collection = new Collection<CollabMessages>(this);
  collab_notes_collection = new Collection<CollabNotes>(this);
  collab_polls_collection = new Collection<CollabPolls>(this);
  dawarich_visit_suggestions_collection = new Collection<DawarichVisitSuggestions>(this);
  day_accommodations_collection = new Collection<DayAccommodations>(this);
  day_notes_collection = new Collection<DayNotes>(this);
  days_collection = new Collection<Days>(this);
  document_connections_collection = new Collection<DocumentConnections>(this);
  document_sync_items_collection = new Collection<DocumentSyncItems>(this);
  invite_tokens_collection = new Collection<InviteTokens>(this);
  journey_entries_collection = new Collection<JourneyEntries>(this);
  journey_trips_collection = new Collection<JourneyTrips>(this);
  packing_bags_collection = new Collection<PackingBags>(this);
  packing_category_assignees_collection = new Collection<PackingCategoryAssignees>(this);
  packing_items_collection = new Collection<PackingItems>(this);
  photos_collection = new Collection<Photos>(this);
  places_collection = new Collection<Places>(this);
  reservations_collection = new Collection<Reservations>(this);
  roadtrip_day_boundaries_collection = new Collection<RoadtripDayBoundaries>(this);
  roadtrip_preferences_collection = new Collection<RoadtripPreferences>(this);
  share_tokens_collection = new Collection<ShareTokens>(this);
  todo_category_assignees_collection = new Collection<TodoCategoryAssignees>(this);
  todo_items_collection = new Collection<TodoItems>(this);
  trip_album_links_collection = new Collection<TripAlbumLinks>(this);
  trip_document_links_collection = new Collection<TripDocumentLinks>(this);
  trip_files_collection = new Collection<TripFiles>(this);
  trip_invite_tokens_collection = new Collection<TripInviteTokens>(this);
  trip_members_collection = new Collection<TripMembers>(this);
  trip_photos_collection = new Collection<TripPhotos>(this);
}

export const TripsSchema = defineEntity({
  class: Trips,
  repository: () => TripsRepository,
  uniques: [
    {
      name: 'idx_trips_feed_token',
      where: 'feed_token IS NOT NULL',
      properties: ['feed_token'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_trips_user_id'),
    user_id: p.integer().persist(false).index('idx_trips_user_id'),
    title: p.text(),
    description: p.text().nullable(),
    start_date: p.text().nullable(),
    end_date: p.text().nullable(),
    currency: p.text().nullable(),
    cover_image: p.text().nullable(),
    is_archived: p.integer().nullable(),
    reminder_days: p.integer().nullable(),
    feed_token: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`).index('idx_trips_created_at'),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    budget_category_order_collection: () => p.oneToMany(BudgetCategoryOrder).mappedBy('trip').hidden(),
    budget_items_collection: () => p.oneToMany(BudgetItems).mappedBy('trip').hidden(),
    budget_settlements_collection: () => p.oneToMany(BudgetSettlements).mappedBy('trip').hidden(),
    collab_links_collection: () => p.oneToMany(CollabLinks).mappedBy('trip').hidden(),
    collab_messages_collection: () => p.oneToMany(CollabMessages).mappedBy('trip').hidden(),
    collab_notes_collection: () => p.oneToMany(CollabNotes).mappedBy('trip').hidden(),
    collab_polls_collection: () => p.oneToMany(CollabPolls).mappedBy('trip').hidden(),
    dawarich_visit_suggestions_collection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('trip').hidden(),
    day_accommodations_collection: () => p.oneToMany(DayAccommodations).mappedBy('trip').hidden(),
    day_notes_collection: () => p.oneToMany(DayNotes).mappedBy('trip').hidden(),
    days_collection: () => p.oneToMany(Days).mappedBy('trip').hidden(),
    document_connections_collection: () => p.oneToMany(DocumentConnections).mappedBy('trip').hidden(),
    document_sync_items_collection: () => p.oneToMany(DocumentSyncItems).mappedBy('trip').hidden(),
    invite_tokens_collection: () => p.oneToMany(InviteTokens).mappedBy('trip').hidden(),
    journey_entries_collection: () => p.oneToMany(JourneyEntries).mappedBy('sourceTrip').hidden(),
    journey_trips_collection: () => p.oneToMany(JourneyTrips).mappedBy('trip').hidden(),
    packing_bags_collection: () => p.oneToMany(PackingBags).mappedBy('trip').hidden(),
    packing_category_assignees_collection: () => p.oneToMany(PackingCategoryAssignees).mappedBy('trip').hidden(),
    packing_items_collection: () => p.oneToMany(PackingItems).mappedBy('trip').hidden(),
    photos_collection: () => p.oneToMany(Photos).mappedBy('trip').hidden(),
    places_collection: () => p.oneToMany(Places).mappedBy('trip').hidden(),
    reservations_collection: () => p.oneToMany(Reservations).mappedBy('trip').hidden(),
    roadtrip_day_boundaries_collection: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('trip').hidden(),
    roadtrip_preferences_collection: () => p.oneToMany(RoadtripPreferences).mappedBy('trip').hidden(),
    share_tokens_collection: () => p.oneToMany(ShareTokens).mappedBy('trip').hidden(),
    todo_category_assignees_collection: () => p.oneToMany(TodoCategoryAssignees).mappedBy('trip').hidden(),
    todo_items_collection: () => p.oneToMany(TodoItems).mappedBy('trip').hidden(),
    trip_album_links_collection: () => p.oneToMany(TripAlbumLinks).mappedBy('trip').hidden(),
    trip_document_links_collection: () => p.oneToMany(TripDocumentLinks).mappedBy('trip').hidden(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('trip').hidden(),
    trip_invite_tokens_collection: () => p.oneToMany(TripInviteTokens).mappedBy('trip').hidden(),
    trip_members_collection: () => p.oneToMany(TripMembers).mappedBy('trip').hidden(),
    trip_photos_collection: () => p.oneToMany(TripPhotos).mappedBy('trip').hidden(),
  },
});
