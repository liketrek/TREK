import { ALL_ENTITIES } from '../../../src/db/entities';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { IdempotencyKeys } from '../../../src/db/entities/IdempotencyKeys.entity';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser, createTrip } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { EntityRepositoryType, ReferenceKind } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Permanent guard for `task-4-review-shape.md` Important finding 1: a
 * numeric class-field initialiser must never render `NaN` (see
 * `scripts/generate-entities.ts`'s `RULE1d_fixNaNNumericDefaults` and
 * `tests/unit/db/generate-entities.test.ts`'s `RULE1D-*` fixture tests for
 * the mechanism). This file pins the OUTPUT of that rule against the real,
 * committed entities (every one of the 133, not a sample) and reproduces
 * the reviewer's own insert probe so a future regenerate/hand-edit that
 * reintroduces a `NaN` initialiser fails loudly here, not silently at a
 * caller's first `em.create()`.
 */
/** NOT NULL scalars with neither a column default nor a class-field initialiser (legitimate: the caller must supply them). */
// 424 + push_subscriptions (legacy step 245): id, user_id, endpoint, p256dh, auth, vapid_public_key.
// + Tours: tour_types label_key, icon, color; tours.tour_type; tour_waypoints id, place_id, lat, lng, role, sequence.
// + scheduler_leases: name, owner, expires_at (the scheduler always writes all three).
// + user_sessions: id, user_id, expires_at.
// + ferrata_tiles: tile_key, payload, fetched_at (a fetched tile always carries all three).
// + paddle_regions: id, name; paddle_features: id, region_id, osm_ref, kind, geometry, tags, tag_hash and
//   its bounding box (a feature is only ever written whole, from one read of its region).
// + tour_obstacle_reviews: place_id, obstacle_key, decision, both fingerprints, obstacle_snapshot, decided_at.
// + trip_journal_links: id, trip_id, journey_id, created_at; trip_journal_link_members: link_id, user_id,
//   added_at (a link and its members are always written whole).
// + paddle_water_graphs: file, rev, bytes, built_at, stats and its bounding box (a network is only ever written
//   whole, from one build of its region).
// + paddle_region_requests: region_id, name, reason (a request is only ever filed whole).
// + tour_station_visits: assignment_id, station_key, status (a visit is only ever written whole, by the
//   day plan that checks a city walk's station off).
// + tour_change_steps: id, place_id, proposal_id, base_revision, revision, changes, before_state (a step is
//   only ever written whole, by the save of a confirmed change).
// + tour_activities: id, place_id, track_place_id (an assignment always names its tour and its recording).
// + tour_activity_exclusions: id, user_id, place_id (an exclusion always names its user and its tour).
// + collection_tours: id, collection_id, name, waypoints, tour_type, origin, source_trip_title, source_tour_name
//   (a kept tour is only ever written whole, from the tour it was saved from).
// + tour_source_hints: user_id (a hint is only ever written for the user whose snapshot it is about).
// + journey_recorded_days: id, journey_id, local_date, source_kind, utc_offset_minutes, window_from,
//   window_to, segments, point_count, content_hash, fetched_at (a kept day is only ever written whole).
// + journey_entry_stays: id, journey_id, entry_id, source_visit_id, name, started_at, ended_at (a stay is
//   only ever written whole, by the take-over of its day).
// + journey_recording_prep: id, journey_id, user_id (a status row always names its journey and its person).
// + tour_drafts: id, trip_id, user_id, payload (a draft is only ever written whole, by the planner that keeps it).
// + ai_connections: id, scope, kind, model; assistant_threads: id, user_id, trip_id, title;
//   assistant_messages: id, thread_id, role, parts; assistant_tool_calls: id, thread_id, message_id,
//   provider_call_id, tool_name, args, preview; assistant_usage: user_id, day, paid_by (each row is
//   written whole by the assistant, which always knows all of them).
// + trek_photo_signals: id, photo_id, algo (a measurement always names its photo and how it was made).
// - assistant_threads.trip_id: a thread may be about a journey instead, so it is nullable now.
// + journey_book_revisions: id, journey_id, version, document (a revision is only ever written whole).
// + trip_member_removals: id, trip_id, user_id (a removal note always names its trip and its person).
const KNOWN_UNINITIALISED_NOT_NULL_SCALARS = 575;

describe('entity class fields never carry a NaN initialiser (task-4-review-shape.md, Important 1)', () => {
  it('CLASSFIELD-001: new X() has no own property whose value is NaN, across all 133 entities', () => {
    const failures: string[] = [];
    for (const schema of ALL_ENTITIES) {
      const Ctor = schema.class as new () => Record<string, unknown>;
      const instance = new Ctor();
      for (const [key, value] of Object.entries(instance)) {
        if (typeof value === 'number' && Number.isNaN(value)) {
          failures.push(`${schema.meta.className}.${key}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  /**
   * Report-only (per the brief): a NOT NULL scalar property with no
   * `default`/`defaultRaw` at all legitimately has no class-field
   * initialiser — the caller is expected to supply it (`name!: string`, for
   * example). That is normal and not a bug, so this never asserts the list
   * is empty; it exists so a reviewer can see the shape at a glance and so a
   * suspicious spike in the count (e.g. every numeric property in an entity
   * suddenly losing its default) shows up in test output without failing
   * the suite on a false positive.
   */
  it('CLASSFIELD-002: exactly the known NOT NULL, no-default scalar properties have no class-field initialiser', async () => {
    const testDb = createSnapshotTestDb();
    try {
      const t = await createTestOrm(testDb);
      try {
        const report: string[] = [];
        for (const schema of ALL_ENTITIES) {
          const meta = t.orm.getMetadata().get(schema.class);
          const Ctor = schema.class as new () => Record<string, unknown>;
          const instance = new Ctor();
          for (const prop of meta.props) {
            if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
            if (prop.nullable) continue;
            if (prop.default !== undefined || prop.defaultRaw !== undefined) continue;
            if (!(prop.name in instance)) continue;
            if (instance[prop.name] === undefined) {
              report.push(`${meta.className}.${prop.name}`);
            }
          }
        }
        // Informational only — see the doc comment above. `console.info` (not
        // a `console.log` vitest might buffer away) so it survives a run.
        // A ratchet, not a census: the failure mode this file guards (a regeneration
        // handing every numeric property a bogus default) makes this number DROP;
        // a new NOT NULL column without a default bumps it by one — update the
        // constant with the migration that adds the column.
        expect(report.length, report.join(', ')).toBe(KNOWN_UNINITIALISED_NOT_NULL_SCALARS);
      } finally {
        await t.close();
      }
    } finally {
      testDb.close();
    }
  });
});

/**
 * Plan 3b pre-task (`scripts/generate-entities.ts`'s `RULE10_repositoryTypeMarker`
 * / `injectRepositoryTypeMarker`): `[EntityRepositoryType]?: XRepository;` is
 * a type-only class member, never routed through `meta.addProperty` — this
 * pins that it stays that way, so CLASSFIELD-002's census above (and its
 * pinned count, 423) can never silently start counting it.
 */
describe('[EntityRepositoryType] marker is excluded from the class-field census (RULE10)', () => {
  it('CLASSFIELD-003: every entity has an own [EntityRepositoryType] symbol property that is never a real metadata property and never leaks as a string key', async () => {
    const testDb = createSnapshotTestDb();
    try {
      const t = await createTestOrm(testDb);
      try {
        const failures: string[] = [];
        for (const schema of ALL_ENTITIES) {
          const meta = t.orm.getMetadata().get(schema.class);
          const Ctor = schema.class as new () => Record<string, unknown>;
          const instance = new Ctor();
          if (!Object.getOwnPropertySymbols(instance).includes(EntityRepositoryType)) {
            failures.push(`${meta.className}: missing an own [EntityRepositoryType] symbol property`);
          }
          if (Object.keys(instance).includes('EntityRepositoryType')) {
            failures.push(`${meta.className}: [EntityRepositoryType] leaked as a string-keyed own property`);
          }
          if (meta.props.some((prop) => prop.name === 'EntityRepositoryType')) {
            failures.push(`${meta.className}: [EntityRepositoryType] was registered as a real metadata property`);
          }
        }
        expect(failures).toEqual([]);
      } finally {
        await t.close();
      }
    } finally {
      testDb.close();
    }
  });
});

/**
 * The reviewer's exact repro (`task-4-review-shape.md`, Important finding
 * 1): before the fix, `em.create(BudgetItems, …)` and
 * `em.create(IdempotencyKeys, …)` both threw `SqliteError: no such column:
 * NaN` at `flush()` — Kysely rendered the `NaN` class-field initialiser as a
 * bare SQL identifier. Neither probe names the broken columns
 * (`persons`/`days`/`place_id`/`reservation_id` on `BudgetItems`,
 * `created_at` on `IdempotencyKeys`) — the whole point is that a caller
 * should never have to.
 */
describe("insert probes (task-4-review-shape.md, the reviewer's exact repro)", () => {
  const testDb = createSnapshotTestDb();
  let t: TestOrm;

  beforeAll(async () => {
    t = await createTestOrm(testDb);
  });
  beforeEach(() => {
    resetTestDb(testDb);
    t.clear();
  });
  afterAll(async () => {
    await t.close();
    testDb.close();
  });

  it('INSERT-PROBE-001: em.create(BudgetItems, { trip, name, total_price, exchange_rate }) + flush succeeds', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const created = t.em.create(BudgetItems, {
      trip: trip.id,
      name: 'Dinner',
      total_price: 4200,
      exchange_rate: 1,
    });
    await t.em.persist(created).flush();

    // test-sql-allow: reads the stored columns behind the ORM to prove what its own insert wrote.
    const row = testDb
      .prepare('SELECT persons, days, place_id, reservation_id FROM budget_items WHERE id = ?')
      .get(created.id);
    expect(row).toEqual({ persons: null, days: null, place_id: null, reservation_id: null });
  });

  it('INSERT-PROBE-002: em.create(IdempotencyKeys, { key, user, method, path, status_code, response_body }) + flush succeeds', async () => {
    const { user } = createUser(testDb);

    const created = t.em.create(IdempotencyKeys, {
      key: 'idem-key-probe-1',
      user: user.id,
      method: 'POST',
      path: '/api/trips',
      status_code: 201,
      response_body: '{}',
    });
    await t.em.persist(created).flush();

    const row = testDb
      // test-sql-allow: reads the stored column behind the ORM to prove the database default filled it.
      .prepare('SELECT created_at FROM idempotency_keys WHERE key = ? AND user_id = ? AND method = ? AND path = ?')
      .get('idem-key-probe-1', user.id, 'POST', '/api/trips') as { created_at: number };
    // The DB's own defaultRaw (strftime('%s','now')) filled it in — never NaN, never null.
    expect(row.created_at).toEqual(expect.any(Number));
    expect(Number.isNaN(row.created_at)).toBe(false);
  });
});
