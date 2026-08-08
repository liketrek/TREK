/**
 * DatabaseService — the shared better-sqlite3 provider (F3). Exercises every
 * helper against the real connection so the typed query surface is covered.
 */
import { describe, it, expect } from 'vitest';
import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';

describe('DatabaseService (typed query helpers)', () => {
  const svc = new DatabaseService(db);

  it('exposes the shared connection', () => {
    expect(typeof svc.connection.prepare).toBe('function');
  });

  it('prepare + get + all return rows from the live connection', () => {
    expect(svc.prepare('SELECT 1 AS one').get()).toEqual({ one: 1 });
    expect(svc.get('SELECT 2 AS two')).toEqual({ two: 2 });
    expect(svc.all('SELECT 3 AS three')).toEqual([{ three: 3 }]);
  });

  it('run + transaction operate on a scratch table', () => {
    svc.run('CREATE TEMP TABLE IF NOT EXISTS _dbsvc_test (n INTEGER)');
    svc.run('DELETE FROM _dbsvc_test');

    const info = svc.run('INSERT INTO _dbsvc_test (n) VALUES (?)', 41);
    expect(info.changes).toBe(1);

    const total = svc.transaction((conn) => {
      conn.prepare('INSERT INTO _dbsvc_test (n) VALUES (?)').run(1);
      return conn.prepare('SELECT SUM(n) AS s FROM _dbsvc_test').get() as { s: number };
    });
    expect(total.s).toBe(42);

    svc.run('DROP TABLE _dbsvc_test');
  });
});

describe('DatabaseService (trip-access helpers)', () => {
  const svc = new DatabaseService(db);

  it('canAccessTrip / isOwner / getPlaceWithTags delegate to the shared helpers', () => {
    svc.run(
      "INSERT INTO users (id, username, email, password_hash) VALUES (900, 'dbsvc-owner', 'dbsvc-owner@x.test', 'x')"
    );
    svc.run(
      "INSERT INTO users (id, username, email, password_hash) VALUES (901, 'dbsvc-member', 'dbsvc-member@x.test', 'x')"
    );
    svc.run("INSERT INTO trips (id, user_id, title) VALUES (900, 900, 'DbSvc Trip')");
    svc.run("INSERT INTO trip_members (trip_id, user_id) VALUES (900, 901)");

    expect(svc.canAccessTrip(900, 900)).toMatchObject({ id: 900, user_id: 900 });
    expect(svc.canAccessTrip(900, 901)).toMatchObject({ id: 900 });
    expect(svc.canAccessTrip(900, 999)).toBeUndefined();

    expect(svc.isOwner(900, 900)).toBe(true);
    expect(svc.isOwner(900, 901)).toBe(false);

    expect(svc.getPlaceWithTags(999999)).toBeNull();
    svc.run("INSERT INTO places (id, trip_id, name) VALUES (900, 900, 'DbSvc Place')");
    expect(svc.getPlaceWithTags(900)).toMatchObject({
      id: 900,
      name: 'DbSvc Place',
      category: null,
      tags: [],
      ratings: [],
      rating_avg: null,
      rating_count: 0,
    });

    svc.run('DELETE FROM trips WHERE id = 900');
    svc.run('DELETE FROM users WHERE id IN (900, 901)');
  });
});
