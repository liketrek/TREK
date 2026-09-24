/**
 * DawarichService: DAWARICH-SVC-001 through DAWARICH-SVC-143.
 *
 * This is the credential half of the Dawarich integration. Everything it owns
 * is either a secret at rest or a decision about that secret, which is why the
 * database here is real in-memory SQLite rather than a stub: the interesting
 * behaviour lives in an UPSERT plus three conditional UPDATEs inside one
 * transaction, and a spy on `db.run` would only prove that some strings were
 * handed along. Reading the row back is the assertion.
 *
 * The at-rest crypto is real too, for the same reason. `maybe_encrypt_api_key`
 * stubbed to the identity function would let a regression that writes the key
 * in plaintext pass every case in this file, and "the key is never in the
 * column as typed" is the single most important thing the service does.
 *
 * The two things that would reach outside the process are faked: `checkSsrf`,
 * because the save path resolves DNS and a test must not depend on a resolver,
 * and `DawarichClient`, because the probe makes six upstream calls. The client
 * stub has no default implementation of its own beyond what each case sets, so
 * an unstubbed call fails loudly instead of dialling out.
 *
 * What is worth pinning here, in order of what it costs when it regresses:
 *
 *  - **the key never leaves.** `getConnection` hands back a mask, and a key
 *    that cannot be decrypted (rotated ENCRYPTION_KEY, restored backup) has to
 *    read as "not connected" rather than be sent upstream as a garbage bearer
 *    token;
 *  - **the key goes with the host.** Re-pointing the connection at a different
 *    Dawarich without retyping the key must drop the key, because a credential
 *    minted on one instance shipped to another one is a leak with a helpful UI
 *    in front of it. Same origin, different path is the same instance and must
 *    keep it, or every trailing-slash edit logs the user out;
 *  - **a private address is a warning, not a refusal.** A self-hosted Dawarich
 *    on a LAN is the common case. A guard that refuses it breaks the majority
 *    of installs to protect against something that is not happening;
 *  - **an older Dawarich still connects.** A 404 from an endpoint turns that
 *    one capability off; anything else propagates, because "connected, but
 *    nothing works" is a worse answer than an error;
 *  - **a stored capabilities blob is read defensively.** It is written by
 *    whatever build was running last, and a malformed value means "not probed
 *    yet", never a crash on the settings page.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite, the pattern the other Dawarich service tests use) ──

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
// Same fixed key the global setup exports, pinned here so the at-rest round
// trip cannot depend on what is lying in server/data.
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

// The whole ssrfGuard surface, not only `checkSsrf`: several modules on the
// import graph pull other names off it, and a factory mock that omits one
// throws on access rather than falling back to the real export.
const { checkSsrf } = vi.hoisted(() => ({ checkSsrf: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  checkSsrf,
  safeFetch: vi.fn(),
  safeFetchFollow: vi.fn(),
  safeFetchAdminConfigured: vi.fn(),
  safeFetchLlm: vi.fn(),
  createPinnedDispatcher: vi.fn(() => ({})),
  SsrfBlockedError: class extends Error {},
}));

import { DAWARICH_KEY_MASK, type DawarichCapabilities } from '@trek/shared';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import {
  DawarichError,
  type DawarichClient,
  type DawarichVisitRaw,
} from '../../../src/nest/integrations/dawarich.client';
import type { AuditService } from '../../../src/nest/audit/audit.service';

// ── Collaborators ────────────────────────────────────────────────────────────

const audit = { writeAudit: vi.fn() };

const client = {
  probe: vi.fn(),
  listVisits: vi.fn(),
  listTracks: vi.fn(),
  listPoints: vi.fn(),
  listVisitedCities: vi.fn(),
  findVisitsNear: vi.fn(),
};

const dbs = new DatabaseService(testDb);
const svc = new DawarichService(
  dbs,
  audit as unknown as AuditService,
  client as unknown as DawarichClient,
);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const HOST = 'https://dawarich.example';
const IP = '203.0.113.44';

let USER = 0;

interface ConnFixture {
  url: string | null;
  /** Written verbatim, so a case can store a legacy plaintext key or a corrupt blob. */
  apiKey: string | null;
  allowInsecureTls: 0 | 1;
  syncEnabled: 0 | 1;
  lastSyncAt: string | null;
  lastSyncState: string;
  lastSyncError: string | null;
  capabilities: string | null;
}

function connect(userId: number, over: Partial<ConnFixture> = {}): void {
  const row: ConnFixture = {
    url: HOST,
    apiKey: 'stored-key',
    allowInsecureTls: 0,
    syncEnabled: 1,
    lastSyncAt: null,
    lastSyncState: 'never',
    lastSyncError: null,
    capabilities: null,
    ...over,
  };
  testDb
    .prepare(
      `INSERT OR REPLACE INTO dawarich_connections
         (user_id, url, api_key, allow_insecure_tls, sync_enabled,
          last_sync_at, last_sync_state, last_sync_error, capabilities)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      row.url,
      row.apiKey,
      row.allowInsecureTls,
      row.syncEnabled,
      row.lastSyncAt,
      row.lastSyncState,
      row.lastSyncError,
      row.capabilities,
    );
}

interface StoredRow {
  url: string | null;
  api_key: string | null;
  allow_insecure_tls: number;
  sync_enabled: number;
  last_sync_at: string | null;
  last_sync_state: string;
  last_sync_error: string | null;
  capabilities: string | null;
}

function row(userId = USER): StoredRow | undefined {
  return testDb
    .prepare('SELECT * FROM dawarich_connections WHERE user_id = ?')
    .get(userId) as StoredRow | undefined;
}

const FULL_CAPS: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: true,
  visitedCities: true,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.4',
  probedAt: '2026-09-12T00:00:00.000Z',
};

function visit(over: Partial<DawarichVisitRaw> = {}): DawarichVisitRaw {
  return {
    id: 501,
    area_id: null,
    started_at: '2026-09-10T09:00:00Z',
    ended_at: '2026-09-10T12:00:00Z',
    duration: null,
    name: 'Hotel Adlon',
    status: 'suggested',
    confidence: null,
    confidence_band: null,
    place: { latitude: 52.5163, longitude: 13.3777, id: 77 },
    ...over,
  };
}

/** Every probed endpoint answers; nothing is found, which is still an answer. */
function allEndpointsAnswer(visits: DawarichVisitRaw[] = []): void {
  client.probe.mockResolvedValue({ version: '1.14.4' });
  client.listVisits.mockResolvedValue({ visits, truncated: false, version: '1.14.4' });
  client.listTracks.mockResolvedValue({ features: [], truncated: false });
  client.listPoints.mockResolvedValue({ points: [], truncated: false });
  client.listVisitedCities.mockResolvedValue([]);
  client.findVisitsNear.mockResolvedValue([]);
}

const notFound = () => new DawarichError('not_found', 'Dawarich answered HTTP 404', 404);

/** The five capabilities that are nothing but "did this endpoint answer". */
type ProbedCapability = 'visits' | 'tracks' | 'points' | 'visitedCities' | 'locations';
type ProbedMethod = 'listVisits' | 'listTracks' | 'listPoints' | 'listVisitedCities' | 'findVisitsNear';

const PROBED_CAPABILITIES: ProbedCapability[] = ['visits', 'tracks', 'points', 'visitedCities', 'locations'];

/** Which client call decides which capability. Mutable tuples, because it.each wants them. */
const endpointCases: Array<[ProbedMethod, ProbedCapability]> = [
  ['listVisits', 'visits'],
  ['listTracks', 'tracks'],
  ['listPoints', 'points'],
  ['listVisitedCities', 'visitedCities'],
  ['findVisitsNear', 'locations'],
];

const updatedAtAbsentCases: Array<[string, Partial<DawarichVisitRaw>]> = [
  ['missing', {}],
  ['explicitly null', { updated_at: null }],
];

const countryCodeAbsentCases: Array<[string, Partial<DawarichVisitRaw>]> = [
  ['a visit with no place', { place: null }],
  ['a place without the field', { place: { latitude: 1, longitude: 2, id: 3 } }],
  ['a place with a null code', { place: { latitude: 1, longitude: 2, id: 3, country_code: null } }],
];

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: IP });
  allEndpointsAnswer();
  USER = createUser(testDb).user.id;
});

afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// getCredentials
// ---------------------------------------------------------------------------

describe('DawarichService getCredentials', () => {
  it('DAWARICH-SVC-001: a user who never connected has no credentials', () => {
    expect(svc.getCredentials(USER)).toBeNull();
  });

  it('DAWARICH-SVC-002: a row without an address is not a connection', () => {
    connect(USER, { url: null });
    expect(svc.getCredentials(USER)).toBeNull();
  });

  it('DAWARICH-SVC-003: a row without a key is not a connection', () => {
    connect(USER, { apiKey: null });
    expect(svc.getCredentials(USER)).toBeNull();
  });

  it('DAWARICH-SVC-004: a key that cannot be decrypted reads as "not connected" rather than travelling upstream as garbage', () => {
    // What a rotated ENCRYPTION_KEY or a half-restored backup leaves behind:
    // the envelope is intact, the ciphertext is not ours.
    connect(USER, { apiKey: 'enc:v1:bm90LWEtcmVhbC1ibG9i' });
    expect(svc.getCredentials(USER)).toBeNull();
  });

  it('DAWARICH-SVC-005: a legacy plaintext key still works, with the TLS flag off', () => {
    connect(USER, { apiKey: 'plain-legacy-key', allowInsecureTls: 0 });
    expect(svc.getCredentials(USER)).toEqual({
      baseUrl: HOST,
      apiKey: 'plain-legacy-key',
      allowInsecureTls: false,
    });
  });

  it('DAWARICH-SVC-006: the self-signed-certificate flag is carried into the credentials as a boolean', async () => {
    await svc.saveSettings(USER, HOST, 'typed-secret', true, true, IP);
    expect(svc.getCredentials(USER)).toEqual({
      baseUrl: HOST,
      apiKey: 'typed-secret',
      allowInsecureTls: true,
    });
  });
});

// ---------------------------------------------------------------------------
// isConnected / listSyncableUserIds
// ---------------------------------------------------------------------------

describe('DawarichService isConnected', () => {
  it('DAWARICH-SVC-010: both halves present means connected', () => {
    connect(USER);
    expect(svc.isConnected(USER)).toBe(true);
  });

  it('DAWARICH-SVC-011: an address without a key is not connected', () => {
    connect(USER, { apiKey: null });
    expect(svc.isConnected(USER)).toBe(false);
  });

  it('DAWARICH-SVC-012: no row at all is not connected', () => {
    expect(svc.isConnected(USER)).toBe(false);
  });

  it('DAWARICH-SVC-013: an undecryptable key still counts as connected here, because this asks about the row and not about the secret', () => {
    // Deliberate difference from getCredentials: the settings card has to keep
    // showing a connection the user can repair, and only the outbound path
    // cares that the ciphertext is unusable.
    connect(USER, { apiKey: 'enc:v1:bm90LWEtcmVhbC1ibG9i' });
    expect(svc.isConnected(USER)).toBe(true);
    expect(svc.getCredentials(USER)).toBeNull();
  });
});

describe('DawarichService listSyncableUserIds', () => {
  it('DAWARICH-SVC-020: only rows with background sync on, an address and a key', () => {
    const syncable = USER;
    const pollOff = createUser(testDb).user.id;
    const noUrl = createUser(testDb).user.id;
    const blankUrl = createUser(testDb).user.id;
    const noKey = createUser(testDb).user.id;

    connect(syncable);
    connect(pollOff, { syncEnabled: 0 });
    connect(noUrl, { url: null });
    // An empty string is a distinct case from NULL: the save path stores NULL,
    // but an older row or a hand-edited one can hold '' and it must not be
    // polled, because the client would then request /api/v1 on no host at all.
    connect(blankUrl, { url: '' });
    connect(noKey, { apiKey: null });

    expect(svc.listSyncableUserIds()).toEqual([syncable]);
  });

  it('DAWARICH-SVC-021: no connections at all is an empty list, not a throw', () => {
    expect(svc.listSyncableUserIds()).toEqual([]);
  });

  it('DAWARICH-SVC-022: every qualifying user comes back, not only the first row the cursor lands on', () => {
    // The cron fans out over this list. A query that answered with one id would
    // leave everyone but the earliest registration silently unsynced, and the
    // settings card would still say the poll was on for all of them.
    const second = createUser(testDb).user.id;
    const pollOff = createUser(testDb).user.id;
    connect(USER);
    connect(second);
    connect(pollOff, { syncEnabled: 0 });

    const ids = svc.listSyncableUserIds();

    // No ORDER BY upstream, so the set is the contract and the order is not.
    expect(new Set(ids)).toEqual(new Set([USER, second]));
    expect(ids).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getConnection: what the settings card renders
// ---------------------------------------------------------------------------

describe('DawarichService getConnection', () => {
  it('DAWARICH-SVC-030: a user who never opened the card gets empty fields and the poll defaulted ON', () => {
    expect(svc.getConnection(USER)).toEqual({
      url: '',
      apiKeyMasked: '',
      allowInsecureTls: false,
      syncEnabled: true,
      connected: false,
      lastSyncAt: null,
      lastSyncState: 'never',
      lastSyncError: null,
      capabilities: null,
    });
  });

  it('DAWARICH-SVC-031: a stored connection is reported with a mask where the key is, never the key', () => {
    connect(USER, {
      apiKey: 'stored-key',
      allowInsecureTls: 1,
      syncEnabled: 0,
      lastSyncAt: '2026-09-12T04:15:00.000Z',
      lastSyncState: 'partial',
      lastSyncError: 'rate_limited',
    });

    const out = svc.getConnection(USER);

    expect(out).toEqual({
      url: HOST,
      apiKeyMasked: DAWARICH_KEY_MASK,
      allowInsecureTls: true,
      syncEnabled: false,
      connected: true,
      lastSyncAt: '2026-09-12T04:15:00.000Z',
      lastSyncState: 'partial',
      lastSyncError: 'rate_limited',
      capabilities: null,
    });
    expect(JSON.stringify(out)).not.toContain('stored-key');
  });

  it('DAWARICH-SVC-032: an address without a key reports the address and no mask', () => {
    connect(USER, { apiKey: null });
    expect(svc.getConnection(USER)).toMatchObject({ url: HOST, apiKeyMasked: '', connected: false });
  });

  it('DAWARICH-SVC-033: a null address reads as an empty string, so the form binds to a value', () => {
    connect(USER, { url: null, apiKey: null });
    expect(svc.getConnection(USER)).toMatchObject({ url: '', connected: false, syncEnabled: true });
  });

  it.each(['ok', 'partial', 'failed'])('DAWARICH-SVC-034: the known sync state %s passes through', (state) => {
    connect(USER, { lastSyncState: state });
    expect(svc.getConnection(USER).lastSyncState).toBe(state);
  });

  it.each(['syncing', 'OK', 'success', ''])(
    'DAWARICH-SVC-035: the unrecognised sync state %j reads as "never" rather than reaching a client that has no branch for it',
    (state) => {
      connect(USER, { lastSyncState: state });
      expect(svc.getConnection(USER).lastSyncState).toBe('never');
    },
  );

  it.each(['{not json', '', 'undefined'])(
    'DAWARICH-SVC-036: the malformed capabilities blob %j reads as "not probed yet", never as a crash on the settings page',
    (raw) => {
      connect(USER, { capabilities: raw });
      expect(svc.getConnection(USER).capabilities).toBeNull();
    },
  );

  it.each(['null', '42', '"visits"', 'true'])(
    'DAWARICH-SVC-037: the JSON scalar %s is not a capabilities object and reads as not probed',
    (raw) => {
      connect(USER, { capabilities: raw });
      expect(svc.getConnection(USER).capabilities).toBeNull();
    },
  );

  it('DAWARICH-SVC-038: a blob written by an older build keeps only the fields it has, with every unknown flag off', () => {
    // The column survives an upgrade, so the shape is whatever was current when
    // the last probe ran. Missing flags are off and a missing probe timestamp
    // is the epoch, which reads as "long ago" everywhere it is compared.
    connect(USER, { capabilities: JSON.stringify({ visits: true, serverVersion: 17, extra: 'ignored' }) });

    expect(svc.getConnection(USER).capabilities).toEqual({
      visits: true,
      tracks: false,
      points: false,
      locations: false,
      visitedCities: false,
      visitUpdatedAt: false,
      visitCountryCode: false,
      serverVersion: null,
      probedAt: new Date(0).toISOString(),
    });
  });

  it('DAWARICH-SVC-039: a complete blob round-trips unchanged', () => {
    connect(USER, { capabilities: JSON.stringify(FULL_CAPS) });
    expect(svc.getConnection(USER).capabilities).toEqual(FULL_CAPS);
  });
});

describe('DawarichService getCapabilities', () => {
  it('DAWARICH-SVC-040: null when there is no connection', () => {
    expect(svc.getCapabilities(USER)).toBeNull();
  });

  it('DAWARICH-SVC-041: null when the connection has never been probed', () => {
    connect(USER);
    expect(svc.getCapabilities(USER)).toBeNull();
  });

  it('DAWARICH-SVC-042: the stored probe otherwise', () => {
    connect(USER, { capabilities: JSON.stringify(FULL_CAPS) });
    expect(svc.getCapabilities(USER)).toEqual(FULL_CAPS);
  });
});

// ---------------------------------------------------------------------------
// saveSettings
// ---------------------------------------------------------------------------

describe('DawarichService saveSettings', () => {
  it('DAWARICH-SVC-050: a first save creates the row and stores the key encrypted, never as typed', async () => {
    const out = await svc.saveSettings(USER, `  ${HOST}  `, 'super-secret', true, true, IP);

    expect(out).toEqual({ success: true });
    const stored = row();
    expect(stored?.url).toBe(HOST);
    expect(stored?.allow_insecure_tls).toBe(1);
    expect(stored?.sync_enabled).toBe(1);
    expect(stored?.api_key).toMatch(/^enc:v1:/);
    expect(stored?.api_key).not.toContain('super-secret');
    // The round trip is the point: encrypted at rest, usable on the way out.
    expect(svc.getCredentials(USER)?.apiKey).toBe('super-secret');
  });

  it('DAWARICH-SVC-051: turning the background poll off is persisted, and the card reports it', async () => {
    await svc.saveSettings(USER, HOST, 'k', false, false, IP);

    expect(row()?.sync_enabled).toBe(0);
    expect(row()?.allow_insecure_tls).toBe(0);
    expect(svc.getConnection(USER).syncEnabled).toBe(false);
    expect(svc.listSyncableUserIds()).toEqual([]);
  });

  it('DAWARICH-SVC-052: a blank key field keeps the stored key, because the field is never prefilled', async () => {
    await svc.saveSettings(USER, HOST, 'first-key', false, true, IP);
    const encrypted = row()?.api_key;

    await svc.saveSettings(USER, `${HOST}`, undefined, true, true, IP);

    expect(row()?.api_key).toBe(encrypted);
    expect(row()?.allow_insecure_tls).toBe(1);
  });

  it.each([DAWARICH_KEY_MASK, '   ', ''])(
    'DAWARICH-SVC-053: the key field %j means "keep what is stored"',
    async (typed) => {
      await svc.saveSettings(USER, HOST, 'first-key', false, true, IP);
      const encrypted = row()?.api_key;

      await svc.saveSettings(USER, HOST, typed, false, true, IP);

      expect(row()?.api_key).toBe(encrypted);
      expect(svc.getCredentials(USER)?.apiKey).toBe('first-key');
    },
  );

  it('DAWARICH-SVC-054: a new key typed over an old one replaces it', async () => {
    await svc.saveSettings(USER, HOST, 'first-key', false, true, IP);
    await svc.saveSettings(USER, HOST, 'second-key', false, true, IP);

    expect(svc.getCredentials(USER)?.apiKey).toBe('second-key');
  });

  it('DAWARICH-SVC-055: moving to a different host without retyping the key drops the key and every artefact of the old instance', async () => {
    connect(USER, {
      url: 'https://old.example',
      apiKey: 'stored-key',
      lastSyncAt: '2026-09-12T04:15:00.000Z',
      lastSyncState: 'ok',
      lastSyncError: 'rate_limited',
      capabilities: JSON.stringify(FULL_CAPS),
    });

    await svc.saveSettings(USER, 'https://new.example', undefined, false, true, IP);

    const stored = row();
    expect(stored?.url).toBe('https://new.example');
    expect(stored?.api_key).toBeNull();
    expect(stored?.capabilities).toBeNull();
    expect(stored?.last_sync_state).toBe('never');
    expect(stored?.last_sync_error).toBeNull();
    expect(stored?.last_sync_at).toBeNull();
  });

  it('DAWARICH-SVC-056: a different port is a different instance, so the key goes with it', async () => {
    connect(USER, { url: 'https://d.example' });
    await svc.saveSettings(USER, 'https://d.example:8443', undefined, false, true, IP);
    expect(row()?.api_key).toBeNull();
  });

  it.each([
    ['https://d.example/api', 'https://d.example/'],
    ['https://d.example', 'https://d.example/api/v1'],
    ['https://d.example/', 'https://d.example'],
  ])(
    'DAWARICH-SVC-057: %s to %s is the same instance and keeps the key',
    async (before, after) => {
      connect(USER, { url: before, apiKey: 'stored-key' });
      await svc.saveSettings(USER, after, undefined, false, true, IP);
      expect(row()?.api_key).toBe('stored-key');
      expect(row()?.url).toBe(after);
    },
  );

  it('DAWARICH-SVC-058: a key typed at the same time as the host change survives, because it was minted for the new host', async () => {
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });

    await svc.saveSettings(USER, 'https://new.example', 'minted-for-new', false, true, IP);

    expect(svc.getCredentials(USER)).toEqual({
      baseUrl: 'https://new.example',
      apiKey: 'minted-for-new',
      allowInsecureTls: false,
    });
  });

  it('DAWARICH-SVC-059: an unparseable stored address compares as written, so retyping it unchanged keeps the key', async () => {
    // No scheme, so the URL constructor throws and the comparison falls back to
    // string equality. Erring towards keeping the key here is safe precisely
    // because the text did not change.
    connect(USER, { url: 'dawarich.example', apiKey: 'stored-key' });

    await svc.saveSettings(USER, 'dawarich.example', undefined, false, true, IP);

    expect(row()?.api_key).toBe('stored-key');
  });

  it('DAWARICH-SVC-060: an unparseable stored address against a different one drops the key', async () => {
    connect(USER, { url: 'dawarich.example', apiKey: 'stored-key' });

    await svc.saveSettings(USER, 'https://new.example', undefined, false, true, IP);

    expect(row()?.api_key).toBeNull();
  });

  it('DAWARICH-SVC-061: a row whose address column is null counts as no previous host, so nothing is dropped', async () => {
    connect(USER, { url: null, apiKey: 'stored-key' });

    await svc.saveSettings(USER, HOST, undefined, false, true, IP);

    expect(row()?.api_key).toBe('stored-key');
    expect(row()?.url).toBe(HOST);
  });

  it('DAWARICH-SVC-062: clearing the address wipes the key, because a live credential for a server nobody named is just a stored secret', async () => {
    connect(USER, {
      apiKey: 'stored-key',
      lastSyncAt: '2026-09-12T04:15:00.000Z',
      lastSyncState: 'ok',
      lastSyncError: 'x',
      capabilities: JSON.stringify(FULL_CAPS),
    });

    const out = await svc.saveSettings(USER, '   ', undefined, false, true, IP);

    expect(out).toEqual({ success: true });
    const stored = row();
    expect(stored?.url).toBeNull();
    expect(stored?.api_key).toBeNull();
    expect(stored?.capabilities).toBeNull();
    expect(stored?.last_sync_state).toBe('never');
    expect(stored?.last_sync_at).toBeNull();
    expect(stored?.last_sync_error).toBeNull();
  });

  it('DAWARICH-SVC-063: a key typed while the address is cleared is discarded with it', async () => {
    connect(USER, { apiKey: 'stored-key' });
    await svc.saveSettings(USER, '', 'pointless-key', false, true, IP);
    expect(row()?.api_key).toBeNull();
  });

  it('DAWARICH-SVC-064: an empty address is never resolved, so clearing the connection cannot fail on DNS', async () => {
    await svc.saveSettings(USER, undefined, undefined, false, true, IP);
    expect(checkSsrf).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-065: an address that cannot work at all is refused with the guard reason and nothing is written', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: false, error: 'Only HTTP and HTTPS URLs are allowed' });

    const out = await svc.saveSettings(USER, 'ftp://dawarich.example', 'k', false, true, IP);

    expect(out).toEqual({
      success: false,
      code: 'invalid_url',
      error: 'Only HTTP and HTTPS URLs are allowed',
    });
    expect(row()).toBeUndefined();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-066: a refusal without a reason still carries a sentence a caller reading the API directly can act on', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: false });

    expect(await svc.saveSettings(USER, 'http://nope.invalid', 'k', false, true, IP)).toEqual({
      success: false,
      code: 'invalid_url',
      error: 'Invalid Dawarich URL',
    });
  });

  it('DAWARICH-SVC-067: a private address is saved with a warning and an audit line, not refused', async () => {
    checkSsrf.mockResolvedValue({ allowed: true, isPrivate: true, resolvedIp: '192.168.0.5' });

    const out = await svc.saveSettings(USER, 'http://dawarich.lan:3000', 'k', false, true, '198.51.100.7');

    expect(out).toEqual({
      success: true,
      warning: expect.stringContaining('192.168.0.5'),
      warningCode: 'private_ip',
      warningIp: '192.168.0.5',
    });
    expect(row()?.url).toBe('http://dawarich.lan:3000');
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: USER,
      action: 'dawarich.private_ip_configured',
      ip: '198.51.100.7',
      details: { dawarich_url: 'http://dawarich.lan:3000', resolved_ip: '192.168.0.5' },
    });
  });

  it('DAWARICH-SVC-068: a private address the guard would also block is still saved, because a self-hosted LAN instance is the common case', async () => {
    // ALLOW_INTERNAL_NETWORK unset: checkSsrf says not allowed AND private.
    // Refusing here would break the majority of installs.
    checkSsrf.mockResolvedValue({
      allowed: false,
      isPrivate: true,
      resolvedIp: '10.0.0.9',
      error: 'Requests to private/internal network addresses are not allowed.',
    });

    const out = await svc.saveSettings(USER, 'http://10.0.0.9:3000', 'k', false, true, IP);

    expect(out).toMatchObject({ success: true, warningCode: 'private_ip', warningIp: '10.0.0.9' });
    expect(row()?.url).toBe('http://10.0.0.9:3000');
  });

  it('DAWARICH-SVC-069: a private result the resolver could not name still warns, with no IP in the warning payload', async () => {
    checkSsrf.mockResolvedValue({ allowed: true, isPrivate: true });

    const out = await svc.saveSettings(USER, 'http://dawarich.lan', 'k', false, true, null);

    expect(out).toMatchObject({ success: true, warningCode: 'private_ip' });
    expect(out.warningIp).toBeUndefined();
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-SVC-070: the address write and the key write are one transaction, so a failed key write cannot leave the old key pointed at the new host', async () => {
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });
    const realRun = dbs.run.bind(dbs);
    const spy = vi.spyOn(dbs, 'run').mockImplementation((sql: string, ...params: unknown[]) => {
      if (sql.includes('SET api_key = ?')) throw new Error('disk I/O error');
      return realRun(sql, ...params);
    });

    try {
      await expect(svc.saveSettings(USER, 'https://new.example', 'fresh', false, true, IP)).rejects.toThrow(
        'disk I/O error',
      );
    } finally {
      spy.mockRestore();
    }

    const stored = row();
    expect(stored?.url).toBe('https://old.example');
    expect(stored?.api_key).toBe('stored-key');
  });

  it("DAWARICH-SVC-071: both wipes name one user, so neither the host move nor the cleared address reaches anybody else's credential", async () => {
    // A missing WHERE on either UPDATE passes every single-user case in this
    // file and then logs the whole install out of Dawarich the first time one
    // person edits their own URL. Two victims, one bystander, both statements.
    const bystander = createUser(testDb).user.id;
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });
    connect(bystander, {
      apiKey: 'bystander-key',
      capabilities: JSON.stringify(FULL_CAPS),
      lastSyncState: 'ok',
    });

    await svc.saveSettings(USER, 'https://new.example', undefined, false, true, IP);
    await svc.saveSettings(USER, '', undefined, false, true, IP);

    expect(row()?.api_key).toBeNull();
    expect(row(bystander)).toMatchObject({
      url: HOST,
      api_key: 'bystander-key',
      last_sync_state: 'ok',
      capabilities: JSON.stringify(FULL_CAPS),
    });
  });

  it('DAWARICH-SVC-072: a key typed with the host change keeps the key but still drops what the old instance answered', async () => {
    // The probe blob and the sync history describe the server the row used to
    // point at. Carrying them over would show the old instance's version and
    // "last sync ok" on a connection that has never been asked anything, and
    // the tracks layer would skip an endpoint the new instance does have.
    connect(USER, {
      url: 'https://old.example',
      apiKey: 'stored-key',
      lastSyncAt: '2026-09-12T04:15:00.000Z',
      lastSyncState: 'ok',
      lastSyncError: 'rate_limited',
      capabilities: JSON.stringify(FULL_CAPS),
    });

    await svc.saveSettings(USER, 'https://new.example', 'minted-for-new', false, true, IP);

    expect(svc.getCredentials(USER)?.apiKey).toBe('minted-for-new');
    const stored = row();
    expect(stored?.url).toBe('https://new.example');
    expect(stored?.capabilities).toBeNull();
    expect(stored?.last_sync_state).toBe('never');
    expect(stored?.last_sync_error).toBeNull();
    expect(stored?.last_sync_at).toBeNull();
  });

  it('DAWARICH-SVC-073: a new key on the same host keeps the probe, because it describes the host and not the key', async () => {
    connect(USER, {
      url: 'https://d.example/api',
      apiKey: 'stored-key',
      lastSyncState: 'ok',
      capabilities: JSON.stringify(FULL_CAPS),
    });

    await svc.saveSettings(USER, 'https://d.example/', 'rotated-key', false, true, IP);

    expect(svc.getCredentials(USER)?.apiKey).toBe('rotated-key');
    expect(row()?.capabilities).toBe(JSON.stringify(FULL_CAPS));
    expect(row()?.last_sync_state).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// disconnect
// ---------------------------------------------------------------------------

describe('DawarichService disconnect', () => {
  it('DAWARICH-SVC-080: forgets the credential and says so in the audit log', () => {
    connect(USER);

    svc.disconnect(USER, '198.51.100.7');

    expect(row()).toBeUndefined();
    expect(svc.getConnection(USER).connected).toBe(false);
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: USER,
      action: 'dawarich.disconnected',
      ip: '198.51.100.7',
      details: {},
    });
  });

  it('DAWARICH-SVC-081: disconnecting something that was never connected is a no-op that still leaves a trail', () => {
    svc.disconnect(USER, null);

    expect(row()).toBeUndefined();
    expect(audit.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ ip: null }));
  });

  it('DAWARICH-SVC-082: only the calling user loses their connection', () => {
    const other = createUser(testDb).user.id;
    connect(USER);
    connect(other);

    svc.disconnect(USER, null);

    expect(row(other)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// testConnection
// ---------------------------------------------------------------------------

describe('DawarichService testConnection', () => {
  it('DAWARICH-SVC-090: nothing typed and nothing stored answers not_connected without touching the network', async () => {
    expect(await svc.testConnection(USER, undefined, undefined, false)).toEqual({
      connected: false,
      error: 'not_connected',
    });
    expect(client.probe).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-091: an address with no key anywhere is not_connected, not a probe with an empty bearer token', async () => {
    expect(await svc.testConnection(USER, HOST, '', false)).toEqual({
      connected: false,
      error: 'not_connected',
    });
    expect(client.probe).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-092: a key typed with no address falls back to the stored address', async () => {
    connect(USER, { apiKey: 'stored-key' });

    await svc.testConnection(USER, '', 'typed-key', false);

    expect(client.probe).toHaveBeenCalledWith({ baseUrl: HOST, apiKey: 'typed-key', allowInsecureTls: false });
  });

  it('DAWARICH-SVC-093: the mask means "use the stored key", which is what a form that only changed the TLS flag posts back', async () => {
    connect(USER, { apiKey: 'stored-key' });

    await svc.testConnection(USER, HOST, DAWARICH_KEY_MASK, true);

    expect(client.probe).toHaveBeenCalledWith({ baseUrl: HOST, apiKey: 'stored-key', allowInsecureTls: true });
  });

  it('DAWARICH-SVC-094: a stored connection tested as it stands persists the freshly probed capabilities', async () => {
    connect(USER, { apiKey: 'stored-key' });

    const out = await svc.testConnection(USER, HOST, undefined, false);

    expect(out.connected).toBe(true);
    expect(svc.getCapabilities(USER)).toEqual(out.capabilities);
  });

  it('DAWARICH-SVC-095: a test run against a different address than the stored one must not overwrite what is on file', async () => {
    connect(USER, { apiKey: 'stored-key', capabilities: JSON.stringify(FULL_CAPS) });

    await svc.testConnection(USER, 'https://someone-elses.example', 'their-key', false);

    expect(svc.getCapabilities(USER)).toEqual(FULL_CAPS);
  });

  it('DAWARICH-SVC-096: a test from a form with nothing stored yet writes no capabilities row', async () => {
    const out = await svc.testConnection(USER, HOST, 'typed-key', false);

    expect(out.connected).toBe(true);
    expect(row()).toBeUndefined();
  });

  it('DAWARICH-SVC-097: the visit count is the last 30 days, and it is only asked for when the visits endpoint exists', async () => {
    connect(USER, { apiKey: 'stored-key' });
    allEndpointsAnswer([visit({ id: 1 }), visit({ id: 2 }), visit({ id: 3 })]);

    const out = await svc.testConnection(USER, HOST, undefined, false);

    expect(out.visitCount).toBe(3);
    // Call 0 is the 24h capability probe; call 1 is the count the card shows.
    const [, from, to] = client.listVisits.mock.calls[1] as [unknown, Date, Date];
    expect(to.getTime() - from.getTime()).toBe(30 * DAY_MS);
  });

  it('DAWARICH-SVC-098: an instance without a visits endpoint reports zero rather than asking a route that is not there', async () => {
    connect(USER, { apiKey: 'stored-key' });
    client.listVisits.mockRejectedValue(notFound());

    const out = await svc.testConnection(USER, HOST, undefined, false);

    expect(out).toMatchObject({ connected: true, visitCount: 0 });
    expect(out.capabilities?.visits).toBe(false);
    expect(client.listVisits).toHaveBeenCalledTimes(1);
  });

  it('DAWARICH-SVC-099: a count that fails after the connection is already proven is not a failed connection', async () => {
    connect(USER, { apiKey: 'stored-key' });
    client.listVisits
      .mockResolvedValueOnce({ visits: [visit()], truncated: false, version: '1.14.4' })
      .mockRejectedValueOnce(new DawarichError('rate_limited', 'HTTP 429', 429));

    const out = await svc.testConnection(USER, HOST, undefined, false);

    expect(out).toMatchObject({ connected: true, visitCount: 0 });
  });

  it('DAWARICH-SVC-100: a rejected key is a 200 the form can render, carrying the code the client translates', async () => {
    connect(USER, { apiKey: 'stored-key' });
    client.probe.mockRejectedValue(new DawarichError('unauthorized', 'Dawarich answered HTTP 401', 401));

    const out = await svc.testConnection(USER, HOST, undefined, false);

    expect(out).toEqual({ connected: false, error: 'unauthorized' });
    expect(out).not.toHaveProperty('errorDetail');
  });

  it('DAWARICH-SVC-101: the free-text detail rides along when there is one, for the person debugging their own reverse proxy', async () => {
    connect(USER, { apiKey: 'stored-key' });
    client.probe.mockRejectedValue(
      new DawarichError('invalid_response', 'Not JSON', 200, '<html>login</html>'),
    );

    expect(await svc.testConnection(USER, HOST, undefined, false)).toEqual({
      connected: false,
      error: 'invalid_response',
      errorDetail: '<html>login</html>',
    });
  });

  it('DAWARICH-SVC-102: anything that is not a DawarichError reads as unreachable rather than leaking the message', async () => {
    connect(USER, { apiKey: 'stored-key' });
    client.probe.mockRejectedValue(new Error('ECONNRESET on https://dawarich.example?api_key=secret'));

    expect(await svc.testConnection(USER, HOST, undefined, false)).toEqual({
      connected: false,
      error: 'unreachable',
    });
  });

  it('DAWARICH-SVC-103: a failed probe leaves the stored capabilities untouched', async () => {
    connect(USER, { apiKey: 'stored-key', capabilities: JSON.stringify(FULL_CAPS) });
    client.probe.mockRejectedValue(new DawarichError('unauthorized', 'HTTP 401', 401));

    await svc.testConnection(USER, HOST, undefined, false);

    expect(svc.getCapabilities(USER)).toEqual(FULL_CAPS);
  });

  it('DAWARICH-SVC-104: a stored key that no longer decrypts is never dialled with, so the form hears "not connected" instead of a ciphertext going upstream as a bearer token', async () => {
    // The rotated-ENCRYPTION_KEY case reached from the outbound side rather than
    // through getCredentials: the row still reads as connected on the card, and
    // the test button has to say what is wrong without sending the blob anywhere.
    connect(USER, { apiKey: 'enc:v1:bm90LWEtcmVhbC1ibG9i' });

    expect(await svc.testConnection(USER, HOST, undefined, false)).toEqual({
      connected: false,
      error: 'not_connected',
    });
    expect(client.probe).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-105: a blank key field against a different host than the stored one is refused before anything is sent', async () => {
    // The form prefills the address and never the key, so "retype the URL and
    // press Test" is the ordinary way to move an instance. Falling back to the
    // stored key here would carry it to whatever host was just typed, which is
    // exactly what saveSettings refuses to persist.
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });

    const out = await svc.testConnection(USER, 'https://someone-elses.example', undefined, false);

    expect(out).toMatchObject({ connected: false, error: 'not_connected' });
    expect(out.errorDetail).toContain('https://old.example');
    expect(client.probe).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-106: the mask against a different host is a blank field, not a key', async () => {
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });

    const out = await svc.testConnection(USER, 'https://old.example:8443', DAWARICH_KEY_MASK, false);

    expect(out).toMatchObject({ connected: false, error: 'not_connected' });
    expect(client.probe).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-107: a path edit on the same origin still tests with the stored key', async () => {
    // The mirror of 105: the same instance under a corrected path is where the
    // key was issued, and refusing it would make every trailing-slash edit
    // demand the key again.
    connect(USER, { url: 'https://d.example/api', apiKey: 'stored-key' });

    const out = await svc.testConnection(USER, 'https://d.example/', undefined, false);

    expect(out.connected).toBe(true);
    expect(client.probe).toHaveBeenCalledWith({ baseUrl: 'https://d.example/', apiKey: 'stored-key', allowInsecureTls: false });
  });

  it('DAWARICH-SVC-108: a key typed for the new host is used as typed, so moving an instance and testing it first still works', async () => {
    connect(USER, { url: 'https://old.example', apiKey: 'stored-key' });

    const out = await svc.testConnection(USER, 'https://new.example', 'minted-for-new', false);

    expect(out.connected).toBe(true);
    expect(client.probe).toHaveBeenCalledWith({ baseUrl: 'https://new.example', apiKey: 'minted-for-new', allowInsecureTls: false });
  });
});

// ---------------------------------------------------------------------------
// probeCapabilities
// ---------------------------------------------------------------------------

describe('DawarichService probeCapabilities', () => {
  const CREDS = { baseUrl: HOST, apiKey: 'k', allowInsecureTls: false };

  it('DAWARICH-SVC-110: every endpoint answering means every capability is on, with the version the instance reported', async () => {
    const caps = await svc.probeCapabilities(CREDS);

    expect(caps).toMatchObject({
      visits: true,
      tracks: true,
      points: true,
      locations: true,
      visitedCities: true,
      serverVersion: '1.14.4',
    });
    expect(Number.isNaN(Date.parse(caps.probedAt))).toBe(false);
  });

  it('DAWARICH-SVC-111: an instance too old to send the version banner still connects, with a null version', async () => {
    client.probe.mockResolvedValue({ version: null });
    expect((await svc.probeCapabilities(CREDS)).serverVersion).toBeNull();
  });

  it('DAWARICH-SVC-112: the probe window is a single day, the same one for every endpoint it asks', async () => {
    await svc.probeCapabilities(CREDS);

    const [, visitsFrom, visitsTo] = client.listVisits.mock.calls[0] as [unknown, Date, Date];
    const [, tracksFrom, tracksTo] = client.listTracks.mock.calls[0] as [unknown, Date, Date];

    expect(visitsTo.getTime() - visitsFrom.getTime()).toBe(DAY_MS);
    expect(tracksFrom.getTime()).toBe(visitsFrom.getTime());
    expect(tracksTo.getTime()).toBe(visitsTo.getTime());
  });

  it('DAWARICH-SVC-113: the locations probe asks about a coordinate no recording will ever be near, because it is about the route answering', async () => {
    await svc.probeCapabilities(CREDS);
    expect(client.findVisitsNear).toHaveBeenCalledWith(CREDS, 0, 0, 50, 1);
  });

  it.each(endpointCases)(
    'DAWARICH-SVC-114: a 404 from %s turns off only %s, so an older Dawarich still connects',
    async (method, capability) => {
      client[method].mockRejectedValue(notFound());

      const caps = await svc.probeCapabilities(CREDS);

      expect(caps[capability]).toBe(false);
      const others = PROBED_CAPABILITIES.filter((c) => c !== capability);
      for (const other of others) expect(caps[other]).toBe(true);
    },
  );

  it('DAWARICH-SVC-115: a rejected key during the probe propagates, because "connected, but nothing works" is the worse answer', async () => {
    client.listTracks.mockRejectedValue(new DawarichError('unauthorized', 'HTTP 401', 401));
    await expect(svc.probeCapabilities(CREDS)).rejects.toBeInstanceOf(DawarichError);
  });

  it('DAWARICH-SVC-116: a plain transport failure during the probe propagates too', async () => {
    client.listPoints.mockRejectedValue(new Error('socket hang up'));
    await expect(svc.probeCapabilities(CREDS)).rejects.toThrow('socket hang up');
  });

  it('DAWARICH-SVC-117: a failing authentication check fails the whole probe, before any endpoint is asked', async () => {
    client.probe.mockRejectedValue(new DawarichError('unauthorized', 'HTTP 401', 401));

    await expect(svc.probeCapabilities(CREDS)).rejects.toBeInstanceOf(DawarichError);
    expect(client.listVisits).not.toHaveBeenCalled();
  });

  it('DAWARICH-SVC-118: no visit inside the probe window means the two field capabilities read as "not seen", not as "absent"', async () => {
    const caps = await svc.probeCapabilities(CREDS);
    expect(caps.visitUpdatedAt).toBe(false);
    expect(caps.visitCountryCode).toBe(false);
  });

  it('DAWARICH-SVC-119: with no visits endpoint at all there is no row to sample, and both field capabilities stay off', async () => {
    client.listVisits.mockRejectedValue(notFound());

    const caps = await svc.probeCapabilities(CREDS);

    expect(caps).toMatchObject({ visits: false, visitUpdatedAt: false, visitCountryCode: false });
  });

  it('DAWARICH-SVC-120: a sampled visit that carries updated_at lights the capability up on its own', async () => {
    allEndpointsAnswer([visit({ updated_at: '2026-09-11T08:00:00Z' })]);
    expect((await svc.probeCapabilities(CREDS)).visitUpdatedAt).toBe(true);
  });

  it.each(updatedAtAbsentCases)('DAWARICH-SVC-121: an %s updated_at reads as absent', async (_label, over) => {
    allEndpointsAnswer([visit(over)]);
    expect((await svc.probeCapabilities(CREDS)).visitUpdatedAt).toBe(false);
  });

  it('DAWARICH-SVC-122: a sampled place carrying a country code lights that capability up', async () => {
    allEndpointsAnswer([visit({ place: { latitude: 1, longitude: 2, id: 3, country_code: 'DE' } })]);
    expect((await svc.probeCapabilities(CREDS)).visitCountryCode).toBe(true);
  });

  it.each(countryCodeAbsentCases)('DAWARICH-SVC-123: %s reads as no country code', async (_label, over) => {
    allEndpointsAnswer([visit(over)]);
    expect((await svc.probeCapabilities(CREDS)).visitCountryCode).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// storeCapabilities / recordSyncResult: the two columns the card reads back
// ---------------------------------------------------------------------------

describe('DawarichService storeCapabilities', () => {
  it('DAWARICH-SVC-130: writes the probe where getCapabilities reads it', () => {
    connect(USER);

    svc.storeCapabilities(USER, FULL_CAPS);

    expect(svc.getCapabilities(USER)).toEqual(FULL_CAPS);
    expect(JSON.parse(row()?.capabilities ?? 'null')).toEqual(FULL_CAPS);
  });

  it('DAWARICH-SVC-131: storing against a user with no connection changes nothing instead of creating a row without a credential', () => {
    svc.storeCapabilities(USER, FULL_CAPS);
    expect(row()).toBeUndefined();
  });

  it('DAWARICH-SVC-132: only the named user is touched', () => {
    const other = createUser(testDb).user.id;
    connect(USER);
    connect(other);

    svc.storeCapabilities(USER, FULL_CAPS);

    expect(row(other)?.capabilities).toBeNull();
  });
});

describe('DawarichService recordSyncResult', () => {
  it('DAWARICH-SVC-140: a failure is stored with its reason and a timestamp the card can show', () => {
    connect(USER);
    const before = Date.now();

    svc.recordSyncResult(USER, 'failed', 'unreachable');

    const out = svc.getConnection(USER);
    expect(out.lastSyncState).toBe('failed');
    expect(out.lastSyncError).toBe('unreachable');
    expect(Date.parse(out.lastSyncAt ?? '')).toBeGreaterThanOrEqual(before - 1000);
  });

  it('DAWARICH-SVC-141: a later success clears the error rather than leaving the old one on screen', () => {
    connect(USER, { lastSyncState: 'failed', lastSyncError: 'unreachable' });

    svc.recordSyncResult(USER, 'ok', null);

    expect(svc.getConnection(USER)).toMatchObject({ lastSyncState: 'ok', lastSyncError: null });
  });

  it('DAWARICH-SVC-142: a partial run is its own state, distinct from both ok and failed', () => {
    connect(USER);
    svc.recordSyncResult(USER, 'partial', 'too_large');
    expect(svc.getConnection(USER).lastSyncState).toBe('partial');
  });

  it('DAWARICH-SVC-143: recording against a user with no connection changes nothing', () => {
    svc.recordSyncResult(USER, 'ok', null);
    expect(row()).toBeUndefined();
  });
});
