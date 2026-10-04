import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { UsersRepository } from '../repositories/Users.repository';
import { DbTimestampType } from '../types';
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
import { DocumentConnections } from './DocumentConnections.entity';
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
import { PushSubscriptions } from './PushSubscriptions.entity';
import { ReservationTravelers } from './ReservationTravelers.entity';
import { Settings } from './Settings.entity';
import { ShareTokens } from './ShareTokens.entity';
import { Tags } from './Tags.entity';
import { TodoCategoryAssignees } from './TodoCategoryAssignees.entity';
import { TodoItems } from './TodoItems.entity';
import { TrekPhotos } from './TrekPhotos.entity';
import { TripAlbumLinks } from './TripAlbumLinks.entity';
import { TripDocumentLinks } from './TripDocumentLinks.entity';
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
  [EntityRepositoryType]?: UsersRepository;
  id!: number & Opt;
  username!: string;
  email!: string;
  password_hash!: string;
  role: string & Opt = 'user';
  maps_api_key?: string | null;
  unsplash_api_key?: string | null;
  amap_api_key?: string | null;
  openweather_api_key?: string | null;
  avatar?: string | null;
  oidc_sub?: string | null;
  oidc_issuer?: string | null;
  last_login?: string | null;
  mfa_enabled?: number | null = 0;
  mfa_secret?: string | null;
  mfa_backup_codes?: string | null;
  immich_url?: string | null;
  immich_access_token?: string | null;
  synology_url?: string | null;
  synology_username?: string | null;
  synology_password?: string | null;
  synology_sid?: string | null;
  must_change_password?: number | null = 0;
  password_version: number & Opt = 0;
  feed_token?: string | null;
  is_guest: number & Opt = 0;
  created_at?: string | null;
  updated_at?: string | null;
  immich_api_key?: string | null;
  synology_skip_ssl: number & Opt = 0;
  synology_did?: string | null;
  first_seen_version: string & Opt = '0.0.0';
  login_count: number & Opt = 0;
  immich_auto_upload: number & Opt = 0;
  airtrail_url?: string | null;
  airtrail_api_key?: string | null;
  airtrail_allow_insecure_tls?: number | null = 0;
  airtrail_write_enabled?: number | null = 0;
  display_name?: string | null;
  immich_allow_insecure_tls: number & Opt = 0;
  assignment_participants_collection = new Collection<AssignmentParticipants>(this);
  audit_log_collection = new Collection<AuditLog>(this);
  bucket_list_collection = new Collection<BucketList>(this);
  budget_item_members_collection = new Collection<BudgetItemMembers>(this);
  budget_item_payers_collection = new Collection<BudgetItemPayers>(this);
  budget_items_collection = new Collection<BudgetItems>(this);
  budget_settlements_collection = new Collection<BudgetSettlements>(this);
  budget_settlements_collection1 = new Collection<BudgetSettlements>(this);
  budget_settlements_collection2 = new Collection<BudgetSettlements>(this);
  categories_collection = new Collection<Categories>(this);
  collab_links_collection = new Collection<CollabLinks>(this);
  collab_message_reactions_collection = new Collection<CollabMessageReactions>(this);
  collab_messages_collection = new Collection<CollabMessages>(this);
  collab_notes_collection = new Collection<CollabNotes>(this);
  collab_poll_votes_collection = new Collection<CollabPollVotes>(this);
  collab_polls_collection = new Collection<CollabPolls>(this);
  collection_members_collection = new Collection<CollectionMembers>(this);
  collection_place_ratings_collection = new Collection<CollectionPlaceRatings>(this);
  collection_places_collection = new Collection<CollectionPlaces>(this);
  collection_places_collection1 = new Collection<CollectionPlaces>(this);
  collections_collection = new Collection<Collections>(this);
  dawarich_connections: Ref<DawarichConnections> | null = null;
  dawarich_visit_suggestions_collection = new Collection<DawarichVisitSuggestions>(this);
  document_connections_collection = new Collection<DocumentConnections>(this);
  hidden_countries_collection = new Collection<HiddenCountries>(this);
  hidden_regions_collection = new Collection<HiddenRegions>(this);
  idempotency_keys_collection = new Collection<IdempotencyKeys>(this);
  invite_tokens_collection = new Collection<InviteTokens>(this);
  journey_books_collection = new Collection<JourneyBooks>(this);
  journey_books_collection1 = new Collection<JourneyBooks>(this);
  journey_contributors_collection = new Collection<JourneyContributors>(this);
  journey_entries_collection = new Collection<JourneyEntries>(this);
  journey_share_tokens_collection = new Collection<JourneyShareTokens>(this);
  journeys_collection = new Collection<Journeys>(this);
  mcp_tokens_collection = new Collection<McpTokens>(this);
  notification_channel_preferences_collection = new Collection<NotificationChannelPreferences>(this);
  notifications_collection = new Collection<Notifications>(this);
  notifications_collection1 = new Collection<Notifications>(this);
  oauth_clients_collection = new Collection<OauthClients>(this);
  oauth_consents_collection = new Collection<OauthConsents>(this);
  oauth_tokens_collection = new Collection<OauthTokens>(this);
  packing_bags_collection = new Collection<PackingBags>(this);
  packing_bag_members_inverse = new Collection<PackingBags>(this);
  packing_category_assignees_collection = new Collection<PackingCategoryAssignees>(this);
  packing_item_contributors_collection = new Collection<PackingItemContributors>(this);
  packing_items_collection = new Collection<PackingItems>(this);
  packing_item_contributors_inverse = new Collection<PackingItems>(this);
  packing_item_recipients_inverse = new Collection<PackingItems>(this);
  packing_templates_collection = new Collection<PackingTemplates>(this);
  password_reset_tokens_collection = new Collection<PasswordResetTokens>(this);
  place_ratings_collection = new Collection<PlaceRatings>(this);
  push_subscriptions_collection = new Collection<PushSubscriptions>(this);
  reservation_travelers_collection = new Collection<ReservationTravelers>(this);
  settings_collection = new Collection<Settings>(this);
  share_tokens_collection = new Collection<ShareTokens>(this);
  tags_collection = new Collection<Tags>(this);
  todo_category_assignees_collection = new Collection<TodoCategoryAssignees>(this);
  todo_items_collection = new Collection<TodoItems>(this);
  trek_photos_collection = new Collection<TrekPhotos>(this);
  trip_album_links_collection = new Collection<TripAlbumLinks>(this);
  trip_document_links_collection = new Collection<TripDocumentLinks>(this);
  trip_files_collection = new Collection<TripFiles>(this);
  trip_invite_tokens_collection = new Collection<TripInviteTokens>(this);
  trip_members_collection = new Collection<TripMembers>(this);
  trip_members_collection1 = new Collection<TripMembers>(this);
  trip_photos_collection = new Collection<TripPhotos>(this);
  trips_collection = new Collection<Trips>(this);
  user_notice_dismissals_collection = new Collection<UserNoticeDismissals>(this);
  vacay_entries_collection = new Collection<VacayEntries>(this);
  vacay_plan_members_collection = new Collection<VacayPlanMembers>(this);
  vacay_plans_collection = new Collection<VacayPlans>(this);
  vacay_shares_collection = new Collection<VacayShares>(this);
  vacay_shares_collection1 = new Collection<VacayShares>(this);
  vacay_user_colors_collection = new Collection<VacayUserColors>(this);
  vacay_user_settings: Ref<VacayUserSettings> | null = null;
  vacay_user_years_collection = new Collection<VacayUserYears>(this);
  visited_countries_collection = new Collection<VisitedCountries>(this);
  visited_regions_collection = new Collection<VisitedRegions>(this);
  webauthn_challenges_collection = new Collection<WebauthnChallenges>(this);
  webauthn_credentials_collection = new Collection<WebauthnCredentials>(this);
}

export const UsersSchema = defineEntity({
  class: Users,
  repository: () => UsersRepository,
  uniques: [
    {
      name: 'idx_users_feed_token',
      where: 'feed_token IS NOT NULL',
      properties: ['feed_token'],
    },
    { properties: ['email'] },
    { properties: ['username'] },
  ],
  properties: {
    id: p.integer().primary(),
    username: p.text(),
    email: p.text().index('idx_users_email'),
    password_hash: p.text(),
    role: p.text().default('user'),
    maps_api_key: p.text().nullable(),
    unsplash_api_key: p.text().nullable(),
    amap_api_key: p.text().nullable(),
    openweather_api_key: p.text().nullable(),
    avatar: p.text().nullable(),
    oidc_sub: p.text().nullable(),
    oidc_issuer: p.text().nullable(),
    last_login: p.type(DbTimestampType).nullable(),
    mfa_enabled: p.integer().nullable(),
    mfa_secret: p.text().nullable(),
    mfa_backup_codes: p.text().nullable(),
    immich_url: p.text().nullable(),
    immich_access_token: p.text().nullable(),
    synology_url: p.text().nullable(),
    synology_username: p.text().nullable(),
    synology_password: p.text().nullable(),
    synology_sid: p.text().nullable(),
    must_change_password: p.integer().nullable(),
    password_version: p.integer().default(0),
    feed_token: p.text().nullable(),
    is_guest: p.integer().default(0),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    immich_api_key: p.text().nullable(),
    synology_skip_ssl: p.integer().default(0),
    synology_did: p.text().nullable(),
    first_seen_version: p.text().default('0.0.0'),
    login_count: p.integer().default(0),
    immich_auto_upload: p.integer().default(0),
    airtrail_url: p.text().nullable(),
    airtrail_api_key: p.text().nullable(),
    airtrail_allow_insecure_tls: p.integer().nullable(),
    airtrail_write_enabled: p.integer().nullable(),
    display_name: p.text().nullable(),
    immich_allow_insecure_tls: p.integer().default(0),
    assignment_participants_collection: () => p.oneToMany(AssignmentParticipants).mappedBy('user').hidden(),
    audit_log_collection: () => p.oneToMany(AuditLog).mappedBy('user').hidden(),
    bucket_list_collection: () => p.oneToMany(BucketList).mappedBy('user').hidden(),
    budget_item_members_collection: () => p.oneToMany(BudgetItemMembers).mappedBy('user').hidden(),
    budget_item_payers_collection: () => p.oneToMany(BudgetItemPayers).mappedBy('user').hidden(),
    budget_items_collection: () => p.oneToMany(BudgetItems).mappedBy('paidByUser').hidden(),
    budget_settlements_collection: () => p.oneToMany(BudgetSettlements).mappedBy('fromUser').hidden(),
    budget_settlements_collection1: () => p.oneToMany(BudgetSettlements).mappedBy('toUser').hidden(),
    budget_settlements_collection2: () => p.oneToMany(BudgetSettlements).mappedBy('createdByUser').hidden(),
    categories_collection: () => p.oneToMany(Categories).mappedBy('user').hidden(),
    collab_links_collection: () => p.oneToMany(CollabLinks).mappedBy('user').hidden(),
    collab_message_reactions_collection: () => p.oneToMany(CollabMessageReactions).mappedBy('user').hidden(),
    collab_messages_collection: () => p.oneToMany(CollabMessages).mappedBy('user').hidden(),
    collab_notes_collection: () => p.oneToMany(CollabNotes).mappedBy('user').hidden(),
    collab_poll_votes_collection: () => p.oneToMany(CollabPollVotes).mappedBy('user').hidden(),
    collab_polls_collection: () => p.oneToMany(CollabPolls).mappedBy('user').hidden(),
    collection_members_collection: () => p.oneToMany(CollectionMembers).mappedBy('user').hidden(),
    collection_place_ratings_collection: () => p.oneToMany(CollectionPlaceRatings).mappedBy('user').hidden(),
    collection_places_collection: () => p.oneToMany(CollectionPlaces).mappedBy('owner').hidden(),
    collection_places_collection1: () => p.oneToMany(CollectionPlaces).mappedBy('savedByRef').hidden(),
    collections_collection: () => p.oneToMany(Collections).mappedBy('owner').hidden(),
    dawarich_connections: () => p.oneToOne(DawarichConnections).ref().mappedBy('user').hidden(),
    dawarich_visit_suggestions_collection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('user').hidden(),
    document_connections_collection: () => p.oneToMany(DocumentConnections).mappedBy('ownerUser').hidden(),
    hidden_countries_collection: () => p.oneToMany(HiddenCountries).mappedBy('user').hidden(),
    hidden_regions_collection: () => p.oneToMany(HiddenRegions).mappedBy('user').hidden(),
    idempotency_keys_collection: () => p.oneToMany(IdempotencyKeys).mappedBy('user').hidden(),
    invite_tokens_collection: () => p.oneToMany(InviteTokens).mappedBy('createdByRef').hidden(),
    journey_books_collection: () => p.oneToMany(JourneyBooks).mappedBy('updatedByRef').hidden(),
    journey_books_collection1: () => p.oneToMany(JourneyBooks).mappedBy('createdByRef').hidden(),
    journey_contributors_collection: () => p.oneToMany(JourneyContributors).mappedBy('user').hidden(),
    journey_entries_collection: () => p.oneToMany(JourneyEntries).mappedBy('author').hidden(),
    journey_share_tokens_collection: () => p.oneToMany(JourneyShareTokens).mappedBy('createdByRef').hidden(),
    journeys_collection: () => p.oneToMany(Journeys).mappedBy('user').hidden(),
    mcp_tokens_collection: () => p.oneToMany(McpTokens).mappedBy('user').hidden(),
    notification_channel_preferences_collection: () => p.oneToMany(NotificationChannelPreferences).mappedBy('user').hidden(),
    notifications_collection: () => p.oneToMany(Notifications).mappedBy('sender').hidden(),
    notifications_collection1: () => p.oneToMany(Notifications).mappedBy('recipient').hidden(),
    oauth_clients_collection: () => p.oneToMany(OauthClients).mappedBy('user').hidden(),
    oauth_consents_collection: () => p.oneToMany(OauthConsents).mappedBy('user').hidden(),
    oauth_tokens_collection: () => p.oneToMany(OauthTokens).mappedBy('user').hidden(),
    packing_bags_collection: () => p.oneToMany(PackingBags).mappedBy('user').hidden(),
    packing_bag_members_inverse: () => p.manyToMany(PackingBags).mappedBy('packing_bag_members').hidden(),
    packing_category_assignees_collection: () => p.oneToMany(PackingCategoryAssignees).mappedBy('user').hidden(),
    packing_item_contributors_collection: () => p.oneToMany(PackingItemContributors).mappedBy('user').hidden(),
    packing_items_collection: () => p.oneToMany(PackingItems).mappedBy('owner').hidden(),
    packing_item_contributors_inverse: () => p.manyToMany(PackingItems).mappedBy('packing_item_contributors').hidden(),
    packing_item_recipients_inverse: () => p.manyToMany(PackingItems).mappedBy('packing_item_recipients').hidden(),
    packing_templates_collection: () => p.oneToMany(PackingTemplates).mappedBy('createdByRef').hidden(),
    password_reset_tokens_collection: () => p.oneToMany(PasswordResetTokens).mappedBy('user').hidden(),
    place_ratings_collection: () => p.oneToMany(PlaceRatings).mappedBy('user').hidden(),
    push_subscriptions_collection: () => p.oneToMany(PushSubscriptions).mappedBy('user').hidden(),
    reservation_travelers_collection: () => p.oneToMany(ReservationTravelers).mappedBy('user').hidden(),
    settings_collection: () => p.oneToMany(Settings).mappedBy('user').hidden(),
    share_tokens_collection: () => p.oneToMany(ShareTokens).mappedBy('createdByRef').hidden(),
    tags_collection: () => p.oneToMany(Tags).mappedBy('user').hidden(),
    todo_category_assignees_collection: () => p.oneToMany(TodoCategoryAssignees).mappedBy('user').hidden(),
    todo_items_collection: () => p.oneToMany(TodoItems).mappedBy('assignedUser').hidden(),
    trek_photos_collection: () => p.oneToMany(TrekPhotos).mappedBy('owner').hidden(),
    trip_album_links_collection: () => p.oneToMany(TripAlbumLinks).mappedBy('user').hidden(),
    trip_document_links_collection: () => p.oneToMany(TripDocumentLinks).mappedBy('createdByRef').hidden(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('uploadedByRef').hidden(),
    trip_invite_tokens_collection: () => p.oneToMany(TripInviteTokens).mappedBy('createdByRef').hidden(),
    trip_members_collection: () => p.oneToMany(TripMembers).mappedBy('user').hidden(),
    trip_members_collection1: () => p.oneToMany(TripMembers).mappedBy('invitedByRef').hidden(),
    trip_photos_collection: () => p.oneToMany(TripPhotos).mappedBy('user').hidden(),
    trips_collection: () => p.oneToMany(Trips).mappedBy('user').hidden(),
    user_notice_dismissals_collection: () => p.oneToMany(UserNoticeDismissals).mappedBy('user').hidden(),
    vacay_entries_collection: () => p.oneToMany(VacayEntries).mappedBy('user').hidden(),
    vacay_plan_members_collection: () => p.oneToMany(VacayPlanMembers).mappedBy('user').hidden(),
    vacay_plans_collection: () => p.oneToMany(VacayPlans).mappedBy('owner').hidden(),
    vacay_shares_collection: () => p.oneToMany(VacayShares).mappedBy('owner').hidden(),
    vacay_shares_collection1: () => p.oneToMany(VacayShares).mappedBy('user').hidden(),
    vacay_user_colors_collection: () => p.oneToMany(VacayUserColors).mappedBy('user').hidden(),
    vacay_user_settings: () => p.oneToOne(VacayUserSettings).ref().mappedBy('user').hidden(),
    vacay_user_years_collection: () => p.oneToMany(VacayUserYears).mappedBy('user').hidden(),
    visited_countries_collection: () => p.oneToMany(VisitedCountries).mappedBy('user').hidden(),
    visited_regions_collection: () => p.oneToMany(VisitedRegions).mappedBy('user').hidden(),
    webauthn_challenges_collection: () => p.oneToMany(WebauthnChallenges).mappedBy('user').hidden(),
    webauthn_credentials_collection: () => p.oneToMany(WebauthnCredentials).mappedBy('user').hidden(),
  },
});
