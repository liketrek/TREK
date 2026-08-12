/**
 * Unit tests for MCP place tools: create_place, update_place, delete_place, search_place.
 * (list_categories moved to tools-categories.test.ts with the CategoriesMcp migration.)
 *
 * Since the place DI fold these run through the decorator-driven PlacesMcp in
 * src/nest/places/places.mcp.ts — the harness attaches it via the hand-wired
 * registry in tests/helpers/mcp-test-controllers.ts, so the assertions below
 * exercise the @Tool/@ResourceTemplate path instead of the deleted registrar.
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
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
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

const { searchPlacesMock } = vi.hoisted(() => ({ searchPlacesMock: vi.fn() }));
// PlacesMcp and PlacesService both inject MapsService (search_place and the
// import enrichment), so the geo calls are stubbed on the prototype — see
// beforeEach — rather than through a module mock.

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createPlace, createDay, createDayAssignment, createJourney } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { PlacesService } from '../../../src/nest/places/places.service';

/** Link a journey to a trip so journey-skeleton sync has a target. */
function linkJourney(journeyId: number, tripId: number) {
  testDb.prepare('INSERT INTO journey_trips (journey_id, trip_id, added_at) VALUES (?, ?, ?)').run(journeyId, tripId, Date.now());
}
function skeletonFor(journeyId: number, placeId: number) {
  return testDb.prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?').get(journeyId, placeId) as any;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  searchPlacesMock.mockClear();
  vi.spyOn(MapsService.prototype, 'searchPlaces').mockImplementation(searchPlacesMock as never);
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// create_place
// ---------------------------------------------------------------------------

describe('Tool: create_place', () => {
  it('creates a place with all fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = testDb.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number };

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_place',
        arguments: {
          tripId: trip.id,
          name: 'Eiffel Tower',
          lat: 48.8584,
          lng: 2.2945,
          address: 'Champ de Mars, Paris',
          category_id: cat.id,
          notes: 'Must visit',
          website: 'https://toureiffel.paris',
          phone: '+33 892 70 12 39',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.place.name).toBe('Eiffel Tower');
      expect(data.place.lat).toBeCloseTo(48.8584);
      expect(data.place.category_id).toBe(cat.id);
    });
  });

  it('creates a place with minimal fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_place',
        arguments: { tripId: trip.id, name: 'Mystery Spot' },
      });
      const data = parseToolResult(result) as any;
      expect(data.place.name).toBe('Mystery Spot');
      expect(data.place.trip_id).toBe(trip.id);
    });
  });

  it('broadcasts place:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_place', arguments: { tripId: trip.id, name: 'Cafe' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_place', arguments: { tripId: trip.id, name: 'Hack' } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_place', arguments: { tripId: trip.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_place
// ---------------------------------------------------------------------------

describe('Tool: update_place', () => {
  it('updates specific fields and preserves others', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Old Name' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_place',
        arguments: { tripId: trip.id, placeId: place.id, name: 'New Name' },
      });
      const data = parseToolResult(result) as any;
      expect(data.place.name).toBe('New Name');
      // lat/lng preserved from original
      expect(data.place.lat).toBeCloseTo(place.lat ?? 48.8566);
    });
  });

  it('broadcasts place:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_place', arguments: { tripId: trip.id, placeId: place.id, name: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:updated', expect.any(Object));
    });
  });

  it('returns error for place not found in trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_place', arguments: { tripId: trip.id, placeId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_place', arguments: { tripId: trip.id, placeId: place.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// bulk_update_places
// ---------------------------------------------------------------------------

describe('Tool: bulk_update_places', () => {
  it('applies the same field to many places in one call', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' });
    const b = createPlace(testDb, trip.id, { name: 'B' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_update_places',
        arguments: { tripId: trip.id, placeIds: [a.id, b.id], transport_mode: 'walking' },
      });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(2);
      expect([...data.updatedIds].sort()).toEqual([a.id, b.id].sort());
      expect(data.skipped).toBe(0);
    });
  });

  it('broadcasts place:updated for each updated place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id);
    const b = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      broadcastMock.mockClear();
      await h.client.callTool({ name: 'bulk_update_places', arguments: { tripId: trip.id, placeIds: [a.id, b.id], notes: 'seen' } });
      const updates = broadcastMock.mock.calls.filter((c) => c[1] === 'place:updated');
      expect(updates).toHaveLength(2);
    });
  });

  it('errors when no update fields are provided', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'bulk_update_places', arguments: { tripId: trip.id, placeIds: [a.id] } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'bulk_update_places', arguments: { tripId: trip.id, placeIds: [place.id], notes: 'x' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_place
// ---------------------------------------------------------------------------

describe('Tool: delete_place', () => {
  it('deletes an existing place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: place.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(place.id)).toBeUndefined();
    });
  });

  it('takes the linked expense with it and announces that too (#1298)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const itemId = Number(testDb
      .prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'Tickets', 34, ?)")
      .run(trip.id, place.id).lastInsertRowid);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: place.id } });
      expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(itemId)).toBeUndefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:deleted', expect.objectContaining({ itemId }));
    });
  });

  it('broadcasts place:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: place.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:deleted', expect.any(Object));
    });
  });

  it('returns error for place not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: place.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('removes the linked journey skeleton when the place is deleted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, day.id, place.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, trip.id);
    // Materialise the skeleton for the assigned place.
    testDb.prepare(
      `INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, entry_date, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'skeleton', ?, ?, 0, ?, ?)`,
    ).run(journey.id, trip.id, place.id, user.id, place.name, '2026-05-01', Date.now(), Date.now());
    expect(skeletonFor(journey.id, place.id)).toBeDefined();

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: place.id } });
      expect(skeletonFor(journey.id, place.id)).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// create_and_assign_place
// ---------------------------------------------------------------------------

describe('Tool: create_and_assign_place', () => {
  it('creates a skeleton suggestion in a linked journey', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      const result = parseToolResult(
        await h.client.callTool({ name: 'create_and_assign_place', arguments: { tripId: trip.id, dayId: day.id, name: 'Fresh POI' } }),
      ) as any;
      const skeleton = skeletonFor(journey.id, result.place.id);
      expect(skeleton).toBeDefined();
      expect(skeleton.type).toBe('skeleton');
      expect(skeleton.title).toBe('Fresh POI');
    });
  });
});

// ---------------------------------------------------------------------------
// search_place
// ---------------------------------------------------------------------------

describe('Tool: search_place', () => {
  it('returns OSM results when no Google key is configured', async () => {
    const { user } = createUser(testDb);
    searchPlacesMock.mockResolvedValue({
      source: 'openstreetmap',
      places: [
        { osm_id: 'node:12345', name: 'Eiffel Tower', address: 'Eiffel Tower, Paris, France', lat: 48.8584, lng: 2.2945 },
      ],
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_place', arguments: { query: 'Eiffel Tower' } });
      const data = parseToolResult(result) as any;
      expect(searchPlacesMock).toHaveBeenCalledWith(user.id, 'Eiffel Tower');
      expect(data.places).toHaveLength(1);
      expect(data.places[0].osm_id).toBe('node:12345');
      expect(data.places[0].name).toBe('Eiffel Tower');
      expect(data.places[0].lat).toBeCloseTo(48.8584);
    });
  });

  it('returns google_place_id when Google Maps is configured', async () => {
    const { user } = createUser(testDb);
    searchPlacesMock.mockResolvedValue({
      source: 'google',
      places: [
        { google_place_id: 'ChIJD3uTd9hx5kcR1IQvGfr8dbk', name: 'Eiffel Tower', address: 'Champ de Mars, Paris', lat: 48.8584, lng: 2.2945, rating: 4.7, website: 'https://toureiffel.paris', phone: null },
      ],
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_place', arguments: { query: 'Eiffel Tower' } });
      const data = parseToolResult(result) as any;
      expect(searchPlacesMock).toHaveBeenCalledWith(user.id, 'Eiffel Tower');
      expect(data.places).toHaveLength(1);
      expect(data.places[0].google_place_id).toBe('ChIJD3uTd9hx5kcR1IQvGfr8dbk');
      expect(data.places[0].name).toBe('Eiffel Tower');
      expect(data.places[0].rating).toBe(4.7);
    });
  });

  it('returns error when place search fails', async () => {
    const { user } = createUser(testDb);
    searchPlacesMock.mockRejectedValue(new Error('Search failed'));

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_place', arguments: { query: 'something' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_places
// ---------------------------------------------------------------------------

describe('Tool: list_places', () => {
  it('returns all places by default', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place1 = createPlace(testDb, trip.id, { name: 'Orphan Place' });
    const place2 = createPlace(testDb, trip.id, { name: 'Assigned Place' });
    const day = createDay(testDb, trip.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (?, ?)').run(day.id, place2.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.places).toHaveLength(2);
    });
  });

  it('returns only unassigned places with assignment=unassigned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const orphan = createPlace(testDb, trip.id, { name: 'Orphan Place' });
    const assigned = createPlace(testDb, trip.id, { name: 'Assigned Place' });
    const day = createDay(testDb, trip.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (?, ?)').run(day.id, assigned.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id, assignment: 'unassigned' } });
      const data = parseToolResult(result) as any;
      expect(data.places).toHaveLength(1);
      expect(data.places[0].name).toBe('Orphan Place');
    });
  });

  it('returns only assigned places with assignment=assigned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const orphan = createPlace(testDb, trip.id, { name: 'Orphan Place' });
    const assigned = createPlace(testDb, trip.id, { name: 'Assigned Place' });
    const day = createDay(testDb, trip.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (?, ?)').run(day.id, assigned.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id, assignment: 'assigned' } });
      const data = parseToolResult(result) as any;
      expect(data.places).toHaveLength(1);
      expect(data.places[0].name).toBe('Assigned Place');
    });
  });

  it('returns empty array when all places are assigned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Only Place' });
    const day = createDay(testDb, trip.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (?, ?)').run(day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id, assignment: 'unassigned' } });
      const data = parseToolResult(result) as any;
      expect(data.places).toHaveLength(0);
    });
  });

  it('composes with search filter', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const orphan = createPlace(testDb, trip.id, { name: 'Louvre Museum' });
    const assigned = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const day = createDay(testDb, trip.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (?, ?)').run(day.id, assigned.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id, assignment: 'unassigned', search: 'Louvre' } });
      const data = parseToolResult(result) as any;
      expect(data.places).toHaveLength(1);
      expect(data.places[0].name).toBe('Louvre Museum');
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_places', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// rate_place (#1435)
// ---------------------------------------------------------------------------

describe('Tool: rate_place', () => {
  it('stores the acting user\'s vote and reports the aggregate', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Rated' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'rate_place', arguments: { tripId: trip.id, placeId: place.id, rating: 4 } });
      const data = parseToolResult(result) as any;
      expect(data.place.id).toBe(place.id);
      const rows = testDb.prepare('SELECT user_id, rating FROM place_ratings WHERE place_id = ?').all(place.id);
      expect(rows).toEqual([{ user_id: user.id, rating: 4 }]);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:updated', expect.any(Object));
    });
  });

  it('an omitted rating clears the vote', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Rated' });

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'rate_place', arguments: { tripId: trip.id, placeId: place.id, rating: 5 } });
      const result = await h.client.callTool({ name: 'rate_place', arguments: { tripId: trip.id, placeId: place.id } });
      const data = parseToolResult(result) as any;
      expect(data.place.id).toBe(place.id);
      const rows = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
      expect(rows.n).toBe(0);
    });
  });

  it('returns error for a place outside the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, other.id, { name: 'Elsewhere' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'rate_place', arguments: { tripId: trip.id, placeId: place.id, rating: 3 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// bulk_delete_places
// ---------------------------------------------------------------------------

describe('Tool: bulk_delete_places', () => {
  it('deletes the trip-scoped ids, skips foreign ones and broadcasts each', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' });
    const b = createPlace(testDb, trip.id, { name: 'B' });
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_delete_places',
        arguments: { tripId: trip.id, placeIds: [a.id, b.id, foreign.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(2);
      expect(data.deleted.sort()).toEqual([a.id, b.id].sort());
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:deleted', { placeId: a.id, _source: 'mcp' });
      // The other trip's place survives.
      expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(foreign.id)).toBeTruthy();
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const place = createPlace(testDb, trip.id, { name: 'Theirs' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'bulk_delete_places', arguments: { tripId: trip.id, placeIds: [place.id] } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/places resource (moved from resources.test.ts)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/places', () => {
  it('returns all places for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/places` });
      const places = parseResourceResult(result) as any[];
      expect(places).toHaveLength(2);
      const names = places.map((p) => p.name);
      expect(names).toContain('Eiffel Tower');
      expect(names).toContain('Louvre');
    });
  });

  // The ?assignment= filter the description advertises is read off
  // uri.searchParams inside the handler, but the SDK's template matcher rejects
  // a URI carrying a query string before the handler runs — same as the legacy
  // resource this was moved from, so it stays untested here.

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/places` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// import_places_from_url
// ---------------------------------------------------------------------------

describe('Tool: import_places_from_url', () => {
  it('imports a google list, broadcasts each place and reports the count', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const spy = vi.spyOn(PlacesService.prototype, 'importGoogleList').mockResolvedValue({
      places: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] as never,
      listName: 'Weekend',
      skipped: 3,
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_places_from_url',
        arguments: { tripId: trip.id, url: 'https://maps.app.goo.gl/x', source: 'google-list' },
      });
      const data = parseToolResult(result) as any;
      expect(data).toMatchObject({ count: 2, listName: 'Weekend', skipped: 3 });
      expect(spy).toHaveBeenCalledWith(String(trip.id), 'https://maps.app.goo.gl/x');
      expect(broadcastMock).toHaveBeenCalledTimes(2);
    });
    spy.mockRestore();
  });

  it('surfaces the naver importer\'s { error, status } as a tool error', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const spy = vi.spyOn(PlacesService.prototype, 'importNaverList').mockResolvedValue({ error: 'List is empty or could not be read', status: 400 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_places_from_url',
        arguments: { tripId: trip.id, url: 'https://naver.me/x', source: 'naver-list' },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toBe('List is empty or could not be read');
    });
    spy.mockRestore();
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'import_places_from_url',
        arguments: { tripId: trip.id, url: 'https://maps.app.goo.gl/x', source: 'google-list' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_and_assign_place failure path
// ---------------------------------------------------------------------------

describe('Tool: create_and_assign_place (failure paths)', () => {
  it('reports a missing day without writing the place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_and_assign_place',
        arguments: { tripId: trip.id, dayId: 99999, name: 'Nowhere' },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toBe('Day not found.');
      expect(testDb.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id)).toEqual({ n: 0 });
    });
  });

  it('rolls the transaction back and reports failure when the place write throws', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const spy = vi.spyOn(PlacesService.prototype, 'create').mockImplementation(() => { throw new Error('db exploded'); });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_and_assign_place',
        arguments: { tripId: trip.id, dayId: day.id, name: 'Doomed' },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toBe('Failed to create place and assignment.');
      expect(testDb.prepare('SELECT COUNT(*) AS n FROM day_assignments WHERE day_id = ?').get(day.id)).toEqual({ n: 0 });
    });
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Journey-hook scoping + ordering on the delete paths (#1745)
// ---------------------------------------------------------------------------

/** Materialise a skeleton entry for an assigned place (same shape the sync writes). */
function seedSkeleton(journeyId: number, tripId: number, placeId: number, userId: number, name: string) {
  testDb.prepare(
    `INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, entry_date, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'skeleton', ?, ?, 0, ?, ?)`,
  ).run(journeyId, tripId, placeId, userId, name, '2026-05-01', Date.now(), Date.now());
}

describe('journey hooks on the MCP delete paths', () => {
  it("delete_place leaves a foreign trip's journey skeleton alone", async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, other.id);
    const foreign = createPlace(testDb, other.id, { name: 'Theirs' });
    const day = createDay(testDb, other.id);
    createDayAssignment(testDb, day.id, foreign.id);
    seedSkeleton(journey.id, other.id, foreign.id, user.id, 'Theirs');
    expect(skeletonFor(journey.id, foreign.id)).toBeDefined();

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_place', arguments: { tripId: trip.id, placeId: foreign.id } });
      expect(result.isError).toBe(true);
    });

    // The other trip's skeleton entry still points at its place, and the row lives.
    expect(skeletonFor(journey.id, foreign.id)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(foreign.id)).toBeDefined();
  });

  // Without the ordering fix the hook ran AFTER the DELETE, by which point
  // journey_entries.source_place_id was already NULL (ON DELETE SET NULL) — so
  // the entry survived as an orphan instead of being removed. Asserting on the
  // entry count, not on source_place_id, is what tells the two apart.
  it('bulk_delete_places detaches the skeletons before the rows go', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Doomed' });
    const day = createDay(testDb, trip.id);
    createDayAssignment(testDb, day.id, place.id);
    seedSkeleton(journey.id, trip.id, place.id, user.id, 'Doomed');
    expect(skeletonFor(journey.id, place.id)).toBeDefined();

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'bulk_delete_places', arguments: { tripId: trip.id, placeIds: [place.id] } });
      expect((parseToolResult(result) as any).count).toBe(1);
    });

    // The hook ran while the row still existed, so the entry is gone — not
    // lingering with a NULL source_place_id.
    expect(skeletonFor(journey.id, place.id)).toBeUndefined();
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM journey_entries WHERE journey_id = ?').get(journey.id)).toEqual({ n: 0 });
  });

  // The MCP bulk path already scoped correctly (it looped over removeMany's
  // trip-scoped result), so this is a guard against the scoping regressing when
  // the hook moved ahead of the delete — not a fix for a live bug.
  it('bulk_delete_places leaves a foreign trip\'s skeleton alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, other.id);
    const foreign = createPlace(testDb, other.id, { name: 'Theirs' });
    const day = createDay(testDb, other.id);
    createDayAssignment(testDb, day.id, foreign.id);
    seedSkeleton(journey.id, other.id, foreign.id, user.id, 'Theirs');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'bulk_delete_places', arguments: { tripId: trip.id, placeIds: [foreign.id] } });
      expect((parseToolResult(result) as any).count).toBe(0);
    });

    expect(skeletonFor(journey.id, foreign.id)).toBeDefined();
  });
});
