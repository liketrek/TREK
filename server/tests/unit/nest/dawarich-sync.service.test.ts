/**
 * DawarichSyncService against a real in-memory database.
 *
 * The service is almost entirely reconciliation SQL — insert-or-update keyed on
 * (user, source visit id), a hash comparison that must not touch an accepted
 * row, and a "what did the source stop listing" pass over a window. A mocked
 * DatabaseService would assert that the right strings were handed along and
 * prove nothing about what they do, so the schema comes from the real migration
 * array and the rows are read back with plain SQL.
 *
 * The two collaborators are faked rather than built: the client because a unit
 * test must not open a socket, and DawarichService because its credential path
 * drags in at-rest crypto and its capability probe makes five more upstream
 * calls that have nothing to do with reconciliation. The fake still writes
 * `recordSyncResult` into `dawarich_connections`, so "the failure is stored" is
 * asserted against the table the settings card reads, not against a spy alone.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite — same vi.hoisted pattern as atlas/immich) ──

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => null,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { DawarichSyncService } from '../../../src/nest/integrations/dawarich-sync.service';
import { DawarichError } from '../../../src/nest/integrations/dawarich.client';
import type { DawarichClient, DawarichCreds, DawarichVisitRaw } from '../../../src/nest/integrations/dawarich.client';
import type { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import type { DawarichCapabilities, DawarichSyncState } from '@trek/shared';

// ── Fakes ────────────────────────────────────────────────────────────────────

const CAPABILITIES: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: false,
  visitedCities: true,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.4',
  probedAt: '2026-09-12T00:00:00.000Z',
};

const listVisits = vi.fn();
const client = { listVisits } as unknown as DawarichClient;

/** Reads the same two columns the real service reads, so a row without a key is null. */
const getCredentials = vi.fn((userId: number): DawarichCreds | null => {
  const row = testDb
    .prepare('SELECT url, api_key, allow_insecure_tls FROM dawarich_connections WHERE user_id = ?')
    .get(userId) as { url: string | null; api_key: string | null; allow_insecure_tls: number } | undefined;
  if (!row?.url || !row?.api_key) return null;
  return { baseUrl: row.url, apiKey: row.api_key, allowInsecureTls: !!row.allow_insecure_tls };
});

/** Writes the result where the settings card reads it, exactly as the real service does. */
const recordSyncResult = vi.fn((userId: number, state: DawarichSyncState, error: string | null): void => {
  testDb
    .prepare(
      'UPDATE dawarich_connections SET last_sync_at = ?, last_sync_state = ?, last_sync_error = ? WHERE user_id = ?',
    )
    .run(new Date().toISOString(), state, error, userId);
});

const listSyncableUserIds = vi.fn((): number[] =>
  (
    testDb
      .prepare(
        "SELECT user_id FROM dawarich_connections WHERE sync_enabled = 1 AND url IS NOT NULL AND url <> '' AND api_key IS NOT NULL",
      )
      .all() as { user_id: number }[]
  ).map((r) => r.user_id),
);

const storeCapabilities = vi.fn();
const probeCapabilities = vi.fn(async (): Promise<DawarichCapabilities> => CAPABILITIES);

const dawarich = {
  listSyncableUserIds,
  getCredentials,
  recordSyncResult,
  storeCapabilities,
  probeCapabilities,
} as unknown as DawarichService;

// Direct construction over the shared test connection — no TestingModule
// (repo convention for DI-native service unit tests).
const dbs = new DatabaseService(testDb);
const addons = new AddonsService(dbs);
const svc = new DawarichSyncService(dbs, addons, client, dawarich);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

/** A calendar date relative to today, so a fixture never ages out of the 400-day trip cut-off. */
function dayOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The trip every case uses: finished, recent, comfortably inside the sync window. */
const TRIP_START = dayOffset(-30);
const TRIP_END = dayOffset(-25);
/** A day inside that trip — every visit fixture happens here unless it says otherwise. */
const VISIT_DAY = dayOffset(-28);

/** Brandenburger Tor. Berlin throughout, so the resolved country is unambiguous. */
const LAT = 52.5163;
const LNG = 13.3777;

let USER = 0;
let TRIP = 0;

function visit(over: Partial<DawarichVisitRaw> & { id: number | string }): DawarichVisitRaw {
  return {
    id: over.id,
    area_id: null,
    started_at: over.started_at ?? `${VISIT_DAY}T09:00:00Z`,
    ended_at: over.ended_at ?? `${VISIT_DAY}T12:00:00Z`,
    duration: over.duration ?? null,
    name: over.name ?? 'Hotel Adlon',
    status: over.status ?? 'suggested',
    confidence: over.confidence ?? null,
    confidence_band: over.confidence_band ?? null,
    place: over.place !== undefined ? over.place : { latitude: LAT, longitude: LNG, id: 77 },
  };
}

interface SuggestionRow {
  id: number;
  user_id: number;
  source_visit_id: string;
  trip_id: number | null;
  name: string;
  lat: number | null;
  lng: number | null;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  local_date: string;
  source_status: string;
  confidence: number | null;
  confidence_band: string | null;
  country_code: string | null;
  state: string;
  source_hash: string;
  accepted_hash: string | null;
  source_missing_at: string | null;
  matched_bucket_list_item_id: number | null;
  first_seen_at: string;
  last_seen_at: string;
}

function rows(userId = USER): SuggestionRow[] {
  return testDb
    .prepare('SELECT * FROM dawarich_visit_suggestions WHERE user_id = ? ORDER BY id')
    .all(userId) as SuggestionRow[];
}

function only(userId = USER): SuggestionRow {
  const all = rows(userId);
  expect(all).toHaveLength(1);
  return all[0];
}

function connection(userId = USER): { last_sync_state: string; last_sync_error: string | null } {
  return testDb
    .prepare('SELECT last_sync_state, last_sync_error FROM dawarich_connections WHERE user_id = ?')
    .get(userId) as { last_sync_state: string; last_sync_error: string | null };
}

function connect(
  userId: number,
  opts: { url?: string | null; apiKey?: string | null; syncEnabled?: boolean } = {},
): void {
  testDb
    .prepare(
      'INSERT OR REPLACE INTO dawarich_connections (user_id, url, api_key, allow_insecure_tls, sync_enabled) VALUES (?, ?, ?, 0, ?)',
    )
    .run(
      userId,
      opts.url === undefined ? 'https://dawarich.test' : opts.url,
      opts.apiKey === undefined ? 'secret-key' : opts.apiKey,
      opts.syncEnabled === false ? 0 : 1,
    );
}

function bucketItem(name: string, lat: number, lng: number, userId = USER): number {
  const res = testDb
    .prepare('INSERT INTO bucket_list (user_id, name, lat, lng) VALUES (?, ?, ?, ?)')
    .run(userId, name, lat, lng);
  return Number(res.lastInsertRowid);
}

/** Every window of the next run answers with exactly these visits. */
function withVisits(...visits: DawarichVisitRaw[]): void {
  listVisits.mockResolvedValue({ visits, truncated: false, version: '1.14.4' });
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // RESET_TABLES in tests/helpers/test-db.ts predates this domain and does not
  // list its two tables; foreign keys are off during the reset, so rows would
  // otherwise outlive their user and leak into the next case.
  testDb.exec('DELETE FROM dawarich_visit_suggestions');
  testDb.exec('DELETE FROM dawarich_connections');
  vi.clearAllMocks();
  probeCapabilities.mockResolvedValue(CAPABILITIES);

  setAddonEnabled(testDb, 'dawarich', true);
  USER = createUser(testDb).user.id;
  TRIP = createTrip(testDb, USER, { start_date: TRIP_START, end_date: TRIP_END }).id;
  connect(USER);
});

afterAll(() => {
  testDb.close();
});

// ── Creating suggestions ─────────────────────────────────────────────────────

describe('DawarichSyncService — new visits', () => {
  it('DAWARICH-SYNC-001: stores an unseen visit as a suggestion in state "new"', async () => {
    withVisits(visit({ id: 501, name: 'Hotel Adlon', confidence: 0.82, confidence_band: 'high' }));

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'ok', created: 1, updated: 0, missing: 0 });
    const row = only();
    expect(row.source_visit_id).toBe('501');
    expect(row.state).toBe('new');
    expect(row.trip_id).toBe(TRIP);
    expect(row.name).toBe('Hotel Adlon');
    expect(row.lat).toBeCloseTo(LAT, 4);
    expect(row.lng).toBeCloseTo(LNG, 4);
    expect(row.duration_minutes).toBe(180);
    expect(row.local_date).toBe(VISIT_DAY);
    expect(row.source_status).toBe('suggested');
    expect(row.confidence).toBe(0.82);
    expect(row.confidence_band).toBe('high');
    expect(row.source_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.source_missing_at).toBeNull();
    expect(row.accepted_hash).toBeNull();
  });

  it('DAWARICH-SYNC-002: resolves the country from the coordinates when the source sends none', async () => {
    withVisits(visit({ id: 502 }));

    await svc.syncUser(USER);

    expect(only().country_code).toBe('DE');
  });

  it('DAWARICH-SYNC-003: prefers the country code the source sends over the resolved one', async () => {
    withVisits(visit({ id: 503, place: { latitude: LAT, longitude: LNG, id: 77, country_code: 'at' } }));

    await svc.syncUser(USER);

    expect(only().country_code).toBe('AT');
  });

  it('DAWARICH-SYNC-004: skips a payload entry that is not a usable visit', async () => {
    withVisits(visit({ id: 504 }), {
      id: 505,
      area_id: null,
      started_at: 'not-a-date',
      ended_at: 'nope',
      duration: null,
      name: 'Broken',
      status: null,
      confidence: null,
      confidence_band: null,
      place: null,
    });

    const result = await svc.syncUser(USER);

    expect(result.created).toBe(1);
    expect(rows()).toHaveLength(1);
  });
});

// ── Which trip a stay lands on ───────────────────────────────────────────────

describe('DawarichSyncService, neighbouring trips', () => {
  /** A trip that starts the day after TRIP ends, so its lookback reaches into TRIP's last days. */
  function nextTrip(): number {
    return createTrip(testDb, USER, { start_date: dayOffset(-24), end_date: dayOffset(-20) }).id;
  }

  /** A stay on TRIP's last day: inside TRIP's own dates and inside the next trip's lookback. */
  function lastDayVisit(id: number): DawarichVisitRaw {
    return visit({ id, started_at: `${TRIP_END}T09:00:00Z`, ended_at: `${TRIP_END}T12:00:00Z` });
  }

  it('DAWARICH-SYNC-074: a stay on the last day of a trip lands on that trip, not on the neighbour whose lookback reached it', async () => {
    // Trips are walked newest first, so the neighbour asks first and both
    // windows return the same stay. The trip whose dates hold it has to win,
    // or the last days of every city hop show up under the next city.
    const next = nextTrip();
    withVisits(lastDayVisit(910));

    const result = await svc.syncUser(USER);

    expect(listVisits).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ state: 'ok', created: 1, missing: 0 });
    const row = only();
    expect(row.trip_id).toBe(TRIP);
    expect(row.trip_id).not.toBe(next);
  });

  it('DAWARICH-SYNC-075: a stay already parked on the wrong neighbour moves to the trip whose dates hold it', async () => {
    // What an earlier run left behind. Nobody acted on the row, so re-homing
    // it loses nothing, and the panel of the trip it belongs to fills in.
    const next = nextTrip();
    testDb
      .prepare(
        `INSERT INTO dawarich_visit_suggestions
           (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at, duration_minutes,
            local_date, source_status, state, source_hash)
         VALUES (?, '911', ?, 'Hotel Adlon', ?, ?, ?, ?, 180, ?, 'suggested', 'new', 'stale')`,
      )
      .run(USER, next, LAT, LNG, `${TRIP_END}T09:00:00Z`, `${TRIP_END}T12:00:00Z`, TRIP_END);
    withVisits(lastDayVisit(911));

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ created: 0, missing: 0 });
    expect(only().trip_id).toBe(TRIP);
  });

  it('DAWARICH-SYNC-076: a row the user already acted on keeps its trip', async () => {
    // An acceptance made a place on that trip. Moving the row out from under
    // it would leave the handled list pointing somewhere else than the place.
    const next = nextTrip();
    testDb
      .prepare(
        `INSERT INTO dawarich_visit_suggestions
           (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at, duration_minutes,
            local_date, source_status, state, source_hash)
         VALUES (?, '912', ?, 'Hotel Adlon', ?, ?, ?, ?, 180, ?, 'suggested', 'accepted', 'stale')`,
      )
      .run(USER, next, LAT, LNG, `${TRIP_END}T09:00:00Z`, `${TRIP_END}T12:00:00Z`, TRIP_END);
    withVisits(lastDayVisit(912));

    await svc.syncUser(USER);

    expect(only().trip_id).toBe(next);
  });

  it('DAWARICH-SYNC-077: a stay in the slack before departure, inside no trip at all, stays with the window that found it', async () => {
    // The evening before is why the lookback exists. With no other trip to
    // claim it, the stay belongs to the trip that asked, exactly as before.
    const eve = dayOffset(-31);
    withVisits(visit({ id: 913, started_at: `${eve}T20:00:00Z`, ended_at: `${eve}T22:00:00Z` }));

    await svc.syncUser(USER);

    const row = only();
    expect(row.local_date).toBe(eve);
    expect(row.trip_id).toBe(TRIP);
  });

  it('DAWARICH-SYNC-078: a trip whose start is not a date cannot claim a stay from the sidelines', async () => {
    // Such a trip is skipped by the window guard, and it must not turn into a
    // catch-all for every stay outside the trips that are actually walked.
    createTrip(testDb, USER, { start_date: '0000-00-00' });
    const eve = dayOffset(-31);
    withVisits(visit({ id: 914, started_at: `${eve}T20:00:00Z`, ended_at: `${eve}T22:00:00Z` }));

    await svc.syncUser(USER);

    expect(listVisits).toHaveBeenCalledTimes(1);
    expect(only().trip_id).toBe(TRIP);
  });
});

// ── Idempotency and change detection ─────────────────────────────────────────

describe('DawarichSyncService — repeated runs', () => {
  it('DAWARICH-SYNC-010: a second run over identical data creates no duplicate', async () => {
    withVisits(visit({ id: 601 }));
    await svc.syncUser(USER);
    const first = only();

    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    const row = only();
    expect(row.id).toBe(first.id);
    expect(row.first_seen_at).toBe(first.first_seen_at);
    expect(row.source_hash).toBe(first.source_hash);
  });

  it('DAWARICH-SYNC-011: a changed visit rewrites a suggestion still in state "new"', async () => {
    withVisits(visit({ id: 602, name: 'Unnamed place' }));
    await svc.syncUser(USER);
    const before = only();

    withVisits(visit({ id: 602, name: 'Café Einstein', place: { latitude: 52.52, longitude: 13.38, id: 78 } }));
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 1 });
    const row = only();
    expect(row.id).toBe(before.id);
    expect(row.name).toBe('Café Einstein');
    expect(row.lat).toBeCloseTo(52.52, 4);
    expect(row.source_hash).not.toBe(before.source_hash);
    expect(row.state).toBe('new');
  });

  it('DAWARICH-SYNC-012: a changed visit in state "accepted" keeps the user text and only moves the hash', async () => {
    withVisits(visit({ id: 603, name: 'Hotel Adlon' }));
    await svc.syncUser(USER);
    const before = only();

    // What acceptance leaves behind: the user's own wording plus the hash they said yes to.
    testDb
      .prepare(
        "UPDATE dawarich_visit_suggestions SET state = 'accepted', accepted_hash = source_hash, name = ? WHERE id = ?",
      )
      .run('Our anniversary dinner', before.id);

    withVisits(visit({ id: 603, name: 'Adlon Kempinski', place: { latitude: 52.4, longitude: 13.2, id: 79 } }));
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 1 });
    const row = only();
    expect(row.state).toBe('accepted');
    expect(row.name).toBe('Our anniversary dinner');
    expect(row.lat).toBeCloseTo(LAT, 4);
    // sourceChanged is exactly this inequality, and the hash is the only thing that moved.
    expect(row.source_hash).not.toBe(before.source_hash);
    expect(row.accepted_hash).toBe(before.source_hash);
    expect(row.source_hash).not.toBe(row.accepted_hash);
  });

  it('DAWARICH-SYNC-013: a changed visit in state "dismissed" is likewise left alone', async () => {
    withVisits(visit({ id: 604, name: 'Petrol station' }));
    await svc.syncUser(USER);
    const before = only();
    testDb.prepare("UPDATE dawarich_visit_suggestions SET state = 'dismissed' WHERE id = ?").run(before.id);

    withVisits(visit({ id: 604, name: 'Aral Tankstelle' }));
    const second = await svc.syncUser(USER);

    expect(second.updated).toBe(1);
    const row = only();
    expect(row.state).toBe('dismissed');
    expect(row.name).toBe('Petrol station');
    expect(row.source_hash).not.toBe(before.source_hash);
  });

  it('DAWARICH-SYNC-014: an unchanged accepted row is not counted as an update', async () => {
    withVisits(visit({ id: 605 }));
    await svc.syncUser(USER);
    testDb.prepare("UPDATE dawarich_visit_suggestions SET state = 'accepted', accepted_hash = source_hash").run();

    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 0, missing: 0 });
  });
});

// ── Disappearance ────────────────────────────────────────────────────────────

describe('DawarichSyncService — visits that vanish from the source', () => {
  it('DAWARICH-SYNC-020: an untouched suggestion is deleted when the source stops listing it', async () => {
    withVisits(visit({ id: 701 }));
    await svc.syncUser(USER);
    expect(rows()).toHaveLength(1);

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 0, missing: 1 });
    expect(rows()).toHaveLength(0);
  });

  it('DAWARICH-SYNC-021: an accepted suggestion survives and is only stamped source_missing_at', async () => {
    withVisits(
      visit({ id: 702 }),
      visit({
        id: 703,
        started_at: `${VISIT_DAY}T14:00:00Z`,
        ended_at: `${VISIT_DAY}T16:00:00Z`,
        name: 'Museumsinsel',
      }),
    );
    await svc.syncUser(USER);
    testDb.prepare("UPDATE dawarich_visit_suggestions SET state = 'accepted' WHERE source_visit_id = '703'").run();

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second.missing).toBe(2);
    const surviving = only();
    expect(surviving.source_visit_id).toBe('703');
    expect(surviving.state).toBe('accepted');
    expect(surviving.name).toBe('Museumsinsel');
    expect(surviving.source_missing_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('DAWARICH-SYNC-022: a second empty run does not move an existing source_missing_at', async () => {
    withVisits(visit({ id: 704 }));
    await svc.syncUser(USER);
    testDb.prepare("UPDATE dawarich_visit_suggestions SET state = 'accepted' WHERE source_visit_id = '704'").run();

    withVisits();
    await svc.syncUser(USER);
    const firstStamp = only().source_missing_at;
    expect(firstStamp).not.toBeNull();

    await svc.syncUser(USER);

    expect(only().source_missing_at).toBe(firstStamp);
  });

  it('DAWARICH-SYNC-023: a visit that comes back clears the missing flag', async () => {
    withVisits(visit({ id: 705 }));
    await svc.syncUser(USER);
    testDb.prepare("UPDATE dawarich_visit_suggestions SET state = 'accepted' WHERE source_visit_id = '705'").run();

    withVisits();
    await svc.syncUser(USER);
    expect(only().source_missing_at).not.toBeNull();

    withVisits(visit({ id: 705 }));
    await svc.syncUser(USER);

    expect(only().source_missing_at).toBeNull();
  });

  it('DAWARICH-SYNC-024: a suggestion outside the fetched window is untouched by the reconciliation', async () => {
    withVisits(visit({ id: 706 }));
    await svc.syncUser(USER);

    // Same user and trip, but a start date years before the window this trip asks about.
    testDb
      .prepare(
        `INSERT INTO dawarich_visit_suggestions
           (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at, duration_minutes,
            local_date, source_status, state, source_hash)
         VALUES (?, '999', ?, 'Ancient stay', ?, ?, '2019-01-01T10:00:00Z', '2019-01-01T12:00:00Z', 120,
                 '2019-01-01', 'suggested', 'new', 'deadbeef')`,
      )
      .run(USER, TRIP, LAT, LNG);

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second.missing).toBe(1);
    expect(only().source_visit_id).toBe('999');
  });
});

// ── Bucket-list matching ─────────────────────────────────────────────────────

describe('DawarichSyncService — bucket-list matching', () => {
  it('DAWARICH-SYNC-030: links a wish that is both close enough and dwelt on long enough', async () => {
    const wish = bucketItem('Brandenburger Tor', LAT + 0.001, LNG); // ~111 m
    withVisits(visit({ id: 801, started_at: `${VISIT_DAY}T09:00:00Z`, ended_at: `${VISIT_DAY}T10:00:00Z` }));

    await svc.syncUser(USER);

    expect(only().matched_bucket_list_item_id).toBe(wish);
  });

  it('DAWARICH-SYNC-031: refuses a wish that is close but whose stay is too short', async () => {
    bucketItem('Brandenburger Tor', LAT + 0.001, LNG);
    // Ten minutes, under DAWARICH_BUCKET_MATCH_MIN_MINUTES.
    withVisits(visit({ id: 802, started_at: `${VISIT_DAY}T09:00:00Z`, ended_at: `${VISIT_DAY}T09:10:00Z` }));

    await svc.syncUser(USER);

    const row = only();
    expect(row.duration_minutes).toBe(10);
    expect(row.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-032: refuses a long stay that is inside the coarse box but beyond the radius', async () => {
    bucketItem('Reichstag', LAT + 0.008, LNG); // ~890 m: inside the prefilter box, outside 250 m
    withVisits(visit({ id: 803 }));

    await svc.syncUser(USER);

    expect(only().matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-033: picks the nearest wish when several are in range', async () => {
    const far = bucketItem('Pariser Platz', LAT + 0.002, LNG); // ~222 m
    const near = bucketItem('Brandenburger Tor', LAT + 0.0005, LNG); // ~56 m

    withVisits(visit({ id: 804 }));
    await svc.syncUser(USER);

    const matched = only().matched_bucket_list_item_id;
    expect(matched).toBe(near);
    expect(matched).not.toBe(far);
  });

  it('DAWARICH-SYNC-073: the first wish in range keeps it when the next one is farther away', async () => {
    // The mirror image of 033. Wishes come back in the order they were stored,
    // so storing the near one first is what makes the farther candidate arrive
    // with a winner already held. The loop then has to keep what it has instead
    // of taking whatever it looked at last; both wishes are inside the radius,
    // so nothing else in the loop can decide it.
    const near = bucketItem('Brandenburger Tor', LAT + 0.0005, LNG); // ~56 m
    const far = bucketItem('Pariser Platz', LAT + 0.002, LNG); // ~222 m, still inside 250 m

    withVisits(visit({ id: 808 }));
    await svc.syncUser(USER);

    const matched = only().matched_bucket_list_item_id;
    expect(matched).toBe(near);
    expect(matched).not.toBe(far);
  });

  it('DAWARICH-SYNC-034: ignores a wish belonging to another user', async () => {
    const other = createUser(testDb).user.id;
    bucketItem('Brandenburger Tor', LAT + 0.0005, LNG, other);

    withVisits(visit({ id: 805 }));
    await svc.syncUser(USER);

    expect(only().matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-035: a visit without coordinates matches nothing', async () => {
    bucketItem('Brandenburger Tor', LAT, LNG);
    withVisits(visit({ id: 806, place: null }));

    await svc.syncUser(USER);

    const row = only();
    expect(row.lat).toBeNull();
    expect(row.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-037: one wish, one stay — the nearer of two neighbours keeps it', async () => {
    // 250 m is a city block, and a block in a city centre holds a dozen stays.
    // The café across the square from the museum satisfies the radius exactly as
    // the museum does; showing the same wish on both turns one achievement into
    // two claims and invites ticking it off from the wrong one.
    const wish = bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({ id: 810, name: 'Cafe Reichard', place: { latitude: LAT + 0.0018, longitude: LNG, id: 1 } }),
      visit({ id: 811, name: 'Museum Ludwig', place: { latitude: LAT + 0.0002, longitude: LNG, id: 2 } }),
    );

    await svc.syncUser(USER);

    const all = rows();
    expect(all.find((r) => r.source_visit_id === '811')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '810')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-038: the order the visits arrive in does not decide who keeps the wish', async () => {
    const wish = bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({ id: 821, name: 'Museum Ludwig', place: { latitude: LAT + 0.0002, longitude: LNG, id: 2 } }),
      visit({ id: 822, name: 'Cafe Reichard', place: { latitude: LAT + 0.0018, longitude: LNG, id: 1 } }),
    );

    await svc.syncUser(USER);

    const all = rows();
    expect(all.find((r) => r.source_visit_id === '821')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '822')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-068: of two stays exactly as close, the longer one takes the wish', async () => {
    // Both stays are at the wish's own coordinate, so the distances are the
    // same number rather than merely similar and the tie-break is the only
    // thing left to decide it. Standing somewhere for three hours is a better
    // answer to "were you there" than half an hour on the way past.
    const wish = bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({
        id: 840,
        name: 'A quick look',
        started_at: `${VISIT_DAY}T09:00:00Z`,
        ended_at: `${VISIT_DAY}T09:30:00Z`,
        place: { latitude: LAT, longitude: LNG, id: 1 },
      }),
      visit({
        id: 841,
        name: 'The whole afternoon',
        started_at: `${VISIT_DAY}T13:00:00Z`,
        ended_at: `${VISIT_DAY}T16:00:00Z`,
        place: { latitude: LAT, longitude: LNG, id: 1 },
      }),
    );

    await svc.syncUser(USER);

    const all = rows();
    expect(all.find((r) => r.source_visit_id === '841')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '840')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-069: the tie-break holds when the longer stay is the one already holding the wish', async () => {
    // The mirror image of 068. Here the incoming stay is the short one, so the
    // claim has to be refused rather than won. Otherwise the answer would
    // depend on the order the payload happened to list them in.
    const wish = bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({
        id: 850,
        name: 'The whole afternoon',
        started_at: `${VISIT_DAY}T13:00:00Z`,
        ended_at: `${VISIT_DAY}T16:00:00Z`,
        place: { latitude: LAT, longitude: LNG, id: 1 },
      }),
      visit({
        id: 851,
        name: 'A quick look',
        started_at: `${VISIT_DAY}T17:00:00Z`,
        ended_at: `${VISIT_DAY}T17:30:00Z`,
        place: { latitude: LAT, longitude: LNG, id: 1 },
      }),
    );

    await svc.syncUser(USER);

    const all = rows();
    expect(all.find((r) => r.source_visit_id === '850')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '851')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-070: a holder that lost its coordinates cannot block a stay that still has them', async () => {
    // A suggestion whose place came back without a position keeps its link but
    // can no longer be measured against anything. Skipping it is what lets the
    // next real stay take the wish; treating an unmeasurable holder as the
    // winner would freeze the match on a row nobody can act on. Dated well
    // outside the synced window so the reconciliation leaves it alone.
    const wish = bucketItem('Brandenburger Tor', LAT, LNG);
    testDb
      .prepare(
        `INSERT INTO dawarich_visit_suggestions
           (user_id, source_visit_id, trip_id, name, lat, lng, started_at, ended_at, duration_minutes,
            local_date, source_status, state, source_hash, matched_bucket_list_item_id)
         VALUES (?, '990', ?, 'Stay without a position', NULL, NULL, '2019-01-01T10:00:00Z',
                 '2019-01-01T12:00:00Z', 120, '2019-01-01', 'suggested', 'new', 'deadbeef', ?)`,
      )
      .run(USER, TRIP, wish);

    withVisits(visit({ id: 842 }));
    await svc.syncUser(USER);

    const all = rows();
    expect(all.find((r) => r.source_visit_id === '842')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '990')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-036: a suggestion still in state "new" is re-matched on a later run', async () => {
    withVisits(visit({ id: 807 }));
    await svc.syncUser(USER);
    expect(only().matched_bucket_list_item_id).toBeNull();

    const wish = bucketItem('Brandenburger Tor', LAT + 0.0005, LNG);
    withVisits(visit({ id: 807, name: 'Brandenburg Gate' }));
    await svc.syncUser(USER);

    expect(only().matched_bucket_list_item_id).toBe(wish);
  });
});

// ── syncUser result states ───────────────────────────────────────────────────

describe('DawarichSyncService — syncUser result state', () => {
  /** A second, older trip so one run covers two windows. */
  function secondTrip(): number {
    return createTrip(testDb, USER, { start_date: dayOffset(-60), end_date: dayOffset(-55) }).id;
  }

  it('DAWARICH-SYNC-040: reports "partial" when one of two trips fails', async () => {
    secondTrip();
    listVisits
      .mockRejectedValueOnce(new DawarichError('unreachable', 'connect ECONNREFUSED'))
      .mockResolvedValueOnce({ visits: [visit({ id: 901 })], truncated: false, version: null });

    const result = await svc.syncUser(USER);

    expect(listVisits).toHaveBeenCalledTimes(2);
    expect(result.state).toBe('partial');
    expect(recordSyncResult).toHaveBeenCalledWith(USER, 'partial', 'unreachable');
    expect(connection()).toMatchObject({ last_sync_state: 'partial', last_sync_error: 'unreachable' });
  });

  it('DAWARICH-SYNC-041: reports "failed" when every trip fails', async () => {
    secondTrip();
    listVisits.mockRejectedValue(new DawarichError('unauthorized', 'bad key'));

    const result = await svc.syncUser(USER);

    expect(listVisits).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ state: 'failed', created: 0, updated: 0, missing: 0 });
    expect(connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'unauthorized' });
  });

  it('DAWARICH-SYNC-042: a throw that is not a DawarichError is recorded as "unreachable"', async () => {
    listVisits.mockRejectedValue(new TypeError('fetch failed'));

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('failed');
    expect(connection().last_sync_error).toBe('unreachable');
  });

  it('DAWARICH-SYNC-043: reports "ok" and clears the stored error on a clean run', async () => {
    testDb
      .prepare(
        "UPDATE dawarich_connections SET last_sync_state = 'failed', last_sync_error = 'unreachable' WHERE user_id = ?",
      )
      .run(USER);
    withVisits(visit({ id: 902 }));

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-044: a user with no syncable trip is "ok", not a failure', async () => {
    testDb.prepare('DELETE FROM trips WHERE id = ?').run(TRIP);

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    expect(listVisits).not.toHaveBeenCalled();
    expect(connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-072: a trip whose start date is not a date is skipped, not asked about', async () => {
    // An imported or hand-edited trip can hold something that passes the SQL
    // filter and still is not a date. Without the window guard the request
    // would go out with a NaN boundary, which Dawarich reads as "everything",
    // and the answer would be the user's entire archive.
    testDb.prepare("UPDATE trips SET start_date = '0000-00-00', end_date = NULL WHERE id = ?").run(TRIP);

    const result = await svc.syncUser(USER);

    expect(listVisits).not.toHaveBeenCalled();
    // Nothing failed: there was simply nothing answerable to ask.
    expect(result).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    expect(connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-045: an archived trip is not polled', async () => {
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(TRIP);

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-046: a trip the user is only a member of is polled too', async () => {
    const owner = createUser(testDb).user.id;
    const shared = createTrip(testDb, owner, { start_date: dayOffset(-12), end_date: dayOffset(-10) }).id;
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)').run(shared, USER, owner);
    testDb.prepare('DELETE FROM trips WHERE id = ?').run(TRIP);
    withVisits();

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(listVisits).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-SYNC-047: capabilities are re-probed after a run that was not a total failure', async () => {
    withVisits(visit({ id: 903 }));

    await svc.syncUser(USER);

    expect(probeCapabilities).toHaveBeenCalledTimes(1);
    expect(storeCapabilities).toHaveBeenCalledWith(USER, CAPABILITIES);
  });

  it('DAWARICH-SYNC-048: a failed probe does not turn a good sync into a failure', async () => {
    withVisits(visit({ id: 904 }));
    probeCapabilities.mockRejectedValue(new DawarichError('server_error', 'boom'));

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(storeCapabilities).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-049: a failed run is not followed by a probe', async () => {
    listVisits.mockRejectedValue(new DawarichError('unreachable', 'down'));

    await svc.syncUser(USER);

    expect(probeCapabilities).not.toHaveBeenCalled();
  });
});

// ── Gates ────────────────────────────────────────────────────────────────────

describe('DawarichSyncService — gates', () => {
  it('DAWARICH-SYNC-050: without the addon the run is stored as failed/addon_disabled', async () => {
    setAddonEnabled(testDb, 'dawarich', false);

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'failed', created: 0, updated: 0, missing: 0 });
    expect(recordSyncResult).toHaveBeenCalledWith(USER, 'failed', 'addon_disabled');
    expect(connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'addon_disabled' });
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-051: without a connection the run is stored as failed/not_connected', async () => {
    connect(USER, { apiKey: null });

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'failed', created: 0, updated: 0, missing: 0 });
    expect(recordSyncResult).toHaveBeenCalledWith(USER, 'failed', 'not_connected');
    expect(connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'not_connected' });
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-052: syncGloballyEnabled follows the addon row', () => {
    expect(svc.syncGloballyEnabled()).toBe(true);
    setAddonEnabled(testDb, 'dawarich', false);
    expect(svc.syncGloballyEnabled()).toBe(false);
  });
});

// ── runSync (the cron entry point) ───────────────────────────────────────────

describe('DawarichSyncService — runSync', () => {
  it('DAWARICH-SYNC-060: does nothing at all while the addon is off', async () => {
    setAddonEnabled(testDb, 'dawarich', false);

    await svc.runSync();

    expect(listSyncableUserIds).not.toHaveBeenCalled();
    expect(recordSyncResult).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-061: one user blowing up does not stop the next one', async () => {
    const other = createUser(testDb).user.id;
    createTrip(testDb, other, { start_date: TRIP_START, end_date: TRIP_END });
    connect(other);
    withVisits();
    // A hard throw, i.e. the case syncUser does not catch for itself.
    getCredentials.mockImplementationOnce(() => {
      throw new Error('credential store exploded');
    });

    await svc.runSync();

    expect(listSyncableUserIds).toHaveBeenCalledTimes(1);
    expect(recordSyncResult).toHaveBeenCalledWith(other, 'ok', null);
  });

  it('DAWARICH-SYNC-071: a throw that is not an Error is survived just the same', async () => {
    // The catch reads `.message` off whatever arrived. A rejection that is not
    // an Error (a string from a native module, a plain object from a
    // credential store) would otherwise throw a second time inside the
    // handler, out of the loop, and take every remaining user with it.
    const other = createUser(testDb).user.id;
    createTrip(testDb, other, { start_date: TRIP_START, end_date: TRIP_END });
    connect(other);
    withVisits();
    getCredentials.mockImplementationOnce(() => {
      throw 'credential store returned a string';
    });

    await svc.runSync();

    expect(recordSyncResult).toHaveBeenCalledWith(other, 'ok', null);
  });

  it('DAWARICH-SYNC-062: skips a connection whose background sync is switched off', async () => {
    connect(USER, { syncEnabled: false });
    withVisits();

    await svc.runSync();

    expect(recordSyncResult).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-063: a second tick while one is still running is dropped', async () => {
    let release: (value: { visits: DawarichVisitRaw[]; truncated: boolean; version: string | null }) => void = () => {};
    listVisits.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    const first = svc.runSync();
    const second = svc.runSync();
    release({ visits: [], truncated: false, version: null });
    await Promise.all([first, second]);

    expect(listSyncableUserIds).toHaveBeenCalledTimes(1);
    expect(listVisits).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-SYNC-064: the guard is released again, so the next tick runs', async () => {
    withVisits();

    await svc.runSync();
    await svc.runSync();

    expect(listSyncableUserIds).toHaveBeenCalledTimes(2);
  });

  it('DAWARICH-SYNC-065: a second "check now" while one is running is answered, not started', async () => {
    // The module flag only guards the cron against itself; the button calls
    // syncUser directly, so without a per-user guard a held-down button asks
    // the same instance for the same windows several times over.
    withVisits(visit({ id: 901 }));
    const first = svc.syncUser(USER);
    const second = await svc.syncUser(USER);

    expect(second.alreadyRunning).toBe(true);
    expect(second).toMatchObject({ created: 0, updated: 0, missing: 0 });
    await first;
    // And the guard is released, so the next press does run.
    expect((await svc.syncUser(USER)).alreadyRunning).toBeUndefined();
  });

  it('DAWARICH-SYNC-066: the refused press reports the state the card already shows, not a fresh one', async () => {
    // The run in flight will record its own result. Until it does, the honest
    // answer is what the connection currently holds. Answering "ok" would
    // clear a warning nobody fixed, and answering "never" would wipe the
    // history of a connection that has synced for months.
    testDb
      .prepare("UPDATE dawarich_connections SET last_sync_state = 'partial' WHERE user_id = ?")
      .run(USER);
    let release: (value: { visits: DawarichVisitRaw[]; truncated: boolean; version: string | null }) => void =
      () => {};
    listVisits.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    const first = svc.syncUser(USER);
    const second = await svc.syncUser(USER);

    expect(second).toEqual({ state: 'partial', created: 0, updated: 0, missing: 0, alreadyRunning: true });
    release({ visits: [], truncated: false, version: null });
    await first;
  });

  it('DAWARICH-SYNC-067: a connection that no longer exists reads as "never" rather than as undefined', async () => {
    // Disconnecting mid-sync is a real sequence: the settings card deletes the
    // row while the button press it triggered is still walking windows. There
    // is no stored state left to report, and `never` is the one the wire
    // contract allows.
    testDb.prepare('DELETE FROM dawarich_connections WHERE user_id = ?').run(USER);

    const first = svc.syncUser(USER);
    const second = await svc.syncUser(USER);

    expect(second.state).toBe('never');
    expect(second.alreadyRunning).toBe(true);
    await first;
  });
});
