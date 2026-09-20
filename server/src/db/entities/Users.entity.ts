import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { AssignmentParticipants } from './AssignmentParticipants.entity';
import { AuditLog } from './AuditLog.entity';
import { BucketList } from './BucketList.entity';
import { BudgetItemMembers } from './BudgetItemMembers.entity';
import { BudgetItemPayers } from './BudgetItemPayers.entity';
import { BudgetItems } from './BudgetItems.entity';
import { BudgetSettlements } from './BudgetSettlements.entity';
import { Categories } from './Categories.entity';
import { CollabLinks } from './CollabLinks.entity';
import { CollabMessageReactions } from './CollabMessageReactions.entity';
import { CollabMessages } from './CollabMessages.entity';
import { CollabNotes } from './CollabNotes.entity';
import { CollabPollVotes } from './CollabPollVotes.entity';
import { CollabPolls } from './CollabPolls.entity';
import { CollectionMembers } from './CollectionMembers.entity';
import { CollectionPlaceRatings } from './CollectionPlaceRatings.entity';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Collections } from './Collections.entity';
import { DawarichConnections } from './DawarichConnections.entity';
import { DawarichVisitSuggestions } from './DawarichVisitSuggestions.entity';
import { HiddenCountries } from './HiddenCountries.entity';
import { HiddenRegions } from './HiddenRegions.entity';
import { IdempotencyKeys } from './IdempotencyKeys.entity';
import { InviteTokens } from './InviteTokens.entity';
import { JourneyBooks } from './JourneyBooks.entity';
import { JourneyContributors } from './JourneyContributors.entity';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyShareTokens } from './JourneyShareTokens.entity';
import { Journeys } from './Journeys.entity';
import { McpTokens } from './McpTokens.entity';
import { NotificationChannelPreferences } from './NotificationChannelPreferences.entity';
import { Notifications } from './Notifications.entity';
import { OauthClients } from './OauthClients.entity';
import { OauthConsents } from './OauthConsents.entity';
import { OauthTokens } from './OauthTokens.entity';
import { PackingBags } from './PackingBags.entity';
import { PackingCategoryAssignees } from './PackingCategoryAssignees.entity';
import { PackingItemContributors } from './PackingItemContributors.entity';
import { PackingItems } from './PackingItems.entity';
import { PackingTemplates } from './PackingTemplates.entity';
import { PasswordResetTokens } from './PasswordResetTokens.entity';
import { PlaceRatings } from './PlaceRatings.entity';
import { ReservationTravelers } from './ReservationTravelers.entity';
import { Settings } from './Settings.entity';
import { ShareTokens } from './ShareTokens.entity';
import { Tags } from './Tags.entity';
import { TodoCategoryAssignees } from './TodoCategoryAssignees.entity';
import { TodoItems } from './TodoItems.entity';
import { TrekPhotos } from './TrekPhotos.entity';
import { TripAlbumLinks } from './TripAlbumLinks.entity';
import { TripFiles } from './TripFiles.entity';
import { TripInviteTokens } from './TripInviteTokens.entity';
import { TripMembers } from './TripMembers.entity';
import { TripPhotos } from './TripPhotos.entity';
import { Trips } from './Trips.entity';
import { UserNoticeDismissals } from './UserNoticeDismissals.entity';
import { VacayEntries } from './VacayEntries.entity';
import { VacayPlanMembers } from './VacayPlanMembers.entity';
import { VacayPlans } from './VacayPlans.entity';
import { VacayShares } from './VacayShares.entity';
import { VacayUserColors } from './VacayUserColors.entity';
import { VacayUserSettings } from './VacayUserSettings.entity';
import { VacayUserYears } from './VacayUserYears.entity';
import { VisitedCountries } from './VisitedCountries.entity';
import { VisitedRegions } from './VisitedRegions.entity';
import { WebauthnChallenges } from './WebauthnChallenges.entity';
import { WebauthnCredentials } from './WebauthnCredentials.entity';

export class Users {
  id?: number | null;
  username!: string;
  email!: string;
  passwordHash!: string;
  role: string & Opt = 'user';
  mapsApiKey?: string | null;
  unsplashApiKey?: string | null;
  amapApiKey?: string | null;
  openweatherApiKey?: string | null;
  avatar?: string | null;
  oidcSub?: string | null;
  oidcIssuer?: string | null;
  lastLogin?: Date | null;
  mfaEnabled?: number | null = 0;
  mfaSecret?: string | null;
  mfaBackupCodes?: string | null;
  immichUrl?: string | null;
  immichAccessToken?: string | null;
  synologyUrl?: string | null;
  synologyUsername?: string | null;
  synologyPassword?: string | null;
  synologySid?: string | null;
  mustChangePassword?: number | null = 0;
  passwordVersion: number & Opt = 0;
  feedToken?: string | null;
  isGuest: number & Opt = 0;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  immichApiKey?: string | null;
  synologySkipSsl: number & Opt = 0;
  synologyDid?: string | null;
  firstSeenVersion: string & Opt = '0.0.0';
  loginCount: number & Opt = 0;
  immichAutoUpload: number & Opt = 0;
  airtrailUrl?: string | null;
  airtrailApiKey?: string | null;
  airtrailAllowInsecureTls?: number | null = 0;
  airtrailWriteEnabled?: number | null = 0;
  displayName?: string | null;
  assignmentParticipantsCollection = new Collection<AssignmentParticipants>(this);
  auditLogCollection = new Collection<AuditLog>(this);
  bucketListCollection = new Collection<BucketList>(this);
  budgetItemMembersCollection = new Collection<BudgetItemMembers>(this);
  budgetItemPayersCollection = new Collection<BudgetItemPayers>(this);
  budgetItemsCollection = new Collection<BudgetItems>(this);
  budgetSettlementsCollection = new Collection<BudgetSettlements>(this);
  budgetSettlementsCollection1 = new Collection<BudgetSettlements>(this);
  budgetSettlementsCollection2 = new Collection<BudgetSettlements>(this);
  categoriesCollection = new Collection<Categories>(this);
  collabLinksCollection = new Collection<CollabLinks>(this);
  collabMessageReactionsCollection = new Collection<CollabMessageReactions>(this);
  collabMessagesCollection = new Collection<CollabMessages>(this);
  collabNotesCollection = new Collection<CollabNotes>(this);
  collabPollVotesCollection = new Collection<CollabPollVotes>(this);
  collabPollsCollection = new Collection<CollabPolls>(this);
  collectionMembersCollection = new Collection<CollectionMembers>(this);
  collectionPlaceRatingsCollection = new Collection<CollectionPlaceRatings>(this);
  collectionPlacesCollection = new Collection<CollectionPlaces>(this);
  collectionPlacesCollection1 = new Collection<CollectionPlaces>(this);
  collectionsCollection = new Collection<Collections>(this);
  dawarichConnections: Ref<DawarichConnections> | null = null;
  dawarichVisitSuggestionsCollection = new Collection<DawarichVisitSuggestions>(this);
  hiddenCountriesCollection = new Collection<HiddenCountries>(this);
  hiddenRegionsCollection = new Collection<HiddenRegions>(this);
  idempotencyKeysCollection = new Collection<IdempotencyKeys>(this);
  inviteTokensCollection = new Collection<InviteTokens>(this);
  journeyBooksCollection = new Collection<JourneyBooks>(this);
  journeyBooksCollection1 = new Collection<JourneyBooks>(this);
  journeyContributorsCollection = new Collection<JourneyContributors>(this);
  journeyEntriesCollection = new Collection<JourneyEntries>(this);
  journeyShareTokensCollection = new Collection<JourneyShareTokens>(this);
  journeysCollection = new Collection<Journeys>(this);
  mcpTokensCollection = new Collection<McpTokens>(this);
  notificationChannelPreferencesCollection = new Collection<NotificationChannelPreferences>(this);
  notificationsCollection = new Collection<Notifications>(this);
  notificationsCollection1 = new Collection<Notifications>(this);
  oauthClientsCollection = new Collection<OauthClients>(this);
  oauthConsentsCollection = new Collection<OauthConsents>(this);
  oauthTokensCollection = new Collection<OauthTokens>(this);
  packingBagsCollection = new Collection<PackingBags>(this);
  packingBagMembersInverse = new Collection<PackingBags>(this);
  packingCategoryAssigneesCollection = new Collection<PackingCategoryAssignees>(this);
  packingItemContributorsCollection = new Collection<PackingItemContributors>(this);
  packingItemsCollection = new Collection<PackingItems>(this);
  packingItemContributorsInverse = new Collection<PackingItems>(this);
  packingItemRecipientsInverse = new Collection<PackingItems>(this);
  packingTemplatesCollection = new Collection<PackingTemplates>(this);
  passwordResetTokensCollection = new Collection<PasswordResetTokens>(this);
  placeRatingsCollection = new Collection<PlaceRatings>(this);
  reservationTravelersCollection = new Collection<ReservationTravelers>(this);
  settingsCollection = new Collection<Settings>(this);
  shareTokensCollection = new Collection<ShareTokens>(this);
  tagsCollection = new Collection<Tags>(this);
  todoCategoryAssigneesCollection = new Collection<TodoCategoryAssignees>(this);
  todoItemsCollection = new Collection<TodoItems>(this);
  trekPhotosCollection = new Collection<TrekPhotos>(this);
  tripAlbumLinksCollection = new Collection<TripAlbumLinks>(this);
  tripFilesCollection = new Collection<TripFiles>(this);
  tripInviteTokensCollection = new Collection<TripInviteTokens>(this);
  tripMembersCollection = new Collection<TripMembers>(this);
  tripMembersCollection1 = new Collection<TripMembers>(this);
  tripPhotosCollection = new Collection<TripPhotos>(this);
  tripsCollection = new Collection<Trips>(this);
  userNoticeDismissalsCollection = new Collection<UserNoticeDismissals>(this);
  vacayEntriesCollection = new Collection<VacayEntries>(this);
  vacayPlanMembersCollection = new Collection<VacayPlanMembers>(this);
  vacayPlansCollection = new Collection<VacayPlans>(this);
  vacaySharesCollection = new Collection<VacayShares>(this);
  vacaySharesCollection1 = new Collection<VacayShares>(this);
  vacayUserColorsCollection = new Collection<VacayUserColors>(this);
  vacayUserSettings: Ref<VacayUserSettings> | null = null;
  vacayUserYearsCollection = new Collection<VacayUserYears>(this);
  visitedCountriesCollection = new Collection<VisitedCountries>(this);
  visitedRegionsCollection = new Collection<VisitedRegions>(this);
  webauthnChallengesCollection = new Collection<WebauthnChallenges>(this);
  webauthnCredentialsCollection = new Collection<WebauthnCredentials>(this);
}

export class UsersRepository extends EntityRepository<Users> {}

export const UsersSchema = defineEntity({
  class: Users,
  repository: () => UsersRepository,
  uniques: [
    {
      name: 'idx_users_feed_token',
      where: 'feed_token IS NOT NULL',
      properties: ['feedToken'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    username: p.text(),
    email: p.text().index('idx_users_email'),
    passwordHash: p.text(),
    role: p.text(),
    mapsApiKey: p.text().nullable(),
    unsplashApiKey: p.text().nullable(),
    amapApiKey: p.text().nullable(),
    openweatherApiKey: p.text().nullable(),
    avatar: p.text().nullable(),
    oidcSub: p.text().nullable(),
    oidcIssuer: p.text().nullable(),
    lastLogin: p.datetime().nullable(),
    mfaEnabled: p.integer().nullable(),
    mfaSecret: p.text().nullable(),
    mfaBackupCodes: p.text().nullable(),
    immichUrl: p.text().nullable(),
    immichAccessToken: p.text().nullable(),
    synologyUrl: p.text().nullable(),
    synologyUsername: p.text().nullable(),
    synologyPassword: p.text().nullable(),
    synologySid: p.text().nullable(),
    mustChangePassword: p.integer().nullable(),
    passwordVersion: p.integer(),
    feedToken: p.text().nullable(),
    isGuest: p.integer(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    immichApiKey: p.text().nullable(),
    synologySkipSsl: p.integer(),
    synologyDid: p.text().nullable(),
    firstSeenVersion: p.text(),
    loginCount: p.integer(),
    immichAutoUpload: p.integer(),
    airtrailUrl: p.text().nullable(),
    airtrailApiKey: p.text().nullable(),
    airtrailAllowInsecureTls: p.integer().nullable(),
    airtrailWriteEnabled: p.integer().nullable(),
    displayName: p.text().nullable(),
    assignmentParticipantsCollection: () => p.oneToMany(AssignmentParticipants).mappedBy('user'),
    auditLogCollection: () => p.oneToMany(AuditLog).mappedBy('user'),
    bucketListCollection: () => p.oneToMany(BucketList).mappedBy('user'),
    budgetItemMembersCollection: () => p.oneToMany(BudgetItemMembers).mappedBy('user'),
    budgetItemPayersCollection: () => p.oneToMany(BudgetItemPayers).mappedBy('user'),
    budgetItemsCollection: () => p.oneToMany(BudgetItems).mappedBy('paidByUser'),
    budgetSettlementsCollection: () => p.oneToMany(BudgetSettlements).mappedBy('fromUser'),
    budgetSettlementsCollection1: () => p.oneToMany(BudgetSettlements).mappedBy('toUser'),
    budgetSettlementsCollection2: () => p.oneToMany(BudgetSettlements).mappedBy('createdByUser'),
    categoriesCollection: () => p.oneToMany(Categories).mappedBy('user'),
    collabLinksCollection: () => p.oneToMany(CollabLinks).mappedBy('user'),
    collabMessageReactionsCollection: () => p.oneToMany(CollabMessageReactions).mappedBy('user'),
    collabMessagesCollection: () => p.oneToMany(CollabMessages).mappedBy('user'),
    collabNotesCollection: () => p.oneToMany(CollabNotes).mappedBy('user'),
    collabPollVotesCollection: () => p.oneToMany(CollabPollVotes).mappedBy('user'),
    collabPollsCollection: () => p.oneToMany(CollabPolls).mappedBy('user'),
    collectionMembersCollection: () => p.oneToMany(CollectionMembers).mappedBy('user'),
    collectionPlaceRatingsCollection: () => p.oneToMany(CollectionPlaceRatings).mappedBy('user'),
    collectionPlacesCollection: () => p.oneToMany(CollectionPlaces).mappedBy('owner'),
    collectionPlacesCollection1: () => p.oneToMany(CollectionPlaces).mappedBy('savedBy'),
    collectionsCollection: () => p.oneToMany(Collections).mappedBy('owner'),
    dawarichConnections: () => p.oneToOne(DawarichConnections).ref().mappedBy('user'),
    dawarichVisitSuggestionsCollection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('user'),
    hiddenCountriesCollection: () => p.oneToMany(HiddenCountries).mappedBy('user'),
    hiddenRegionsCollection: () => p.oneToMany(HiddenRegions).mappedBy('user'),
    idempotencyKeysCollection: () => p.oneToMany(IdempotencyKeys).mappedBy('user'),
    inviteTokensCollection: () => p.oneToMany(InviteTokens).mappedBy('createdBy'),
    journeyBooksCollection: () => p.oneToMany(JourneyBooks).mappedBy('createdBy'),
    journeyBooksCollection1: () => p.oneToMany(JourneyBooks).mappedBy('updatedBy'),
    journeyContributorsCollection: () => p.oneToMany(JourneyContributors).mappedBy('user'),
    journeyEntriesCollection: () => p.oneToMany(JourneyEntries).mappedBy('author'),
    journeyShareTokensCollection: () => p.oneToMany(JourneyShareTokens).mappedBy('createdBy'),
    journeysCollection: () => p.oneToMany(Journeys).mappedBy('user'),
    mcpTokensCollection: () => p.oneToMany(McpTokens).mappedBy('user'),
    notificationChannelPreferencesCollection: () => p.oneToMany(NotificationChannelPreferences).mappedBy('user'),
    notificationsCollection: () => p.oneToMany(Notifications).mappedBy('sender'),
    notificationsCollection1: () => p.oneToMany(Notifications).mappedBy('recipient'),
    oauthClientsCollection: () => p.oneToMany(OauthClients).mappedBy('user'),
    oauthConsentsCollection: () => p.oneToMany(OauthConsents).mappedBy('user'),
    oauthTokensCollection: () => p.oneToMany(OauthTokens).mappedBy('user'),
    packingBagsCollection: () => p.oneToMany(PackingBags).mappedBy('user'),
    packingBagMembersInverse: () => p.manyToMany(PackingBags).mappedBy('packingBagMembers'),
    packingCategoryAssigneesCollection: () => p.oneToMany(PackingCategoryAssignees).mappedBy('user'),
    packingItemContributorsCollection: () => p.oneToMany(PackingItemContributors).mappedBy('user'),
    packingItemsCollection: () => p.oneToMany(PackingItems).mappedBy('owner'),
    packingItemContributorsInverse: () => p.manyToMany(PackingItems).mappedBy('packingItemContributors'),
    packingItemRecipientsInverse: () => p.manyToMany(PackingItems).mappedBy('packingItemRecipients'),
    packingTemplatesCollection: () => p.oneToMany(PackingTemplates).mappedBy('createdBy'),
    passwordResetTokensCollection: () => p.oneToMany(PasswordResetTokens).mappedBy('user'),
    placeRatingsCollection: () => p.oneToMany(PlaceRatings).mappedBy('user'),
    reservationTravelersCollection: () => p.oneToMany(ReservationTravelers).mappedBy('user'),
    settingsCollection: () => p.oneToMany(Settings).mappedBy('user'),
    shareTokensCollection: () => p.oneToMany(ShareTokens).mappedBy('createdBy'),
    tagsCollection: () => p.oneToMany(Tags).mappedBy('user'),
    todoCategoryAssigneesCollection: () => p.oneToMany(TodoCategoryAssignees).mappedBy('user'),
    todoItemsCollection: () => p.oneToMany(TodoItems).mappedBy('assignedUser'),
    trekPhotosCollection: () => p.oneToMany(TrekPhotos).mappedBy('owner'),
    tripAlbumLinksCollection: () => p.oneToMany(TripAlbumLinks).mappedBy('user'),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('uploadedBy'),
    tripInviteTokensCollection: () => p.oneToMany(TripInviteTokens).mappedBy('createdBy'),
    tripMembersCollection: () => p.oneToMany(TripMembers).mappedBy('user'),
    tripMembersCollection1: () => p.oneToMany(TripMembers).mappedBy('invitedBy'),
    tripPhotosCollection: () => p.oneToMany(TripPhotos).mappedBy('user'),
    tripsCollection: () => p.oneToMany(Trips).mappedBy('user'),
    userNoticeDismissalsCollection: () => p.oneToMany(UserNoticeDismissals).mappedBy('user'),
    vacayEntriesCollection: () => p.oneToMany(VacayEntries).mappedBy('user'),
    vacayPlanMembersCollection: () => p.oneToMany(VacayPlanMembers).mappedBy('user'),
    vacayPlansCollection: () => p.oneToMany(VacayPlans).mappedBy('owner'),
    vacaySharesCollection: () => p.oneToMany(VacayShares).mappedBy('owner'),
    vacaySharesCollection1: () => p.oneToMany(VacayShares).mappedBy('user'),
    vacayUserColorsCollection: () => p.oneToMany(VacayUserColors).mappedBy('user'),
    vacayUserSettings: () => p.oneToOne(VacayUserSettings).ref().mappedBy('user'),
    vacayUserYearsCollection: () => p.oneToMany(VacayUserYears).mappedBy('user'),
    visitedCountriesCollection: () => p.oneToMany(VisitedCountries).mappedBy('user'),
    visitedRegionsCollection: () => p.oneToMany(VisitedRegions).mappedBy('user'),
    webauthnChallengesCollection: () => p.oneToMany(WebauthnChallenges).mappedBy('user'),
    webauthnCredentialsCollection: () => p.oneToMany(WebauthnCredentials).mappedBy('user'),
  },
});
