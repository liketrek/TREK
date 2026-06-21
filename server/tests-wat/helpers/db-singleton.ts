// Shared in-memory SQLite DB for the Jest server tests.
// A test mocks the db module with this singleton:
//   import { db } from '../helpers/db-singleton';
//   jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
//
// It only imports schema + migrations (which take a db param), not the upstream
// tests/helpers/test-db, because that pulls in app code that requires the mocked
// db module and would re-enter this file before its exports exist.
import Database from 'better-sqlite3';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';

const DEFAULT_CATEGORIES = [
  { name: 'Hotel', color: '#3b82f6', icon: '🏨' },
  { name: 'Restaurant', color: '#ef4444', icon: '🍽️' },
  { name: 'Attraction', color: '#8b5cf6', icon: '🏛️' },
  { name: 'Shopping', color: '#f59e0b', icon: '🛍️' },
  { name: 'Transport', color: '#6b7280', icon: '🚌' },
  { name: 'Activity', color: '#10b981', icon: '🎯' },
  { name: 'Bar/Cafe', color: '#f97316', icon: '☕' },
  { name: 'Beach', color: '#06b6d4', icon: '🏖️' },
  { name: 'Nature', color: '#84cc16', icon: '🌿' },
  { name: 'Other', color: '#6366f1', icon: '📍' },
];

const DEFAULT_ADDONS = [
  { id: 'packing', name: 'Packing List', description: 'Pack your bags', type: 'trip', icon: 'ListChecks', enabled: 1, sort_order: 0 },
  { id: 'budget', name: 'Costs', description: 'Track and split trip expenses', type: 'trip', icon: 'Wallet', enabled: 1, sort_order: 1 },
  { id: 'documents', name: 'Documents', description: 'Manage travel documents', type: 'trip', icon: 'FileText', enabled: 1, sort_order: 2 },
  { id: 'vacay', name: 'Vacay', description: 'Vacation day planner', type: 'global', icon: 'CalendarDays', enabled: 1, sort_order: 10 },
  { id: 'atlas', name: 'Atlas', description: 'Visited countries map', type: 'global', icon: 'Globe', enabled: 1, sort_order: 11 },
  { id: 'mcp', name: 'MCP', description: 'AI assistant integration', type: 'integration', icon: 'Terminal', enabled: 0, sort_order: 12 },
  { id: 'collab', name: 'Collab', description: 'Notes, polls, live chat', type: 'trip', icon: 'Users', enabled: 1, sort_order: 6 },
];

function seedDefaults(d: Database.Database): void {
  const insertCat = d.prepare('INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)');
  for (const c of DEFAULT_CATEGORIES) {
    insertCat.run(c.name, c.color, c.icon);
  }
  const insertAddon = d.prepare('INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const a of DEFAULT_ADDONS) {
    insertAddon.run(a.id, a.name, a.description, a.type, a.icon, a.enabled, a.sort_order);
  }
}

function createDb(): Database.Database {
  const d = new Database(':memory:');
  d.exec('PRAGMA journal_mode = WAL');
  d.exec('PRAGMA busy_timeout = 5000');
  d.exec('PRAGMA foreign_keys = ON');
  createTables(d);
  runMigrations(d);
  seedDefaults(d);
  return d;
}

export const db = createDb();

// Same export shape as src/db/database.
export const dbMock = {
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: (placeId: number | string) => {
    const place = db
      .prepare(
        `SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
      )
      .get(placeId) as Record<string, unknown> | undefined;
    if (!place) return null;
    const tags = db
      .prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`)
      .all(placeId);
    return {
      ...place,
      category: place.category_id
        ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon }
        : null,
      tags,
    };
  },
  canAccessTrip: (tripId: number | string, userId: number) =>
    db
      .prepare(
        `SELECT t.id, t.user_id FROM trips t
         LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
         WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`,
      )
      .get(userId, tripId, userId),
  isOwner: (tripId: number | string, userId: number) =>
    !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
};
