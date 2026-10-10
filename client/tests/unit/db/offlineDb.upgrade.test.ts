/**
 * Upgrade paths of the offline Dexie database.
 *
 * Every version() in src/db/offlineDb.ts runs once, on a real device, when a
 * new bundle opens a database an older one wrote. These tests do the same in
 * fake-indexeddb: build the database as the previous version left it, seed a
 * row into every table it had, open it with the current TrekOfflineDb and check
 * that the rows survived and that the version's upgrade did what it is for.
 *
 * A device can sit on any older version, so each case starts one version back
 * and goes all the way to the current one. The guard at the bottom fails when a
 * version is declared without a case here, or without its stores in HISTORY.
 */
import Dexie from 'dexie';
import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { TrekOfflineDb } from '../../../src/db/offlineDb';

type StoreSpec = Record<string, string | null>;

/**
 * The stores each version declared, as shipped. Never edit a shipped entry: a
 * device that ran it has exactly this schema. A new version adds one entry.
 */
const HISTORY: Record<number, StoreSpec> = {
  1: {
    trips: 'id',
    days: 'id, trip_id',
    places: 'id, trip_id',
    packingItems: 'id, trip_id',
    todoItems: 'id, trip_id',
    budgetItems: 'id, trip_id',
    reservations: 'id, trip_id',
    tripFiles: 'id, trip_id',
    mutationQueue: 'id, tripId, status, createdAt',
    syncMeta: 'tripId',
    blobCache: 'url, cachedAt',
  },
  2: {
    accommodations: 'id, trip_id',
    tripMembers: '[tripId+id], tripId',
    tags: 'id',
    categories: 'id',
  },
  3: { blobCache: 'url, cachedAt, tripId' },
  4: { importFiles: '[jobId+fileName], jobId, createdAt' },
  5: { areaPlaces: 'gers, tripId, searchName' },
  6: { roadtripPreferences: 'tripId' },
  7: { areaPlaces: null },
  8: { areaPlaces: '[gers+tripId], gers, tripId, searchName' },
  9: { tours: 'place_id, trip_id' },
};

const HISTORY_VERSIONS = Object.keys(HISTORY)
  .map(Number)
  .sort((a, b) => a - b);

/** The tables a database at `version` has, with their store spec. */
function schemaAt(version: number): Record<string, string> {
  const tables: Record<string, string> = {};
  for (const v of HISTORY_VERSIONS) {
    if (v > version) break;
    for (const [table, spec] of Object.entries(HISTORY[v])) {
      if (spec === null) delete tables[table];
      else tables[table] = spec;
    }
  }
  return tables;
}

// ── Representative rows ──────────────────────────────────────────────────────

/** A row for every table a database at `version` has, in that version's shape. */
function rowsAt(version: number): Record<string, Record<string, unknown>> {
  const all: Record<string, Record<string, unknown>> = {
    trips: { id: 1, title: 'Lisbon', start_date: '2026-07-01' },
    days: { id: 11, trip_id: 1, date: '2026-07-01' },
    places: { id: 21, trip_id: 1, name: 'Belem Tower', updated_at: '2026-06-01T10:00:00Z' },
    packingItems: { id: 31, trip_id: 1, name: 'Charger', checked: 0 },
    todoItems: { id: 41, trip_id: 1, name: 'Book the ferry' },
    budgetItems: { id: 51, trip_id: 1, name: 'Hotel', total_price: 120 },
    reservations: { id: 61, trip_id: 1, title: 'Ferry' },
    tripFiles: { id: 71, trip_id: 1, original_name: 'ticket.pdf' },
    // A write queued before the format stamp existed: no schemaVersion.
    mutationQueue: {
      id: 'queued-1',
      tripId: 1,
      method: 'PUT',
      url: '/trips/1/places/21',
      body: { name: 'Belem' },
      createdAt: 1,
      status: 'pending',
      attempts: 0,
      lastError: null,
      resource: 'places',
      entityId: 21,
    },
    syncMeta: {
      tripId: 1,
      lastSyncedAt: 1000,
      status: 'idle',
      tilesBbox: [-9.2, 38.7, -9.1, 38.8],
      filesCachedCount: 2,
      // The area fingerprint arrived with the area cache (v5).
      ...(version >= 5 ? { areaPlacesKey: '-9.2,38.7,-9.1,38.8' } : {}),
    },
    // Before v3 a cached blob named no trip and kept no byte count. The blob is a
    // stand-in object: the upgrade reads only its size.
    blobCache:
      version >= 3
        ? {
            url: '/api/files/71/download',
            tripId: 1,
            blob: { size: 42 },
            bytes: 42,
            mime: 'application/pdf',
            cachedAt: 5,
          }
        : { url: '/api/files/71/download', blob: { size: 42 }, mime: 'application/pdf', cachedAt: 5 },
    accommodations: { id: 81, trip_id: 1, place_id: 21 },
    tripMembers: { tripId: 1, id: 7, username: 'ana' },
    tags: { id: 3, name: 'food' },
    categories: { id: 4, name: 'Museum' },
    importFiles: { jobId: 'job-1', fileName: 'booking.pdf', blob: { size: 3 }, createdAt: 9 },
    areaPlaces: { gers: 'g-1', tripId: 1, name: 'Café A', searchName: 'cafe a', address: '', cachedAt: 7 },
    roadtripPreferences: { tripId: 1, preferences: { avoid_tolls: true } },
    tours: { place_id: 21, trip_id: 1, name: 'Old town loop', distance: 4200 },
  };
  const tables = schemaAt(version);
  return Object.fromEntries(Object.entries(all).filter(([table]) => table in tables));
}

/** What `rowsAt(from)` must read as once the current version opened it. */
function expectedAfterUpgrade(from: number): Record<string, Record<string, unknown> | null> {
  const expected: Record<string, Record<string, unknown> | null> = { ...rowsAt(from) };
  if (from < 3) expected.blobCache = { ...expected.blobCache, tripId: -1, bytes: 42 };
  if (from < 8) {
    // v7 dropped the GERS-keyed area cache and v8 cleared every fingerprint, so
    // the next sync downloads the area again.
    if ('areaPlaces' in expected) expected.areaPlaces = null;
    if (expected.syncMeta) {
      const meta = { ...expected.syncMeta };
      delete meta.areaPlacesKey;
      expected.syncMeta = meta;
    }
  }
  return expected;
}

// ── Opening a database at an older version ───────────────────────────────────

const opened: Dexie[] = [];
let dbCounter = 0;

function freshName(): string {
  dbCounter += 1;
  return `trek-offline-upgrade-${dbCounter}`;
}

/** Create `name` as a build declaring versions 1..`version` would, and seed it. */
async function writeOldDatabase(name: string, version: number): Promise<void> {
  const old = new Dexie(name);
  for (const v of HISTORY_VERSIONS) {
    if (v > version) break;
    old.version(v).stores(HISTORY[v]);
  }
  await old.open();
  for (const [table, row] of Object.entries(rowsAt(version))) await old.table(table).put(row);
  old.close();
}

async function openCurrent(name: string): Promise<TrekOfflineDb> {
  const db = new TrekOfflineDb(name);
  opened.push(db);
  await db.open();
  return db;
}

afterEach(async () => {
  for (const db of opened.splice(0)) {
    db.close();
    await Dexie.delete(db.name);
  }
});

// ── One case per declared version ────────────────────────────────────────────

interface UpgradeCase {
  /** What the version is for, as the test name. */
  intent: string;
  /** Checks beyond "every row survived", on a database upgraded from the version before. */
  check: (db: TrekOfflineDb) => Promise<void>;
}

/**
 * Keyed by the version the case upgrades INTO, from the one before it. Version
 * 1 has no predecessor, so its case is a fresh install.
 */
const UPGRADE_CASES: Record<number, UpgradeCase> = {
  1: {
    intent: 'a fresh install gets every table, empty',
    check: async (db) => {
      expect(db.tables.map((t) => t.name).sort()).toEqual(Object.keys(schemaAt(Infinity)).sort());
      for (const table of db.tables) expect(await table.count()).toBe(0);
    },
  },
  2: {
    intent: 'adds accommodations, trip members, tags and categories',
    check: async (db) => {
      await db.table('tripMembers').put({ tripId: 2, id: 7, username: 'ana' });
      expect(await db.tripMembers.where('tripId').equals(2).count()).toBe(1);
      expect(await db.tripMembers.get([2, 7])).toMatchObject({ username: 'ana' });
    },
  },
  3: {
    intent: 'scopes the blob cache by trip and backfills the byte count',
    check: async (db) => {
      const legacy = await db.blobCache.where('tripId').equals(-1).toArray();
      expect(legacy.map((b) => b.url)).toEqual(['/api/files/71/download']);
      expect(legacy[0].bytes).toBe(42);
    },
  },
  4: {
    intent: 'adds the booking-import source files',
    check: async (db) => {
      await db.importFiles.put({ jobId: 'job-2', fileName: 'a.pdf', blob: new Blob(['a']), createdAt: 1 });
      expect(await db.importFiles.where('jobId').equals('job-2').count()).toBe(1);
    },
  },
  5: {
    intent: 'adds the area cache for offline place search',
    check: async (db) => {
      expect(await db.areaPlaces.count()).toBe(0);
      expect(await db.syncMeta.get(1)).not.toHaveProperty('areaPlacesKey');
    },
  },
  6: {
    intent: 'adds the driving settings',
    check: async (db) => {
      await db.table('roadtripPreferences').put({ tripId: 2, preferences: {} });
      expect(await db.roadtripPreferences.count()).toBe(1);
      // The empty area cache comes from v7 and v8 on the way to the current version.
      expect(await db.areaPlaces.count()).toBe(0);
      expect(await db.syncMeta.get(1)).not.toHaveProperty('areaPlacesKey');
    },
  },
  7: {
    intent: 'drops the GERS-keyed area cache and keeps the driving settings',
    check: async (db) => {
      expect(await db.roadtripPreferences.get(1)).toMatchObject({ preferences: { avoid_tolls: true } });
      expect(await db.areaPlaces.where('tripId').equals(1).count()).toBe(0);
      expect(await db.syncMeta.get(1)).toMatchObject({ lastSyncedAt: 1000, filesCachedCount: 2 });
    },
  },
  8: {
    intent: 'rebuilds the area cache per trip and clears every area fingerprint',
    check: async (db) => {
      const meta = await db.syncMeta.get(1);
      expect(meta).not.toHaveProperty('areaPlacesKey');
      expect(meta).toMatchObject({ lastSyncedAt: 1000, tilesBbox: [-9.2, 38.7, -9.1, 38.8] });
      // The same place near two trips is two rows now.
      const place = { gers: 'g-9', name: 'Kiosk', searchName: 'kiosk', address: '', lat: null, lng: null };
      const rest = { category: null, website: null, phone: null, cachedAt: 1 };
      await db.areaPlaces.bulkPut([
        { ...place, ...rest, tripId: 1 },
        { ...place, ...rest, tripId: 2 },
      ]);
      expect(await db.areaPlaces.where('gers').equals('g-9').count()).toBe(2);
    },
  },
  9: {
    intent: 'adds the tours facet without touching the area cache or its fingerprint',
    check: async (db) => {
      // v8's upgrade ran on the way to v8 and must not run again.
      expect(await db.syncMeta.get(1)).toMatchObject({ areaPlacesKey: '-9.2,38.7,-9.1,38.8' });
      expect(await db.areaPlaces.get(['g-1', 1])).toMatchObject({ name: 'Café A' });
      await db.table('tours').put({ place_id: 99, trip_id: 3 });
      expect(await db.tours.where('trip_id').equals(3).count()).toBe(1);
    },
  },
};

describe('offlineDb upgrades', () => {
  for (const [version, upgradeCase] of Object.entries(UPGRADE_CASES).map(([v, c]) => [Number(v), c] as const)) {
    it(`v${version}: ${upgradeCase.intent}`, async () => {
      const name = freshName();
      const from = version - 1;
      if (from >= 1) await writeOldDatabase(name, from);

      const db = await openCurrent(name);
      expect(db.verno).toBe(Math.max(...HISTORY_VERSIONS));

      if (from >= 1) {
        for (const [table, row] of Object.entries(expectedAfterUpgrade(from))) {
          const rows = await db.table(table).toArray();
          if (row === null) expect(rows, table).toEqual([]);
          else expect(rows, table).toEqual([row]);
        }
      }
      await upgradeCase.check(db);
    });
  }

  it('keeps a queued write from before the format stamp readable, unstamped', async () => {
    const name = freshName();
    await writeOldDatabase(name, Math.max(...HISTORY_VERSIONS));
    const db = await openCurrent(name);
    const row = await db.mutationQueue.get('queued-1');
    expect(row).toMatchObject({ status: 'pending', url: '/trips/1/places/21' });
    expect(row?.schemaVersion).toBeUndefined();
  });
});

// ── Guard: no version without a case ─────────────────────────────────────────

describe('offlineDb upgrade coverage', () => {
  const source = readFileSync(resolve(__dirname, '../../../src/db/offlineDb.ts'), 'utf8');
  const declared = [...source.matchAll(/this\.version\((\d+)\)/g)].map((m) => Number(m[1]));

  it('declares each version once', () => {
    expect(declared.length).toBeGreaterThan(0);
    expect(new Set(declared).size).toBe(declared.length);
  });

  it('has an upgrade case for every declared version', () => {
    const cases = Object.keys(UPGRADE_CASES).map(Number);
    expect(cases.sort((a, b) => a - b)).toEqual([...declared].sort((a, b) => a - b));
  });

  it('has the stores of every declared version in HISTORY', () => {
    expect(HISTORY_VERSIONS).toEqual([...declared].sort((a, b) => a - b));
  });

  it('builds the current schema from HISTORY', async () => {
    const db = await openCurrent(freshName());
    const actual = Object.fromEntries(
      db.tables.map((t) => [t.name, [t.schema.primKey.src, ...t.schema.indexes.map((i) => i.src)].join(', ')])
    );
    expect(actual).toEqual(schemaAt(Infinity));
  });
});
