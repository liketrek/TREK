import { currentTimestampKysely } from '../dialect/kysely-functions';
import { AppSettings } from '../entities/AppSettings.entity';
import { Trips } from '../entities/Trips.entity';
import { Users } from '../entities/Users.entity';
import type { DB } from '../kysely/db';
import type { NewAdminUserRow } from './Users.repository';
import type { EntityManager } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/sql';

/** The tables the example-trip seed writes through Kysely. */
type DemoSeedKyselyDB = Pick<
  DB,
  | 'trip_members'
  | 'trips'
  | 'days'
  | 'places'
  | 'day_assignments'
  | 'packing_items'
  | 'budget_items'
  | 'reservations'
  | 'day_notes'
>;

/** DMR1's projection (`resetDemoUser`'s pre-close credential read). */
export interface DemoAdminCredentialsRow {
  password_hash: string;
  maps_api_key: string | null;
  openweather_api_key: string | null;
  unsplash_api_key: string | null;
  avatar: string | null;
}

/** DMR2's projection (`resetDemoUser`'s pre-close instance-API-key read) — a row per matched key, `value` preserved even when it is SQL NULL (unlike `AppSettingsRepository#getValues`, which drops a NULL-valued row from its Map; DMR6 re-writes exactly what DMR2 read, so a NULL must round-trip, not disappear). */
export interface DemoInstanceKeyRow {
  key: string;
  value: string | null;
}

/**
 * DMS9's 13-column `places` insert tuple — kept as a tuple, not an object,
 * so `demo-seed.ts`'s three ~30-row example-trip data arrays (Tokyo/Kyoto,
 * Barcelona, New York) pass through unchanged: `trip_id, name, lat, lng,
 * address, category_id, place_time, duration_minutes, notes, image_url,
 * google_place_id, website, phone`. `category_id` is HARD-CODED 1-9 in the
 * caller's data, coupled to `CategorySeeder`'s row order — a documented
 * fragility (`db/orm.ts`), not something this repository fixes.
 */
export type NewDemoPlaceRow = readonly [
  tripId: number,
  name: string,
  lat: number,
  lng: number,
  address: string,
  categoryId: number,
  placeTime: string,
  durationMinutes: number,
  notes: string,
  imageUrl: string | null,
  googlePlaceId: string | null,
  website: string | null,
  phone: string | null,
];

/**
 * Plan 3i Task 3 — `demo-seed.ts`'s 14 distinct statement texts (17 call
 * sites) and `demo-reset.ts`'s reset-side statements (per R3's SAFE spike
 * verdict, `task-0-report.md`), named ahead of this plan by the program
 * brief's own rule 4.
 *
 * Not a `TrekRepository<Entity>` — it backs no table and no entity of its
 * own (it reaches `users`/`app_settings`/`trips` and, for the bulk
 * example-trip seed, `days`/`places`/`day_assignments`/`packing_items`/
 * `budget_items`/`reservations`/`day_notes`/`trip_members`, none of which it
 * "owns" the way `Users.repository.ts` owns `users`). Where an existing
 * repository already has the exact shape (`UsersRepository#findByEmailExact`/
 * `#insertAdminCreatedUser`, `AppSettingsRepository#upsertOrReplace`) this
 * repository composes it via `this.em.getRepository(Entity)` rather than
 * duplicating the statement — `Users.repository.ts`/`AppSettings.repository.ts`
 * are Plan 3i Task 1's territory this task and never edits. The remaining
 * shapes (the shared `trip_members` "insert or ignore" membership row and
 * the seven bulk INSERT loops for the three example trips) are Kysely
 * statements on the generated table types: one query-builder insert per row,
 * with `RETURNING id` where the caller needs the new id, so the seed runs on
 * any engine the dialect layer supports and never spells SQL text.
 *
 * Constructed directly (`new DemoRepository(em)`), never through Nest DI:
 * its only two callers — `demo/demo-seed.ts` and `demo/demo-reset.ts` — are
 * plain function modules, not Nest providers (the first Nest-DI-*shaped*
 * home either has ever had, not a Nest-DI-*resolved* one), and obtain the
 * `EntityManager` via `RequestContext.getEntityManager()` (the same static
 * accessor MikroORM's own per-request middleware and
 * `CronRegistrarService`'s `wrappedTick` populate) rather than constructor
 * injection. No module registers this class as a provider.
 */
export class DemoRepository {
  constructor(private readonly em: EntityManager) {}

  /** See `MaintenanceRepository`'s twin — throws outside a request context. */
  private validateRequestContext(): void {
    this.em.getContext();
  }

  /**
   * `em.getKysely()`, validated first: the one place every seed insert below
   * starts from. The callers hand in the SQL driver's EntityManager under
   * core's type, which does not declare `getKysely`.
   */
  private kysely() {
    this.validateRequestContext();
    return (this.em as SqlEntityManager).getKysely<DemoSeedKyselyDB>();
  }

  // ---------------------------------------------------------------------
  // demo-seed.ts
  // ---------------------------------------------------------------------

  /**
   * DMS1 — `SELECT id FROM users WHERE email = ?`. Two call sites in
   * `seedDemoData` (the admin lookup, the demo-user lookup) share this one
   * method. Composes `UsersRepository#findByEmailExact` (case-sensitive, no
   * guest filter, full row) rather than a new statement — exact shape match.
   */
  async findUserByEmail(email: string): Promise<{ id: number } | null> {
    const row = await this.em.getRepository(Users).findByEmailExact(email);
    return row ? { id: row.id } : null;
  }

  /**
   * DMS2 — `INSERT INTO users (username, email, password_hash, role) VALUES
   * (?, ?, ?, ?)`. Two call sites in `seedDemoData` (admin creation, demo-user
   * creation) share this one method. Composes
   * `UsersRepository#insertAdminCreatedUser` — byte-identical legacy text
   * (AD4's own statement), which already leaves every other column
   * (`first_seen_version`, `login_count`, …) to the entity's default, the
   * same as the legacy INSERT's omitted columns fell back to the schema's
   * `DEFAULT`.
   */
  async createUser(row: NewAdminUserRow): Promise<number> {
    return await this.em.getRepository(Users).insertAdminCreatedUser(row);
  }

  /** DMS3 — `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')`. Composes `AppSettingsRepository#upsertOrReplace`, the same dialect the legacy statement used. */
  async setAllowRegistrationFalse(): Promise<void> {
    await this.em.getRepository(AppSettings).upsertOrReplace('allow_registration', 'false');
  }

  /** DMS4 — `SELECT COUNT(*) as count FROM trips WHERE user_id = ?` (the "already seeded" idempotency check). */
  async countTripsByUser(userId: number): Promise<number> {
    this.validateRequestContext();
    return await this.em.getRepository(Trips).count({ user_id: userId });
  }

  /** DMS5 — `SELECT id FROM trips WHERE user_id = ?` (`ensureDemoMembership`'s trip list). */
  async listTripIdsByUser(userId: number): Promise<number[]> {
    this.validateRequestContext();
    const rows = await this.em.getRepository(Trips).find({ user_id: userId }, { fields: ['id'] });
    return rows.map((r) => r.id);
  }

  /**
   * DMS6 — `INSERT OR IGNORE INTO trip_members (trip_id, user_id,
   * invited_by) VALUES (?, ?, ?)`. Shared between `ensureDemoMembership`
   * (looped over an admin's existing trips) and `seedExampleTrips` (one call
   * per newly seeded trip) — one repository method, called from both, per
   * the legacy code's own dup-text shape.
   */
  async addTripMember(tripId: number, userId: number, invitedBy: number): Promise<void> {
    await this.kysely()
      .insertInto('trip_members')
      .values({ trip_id: tripId, user_id: userId, invited_by: invitedBy })
      .onConflict((oc) => oc.columns(['trip_id', 'user_id']).doNothing())
      .execute();
  }

  /** DMS7 — `INSERT INTO trips (user_id, title, description, start_date, end_date, currency) VALUES (?, ?, ?, ?, ?, ?)`. Returns the generated trip id. */
  async insertTrip(
    userId: number,
    title: string,
    description: string,
    startDate: string,
    endDate: string,
    currency: string,
  ): Promise<number> {
    const inserted = await this.kysely()
      .insertInto('trips')
      .values({ user_id: userId, title, description, start_date: startDate, end_date: endDate, currency })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** DMS8 — `INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)`. Returns the generated day id. */
  async insertDay(tripId: number, dayNumber: number, date: string): Promise<number> {
    const inserted = await this.kysely()
      .insertInto('days')
      .values({ trip_id: tripId, day_number: dayNumber, date })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** DMS9 — the 13-column `places` insert (see {@link NewDemoPlaceRow}). Returns the generated place id. */
  async insertPlace(row: NewDemoPlaceRow): Promise<number> {
    const [
      trip_id,
      name,
      lat,
      lng,
      address,
      category_id,
      place_time,
      duration_minutes,
      notes,
      image_url,
      google_place_id,
      website,
      phone,
    ] = row;
    const inserted = await this.kysely()
      .insertInto('places')
      .values({
        trip_id,
        name,
        lat,
        lng,
        address,
        category_id,
        place_time,
        duration_minutes,
        notes,
        image_url,
        google_place_id,
        website,
        phone,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** DMS10 — `INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (?, ?, ?)`. */
  async insertDayAssignment(dayId: number, placeId: number, orderIndex: number): Promise<void> {
    await this.kysely()
      .insertInto('day_assignments')
      .values({ day_id: dayId, place_id: placeId, order_index: orderIndex })
      .execute();
  }

  /** DMS11 — `INSERT INTO packing_items (trip_id, name, checked, category, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`. */
  async insertPackingItem(
    tripId: number,
    name: string,
    checked: number,
    category: string,
    sortOrder: number,
  ): Promise<void> {
    const platform = this.em.getPlatform();
    await this.kysely()
      .insertInto('packing_items')
      .values({
        trip_id: tripId,
        name,
        checked,
        category,
        sort_order: sortOrder,
        updated_at: currentTimestampKysely(platform),
      })
      .execute();
  }

  /** DMS12 — `INSERT INTO budget_items (trip_id, category, name, total_price, persons, note) VALUES (?, ?, ?, ?, ?, ?)`. */
  async insertBudgetItem(
    tripId: number,
    category: string,
    name: string,
    totalPrice: number,
    persons: number,
    note: string | null,
  ): Promise<void> {
    await this.kysely()
      .insertInto('budget_items')
      .values({ trip_id: tripId, category, name, total_price: totalPrice, persons, note })
      .execute();
  }

  /**
   * DMS13 — `INSERT INTO reservations (trip_id, day_id, title,
   * reservation_time, confirmation_number, status, type, location) VALUES
   * (?, ?, ?, ?, ?, ?, ?, ?)`. `reservationTime` carries the full date
   * (`'2026-04-15T15:00'`), never a bare clock time — pinned parity, #1934.
   */
  async insertReservation(
    tripId: number,
    dayId: number,
    title: string,
    reservationTime: string,
    confirmationNumber: string,
    status: string,
    type: string,
    location: string,
  ): Promise<void> {
    await this.kysely()
      .insertInto('reservations')
      .values({
        trip_id: tripId,
        day_id: dayId,
        title,
        reservation_time: reservationTime,
        confirmation_number: confirmationNumber,
        status,
        type,
        location,
      })
      .execute();
  }

  /** DMS14 — `INSERT INTO day_notes (day_id, trip_id, text, time, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`. */
  async insertDayNote(
    dayId: number,
    tripId: number,
    text: string,
    time: string,
    icon: string,
    sortOrder: number,
  ): Promise<void> {
    await this.kysely()
      .insertInto('day_notes')
      .values({ day_id: dayId, trip_id: tripId, text, time, icon, sort_order: sortOrder })
      .execute();
  }

  // ---------------------------------------------------------------------
  // demo-reset.ts
  // ---------------------------------------------------------------------

  /**
   * DMR1 — `SELECT password_hash, maps_api_key, openweather_api_key,
   * unsplash_api_key, avatar FROM users WHERE email = ?` (the pre-close
   * credential read). Generic inherited `findOne` with a narrower `fields`
   * projection — no new method on `Users.repository.ts` (Task 1's
   * territory), same reasoning as `findUserByEmail` above.
   */
  async getAdminCredentials(email: string): Promise<DemoAdminCredentialsRow | null> {
    const row = await this.em
      .getRepository(Users)
      .findOne(
        { email },
        { fields: ['password_hash', 'maps_api_key', 'openweather_api_key', 'unsplash_api_key', 'avatar'] },
      );
    return row
      ? {
          password_hash: row.password_hash,
          maps_api_key: row.maps_api_key ?? null,
          openweather_api_key: row.openweather_api_key ?? null,
          unsplash_api_key: row.unsplash_api_key ?? null,
          avatar: row.avatar ?? null,
        }
      : null;
  }

  /**
   * DMR2 — `SELECT key, value FROM app_settings WHERE key IN
   * ('maps_api_key', 'unsplash_api_key')` (the pre-close instance-API-key
   * read). Generic inherited `find` — deliberately NOT
   * `AppSettingsRepository#getValues`, which drops a NULL-valued row; this
   * caller's own DMR6 counterpart re-writes exactly what it read.
   */
  async getInstanceApiKeys(): Promise<DemoInstanceKeyRow[]> {
    const rows = await this.em.getRepository(AppSettings).find({ key: { $in: ['maps_api_key', 'unsplash_api_key'] } });
    return rows.map((r) => ({ key: r.key ?? '', value: r.value ?? null }));
  }

  /**
   * DMR5 — `UPDATE users SET password_hash = ?, maps_api_key = ?,
   * openweather_api_key = ?, unsplash_api_key = ?, avatar = ? WHERE email =
   * ?` (the post-reopen credential restore). Generic inherited
   * `nativeUpdate`, writing exactly these five columns — no `updated_at`
   * bump, matching the legacy statement (unlike `UsersRepository`'s own
   * `updateApiKeys`/`updateMapsKey`, which do touch it for a different
   * caller).
   */
  async restoreAdminCredentials(email: string, patch: DemoAdminCredentialsRow): Promise<void> {
    this.validateRequestContext();
    await this.em.getRepository(Users).nativeUpdate({ email }, { ...patch });
  }

  /**
   * DMR6 — `INSERT INTO app_settings (key, value) VALUES (?, ?) ON
   * CONFLICT(key) DO UPDATE SET value = excluded.value`, looped over the
   * rows DMR2 read (the post-reopen instance-API-key restore). Generic
   * inherited `upsert` (the SAME statement `AppSettingsRepository#setValue`
   * issues) rather than that method directly — `value` may be SQL NULL here
   * (preserved by DMR2 above), and `setValue`'s own signature types `value`
   * as a non-nullable `string` for its own callers.
   */
  async restoreInstanceApiKeys(rows: readonly DemoInstanceKeyRow[]): Promise<void> {
    this.validateRequestContext();
    const repo = this.em.getRepository(AppSettings);
    for (const row of rows) {
      await repo.upsert({ key: row.key, value: row.value }, { onConflictFields: ['key'], onConflictAction: 'merge' });
    }
  }
}
