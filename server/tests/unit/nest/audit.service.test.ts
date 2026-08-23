/**
 * Unit tests for the DI-native audit domain — AUDIT-SVC-001 through
 * AUDIT-SVC-017 (001–007 are the getClientIp cases moved 1:1 from the legacy
 * tests/unit/services/auditLog.test.ts, which had no case IDs — the IDs are
 * introduced with the move; 008–014 cover writeAudit over a real in-memory
 * SQLite DB, which the legacy suite never exercised; 015–017 pin the
 * audit.bridge delegation). The logger module is mocked (it replaces the old
 * suite's fs mock: the import-time mkdir lives there now, and mocking it lets
 * the exact log-line formats be asserted).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

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
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import type { Request } from 'express';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { getClientIp } from '../../../src/nest/audit/client-ip';
import { logInfo, logDebug, logError } from '../../../src/nest/audit/audit-log.logger';

const svc = new AuditService(new DatabaseService(testDb));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  testDb.prepare('DELETE FROM audit_log').run();
  testDb.prepare('DELETE FROM users').run();
});

afterAll(() => {
  testDb.close();
});

function makeReq(options: {
  ip?: string;
  xff?: string | string[];
  remoteAddress?: string;
} = {}): Request {
  return {
    ip: options.ip,
    headers: {
      ...(options.xff !== undefined ? { 'x-forwarded-for': options.xff } : {}),
    },
    socket: { remoteAddress: options.remoteAddress ?? undefined },
  } as unknown as Request;
}

// ── getClientIp (pure, moved 1:1) ─────────────────────────────────────────────

describe('getClientIp', () => {
  it('AUDIT-SVC-001: returns req.ip, which Express resolved through the trust-proxy hop count', () => {
    expect(getClientIp(makeReq({ ip: '1.2.3.4', xff: '9.9.9.9, 1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('AUDIT-SVC-002: ignores a hand-written X-Forwarded-For — the leftmost entry is whatever the caller typed', () => {
    expect(getClientIp(makeReq({ ip: '203.0.113.7', xff: '10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('AUDIT-SVC-003: ignores an array-valued X-Forwarded-For too', () => {
    expect(getClientIp(makeReq({ ip: '203.0.113.7', xff: ['203.0.113.1', '10.0.0.1'] }))).toBe('203.0.113.7');
  });

  it('AUDIT-SVC-004: trims whitespace from the resolved IP', () => {
    expect(getClientIp(makeReq({ ip: '  192.168.1.1  ' }))).toBe('192.168.1.1');
  });

  it('AUDIT-SVC-005: falls back to req.socket.remoteAddress when req.ip is unset', () => {
    expect(getClientIp(makeReq({ remoteAddress: '172.16.0.1' }))).toBe('172.16.0.1');
  });

  it('AUDIT-SVC-006: returns null when there is neither a resolved IP nor a socket address', () => {
    expect(getClientIp(makeReq({}))).toBeNull();
  });

  it('AUDIT-SVC-007: returns null for an empty req.ip with no socket address', () => {
    const req = {
      ip: '',
      headers: { 'x-forwarded-for': '203.0.113.9' },
      socket: { remoteAddress: undefined },
    } as unknown as Request;
    expect(getClientIp(req)).toBeNull();
  });
});

// ── writeAudit (real DB) ──────────────────────────────────────────────────────

function seedUser(id: number, email: string): void {
  testDb.prepare(
    "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, 'x', 'user')"
  ).run(id, `u${id}`, email);
}

describe('writeAudit', () => {
  it('AUDIT-SVC-008: inserts the row and logs the labeled summary line', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'trip.create', resource: 'trip', details: { title: 'Rome' }, ip: '1.2.3.4' });
    const row = testDb.prepare('SELECT user_id, action, resource, details, ip FROM audit_log').get();
    expect(row).toEqual({ user_id: 1, action: 'trip.create', resource: 'trip', details: '{"title":"Rome"}', ip: '1.2.3.4' });
    expect(logInfo).toHaveBeenCalledWith('a@b.c created trip "Rome" ip=1.2.3.4');
  });

  it('AUDIT-SVC-009: empty details object stores NULL details and skips the debug fallback', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'user.login', details: {}, ip: '1.2.3.4' });
    const row = testDb.prepare('SELECT details FROM audit_log').get() as { details: string | null };
    expect(row.details).toBeNull();
    expect(logDebug).not.toHaveBeenCalled();
  });

  it('AUDIT-SVC-010: unknown action keeps the raw key; empty-email/zero/null userIds resolve', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'custom.thing', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c custom.thing ip=9.9.9.9');
    seedUser(42, ''); // falsy email → the `row?.email || uid:N` fallback
    svc.writeAudit({ userId: 42, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('uid:42 logged in ip=9.9.9.9');
    seedUser(0, 'zero@b.c'); // since the quirk fix, a real id 0 resolves via the DB
    svc.writeAudit({ userId: 0, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('zero@b.c logged in ip=9.9.9.9');
    svc.writeAudit({ userId: null, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('anonymous logged in ip=9.9.9.9');
  });

  it('AUDIT-SVC-019: a trip title with a line break cannot forge a second log line', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({
      userId: 1,
      action: 'trip.create',
      details: { title: 'Rome\nadmin@b.c changed user role' },
      ip: '1.2.3.4',
    });
    const logged = String((logInfo as unknown as { mock: { calls: string[][] } }).mock.calls.at(-1)?.[0]);
    expect(logged).not.toContain('\n');
    expect(logged).toBe('a@b.c created trip "Rome admin@b.c changed user role" ip=1.2.3.4');
  });

  it('AUDIT-SVC-011: omitted resource/ip store NULL and the log line ends ip=-', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'user.login' });
    const row = testDb.prepare('SELECT resource, ip FROM audit_log').get();
    expect(row).toEqual({ resource: null, ip: null });
    expect(logInfo).toHaveBeenCalledWith('a@b.c logged in ip=-');
  });

  it('AUDIT-SVC-012: debugDetails wins the debug line; detailsJson is the fallback', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'settings.app_update', details: { require_mfa: true }, debugDetails: { raw: 1 } });
    expect(logDebug).toHaveBeenLastCalledWith('AUDIT settings.app_update userId=1 {"raw":1}');
    svc.writeAudit({ userId: 1, action: 'settings.app_update', details: { require_mfa: true } });
    expect(logDebug).toHaveBeenLastCalledWith('AUDIT settings.app_update userId=1 {"require_mfa":true}');
  });

  it('AUDIT-SVC-013: never throws — a failed insert reduces to a logError line', () => {
    testDb.prepare('ALTER TABLE audit_log RENAME TO audit_log_gone').run();
    expect(() => svc.writeAudit({ userId: 1, action: 'user.login' })).not.toThrow();
    expect(logError).toHaveBeenCalledWith(expect.stringMatching(/^Audit write failed: /));
    testDb.prepare('ALTER TABLE audit_log_gone RENAME TO audit_log').run();
  });

  it('AUDIT-SVC-018: settings.api_keys_update names the changed keys and nothing else (#1939)', () => {
    seedUser(1, 'admin@b.c');
    svc.writeAudit({
      userId: 1,
      action: 'settings.api_keys_update',
      resource: 'api_keys',
      details: { changed: ['maps_api_key', 'unsplash_api_key'] },
      ip: '1.2.3.4',
    });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys (maps_api_key, unsplash_api_key) ip=1.2.3.4');
    // A details blob without the array (or with an empty one) leaves the brief off
    // rather than stringifying whatever else is in there.
    svc.writeAudit({ userId: 1, action: 'settings.api_keys_update', details: { changed: [] }, ip: '1.2.3.4' });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys ip=1.2.3.4');
    svc.writeAudit({ userId: 1, action: 'settings.api_keys_update', details: { other: 'x' }, ip: '1.2.3.4' });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys ip=1.2.3.4');
  });

  it('AUDIT-SVC-014: buildInfoSummary variants (settings parts, login empty brief)', () => {
    seedUser(1, 'a@b.c');
    svc.writeAudit({ userId: 1, action: 'settings.app_update', details: { notification_channel: 'smtp', require_mfa: false }, ip: '1.1.1.1' });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c updated settings (channel=smtp, mfa=false) ip=1.1.1.1');
    svc.writeAudit({ userId: 1, action: 'user.login', details: { anything: true }, ip: '1.1.1.1' });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c logged in ip=1.1.1.1');
  });
});

