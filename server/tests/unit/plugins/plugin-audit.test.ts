/**
 * Host-side capability audit log (#plugins, L1 hardening): resource projection,
 * which methods are auditable, and the per-plugin hash chain.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { appendAudit, readAudit, auditResource, isAuditable } from '../../../src/nest/plugins/host/plugin-audit';

function makeDb() {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE plugin_capability_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT NOT NULL, acting_user_id INTEGER,
    method TEXT NOT NULL, resource TEXT, code TEXT NOT NULL, ts TEXT NOT NULL,
    prev_hash TEXT, hash TEXT NOT NULL);`);
  return db;
}

describe('auditResource + isAuditable', () => {
  it('projects a resource key from method + params (never raw params)', () => {
    expect(auditResource('trips.getById', { tripId: 12 })).toBe('trip:12');
    expect(auditResource('users.getById', { id: 3 })).toBe('user:3');
    expect(auditResource('ws.broadcastToTrip', { tripId: 7 })).toBe('trip:7');
    expect(auditResource('ws.broadcastToUser', { userId: 9 })).toBe('user:9');
    expect(auditResource('db.query', { sql: 'x' })).toBeNull();
  });

  it('audits core-data + ws, not a plugin own-db call', () => {
    expect(isAuditable('trips.getReservations')).toBe(true);
    expect(isAuditable('users.getById')).toBe(true);
    expect(isAuditable('packing.list')).toBe(true);
    expect(isAuditable('files.list')).toBe(true);
    expect(isAuditable('ws.broadcastToTrip')).toBe(true);
    expect(isAuditable('db.query')).toBe(false);
    expect(isAuditable('db.migrate')).toBe(false);
  });

  it('resolves packing/files reads to their trip resource', () => {
    expect(auditResource('packing.list', { tripId: 3 })).toBe('trip:3');
    expect(auditResource('files.list', { tripId: 3 })).toBe('trip:3');
  });
});

describe('appendAudit hash chain', () => {
  let db: ReturnType<typeof makeDb>;
  beforeEach(() => { db = makeDb(); });

  it('chains each entry off the previous hash (per plugin)', () => {
    appendAudit(db, { pluginId: 'p', actingUserId: 42, method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    appendAudit(db, { pluginId: 'p', actingUserId: 42, method: 'trips.getById', resource: 'trip:2', code: 'ok' });
    const rows = db.prepare('SELECT prev_hash, hash FROM plugin_capability_audit ORDER BY id').all() as Array<{ prev_hash: string | null; hash: string }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].prev_hash).toBeNull();
    expect(rows[1].prev_hash).toBe(rows[0].hash); // chain links
    expect(rows[1].hash).not.toBe(rows[0].hash);
  });

  it('keeps separate chains per plugin', () => {
    appendAudit(db, { pluginId: 'a', method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    appendAudit(db, { pluginId: 'b', method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    const a = db.prepare("SELECT prev_hash FROM plugin_capability_audit WHERE plugin_id='b'").get() as { prev_hash: string | null };
    expect(a.prev_hash).toBeNull(); // b's first entry doesn't chain off a's
  });

  it('records denials too (code is the error code)', () => {
    appendAudit(db, { pluginId: 'p', actingUserId: 99, method: 'trips.getById', resource: 'trip:1', code: 'RESOURCE_FORBIDDEN' });
    const row = readAudit(db, 'p')[0] as { code: string; method: string };
    expect(row.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('readAudit returns newest first with the projected fields only', () => {
    appendAudit(db, { pluginId: 'p', actingUserId: 42, method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    const rows = readAudit(db, 'p') as Array<Record<string, unknown>>;
    expect(rows[0]).toHaveProperty('method', 'trips.getById');
    expect(rows[0]).not.toHaveProperty('prev_hash'); // internal chain fields not exposed
  });
});
