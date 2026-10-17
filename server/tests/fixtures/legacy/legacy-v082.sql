-- Legacy-runner install at schema_version 82: the retired db/migrations.ts runner at 6df5edfbd
-- (tag v2.9.14), booted once with no DEMO_MODE, then the canary rows the legacy-baseline
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , immich_api_key TEXT);
INSERT INTO users VALUES(1,'admin','admin@trek.local','fixture-login-disabled','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-24 08:07:15','2026-09-24 08:07:15',NULL);
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO trips VALUES(1,1,'Legacy canary trip',NULL,'2026-10-01','2026-10-03','EUR',NULL,0,3,'2026-09-24 08:10:00','2026-09-24 08:10:00');
CREATE TABLE days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      date TEXT,
      notes TEXT,
      title TEXT,
      UNIQUE(trip_id, day_number)
    );
INSERT INTO days VALUES(1,1,1,'2026-10-01',NULL,NULL);
INSERT INTO days VALUES(2,1,2,'2026-10-02',NULL,NULL);
INSERT INTO days VALUES(3,1,3,'2026-10-03',NULL,NULL);
CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '📍',
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO categories VALUES(1,'Hotel','#3b82f6','🏨',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(2,'Restaurant','#ef4444','🍽️',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(3,'Attraction','#8b5cf6','🏛️',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(4,'Shopping','#f59e0b','🛍️',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(5,'Transport','#6b7280','🚌',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(6,'Activity','#10b981','🎯',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(7,'Bar/Cafe','#f97316','☕',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(8,'Beach','#06b6d4','🏖️',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(9,'Nature','#84cc16','🌿',NULL,'2026-09-24 08:07:15');
INSERT INTO categories VALUES(10,'Other','#6366f1','📍',NULL,'2026-09-24 08:07:15');
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
      website TEXT,
      phone TEXT,
      transport_mode TEXT DEFAULT 'walking',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , osm_id TEXT, route_geometry TEXT);
INSERT INTO places VALUES(1,1,'Canary hotel',NULL,41.3874,2.1686,NULL,NULL,NULL,NULL,'none',NULL,NULL,NULL,NULL,60,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL);
INSERT INTO places VALUES(2,1,'Morning stop',NULL,41.4036,2.1744,NULL,NULL,NULL,NULL,'none',NULL,NULL,'08:00',NULL,60,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL);
INSERT INTO places VALUES(3,1,'Evening stop',NULL,41.3809,2.1228,NULL,NULL,NULL,NULL,'none',NULL,NULL,'10:00',NULL,60,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL);
INSERT INTO places VALUES(4,1,'Late stop',NULL,41.3851,2.1734,NULL,NULL,NULL,NULL,'none',NULL,NULL,'13:00',NULL,60,NULL,NULL,NULL,NULL,NULL,'walking','2026-09-24 08:10:00','2026-09-24 08:10:00',NULL,NULL);
CREATE TABLE place_tags (
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (place_id, tag_id)
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
    , assignment_time TEXT, assignment_end_time TEXT);
INSERT INTO day_assignments VALUES(1,2,2,0,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','09:00',NULL);
INSERT INTO day_assignments VALUES(2,2,3,1,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','18:00',NULL);
INSERT INTO day_assignments VALUES(3,2,4,2,NULL,'none',NULL,NULL,'2026-09-24 08:10:00','20:00',NULL);
CREATE TABLE packing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , weight_grams INTEGER, bag_id INTEGER REFERENCES packing_bags(id) ON DELETE SET NULL, quantity INTEGER NOT NULL DEFAULT 1);
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
    , metadata TEXT, day_plan_position REAL DEFAULT NULL);
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
    );
CREATE TABLE app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
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
    , paid_by_user_id INTEGER REFERENCES users(id), expense_date TEXT DEFAULT NULL, reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL DEFAULT NULL);
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
INSERT INTO addons VALUES('packing','Lists','Packing lists and to-do tasks for your trips','trip','ListChecks',1,'{}',0);
INSERT INTO addons VALUES('budget','Budget Planner','Track expenses and plan your travel budget','trip','Wallet',1,'{}',1);
INSERT INTO addons VALUES('documents','Documents','Store and manage travel documents','trip','FileText',1,'{}',2);
INSERT INTO addons VALUES('vacay','Vacay','Personal vacation day planner with calendar view','global','CalendarDays',1,'{}',10);
INSERT INTO addons VALUES('atlas','Atlas','World map of your visited countries with travel stats','global','Globe',1,'{}',11);
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
      required INTEGER DEFAULT 0,
      secret INTEGER DEFAULT 0,
      settings_key TEXT,
      payload_key TEXT,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(provider_id, field_key)
    );
INSERT INTO photo_provider_fields VALUES(1,'synologyphotos','synology_url','providerUrl','url','https://synology.example.com',1,0,'synology_url','synology_url',0);
INSERT INTO photo_provider_fields VALUES(2,'synologyphotos','synology_username','providerUsername','text','Username',1,0,'synology_username','synology_username',1);
INSERT INTO photo_provider_fields VALUES(3,'synologyphotos','synology_password','providerPassword','password','Password',1,1,NULL,'synology_password',2);
INSERT INTO photo_provider_fields VALUES(4,'immich','immich_url','providerUrl','url','https://immich.example.com',1,0,'immich_url','immich_url',0);
INSERT INTO photo_provider_fields VALUES(5,'immich','immich_api_key','providerApiKey','password','API Key',1,1,NULL,'immich_api_key',1);
CREATE TABLE vacay_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      block_weekends INTEGER DEFAULT 1,
      holidays_enabled INTEGER DEFAULT 0,
      holidays_region TEXT DEFAULT '',
      company_holidays_enabled INTEGER DEFAULT 1,
      carry_over_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, weekend_days TEXT DEFAULT '0,6',
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
      note TEXT DEFAULT '',
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
      region    TEXT NOT NULL,
      label     TEXT,
      color     TEXT NOT NULL DEFAULT '#fecaca',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
CREATE TABLE day_accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      start_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      end_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      check_in TEXT,
      check_out TEXT,
      confirmation TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO day_accommodations VALUES(1,1,1,2,3,'14:00','10:00',NULL,NULL,'2026-09-24 08:10:00');
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
CREATE TABLE schema_version (version INTEGER NOT NULL);
INSERT INTO schema_version VALUES(82);
CREATE TABLE budget_item_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          budget_item_id INTEGER NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          paid INTEGER NOT NULL DEFAULT 0,
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
      );
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
      );
CREATE TABLE mcp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_prefix TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      );
CREATE TABLE IF NOT EXISTS "trip_photos" (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              asset_id TEXT NOT NULL,
              provider TEXT NOT NULL DEFAULT 'immich',
              shared INTEGER NOT NULL DEFAULT 1,
              added_at DATETIME DEFAULT CURRENT_TIMESTAMP, album_link_id INTEGER REFERENCES trip_album_links(id) ON DELETE SET NULL DEFAULT NULL,
              UNIQUE(trip_id, user_id, asset_id, provider)
            );
CREATE TABLE IF NOT EXISTS "trip_album_links" (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              provider TEXT NOT NULL,
              album_id TEXT NOT NULL,
              album_name TEXT NOT NULL DEFAULT '',
              sync_enabled INTEGER NOT NULL DEFAULT 1,
              last_synced_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
        );
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
PRAGMA writable_schema=ON;
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('trip_photos',0);
INSERT INTO sqlite_sequence VALUES('trip_album_links',0);
INSERT INTO sqlite_sequence VALUES('photo_provider_fields',8);
INSERT INTO sqlite_sequence VALUES('users',1);
INSERT INTO sqlite_sequence VALUES('categories',10);
INSERT INTO sqlite_sequence VALUES('trips',1);
INSERT INTO sqlite_sequence VALUES('days',3);
INSERT INTO sqlite_sequence VALUES('places',4);
INSERT INTO sqlite_sequence VALUES('day_assignments',3);
INSERT INTO sqlite_sequence VALUES('day_accommodations',1);
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
CREATE INDEX idx_day_accommodations_trip_id ON day_accommodations(trip_id);
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
CREATE INDEX idx_trip_photos_trip ON trip_photos(trip_id);
CREATE INDEX idx_trip_album_links_trip ON trip_album_links(trip_id);
CREATE INDEX idx_trip_photos_album_link ON trip_photos(album_link_id);
CREATE INDEX idx_todo_items_trip_id ON todo_items(trip_id);
CREATE INDEX idx_place_regions_country ON place_regions(country_code);
CREATE INDEX idx_place_regions_region ON place_regions(region_code);
CREATE INDEX idx_visited_regions_country ON visited_regions(country_code);
CREATE INDEX idx_packing_bag_members_bag ON packing_bag_members(bag_id);
PRAGMA writable_schema=OFF;
COMMIT;
