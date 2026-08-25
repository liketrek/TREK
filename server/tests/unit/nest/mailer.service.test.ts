/**
 * mailer.service.test.ts
 *
 * Covers the SMTP transport options MailerService hands to nodemailer, and in
 * particular the skip-TLS opt-out: it must stay reachable for operators behind an
 * internal relay, and it must announce itself instead of downgrading quietly.
 * Constructed directly (no TestingModule, repo convention).
 */

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
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

const { sendMail, createTransport } = vi.hoisted(() => {
  const send = vi.fn().mockResolvedValue({ messageId: 'test' });
  return {
    sendMail: send,
    createTransport: vi.fn((_options: Record<string, unknown>) => ({ sendMail: send })),
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { logWarn } from '../../../src/nest/audit/audit-log.logger';

function setAppSetting(key: string, value: string): void {
  testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

/** The minimum that makes getSmtpConfig() return a config instead of null. */
function configureSmtp(): void {
  setAppSetting('smtp_host', 'mail.internal.example');
  setAppSetting('smtp_port', '587');
  setAppSetting('smtp_from', 'trek@example.com');
}

function newMailer(): MailerService {
  return new MailerService(new DatabaseService(testDb));
}

/** The options object of the most recent nodemailer.createTransport() call. */
function lastTransportOptions(): Record<string, unknown> {
  const calls = createTransport.mock.calls;
  return calls[calls.length - 1][0] as Record<string, unknown>;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});

afterAll(() => {
  testDb.close();
});

describe('MailerService TLS options', () => {
  it('MAILER-001: leaves certificate verification on by default', async () => {
    configureSmtp();

    expect(await newMailer().sendEmail('someone@example.com', 'Subject', 'Body')).toBe(true);

    expect(lastTransportOptions()).not.toHaveProperty('tls');
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('MAILER-002: the smtp_skip_tls_verify setting turns verification off', async () => {
    configureSmtp();
    setAppSetting('smtp_skip_tls_verify', 'true');

    await newMailer().sendEmail('someone@example.com', 'Subject', 'Body');

    expect(lastTransportOptions().tls).toEqual({ rejectUnauthorized: false });
  });

  it('MAILER-003: anything other than "true" leaves verification on', async () => {
    configureSmtp();
    setAppSetting('smtp_skip_tls_verify', 'false');

    await newMailer().sendEmail('someone@example.com', 'Subject', 'Body');

    expect(lastTransportOptions()).not.toHaveProperty('tls');
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('MAILER-004: skipping verification is announced, and names the host it applies to', async () => {
    configureSmtp();
    setAppSetting('smtp_skip_tls_verify', 'true');

    await newMailer().sendEmail('someone@example.com', 'Subject', 'Body');

    expect(logWarn).toHaveBeenCalledTimes(1);
    const warning = vi.mocked(logWarn).mock.calls[0][0];
    expect(warning).toContain('mail.internal.example:587');
    expect(warning).toContain('SECURITY');
  });

  it('MAILER-005: the warning is logged once per process, not once per mail', async () => {
    configureSmtp();
    setAppSetting('smtp_skip_tls_verify', 'true');
    const mailer = newMailer();

    await mailer.sendEmail('first@example.com', 'One', 'Body');
    await mailer.sendEmail('second@example.com', 'Two', 'Body');
    await mailer.sendPasswordResetEmail('third@example.com', 'https://trek.example/reset', null);

    expect(createTransport).toHaveBeenCalledTimes(3);
    expect(logWarn).toHaveBeenCalledTimes(1);
  });

  it('MAILER-006: a send with no SMTP configured builds no transport at all', async () => {
    expect(await newMailer().sendEmail('someone@example.com', 'Subject', 'Body')).toBe(false);

    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
