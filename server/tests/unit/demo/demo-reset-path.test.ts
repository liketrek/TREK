/**
 * Structural guard for demo-reset's DB path.
 *
 * demo-reset closes the live connection, copies the baseline over the database
 * file and reopens. It used to compute that file itself as data/travel.db, which
 * is wrong the moment TREK_DB_FILE moves the database elsewhere: the baseline
 * lands on an unrelated file and the real database is never reset. The path has
 * to come from the connection that database.ts actually opened.
 *
 * It is pinned on the source rather than executed because demo-reset resolves
 * ../db/database through a runtime require() (the module is a boot-time
 * singleton), which vitest's module runner cannot resolve.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'demo', 'demo-reset.ts'), 'utf8');

describe('demo-reset DB path', () => {
  it('DEMORESET-001: never hardcodes the default travel.db path', () => {
    expect(source).not.toContain("'travel.db'");
  });

  it('DEMORESET-002: takes the path from the open connection', () => {
    expect(source).toContain('db.name');
    // Both entry points, not just one of them.
    const uses = source.match(/liveDbPath\(db\)/g) ?? [];
    expect(uses.length).toBe(2);
  });

  it('DEMORESET-003: keeps the baseline next to the data directory', () => {
    expect(source).toContain("path.join(dataDir, 'travel-baseline.db')");
  });

  it('DEMORESET-004: bails out on an in-memory database instead of copying files', () => {
    const guards = source.match(/=== ':memory:'/g) ?? [];
    expect(guards.length).toBe(2);
  });
});
