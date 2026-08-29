/**
 * Trips module e2e — exercises the migrated /api/trips aggregate-root endpoints
 * through the real JwtAuthGuard against a temp SQLite db. TripsService runs its
 * real (DI-native) SQL — trips/trip_members/days DDL below; auditLog, demo, the
 * permission check, canAccessTrip and the WebSocket broadcast are mocked.
 */
// TripsService itself is real since the trip fold — no tripService mock; the
// trips/trip_members/days DDL above serves its SQL.
// bundle()'s days + accommodations now run DaysService's real SQL (DI-injected,
// no mock) — the days/places/day_accommodations/reservations DDL above serves them.
// bundle()'s places now run PlacesService's real SQL (DI-injected since the
// place fold, no mock) — the places/categories/tags DDL above serves them.
// bundle()'s budget items come from the DI-injected BudgetService since the
// budget fold — stubbed via a container spy in beforeAll (no budget DDL here).
import { BudgetService } from '../../src/nest/budget/budget.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT, display_name TEXT, is_guest INTEGER NOT NULL DEFAULT 0);`);
  // TripsService runs its real SQL (DI-native since the trip fold) — full trip
  // column set for TRIP_SELECT + create/update/delete, plus the membership and
  // day-content tables generateDays/listMembers/deleteTrip touch.
  tmp.exec(`CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL,
    description TEXT, start_date TEXT, end_date TEXT, currency TEXT DEFAULT 'EUR', is_archived INTEGER DEFAULT 0,
    cover_image TEXT, reminder_days INTEGER DEFAULT 3, feed_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE trip_members (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, invited_by INTEGER, added_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL, order_index INTEGER DEFAULT 0, notes TEXT, reservation_status TEXT,
    reservation_notes TEXT, reservation_datetime TEXT, assignment_time TEXT, assignment_end_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE day_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL, text TEXT, time TEXT, icon TEXT, sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // deleteTrip cleans up synced journey entries before dropping the trip row.
  tmp.exec(`CREATE TABLE journey_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, journey_id INTEGER,
    source_trip_id INTEGER, source_place_id INTEGER, type TEXT NOT NULL);`);
  // bundle()'s todoItems now runs TodoService's real SQL (DI-injected, no mock).
  tmp.exec(`CREATE TABLE todo_items (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    name TEXT NOT NULL, checked INTEGER NOT NULL DEFAULT 0, category TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
    due_date TEXT, description TEXT, assigned_user_id INTEGER, priority INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // bundle()'s packingItems now runs PackingService's real SQL (DI-injected, no
  // mock) — viewer-scoped (#858), so the recipients table must exist too.
  tmp.exec(`CREATE TABLE packing_items (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    name TEXT NOT NULL, checked INTEGER DEFAULT 0, category TEXT, sort_order INTEGER DEFAULT 0,
    weight_grams INTEGER, bag_id INTEGER, quantity INTEGER NOT NULL DEFAULT 1,
    is_private INTEGER NOT NULL DEFAULT 0, owner_id INTEGER, updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE packing_item_recipients (item_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    PRIMARY KEY (item_id, user_id));`);
  // bundle()'s files now runs FilesService's real SQL (DI-injected, no mock) —
  // empty tables satisfy the FILE_SELECT joins and the file_links batch.
  tmp.exec(`CREATE TABLE trip_files (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    place_id INTEGER, reservation_id INTEGER, filename TEXT NOT NULL, original_name TEXT NOT NULL,
    file_size INTEGER, mime_type TEXT, description TEXT, uploaded_by INTEGER, starred INTEGER DEFAULT 0,
    deleted_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE file_links (id INTEGER PRIMARY KEY AUTOINCREMENT, file_id INTEGER NOT NULL,
    reservation_id INTEGER, assignment_id INTEGER, place_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // bundle()'s reservations now runs ReservationsService's real SQL
  // (DI-injected, no mock) — the joined list query needs the full reservation
  // table set (trimmed from src/db/schema.ts; accommodation_id is TEXT there).
  tmp.exec(`CREATE TABLE reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, title TEXT,
    day_id INTEGER, end_day_id INTEGER, place_id INTEGER, assignment_id INTEGER, type TEXT,
    status TEXT DEFAULT 'pending', reservation_time TEXT, reservation_end_time TEXT, location TEXT,
    confirmation_number TEXT, notes TEXT, url TEXT, accommodation_id TEXT, metadata TEXT,
    needs_review INTEGER DEFAULT 0, day_plan_position REAL, external_source TEXT, sync_enabled INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(
    'CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, day_number INTEGER, date TEXT);',
  );
  tmp.exec(`CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, name TEXT,
    image_url TEXT, address TEXT, lat REAL, lng REAL, category_id INTEGER, description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // PlacesService.list joins categories and batch-loads tags/ratings.
  tmp.exec('CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, icon TEXT);');
  tmp.exec('CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, created_at DATETIME);');
  tmp.exec(
    'CREATE TABLE place_tags (place_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (place_id, tag_id));',
  );
  tmp.exec(
    'CREATE TABLE place_ratings (place_id INTEGER NOT NULL, user_id INTEGER NOT NULL, rating INTEGER, created_at DATETIME, UNIQUE(place_id, user_id));',
  );
  tmp.exec(`CREATE TABLE day_accommodations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    place_id INTEGER, start_day_id INTEGER, end_day_id INTEGER, check_in TEXT, check_in_end TEXT,
    check_out TEXT, confirmation TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE reservation_day_positions (reservation_id INTEGER NOT NULL, day_id INTEGER NOT NULL,
    position REAL, PRIMARY KEY (reservation_id, day_id));`);
  tmp.exec(`CREATE TABLE reservation_endpoints (id INTEGER PRIMARY KEY AUTOINCREMENT, reservation_id INTEGER NOT NULL,
    role TEXT, sequence INTEGER, name TEXT, code TEXT, lat REAL NOT NULL, lng REAL NOT NULL,
    timezone TEXT, local_time TEXT, local_date TEXT);`);
  tmp.exec(`CREATE TABLE reservation_travelers (reservation_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    PRIMARY KEY (reservation_id, user_id));`);
  // AuditService now runs its real INSERT (DI-injected, no mock) — slim
  // audit_log mirror (no FKs), same shape as plugin-runtime.test.ts.
  tmp.exec(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip,
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(),
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
// The audit domain is DI-native now: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
vi.mock('../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

describe('Trips e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, TripsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    vi.spyOn(app.get(BudgetService), 'listBudgetItems').mockReturnValue([]);
    vi.spyOn(app.get(BudgetService), 'rebaseTripCurrency').mockResolvedValue();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM trips').run();
    db.prepare('DELETE FROM trip_members').run();
    db.prepare('DELETE FROM days').run();
    db.prepare('DELETE FROM audit_log').run();
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  const seedTrip = (title = 'T', userId = 1) =>
    Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?)').run(userId, title).lastInsertRowid);

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips')).status).toBe(401);
  });

  it('200 list (real TRIP_SELECT: is_owner + counts)', async () => {
    const tripId = seedTrip('T');
    const res = await request(server).get('/api/trips').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0]).toMatchObject({
      id: tripId,
      title: 'T',
      is_owner: 1,
      day_count: 0,
      place_count: 0,
      shared_count: 0,
    });
  });

  it('201 create (real insert + day generation), 403 without permission', async () => {
    const ok = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(ok.status).toBe(201);
    // The dateless create seeds the default 7 placeholder days.
    expect(ok.body.trip).toMatchObject({ title: 'T', currency: 'EUR', day_count: 7, is_owner: 1 });
    const dayRows = db.prepare('SELECT COUNT(*) AS n FROM days WHERE trip_id = ?').get(ok.body.trip.id) as {
      n: number;
    };
    expect(dayRows.n).toBe(7);
    // The DI-native AuditService wrote the real row (audit_log DDL above).
    const audit = db.prepare("SELECT user_id FROM audit_log WHERE action = 'trip.create'").get() as { user_id: number };
    expect(audit).toEqual({ user_id: 1 });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(forbidden.status).toBe(403);
  });

  it('404 on a missing trip', async () => {
    const res = await request(server).get('/api/trips/77').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  describe('GET /active (startup destination)', () => {
    const seedDated = (title: string, start: string, end: string) =>
      Number(
        db
          .prepare('INSERT INTO trips (user_id, title, start_date, end_date) VALUES (1, ?, ?, ?)')
          .run(title, start, end).lastInsertRowid,
      );

    it('401 without a cookie', async () => {
      expect((await request(server).get('/api/trips/active')).status).toBe(401);
    });

    // The literal route sits above @Get(':id'); if it ever slips below, this
    // asks for a trip with the id "active" and comes back 404 instead.
    it('resolves as its own route rather than as /api/trips/:id', async () => {
      const running = seedDated('Running', '2000-01-01', '2999-12-31');
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        trip: { id: running, title: 'Running', start_date: '2000-01-01', end_date: '2999-12-31' },
      });
    });

    it('answers { trip: null } when the user has no trip at all', async () => {
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ trip: null });
    });

    it('carries no wide trip columns — it is read on first paint', async () => {
      seedDated('Running', '2000-01-01', '2999-12-31');
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(Object.keys(res.body.trip).sort()).toEqual(['end_date', 'id', 'start_date', 'title']);
    });
  });

  it('200 bundle for an accessible trip (real member list)', async () => {
    const tripId = seedTrip('B');
    const res = await request(server).get(`/api/trips/${tripId}/bundle`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ trip: { id: tripId }, days: [], members: [{ id: 1, role: 'owner' }] });
  });

  it('200 delete cleans up synced journey entries (real SQL)', async () => {
    const tripId = seedTrip('D');
    db.prepare("INSERT INTO journey_entries (journey_id, source_trip_id, type) VALUES (1, ?, 'skeleton')").run(tripId);
    const filledId = Number(
      db.prepare("INSERT INTO journey_entries (journey_id, source_trip_id, type) VALUES (1, ?, 'story')").run(tripId)
        .lastInsertRowid,
    );
    const res = await request(server).delete(`/api/trips/${tripId}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM trips WHERE id = ?').get(tripId)).toBeUndefined();
    expect(db.prepare("SELECT id FROM journey_entries WHERE type = 'skeleton'").get()).toBeUndefined();
    expect(
      (
        db.prepare('SELECT source_trip_id FROM journey_entries WHERE id = ?').get(filledId) as {
          source_trip_id: number | null;
        }
      ).source_trip_id,
    ).toBeNull();
  });
});
