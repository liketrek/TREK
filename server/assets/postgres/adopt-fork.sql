-- Fork schema delta from an official PostgreSQL install, verified against ALL_ENTITIES.
create table "fork_schema_migrations" ("id" text null, "applied_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), primary key ("id"));
create table "global_exchange_rate_snapshots" ("base_currency" text null, "rates_json" text not null, "source_version" text not null, "effective_date" text null, "fetched_at" text not null, primary key ("base_currency"));
create table "trip_exchange_rates" ("trip_id" bigint not null, "currency" text not null, "exchange_rate" double precision not null, "effective_date" text null, "source_version" text not null, "set_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), "set_by_user_id" bigint null, "note" text null, primary key ("trip_id", "currency"));
create index "idx_trip_exchange_rates_set_by" on "trip_exchange_rates" ("set_by_user_id");
alter table "trip_exchange_rates" add constraint "trip_exchange_rates_trip_id_currency_unique" unique ("trip_id", "currency");
create table "exchange_rate_batch_previews" ("id" text null, "trip_id" bigint not null, "currency" text not null, "exchange_rate" double precision not null, "note" text null, "state_token" text not null, "preview_json" text not null, "created_by_user_id" bigint null, "created_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), primary key ("id"));
create index "idx_exchange_rate_batch_previews_trip" on "exchange_rate_batch_previews" ("trip_id");
create index "idx_exchange_rate_batch_previews_created_by" on "exchange_rate_batch_previews" ("created_by_user_id");
create index "idx_exchange_rate_batch_previews_created_at" on "exchange_rate_batch_previews" ("created_at");
create table "web_push_subscriptions" ("id" bigserial primary key, "user_id" bigint not null, "installation_id" text not null, "endpoint_hash" text not null, "subscription_encrypted" text not null, "origin" text not null, "vapid_key_fingerprint" text not null, "label" text not null, "status" text not null default 'active', "created_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), "updated_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), "last_seen_at" text not null default to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS'), "last_success_at" text null, "last_error_at" text null, "revoked_at" text null);
create index "idx_web_push_delivery" on "web_push_subscriptions" ("user_id", "status", "origin", "vapid_key_fingerprint");
create index "idx_web_push_user_status" on "web_push_subscriptions" ("user_id", "status", "updated_at");
alter table "web_push_subscriptions" add constraint "web_push_subscriptions_user_id_installation_id_unique" unique ("user_id", "installation_id");
alter table "web_push_subscriptions" add constraint "web_push_subscriptions_endpoint_hash_unique" unique ("endpoint_hash");
alter table "days" add "timing_json" text not null default '{"enabled":true,"start":"09:00","travel":[]}';
alter table "trip_members" add "new_member_identity_check_completed_at" text null;
alter table "day_assignments" add "times_explicit" bigint not null default 0;
alter table "budget_settlements" add "exchange_rate_source" text not null default 'legacy', add "exchange_rate_source_version" text null, add "exchange_rate_effective_date" text null, add "exchange_rate_set_at" text null, add "exchange_rate_set_by_user_id" bigint null, add "exchange_rate_note" text null, add "exchange_rate_reset_at" text null;
alter table "budget_settlements" add constraint "budget_settlements_exchange_rate_set_by_user_id_foreign" foreign key ("exchange_rate_set_by_user_id") references "users" ("id") on delete set null;
create index "idx_budget_settlements_exchange_rate_set_by" on "budget_settlements" ("exchange_rate_set_by_user_id");
alter table "budget_items" add "exchange_rate_source" text not null default 'legacy', add "exchange_rate_source_version" text null, add "exchange_rate_effective_date" text null, add "exchange_rate_set_at" text null, add "exchange_rate_set_by_user_id" bigint null, add "exchange_rate_note" text null, add "exchange_rate_reset_at" text null;
alter table "budget_items" add constraint "budget_items_exchange_rate_set_by_user_id_foreign" foreign key ("exchange_rate_set_by_user_id") references "users" ("id") on delete set null;
create index "idx_budget_items_exchange_rate_set_by" on "budget_items" ("exchange_rate_set_by_user_id");
alter table "trip_exchange_rates" add constraint "trip_exchange_rates_trip_id_foreign" foreign key ("trip_id") references "trips" ("id") on delete cascade;
alter table "trip_exchange_rates" add constraint "trip_exchange_rates_set_by_user_id_foreign" foreign key ("set_by_user_id") references "users" ("id") on delete set null;
alter table "exchange_rate_batch_previews" add constraint "exchange_rate_batch_previews_trip_id_foreign" foreign key ("trip_id") references "trips" ("id") on delete cascade;
alter table "exchange_rate_batch_previews" add constraint "exchange_rate_batch_previews_created_by_user_id_foreign" foreign key ("created_by_user_id") references "users" ("id") on delete cascade;
alter table "web_push_subscriptions" add constraint "web_push_subscriptions_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;

-- Existing trips start with itinerary scheduling disabled and completed regular member prompts.
update days set timing_json = '{"enabled":false,"start":"09:00","travel":[]}';
update trip_members
  set new_member_identity_check_completed_at = to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS')
  where user_id in (select id from users where coalesce(is_guest, 0) = 0);

update budget_items as item
  set exchange_rate_source = case
        when coalesce(nullif(upper(item.currency), ''), upper(coalesce(trip.currency, 'EUR')))
          = upper(coalesce(trip.currency, 'EUR')) then 'identity' else item.exchange_rate_source end,
      exchange_rate_set_at = item.created_at
  from trips as trip where item.trip_id = trip.id;

update budget_settlements as settlement
  set exchange_rate_source = case
        when coalesce(nullif(upper(settlement.currency), ''), upper(coalesce(trip.currency, 'EUR')))
          = upper(coalesce(trip.currency, 'EUR')) then 'identity' else settlement.exchange_rate_source end,
      exchange_rate_set_at = settlement.created_at
  from trips as trip where settlement.trip_id = trip.id;
