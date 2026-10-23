import type { EntitySchema } from '@mikro-orm/core';
import { AddonsSchema } from './Addons.entity';
import { AppSettingsSchema } from './AppSettings.entity';
import { AssignmentParticipantsSchema } from './AssignmentParticipants.entity';
import { AuditLogSchema } from './AuditLog.entity';
import { BucketListSchema } from './BucketList.entity';
import { BudgetCategoryOrderSchema } from './BudgetCategoryOrder.entity';
import { BudgetItemMembersSchema } from './BudgetItemMembers.entity';
import { BudgetItemPayersSchema } from './BudgetItemPayers.entity';
import { BudgetItemsSchema } from './BudgetItems.entity';
import { BudgetSettlementsSchema } from './BudgetSettlements.entity';
import { CategoriesSchema } from './Categories.entity';
import { CollabLinksSchema } from './CollabLinks.entity';
import { CollabMessageReactionsSchema } from './CollabMessageReactions.entity';
import { CollabMessagesSchema } from './CollabMessages.entity';
import { CollabNotesSchema } from './CollabNotes.entity';
import { CollabPollVotesSchema } from './CollabPollVotes.entity';
import { CollabPollsSchema } from './CollabPolls.entity';
import { CollectionLabelsSchema } from './CollectionLabels.entity';
import { CollectionMembersSchema } from './CollectionMembers.entity';
import { CollectionPlaceRatingsSchema } from './CollectionPlaceRatings.entity';
import { CollectionPlacesSchema } from './CollectionPlaces.entity';
import { CollectionToursSchema } from './CollectionTours.entity';
import { CollectionsSchema } from './Collections.entity';
import { DawarichConnectionsSchema } from './DawarichConnections.entity';
import { DawarichVisitSuggestionsSchema } from './DawarichVisitSuggestions.entity';
import { DayAccommodationsSchema } from './DayAccommodations.entity';
import { DayAssignmentsSchema } from './DayAssignments.entity';
import { DayNotesSchema } from './DayNotes.entity';
import { DaysSchema } from './Days.entity';
import { DocumentConnectionsSchema } from './DocumentConnections.entity';
import { DocumentProviderFieldsSchema } from './DocumentProviderFields.entity';
import { DocumentProvidersSchema } from './DocumentProviders.entity';
import { DocumentSyncItemsSchema } from './DocumentSyncItems.entity';
import { FerrataTilesSchema } from './FerrataTiles.entity';
import { FileLinksSchema } from './FileLinks.entity';
import { GoogleApiUsageSchema } from './GoogleApiUsage.entity';
import { GooglePlacePhotoMetaSchema } from './GooglePlacePhotoMeta.entity';
import { HiddenCountriesSchema } from './HiddenCountries.entity';
import { HiddenRegionsSchema } from './HiddenRegions.entity';
import { IdempotencyKeysSchema } from './IdempotencyKeys.entity';
import { InviteTokensSchema } from './InviteTokens.entity';
import { JourneyBooksSchema } from './JourneyBooks.entity';
import { JourneyContributorsSchema } from './JourneyContributors.entity';
import { JourneyEntriesSchema } from './JourneyEntries.entity';
import { JourneyEntryPhotosSchema } from './JourneyEntryPhotos.entity';
import { JourneyEntryStaysSchema } from './JourneyEntryStays.entity';
import { JourneyPhotosSchema } from './JourneyPhotos.entity';
import { JourneyRecordedDaysSchema } from './JourneyRecordedDays.entity';
import { JourneyRecordingPrepSchema } from './JourneyRecordingPrep.entity';
import { JourneyShareTokensSchema } from './JourneyShareTokens.entity';
import { JourneyTripsSchema } from './JourneyTrips.entity';
import { JourneysSchema } from './Journeys.entity';
import { McpTokensSchema } from './McpTokens.entity';
import { MigrationsSchema } from './Migrations.entity';
import { NotificationChannelPreferencesSchema } from './NotificationChannelPreferences.entity';
import { NotificationsSchema } from './Notifications.entity';
import { OauthClientsSchema } from './OauthClients.entity';
import { OauthConsentsSchema } from './OauthConsents.entity';
import { OauthTokensSchema } from './OauthTokens.entity';
import { PackingBagsSchema } from './PackingBags.entity';
import { PackingCategoryAssigneesSchema } from './PackingCategoryAssignees.entity';
import { PackingItemContributorsSchema } from './PackingItemContributors.entity';
import { PackingItemsSchema } from './PackingItems.entity';
import { PackingTemplateCategoriesSchema } from './PackingTemplateCategories.entity';
import { PackingTemplateItemsSchema } from './PackingTemplateItems.entity';
import { PackingTemplatesSchema } from './PackingTemplates.entity';
import { PaddleFeaturesSchema } from './PaddleFeatures.entity';
import { PaddleRegionRequestsSchema } from './PaddleRegionRequests.entity';
import { PaddleRegionsSchema } from './PaddleRegions.entity';
import { PaddleWaterGraphsSchema } from './PaddleWaterGraphs.entity';
import { PasswordResetTokensSchema } from './PasswordResetTokens.entity';
import { PhotoProviderFieldsSchema } from './PhotoProviderFields.entity';
import { PhotoProvidersSchema } from './PhotoProviders.entity';
import { PhotosSchema } from './Photos.entity';
import { PlaceDetailsCacheSchema } from './PlaceDetailsCache.entity';
import { PlaceRatingsSchema } from './PlaceRatings.entity';
import { PlaceRegionsSchema } from './PlaceRegions.entity';
import { PlaceShadowPicksSchema } from './PlaceShadowPicks.entity';
import { PlacesSchema } from './Places.entity';
import { PluginActionsSchema } from './PluginActions.entity';
import { PluginCapabilityAuditSchema } from './PluginCapabilityAudit.entity';
import { PluginEgressHostsSchema } from './PluginEgressHosts.entity';
import { PluginEntityMetadataSchema } from './PluginEntityMetadata.entity';
import { PluginErrorLogSchema } from './PluginErrorLog.entity';
import { PluginMetaMigrationsSchema } from './PluginMetaMigrations.entity';
import { PluginOauthStateSchema } from './PluginOauthState.entity';
import { PluginOauthTokensSchema } from './PluginOauthTokens.entity';
import { PluginScheduledTasksSchema } from './PluginScheduledTasks.entity';
import { PluginSettingsFieldsSchema } from './PluginSettingsFields.entity';
import { PluginUserConfigSchema } from './PluginUserConfig.entity';
import { PluginUserErasureQueueSchema } from './PluginUserErasureQueue.entity';
import { PluginsSchema } from './Plugins.entity';
import { PushSubscriptionsSchema } from './PushSubscriptions.entity';
import { ReservationDayPositionsSchema } from './ReservationDayPositions.entity';
import { ReservationEndpointsSchema } from './ReservationEndpoints.entity';
import { ReservationTravelersSchema } from './ReservationTravelers.entity';
import { ReservationsSchema } from './Reservations.entity';
import { RoadtripDayBoundariesSchema } from './RoadtripDayBoundaries.entity';
import { RoadtripDayTracksSchema } from './RoadtripDayTracks.entity';
import { RoadtripPreferencesSchema } from './RoadtripPreferences.entity';
import { RoadtripViasSchema } from './RoadtripVias.entity';
import { RouteUsageDailySchema } from './RouteUsageDaily.entity';
import { SchedulerLeasesSchema } from './SchedulerLeases.entity';
import { SchemaVersionSchema } from './SchemaVersion.entity';
import { SchoolHolidayCountriesSchema } from './SchoolHolidayCountries.entity';
import { SchoolHolidayPeriodsSchema } from './SchoolHolidayPeriods.entity';
import { SchoolHolidayRegionsSchema } from './SchoolHolidayRegions.entity';
import { SettingsSchema } from './Settings.entity';
import { ShareTokensSchema } from './ShareTokens.entity';
import { TagsSchema } from './Tags.entity';
import { TodoCategoryAssigneesSchema } from './TodoCategoryAssignees.entity';
import { TodoItemsSchema } from './TodoItems.entity';
import { TourActivitiesSchema } from './TourActivities.entity';
import { TourActivityExclusionsSchema } from './TourActivityExclusions.entity';
import { TourChangeStepsSchema } from './TourChangeSteps.entity';
import { TourDraftsSchema } from './TourDrafts.entity';
import { TourObstacleReviewsSchema } from './TourObstacleReviews.entity';
import { TourPackingLinksSchema } from './TourPackingLinks.entity';
import { TourSourceHintsSchema } from './TourSourceHints.entity';
import { TourSourcesSchema } from './TourSources.entity';
import { TourStationVisitsSchema } from './TourStationVisits.entity';
import { TourTypesSchema } from './TourTypes.entity';
import { TourWaypointsSchema } from './TourWaypoints.entity';
import { ToursSchema } from './Tours.entity';
import { TravelTransferChunksSchema } from './TravelTransferChunks.entity';
import { TravelTransferFileHashesSchema } from './TravelTransferFileHashes.entity';
import { TravelTransferGraphsSchema } from './TravelTransferGraphs.entity';
import { TravelTransferObjectsSchema } from './TravelTransferObjects.entity';
import { TravelTransferOperationsSchema } from './TravelTransferOperations.entity';
import { TravelTransferSilentTasksSchema } from './TravelTransferSilentTasks.entity';
import { TrekPhotoCacheMetaSchema } from './TrekPhotoCacheMeta.entity';
import { TrekPhotosSchema } from './TrekPhotos.entity';
import { TripAlbumLinksSchema } from './TripAlbumLinks.entity';
import { TripDocumentLinksSchema } from './TripDocumentLinks.entity';
import { TripFilesSchema } from './TripFiles.entity';
import { TripInviteTokensSchema } from './TripInviteTokens.entity';
import { TripJournalLinkMembersSchema } from './TripJournalLinkMembers.entity';
import { TripJournalLinksSchema } from './TripJournalLinks.entity';
import { TripMembersSchema } from './TripMembers.entity';
import { TripPhotosSchema } from './TripPhotos.entity';
import { TripsSchema } from './Trips.entity';
import { UserNoticeDismissalsSchema } from './UserNoticeDismissals.entity';
import { UserSessionsSchema } from './UserSessions.entity';
import { UsersSchema } from './Users.entity';
import { VacayCompanyHolidaysSchema } from './VacayCompanyHolidays.entity';
import { VacayEntriesSchema } from './VacayEntries.entity';
import { VacayHolidayCalendarsSchema } from './VacayHolidayCalendars.entity';
import { VacayPlanMembersSchema } from './VacayPlanMembers.entity';
import { VacayPlansSchema } from './VacayPlans.entity';
import { VacaySharesSchema } from './VacayShares.entity';
import { VacayUserColorsSchema } from './VacayUserColors.entity';
import { VacayUserSettingsSchema } from './VacayUserSettings.entity';
import { VacayUserYearsSchema } from './VacayUserYears.entity';
import { VacayYearsSchema } from './VacayYears.entity';
import { VisitedCountriesSchema } from './VisitedCountries.entity';
import { VisitedRegionsSchema } from './VisitedRegions.entity';
import { WandererConnectionsSchema } from './WandererConnections.entity';
import { WebauthnChallengesSchema } from './WebauthnChallenges.entity';
import { WebauthnCredentialsSchema } from './WebauthnCredentials.entity';

export const ALL_ENTITIES: readonly EntitySchema[] = [
  AddonsSchema,
  AppSettingsSchema,
  AssignmentParticipantsSchema,
  AuditLogSchema,
  BucketListSchema,
  BudgetCategoryOrderSchema,
  BudgetItemMembersSchema,
  BudgetItemPayersSchema,
  BudgetItemsSchema,
  BudgetSettlementsSchema,
  CategoriesSchema,
  CollabLinksSchema,
  CollabMessageReactionsSchema,
  CollabMessagesSchema,
  CollabNotesSchema,
  CollabPollVotesSchema,
  CollabPollsSchema,
  CollectionLabelsSchema,
  CollectionMembersSchema,
  CollectionPlaceRatingsSchema,
  CollectionPlacesSchema,
  CollectionToursSchema,
  CollectionsSchema,
  DawarichConnectionsSchema,
  DawarichVisitSuggestionsSchema,
  DayAccommodationsSchema,
  DayAssignmentsSchema,
  DayNotesSchema,
  DaysSchema,
  DocumentConnectionsSchema,
  DocumentProviderFieldsSchema,
  DocumentProvidersSchema,
  DocumentSyncItemsSchema,
  FerrataTilesSchema,
  FileLinksSchema,
  GoogleApiUsageSchema,
  GooglePlacePhotoMetaSchema,
  HiddenCountriesSchema,
  HiddenRegionsSchema,
  IdempotencyKeysSchema,
  InviteTokensSchema,
  JourneyBooksSchema,
  JourneyContributorsSchema,
  JourneyEntriesSchema,
  JourneyEntryPhotosSchema,
  JourneyEntryStaysSchema,
  JourneyPhotosSchema,
  JourneyRecordedDaysSchema,
  JourneyRecordingPrepSchema,
  JourneyShareTokensSchema,
  JourneyTripsSchema,
  JourneysSchema,
  McpTokensSchema,
  MigrationsSchema,
  NotificationChannelPreferencesSchema,
  NotificationsSchema,
  OauthClientsSchema,
  OauthConsentsSchema,
  OauthTokensSchema,
  PackingBagsSchema,
  PackingCategoryAssigneesSchema,
  PackingItemContributorsSchema,
  PackingItemsSchema,
  PackingTemplateCategoriesSchema,
  PackingTemplateItemsSchema,
  PackingTemplatesSchema,
  PaddleFeaturesSchema,
  PaddleRegionRequestsSchema,
  PaddleRegionsSchema,
  PaddleWaterGraphsSchema,
  PasswordResetTokensSchema,
  PhotoProviderFieldsSchema,
  PhotoProvidersSchema,
  PhotosSchema,
  PlaceDetailsCacheSchema,
  PlaceRatingsSchema,
  PlaceRegionsSchema,
  PlaceShadowPicksSchema,
  PlacesSchema,
  PluginActionsSchema,
  PluginCapabilityAuditSchema,
  PluginEgressHostsSchema,
  PluginEntityMetadataSchema,
  PluginErrorLogSchema,
  PluginMetaMigrationsSchema,
  PluginOauthStateSchema,
  PluginOauthTokensSchema,
  PluginScheduledTasksSchema,
  PluginSettingsFieldsSchema,
  PluginUserConfigSchema,
  PluginUserErasureQueueSchema,
  PluginsSchema,
  PushSubscriptionsSchema,
  ReservationDayPositionsSchema,
  ReservationEndpointsSchema,
  ReservationTravelersSchema,
  ReservationsSchema,
  RoadtripDayBoundariesSchema,
  RoadtripDayTracksSchema,
  RoadtripPreferencesSchema,
  RoadtripViasSchema,
  RouteUsageDailySchema,
  SchedulerLeasesSchema,
  SchemaVersionSchema,
  SchoolHolidayCountriesSchema,
  SchoolHolidayPeriodsSchema,
  SchoolHolidayRegionsSchema,
  SettingsSchema,
  ShareTokensSchema,
  TagsSchema,
  TodoCategoryAssigneesSchema,
  TodoItemsSchema,
  TourActivitiesSchema,
  TourActivityExclusionsSchema,
  TourChangeStepsSchema,
  TourDraftsSchema,
  TourObstacleReviewsSchema,
  TourPackingLinksSchema,
  TourSourceHintsSchema,
  TourSourcesSchema,
  TourStationVisitsSchema,
  TourTypesSchema,
  TourWaypointsSchema,
  ToursSchema,
  TravelTransferChunksSchema,
  TravelTransferFileHashesSchema,
  TravelTransferGraphsSchema,
  TravelTransferObjectsSchema,
  TravelTransferOperationsSchema,
  TravelTransferSilentTasksSchema,
  TrekPhotoCacheMetaSchema,
  TrekPhotosSchema,
  TripAlbumLinksSchema,
  TripDocumentLinksSchema,
  TripFilesSchema,
  TripInviteTokensSchema,
  TripJournalLinkMembersSchema,
  TripJournalLinksSchema,
  TripMembersSchema,
  TripPhotosSchema,
  TripsSchema,
  UserNoticeDismissalsSchema,
  UserSessionsSchema,
  UsersSchema,
  VacayCompanyHolidaysSchema,
  VacayEntriesSchema,
  VacayHolidayCalendarsSchema,
  VacayPlanMembersSchema,
  VacayPlansSchema,
  VacaySharesSchema,
  VacayUserColorsSchema,
  VacayUserSettingsSchema,
  VacayUserYearsSchema,
  VacayYearsSchema,
  VisitedCountriesSchema,
  VisitedRegionsSchema,
  WandererConnectionsSchema,
  WebauthnChallengesSchema,
  WebauthnCredentialsSchema,
];
