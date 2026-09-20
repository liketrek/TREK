import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
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
import { TripFiles } from './TripFiles.entity';
import { TripInviteTokens } from './TripInviteTokens.entity';
import { TripMembers } from './TripMembers.entity';
import { TripPhotos } from './TripPhotos.entity';
import { Users } from './Users.entity';

export class Trips {
  id?: number | null;
  user!: Ref<Users>;
  title!: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  currency?: string | null = 'EUR';
  coverImage?: string | null;
  isArchived?: number | null = 0;
  reminderDays?: number | null = 3;
  feedToken?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  budgetCategoryOrderCollection = new Collection<BudgetCategoryOrder>(this);
  budgetItemsCollection = new Collection<BudgetItems>(this);
  budgetSettlementsCollection = new Collection<BudgetSettlements>(this);
  collabLinksCollection = new Collection<CollabLinks>(this);
  collabMessagesCollection = new Collection<CollabMessages>(this);
  collabNotesCollection = new Collection<CollabNotes>(this);
  collabPollsCollection = new Collection<CollabPolls>(this);
  dawarichVisitSuggestionsCollection = new Collection<DawarichVisitSuggestions>(this);
  dayAccommodationsCollection = new Collection<DayAccommodations>(this);
  dayNotesCollection = new Collection<DayNotes>(this);
  daysCollection = new Collection<Days>(this);
  inviteTokensCollection = new Collection<InviteTokens>(this);
  journeyEntriesCollection = new Collection<JourneyEntries>(this);
  journeyTripsCollection = new Collection<JourneyTrips>(this);
  packingBagsCollection = new Collection<PackingBags>(this);
  packingCategoryAssigneesCollection = new Collection<PackingCategoryAssignees>(this);
  packingItemsCollection = new Collection<PackingItems>(this);
  photosCollection = new Collection<Photos>(this);
  placesCollection = new Collection<Places>(this);
  reservationsCollection = new Collection<Reservations>(this);
  roadtripDayBoundariesCollection = new Collection<RoadtripDayBoundaries>(this);
  roadtripPreferencesCollection = new Collection<RoadtripPreferences>(this);
  shareTokensCollection = new Collection<ShareTokens>(this);
  todoCategoryAssigneesCollection = new Collection<TodoCategoryAssignees>(this);
  todoItemsCollection = new Collection<TodoItems>(this);
  tripAlbumLinksCollection = new Collection<TripAlbumLinks>(this);
  tripFilesCollection = new Collection<TripFiles>(this);
  tripInviteTokensCollection = new Collection<TripInviteTokens>(this);
  tripMembersCollection = new Collection<TripMembers>(this);
  tripPhotosCollection = new Collection<TripPhotos>(this);
}

export class TripsRepository extends EntityRepository<Trips> {}

export const TripsSchema = defineEntity({
  class: Trips,
  repository: () => TripsRepository,
  uniques: [
    {
      name: 'idx_trips_feed_token',
      where: 'feed_token IS NOT NULL',
      properties: ['feedToken'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_trips_user_id'),
    title: p.text(),
    description: p.text().nullable(),
    startDate: p.text().nullable(),
    endDate: p.text().nullable(),
    currency: p.text().nullable(),
    coverImage: p.text().nullable(),
    isArchived: p.integer().nullable(),
    reminderDays: p.integer().nullable(),
    feedToken: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()).index('idx_trips_created_at'),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    budgetCategoryOrderCollection: () => p.oneToMany(BudgetCategoryOrder).mappedBy('trip'),
    budgetItemsCollection: () => p.oneToMany(BudgetItems).mappedBy('trip'),
    budgetSettlementsCollection: () => p.oneToMany(BudgetSettlements).mappedBy('trip'),
    collabLinksCollection: () => p.oneToMany(CollabLinks).mappedBy('trip'),
    collabMessagesCollection: () => p.oneToMany(CollabMessages).mappedBy('trip'),
    collabNotesCollection: () => p.oneToMany(CollabNotes).mappedBy('trip'),
    collabPollsCollection: () => p.oneToMany(CollabPolls).mappedBy('trip'),
    dawarichVisitSuggestionsCollection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('trip'),
    dayAccommodationsCollection: () => p.oneToMany(DayAccommodations).mappedBy('trip'),
    dayNotesCollection: () => p.oneToMany(DayNotes).mappedBy('trip'),
    daysCollection: () => p.oneToMany(Days).mappedBy('trip'),
    inviteTokensCollection: () => p.oneToMany(InviteTokens).mappedBy('trip'),
    journeyEntriesCollection: () => p.oneToMany(JourneyEntries).mappedBy('sourceTrip'),
    journeyTripsCollection: () => p.oneToMany(JourneyTrips).mappedBy('trip'),
    packingBagsCollection: () => p.oneToMany(PackingBags).mappedBy('trip'),
    packingCategoryAssigneesCollection: () => p.oneToMany(PackingCategoryAssignees).mappedBy('trip'),
    packingItemsCollection: () => p.oneToMany(PackingItems).mappedBy('trip'),
    photosCollection: () => p.oneToMany(Photos).mappedBy('trip'),
    placesCollection: () => p.oneToMany(Places).mappedBy('trip'),
    reservationsCollection: () => p.oneToMany(Reservations).mappedBy('trip'),
    roadtripDayBoundariesCollection: () => p.oneToMany(RoadtripDayBoundaries).mappedBy('trip'),
    roadtripPreferencesCollection: () => p.oneToMany(RoadtripPreferences).mappedBy('trip'),
    shareTokensCollection: () => p.oneToMany(ShareTokens).mappedBy('trip'),
    todoCategoryAssigneesCollection: () => p.oneToMany(TodoCategoryAssignees).mappedBy('trip'),
    todoItemsCollection: () => p.oneToMany(TodoItems).mappedBy('trip'),
    tripAlbumLinksCollection: () => p.oneToMany(TripAlbumLinks).mappedBy('trip'),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('trip'),
    tripInviteTokensCollection: () => p.oneToMany(TripInviteTokens).mappedBy('trip'),
    tripMembersCollection: () => p.oneToMany(TripMembers).mappedBy('trip'),
    tripPhotosCollection: () => p.oneToMany(TripPhotos).mappedBy('trip'),
  },
});
