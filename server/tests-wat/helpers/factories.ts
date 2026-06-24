// Test data factories — write straight into the shared in-memory db-singleton.
import { db } from './db-singleton';

let userSeq = 0;
let tripSeq = 0;

export interface TestUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface TestTrip {
  id: number;
  user_id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  currency: string;
}

// Truncate everything except the seeded reference rows. Generic so it survives schema changes.
const KEEP_TABLES = new Set(['categories', 'addons', 'photo_providers', 'photo_provider_fields', 'schema_version']);

export function resetDb(): void {
  db.exec('PRAGMA foreign_keys = OFF');
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[])
    .map((r) => r.name)
    .filter((name) => !name.startsWith('sqlite_') && !KEEP_TABLES.has(name));
  for (const table of tables) db.exec(`DELETE FROM "${table}"`);
  db.exec('PRAGMA foreign_keys = ON');
}

export function createUser(overrides: Partial<{ username: string; email: string; role: 'admin' | 'user' }> = {}): TestUser {
  userSeq++;
  const username = overrides.username ?? `user_${userSeq}`;
  const email = overrides.email ?? `user_${userSeq}@test.local`;
  const role = overrides.role ?? 'user';
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(username, email, 'x', role);
  return db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(result.lastInsertRowid) as TestUser;
}

export function createTrip(
  userId: number,
  overrides: Partial<{ title: string; start_date: string | null; end_date: string | null; currency: string }> = {},
): TestTrip {
  tripSeq++;
  const result = db
    .prepare('INSERT INTO trips (user_id, title, start_date, end_date, currency) VALUES (?, ?, ?, ?, ?)')
    .run(
      userId,
      overrides.title ?? `Test Trip ${tripSeq}`,
      overrides.start_date ?? null,
      overrides.end_date ?? null,
      overrides.currency ?? 'EUR',
    );
  return db.prepare('SELECT id, user_id, title, start_date, end_date, currency FROM trips WHERE id = ?').get(result.lastInsertRowid) as TestTrip;
}

export function addTripMember(tripId: number, userId: number): void {
  db.prepare('INSERT OR IGNORE INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, userId);
}

export function createPlace(tripId: number, overrides: Partial<{ name: string; lat: number; lng: number }> = {}): { id: number; name: string } {
  const result = db
    .prepare('INSERT INTO places (trip_id, name, lat, lng) VALUES (?, ?, ?, ?)')
    .run(tripId, overrides.name ?? 'Test Place', overrides.lat ?? 48.2082, overrides.lng ?? 16.3738);
  return db.prepare('SELECT id, name FROM places WHERE id = ?').get(result.lastInsertRowid) as { id: number; name: string };
}

// Inserts a budget item directly so settlement tests can compose any members/payers shape.
export function createBudgetItem(
  tripId: number,
  overrides: Partial<{ category: string; name: string; total_price: number; currency: string | null }> = {},
): { id: number } {
  const result = db
    .prepare('INSERT INTO budget_items (trip_id, category, name, total_price, currency) VALUES (?, ?, ?, ?, ?)')
    .run(tripId, overrides.category ?? 'other', overrides.name ?? 'Test Expense', overrides.total_price ?? 0, overrides.currency ?? null);
  return { id: Number(result.lastInsertRowid) };
}

export function addBudgetMember(itemId: number, userId: number, paid = false): void {
  db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid) VALUES (?, ?, ?)').run(itemId, userId, paid ? 1 : 0);
}

export function addBudgetPayer(itemId: number, userId: number, amount: number): void {
  db.prepare('INSERT OR IGNORE INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?, ?, ?)').run(itemId, userId, amount);
}
