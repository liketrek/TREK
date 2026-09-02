/**
 * smtp-diagnostics.test.ts
 *
 * The wording an admin gets when a test email does not go out (#2196). Pure
 * functions, no socket and no DB: what is pinned here is that every common SMTP
 * failure comes back as a cause rather than as "failed", and that the credential
 * never rides along.
 */

import { describe, it, expect } from 'vitest';
import {
  describeSmtpFailure,
  describeSmtpGap,
  parseSmtpPort,
  type SmtpTarget,
} from '../../../src/nest/notifications/mailer/smtp-diagnostics';

const PLAIN: SmtpTarget = { host: 'mail.example.com', port: 587, secure: false };
const IMPLICIT_TLS: SmtpTarget = { host: 'mail.example.com', port: 465, secure: true };

/** The nodemailer shape: an Error carrying the SMTP code and the relay's reply. */
function smtpError(message: string, code?: string): Error {
  return code ? Object.assign(new Error(message), { code }) : new Error(message);
}

describe('parseSmtpPort', () => {
  it('SMTPDIAG-001: accepts a port number, with or without surrounding space', () => {
    expect(parseSmtpPort('587')).toBe(587);
    expect(parseSmtpPort(' 465 ')).toBe(465);
    expect(parseSmtpPort('1')).toBe(1);
    expect(parseSmtpPort('65535')).toBe(65535);
  });

  it('SMTPDIAG-002: refuses everything that would reach net.connect as NaN or out of range', () => {
    expect(parseSmtpPort(null)).toBeNull();
    expect(parseSmtpPort(undefined)).toBeNull();
    expect(parseSmtpPort('')).toBeNull();
    expect(parseSmtpPort('smtp.example.com')).toBeNull();
    expect(parseSmtpPort('587abc')).toBeNull();
    expect(parseSmtpPort('58.7')).toBeNull();
    expect(parseSmtpPort('-1')).toBeNull();
    expect(parseSmtpPort('0')).toBeNull();
    expect(parseSmtpPort('65536')).toBeNull();
  });
});

describe('describeSmtpGap', () => {
  it('SMTPDIAG-003: lists every field that is still empty', () => {
    const gap = describeSmtpGap({ host: null, port: null, from: null });

    expect(gap).toContain('SMTP_HOST');
    expect(gap).toContain('SMTP_PORT');
    expect(gap).toContain('SMTP_FROM');
  });

  it('SMTPDIAG-004: names only the one that is missing', () => {
    const gap = describeSmtpGap({ host: 'mail.example.com', port: '587', from: null });

    expect(gap).toContain('SMTP_FROM');
    expect(gap).not.toContain('SMTP_HOST');
  });

  it('SMTPDIAG-005: a port that is not a port is reported as such, not as absent', () => {
    const gap = describeSmtpGap({ host: 'mail.example.com', port: 'ssl', from: null });

    expect(gap).toContain('"ssl"');
    expect(gap).toContain('65535');
    expect(gap).not.toContain('missing');
  });

  it('SMTPDIAG-006: an absurd port value is clipped before it is echoed back', () => {
    const gap = describeSmtpGap({ host: 'mail.example.com', port: 'x'.repeat(500), from: 'a@b.c' });

    expect(gap.length).toBeLessThan(120);
    expect(gap).toContain('...');
  });
});

describe('describeSmtpFailure', () => {
  it('SMTPDIAG-007: a rejected login points at the credentials and keeps the relay reply', () => {
    const failure = describeSmtpFailure(
      smtpError('Invalid login: 535 5.7.8 Username and Password not accepted', 'EAUTH'),
      PLAIN,
    );

    expect(failure.code).toBe('EAUTH');
    expect(failure.reason).toContain('rejected the credentials');
    expect(failure.reason).toContain('535 5.7.8');
  });

  it('SMTPDIAG-008: an unresolvable host is named as DNS', () => {
    const byCode = describeSmtpFailure(smtpError('getaddrinfo failed', 'EDNS'), PLAIN);
    const byMessage = describeSmtpFailure(smtpError('getaddrinfo ENOTFOUND mail.example.com', 'ESOCKET'), PLAIN);

    expect(byCode.reason).toContain('could not be resolved');
    expect(byMessage.reason).toContain('could not be resolved');
  });

  it('SMTPDIAG-009: a refused connection separates "closed port" from "wrong password"', () => {
    const failure = describeSmtpFailure(smtpError('connect ECONNREFUSED 10.0.0.5:587', 'ESOCKET'), PLAIN);

    expect(failure.reason).toContain('refused the connection');
    expect(failure.reason).toContain('mail.example.com:587');
  });

  it('SMTPDIAG-010: an unroutable relay is reported as unreachable', () => {
    const failure = describeSmtpFailure(smtpError('connect EHOSTUNREACH 10.0.0.5:587', 'ESOCKET'), PLAIN);

    expect(failure.reason).toContain('unreachable');
  });

  it('SMTPDIAG-011: a stalled greeting on 465 suggests the STARTTLS port', () => {
    const failure = describeSmtpFailure(smtpError('Greeting never received', 'ETIMEDOUT'), IMPLICIT_TLS);

    expect(failure.reason).toContain('did not answer in time');
    expect(failure.reason).toContain('587');
  });

  it('SMTPDIAG-012: a connection timeout on 587 suggests the implicit-TLS port', () => {
    const failure = describeSmtpFailure(smtpError('Connection timeout', 'ETIMEDOUT'), PLAIN);

    expect(failure.reason).toContain('465');
  });

  it('SMTPDIAG-013: an untrusted certificate points at the skip-verification switch', () => {
    const failure = describeSmtpFailure(
      smtpError('unable to verify the first certificate', 'ESOCKET'),
      IMPLICIT_TLS,
    );

    expect(failure.reason).toContain('Skip TLS certificate check');
  });

  it('SMTPDIAG-014: a handshake against a plain-text port is named as TLS', () => {
    const failure = describeSmtpFailure(
      smtpError('140A:error:0A00010B:SSL routines:ssl3_get_record:wrong version number', 'ESOCKET'),
      IMPLICIT_TLS,
    );

    expect(failure.reason).toContain('TLS handshake');
    expect(failure.reason).toContain('587');
  });

  it('SMTPDIAG-015: a rejected envelope points at the from address', () => {
    const failure = describeSmtpFailure(
      smtpError('Mail command failed: 550 5.7.1 Sender address rejected', 'EENVELOPE'),
      PLAIN,
    );

    expect(failure.reason).toContain('from address');
    expect(failure.reason).toContain('550 5.7.1');
  });

  it('SMTPDIAG-016: a rejected message says the connection itself was fine', () => {
    const failure = describeSmtpFailure(smtpError('Message failed: 552 too large', 'EMESSAGE'), PLAIN);

    expect(failure.reason).toContain('rejected the message');
  });

  it('SMTPDIAG-017: an unclassified failure still carries the code and the message', () => {
    const failure = describeSmtpFailure(smtpError('something odd happened', 'EPROTOCOL'), PLAIN);

    expect(failure.code).toBe('EPROTOCOL');
    expect(failure.reason).toContain('EPROTOCOL');
    expect(failure.reason).toContain('something odd happened');
  });

  it('SMTPDIAG-018: a throw that is not an Error is still described', () => {
    const failure = describeSmtpFailure('boom', PLAIN);

    expect(failure.code).toBe('UNKNOWN');
    expect(failure.reason).toContain('boom');
  });

  it('SMTPDIAG-019: the password is redacted wherever it turns up in the message', () => {
    const failure = describeSmtpFailure(
      smtpError('Invalid login for user with correct-horse-battery', 'EAUTH'),
      PLAIN,
      'correct-horse-battery',
    );

    expect(failure.reason).not.toContain('correct-horse-battery');
    expect(failure.reason).toContain('***');
  });

  it('SMTPDIAG-020: a secret too short to be one is left alone rather than blanking the text', () => {
    const failure = describeSmtpFailure(smtpError('bad login at a b c', 'EAUTH'), PLAIN, 'a b');

    expect(failure.reason).toContain('bad login at a b c');
  });

  it('SMTPDIAG-021: a runaway relay reply is collapsed and clipped', () => {
    const failure = describeSmtpFailure(smtpError(`550 ${'x'.repeat(2000)}`, 'EENVELOPE'), PLAIN);

    expect(failure.reason.length).toBeLessThan(700);
    expect(failure.reason).toContain('...');
  });

  it('SMTPDIAG-022: newlines in a multi-line reply become one readable line', () => {
    const failure = describeSmtpFailure(smtpError('550 first\n  550 second', 'EENVELOPE'), PLAIN);

    expect(failure.reason).toContain('550 first 550 second');
  });
});
