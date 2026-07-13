import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number, userId: number) =>
      db
        .prepare(
          'SELECT t.id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: number, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

const { geocodeMock, planMock, broadcastMock, notifyBookingChangeMock } = vi.hoisted(() => ({
  geocodeMock: vi.fn(),
  planMock: vi.fn(),
  broadcastMock: vi.fn(),
  notifyBookingChangeMock: vi.fn(),
}));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/services/transitService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/transitService')>()),
  geocode: geocodeMock,
  plan: planMock,
}));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));
vi.mock('../../../src/services/reservationService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/reservationService')>()),
  notifyBookingChange: notifyBookingChangeMock,
}));
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { createDay, createTrip, createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';

const from = { name: 'Namba', lat: 34.667, lng: 135.501 };
const to = { name: 'Umeda', lat: 34.702, lng: 135.496 };
const itinerary = {
  startTime: '2026-12-03T00:00:00Z',
  endTime: '2026-12-03T00:30:00Z',
  duration: 1800,
  transfers: 0,
  walkSeconds: 300,
  legs: [
    {
      mode: 'WALK',
      from: { ...from, name: 'START', time: '2026-12-03T00:00:00Z', scheduledTime: null, track: null },
      to: { name: 'Namba Station', lat: 34.666, lng: 135.5, time: '2026-12-03T00:05:00Z', scheduledTime: null, track: null },
      duration: 300,
      distance: 300,
      headsign: null,
      line: null,
      lineColor: null,
      lineTextColor: null,
      agency: null,
      intermediateStops: 0,
      geometry: null,
      geometryPrecision: 6,
    },
    {
      mode: 'SUBWAY',
      from: { name: 'Namba Station', lat: 34.666, lng: 135.5, time: '2026-12-03T00:05:00Z', scheduledTime: null, track: '1' },
      to: { ...to, name: 'END', time: '2026-12-03T00:30:00Z', scheduledTime: null, track: '2' },
      duration: 1500,
      distance: 5000,
      headsign: 'Umeda',
      line: 'M',
      lineColor: '#E5171F',
      lineTextColor: '#FFFFFF',
      agency: 'Osaka Metro',
      intermediateStops: 3,
      geometry: 'encoded',
      geometryPrecision: 6,
    },
  ],
};

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  geocodeMock.mockReset();
  planMock.mockReset();
  broadcastMock.mockReset();
  notifyBookingChangeMock.mockReset();
  delete process.env.DEMO_MODE;
});

afterAll(() => testDb.close());

async function withHarness(userId: number, scopes: string[] | null, fn: (harness: McpHarness) => Promise<void>) {
  const harness = await createMcpHarness({ userId, scopes, withResources: false });
  try {
    await fn(harness);
  } finally {
    await harness.cleanup();
  }
}

describe('MCP transit tools', () => {
  it('registers search tools for geo scope and create tool for reservations scope', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, ['geo:read'], async (harness) => {
      const names = (await harness.client.listTools()).tools.map((tool) => tool.name);
      expect(names).toContain('search_transit_stops');
      expect(names).toContain('search_transit_routes');
      expect(names).not.toContain('create_transit_journey');
    });
    await withHarness(user.id, ['reservations:write'], async (harness) => {
      const names = (await harness.client.listTools()).tools.map((tool) => tool.name);
      expect(names).toContain('create_transit_journey');
      expect(names).not.toContain('search_transit_routes');
    });
  });

  it('forwards stop and route searches and replaces provider endpoint names', async () => {
    const { user } = createUser(testDb);
    geocodeMock.mockResolvedValue({ results: [from] });
    planMock.mockResolvedValue({ itineraries: [itinerary] });
    await withHarness(user.id, ['geo:read'], async (harness) => {
      const stops = parseToolResult(await harness.client.callTool({
        name: 'search_transit_stops',
        arguments: { query: 'Namba', language: 'ja', near: { lat: 34.67, lng: 135.5 } },
      })) as any;
      expect(stops.results[0].name).toBe('Namba');
      expect(geocodeMock).toHaveBeenCalledWith('Namba', 'ja', '34.67,135.5');

      const routes = parseToolResult(await harness.client.callTool({
        name: 'search_transit_routes',
        arguments: { from, to, time: '2026-12-03T09:00:00+09:00', modes: ['SUBWAY'] },
      })) as any;
      expect(routes.itineraries[0].legs[0].from.name).toBe('Namba');
      expect(routes.itineraries[0].legs[1].to.name).toBe('Umeda');
      expect(planMock).toHaveBeenCalledWith(expect.objectContaining({ modes: 'SUBWAY' }));
    });
  });

  it('persists a selected itinerary with local dates, endpoints, and transit metadata', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-12-03', end_date: '2026-12-04' });
    const day = testDb.prepare('SELECT * FROM days WHERE trip_id = ? AND date = ?').get(trip.id, '2026-12-03') as any;
    await withHarness(user.id, ['reservations:write'], async (harness) => {
      const result = parseToolResult(await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: trip.id, dayId: day.id, from, to, itinerary },
      })) as any;
      expect(result.reservation.type).toBe('transit');
      expect(result.reservation.status).toBe('confirmed');
      expect(result.reservation.reservation_time).toBe('2026-12-03T09:00');
      expect(result.reservation.endpoints).toHaveLength(2);
      expect(result.reservation.endpoints[0].timezone).toBe('Asia/Tokyo');
      const metadata = JSON.parse(result.reservation.metadata);
      expect(metadata.transit.provider).toBe('transitous');
      expect(metadata.transit.duration).toBe(1800);
      expect(metadata.transit.walk_seconds).toBe(300);
      expect(metadata.transit.legs[1].line_color).toBe('#E5171F');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:created', expect.anything());
      expect(notifyBookingChangeMock).toHaveBeenCalledWith(
        trip.id,
        user.id,
        'Namba → Umeda',
        'transit',
      );
    });
  });

  it('rejects dateless, mismatched, and out-of-range journey dates', async () => {
    const { user } = createUser(testDb);
    const datelessTrip = createTrip(testDb, user.id);
    const datelessDay = createDay(testDb, datelessTrip.id);
    const datedTrip = createTrip(testDb, user.id, { start_date: '2026-12-02', end_date: '2026-12-03' });
    const datedDay = testDb.prepare('SELECT * FROM days WHERE trip_id = ? AND date = ?').get(datedTrip.id, '2026-12-02') as any;
    await withHarness(user.id, ['reservations:write'], async (harness) => {
      const dateless = await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: datelessTrip.id, dayId: datelessDay.id, from, to, itinerary },
      });
      expect(dateless.isError).toBe(true);
      expect((dateless.content[0] as any).text).toContain('dated trip day');

      const mismatch = await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: datedTrip.id, dayId: datedDay.id, from, to, itinerary },
      });
      expect(mismatch.isError).toBe(true);
      expect((mismatch.content[0] as any).text).toContain('departs on 2026-12-03');

      const nextDayItinerary = { ...itinerary, endTime: '2026-12-04T00:30:00Z' };
      const startDay = testDb.prepare('SELECT * FROM days WHERE trip_id = ? AND date = ?').get(datedTrip.id, '2026-12-03') as any;
      const outside = await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: datedTrip.id, dayId: startDay.id, from, to, itinerary: nextDayItinerary },
      });
      expect(outside.isError).toBe(true);
      expect((outside.content[0] as any).text).toContain('No trip day exists');
    });
  });

  it('rejects malformed provider data before persistence', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-12-03', end_date: '2026-12-03' });
    const day = testDb.prepare('SELECT * FROM days WHERE trip_id = ?').get(trip.id) as any;
    const allWalk = { ...itinerary, legs: [itinerary.legs[0]] };
    await withHarness(user.id, ['reservations:write'], async (harness) => {
      const result = await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: trip.id, dayId: day.id, from, to, itinerary: allWalk },
      });
      expect(result.isError).toBe(true);
      expect(testDb.prepare("SELECT COUNT(*) AS count FROM reservations WHERE type = 'transit'").get()).toEqual({ count: 0 });

      const wrongDestination = {
        ...itinerary,
        legs: itinerary.legs.map((leg, index) => index === itinerary.legs.length - 1
          ? { ...leg, to: { ...leg.to, lat: 35.0 } }
          : leg),
      };
      const mismatch = await harness.client.callTool({
        name: 'create_transit_journey',
        arguments: { tripId: trip.id, dayId: day.id, from, to, itinerary: wrongDestination },
      });
      expect(mismatch.isError).toBe(true);
      expect((mismatch.content[0] as any).text).toContain('does not match');
      expect(testDb.prepare("SELECT COUNT(*) AS count FROM reservations WHERE type = 'transit'").get()).toEqual({ count: 0 });
    });
  });
});
