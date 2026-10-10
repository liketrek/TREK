/**
 * Unit tests for the DI-native audit domain — AUDIT-SVC-001 through
 * AUDIT-SVC-019 (001–007 are the getClientIp cases moved 1:1 from the legacy
 * tests/unit/services/auditLog.test.ts, which had no case IDs — the IDs are
 * introduced with the move; 008–014, 018, 019 cover writeAudit over a real
 * in-memory SQLite DB through AuditLogRepository/UsersRepository, which the
 * legacy suite never exercised). The logger module is mocked (it replaces the
 * old suite's fs mock: the import-time mkdir lives there now, and mocking it
 * lets the exact log-line formats be asserted).
 */
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { AuditLogRepository } from '../../../src/db/repositories/AuditLog.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { logInfo, logDebug, logError } from '../../../src/nest/audit/audit-log.logger';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { getClientIp } from '../../../src/nest/audit/client-ip';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { deleteRows, findRow, insertRow } from '../../helpers/factories/rows';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { ValidationError } from '@mikro-orm/core';

import type { Request } from 'express';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const testDb = createSnapshotTestDb();

let t: TestOrm;
let auditLogRepo: AuditLogRepository;
let usersRepo: UsersRepository;
let svc: AuditService;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  auditLogRepo = t.repo(AuditLog);
  usersRepo = t.repo(Users);
  svc = new AuditService(auditLogRepo, usersRepo);
});

beforeEach(async () => {
  vi.clearAllMocks();
  await deleteRows(t, AuditLog);
  await deleteRows(t, Users);
  t.clear();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

function makeReq(
  options: {
    ip?: string;
    xff?: string | string[];
    remoteAddress?: string;
  } = {},
): Request {
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

// ── writeAudit (real DB, through the repositories) ────────────────────────────

async function seedUser(id: number, email: string): Promise<void> {
  await insertRow(t, Users, { id, username: `u${id}`, email, password_hash: 'x', role: 'user' });
}

/** The one audit row the case wrote. */
async function auditRow() {
  const row = await findRow(t, AuditLog, {});
  if (!row) throw new Error('no audit row was written');
  return row;
}

describe('writeAudit', () => {
  it('AUDIT-SVC-008: inserts the row and logs the labeled summary line', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({
      userId: 1,
      action: 'trip.create',
      resource: 'trip',
      details: { title: 'Rome' },
      ip: '1.2.3.4',
    });
    const row = await auditRow();
    expect({
      user_id: row.user_id,
      action: row.action,
      resource: row.resource,
      details: row.details,
      ip: row.ip,
    }).toEqual({
      user_id: 1,
      action: 'trip.create',
      resource: 'trip',
      details: '{"title":"Rome"}',
      ip: '1.2.3.4',
    });
    expect(logInfo).toHaveBeenCalledWith('a@b.c created trip "Rome" ip=1.2.3.4');
  });

  it('AUDIT-SVC-009: empty details object stores NULL details and skips the debug fallback', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({ userId: 1, action: 'user.login', details: {}, ip: '1.2.3.4' });
    const row = await auditRow();
    expect(row.details).toBeNull();
    expect(logDebug).not.toHaveBeenCalled();
  });

  it('AUDIT-SVC-010: unknown action keeps the raw key; empty-email/zero/null userIds resolve', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({ userId: 1, action: 'custom.thing', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c custom.thing ip=9.9.9.9');
    await seedUser(42, ''); // falsy email → the `row?.email || uid:N` fallback
    await svc.writeAudit({ userId: 42, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('uid:42 logged in ip=9.9.9.9');
    await seedUser(0, 'zero@b.c'); // since the quirk fix, a real id 0 resolves via the DB
    await svc.writeAudit({ userId: 0, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('zero@b.c logged in ip=9.9.9.9');
    await svc.writeAudit({ userId: null, action: 'user.login', ip: '9.9.9.9' });
    expect(logInfo).toHaveBeenLastCalledWith('anonymous logged in ip=9.9.9.9');
  });

  it('AUDIT-SVC-019: a trip title with a line break cannot forge a second log line', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({
      userId: 1,
      action: 'trip.create',
      details: { title: 'Rome\nadmin@b.c changed user role' },
      ip: '1.2.3.4',
    });
    const logged = String((logInfo as unknown as { mock: { calls: string[][] } }).mock.calls.at(-1)?.[0]);
    expect(logged).not.toContain('\n');
    expect(logged).toBe('a@b.c created trip "Rome admin@b.c changed user role" ip=1.2.3.4');
  });

  it('AUDIT-SVC-011: omitted resource/ip store NULL and the log line ends ip=-', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({ userId: 1, action: 'user.login' });
    const row = await auditRow();
    expect({ resource: row.resource, ip: row.ip }).toEqual({ resource: null, ip: null });
    expect(logInfo).toHaveBeenCalledWith('a@b.c logged in ip=-');
  });

  it('AUDIT-SVC-012: debugDetails wins the debug line; detailsJson is the fallback', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({
      userId: 1,
      action: 'settings.app_update',
      details: { require_mfa: true },
      debugDetails: { raw: 1 },
    });
    expect(logDebug).toHaveBeenLastCalledWith('AUDIT settings.app_update userId=1 {"raw":1}');
    await svc.writeAudit({ userId: 1, action: 'settings.app_update', details: { require_mfa: true } });
    expect(logDebug).toHaveBeenLastCalledWith('AUDIT settings.app_update userId=1 {"require_mfa":true}');
  });

  it('AUDIT-SVC-013: never throws — a failed insert reduces to a logError line', async () => {
    const spy = vi.spyOn(auditLogRepo, 'insertEntry').mockRejectedValueOnce(new Error('insert failed'));
    await expect(svc.writeAudit({ userId: 1, action: 'user.login' })).resolves.not.toThrow();
    expect(logError).toHaveBeenCalledWith('Audit write failed: insert failed');
    spy.mockRestore();
  });

  it('AUDIT-SVC-020: a MikroORM ValidationError from insertEntry still never throws, but is logged with a message distinct from a normal write failure (task-6-fix-brief.md item 4)', async () => {
    const spy = vi.spyOn(auditLogRepo, 'insertEntry').mockRejectedValueOnce(ValidationError.cannotUseGlobalContext());
    await expect(svc.writeAudit({ userId: 1, action: 'user.login' })).resolves.not.toThrow();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('Audit write ran with no request context'));
    expect(logError).not.toHaveBeenCalledWith(expect.stringContaining('Audit write failed:'));
    spy.mockRestore();
  });

  it('AUDIT-SVC-021: a MikroORM ValidationError from the email lookup still resolves to uid:<id>, but is logged with a distinct message', async () => {
    await seedUser(1, 'a@b.c');
    const spy = vi.spyOn(usersRepo, 'getEmail').mockRejectedValueOnce(ValidationError.cannotUseGlobalContext());
    await svc.writeAudit({ userId: 1, action: 'user.login' });
    expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('uid:1 logged in'));
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('Audit email lookup ran with no request context'));
    spy.mockRestore();
  });

  it('AUDIT-SVC-018: settings.api_keys_update names the changed keys and nothing else (#1939)', async () => {
    await seedUser(1, 'admin@b.c');
    await svc.writeAudit({
      userId: 1,
      action: 'settings.api_keys_update',
      resource: 'api_keys',
      details: { changed: ['maps_api_key', 'unsplash_api_key'] },
      ip: '1.2.3.4',
    });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys (maps_api_key, unsplash_api_key) ip=1.2.3.4');
    // A details blob without the array (or with an empty one) leaves the brief off
    // rather than stringifying whatever else is in there.
    await svc.writeAudit({ userId: 1, action: 'settings.api_keys_update', details: { changed: [] }, ip: '1.2.3.4' });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys ip=1.2.3.4');
    await svc.writeAudit({ userId: 1, action: 'settings.api_keys_update', details: { other: 'x' }, ip: '1.2.3.4' });
    expect(logInfo).toHaveBeenLastCalledWith('admin@b.c updated API keys ip=1.2.3.4');
  });

  it('AUDIT-SVC-014: buildInfoSummary variants (settings parts, login empty brief)', async () => {
    await seedUser(1, 'a@b.c');
    await svc.writeAudit({
      userId: 1,
      action: 'settings.app_update',
      details: { notification_channel: 'smtp', require_mfa: false },
      ip: '1.1.1.1',
    });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c updated settings (channel=smtp, mfa=false) ip=1.1.1.1');
    await svc.writeAudit({ userId: 1, action: 'user.login', details: { anything: true }, ip: '1.1.1.1' });
    expect(logInfo).toHaveBeenLastCalledWith('a@b.c logged in ip=1.1.1.1');
  });
});
