/**
 * mailer.service.test.ts
 *
 * Covers the SMTP transport options MailerService hands to nodemailer, and in
 * particular the skip-TLS opt-out: it must stay reachable for operators behind an
 * internal relay, and it must announce itself instead of downgrading quietly.
 * The second half covers what the admin sees when a send goes wrong (#2196):
 * bounded phases, a classified reason in the response, a line in the log, and
 * the password in neither.
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
import { logError, logInfo, logWarn } from '../../../src/nest/audit/audit-log.logger';

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

  it('MAILER-007: every SMTP phase is bounded, so a dead relay fails instead of hanging', async () => {
    configureSmtp();

    await newMailer().sendEmail('someone@example.com', 'Subject', 'Body');

    // Nodemailer's own defaults (120s / 30s / 600s) all outlive the client's 8s
    // API timeout, which is how #2196 produced a failure nobody could read.
    expect(lastTransportOptions()).toMatchObject({
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
  });
});

describe('MailerService test send', () => {
  /** The nodemailer shape: an Error carrying the SMTP code and the relay's reply. */
  function smtpError(message: string, code: string): Error {
    return Object.assign(new Error(message), { code });
  }

  it('MAILER-008: an incomplete configuration names the fields that are missing', async () => {
    setAppSetting('smtp_host', 'mail.internal.example');
    setAppSetting('smtp_port', '587');

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('SMTP_FROM');
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('MAILER-009: an unusable port is refused before anything reaches a socket', async () => {
    setAppSetting('smtp_host', 'mail.internal.example');
    setAppSetting('smtp_port', 'smtp.example.com');
    setAppSetting('smtp_from', 'trek@example.com');

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('smtp.example.com');
    expect(result.error).toContain('65535');
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('MAILER-010: a rejected login comes back as a reason, not as a bare failure', async () => {
    configureSmtp();
    sendMail.mockRejectedValueOnce(smtpError('Invalid login: 535 5.7.8 Username and Password not accepted', 'EAUTH'));

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('rejected the credentials');
    expect(result.error).toContain('535 5.7.8');
  });

  it('MAILER-011: a refused connection is classified and reaches the log with its code', async () => {
    configureSmtp();
    sendMail.mockRejectedValueOnce(smtpError('connect ECONNREFUSED 10.0.0.5:587', 'ESOCKET'));

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.error).toContain('refused the connection');
    expect(logError).toHaveBeenCalledTimes(1);
    const line = vi.mocked(logError).mock.calls[0][0];
    expect(line).toContain('SMTP test email failed to=admin@example.com');
    expect(line).toContain('smtp=mail.internal.example:587');
    expect(line).toContain('code=ESOCKET');
  });

  it('MAILER-012: a stalled relay is named as a timeout and points at the 465/587 split', async () => {
    setAppSetting('smtp_host', 'mail.internal.example');
    setAppSetting('smtp_port', '465');
    setAppSetting('smtp_from', 'trek@example.com');
    sendMail.mockRejectedValueOnce(smtpError('Greeting never received', 'ETIMEDOUT'));

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.error).toContain('did not answer in time');
    expect(result.error).toContain('587');
  });

  it('MAILER-013: the password appears in neither the response nor the log', async () => {
    configureSmtp();
    setAppSetting('smtp_user', 'trek@example.com');
    setAppSetting('smtp_pass', 'correct-horse-battery');
    sendMail.mockRejectedValueOnce(smtpError('Invalid login for correct-horse-battery', 'EAUTH'));

    const result = await newMailer().testSmtp('admin@example.com');

    expect(result.error).not.toContain('correct-horse-battery');
    expect(vi.mocked(logError).mock.calls[0][0]).not.toContain('correct-horse-battery');
  });

  it('MAILER-014: a successful test leaves a line in the log naming the relay', async () => {
    configureSmtp();

    expect(await newMailer().testSmtp('admin@example.com')).toEqual({ success: true });

    const lines = vi.mocked(logInfo).mock.calls.map(call => call[0]);
    expect(lines.some(line => line.includes('SMTP test email sent to=admin@example.com smtp=mail.internal.example:587'))).toBe(true);
  });
});
