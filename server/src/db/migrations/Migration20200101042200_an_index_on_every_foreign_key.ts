import { Migration } from '@mikro-orm/migrations';

/**
 * An index on every foreign-key column that had none (86 of them).
 *
 * SQLite does not index a foreign key by itself, and every ON DELETE CASCADE
 * or SET NULL has to find the child rows: deleting a trip or a user scanned
 * each unindexed child table in full, once per parent row, inside the delete's
 * transaction, while every other request waited on the one connection. The
 * lookups by these columns (a trip's files, a user's tokens) get faster too.
 *
 * `IF NOT EXISTS`, so an install that added one by hand keeps it.
 */
export class Migration20200101042200_an_index_on_every_foreign_key extends Migration {
  override name = 'Migration20200101042200_an_index_on_every_foreign_key';

  override up(): void {
    this.addSql('CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_place_ratings_user_id ON place_ratings(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_items_owner_id ON packing_items(owner_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_items_bag_id ON packing_items(bag_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_files_uploaded_by ON trip_files(uploaded_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_files_note_id ON trip_files(note_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_files_reservation_id ON trip_files(reservation_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_files_place_id ON trip_files(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_reservations_assignment_id ON reservations(assignment_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_reservations_place_id ON reservations(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_reservations_end_day_id ON reservations(end_day_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_members_invited_by ON trip_members(invited_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_day_notes_trip_id ON day_notes(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_items_place_id ON budget_items(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_items_reservation_id ON budget_items(reservation_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_items_paid_by_user_id ON budget_items(paid_by_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_vacay_plan_members_user_id ON vacay_plan_members(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_vacay_user_colors_plan_id ON vacay_user_colors(plan_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_vacay_user_years_plan_id ON vacay_user_years(plan_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_vacay_entries_plan_id ON vacay_entries(plan_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_vacay_holiday_calendars_plan_id ON vacay_holiday_calendars(plan_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_places_category_id ON collection_places(category_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_places_saved_by ON collection_places(saved_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_places_owner_id ON collection_places(owner_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_place_ratings_user_id ON collection_place_ratings(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_notes_user_id ON collab_notes(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_polls_user_id ON collab_polls(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_poll_votes_user_id ON collab_poll_votes(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_messages_reply_to ON collab_messages(reply_to)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_messages_user_id ON collab_messages(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assignment_participants_user_id ON assignment_participants(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_message_reactions_user_id ON collab_message_reactions(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_invite_tokens_trip_id ON invite_tokens(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by ON invite_tokens(created_by)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_packing_category_assignees_user_id ON packing_category_assignees(user_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_templates_created_by ON packing_templates(created_by)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_packing_template_categories_template_id ON packing_template_categories(template_id)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_packing_template_items_category_id ON packing_template_items(category_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_bags_user_id ON packing_bags(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_bags_trip_id ON packing_bags(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_bucket_list_user_id ON bucket_list(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_file_links_place_id ON file_links(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_file_links_assignment_id ON file_links(assignment_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_file_links_reservation_id ON file_links(reservation_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_share_tokens_created_by ON share_tokens(created_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_share_tokens_trip_id ON share_tokens(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id ON mcp_tokens(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_album_links_user_id ON trip_album_links(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_todo_items_assigned_user_id ON todo_items(assigned_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_todo_category_assignees_user_id ON todo_category_assignees(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_packing_bag_members_user_id ON packing_bag_members(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_reservation_day_positions_day_id ON reservation_day_positions(day_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_oauth_consents_user_id ON oauth_consents(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_tokens(client_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_trips_trip_id ON journey_trips(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_entries_author_id ON journey_entries(author_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_entries_source_trip_id ON journey_entries(source_trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_share_tokens_created_by ON journey_share_tokens(created_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_photos_album_link_id ON trip_photos(album_link_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_photos_user_id ON trip_photos(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_day_accommodations_place_id ON day_accommodations(place_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_photos_photo_id ON journey_photos(photo_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_item_payers_user_id ON budget_item_payers(user_id)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_budget_settlements_created_by_user_id ON budget_settlements(created_by_user_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_settlements_to_user_id ON budget_settlements(to_user_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_budget_settlements_from_user_id ON budget_settlements(from_user_id)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_packing_item_contributors_user_id ON packing_item_contributors(user_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_invite_tokens_created_by ON trip_invite_tokens(created_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_books_updated_by ON journey_books(updated_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_books_created_by ON journey_books(created_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collab_links_user_id ON collab_links(user_id)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_dawarich_visit_suggestions_matched_bucket_list_item_id ON dawarich_visit_suggestions(matched_bucket_list_item_id)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_dawarich_visit_suggestions_accepted_bucket_list_item_id ON dawarich_visit_suggestions(accepted_bucket_list_item_id)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_dawarich_visit_suggestions_accepted_place_id ON dawarich_visit_suggestions(accepted_place_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_document_connections_provider_id ON document_connections(provider_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_document_links_created_by ON trip_document_links(created_by)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_trip_document_links_connection_id ON trip_document_links(connection_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_document_sync_items_file_id ON document_sync_items(file_id)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_roadtrip_day_boundaries_to_assignment_id ON roadtrip_day_boundaries(to_assignment_id)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_roadtrip_day_boundaries_from_assignment_id ON roadtrip_day_boundaries(from_assignment_id)',
    );
  }
}
