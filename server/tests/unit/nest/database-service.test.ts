/**
 * DatabaseService — the shared better-sqlite3 provider (F3). Exercises every
 * helper against the real connection so the typed query surface is covered.
 */
import { describe, it, expect } from 'vitest';
import { DatabaseService } from '../../../src/nest/database/database.service';

describe('DatabaseService (typed query helpers)', () => {
  const svc = new DatabaseService();

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
