/**
 * The mail import's pure pieces: what a mail is before anything reads it, a
 * signed sender as a hint, a price read to the cent or not at all, the
 * address token, and the sealed mail.
 */
import { walkMail } from '../../../../src/nest/llm-parse/mime-walker';
import { addressOf, classifyMail, senderVerified } from '../../../../src/nest/mail-ingest/mail-classify';
import { hashToken, newToken, tokenOf } from '../../../../src/nest/mail-ingest/mail-ingest-address.service';
import { parsePriceMinor } from '../../../../src/nest/mail-ingest/mail-money';
import { openMail, sealMail } from '../../../../src/nest/mail-ingest/mail-seal';

import { describe, expect, it } from 'vitest';

/** A mail with the given headers and body, as the walker reads it. */
function mail(headers: Record<string, string>, body: string) {
  const head = Object.entries({ From: 'Mia <mia@example.com>', Subject: 'Hello', ...headers })
    .map(([name, value]) => `${name}: ${value}`)
    .join('\r\n');
  const walked = walkMail(Buffer.from(`${head}\r\nContent-Type: text/plain\r\n\r\n${body}`));
  if (!walked) throw new Error('the fixture is no mail');
  return walked;
}

const BOOKING_BODY = 'Your booking ABC123 is confirmed. Flight LH 716 on 2030-03-02.';

describe('classifyMail', () => {
  it('reads a booking mail', () => {
    expect(classifyMail(mail({ Subject: 'Your flight' }, BOOKING_BODY))).toEqual({ kind: 'read' });
  });

  it('shows the code of a forwarding confirmation and clicks nothing', () => {
    const gmail = mail(
      { From: 'forwarding-noreply@google.com', Subject: '(#123) Gmail Forwarding Confirmation' },
      'Confirmation code: 612345678. To allow forwarding, click the link.',
    );
    expect(classifyMail(gmail)).toEqual({ kind: 'forwarding_confirmation', code: '612345678' });
  });

  it('drops an automatic reply, but not a confirmation a booking system generated', () => {
    expect(classifyMail(mail({ 'Auto-Submitted': 'auto-replied' }, BOOKING_BODY))).toEqual({
      kind: 'drop',
      reason: 'auto_reply',
    });
    expect(classifyMail(mail({ Subject: 'Out of office' }, BOOKING_BODY)).kind).toBe('drop');
    expect(classifyMail(mail({ 'Auto-Submitted': 'auto-generated' }, BOOKING_BODY))).toEqual({ kind: 'read' });
  });

  it('drops an empty mail', () => {
    expect(classifyMail(mail({}, 'hi'))).toEqual({ kind: 'drop', reason: 'empty_mail' });
  });

  it('drops a list mail without a booking in it, and keeps one that has one', () => {
    const list = { 'List-Unsubscribe': '<mailto:off@example.com>' };
    expect(classifyMail(mail(list, 'Our autumn deals are here, have a look at them all.'))).toEqual({
      kind: 'drop',
      reason: 'newsletter',
    });
    expect(classifyMail(mail(list, BOOKING_BODY))).toEqual({ kind: 'read' });
    const bulk = mail({ Precedence: 'bulk' }, 'Weekly news for travellers who love to read.');
    expect(classifyMail(bulk).kind).toBe('drop');
  });
});

describe('senderVerified', () => {
  const verdict = (results: string) => ({ 'Authentication-Results': `mx.example.net; ${results}` });
  const signed = verdict('dkim=pass header.d=example.com; spf=pass');

  it('holds for the person’s own address, signed by its domain, as the IMAP box’s server judged', () => {
    expect(senderVerified(mail(signed, BOOKING_BODY), 'Mia@Example.com', 'imap')).toBe(true);
    const dmarc = verdict('dkim=fail; dmarc=pass (p=reject) header.from=example.com');
    expect(senderVerified(mail(dmarc, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(true);
  });

  it('does not hold for another sender or without a signature', () => {
    expect(senderVerified(mail(signed, BOOKING_BODY), 'other@example.com', 'imap')).toBe(false);
    expect(senderVerified(mail({}, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(false);
    const forged = verdict('dkim=pass header.d=evil.test');
    expect(senderVerified(mail(forged, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(false);
  });

  it('does not hold for a pass that names another domain than the From one', () => {
    const lookalike = verdict('dkim=pass header.d=example.com.evil.test');
    expect(senderVerified(mail(lookalike, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(false);
    const unaligned = verdict('dmarc=pass header.from=evil.test');
    expect(senderVerified(mail(unaligned, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(false);
    const bare = verdict('dmarc=pass');
    expect(senderVerified(mail(bare, BOOKING_BODY), 'mia@example.com', 'imap')).toBe(false);
  });

  it('never holds where the sender could have written the verdict itself', () => {
    for (const transport of ['cloud', 'webhook', 'upload']) {
      expect(senderVerified(mail(signed, BOOKING_BODY), 'mia@example.com', transport), transport).toBe(false);
    }
  });

  it('reads a bare address out of a From header', () => {
    expect(addressOf('Mia <MIA@example.com>')).toBe('mia@example.com');
    expect(addressOf('mia@example.com')).toBe('mia@example.com');
    expect(addressOf(null)).toBeNull();
  });
});

describe('parsePriceMinor', () => {
  it('takes a number as it is and reads unambiguous text', () => {
    expect(parsePriceMinor(120.5, 'EUR')).toBe(12050);
    expect(parsePriceMinor('1.234,56', 'EUR')).toBe(123456);
    expect(parsePriceMinor('1,234.56', 'USD')).toBe(123456);
    expect(parsePriceMinor('€ 89,35', 'EUR')).toBe(8935);
    expect(parsePriceMinor('1.234.567', 'EUR')).toBe(123456700);
    expect(parsePriceMinor('12000', 'JPY')).toBe(1200000);
    expect(parsePriceMinor('0,5', null)).toBe(50);
  });

  it('refuses what it would have to guess', () => {
    expect(parsePriceMinor('1.234', 'EUR')).toBeNull();
    expect(parsePriceMinor('12.50', 'JPY')).toBeNull();
    expect(parsePriceMinor('1,2,3', 'EUR')).toBeNull();
    expect(parsePriceMinor('12.34,5.6', 'EUR')).toBeNull();
    expect(parsePriceMinor(Number.NaN, 'EUR')).toBeNull();
    expect(parsePriceMinor({ amount: 1 }, 'EUR')).toBeNull();
    expect(parsePriceMinor('', 'EUR')).toBeNull();
  });
});

describe('the address token', () => {
  it('is 24 base32 characters and looked up by its hash, whatever its case', () => {
    const token = newToken();
    expect(token).toMatch(/^[a-z2-7]{24}$/);
    expect(newToken()).not.toBe(token);
    expect(hashToken(token.toUpperCase())).toBe(hashToken(token));
  });

  it('is read from where the template puts it, or after a plus', () => {
    const token = 'abcdefghijklmnopqrstuvwx';
    expect(tokenOf(`Trips <trek+${token}@mail.example.com>`, 'trek+{token}@mail.example.com')).toBe(token);
    expect(tokenOf(`ab12${token}@in.example.com`, 'ab12{token}@in.example.com')).toBe(token);
    expect(tokenOf(`box+${token}@example.com`, null)).toBe(token);
    expect(tokenOf('box+short@example.com', null)).toBeNull();
    expect(tokenOf('someone@example.com', 'trek+{token}@mail.example.com')).toBeNull();
  });
});

describe('the sealed mail', () => {
  it('opens to the same bytes, and a broken seal to nothing', () => {
    const raw = Buffer.from([0x46, 0x72, 0x6f, 0x6d, 0x3a, 0x20, 0xe9, 0x00, 0xff]);
    expect(openMail(sealMail(raw))?.equals(raw)).toBe(true);
    expect(openMail(null)).toBeNull();
    expect(openMail('enc:v1:broken')).toBeNull();
  });
});
