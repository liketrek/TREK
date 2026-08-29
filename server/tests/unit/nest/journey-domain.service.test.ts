/**
 * Unit tests for JourneyDomainService (JOURNEY-SVC-001 through JOURNEY-SVC-038).
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 */
import { db as dbConn } from '../../../src/db/database';
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import {
  createUser,
  createTrip,
  createJourney,
  createJourneyEntry,
  addJourneyContributor,
  createPlace,
  createDay,
  createDayAssignment,
  addTripPhoto,
} from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// -- DB setup -----------------------------------------------------------------

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
    // Mirror the real canAccessTrip semantics against the test DB (owner or member
    // → truthy access row, else undefined) so addTripToJourney's trip-access guard
    // behaves as in production. (Was an unused `() => null` stub before the guard existed.)
    canAccessTrip: (tripId: number | string, userId: number) =>
      db
        .prepare(
          'SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
        )
        .get(userId, tripId, userId),
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

const dbs = new DatabaseService(dbConn);
const svc = new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// -- Access control -----------------------------------------------------------

describe('canAccessJourney', () => {
  it('JOURNEY-SVC-001: returns journey for owner', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'My Journey' });

    const result = svc.canAccessJourney(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(journey.id);
    expect(result!.title).toBe('My Journey');
  });

  it('JOURNEY-SVC-002: returns journey for contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = svc.canAccessJourney(journey.id, contrib.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(journey.id);
  });

  it('JOURNEY-SVC-003: returns null for stranger', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = svc.canAccessJourney(journey.id, stranger.id);

    expect(result).toBeNull();
  });
});

describe('isOwner', () => {
  it('JOURNEY-SVC-004: returns true for owner', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect(svc.isOwner(journey.id, user.id)).toBe(true);
  });

  it('JOURNEY-SVC-005: returns false for contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    expect(svc.isOwner(journey.id, contrib.id)).toBe(false);
  });

  it('JOURNEY-SVC-006: returns false for stranger', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(svc.isOwner(journey.id, stranger.id)).toBe(false);
  });
});

describe('canEdit', () => {
  it('JOURNEY-SVC-007: owner can edit', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect(svc.canEdit(journey.id, user.id)).toBe(true);
  });

  it('JOURNEY-SVC-008: editor contributor can edit', () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    expect(svc.canEdit(journey.id, editor.id)).toBe(true);
  });

  it('JOURNEY-SVC-009: viewer contributor cannot edit', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    expect(svc.canEdit(journey.id, viewer.id)).toBe(false);
  });

  it('JOURNEY-SVC-010: stranger cannot edit', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(svc.canEdit(journey.id, stranger.id)).toBe(false);
  });
});

// -- Journey CRUD -------------------------------------------------------------

describe('listJourneys', () => {
  it('JOURNEY-SVC-011: returns owned journeys with counts', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Road Trip' });
    createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01', location_name: 'Paris' });
    createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-02', location_name: 'Lyon' });

    const result = svc.listJourneys(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Road Trip');
    expect(result[0].entry_count).toBe(2);
    expect(result[0].place_count).toBe(2);
  });

  it('JOURNEY-SVC-012: includes journeys where user is contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Shared Trip' });
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = svc.listJourneys(contrib.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Shared Trip');
  });

  it('JOURNEY-SVC-013: does not include other users journeys', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createJourney(testDb, owner.id, { title: 'Private' });

    const result = svc.listJourneys(other.id);

    expect(result).toHaveLength(0);
  });

  it('JOURNEY-SVC-013b: returns trip_date_min/max aggregated from linked trips', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Multi Trip' });
    const trip1 = createTrip(testDb, user.id, { title: 'Trip A', start_date: '2025-06-01', end_date: '2025-06-10' });
    const trip2 = createTrip(testDb, user.id, { title: 'Trip B', start_date: '2026-03-15', end_date: '2026-03-20' });
    svc.addTripToJourney(journey.id, trip1.id, user.id);
    svc.addTripToJourney(journey.id, trip2.id, user.id);

    const result = svc.listJourneys(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].trip_date_min).toBe('2025-06-01');
    expect(result[0].trip_date_max).toBe('2026-03-20');
  });
});

describe('createJourney (service)', () => {
  it('JOURNEY-SVC-014: creates journey with contributor record', () => {
    const { user } = createUser(testDb);

    const journey = svc.createJourney(user.id, { title: 'New Journey', subtitle: 'Subtitle' });

    expect(journey.title).toBe('New Journey');
    expect(journey.subtitle).toBe('Subtitle');
    expect(journey.user_id).toBe(user.id);
    expect(journey.status).toBe('active');

    // owner should be added as contributor
    const contrib = testDb
      .prepare('SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, user.id) as { role: string } | undefined;
    expect(contrib).toBeDefined();
    expect(contrib!.role).toBe('owner');
  });

  it('JOURNEY-SVC-015: links trips when trip_ids provided', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris 2026' });

    const journey = svc.createJourney(user.id, { title: 'Euro Trip', trip_ids: [trip.id] });

    const link = testDb
      .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
      .get(journey.id, trip.id);
    expect(link).toBeDefined();
  });
});

describe('getJourneyFull', () => {
  it('JOURNEY-SVC-016: returns full journey with entries, trips, contributors', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Full Journey' });
    createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Day 1',
      entry_date: '2026-03-01',
      story: 'Arrived!',
    });

    const result = svc.getJourneyFull(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Full Journey');
    expect(result!.entries).toHaveLength(1);
    expect(result!.entries[0].title).toBe('Day 1');
    expect(result!.contributors).toHaveLength(1);
    expect(result!.stats.entries).toBe(1);
  });

  it('JOURNEY-SVC-017: returns null for unauthorized user', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = svc.getJourneyFull(journey.id, stranger.id);

    expect(result).toBeNull();
  });
});

describe('updateJourney', () => {
  it('JOURNEY-SVC-018: owner can update title and subtitle', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Old Title' });

    const updated = svc.updateJourney(journey.id, user.id, { title: 'New Title', subtitle: 'New Sub' });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('New Title');
    expect(updated!.subtitle).toBe('New Sub');
  });

  it('JOURNEY-SVC-019: editor contributor cannot update journey settings (#732)', () => {
    // Post-#732: journey-level settings (title/cover/status) are owner-only.
    // Editors keep access to entries and photos, but not the journey shell.
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Original' });
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const updated = svc.updateJourney(journey.id, editor.id, { title: 'Edited' });

    expect(updated).toBeNull();
  });

  it('JOURNEY-SVC-020: viewer cannot update', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    const result = svc.updateJourney(journey.id, viewer.id, { title: 'Hacked' });

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-021: returns journey unchanged when no valid fields provided', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Same' });

    const result = svc.updateJourney(journey.id, user.id, {});

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Same');
  });

  it('JOURNEY-SVC-021b: accepts archived status', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'To Archive' });

    const result = svc.updateJourney(journey.id, user.id, { status: 'archived' });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('archived');
  });

  it('JOURNEY-SVC-021c: ignores invalid status value', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Stay Active' });

    const result = svc.updateJourney(journey.id, user.id, { status: 'bogus' });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
  });
});

describe('deleteJourney', () => {
  it('JOURNEY-SVC-022: owner can delete', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = svc.deleteJourney(journey.id, user.id);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT * FROM journeys WHERE id = ?').get(journey.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-023: non-owner cannot delete', () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = svc.deleteJourney(journey.id, editor.id);

    expect(result).toBe(false);
    const row = testDb.prepare('SELECT * FROM journeys WHERE id = ?').get(journey.id);
    expect(row).toBeDefined();
  });
});

// -- Trip management ----------------------------------------------------------

describe('addTripToJourney / removeTripFromJourney', () => {
  it('JOURNEY-SVC-024: links a trip to a journey', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Linked Trip' });

    const result = svc.addTripToJourney(journey.id, trip.id, user.id);

    expect(result).toBe(true);
    const link = testDb
      .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
      .get(journey.id, trip.id);
    expect(link).toBeDefined();
  });

  it('JOURNEY-SVC-024b: refuses to link a trip the caller cannot access (IDOR guard)', () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    // A trip owned by someone else, that `user` is not a member of.
    const foreignTrip = createTrip(testDb, stranger.id, { title: "Stranger's Trip" });

    const result = svc.addTripToJourney(journey.id, foreignTrip.id, user.id);

    expect(result).toBe(false);
    const link = testDb
      .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
      .get(journey.id, foreignTrip.id);
    expect(link).toBeUndefined();
  });

  it('JOURNEY-SVC-025: syncs places as skeleton entries when linking a trip', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Trip with Places',
      start_date: '2026-03-01',
      end_date: '2026-03-03',
    });
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const day025 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day025.id, place.id);

    svc.addTripToJourney(journey.id, trip.id, user.id);

    const skeletons = testDb
      .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'")
      .all(journey.id, place.id);
    expect(skeletons.length).toBe(1);
  });

  it('JOURNEY-SVC-026: owner can remove a trip from journey', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Remove Me' });
    svc.addTripToJourney(journey.id, trip.id, user.id);

    const result = svc.removeTripFromJourney(journey.id, trip.id, user.id);

    expect(result).toBe(true);
    const link = testDb
      .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
      .get(journey.id, trip.id);
    expect(link).toBeUndefined();
  });

  it('JOURNEY-SVC-027: non-owner cannot remove a trip', () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    const trip = createTrip(testDb, owner.id, { title: 'Stay Linked' });
    svc.addTripToJourney(journey.id, trip.id, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = svc.removeTripFromJourney(journey.id, trip.id, editor.id);

    expect(result).toBe(false);
  });
});

// -- Entries ------------------------------------------------------------------

describe('listEntries', () => {
  it('JOURNEY-SVC-028: returns entries with photos for authorized user', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Morning Walk',
      entry_date: '2026-03-01',
    });

    const result = svc.listEntries(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].title).toBe('Morning Walk');
    expect(result![0].photos).toEqual([]);
  });

  it('JOURNEY-SVC-029: returns null for unauthorized user', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = svc.listEntries(journey.id, stranger.id);

    expect(result).toBeNull();
  });
});

describe('createEntry', () => {
  it('JOURNEY-SVC-030: creates entry for editor', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = svc.createEntry(journey.id, user.id, {
      title: 'Beach Day',
      entry_date: '2026-03-10',
      story: 'Beautiful sunset',
      mood: 'happy',
      weather: 'sunny',
      tags: ['beach', 'sunset'],
    });

    expect(entry).not.toBeNull();
    expect(entry!.title).toBe('Beach Day');
    expect(entry!.story).toBe('Beautiful sunset');
    expect(entry!.mood).toBe('happy');
    expect(entry!.type).toBe('entry');
    expect(entry!.author_id).toBe(user.id);
  });

  it('JOURNEY-SVC-031: viewer cannot create entry', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    const entry = svc.createEntry(journey.id, viewer.id, {
      title: 'Should Fail',
      entry_date: '2026-03-10',
    });

    expect(entry).toBeNull();
  });
});

describe('updateEntry', () => {
  it('JOURNEY-SVC-032: updates entry fields', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Old',
      entry_date: '2026-03-01',
    });

    const updated = svc.updateEntry(entry.id, user.id, { title: 'Updated', mood: 'excited' });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.mood).toBe('excited');
  });

  it('JOURNEY-SVC-033: promotes skeleton to entry when story is added', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'skeleton',
      title: 'Placeholder',
      entry_date: '2026-03-01',
    });

    const updated = svc.updateEntry(entry.id, user.id, { story: 'Now I have a story!' });

    expect(updated).not.toBeNull();
    expect(updated!.type).toBe('entry');
    expect(updated!.story).toBe('Now I have a story!');
  });

  it('JOURNEY-SVC-034: returns null for non-existent entry', () => {
    const { user } = createUser(testDb);

    const result = svc.updateEntry(99999, user.id, { title: 'No Such Entry' });

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-034b: ignores injection column keys and mass-assignment attempts', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Safe',
      story: 'original',
      entry_date: '2026-03-01',
    });

    // The keys come straight from the request body. A crafted key was previously
    // interpolated as a raw SQL column name (`${key} = ?`), enabling subquery
    // injection (full DB read) and mass-assignment of protected columns.
    const malicious: Record<string, unknown> = {
      title: 'Updated',
      [`story = (SELECT password_hash FROM users WHERE id = ${user.id}), updated_at`]: 'x',
      author_id: 999999,
    };

    const updated = svc.updateEntry(entry.id, user.id, malicious as Parameters<typeof svc.updateEntry>[2]);

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated'); // legit field still applied
    expect(updated!.story).toBe('original'); // injection key dropped — no hash leaked into story
    expect(updated!.author_id).toBe(user.id); // mass-assignment blocked
  });
});

describe('deleteEntry', () => {
  it('JOURNEY-SVC-035: deletes entry for editor', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = svc.deleteEntry(entry.id, user.id);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-036: returns false for non-existent entry', () => {
    const { user } = createUser(testDb);

    expect(svc.deleteEntry(99999, user.id)).toBe(false);
  });

  it('JOURNEY-SVC-037: viewer cannot delete entry', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });

    expect(svc.deleteEntry(entry.id, viewer.id)).toBe(false);
  });

  it('JOURNEY-SVC-037b: deleting a filled skeleton reverts it back to skeleton', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Tokyo Tower' });

    // Create a filled entry that originated from a trip skeleton
    const now = Date.now();
    testDb
      .prepare(
        `
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, story, mood, entry_date, location_name, visibility, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'entry', 'Tokyo Tower', 'Amazing view!', 'amazing', '2026-03-01', 'Tokyo', 'private', 0, ?, ?)
    `,
      )
      .run(journey.id, trip.id, place.id, user.id, now, now);
    const entry = testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place.id) as any;

    const result = svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    // Entry should still exist but reverted to skeleton
    const reverted = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id) as any;
    expect(reverted).toBeDefined();
    expect(reverted.type).toBe('skeleton');
    expect(reverted.story).toBeNull();
    expect(reverted.mood).toBeNull();
    expect(reverted.source_trip_id).toBe(trip.id);
    expect(reverted.source_place_id).toBe(place.id);
    expect(reverted.title).toBe('Tokyo Tower');
  });

  it('JOURNEY-SVC-037c: deleting an independent entry permanently removes it', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01', story: 'Manual entry' });

    const result = svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    const row = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id);
    expect(row).toBeUndefined();
  });
});

// -- Photos -------------------------------------------------------------------

describe('addPhoto / addProviderPhoto / deletePhoto', () => {
  it('JOURNEY-SVC-038: addPhoto creates a local photo on an entry', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const photo = svc.addPhoto(entry.id, user.id, '/uploads/photo.jpg', '/uploads/thumb.jpg', 'Sunset');

    expect(photo).not.toBeNull();
    expect(photo!.file_path).toBe('/uploads/photo.jpg');
    expect(photo!.thumbnail_path).toBe('/uploads/thumb.jpg');
    expect(photo!.caption).toBe('Sunset');
    expect(photo!.provider).toBe('local');
  });

  it('JOURNEY-SVC-039: addPhoto returns null for non-existent entry', () => {
    const { user } = createUser(testDb);

    const result = svc.addPhoto(99999, user.id, '/uploads/photo.jpg');

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-040: addProviderPhoto creates a provider-backed photo', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const photo = svc.addProviderPhoto(entry.id, user.id, 'immich', 'asset-123', 'My caption');

    expect(photo).not.toBeNull();
    expect(photo!.provider).toBe('immich');
    expect(photo!.asset_id).toBe('asset-123');
    expect(photo!.caption).toBe('My caption');
  });

  it('JOURNEY-SVC-041: addProviderPhoto skips duplicate asset', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    svc.addProviderPhoto(entry.id, user.id, 'immich', 'dup-asset');
    const duplicate = svc.addProviderPhoto(entry.id, user.id, 'immich', 'dup-asset');

    expect(duplicate).toBeNull();
  });

  it('JOURNEY-SVC-042: deletePhoto removes photo and returns it', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/delete-me.jpg');

    const deleted = svc.deletePhoto(photo!.id, user.id);

    expect(deleted).not.toBeNull();
    expect(deleted!.id).toBe(photo!.id);
    const row = testDb.prepare('SELECT * FROM journey_photos WHERE id = ?').get(photo!.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-043: deletePhoto returns null for non-existent photo', () => {
    const { user } = createUser(testDb);

    expect(svc.deletePhoto(99999, user.id)).toBeNull();
  });

  it('JOURNEY-SVC-044: viewer cannot add photo', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });

    const result = svc.addPhoto(entry.id, viewer.id, '/uploads/no.jpg');

    expect(result).toBeNull();
  });
});

// -- Contributors -------------------------------------------------------------

describe('addContributor / updateContributorRole / removeContributor', () => {
  it('JOURNEY-SVC-045: owner can add contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: newContrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = svc.addContributor(journey.id, owner.id, newContrib.id, 'editor');

    expect(result).toBe(true);
    const row = testDb
      .prepare('SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, newContrib.id) as { role: string } | undefined;
    expect(row).toBeDefined();
    expect(row!.role).toBe('editor');
  });

  it('JOURNEY-SVC-046: non-owner cannot add contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const { user: newUser } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = svc.addContributor(journey.id, editor.id, newUser.id, 'viewer');

    expect(result).toBe(false);
  });

  it('JOURNEY-SVC-047: owner cannot add themselves as contributor', () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = svc.addContributor(journey.id, owner.id, owner.id, 'editor');

    expect(result).toBe(false);
  });

  it('JOURNEY-SVC-048: owner can update contributor role', () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'viewer');

    const result = svc.updateContributorRole(journey.id, owner.id, contrib.id, 'editor');

    expect(result).toBe(true);
    const row = testDb
      .prepare('SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, contrib.id) as { role: string };
    expect(row.role).toBe('editor');
  });

  it('JOURNEY-SVC-049: non-owner cannot update contributor role', () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');
    addJourneyContributor(testDb, journey.id, target.id, 'viewer');

    const result = svc.updateContributorRole(journey.id, editor.id, target.id, 'editor');

    expect(result).toBe(false);
  });

  it('JOURNEY-SVC-050: owner can remove contributor', () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = svc.removeContributor(journey.id, owner.id, contrib.id);

    expect(result).toBe(true);
    const row = testDb
      .prepare('SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, contrib.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-051: removeContributor does not remove owner contributor record', () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    // attempting to remove the owner's own contributor record should not work
    // (the SQL filters role != 'owner')
    svc.removeContributor(journey.id, owner.id, owner.id);

    const row = testDb
      .prepare('SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, owner.id);
    expect(row).toBeDefined();
  });
});

// -- Suggestions --------------------------------------------------------------

describe('getSuggestions', () => {
  it('JOURNEY-SVC-052: returns recently ended trips not yet in a journey', () => {
    const { user } = createUser(testDb);
    // Trip that ended 5 days ago (within 30-day window)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    createTrip(testDb, user.id, {
      title: 'Recent Trip',
      start_date: tenDaysAgo,
      end_date: fiveDaysAgo,
    });

    const suggestions = svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(1);
    expect((suggestions[0] as any).title).toBe('Recent Trip');
  });

  it('JOURNEY-SVC-053: excludes trips already linked to a journey', () => {
    const { user } = createUser(testDb);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const trip = createTrip(testDb, user.id, {
      title: 'Already Linked',
      start_date: tenDaysAgo,
      end_date: fiveDaysAgo,
    });
    const journey = createJourney(testDb, user.id);
    svc.addTripToJourney(journey.id, trip.id, user.id);

    const suggestions = svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(0);
  });

  it('JOURNEY-SVC-054: excludes trips ending in the future', () => {
    const { user } = createUser(testDb);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    createTrip(testDb, user.id, {
      title: 'Future Trip',
      start_date: '2026-04-01',
      end_date: tomorrow,
    });

    const suggestions = svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(0);
  });
});

// -- syncTripPlaces ------------------------------------------------------------

describe('syncTripPlaces', () => {
  it('JOURNEY-SVC-055: creates skeleton entries for each trip place', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Sync Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-03',
    });
    const place1 = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const place2 = createPlace(testDb, trip.id, { name: 'Louvre' });
    const days055 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 2').all(trip.id) as {
      id: number;
    }[];
    createDayAssignment(testDb, days055[0].id, place1.id);
    createDayAssignment(testDb, days055[1].id, place2.id);

    svc.syncTripPlaces(journey.id, trip.id, user.id);

    const skeletons = testDb
      .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton'")
      .all(journey.id) as any[];
    expect(skeletons.length).toBe(2);
    const names = skeletons.map((s: any) => s.title).sort();
    expect(names).toEqual(['Eiffel Tower', 'Louvre']);
  });

  it('JOURNEY-SVC-056: skips places that already have skeleton entries', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Idempotent Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-02',
    });
    const place056 = createPlace(testDb, trip.id, { name: 'Notre Dame' });
    const day056 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day056.id, place056.id);

    svc.syncTripPlaces(journey.id, trip.id, user.id);
    svc.syncTripPlaces(journey.id, trip.id, user.id); // second call

    const skeletons = testDb
      .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton'")
      .all(journey.id);
    expect(skeletons.length).toBe(1);
  });

  it('JOURNEY-SVC-057: uses day date for skeleton entry_date when available', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    // Trip with dates auto-creates days; grab an existing day to assign the place
    const trip = createTrip(testDb, user.id, {
      title: 'Dated Trip',
      start_date: '2026-06-10',
      end_date: '2026-06-12',
    });
    const day = testDb.prepare("SELECT * FROM days WHERE trip_id = ? AND date = '2026-06-11'").get(trip.id) as {
      id: number;
    };
    const place = createPlace(testDb, trip.id, { name: 'Colosseum' });
    createDayAssignment(testDb, day.id, place.id);

    svc.syncTripPlaces(journey.id, trip.id, user.id);

    const skeleton = testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place.id) as any;
    expect(skeleton).toBeDefined();
    expect(skeleton.entry_date).toBe('2026-06-11');
  });
});

// -- onPlaceCreated / onPlaceUpdated / onPlaceDeleted -------------------------

describe('onPlaceCreated', () => {
  it('JOURNEY-SVC-058: creates skeleton entry in linked journeys', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Webhook Trip',
      start_date: '2026-07-01',
      end_date: '2026-07-03',
    });
    svc.addTripToJourney(journey.id, trip.id, user.id);

    // Create a new place after trip is linked
    const place = createPlace(testDb, trip.id, { name: 'Sagrada Familia' });
    const day058 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day058.id, place.id);
    svc.onPlaceCreated(trip.id, place.id);

    const skeleton = testDb
      .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'")
      .get(journey.id, place.id);
    expect(skeleton).toBeDefined();
  });

  it('JOURNEY-SVC-059: does nothing if trip is not linked to any journey', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Remote Place' });

    svc.onPlaceCreated(trip.id, place.id);

    const entries = testDb.prepare('SELECT * FROM journey_entries WHERE source_place_id = ?').all(place.id);
    expect(entries.length).toBe(0);
  });

  it('JOURNEY-SVC-060: does not duplicate if skeleton already exists', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Dup Trip',
      start_date: '2026-07-01',
      end_date: '2026-07-02',
    });
    svc.addTripToJourney(journey.id, trip.id, user.id);

    const place = createPlace(testDb, trip.id, { name: 'Arc de Triomphe' });
    const day060 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day060.id, place.id);
    svc.onPlaceCreated(trip.id, place.id);
    svc.onPlaceCreated(trip.id, place.id); // second call

    const entries = testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .all(journey.id, place.id);
    expect(entries.length).toBe(1);
  });
});

describe('onPlaceUpdated', () => {
  it('JOURNEY-SVC-061: updates skeleton entry fields when place changes', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Update Place Trip',
      start_date: '2026-08-01',
      end_date: '2026-08-03',
    });
    const place = createPlace(testDb, trip.id, { name: 'Old Name' });
    const day061 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day061.id, place.id);
    svc.addTripToJourney(journey.id, trip.id, user.id);

    // Update the place name directly in DB
    testDb.prepare('UPDATE places SET name = ?, address = ? WHERE id = ?').run('New Name', 'New Address', place.id);
    svc.onPlaceUpdated(place.id);

    const entry = testDb
      .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'")
      .get(journey.id, place.id) as any;
    expect(entry).toBeDefined();
    expect(entry.title).toBe('New Name');
    expect(entry.location_name).toBe('New Address');
  });

  it('JOURNEY-SVC-062: only updates location on filled entries, not title', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Filled Entry Trip',
      start_date: '2026-08-01',
      end_date: '2026-08-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'Original Place' });
    const day062 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day062.id, place.id);
    svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote the skeleton to a full entry
    const skeleton = testDb
      .prepare('SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place.id) as { id: number };
    svc.updateEntry(skeleton.id, user.id, { story: 'My story', title: 'Custom Title' });

    // Now update the place
    testDb
      .prepare('UPDATE places SET name = ?, address = ? WHERE id = ?')
      .run('Changed Place', 'Changed Addr', place.id);
    svc.onPlaceUpdated(place.id);

    const entry = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(entry.title).toBe('Custom Title'); // title unchanged
    expect(entry.location_name).toBe('Changed Addr'); // location updated
  });

  it('JOURNEY-SVC-063: does nothing if place has no linked entries', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Orphan Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Orphan Place' });

    // Should not throw
    svc.onPlaceUpdated(place.id);

    const entries = testDb.prepare('SELECT * FROM journey_entries WHERE source_place_id = ?').all(place.id);
    expect(entries.length).toBe(0);
  });
});

describe('onPlaceDeleted', () => {
  it('JOURNEY-SVC-064: deletes empty skeleton entries', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Delete Place Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'To Be Deleted' });
    svc.addTripToJourney(journey.id, trip.id, user.id);

    svc.onPlaceDeleted(place.id);

    const entry = testDb.prepare('SELECT * FROM journey_entries WHERE source_place_id = ?').get(place.id);
    expect(entry).toBeUndefined();
  });

  it('JOURNEY-SVC-065: detaches filled entries and adds note instead of deleting', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Detach Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'Detach Place' });
    const day065 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    createDayAssignment(testDb, day065.id, place.id);
    svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote the skeleton to a filled entry
    const skeleton = testDb
      .prepare('SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place.id) as { id: number };
    svc.updateEntry(skeleton.id, user.id, { story: 'I really enjoyed this place' });

    svc.onPlaceDeleted(place.id);

    const entry = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(entry).toBeDefined();
    expect(entry.source_place_id).toBeNull();
    expect(entry.source_trip_id).toBeNull();
    expect(entry.story).toContain('original trip place was removed');
  });

  it('JOURNEY-SVC-066: does nothing for unlinked places', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked' });
    const place = createPlace(testDb, trip.id, { name: 'Nowhere' });

    expect(() => svc.onPlaceDeleted(place.id)).not.toThrow();

    const orphaned = testDb
      .prepare('SELECT COUNT(*) AS n FROM journey_entries WHERE source_place_id = ?')
      .get(place.id) as { n: number };
    expect(orphaned.n).toBe(0);
  });
});

// -- linkPhotoToEntry ----------------------------------------------------------

describe('linkPhotoToEntry', () => {
  it('JOURNEY-SVC-067: moves photo from one entry to another', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry1 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const entry2 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-02' });

    const photo = svc.addPhoto(entry1.id, user.id, '/uploads/link-test.jpg');
    expect(photo).not.toBeNull();

    const result = svc.linkPhotoToEntry(entry2.id, photo!.id, user.id);
    expect(result).not.toBeNull();
    expect(result!.entry_id).toBe(entry2.id);
  });

  it('JOURNEY-SVC-068: returns same photo if already on target entry', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/same-entry.jpg');

    const result = svc.linkPhotoToEntry(entry.id, photo!.id, user.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(photo!.id);
    expect(result!.entry_id).toBe(entry.id);
  });

  it('JOURNEY-SVC-069: returns null for non-existent entry', () => {
    const { user } = createUser(testDb);

    const result = svc.linkPhotoToEntry(99999, 1, user.id);
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-070: returns null for non-existent photo', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = svc.linkPhotoToEntry(entry.id, 99999, user.id);
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-071: viewer cannot link photo', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, owner.id, '/uploads/owner-photo.jpg');

    const result = svc.linkPhotoToEntry(entry.id, photo!.id, viewer.id);
    expect(result).toBeNull();
  });
});

// -- setPhotoProvider ----------------------------------------------------------

describe('setPhotoProvider', () => {
  it('JOURNEY-SVC-072: sets provider info on an existing photo', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/provider-test.jpg');

    svc.setPhotoProvider(photo!.id, 'immich', 'immich-asset-789', user.id);

    const updated = testDb
      .prepare(
        `
      SELECT jp.*, tkp.provider, tkp.asset_id, tkp.owner_id
      FROM journey_photos jp JOIN trek_photos tkp ON tkp.id = jp.photo_id
      WHERE jp.id = ?
    `,
      )
      .get(photo!.id) as any;
    expect(updated.provider).toBe('immich');
    expect(updated.asset_id).toBe('immich-asset-789');
    expect(updated.owner_id).toBe(user.id);
  });
});

// -- updatePhoto ---------------------------------------------------------------

describe('updatePhoto', () => {
  it('JOURNEY-SVC-073: updates caption on photo', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/caption-test.jpg', undefined, 'Old caption');

    const result = svc.updatePhoto(photo!.id, user.id, { caption: 'New caption' });

    expect(result).not.toBeNull();
    expect(result!.caption).toBe('New caption');
  });

  it('JOURNEY-SVC-074: updates sort_order on photo', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/sort-test.jpg');

    const result = svc.updatePhoto(photo!.id, user.id, { sort_order: 10 });

    expect(result).not.toBeNull();
    expect(result!.sort_order).toBe(10);
  });

  it('JOURNEY-SVC-075: returns null for non-existent photo', () => {
    const { user } = createUser(testDb);

    const result = svc.updatePhoto(99999, user.id, { caption: 'Nope' });
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-076: returns photo unchanged when no fields provided', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/noop-test.jpg', undefined, 'Stay');

    const result = svc.updatePhoto(photo!.id, user.id, {});

    expect(result).not.toBeNull();
    expect(result!.caption).toBe('Stay');
  });

  it('JOURNEY-SVC-077: viewer cannot update photo', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, owner.id, '/uploads/viewer-update.jpg');

    const result = svc.updatePhoto(photo!.id, viewer.id, { caption: 'Hacked' });
    expect(result).toBeNull();
  });
});

// -- listUserTrips -------------------------------------------------------------

describe('listUserTrips', () => {
  it('JOURNEY-SVC-078: returns all user trips', () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Trip A', start_date: '2026-01-01', end_date: '2026-01-03' });
    createTrip(testDb, user.id, { title: 'Trip B', start_date: '2026-02-01', end_date: '2026-02-03' });

    const trips = svc.listUserTrips(user.id);

    expect(trips.length).toBe(2);
    // ordered by start_date DESC
    expect((trips[0] as any).title).toBe('Trip B');
    expect((trips[1] as any).title).toBe('Trip A');
  });

  it('JOURNEY-SVC-079: returns empty for user with no trips', () => {
    const { user } = createUser(testDb);

    const trips = svc.listUserTrips(user.id);

    expect(trips.length).toBe(0);
  });

  it('JOURNEY-SVC-080: does not return other users trips', () => {
    const { user: user1 } = createUser(testDb);
    const { user: user2 } = createUser(testDb);
    createTrip(testDb, user1.id, { title: 'User1 Trip' });

    const trips = svc.listUserTrips(user2.id);

    expect(trips.length).toBe(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe('Edge cases', () => {
  it('JOURNEY-SVC-081: deleteEntry deletes photos along with the entry', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = svc.addPhoto(entry.id, user.id, '/uploads/gallery-move.jpg');

    const result = svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    // Junction row must be gone (ON DELETE CASCADE from journey_entries).
    // Gallery row (journey_photos) is preserved — photo may belong to other entries.
    const junctionRow = testDb.prepare('SELECT * FROM journey_entry_photos WHERE entry_id = ?').get(entry.id) as any;
    expect(junctionRow).toBeUndefined();
  });

  it('JOURNEY-SVC-082: updateJourney can set cover_gradient', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = svc.updateJourney(journey.id, user.id, {
      cover_gradient: 'linear-gradient(to right, #ff0000, #0000ff)',
    });

    expect(result).not.toBeNull();
    expect((result as any).cover_gradient).toBe('linear-gradient(to right, #ff0000, #0000ff)');
  });

  it('JOURNEY-SVC-083: updateJourney ignores unknown fields', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Original' });

    const result = svc.updateJourney(journey.id, user.id, { bogus: 'field' } as any);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Original');
  });

  it('JOURNEY-SVC-084: createEntry stores tags and pros_cons as JSON', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = svc.createEntry(journey.id, user.id, {
      entry_date: '2026-03-10',
      tags: ['food', 'culture'],
      pros_cons: { pros: ['Great view'], cons: ['Expensive'] },
    });

    expect(entry).not.toBeNull();
    // Read raw from DB
    const raw = testDb.prepare('SELECT tags, pros_cons FROM journey_entries WHERE id = ?').get(entry!.id) as any;
    expect(JSON.parse(raw.tags)).toEqual(['food', 'culture']);
    expect(JSON.parse(raw.pros_cons)).toEqual({ pros: ['Great view'], cons: ['Expensive'] });
  });

  it('JOURNEY-SVC-085: updateEntry handles tags and pros_cons update', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = svc.updateEntry(entry.id, user.id, {
      tags: ['beach', 'adventure'],
      pros_cons: { pros: ['Fun'], cons: [] },
    });

    expect(result).not.toBeNull();
    const raw = testDb.prepare('SELECT tags, pros_cons FROM journey_entries WHERE id = ?').get(entry.id) as any;
    expect(JSON.parse(raw.tags)).toEqual(['beach', 'adventure']);
    expect(JSON.parse(raw.pros_cons)).toEqual({ pros: ['Fun'], cons: [] });
  });

  // #1614 — photos live in journeys now. Linking a trip used to copy its
  // trip_photos into the gallery; that surface lost its UI in 3.1.0, nothing
  // writes to it on a newer install, and the copy was how a photo one member had
  // chosen not to share could reach a journey at all.
  it('JOURNEY-SVC-086: addTripToJourney no longer pulls trip photos into the gallery', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Photo Trip',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
    });
    addTripPhoto(testDb, trip.id, user.id, 'immich-photo-1', 'immich', { shared: true });

    expect(svc.addTripToJourney(journey.id, trip.id, user.id)).toBe(true);

    const photos = testDb.prepare('SELECT 1 FROM journey_photos WHERE journey_id = ?').all(journey.id);
    expect(photos).toHaveLength(0);
  });

  it('JOURNEY-SVC-087: removeTripFromJourney detaches filled entries, deletes skeletons', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Mixed Trip',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
    });
    const place1 = createPlace(testDb, trip.id, { name: 'Skeleton Place' });
    const place2 = createPlace(testDb, trip.id, { name: 'Filled Place' });
    const days087 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 2').all(trip.id) as {
      id: number;
    }[];
    createDayAssignment(testDb, days087[0].id, place1.id);
    createDayAssignment(testDb, days087[1].id, place2.id);
    svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote one skeleton to a filled entry
    const filled = testDb
      .prepare("SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'")
      .get(journey.id, place2.id) as { id: number };
    svc.updateEntry(filled.id, user.id, { story: 'Now filled!' });

    svc.removeTripFromJourney(journey.id, trip.id, user.id);

    // skeleton for place1 should be deleted
    const skeletonRow = testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place1.id);
    expect(skeletonRow).toBeUndefined();

    // filled entry for place2 should be detached but still present
    const filledRow = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(filled.id) as any;
    expect(filledRow).toBeDefined();
    expect(filledRow.source_trip_id).toBeNull();
    expect(filledRow.source_place_id).toBeNull();
  });
});

// -- Passphrase on addProviderPhoto -------------------------------------------

describe('addProviderPhoto — passphrase', () => {
  it('JOURNEY-SVC-088: addProviderPhoto with passphrase stores encrypted value on trek_photos', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-15' });

    const photo = svc.addProviderPhoto(entry.id, user.id, 'synologyphotos', 'pp-asset-1', undefined, 'secret-pp');

    expect(photo).not.toBeNull();

    const row = testDb
      .prepare('SELECT passphrase FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?')
      .get('synologyphotos', 'pp-asset-1', user.id) as { passphrase: string | null } | undefined;
    expect(row?.passphrase).not.toBeNull();
    expect(typeof row?.passphrase).toBe('string');
    // stored value must be encrypted (not plaintext)
    expect(row?.passphrase).not.toBe('secret-pp');
  });
});

// -- reorderEntries (#846) ----------------------------------------------------

function insertEntry(
  journeyId: number,
  authorId: number,
  opts: { entry_date: string; entry_time?: string | null; sort_order?: number },
): { id: number } {
  const now = Date.now();
  const res = testDb
    .prepare(
      `
    INSERT INTO journey_entries (journey_id, author_id, type, entry_date, entry_time, sort_order, visibility, created_at, updated_at)
    VALUES (?, ?, 'entry', ?, ?, ?, 'private', ?, ?)
  `,
    )
    .run(journeyId, authorId, opts.entry_date, opts.entry_time ?? null, opts.sort_order ?? 0, now, now);
  return { id: Number(res.lastInsertRowid) };
}

describe('reorderEntries', () => {
  it('JOURNEY-SVC-089: reorder persists and listEntries returns requested order regardless of entry_time', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const e1 = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', entry_time: '09:00', sort_order: 0 });
    const e2 = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', entry_time: '14:00', sort_order: 1 });

    const ok = svc.reorderEntries(journey.id, user.id, [e2.id, e1.id]);
    expect(ok).toBe(true);

    const entries = svc.listEntries(journey.id, user.id)!;
    const dayEntries = entries.filter((e) => e.entry_date === '2026-08-01');
    expect(dayEntries.map((e) => e.id)).toEqual([e2.id, e1.id]);
  });

  it('JOURNEY-SVC-090: reorderEntries rejects ids from another journey', () => {
    const { user } = createUser(testDb);
    const j1 = createJourney(testDb, user.id);
    const j2 = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, j2.id, user.id, { entry_date: '2026-08-02' });

    const ok = svc.reorderEntries(j1.id, user.id, [entry.id]);
    expect(ok).toBe(false);
  });

  it('JOURNEY-SVC-091: reorderEntries does not affect entries on other days', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const day1a = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', sort_order: 0 });
    const day1b = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', sort_order: 1 });
    const day2 = insertEntry(journey.id, user.id, { entry_date: '2026-08-02', sort_order: 0 });

    svc.reorderEntries(journey.id, user.id, [day1b.id, day1a.id]);

    const entries = svc.listEntries(journey.id, user.id)!;
    const day2Entry = entries.find((e) => e.id === day2.id)!;
    expect(day2Entry.sort_order).toBe(0);
  });
});

describe('syncTripPlaces sort_order', () => {
  it('JOURNEY-SVC-092: assigns unique sequential sort_order per date for same-day places', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Order Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const day = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as {
      id: number;
    };
    const p1 = createPlace(testDb, trip.id, { name: 'Place A' });
    const p2 = createPlace(testDb, trip.id, { name: 'Place B' });
    const p3 = createPlace(testDb, trip.id, { name: 'Place C' });
    createDayAssignment(testDb, day.id, p1.id);
    createDayAssignment(testDb, day.id, p2.id);
    createDayAssignment(testDb, day.id, p3.id);

    svc.syncTripPlaces(journey.id, trip.id, user.id);

    const rows = testDb
      .prepare('SELECT sort_order FROM journey_entries WHERE journey_id = ? ORDER BY sort_order ASC')
      .all(journey.id) as { sort_order: number }[];
    const orders = rows.map((r) => r.sort_order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([0, 1, 2]);
  });
});

describe('onPlaceCreated sort_order', () => {
  it('JOURNEY-SVC-093: assigns MAX+1 sort_order when entries already exist on the target date', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Append Trip',
      start_date: '2026-10-01',
      end_date: '2026-10-02',
    });
    svc.addTripToJourney(journey.id, trip.id, user.id);

    const day = testDb
      .prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1')
      .get(trip.id) as { id: number; date: string };
    insertEntry(journey.id, user.id, { entry_date: day.date, sort_order: 5 });

    const place = createPlace(testDb, trip.id, { name: 'Late Addition' });
    createDayAssignment(testDb, day.id, place.id);
    svc.onPlaceCreated(trip.id, place.id);

    const newEntry = testDb
      .prepare('SELECT sort_order FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journey.id, place.id) as { sort_order: number } | undefined;
    expect(newEntry).toBeDefined();
    expect(newEntry!.sort_order).toBe(6);
  });
});

// -- reconcileTripSkeletons ---------------------------------------------------

describe('reconcileTripSkeletons', () => {
  /** Link a fresh journey to a trip and return both. */
  function linkedJourneyTrip() {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Reconcile Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-03',
    });
    svc.addTripToJourney(journey.id, trip.id, user.id);
    return { user, journey, trip };
  }

  function daysOf(tripId: number) {
    return testDb.prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date ASC').all(tripId) as {
      id: number;
      date: string;
    }[];
  }

  function skeletonFor(journeyId: number, placeId: number) {
    return testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journeyId, placeId) as any;
  }

  it('JOURNEY-SVC-094: adds a skeleton for a newly assigned place', () => {
    const { journey, trip } = linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'New Museum' });
    createDayAssignment(testDb, days[0].id, place.id);

    svc.reconcileTripSkeletons(trip.id);

    const skeleton = skeletonFor(journey.id, place.id);
    expect(skeleton).toBeDefined();
    expect(skeleton.type).toBe('skeleton');
    expect(skeleton.title).toBe('New Museum');
    expect(skeleton.entry_date).toBe(days[0].date);
  });

  it('JOURNEY-SVC-095: removes a pure skeleton when its place is unassigned', () => {
    const { journey, trip } = linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'To Remove' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    svc.reconcileTripSkeletons(trip.id);
    expect(skeletonFor(journey.id, place.id)).toBeDefined();

    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(assignment.id);
    svc.reconcileTripSkeletons(trip.id);

    expect(skeletonFor(journey.id, place.id)).toBeUndefined();
  });

  it('JOURNEY-SVC-096: preserves a filled entry on unassign (detaches + notes it)', () => {
    const { journey, trip } = linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Filled Place' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    svc.reconcileTripSkeletons(trip.id);
    const skeleton = skeletonFor(journey.id, place.id);
    // Promote to a filled entry with content.
    testDb
      .prepare("UPDATE journey_entries SET type = 'entry', story = 'A wonderful visit' WHERE id = ?")
      .run(skeleton.id);

    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(assignment.id);
    svc.reconcileTripSkeletons(trip.id);

    const kept = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(kept).toBeDefined();
    expect(kept.type).toBe('entry');
    expect(kept.source_place_id).toBeNull();
    expect(kept.source_trip_id).toBeNull();
    expect(kept.story).toContain('A wonderful visit');
    expect(kept.story).toContain('was removed from the trip plan');
  });

  it('JOURNEY-SVC-097: refreshes skeleton entry_date when a place is moved to another day', () => {
    const { journey, trip } = linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Moving Place' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    svc.reconcileTripSkeletons(trip.id);
    expect(skeletonFor(journey.id, place.id).entry_date).toBe(days[0].date);

    testDb.prepare('UPDATE day_assignments SET day_id = ? WHERE id = ?').run(days[1].id, assignment.id);
    svc.reconcileTripSkeletons(trip.id);

    expect(skeletonFor(journey.id, place.id).entry_date).toBe(days[1].date);
  });

  it('JOURNEY-SVC-098: is idempotent — a second call makes no changes', () => {
    const { journey, trip } = linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Stable Place' });
    createDayAssignment(testDb, days[0].id, place.id);
    svc.reconcileTripSkeletons(trip.id);

    const before = testDb
      .prepare('SELECT id, updated_at FROM journey_entries WHERE journey_id = ? ORDER BY id')
      .all(journey.id) as { id: number; updated_at: number }[];
    svc.reconcileTripSkeletons(trip.id);
    const after = testDb
      .prepare('SELECT id, updated_at FROM journey_entries WHERE journey_id = ? ORDER BY id')
      .all(journey.id) as { id: number; updated_at: number }[];

    expect(after).toEqual(before);
  });

  it('JOURNEY-SVC-099: no-ops when the trip is linked to no journey', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked', start_date: '2026-05-01', end_date: '2026-05-02' });
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Orphan' });
    createDayAssignment(testDb, days[0].id, place.id);

    expect(() => svc.reconcileTripSkeletons(trip.id)).not.toThrow();
    const anyEntry = testDb.prepare('SELECT COUNT(*) AS n FROM journey_entries').get() as { n: number };
    expect(anyEntry.n).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Skeleton lifecycle, the photo gallery and the per-user preference row. These
// paths were reachable only through the REST controller before the fold, so the
// service-level branches below had no direct case.
// ---------------------------------------------------------------------------

/** A trip with one day and one place assigned to it — the shape skeleton sync reads. */
function tripWithPlace(userId: number, opts: { name?: string; date?: string } = {}) {
  const trip = createTrip(testDb, userId);
  const day = createDay(testDb, trip.id, { date: opts.date ?? '2026-05-01' });
  const place = createPlace(testDb, trip.id, { name: opts.name ?? 'Fushimi Inari' });
  createDayAssignment(testDb, day.id, place.id);
  return { trip, day, place };
}

function skeletonsOf(journeyId: number) {
  return testDb
    .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton' ORDER BY id")
    .all(journeyId) as any[];
}

describe('skeleton sync', () => {
  it('JOURNEY-SVC-SKEL-001: linking a trip materialises one skeleton per assigned place', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const skeletons = skeletonsOf(journey.id);
    expect(skeletons).toHaveLength(1);
    expect(skeletons[0].title).toBe('Fushimi Inari');
    expect(skeletons[0].source_place_id).toBe(place.id);
    expect(skeletons[0].source_trip_id).toBe(trip.id);
  });

  it('JOURNEY-SVC-SKEL-002: syncing the same trip twice does not duplicate skeletons', () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    svc.syncTripPlaces(journey.id, trip.id, user.id);
    expect(skeletonsOf(journey.id)).toHaveLength(1);
  });

  it('JOURNEY-SVC-SKEL-003: onPlaceCreated adds a skeleton to every journey the trip is linked to', () => {
    const { user } = createUser(testDb);
    const { trip, day } = tripWithPlace(user.id);
    const a = svc.createJourney(user.id, { title: 'A', trip_ids: [trip.id] });
    const b = svc.createJourney(user.id, { title: 'B', trip_ids: [trip.id] });

    const extra = createPlace(testDb, trip.id, { name: 'Nishiki Market' });
    createDayAssignment(testDb, day.id, extra.id);
    svc.onPlaceCreated(trip.id, extra.id);

    for (const j of [a, b]) {
      expect(skeletonsOf(j.id).map((s) => s.title)).toContain('Nishiki Market');
    }
  });

  it('JOURNEY-SVC-SKEL-004: onPlaceCreated is a no-op for a trip in no journey', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    expect(() => svc.onPlaceCreated(trip.id, place.id)).not.toThrow();
  });

  it('JOURNEY-SVC-SKEL-005: onPlaceUpdated carries the rename and the new address onto the skeleton', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    testDb
      .prepare('UPDATE places SET name = ?, address = ? WHERE id = ?')
      .run('Kinkaku-ji', '1 Kinkakujicho', place.id);
    svc.onPlaceUpdated(place.id);

    const [skeleton] = skeletonsOf(journey.id);
    expect(skeleton.title).toBe('Kinkaku-ji');
    expect(skeleton.location_name).toBe('1 Kinkakujicho');
  });

  it('JOURNEY-SVC-SKEL-006: onPlaceUpdated is a no-op when no skeleton points at the place', () => {
    const { user } = createUser(testDb);
    const { place } = tripWithPlace(user.id);
    expect(() => svc.onPlaceUpdated(place.id)).not.toThrow();
  });

  it('JOURNEY-SVC-SKEL-007: onPlaceDeleted drops an empty skeleton outright', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    expect(skeletonsOf(journey.id)).toHaveLength(1);

    svc.onPlaceDeleted(place.id);
    expect(skeletonsOf(journey.id)).toHaveLength(0);
  });

  it('JOURNEY-SVC-SKEL-008: onPlaceDeleted keeps a skeleton that has a story, detaches it and appends the note', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    const [skeleton] = skeletonsOf(journey.id);
    testDb.prepare('UPDATE journey_entries SET story = ? WHERE id = ?').run('We queued for an hour.', skeleton.id);

    svc.onPlaceDeleted(place.id);

    const kept = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(kept).toBeDefined();
    expect(kept.source_place_id).toBeNull();
    expect(kept.source_trip_id).toBeNull();
    // A skeleton that survives is promoted to a real entry.
    expect(kept.type).toBe('entry');
    expect(kept.story).toContain('removed from the trip plan');
  });

  it('JOURNEY-SVC-SKEL-009: reconcileTripSkeletons adds what is missing and removes what is gone', () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    // A second place lands without firing the hook, and the first is unassigned.
    const second = createPlace(testDb, trip.id, { name: 'Gion' });
    createDayAssignment(testDb, day.id, second.id);
    testDb.prepare('DELETE FROM day_assignments WHERE place_id = ?').run(place.id);

    svc.reconcileTripSkeletons(trip.id);

    const titles = skeletonsOf(journey.id).map((s) => s.title);
    expect(titles).toContain('Gion');
    expect(titles).not.toContain('Fushimi Inari');
  });

  it('JOURNEY-SVC-SKEL-010: reconcileTripSkeletons is a no-op for a trip in no journey', () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    expect(() => svc.reconcileTripSkeletons(trip.id)).not.toThrow();
  });

  it('JOURNEY-SVC-SKEL-011: createJourney takes its cover from the first linked trip and strips the /uploads prefix', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('UPDATE trips SET cover_image = ? WHERE id = ?').run('/uploads/covers/kyoto.jpg', trip.id);

    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    const row = testDb.prepare('SELECT cover_image FROM journeys WHERE id = ?').get(journey.id) as any;
    expect(row.cover_image).toBe('covers/kyoto.jpg');
  });
});

describe('journey gallery', () => {
  function ownedEntry() {
    const { user } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    const entry = svc.createEntry(journey.id, user.id, { entry_date: '2026-05-01', title: 'Day 1' })!;
    return { user, journey, entry };
  }

  it('JOURNEY-SVC-PHOTO-001: addPhoto puts the file in the gallery and links it to the entry', () => {
    const { user, journey, entry } = ownedEntry();
    const photo = svc.addPhoto(entry.id, user.id, 'journey/a.jpg', 'journey/a-thumb.jpg', 'Torii');
    expect(photo).toBeTruthy();

    const entries = svc.listEntries(journey.id, user.id)!;
    expect(entries.find((e) => e.id === entry.id)!.photos).toHaveLength(1);
  });

  it('JOURNEY-SVC-PHOTO-002: addPhoto refuses an unknown entry and a non-editor', () => {
    const { entry } = ownedEntry();
    const { user: stranger } = createUser(testDb);
    expect(svc.addPhoto(999999, 1, 'journey/a.jpg')).toBeNull();
    expect(svc.addPhoto(entry.id, stranger.id, 'journey/a.jpg')).toBeNull();
  });

  it('JOURNEY-SVC-PHOTO-003: uploadGalleryPhotos appends in order and refuses a non-editor', () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });

    const first = svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/1.jpg' }]);
    const second = svc.uploadGalleryPhotos(journey.id, user.id, [
      { path: 'journey/2.jpg', thumbnail: 'journey/2-t.jpg' },
      { path: 'journey/3.mp4', mediaType: 'video', durationMs: 4200 },
    ]);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);

    const orders = testDb
      .prepare('SELECT sort_order FROM journey_photos WHERE journey_id = ? ORDER BY sort_order')
      .all(journey.id) as any[];
    expect(orders.map((o) => o.sort_order)).toEqual([0, 1, 2]);

    expect(svc.uploadGalleryPhotos(journey.id, stranger.id, [{ path: 'journey/x.jpg' }])).toEqual([]);
  });

  it('JOURNEY-SVC-PHOTO-004: linkPhotoToEntry attaches a gallery row, unlinkPhotoFromEntry detaches it', () => {
    const { user, journey, entry } = ownedEntry();
    const [gallery] = svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(svc.linkPhotoToEntry(entry.id, gallery.id, user.id)).toBeTruthy();
    expect(svc.listEntries(journey.id, user.id)!.find((e) => e.id === entry.id)!.photos).toHaveLength(1);

    expect(svc.unlinkPhotoFromEntry(entry.id, gallery.id, user.id)).toBe(true);
    expect(svc.listEntries(journey.id, user.id)!.find((e) => e.id === entry.id)!.photos).toHaveLength(0);
    // The gallery row survives the unlink — that is the whole point of the split.
    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE id = ?').get(gallery.id)).toBeDefined();
  });

  it('JOURNEY-SVC-PHOTO-005: link/unlink refuse an unknown entry and a non-editor', () => {
    const { user, journey, entry } = ownedEntry();
    const { user: stranger } = createUser(testDb);
    const [gallery] = svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(svc.linkPhotoToEntry(999999, gallery.id, user.id)).toBeNull();
    expect(svc.linkPhotoToEntry(entry.id, gallery.id, stranger.id)).toBeNull();
    expect(svc.unlinkPhotoFromEntry(999999, gallery.id, user.id)).toBe(false);
    expect(svc.unlinkPhotoFromEntry(entry.id, gallery.id, stranger.id)).toBe(false);
  });

  it('JOURNEY-SVC-PHOTO-006: deleteGalleryPhoto removes the row and refuses an unknown id', () => {
    const { user } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    const [gallery] = svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(svc.deleteGalleryPhoto(gallery.id, user.id)).toBeTruthy();
    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE id = ?').get(gallery.id)).toBeUndefined();
    expect(svc.deleteGalleryPhoto(999999, user.id)).toBeNull();
  });

  it('JOURNEY-SVC-PHOTO-007: deleteGalleryPhoto refuses a non-editor', () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    const [gallery] = svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);
    expect(svc.deleteGalleryPhoto(gallery.id, stranger.id)).toBeNull();
  });
});

describe('per-user journey preferences', () => {
  it('JOURNEY-SVC-PREF-001: hide_skeletons round-trips for the owner', () => {
    const { user } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    expect(svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: true })).toEqual({
      hide_skeletons: true,
    });
    expect(svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: false })).toEqual({
      hide_skeletons: false,
    });
  });

  it('JOURNEY-SVC-PREF-002: an empty patch is accepted and changes nothing', () => {
    const { user } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: true });
    expect(svc.updateJourneyPreferences(journey.id, user.id, {})).toEqual({ hide_skeletons: true });
  });

  it('JOURNEY-SVC-PREF-003: a stranger gets null, not a row', () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    expect(svc.updateJourneyPreferences(journey.id, stranger.id, { hide_skeletons: true })).toBeNull();
  });
});

describe('entry enrichment', () => {
  it('JOURNEY-SVC-ENRICH-001: tags and pros_cons come back parsed, and source_trip_name is resolved', () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    testDb.prepare('UPDATE trips SET title = ? WHERE id = ?').run('Japan 2026', trip.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const [skeleton] = skeletonsOf(journey.id);
    testDb
      .prepare('UPDATE journey_entries SET tags = ?, pros_cons = ? WHERE id = ?')
      .run(JSON.stringify(['shrine']), JSON.stringify({ pros: ['quiet'], cons: [] }), skeleton.id);

    const entry = svc.listEntries(journey.id, user.id)!.find((e) => e.id === skeleton.id)!;
    expect(entry.tags).toEqual(['shrine']);
    expect((entry as any).pros_cons).toEqual({ pros: ['quiet'], cons: [] });
    expect((entry as any).source_trip_name).toBe('Japan 2026');
  });

  it('JOURNEY-SVC-ENRICH-002: an entry with no trip and no tags gets [] and null, not undefined', () => {
    const { user } = createUser(testDb);
    const journey = svc.createJourney(user.id, { title: 'J' });
    const created = svc.createEntry(journey.id, user.id, { entry_date: '2026-05-01', title: 'Solo' })!;

    const entry = svc.listEntries(journey.id, user.id)!.find((e) => e.id === created.id)!;
    expect(entry.tags).toEqual([]);
    expect((entry as any).pros_cons).toBeNull();
    expect((entry as any).source_trip_name).toBeNull();
  });
});

// ── GPX tracks on the journey map (#1260) ─────────────────────────────────────
describe('journeyTracks', () => {
  /** A GPX import stores the geometry on the place, as JSON [lat, lng] pairs. */
  const withGeometry = (placeId: number, geometry: unknown, color: string | null = null) =>
    testDb
      .prepare('UPDATE places SET route_geometry = ?, route_color = ? WHERE id = ?')
      .run(typeof geometry === 'string' ? geometry : JSON.stringify(geometry), color, placeId);

  it('JOURNEY-SVC-TRACKS-001: returns the tracks of the trips the entries came from', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(
      place.id,
      [
        [35.1, 135.7],
        [35.2, 135.8],
      ],
      '#ff0000',
    );
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const tracks = svc.journeyTracks(journey.id, user.id)!;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ place_id: place.id, trip_id: trip.id, color: '#ff0000' });
    expect(tracks[0].points).toEqual([
      [35.1, 135.7],
      [35.2, 135.8],
    ]);
  });

  it('JOURNEY-SVC-TRACKS-002: keeps the elevation out and the pair in', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    // The importer keeps elevation as a third value where the file had it.
    withGeometry(place.id, [
      [47.1, 11.2, 1830],
      [47.2, 11.3, 1902],
    ]);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(svc.journeyTracks(journey.id, user.id)![0].points).toEqual([
      [47.1, 11.2],
      [47.2, 11.3],
    ]);
  });

  it('JOURNEY-SVC-TRACKS-003: a place without geometry contributes nothing', () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(svc.journeyTracks(journey.id, user.id)).toEqual([]);
  });

  it('JOURNEY-SVC-TRACKS-004: unusable geometry is skipped, not fatal', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const second = createPlace(testDb, trip.id, { name: 'Good one' });
    withGeometry(place.id, 'not json at all');
    withGeometry(second.id, [
      [1, 2],
      [3, 4],
    ]);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const tracks = svc.journeyTracks(journey.id, user.id)!;
    expect(tracks.map((t) => t.place_id)).toEqual([second.id]);
  });

  it('JOURNEY-SVC-TRACKS-005: a single point is a pin, not a line', () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(place.id, [[35.1, 135.7]]);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(svc.journeyTracks(journey.id, user.id)).toEqual([]);
  });

  it('JOURNEY-SVC-TRACKS-006: a stranger gets null, not another user route', () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(place.id, [
      [1, 2],
      [3, 4],
    ]);
    const journey = svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(svc.journeyTracks(journey.id, stranger.id)).toBeNull();
  });
});

// ── Trip linking: whose journey, and whose photos (#1614 review) ─────────────

describe('addTripToJourney guards', () => {
  it('JOURNEY-SVC-100: refuses to link into a journey the caller cannot reach', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: "Owner's journey" });
    const trip = createTrip(testDb, stranger.id, { title: 'Stranger trip' });

    // The stranger owns the trip, so the trip gate passes — only the journey gate stops this.
    expect(svc.addTripToJourney(journey.id, trip.id, stranger.id)).toBe(false);
    const links = testDb.prepare('SELECT * FROM journey_trips WHERE journey_id = ?').all(journey.id);
    expect(links).toHaveLength(0);
  });

  it('JOURNEY-SVC-101: a contributor may still link, the owner obviously too', () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Shared journey' });
    testDb
      .prepare('INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, ?, ?)')
      .run(journey.id, helper.id, 'editor', new Date().toISOString());
    const trip = createTrip(testDb, helper.id, { title: 'Helper trip' });

    expect(svc.addTripToJourney(journey.id, trip.id, helper.id)).toBe(true);
  });

  it('JOURNEY-SVC-102: not even a shared trip photo is copied any more', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Photo journey' });
    const trip = createTrip(testDb, user.id, { title: 'Photo trip' });

    const r = testDb
      .prepare(
        "INSERT INTO trek_photos (provider, asset_id, owner_id, media_type) VALUES ('immich', 'shared-asset', ?, 'image')",
      )
      .run(user.id);
    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)')
      .run(trip.id, user.id, Number(r.lastInsertRowid));

    svc.addTripToJourney(journey.id, trip.id, user.id);

    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE journey_id = ?').all(journey.id)).toHaveLength(0);
  });
});
