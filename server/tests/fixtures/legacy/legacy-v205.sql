-- Legacy-runner install at schema_version 205: the retired db/migrations.ts runner at fa406b708
-- (main, the released chain), booted once with no DEMO_MODE, then the canary rows the legacy-baseline
-- integration tests assert on (one trip; user-set assignment times; a booked night).
-- The seeded admin's password hash is replaced so the fixture carries no credential.
-- Loaded by tests/helpers/legacy-fixture.ts.
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      maps_api_key TEXT,
      unsplash_api_key TEXT,
      openweather_api_key TEXT,
      avatar TEXT,
      oidc_sub TEXT,
      oidc_issuer TEXT,
      last_login DATETIME,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      mfa_backup_codes TEXT,
      immich_url TEXT,
      immich_access_token TEXT,
      synology_url TEXT,
      synology_username TEXT,
      synology_password TEXT,
      synology_sid TEXT,
      must_change_password INTEGER DEFAULT 0,
      password_version INTEGER NOT NULL DEFAULT 0,
      feed_token TEXT,
      is_guest INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , immich_api_key TEXT, synology_skip_ssl INTEGER NOT NULL DEFAULT 0, synology_did TEXT, first_seen_version TEXT NOT NULL DEFAULT '0.0.0', login_count INTEGER NOT NULL DEFAULT 0, immich_auto_upload INTEGER NOT NULL DEFAULT 0, airtrail_url TEXT, airtrail_api_key TEXT, airtrail_allow_insecure_tls INTEGER DEFAULT 0, airtrail_write_enabled INTEGER DEFAULT 0, display_name TEXT);
INSERT INTO users VALUES(1,'admin','admin@trek.local','fixture-login-disabled','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,0,'2026-09-24 08:09:22','2026-09-24 08:09:22',NULL,0,NULL,'0.0.0',0,0,NULL,NULL,0,0,NULL);
CREATE TABLE password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_ip TEXT
    );
CREATE TABLE webauthn_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      credential_id TEXT NOT NULL UNIQUE,
      public_key BLOB NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      device_type TEXT,
      backed_up INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      aaguid TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    );
CREATE TABLE webauthn_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key)
    );
CREATE TABLE trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      currency TEXT DEFAULT 'EUR',
      cover_image TEXT,
      is_archived INTEGER DEFAULT 0,
      reminder_days INTEGER DEFAULT 3,
      feed_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO trips VALUES(1,1,'Legacy canary trip',NULL,'2026-10-01','2026-10-03','EUR',NULL,0,3,NULL,'2026-09-24 08:10:00','2026-09-24 08:10:00');
CREATE TABLE days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      date TEXT,
      notes TEXT,
      title TEXT, default_transport_mode TEXT,
      UNIQUE(trip_id, day_number)
    );
INSERT INTO days VALUES(1,1,1,'2026-10-01',NULL,NULL,NULL);
INSERT INTO days VALUES(2,1,2,'2026-10-02',NULL,NULL,NULL);
INSERT INTO days VALUES(3,1,3,'2026-10-03',NULL,NULL,NULL);
CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '📍',
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO categories VALUES(1,'Hotel','#3b82f6','🏨',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(2,'Restaurant','#ef4444','🍽️',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(3,'Attraction','#8b5cf6','🏛️',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(4,'Shopping','#f59e0b','🛍️',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(5,'Transport','#6b7280','🚌',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(6,'Activity','#10b981','🎯',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(7,'Bar/Cafe','#f97316','☕',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(8,'Beach','#06b6d4','🏖️',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(9,'Nature','#84cc16','🌿',NULL,'2026-09-24 08:09:22');
INSERT INTO categories VALUES(10,'Other','#6366f1','📍',NULL,'2026-09-24 08:09:22');
CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#10b981',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      lat REAL,
      lng REAL,
      address TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price REAL,
      currency TEXT,
      reservation_status TEXT DEFAULT 'none',
      reservation_notes TEXT,
      reservation_datetime TEXT,
      place_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER DEFAULT 60,
      notes TEXT,
      image_url TEXT,
      google_place_id TEXT,
      google_ftid TEXT,
      website TEXT,
      phone TEXT,
      transport_mode TEXT DEFAULT 'walking',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , osm_id TEXT, route_geometry TEXT, route_color TEXT);
INSERT INTO places VALUES(1,1,'Canary hotel',NULL,41.3874,2.1686,NULL,NULL,NULL,NULL,'none',NULL,NULL,NULL,NULL,60,NULL,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL,NULL);
INSERT INTO places VALUES(2,1,'Morning stop',NULL,41.4036,2.1744,NULL,NULL,NULL,NULL,'none',NULL,NULL,'08:00',NULL,60,NULL,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL,NULL);
INSERT INTO places VALUES(3,1,'Evening stop',NULL,41.3809,2.1228,NULL,NULL,NULL,NULL,'none',NULL,NULL,'10:00',NULL,60,NULL,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL,NULL);
INSERT INTO places VALUES(4,1,'Late stop',NULL,41.3851,2.1734,NULL,NULL,NULL,NULL,'none',NULL,NULL,'13:00',NULL,60,NULL,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL,NULL);
CREATE TABLE place_tags (
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (place_id, tag_id)
    );
CREATE TABLE place_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(place_id, user_id)
    );
CREATE TABLE day_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      reservation_status TEXT DEFAULT 'none',
      reservation_notes TEXT,
      reservation_datetime TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , assignment_time TEXT, assignment_end_time TEXT, leg_transport_mode TEXT, incoming_leg_transport_mode TEXT);
INSERT INTO day_assignments VALUES(1,2,2,0,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','09:00',NULL,NULL,NULL);
INSERT INTO day_assignments VALUES(2,2,3,1,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','18:00',NULL,NULL,NULL);
INSERT INTO day_assignments VALUES(3,2,4,2,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','20:00',NULL,NULL,NULL);
CREATE TABLE packing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , weight_grams INTEGER, bag_id INTEGER REFERENCES packing_bags(id) ON DELETE SET NULL, quantity INTEGER NOT NULL DEFAULT 1, updated_at DATETIME, is_private INTEGER NOT NULL DEFAULT 0, owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL);
CREATE TABLE photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      caption TEXT,
      taken_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE trip_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , note_id INTEGER REFERENCES collab_notes(id) ON DELETE SET NULL, uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, starred INTEGER DEFAULT 0, deleted_at TEXT);
CREATE TABLE reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      end_day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      accommodation_id TEXT,
      reservation_time TEXT,
      reservation_end_time TEXT,
      location TEXT,
      confirmation_number TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , metadata TEXT, day_plan_position REAL DEFAULT NULL, needs_review INTEGER NOT NULL DEFAULT 0, external_source TEXT, external_id TEXT, external_owner_user_id INTEGER, external_synced_at TEXT, sync_enabled INTEGER DEFAULT 1, external_hash TEXT, url TEXT, ingest_state TEXT NOT NULL DEFAULT 'live');
CREATE TABLE trip_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_by INTEGER REFERENCES users(id),
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trip_id, user_id)
    );
CREATE TABLE day_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      time TEXT,
      icon TEXT DEFAULT '📝',
      sort_order REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , color TEXT);
CREATE TABLE app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
INSERT INTO app_settings VALUES('app_version','3.0.15');
INSERT INTO app_settings VALUES('places_photos_enabled','true');
INSERT INTO app_settings VALUES('places_autocomplete_enabled','true');
INSERT INTO app_settings VALUES('places_details_enabled','true');
CREATE TABLE budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'Other',
      name TEXT NOT NULL,
      total_price REAL NOT NULL DEFAULT 0,
      persons INTEGER DEFAULT NULL,
      days INTEGER DEFAULT NULL,
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , paid_by_user_id INTEGER REFERENCES users(id), expense_date TEXT DEFAULT NULL, reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL DEFAULT NULL, currency TEXT, exchange_rate REAL NOT NULL DEFAULT 1, ticket_json TEXT, place_id INTEGER REFERENCES places(id) ON DELETE SET NULL DEFAULT NULL);
CREATE TABLE addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'global',
      icon TEXT DEFAULT 'Puzzle',
      enabled INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0
    );
INSERT INTO addons VALUES('collab','Collab','Notes, polls, and live chat for trip collaboration','trip','Users',1,'{}',6);
INSERT INTO addons VALUES('memories','Photos',NULL,'trip','Image',0,'{}',7);
INSERT INTO addons VALUES('mcp','MCP','Model Context Protocol for AI assistant integration','integration','Terminal',0,'{}',12);
INSERT INTO addons VALUES('naver_list_import','Naver List Import','Import places from shared Naver Maps lists','integration','Link2',1,'{}',13);
INSERT INTO addons VALUES('journey','Journey','Trip tracking & travel journal — check-ins, photos, daily stories','global','Compass',0,'{}',35);
INSERT INTO addons VALUES('airtrail','AirTrail','Sync flights from your self-hosted AirTrail instance','integration','Plane',0,'{}',14);
INSERT INTO addons VALUES('collections','Collections','Personal place library — save places across trips into named lists, copy into any trip, share with others','global','Bookmark',0,'{}',16);
INSERT INTO addons VALUES('packing','Lists','Packing lists and to-do tasks for your trips','trip','ListChecks',1,'{}',0);
INSERT INTO addons VALUES('budget','Costs','Track and split trip expenses','trip','Wallet',1,'{}',1);
INSERT INTO addons VALUES('documents','Documents','Store and manage travel documents','trip','FileText',1,'{}',2);
INSERT INTO addons VALUES('vacay','Vacay','Personal vacation day planner with calendar view','global','CalendarDays',1,'{}',10);
INSERT INTO addons VALUES('atlas','Atlas','World map of your visited countries with travel stats','global','Globe',1,'{}',11);
INSERT INTO addons VALUES('llm_parsing','AI Parsing','LLM fallback for booking imports kitinerary cannot read','integration','Sparkles',0,'{}',15);
CREATE TABLE photo_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Image',
      enabled INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );
INSERT INTO photo_providers VALUES('synologyphotos','Synology Photos','Synology Photos integration with separate account settings','Image',0,1);
INSERT INTO photo_providers VALUES('immich','Immich','Immich photo provider','Image',0,0);
CREATE TABLE photo_provider_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id TEXT NOT NULL REFERENCES photo_providers(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL,
      label TEXT NOT NULL,
      input_type TEXT NOT NULL DEFAULT 'text',
      placeholder TEXT,
      hint TEXT,
      required INTEGER DEFAULT 0,
      secret INTEGER DEFAULT 0,
      settings_key TEXT,
      payload_key TEXT,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(provider_id, field_key)
    );
INSERT INTO photo_provider_fields VALUES(1,'synologyphotos','synology_url','providerUrl','url','https://synology.example.com','providerUrlHintSynology',1,0,'synology_url','synology_url',0);
INSERT INTO photo_provider_fields VALUES(2,'synologyphotos','synology_username','providerUsername','text','Username',NULL,1,0,'synology_username','synology_username',1);
INSERT INTO photo_provider_fields VALUES(3,'synologyphotos','synology_password','providerPassword','password','Password',NULL,1,1,NULL,'synology_password',2);
INSERT INTO photo_provider_fields VALUES(4,'synologyphotos','synology_otp','providerOTP','text','123456',NULL,0,0,NULL,'synology_otp',3);
INSERT INTO photo_provider_fields VALUES(5,'synologyphotos','synology_skip_ssl','skipSSLVerification','checkbox',NULL,NULL,0,0,'synology_skip_ssl','synology_skip_ssl',4);
INSERT INTO photo_provider_fields VALUES(6,'immich','immich_url','providerUrl','url','https://immich.example.com',NULL,1,0,'immich_url','immich_url',0);
INSERT INTO photo_provider_fields VALUES(7,'immich','immich_api_key','providerApiKey','password','API Key',NULL,1,1,NULL,'immich_api_key',1);
CREATE TABLE vacay_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      block_weekends INTEGER DEFAULT 1,
      holidays_enabled INTEGER DEFAULT 0,
      holidays_region TEXT DEFAULT '',
      school_holidays_enabled INTEGER DEFAULT 0,
      company_holidays_enabled INTEGER DEFAULT 1,
      carry_over_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, weekend_days TEXT DEFAULT '0,6', week_start INTEGER NOT NULL DEFAULT 1,
      UNIQUE(owner_id)
    );
CREATE TABLE vacay_plan_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plan_id, user_id)
    );
CREATE TABLE vacay_user_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      color TEXT DEFAULT '#6366f1',
      UNIQUE(user_id, plan_id)
    );
CREATE TABLE vacay_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      UNIQUE(plan_id, year)
    );
CREATE TABLE vacay_user_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      vacation_days INTEGER DEFAULT 30,
      carried_over INTEGER DEFAULT 0,
      UNIQUE(user_id, plan_id, year)
    );
CREATE TABLE vacay_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT DEFAULT '', fraction REAL NOT NULL DEFAULT 1, kind TEXT NOT NULL DEFAULT 'vacation',
      UNIQUE(user_id, plan_id, date)
    );
CREATE TABLE vacay_company_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      UNIQUE(plan_id, date)
    );
CREATE TABLE vacay_holiday_calendars (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id   INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      type      TEXT NOT NULL DEFAULT 'public_holiday',
      region    TEXT NOT NULL,
      label     TEXT,
      color     TEXT NOT NULL DEFAULT '#fecaca',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
CREATE TABLE collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT 'Bookmark',
      cover_image TEXT,
      links TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE collection_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      role TEXT NOT NULL DEFAULT 'editor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(collection_id, user_id)
    );
CREATE TABLE collection_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      saved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT,
      lat REAL,
      lng REAL,
      address TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price REAL,
      currency TEXT,
      notes TEXT,
      image_url TEXT,
      google_place_id TEXT,
      google_ftid TEXT,
      osm_id TEXT,
      website TEXT,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'idea',
      source_trip_id INTEGER,
      source_place_id INTEGER,
      links TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE collection_place_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(collection_place_id, user_id)
    );
CREATE TABLE collection_place_tags (
      collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (collection_place_id, tag_id)
    );
CREATE TABLE collection_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE collection_place_labels (
      collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
      label_id INTEGER NOT NULL REFERENCES collection_labels(id) ON DELETE CASCADE,
      PRIMARY KEY (collection_place_id, label_id)
    );
CREATE TABLE collab_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT DEFAULT 'General',
      title TEXT NOT NULL,
      content TEXT,
      color TEXT DEFAULT '#6366f1',
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , website TEXT);
CREATE TABLE collab_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      multiple INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE collab_poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES collab_polls(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      option_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(poll_id, user_id, option_index)
    );
CREATE TABLE collab_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      reply_to INTEGER REFERENCES collab_messages(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , deleted INTEGER DEFAULT 0);
CREATE TABLE assignment_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(assignment_id, user_id)
    );
CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource TEXT,
      details TEXT,
      ip TEXT
    );
CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('simple', 'boolean', 'navigate')),
      scope TEXT NOT NULL CHECK(scope IN ('trip', 'user', 'admin')),
      target INTEGER NOT NULL,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title_key TEXT NOT NULL,
      title_params TEXT DEFAULT '{}',
      text_key TEXT NOT NULL,
      text_params TEXT DEFAULT '{}',
      positive_text_key TEXT,
      negative_text_key TEXT,
      positive_callback TEXT,
      negative_callback TEXT,
      response TEXT CHECK(response IN ('positive', 'negative')),
      navigate_text_key TEXT,
      navigate_target TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE notification_channel_preferences (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, event_type, channel)
    );
CREATE TABLE migrations (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, timestamp bigint NOT NULL, name varchar NOT NULL);
INSERT INTO migrations VALUES(1,1777810195344,'InitialSchema1777810195344');
CREATE TABLE budget_item_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          budget_item_id INTEGER NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          paid INTEGER NOT NULL DEFAULT 0, amount REAL,
          UNIQUE(budget_item_id, user_id)
        );
CREATE TABLE collab_message_reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER NOT NULL REFERENCES collab_messages(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          emoji TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id, emoji)
        );
CREATE TABLE invite_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL);
CREATE TABLE packing_category_assignees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category_name TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trip_id, category_name, user_id)
      );
CREATE TABLE packing_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE packing_template_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES packing_templates(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
CREATE TABLE packing_template_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES packing_template_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
CREATE TABLE packing_bags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        weight_limit_grams INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , user_id INTEGER REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL);
CREATE TABLE visited_countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, country_code)
      );
CREATE TABLE bucket_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        country_code TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , target_date TEXT DEFAULT NULL);
CREATE TABLE file_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL REFERENCES trip_files(id) ON DELETE CASCADE,
        reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
        assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_id, reservation_id),
        UNIQUE(file_id, assignment_id),
        UNIQUE(file_id, place_id)
      );
CREATE TABLE share_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        created_by INTEGER NOT NULL REFERENCES users(id),
        share_map INTEGER DEFAULT 1,
        share_bookings INTEGER DEFAULT 1,
        share_packing INTEGER DEFAULT 0,
        share_budget INTEGER DEFAULT 0,
        share_collab INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , expires_at TEXT);
CREATE TABLE mcp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_prefix TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      , kind TEXT NOT NULL DEFAULT 'mcp');
CREATE TABLE IF NOT EXISTS "trip_album_links" (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              provider TEXT NOT NULL,
              album_id TEXT NOT NULL,
              album_name TEXT NOT NULL DEFAULT '',
              sync_enabled INTEGER NOT NULL DEFAULT 1,
              last_synced_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP, passphrase TEXT DEFAULT NULL,
              UNIQUE(trip_id, user_id, provider, album_id)
            );
CREATE TABLE todo_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          checked INTEGER DEFAULT 0,
          category TEXT,
          sort_order INTEGER DEFAULT 0,
          due_date TEXT,
          description TEXT,
          assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          priority INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , reminded_at DATETIME);
CREATE TABLE todo_category_assignees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          category_name TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(trip_id, category_name, user_id)
        );
CREATE TABLE place_regions (
          place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
          country_code TEXT NOT NULL,
          region_code TEXT NOT NULL,
          region_name TEXT NOT NULL
        );
CREATE TABLE visited_regions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          region_code TEXT NOT NULL,
          region_name TEXT NOT NULL,
          country_code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, region_code)
        );
CREATE TABLE packing_bag_members (
          bag_id INTEGER NOT NULL REFERENCES packing_bags(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (bag_id, user_id)
        );
CREATE TABLE reservation_day_positions (
          reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
          day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
          position REAL NOT NULL,
          PRIMARY KEY (reservation_id, day_id)
        );
CREATE TABLE budget_category_order (
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (trip_id, category)
        );
CREATE TABLE oauth_consents (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id  TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
          user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          scopes     TEXT NOT NULL DEFAULT '[]',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(client_id, user_id)
        );
CREATE TABLE oauth_tokens (
          id                        INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id                 TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
          user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          access_token_hash         TEXT UNIQUE NOT NULL,
          refresh_token_hash        TEXT UNIQUE NOT NULL,
          scopes                    TEXT NOT NULL DEFAULT '[]',
          access_token_expires_at   DATETIME NOT NULL,
          refresh_token_expires_at  DATETIME NOT NULL,
          revoked_at                DATETIME,
          created_at                DATETIME DEFAULT CURRENT_TIMESTAMP
        , parent_token_id INTEGER REFERENCES oauth_tokens(id), audience TEXT);
CREATE TABLE IF NOT EXISTS "oauth_clients" (
                id                 TEXT PRIMARY KEY,
                user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name               TEXT NOT NULL,
                client_id          TEXT UNIQUE NOT NULL,
                client_secret_hash TEXT NOT NULL,
                redirect_uris      TEXT NOT NULL DEFAULT '[]',
                allowed_scopes     TEXT NOT NULL DEFAULT '[]',
                created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_public          INTEGER NOT NULL DEFAULT 0,
                created_via        TEXT NOT NULL DEFAULT 'settings_ui'
              , allows_client_credentials INTEGER NOT NULL DEFAULT 0);
CREATE TABLE journeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT,
          cover_gradient TEXT,
          status TEXT DEFAULT 'draft',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL, cover_image TEXT, show_trip_tracks INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
CREATE TABLE journey_trips (
          journey_id INTEGER NOT NULL,
          trip_id INTEGER NOT NULL,
          added_at INTEGER NOT NULL,
          PRIMARY KEY (journey_id, trip_id),
          FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
          FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
        );
CREATE TABLE journey_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id INTEGER NOT NULL,
          source_trip_id INTEGER,
          source_place_id INTEGER,
          author_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT,
          story TEXT,
          entry_date TEXT NOT NULL,
          entry_time TEXT,
          location_name TEXT,
          location_lat REAL,
          location_lng REAL,
          mood TEXT,
          weather TEXT,
          tags TEXT,
          visibility TEXT DEFAULT 'private',
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL, pros_cons TEXT, stats_excluded INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
          FOREIGN KEY (source_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
          FOREIGN KEY (source_place_id) REFERENCES places(id) ON DELETE SET NULL,
          FOREIGN KEY (author_id) REFERENCES users(id)
        );
CREATE TABLE journey_contributors (
          journey_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          added_at INTEGER NOT NULL, hide_skeletons INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (journey_id, user_id),
          FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
CREATE TABLE journey_share_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_by INTEGER NOT NULL,
          share_timeline INTEGER DEFAULT 1,
          share_gallery INTEGER DEFAULT 1,
          share_map INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, newest_first INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
CREATE TABLE trek_photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          asset_id TEXT,
          owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          file_path TEXT,
          thumbnail_path TEXT,
          width INTEGER,
          height INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , passphrase TEXT DEFAULT NULL, media_type TEXT NOT NULL DEFAULT 'image', duration_ms INTEGER, taken_at TEXT, lat REAL, lng REAL);
CREATE TABLE IF NOT EXISTS "trip_photos" (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              photo_id INTEGER NOT NULL REFERENCES trek_photos(id) ON DELETE CASCADE,
              shared INTEGER NOT NULL DEFAULT 1,
              album_link_id INTEGER REFERENCES trip_album_links(id) ON DELETE SET NULL,
              added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(trip_id, user_id, photo_id)
            );
CREATE TABLE user_notice_dismissals (
          user_id      INTEGER NOT NULL,
          notice_id    TEXT    NOT NULL,
          dismissed_at INTEGER NOT NULL, dismissed_app_version TEXT,
          PRIMARY KEY (user_id, notice_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
CREATE TABLE google_place_photo_meta (
          place_id   TEXT    PRIMARY KEY,
          attribution TEXT,
          fetched_at INTEGER NOT NULL,
          error_at   INTEGER
        );
CREATE TABLE place_details_cache (
          place_id   TEXT    NOT NULL,
          lang       TEXT    NOT NULL DEFAULT '',
          expanded   INTEGER NOT NULL DEFAULT 0,
          payload_json TEXT  NOT NULL,
          fetched_at INTEGER NOT NULL,
          PRIMARY KEY (place_id, lang, expanded)
        );
CREATE TABLE trek_photo_cache_meta (
        cache_key  TEXT    PRIMARY KEY,
        content_type TEXT  NOT NULL DEFAULT 'image/jpeg',
        fetched_at INTEGER NOT NULL
      );
CREATE TABLE reservation_endpoints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          sequence INTEGER NOT NULL DEFAULT 0,
          name TEXT NOT NULL,
          code TEXT,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          timezone TEXT,
          local_time TEXT,
          local_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
          key         TEXT NOT NULL,
          user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          method      TEXT NOT NULL,
          path        TEXT NOT NULL,
          status_code INTEGER NOT NULL,
          response_body TEXT NOT NULL,
          created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          PRIMARY KEY (key, user_id, method, path)
        );
CREATE TABLE IF NOT EXISTS "day_accommodations" (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id      INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          place_id     INTEGER REFERENCES places(id) ON DELETE SET NULL,
          start_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
          end_day_id   INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
          check_in     TEXT,
          check_in_end TEXT,
          check_out    TEXT,
          confirmation TEXT,
          notes        TEXT,
          created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO day_accommodations VALUES(1,1,1,2,3,'14:00',NULL,'10:00',NULL,NULL,'2026-09-24 08:10:00');
CREATE TABLE journey_photos (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id  INTEGER NOT NULL REFERENCES journeys(id)    ON DELETE CASCADE,
          photo_id    INTEGER NOT NULL REFERENCES trek_photos(id) ON DELETE CASCADE,
          caption     TEXT,
          shared      INTEGER DEFAULT 0,
          sort_order  INTEGER DEFAULT 0,
          provider    TEXT,
          asset_id    TEXT,
          owner_id    INTEGER,
          created_at  INTEGER NOT NULL,
          UNIQUE(journey_id, photo_id)
        );
CREATE TABLE journey_entry_photos (
          entry_id          INTEGER NOT NULL REFERENCES journey_entries(id) ON DELETE CASCADE,
          journey_photo_id  INTEGER NOT NULL REFERENCES journey_photos(id)  ON DELETE CASCADE,
          sort_order        INTEGER DEFAULT 0,
          created_at        INTEGER NOT NULL,
          PRIMARY KEY(entry_id, journey_photo_id)
        );
CREATE TABLE IF NOT EXISTS "schema_version" (id INTEGER PRIMARY KEY AUTOINCREMENT,version INTEGER NOT NULL);
INSERT INTO schema_version VALUES(1,205);
CREATE TABLE budget_item_payers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          budget_item_id INTEGER NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount REAL NOT NULL DEFAULT 0,
          UNIQUE(budget_item_id, user_id)
        );
CREATE TABLE budget_settlements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount REAL NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by_user_id INTEGER REFERENCES users(id)
        , currency TEXT, exchange_rate REAL NOT NULL DEFAULT 1);
CREATE TABLE packing_item_recipients (
          item_id INTEGER NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (item_id, user_id)
        );
CREATE TABLE packing_item_contributors (
          item_id INTEGER NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'accepted',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (item_id, user_id)
        );
CREATE TABLE trip_invite_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          expires_at TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
CREATE TABLE plugins (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL DEFAULT 'integration',
          icon TEXT DEFAULT 'Blocks',
          version TEXT,
          api_version INTEGER DEFAULT 1,
          min_trek_version TEXT,
          permissions TEXT DEFAULT '[]',
          granted_permissions TEXT DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'inactive',
          config TEXT DEFAULT '{}',
          source_repo TEXT,
          source_commit TEXT,
          sha256 TEXT,
          crash_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          reviewed_at TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , enabled INTEGER NOT NULL DEFAULT 0, capabilities TEXT NOT NULL DEFAULT '{}', author_pubkey TEXT, dependencies TEXT NOT NULL DEFAULT '{}', operator_egress INTEGER NOT NULL DEFAULT 0, update_block_code TEXT, update_block_detail TEXT, update_block_version TEXT, trek_range TEXT, update_hold INTEGER NOT NULL DEFAULT 0);
CREATE TABLE plugin_meta_migrations (
          plugin_id TEXT NOT NULL,
          migration_id TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (plugin_id, migration_id)
        );
CREATE TABLE plugin_error_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          ts DATETIME DEFAULT CURRENT_TIMESTAMP,
          level TEXT NOT NULL DEFAULT 'error',
          message TEXT,
          stack TEXT
        );
CREATE TABLE plugin_settings_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          field_key TEXT NOT NULL,
          label TEXT,
          input_type TEXT NOT NULL DEFAULT 'text',
          placeholder TEXT,
          hint TEXT,
          required INTEGER NOT NULL DEFAULT 0,
          secret INTEGER NOT NULL DEFAULT 0,
          scope TEXT NOT NULL DEFAULT 'instance',
          options TEXT,
          oauth_config TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0, default_value TEXT,
          UNIQUE (plugin_id, field_key)
        );
CREATE TABLE plugin_capability_audit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          acting_user_id INTEGER,
          method TEXT NOT NULL,
          resource TEXT,
          code TEXT NOT NULL,
          ts TEXT NOT NULL DEFAULT (datetime('now')),
          prev_hash TEXT,
          hash TEXT NOT NULL
        );
CREATE TABLE plugin_entity_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (plugin_id, entity_type, entity_id, key)
      );
CREATE TABLE plugin_user_config (
          plugin_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          config TEXT NOT NULL DEFAULT '{}',
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (plugin_id, user_id)
        );
CREATE TABLE plugin_oauth_tokens (
          plugin_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at INTEGER,
          scope TEXT,
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (plugin_id, user_id)
        );
CREATE TABLE plugin_oauth_state (
          state TEXT PRIMARY KEY,
          plugin_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          verifier TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
CREATE TABLE plugin_scheduled_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          name TEXT NOT NULL,
          due_at INTEGER NOT NULL,
          payload TEXT NOT NULL DEFAULT 'null',
          every_ms INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (plugin_id, name)
        );
CREATE TABLE plugin_user_erasure_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (plugin_id, user_id)
        );
CREATE TABLE hidden_countries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          country_code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, country_code)
        );
CREATE TABLE plugin_egress_hosts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          host TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (plugin_id, host)
        );
CREATE TABLE plugin_actions (
          plugin_id TEXT NOT NULL,
          action_key TEXT NOT NULL,
          label TEXT NOT NULL,
          hint TEXT,
          danger INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0, scope TEXT NOT NULL DEFAULT 'user',
          PRIMARY KEY (plugin_id, action_key)
        );
CREATE TABLE hidden_regions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          region_code TEXT NOT NULL,
          country_code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, region_code)
        );
CREATE TABLE vacay_shares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          hidden INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (owner_id, user_id)
        );
CREATE TABLE reservation_travelers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(reservation_id, user_id)
        );
CREATE TABLE vacay_user_settings (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          year_type TEXT NOT NULL DEFAULT 'calendar',
          year_start_month INTEGER NOT NULL DEFAULT 1,
          year_start_day INTEGER NOT NULL DEFAULT 1,
          hire_date TEXT
        );
CREATE TABLE journey_books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT '',
          document TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
PRAGMA writable_schema=ON;
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('trip_album_links',0);
INSERT INTO sqlite_sequence VALUES('photo_provider_fields',12);
INSERT INTO sqlite_sequence VALUES('trek_photos',0);
INSERT INTO sqlite_sequence VALUES('trip_photos',0);
INSERT INTO sqlite_sequence VALUES('day_accommodations',1);
INSERT INTO sqlite_sequence VALUES('journey_photos',0);
INSERT INTO sqlite_sequence VALUES('migrations',1);
INSERT INTO sqlite_sequence VALUES('schema_version',1);
INSERT INTO sqlite_sequence VALUES('budget_item_payers',0);
INSERT INTO sqlite_sequence VALUES('users',1);
INSERT INTO sqlite_sequence VALUES('categories',10);
INSERT INTO sqlite_sequence VALUES('trips',1);
INSERT INTO sqlite_sequence VALUES('days',3);
INSERT INTO sqlite_sequence VALUES('places',4);
INSERT INTO sqlite_sequence VALUES('day_assignments',3);
CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_webauthn_credentials_user ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_collection_places_collection ON collection_places(collection_id);
CREATE INDEX idx_collection_members_user ON collection_members(user_id);
CREATE INDEX idx_collection_place_tags_place ON collection_place_tags(collection_place_id);
CREATE INDEX idx_collection_place_tags_tag ON collection_place_tags(tag_id);
CREATE INDEX idx_collection_labels_collection ON collection_labels(collection_id);
CREATE INDEX idx_collection_place_labels_place ON collection_place_labels(collection_place_id);
CREATE INDEX idx_collection_place_labels_label ON collection_place_labels(label_id);
CREATE INDEX idx_collab_notes_trip ON collab_notes(trip_id);
CREATE INDEX idx_collab_polls_trip ON collab_polls(trip_id);
CREATE INDEX idx_collab_messages_trip ON collab_messages(trip_id);
CREATE INDEX idx_places_trip_id ON places(trip_id);
CREATE INDEX idx_places_category_id ON places(category_id);
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_day_assignments_day_id ON day_assignments(day_id);
CREATE INDEX idx_day_assignments_place_id ON day_assignments(place_id);
CREATE INDEX idx_place_tags_place_id ON place_tags(place_id);
CREATE INDEX idx_place_tags_tag_id ON place_tags(tag_id);
CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX idx_packing_items_trip_id ON packing_items(trip_id);
CREATE INDEX idx_budget_items_trip_id ON budget_items(trip_id);
CREATE INDEX idx_reservations_trip_id ON reservations(trip_id);
CREATE INDEX idx_trip_files_trip_id ON trip_files(trip_id);
CREATE INDEX idx_day_notes_day_id ON day_notes(day_id);
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assignment_participants_assignment ON assignment_participants(assignment_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_ncp_user ON notification_channel_preferences(user_id);
CREATE INDEX idx_budget_item_members_item ON budget_item_members(budget_item_id);
CREATE INDEX idx_budget_item_members_user ON budget_item_members(user_id);
CREATE INDEX idx_collab_reactions_msg ON collab_message_reactions(message_id);
CREATE UNIQUE INDEX idx_mcp_tokens_hash ON mcp_tokens(token_hash)
    ;
CREATE INDEX idx_trip_album_links_trip ON trip_album_links(trip_id);
CREATE INDEX idx_todo_items_trip_id ON todo_items(trip_id);
CREATE INDEX idx_place_regions_country ON place_regions(country_code);
CREATE INDEX idx_place_regions_region ON place_regions(region_code);
CREATE INDEX idx_visited_regions_country ON visited_regions(country_code);
CREATE INDEX idx_packing_bag_members_bag ON packing_bag_members(bag_id);
CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE UNIQUE INDEX idx_oauth_tokens_access  ON oauth_tokens(access_token_hash);
CREATE UNIQUE INDEX idx_oauth_tokens_refresh ON oauth_tokens(refresh_token_hash);
CREATE INDEX idx_oauth_tokens_parent ON oauth_tokens(parent_token_id);
CREATE INDEX idx_oauth_clients_user ON oauth_clients(user_id);
CREATE UNIQUE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX idx_journeys_user ON journeys(user_id);
CREATE INDEX idx_journey_entries_journey ON journey_entries(journey_id, entry_date);
CREATE INDEX idx_journey_entries_source ON journey_entries(source_place_id);
CREATE INDEX idx_journey_trips_journey ON journey_trips(journey_id);
CREATE INDEX idx_journey_contributors_user ON journey_contributors(user_id);
CREATE UNIQUE INDEX idx_journey_share_journey ON journey_share_tokens(journey_id);
CREATE UNIQUE INDEX idx_trek_photos_provider_asset ON trek_photos(provider, asset_id, owner_id) WHERE asset_id IS NOT NULL;
CREATE INDEX idx_trek_photos_owner ON trek_photos(owner_id);
CREATE INDEX idx_trip_photos_trip ON trip_photos(trip_id);
CREATE INDEX idx_trip_photos_photo ON trip_photos(photo_id);
CREATE INDEX idx_trek_photo_cache_meta_fetched_at ON trek_photo_cache_meta (fetched_at);
CREATE INDEX idx_reservation_endpoints_reservation_id ON reservation_endpoints(reservation_id);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_photos_day_id ON photos(day_id);
CREATE INDEX idx_photos_place_id ON photos(place_id);
CREATE INDEX idx_reservations_day_id ON reservations(day_id);
CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_notifications_target_scope ON notifications(target, scope);
CREATE INDEX idx_idempotency_keys_created ON idempotency_keys(created_at);
CREATE INDEX idx_day_accommodations_trip_id ON day_accommodations(trip_id);
CREATE INDEX idx_day_accommodations_start_day_id ON day_accommodations(start_day_id);
CREATE INDEX idx_day_accommodations_end_day_id ON day_accommodations(end_day_id);
CREATE INDEX idx_journey_photos_journey       ON journey_photos(journey_id);
CREATE INDEX idx_journey_entry_photos_entry   ON journey_entry_photos(entry_id);
CREATE INDEX idx_journey_entry_photos_photo   ON journey_entry_photos(journey_photo_id);
CREATE INDEX idx_journey_entries_order ON journey_entries(journey_id, entry_date, sort_order);
CREATE INDEX idx_budget_item_payers_item ON budget_item_payers(budget_item_id);
CREATE INDEX idx_budget_settlements_trip ON budget_settlements(trip_id);
CREATE UNIQUE INDEX idx_reservations_external ON reservations(external_source, external_id, trip_id);
CREATE UNIQUE INDEX idx_trips_feed_token ON trips(feed_token) WHERE feed_token IS NOT NULL;
CREATE UNIQUE INDEX idx_users_feed_token ON users(feed_token) WHERE feed_token IS NOT NULL;
CREATE INDEX idx_packing_item_recipients_user ON packing_item_recipients(user_id);
CREATE INDEX idx_trip_invite_tokens_token ON trip_invite_tokens(token);
CREATE INDEX idx_plugin_error_log_plugin ON plugin_error_log(plugin_id, ts);
CREATE INDEX idx_plugin_audit_plugin ON plugin_capability_audit (plugin_id, id);
CREATE INDEX idx_plugin_meta_entity ON plugin_entity_metadata (plugin_id, entity_type, entity_id);
CREATE INDEX idx_plugin_sched_due ON plugin_scheduled_tasks (due_at);
CREATE INDEX idx_plugin_erasure_plugin ON plugin_user_erasure_queue (plugin_id);
CREATE INDEX idx_hidden_countries_user ON hidden_countries (user_id);
CREATE INDEX idx_plugin_egress_hosts_plugin ON plugin_egress_hosts (plugin_id);
CREATE INDEX idx_hidden_regions_user ON hidden_regions (user_id);
CREATE INDEX idx_vacay_shares_user ON vacay_shares (user_id);
CREATE INDEX idx_place_ratings_place ON place_ratings (place_id);
CREATE INDEX idx_collection_place_ratings_place ON collection_place_ratings (collection_place_id);
CREATE INDEX idx_reservation_travelers_res ON reservation_travelers(reservation_id);
CREATE INDEX idx_reservation_travelers_user ON reservation_travelers(user_id);
CREATE INDEX idx_trek_photos_geo ON trek_photos(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_journey_books_journey ON journey_books(journey_id);
PRAGMA writable_schema=OFF;
COMMIT;
