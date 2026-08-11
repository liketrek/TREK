/**
 * Migration test for incoming_leg_transport_mode on day_assignments.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const Database = require('better-sqlite3');

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';

let testDb: any;

beforeAll(() => {
  testDb = new Database(':memory:');
  testDb.exec('PRAGMA journal_mode = WAL');
  testDb.exec('PRAGMA foreign_keys = ON');
  createTables(testDb);
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('incoming_leg_transport_mode migration', () => {
  it('adds a nullable incoming_leg_transport_mode column to day_assignments', () => {
    const cols = testDb.prepare(`PRAGMA table_info(day_assignments)`).all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('incoming_leg_transport_mode');
  });
});
