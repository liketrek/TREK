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
import { db as testDb } from '../../../src/db/database';
import { BucketList } from '../../../src/db/entities/BucketList.entity';
import { DawarichConnections } from '../../../src/db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../../src/db/entities/DawarichVisitSuggestions.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import type { BucketListRepository } from '../../../src/db/repositories/BucketList.repository';
import type { DawarichConnectionsRepository } from '../../../src/db/repositories/DawarichConnections.repository';
import type { DawarichVisitSuggestionsRepository } from '../../../src/db/repositories/DawarichVisitSuggestions.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { DawarichSyncService } from '../../../src/nest/integrations/dawarich-sync.service';
import { DawarichError } from '../../../src/nest/integrations/dawarich.client';
import type { DawarichClient, DawarichCreds, DawarichVisitRaw } from '../../../src/nest/integrations/dawarich.client';
import type { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import {
  createTestDawarichConnectionsRepo,
  createTestDawarichVisitSuggestionsRepo,
} from '../../helpers/dawarich-repos';
import { createUser, createTrip } from '../../helpers/factories';
import { deleteRows, findRow, findRows, insertRow, updateRows, upsertRow } from '../../helpers/factories/rows';
import { addTripMember } from '../../helpers/factories/trips';
import { createTestAddonsService } from '../../helpers/test-addons';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import type { TestOrm } from '../../helpers/test-orm';
import { createTestTripsRepo, createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';
import type { DawarichCapabilities, DawarichSyncState } from '@trek/shared';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite — same vi.hoisted pattern as atlas/immich) ──

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});

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
const getCredentials = vi.fn(async (userId: number): Promise<DawarichCreds | null> => {
  const row = await findRow(t, DawarichConnections, { user: userId });
  if (!row?.url || !row?.api_key) return null;
  return { baseUrl: row.url, apiKey: row.api_key, allowInsecureTls: !!row.allow_insecure_tls };
});

/** Writes the result where the settings card reads it, exactly as the real service does. */
const recordSyncResult = vi.fn(
  async (userId: number, state: DawarichSyncState, error: string | null): Promise<void> => {
    await updateRows(
      t,
      DawarichConnections,
      { user: userId },
      {
        last_sync_at: new Date().toISOString(),
        last_sync_state: state,
        last_sync_error: error,
      },
    );
  },
);

const listSyncableUserIds = vi.fn(async (): Promise<number[]> =>
  (
    await findRows(t, DawarichConnections, {
      sync_enabled: 1,
      url: { $ne: null, $nin: [''] },
      api_key: { $ne: null },
    })
  ).map((r) => r.user_id as number),
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
let t: TestOrm;
let suggestions: DawarichVisitSuggestionsRepository;
let trips: TripsRepository;
let bucketList: BucketListRepository;
let connections: DawarichConnectionsRepository;
let addons: AddonsService;
let svc: DawarichSyncService;

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

async function rows(userId = USER): Promise<SuggestionRow[]> {
  return (await findRows(t, DawarichVisitSuggestions, { user: userId }, { id: 'asc' })) as SuggestionRow[];
}

async function only(userId = USER): Promise<SuggestionRow> {
  const all = await rows(userId);
  expect(all).toHaveLength(1);
  return all[0];
}

async function connection(userId = USER): Promise<{ last_sync_state: string; last_sync_error: string | null }> {
  const row = await findRow(t, DawarichConnections, { user: userId });
  if (!row) throw new Error(`no dawarich connection for user ${userId}`);
  return { last_sync_state: row.last_sync_state, last_sync_error: row.last_sync_error ?? null };
}

async function connect(
  userId: number,
  opts: { url?: string | null; apiKey?: string | null; syncEnabled?: boolean } = {},
): Promise<void> {
  await upsertRow(t, DawarichConnections, {
    user: userId,
    url: opts.url === undefined ? 'https://dawarich.test' : opts.url,
    api_key: opts.apiKey === undefined ? 'secret-key' : opts.apiKey,
    allow_insecure_tls: 0,
    sync_enabled: opts.syncEnabled === false ? 0 : 1,
  });
}

async function bucketItem(name: string, lat: number, lng: number, userId = USER): Promise<number> {
  return insertRow(t, BucketList, { user: userId, name, lat, lng });
}

/** A suggestion row written straight in, as an earlier run or a stale state left it. */
function seedSuggestion(row: {
  source_visit_id: string;
  trip: number;
  name: string;
  lat: number | null;
  lng: number | null;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  local_date: string;
  state: string;
  source_hash: string;
  matchedBucketListItem?: number;
}): Promise<number> {
  return insertRow(t, DawarichVisitSuggestions, { user: USER, source_status: 'suggested', ...row });
}

/** Every window of the next run answers with exactly these visits. */
function withVisits(...visits: DawarichVisitRaw[]): void {
  listVisits.mockResolvedValue({ visits, truncated: false, version: '1.14.4' });
}

beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  suggestions = await createTestDawarichVisitSuggestionsRepo(testDb);
  trips = await createTestTripsRepo(testDb);
  bucketList = t.repo(BucketList);
  connections = await createTestDawarichConnectionsRepo(testDb);
  addons = await createTestAddonsService(testDb);
  svc = new DawarichSyncService(
    suggestions,
    addons,
    client,
    dawarich,
    trips,
    bucketList,
    connections,
    await createTestUnitOfWork(testDb),
  );
});

beforeEach(async () => {
  resetTestDb(testDb);
  // RESET_TABLES in tests/helpers/test-db.ts predates this domain and does not
  // list its two tables; foreign keys are off during the reset, so rows would
  // otherwise outlive their user and leak into the next case.
  await deleteRows(t, DawarichVisitSuggestions);
  await deleteRows(t, DawarichConnections);
  t.clear();
  vi.clearAllMocks();
  probeCapabilities.mockResolvedValue(CAPABILITIES);

  setAddonEnabled(testDb, 'dawarich', true);
  USER = createUser(testDb).user.id;
  TRIP = createTrip(testDb, USER, { start_date: TRIP_START, end_date: TRIP_END }).id;
  await connect(USER);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// ── Creating suggestions ─────────────────────────────────────────────────────

describe('DawarichSyncService — new visits', () => {
  it('DAWARICH-SYNC-001: stores an unseen visit as a suggestion in state "new"', async () => {
    withVisits(visit({ id: 501, name: 'Hotel Adlon', confidence: 0.82, confidence_band: 'high' }));

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'ok', created: 1, updated: 0, missing: 0 });
    const row = await only();
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

    expect((await only()).country_code).toBe('DE');
  });

  it('DAWARICH-SYNC-003: prefers the country code the source sends over the resolved one', async () => {
    withVisits(visit({ id: 503, place: { latitude: LAT, longitude: LNG, id: 77, country_code: 'at' } }));

    await svc.syncUser(USER);

    expect((await only()).country_code).toBe('AT');
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
    expect(await rows()).toHaveLength(1);
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
    const row = await only();
    expect(row.trip_id).toBe(TRIP);
    expect(row.trip_id).not.toBe(next);
  });

  it('DAWARICH-SYNC-075: a stay already parked on the wrong neighbour moves to the trip whose dates hold it', async () => {
    // What an earlier run left behind. Nobody acted on the row, so re-homing
    // it loses nothing, and the panel of the trip it belongs to fills in.
    const next = nextTrip();
    await seedSuggestion({
      source_visit_id: '911',
      trip: next,
      name: 'Hotel Adlon',
      lat: LAT,
      lng: LNG,
      started_at: `${TRIP_END}T09:00:00Z`,
      ended_at: `${TRIP_END}T12:00:00Z`,
      duration_minutes: 180,
      local_date: TRIP_END,
      state: 'new',
      source_hash: 'stale',
    });
    withVisits(lastDayVisit(911));

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ created: 0, missing: 0 });
    expect((await only()).trip_id).toBe(TRIP);
  });

  it('DAWARICH-SYNC-076: a row the user already acted on keeps its trip', async () => {
    // An acceptance made a place on that trip. Moving the row out from under
    // it would leave the handled list pointing somewhere else than the place.
    const next = nextTrip();
    await seedSuggestion({
      source_visit_id: '912',
      trip: next,
      name: 'Hotel Adlon',
      lat: LAT,
      lng: LNG,
      started_at: `${TRIP_END}T09:00:00Z`,
      ended_at: `${TRIP_END}T12:00:00Z`,
      duration_minutes: 180,
      local_date: TRIP_END,
      state: 'accepted',
      source_hash: 'stale',
    });
    withVisits(lastDayVisit(912));

    await svc.syncUser(USER);

    expect((await only()).trip_id).toBe(next);
  });

  it('DAWARICH-SYNC-077: a stay in the slack before departure, inside no trip at all, stays with the window that found it', async () => {
    // The evening before is why the lookback exists. With no other trip to
    // claim it, the stay belongs to the trip that asked, exactly as before.
    const eve = dayOffset(-31);
    withVisits(visit({ id: 913, started_at: `${eve}T20:00:00Z`, ended_at: `${eve}T22:00:00Z` }));

    await svc.syncUser(USER);

    const row = await only();
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
    expect((await only()).trip_id).toBe(TRIP);
  });
});

// ── Idempotency and change detection ─────────────────────────────────────────

describe('DawarichSyncService — repeated runs', () => {
  it('DAWARICH-SYNC-010: a second run over identical data creates no duplicate', async () => {
    withVisits(visit({ id: 601 }));
    await svc.syncUser(USER);
    const first = await only();

    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    const row = await only();
    expect(row.id).toBe(first.id);
    expect(row.first_seen_at).toBe(first.first_seen_at);
    expect(row.source_hash).toBe(first.source_hash);
  });

  it('DAWARICH-SYNC-011: a changed visit rewrites a suggestion still in state "new"', async () => {
    withVisits(visit({ id: 602, name: 'Unnamed place' }));
    await svc.syncUser(USER);
    const before = await only();

    withVisits(visit({ id: 602, name: 'Café Einstein', place: { latitude: 52.52, longitude: 13.38, id: 78 } }));
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 1 });
    const row = await only();
    expect(row.id).toBe(before.id);
    expect(row.name).toBe('Café Einstein');
    expect(row.lat).toBeCloseTo(52.52, 4);
    expect(row.source_hash).not.toBe(before.source_hash);
    expect(row.state).toBe('new');
  });

  it('DAWARICH-SYNC-012: a changed visit in state "accepted" keeps the user text and only moves the hash', async () => {
    withVisits(visit({ id: 603, name: 'Hotel Adlon' }));
    await svc.syncUser(USER);
    const before = await only();

    // What acceptance leaves behind: the user's own wording plus the hash they said yes to.
    await updateRows(
      t,
      DawarichVisitSuggestions,
      { id: before.id },
      {
        state: 'accepted',
        accepted_hash: before.source_hash,
        name: 'Our anniversary dinner',
      },
    );

    withVisits(visit({ id: 603, name: 'Adlon Kempinski', place: { latitude: 52.4, longitude: 13.2, id: 79 } }));
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 1 });
    const row = await only();
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
    const before = await only();
    await updateRows(t, DawarichVisitSuggestions, { id: before.id }, { state: 'dismissed' });

    withVisits(visit({ id: 604, name: 'Aral Tankstelle' }));
    const second = await svc.syncUser(USER);

    expect(second.updated).toBe(1);
    const row = await only();
    expect(row.state).toBe('dismissed');
    expect(row.name).toBe('Petrol station');
    expect(row.source_hash).not.toBe(before.source_hash);
  });

  it('DAWARICH-SYNC-014: an unchanged accepted row is not counted as an update', async () => {
    withVisits(visit({ id: 605 }));
    await svc.syncUser(USER);
    // accepted_hash takes each row's own source_hash, so the rows are written one by one.
    for (const row of await findRows(t, DawarichVisitSuggestions)) {
      await updateRows(
        t,
        DawarichVisitSuggestions,
        { id: row.id },
        { state: 'accepted', accepted_hash: row.source_hash },
      );
    }

    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 0, missing: 0 });
  });
});

// ── Disappearance ────────────────────────────────────────────────────────────

describe('DawarichSyncService — visits that vanish from the source', () => {
  it('DAWARICH-SYNC-020: an untouched suggestion is deleted when the source stops listing it', async () => {
    withVisits(visit({ id: 701 }));
    await svc.syncUser(USER);
    expect(await rows()).toHaveLength(1);

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second).toMatchObject({ created: 0, updated: 0, missing: 1 });
    expect(await rows()).toHaveLength(0);
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
    await updateRows(t, DawarichVisitSuggestions, { source_visit_id: '703' }, { state: 'accepted' });

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second.missing).toBe(2);
    const surviving = await only();
    expect(surviving.source_visit_id).toBe('703');
    expect(surviving.state).toBe('accepted');
    expect(surviving.name).toBe('Museumsinsel');
    expect(surviving.source_missing_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('DAWARICH-SYNC-022: a second empty run does not move an existing source_missing_at', async () => {
    withVisits(visit({ id: 704 }));
    await svc.syncUser(USER);
    await updateRows(t, DawarichVisitSuggestions, { source_visit_id: '704' }, { state: 'accepted' });

    withVisits();
    await svc.syncUser(USER);
    const firstStamp = (await only()).source_missing_at;
    expect(firstStamp).not.toBeNull();

    await svc.syncUser(USER);

    expect((await only()).source_missing_at).toBe(firstStamp);
  });

  it('DAWARICH-SYNC-023: a visit that comes back clears the missing flag', async () => {
    withVisits(visit({ id: 705 }));
    await svc.syncUser(USER);
    await updateRows(t, DawarichVisitSuggestions, { source_visit_id: '705' }, { state: 'accepted' });

    withVisits();
    await svc.syncUser(USER);
    expect((await only()).source_missing_at).not.toBeNull();

    withVisits(visit({ id: 705 }));
    await svc.syncUser(USER);

    expect((await only()).source_missing_at).toBeNull();
  });

  it('DAWARICH-SYNC-024: a suggestion outside the fetched window is untouched by the reconciliation', async () => {
    withVisits(visit({ id: 706 }));
    await svc.syncUser(USER);

    // Same user and trip, but a start date years before the window this trip asks about.
    await seedSuggestion({
      source_visit_id: '999',
      trip: TRIP,
      name: 'Ancient stay',
      lat: LAT,
      lng: LNG,
      started_at: '2019-01-01T10:00:00Z',
      ended_at: '2019-01-01T12:00:00Z',
      duration_minutes: 120,
      local_date: '2019-01-01',
      state: 'new',
      source_hash: 'deadbeef',
    });

    withVisits();
    const second = await svc.syncUser(USER);

    expect(second.missing).toBe(1);
    expect((await only()).source_visit_id).toBe('999');
  });
});

// ── Bucket-list matching ─────────────────────────────────────────────────────

describe('DawarichSyncService — bucket-list matching', () => {
  it('DAWARICH-SYNC-030: links a wish that is both close enough and dwelt on long enough', async () => {
    const wish = await bucketItem('Brandenburger Tor', LAT + 0.001, LNG); // ~111 m
    withVisits(visit({ id: 801, started_at: `${VISIT_DAY}T09:00:00Z`, ended_at: `${VISIT_DAY}T10:00:00Z` }));

    await svc.syncUser(USER);

    expect((await only()).matched_bucket_list_item_id).toBe(wish);
  });

  it('DAWARICH-SYNC-031: refuses a wish that is close but whose stay is too short', async () => {
    await bucketItem('Brandenburger Tor', LAT + 0.001, LNG);
    // Ten minutes, under DAWARICH_BUCKET_MATCH_MIN_MINUTES.
    withVisits(visit({ id: 802, started_at: `${VISIT_DAY}T09:00:00Z`, ended_at: `${VISIT_DAY}T09:10:00Z` }));

    await svc.syncUser(USER);

    const row = await only();
    expect(row.duration_minutes).toBe(10);
    expect(row.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-032: refuses a long stay that is inside the coarse box but beyond the radius', async () => {
    await bucketItem('Reichstag', LAT + 0.008, LNG); // ~890 m: inside the prefilter box, outside 250 m
    withVisits(visit({ id: 803 }));

    await svc.syncUser(USER);

    expect((await only()).matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-033: picks the nearest wish when several are in range', async () => {
    const far = await bucketItem('Pariser Platz', LAT + 0.002, LNG); // ~222 m
    const near = await bucketItem('Brandenburger Tor', LAT + 0.0005, LNG); // ~56 m

    withVisits(visit({ id: 804 }));
    await svc.syncUser(USER);

    const matched = (await only()).matched_bucket_list_item_id;
    expect(matched).toBe(near);
    expect(matched).not.toBe(far);
  });

  it('DAWARICH-SYNC-073: the first wish in range keeps it when the next one is farther away', async () => {
    // The mirror image of 033. Wishes come back in the order they were stored,
    // so storing the near one first is what makes the farther candidate arrive
    // with a winner already held. The loop then has to keep what it has instead
    // of taking whatever it looked at last; both wishes are inside the radius,
    // so nothing else in the loop can decide it.
    const near = await bucketItem('Brandenburger Tor', LAT + 0.0005, LNG); // ~56 m
    const far = await bucketItem('Pariser Platz', LAT + 0.002, LNG); // ~222 m, still inside 250 m

    withVisits(visit({ id: 808 }));
    await svc.syncUser(USER);

    const matched = (await only()).matched_bucket_list_item_id;
    expect(matched).toBe(near);
    expect(matched).not.toBe(far);
  });

  it('DAWARICH-SYNC-034: ignores a wish belonging to another user', async () => {
    const other = createUser(testDb).user.id;
    await bucketItem('Brandenburger Tor', LAT + 0.0005, LNG, other);

    withVisits(visit({ id: 805 }));
    await svc.syncUser(USER);

    expect((await only()).matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-035: a visit without coordinates matches nothing', async () => {
    await bucketItem('Brandenburger Tor', LAT, LNG);
    withVisits(visit({ id: 806, place: null }));

    await svc.syncUser(USER);

    const row = await only();
    expect(row.lat).toBeNull();
    expect(row.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-037: one wish, one stay — the nearer of two neighbours keeps it', async () => {
    // 250 m is a city block, and a block in a city centre holds a dozen stays.
    // The café across the square from the museum satisfies the radius exactly as
    // the museum does; showing the same wish on both turns one achievement into
    // two claims and invites ticking it off from the wrong one.
    const wish = await bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({ id: 810, name: 'Cafe Reichard', place: { latitude: LAT + 0.0018, longitude: LNG, id: 1 } }),
      visit({ id: 811, name: 'Museum Ludwig', place: { latitude: LAT + 0.0002, longitude: LNG, id: 2 } }),
    );

    await svc.syncUser(USER);

    const all = await rows();
    expect(all.find((r) => r.source_visit_id === '811')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '810')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-038: the order the visits arrive in does not decide who keeps the wish', async () => {
    const wish = await bucketItem('Museum Ludwig', LAT, LNG);
    withVisits(
      visit({ id: 821, name: 'Museum Ludwig', place: { latitude: LAT + 0.0002, longitude: LNG, id: 2 } }),
      visit({ id: 822, name: 'Cafe Reichard', place: { latitude: LAT + 0.0018, longitude: LNG, id: 1 } }),
    );

    await svc.syncUser(USER);

    const all = await rows();
    expect(all.find((r) => r.source_visit_id === '821')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '822')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-068: of two stays exactly as close, the longer one takes the wish', async () => {
    // Both stays are at the wish's own coordinate, so the distances are the
    // same number rather than merely similar and the tie-break is the only
    // thing left to decide it. Standing somewhere for three hours is a better
    // answer to "were you there" than half an hour on the way past.
    const wish = await bucketItem('Museum Ludwig', LAT, LNG);
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

    const all = await rows();
    expect(all.find((r) => r.source_visit_id === '841')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '840')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-069: the tie-break holds when the longer stay is the one already holding the wish', async () => {
    // The mirror image of 068. Here the incoming stay is the short one, so the
    // claim has to be refused rather than won. Otherwise the answer would
    // depend on the order the payload happened to list them in.
    const wish = await bucketItem('Museum Ludwig', LAT, LNG);
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

    const all = await rows();
    expect(all.find((r) => r.source_visit_id === '850')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '851')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-070: a holder that lost its coordinates cannot block a stay that still has them', async () => {
    // A suggestion whose place came back without a position keeps its link but
    // can no longer be measured against anything. Skipping it is what lets the
    // next real stay take the wish; treating an unmeasurable holder as the
    // winner would freeze the match on a row nobody can act on. Dated well
    // outside the synced window so the reconciliation leaves it alone.
    const wish = await bucketItem('Brandenburger Tor', LAT, LNG);
    await seedSuggestion({
      source_visit_id: '990',
      trip: TRIP,
      name: 'Stay without a position',
      lat: null,
      lng: null,
      started_at: '2019-01-01T10:00:00Z',
      ended_at: '2019-01-01T12:00:00Z',
      duration_minutes: 120,
      local_date: '2019-01-01',
      state: 'new',
      source_hash: 'deadbeef',
      matchedBucketListItem: wish,
    });

    withVisits(visit({ id: 842 }));
    await svc.syncUser(USER);

    const all = await rows();
    expect(all.find((r) => r.source_visit_id === '842')!.matched_bucket_list_item_id).toBe(wish);
    expect(all.find((r) => r.source_visit_id === '990')!.matched_bucket_list_item_id).toBeNull();
  });

  it('DAWARICH-SYNC-079: DSY12/DSY13 clear-then-set ordering — two rows already (wrongly) claiming the same wish end with exactly one holder, the new winner, never two or zero', async () => {
    // A state that should not arise from ordinary matching (claimWish already
    // clears every previous holder before assigning), but the ordering proof
    // has to hold even from a seeded, already-inconsistent starting point:
    // DSY12 (clear every existing holder) must run and complete BEFORE DSY13
    // (assign the new one), in the SAME transaction — reversed, or run as two
    // independent statements, a concurrent read between them could observe
    // either two holders or zero.
    const wish = await bucketItem('Brandenburger Tor', LAT, LNG);
    for (const [id, name, hash] of [
      ['970', 'Old holder A', 'deadbeef-a'],
      ['971', 'Old holder B', 'deadbeef-b'],
    ]) {
      await seedSuggestion({
        source_visit_id: id,
        trip: TRIP,
        name,
        lat: LAT,
        lng: LNG,
        started_at: '2019-01-01T10:00:00Z',
        ended_at: '2019-01-01T12:00:00Z',
        duration_minutes: 60,
        local_date: '2019-01-01',
        state: 'new',
        source_hash: hash,
        matchedBucketListItem: wish,
      });
    }

    withVisits(visit({ id: 972 }));
    await svc.syncUser(USER);

    const all = await rows();
    const holders = all.filter((r) => r.matched_bucket_list_item_id === wish);
    expect(holders).toHaveLength(1);
    expect(holders[0]!.source_visit_id).toBe('972');
  });

  it('DAWARICH-SYNC-036: a suggestion still in state "new" is re-matched on a later run', async () => {
    withVisits(visit({ id: 807 }));
    await svc.syncUser(USER);
    expect((await only()).matched_bucket_list_item_id).toBeNull();

    const wish = await bucketItem('Brandenburger Tor', LAT + 0.0005, LNG);
    withVisits(visit({ id: 807, name: 'Brandenburg Gate' }));
    await svc.syncUser(USER);

    expect((await only()).matched_bucket_list_item_id).toBe(wish);
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
    expect(await connection()).toMatchObject({ last_sync_state: 'partial', last_sync_error: 'unreachable' });
  });

  it('DAWARICH-SYNC-041: reports "failed" when every trip fails', async () => {
    secondTrip();
    listVisits.mockRejectedValue(new DawarichError('unauthorized', 'bad key'));

    const result = await svc.syncUser(USER);

    expect(listVisits).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ state: 'failed', created: 0, updated: 0, missing: 0 });
    expect(await connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'unauthorized' });
  });

  it('DAWARICH-SYNC-042: a throw that is not a DawarichError is recorded as "unreachable"', async () => {
    listVisits.mockRejectedValue(new TypeError('fetch failed'));

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('failed');
    expect((await connection()).last_sync_error).toBe('unreachable');
  });

  it('DAWARICH-SYNC-043: reports "ok" and clears the stored error on a clean run', async () => {
    await updateRows(
      t,
      DawarichConnections,
      { user: USER },
      { last_sync_state: 'failed', last_sync_error: 'unreachable' },
    );
    withVisits(visit({ id: 902 }));

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(await connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-044: a user with no syncable trip is "ok", not a failure', async () => {
    await deleteRows(t, Trips, { id: TRIP });

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    expect(listVisits).not.toHaveBeenCalled();
    expect(await connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-072: a trip whose start date is not a date is skipped, not asked about', async () => {
    // An imported or hand-edited trip can hold something that passes the SQL
    // filter and still is not a date. Without the window guard the request
    // would go out with a NaN boundary, which Dawarich reads as "everything",
    // and the answer would be the user's entire archive.
    await updateRows(t, Trips, { id: TRIP }, { start_date: '0000-00-00', end_date: null });

    const result = await svc.syncUser(USER);

    expect(listVisits).not.toHaveBeenCalled();
    // Nothing failed: there was simply nothing answerable to ask.
    expect(result).toMatchObject({ state: 'ok', created: 0, updated: 0, missing: 0 });
    expect(await connection()).toMatchObject({ last_sync_state: 'ok', last_sync_error: null });
  });

  it('DAWARICH-SYNC-045: an archived trip is not polled', async () => {
    await updateRows(t, Trips, { id: TRIP }, { is_archived: 1 });

    const result = await svc.syncUser(USER);

    expect(result.state).toBe('ok');
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-046: a trip the user is only a member of is polled too', async () => {
    const owner = createUser(testDb).user.id;
    const shared = createTrip(testDb, owner, { start_date: dayOffset(-12), end_date: dayOffset(-10) }).id;
    await addTripMember(t, shared, USER, owner);
    await deleteRows(t, Trips, { id: TRIP });
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
    expect(await connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'addon_disabled' });
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-051: without a connection the run is stored as failed/not_connected', async () => {
    await connect(USER, { apiKey: null });

    const result = await svc.syncUser(USER);

    expect(result).toMatchObject({ state: 'failed', created: 0, updated: 0, missing: 0 });
    expect(recordSyncResult).toHaveBeenCalledWith(USER, 'failed', 'not_connected');
    expect(await connection()).toMatchObject({ last_sync_state: 'failed', last_sync_error: 'not_connected' });
    expect(listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SYNC-052: syncGloballyEnabled follows the addon row', async () => {
    expect(await svc.syncGloballyEnabled()).toBe(true);
    setAddonEnabled(testDb, 'dawarich', false);
    expect(await svc.syncGloballyEnabled()).toBe(false);
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
    await connect(other);
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
    await connect(other);
    withVisits();
    getCredentials.mockImplementationOnce(() => {
      throw 'credential store returned a string';
    });

    await svc.runSync();

    expect(recordSyncResult).toHaveBeenCalledWith(other, 'ok', null);
  });

  it('DAWARICH-SYNC-062: skips a connection whose background sync is switched off', async () => {
    await connect(USER, { syncEnabled: false });
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
    await updateRows(t, DawarichConnections, { user: USER }, { last_sync_state: 'partial' });
    let release: (value: { visits: DawarichVisitRaw[]; truncated: boolean; version: string | null }) => void = () => {};
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
    await deleteRows(t, DawarichConnections, { user: USER });

    const first = svc.syncUser(USER);
    const second = await svc.syncUser(USER);

    expect(second.state).toBe('never');
    expect(second.alreadyRunning).toBe(true);
    await first;
  });
});
