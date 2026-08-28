/**
 * Unit tests for the AirTrail import pair: AirtrailMcp.list_airtrail_flights
 * (mirrors GET /api/integrations/airtrail/flights) and
 * ReservationImportMcp.import_airtrail_flights (mirrors
 * POST /api/trips/:tripId/reservations/import/airtrail).
 *
 * The AirTrail instance is the only thing stubbed: the credentials are read out
 * of the real users row, the mapper and the dedupe run for real, and the
 * reservations land in the test DB.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { ADDON_IDS } from '../../../src/addons';
import { AirtrailClient, AirtrailRequestError, type AirtrailFlightRaw } from '../../../src/nest/integrations/airtrail.client';
import { AirtrailImportService } from '../../../src/nest/integrations/airtrail-import.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DatabaseService } from '../../../src/nest/database/database.service';

// The permissions cache is module-scoped, so a write through any instance is
// what the tool's own checkPermission call reads back.
const permissionsService = new PermissionsService(new DatabaseService(testDb));
const savePermissions = permissionsService.savePermissions.bind(permissionsService);

// The registry builds its own AirtrailClient per harness, so the stub goes on
// the prototype. Everything below listFlights (creds, mapper, dedupe) is real.
const listFlightsMock = vi.spyOn(AirtrailClient.prototype, 'listFlights');

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  listFlightsMock.mockReset();
  listFlightsMock.mockResolvedValue([]);
  delete process.env.DEMO_MODE;
  // resetTestDb leaves the addons table alone, and both tools are gated on the
  // airtrail addon, so every case restates the toggle it needs.
  setAddonEnabled(testDb, ADDON_IDS.AIRTRAIL, true);
  savePermissions({ reservation_edit: 'trip_member' });
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>, scopes: string[] | null = null) {
  const h = await createMcpHarness({ userId, withResources: false, scopes });
  try { await fn(h); } finally { await h.cleanup(); }
}

/** The stored connection, plaintext key: decrypt_api_key passes legacy plaintext straight through. */
function connectAirtrail(userId: number, url = 'https://airtrail.example.com') {
  testDb.prepare('UPDATE users SET airtrail_url = ?, airtrail_api_key = ? WHERE id = ?').run(url, 'plain-test-key', userId);
}

const ZRH = { id: 1, icao: 'LSZH', iata: 'ZRH', name: 'Zurich', lat: 47.458, lon: 8.548, tz: 'Europe/Zurich', country: 'CH' };
const FRA = { id: 2, icao: 'EDDF', iata: 'FRA', name: 'Frankfurt', lat: 50.033, lon: 8.571, tz: 'Europe/Berlin', country: 'DE' };
const JFK = { id: 3, icao: 'KJFK', iata: 'JFK', name: 'New York JFK', lat: 40.641, lon: -73.778, tz: 'America/New_York', country: 'US' };

function flight(overrides: Partial<AirtrailFlightRaw> & { id: number }): AirtrailFlightRaw {
  return {
    from: ZRH,
    to: FRA,
    date: '2026-09-10',
    datePrecision: 'day',
    departure: '2026-09-10T06:00:00Z',
    arrival: '2026-09-10T07:10:00Z',
    departureScheduled: null,
    arrivalScheduled: null,
    airline: { icao: 'DLH', iata: 'LH', name: 'Lufthansa' },
    flightNumber: 'LH1201',
    aircraft: { icao: 'A320' },
    aircraftReg: 'D-AIZA',
    note: null,
    seats: [{ userId: 'u1', guestName: null, seat: null, seatNumber: '14A', seatClass: 'economy' }],
    ...overrides,
  };
}

function reservationRows(tripId: number) {
  return testDb.prepare(
    'SELECT id, title, type, external_source, external_id, external_owner_user_id, sync_enabled, metadata FROM reservations WHERE trip_id = ? ORDER BY id',
  ).all(tripId) as {
    id: number; title: string; type: string; external_source: string | null; external_id: string | null;
    external_owner_user_id: number | null; sync_enabled: number | null; metadata: string | null;
  }[];
}

// ---------------------------------------------------------------------------
// list_airtrail_flights
// ---------------------------------------------------------------------------

describe('Tool: list_airtrail_flights', () => {
  it('returns the caller flights, normalized and oldest departure first', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    listFlightsMock.mockResolvedValue([
      flight({ id: 22, date: '2026-09-20', departure: '2026-09-20T06:00:00Z', flightNumber: 'LH400', from: FRA, to: JFK }),
      flight({ id: 11 }),
    ]);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.flights.map((f: any) => f.id)).toEqual(['11', '22']);
      expect(data.total).toBe(2);
      expect(data.truncated).toBe(false);
      expect(data.flights[0]).toMatchObject({
        id: '11', fromCode: 'ZRH', toCode: 'FRA', airline: 'Lufthansa', flightNumber: 'LH1201', seatClass: 'economy',
      });
    });

    // The stored connection is what reaches the client, so a tool can only ever
    // read the caller's own AirTrail account.
    expect(listFlightsMock).toHaveBeenCalledWith({
      baseUrl: 'https://airtrail.example.com', apiKey: 'plain-test-key', allowInsecureTls: false,
    });
  });

  it('narrows to a date window and keeps undated flights', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    listFlightsMock.mockResolvedValue([
      flight({ id: 1, date: '2026-08-01', departure: '2026-08-01T06:00:00Z' }),
      flight({ id: 2, date: '2026-09-10', departure: null }),
      flight({ id: 3, date: '2026-10-01', departure: '2026-10-01T06:00:00Z' }),
      flight({ id: 4, date: null, departure: null, arrival: null }),
      flight({ id: 5, date: null, departure: null, arrival: null }),
      flight({ id: 6 }),
      flight({ id: 7 }),
    ]);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_airtrail_flights',
        arguments: { from: '2026-09-01', to: '2026-09-30' },
      });
      const data = parseToolResult(result) as any;
      // Dated first in departure order (6 and 7 share an instant and keep their
      // input order), then the two that carry no date at all.
      expect(data.flights.map((f: any) => f.id)).toEqual(['2', '6', '7', '4', '5']);
      expect(data.total).toBe(5);
    });
  });

  it('falls back to its own wording when AirTrail fails without a message', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    listFlightsMock.mockRejectedValue(new Error(''));

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toBe('Could not load AirTrail flights');
    });
  });

  it('caps the result and says it was truncated', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    listFlightsMock.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => flight({ id: i + 1, departure: `2026-09-1${i}T06:00:00Z` })),
    );

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: { limit: 2 } });
      const data = parseToolResult(result) as any;
      expect(data.flights.map((f: any) => f.id)).toEqual(['1', '2']);
      expect(data.total).toBe(5);
      expect(data.truncated).toBe(true);
    });
  });

  it('reports an unconnected account instead of an empty list', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('AirTrail is not connected');
    });
    expect(listFlightsMock).not.toHaveBeenCalled();
  });

  it('passes an upstream failure through as the tool error', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    listFlightsMock.mockRejectedValue(new AirtrailRequestError('AirTrail list failed (HTTP 500)', 500));

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('AirTrail list failed (HTTP 500)');
    });
  });

  it('is hidden while the airtrail addon is off', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    setAddonEnabled(testDb, ADDON_IDS.AIRTRAIL, false);

    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).not.toContain('list_airtrail_flights');
      const result = await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('not found');
    });
  });

  it('rides reservations:read and is hidden from a token without it', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);

    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).toContain('list_airtrail_flights');
    }, ['reservations:read']);

    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).not.toContain('list_airtrail_flights');
    }, ['places:read']);
  });
});

// ---------------------------------------------------------------------------
// import_airtrail_flights
// ---------------------------------------------------------------------------

describe('Tool: import_airtrail_flights', () => {
  it('imports the listed flights as linked flight bookings', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    listFlightsMock.mockResolvedValue([flight({ id: 11 }), flight({ id: 12, flightNumber: 'LH1202' })]);

    await withHarness(user.id, async (h) => {
      // The ids the list tool hands back are exactly what the import tool takes.
      const listed = parseToolResult(await h.client.callTool({ name: 'list_airtrail_flights', arguments: {} })) as any;
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: listed.flights.map((f: any) => f.id) },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect([...data.imported].sort()).toEqual(['11', '12']);
      expect(data.skipped).toEqual([]);
    });

    const rows = reservationRows(trip.id);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      title: 'LH1201', type: 'flight', external_source: 'airtrail', external_id: '11',
      external_owner_user_id: user.id, sync_enabled: 1,
    });
    expect(broadcastMock).toHaveBeenCalledTimes(2);
    expect(broadcastMock.mock.calls[0][1]).toBe('reservation:created');
  });

  it('skips a flight that is already linked to the trip', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    listFlightsMock.mockResolvedValue([flight({ id: 11 })]);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'import_airtrail_flights', arguments: { tripId: trip.id, flightIds: ['11'] } });
      const again = await h.client.callTool({ name: 'import_airtrail_flights', arguments: { tripId: trip.id, flightIds: ['11'] } });
      const data = parseToolResult(again) as any;
      expect(data.imported).toEqual([]);
      expect(data.skipped).toEqual([{ flightId: '11', reason: 'already-imported' }]);
    });
    expect(reservationRows(trip.id)).toHaveLength(1);
  });

  it('joins a connection into one multi-leg booking detached from sync', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    listFlightsMock.mockResolvedValue([
      flight({ id: 11 }),
      flight({
        id: 12, from: FRA, to: JFK, flightNumber: 'LH400',
        departure: '2026-09-10T09:00:00Z', arrival: '2026-09-10T18:00:00Z',
      }),
    ]);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: ['11', '12'], connections: [['11', '12']] },
      });
      const data = parseToolResult(result) as any;
      expect(data.imported).toEqual(['11', '12']);
    });

    const rows = reservationRows(trip.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].sync_enabled).toBe(0);
    expect(JSON.parse(rows[0].metadata ?? '{}').airtrail_ids).toEqual(['11', '12']);
  });

  it('refuses a connection naming a flight that is not being imported', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    listFlightsMock.mockResolvedValue([flight({ id: 11 })]);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: ['11'], connections: [['11', '99']] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('flight 99');
    });
    expect(reservationRows(trip.id)).toHaveLength(0);
    expect(listFlightsMock).not.toHaveBeenCalled();
  });

  it('refuses more than fifty flights in one call', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: Array.from({ length: 51 }, (_, i) => String(i + 1)) },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('at most 50');
    });
    expect(reservationRows(trip.id)).toHaveLength(0);
    expect(listFlightsMock).not.toHaveBeenCalled();
  });

  it('reports an unconnected account', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: ['11'] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('AirTrail is not connected');
    });
    expect(reservationRows(trip.id)).toHaveLength(0);
  });

  it('falls back to its own wording when the import fails without a message', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    const importMock = vi.spyOn(AirtrailImportService.prototype, 'importAirtrailFlights')
      .mockRejectedValue(new Error(''));

    try {
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({
          name: 'import_airtrail_flights',
          arguments: { tripId: trip.id, flightIds: ['11'] },
        });
        expect(result.isError).toBe(true);
        expect((result.content as any)[0].text).toBe('AirTrail import failed');
      });
    } finally {
      // Nothing auto-restores spies in this config, so an escaped stub would
      // silently answer for every later case in the file.
      importMock.mockRestore();
    }
  });

  it('enforces demo, trip access and the reservation permission', async () => {
    const { user: owner } = createUser(testDb);
    const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
    const { user: stranger } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    addTripMember(testDb, trip.id, demo.id);
    addTripMember(testDb, trip.id, member.id);
    for (const u of [owner, demo, stranger, member]) connectAirtrail(u.id);
    listFlightsMock.mockResolvedValue([flight({ id: 11 })]);

    process.env.DEMO_MODE = 'true';
    await withHarness(demo.id, async (h) => {
      const result = await h.client.callTool({ name: 'import_airtrail_flights', arguments: { tripId: trip.id, flightIds: ['11'] } });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('demo mode');
    });
    delete process.env.DEMO_MODE;

    await withHarness(stranger.id, async (h) => {
      const result = await h.client.callTool({ name: 'import_airtrail_flights', arguments: { tripId: trip.id, flightIds: ['11'] } });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('access denied');
    });

    savePermissions({ reservation_edit: 'trip_owner' });
    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({ name: 'import_airtrail_flights', arguments: { tripId: trip.id, flightIds: ['11'] } });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('permission');
    });

    expect(reservationRows(trip.id)).toHaveLength(0);
    expect(broadcastMock).not.toHaveBeenCalled();
    expect(listFlightsMock).not.toHaveBeenCalled();
  });

  it('is hidden while the airtrail addon is off', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-10', end_date: '2026-09-12' });
    setAddonEnabled(testDb, ADDON_IDS.AIRTRAIL, false);

    await withHarness(user.id, async (h) => {
      const names = (await h.client.listTools()).tools.map(t => t.name);
      expect(names).not.toContain('import_airtrail_flights');
      const result = await h.client.callTool({
        name: 'import_airtrail_flights',
        arguments: { tripId: trip.id, flightIds: ['11'] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('not found');
    });
    expect(reservationRows(trip.id)).toHaveLength(0);
  });

  it('rides reservations:write and is hidden from a read-only token', async () => {
    const { user } = createUser(testDb);
    connectAirtrail(user.id);

    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).toContain('import_airtrail_flights');
    }, ['reservations:write']);

    await withHarness(user.id, async (h) => {
      expect((await h.client.listTools()).tools.map(t => t.name)).not.toContain('import_airtrail_flights');
    }, ['reservations:read']);
  });
});
