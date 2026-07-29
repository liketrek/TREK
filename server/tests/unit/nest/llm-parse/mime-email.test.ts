import { describe, it, expect } from 'vitest';

import { parseEmail } from '../../../../src/nest/llm-parse/mime-email';

/** Mail is CRLF-delimited on the wire — build the fixtures the same way. */
const mail = (...lines: string[]) => Buffer.from(lines.join('\r\n'), 'latin1');

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

describe('mime-email', () => {
  it('rejects a buffer that is not a message', () => {
    expect(parseEmail(Buffer.from('<html><body>Flight AB123</body></html>'))).toBeNull();
    expect(parseEmail(Buffer.from(''))).toBeNull();
    // Looks like a header field, but names none of the envelope headers.
    expect(parseEmail(Buffer.from('note:\r\n\r\nnothing here'))).toBeNull();
  });

  it('tolerates a leading utf-8 BOM', () => {
    const parsed = parseEmail(
      Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        mail('From: a@example.com', 'Subject: Hi', 'Content-Type: text/plain', '', 'Booking 4711', ''),
      ]),
    );
    expect(parsed?.text).toBe('Booking 4711\n');
  });

  it('decodes a base64 body and keeps the summary headers', () => {
    const parsed = parseEmail(
      mail(
        'Return-Path: <noreply@airline.example>',
        'From: Airline <noreply@airline.example>',
        'To: traveller@example.com',
        'Subject: Your booking',
        'Date: Mon, 12 May 2025 09:00:00 +0200',
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64('<html><body><p>Flight AB123</p></body></html>'),
        '',
      ),
    );
    expect(parsed?.html).toBe('<html><body><p>Flight AB123</p></body></html>');
    expect(parsed?.text).toBeNull();
    expect(parsed?.headerLines).toEqual([
      'From: Airline <noreply@airline.example>',
      'To: traveller@example.com',
      'Subject: Your booking',
      'Date: Mon, 12 May 2025 09:00:00 +0200',
    ]);
  });

  it('decodes quoted-printable including soft line breaks', () => {
    const parsed = parseEmail(
      mail(
        'From: hotel@example.com',
        'Subject: Reservation',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        'Zimmer f=C3=BCr zwei Personen, Preis 120,00 =E2=82=AC. Buchungsnummer=',
        ' XYZ-42',
        '',
      ),
    );
    expect(parsed?.text).toBe('Zimmer für zwei Personen, Preis 120,00 €. Buchungsnummer XYZ-42\n');
  });

  it('reads both parts of a multipart/alternative', () => {
    const parsed = parseEmail(
      mail(
        'From: rail@example.com',
        'Subject: Ticket',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="=_alt_1"',
        '',
        'This is a multi-part message in MIME format.',
        '--=_alt_1',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        'Train IC 2043, coach 7',
        '--=_alt_1',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64('<p>Train IC 2043, coach 7</p>'),
        '--=_alt_1--',
        '',
      ),
    );
    expect(parsed?.text).toBe('Train IC 2043, coach 7');
    expect(parsed?.html).toBe('<p>Train IC 2043, coach 7</p>');
  });

  it('walks nested multiparts and skips attachments', () => {
    const parsed = parseEmail(
      mail(
        'From: rental@example.com',
        'Subject: Voucher',
        'Content-Type: multipart/mixed; boundary=outer',
        '',
        '--outer',
        'Content-Type: multipart/related; boundary="inner"',
        '',
        '--inner',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64('<p>Pickup 14:00</p>'),
        '--inner--',
        '--outer',
        'Content-Type: application/pdf; name="voucher.pdf"',
        'Content-Disposition: attachment; filename="voucher.pdf"',
        'Content-Transfer-Encoding: base64',
        '',
        b64('%PDF-1.4 binary junk'),
        '--outer--',
        '',
      ),
    );
    expect(parsed?.html).toBe('<p>Pickup 14:00</p>');
    expect(parsed?.text).toBeNull();
  });

  it('skips a text part that is flagged as an attachment', () => {
    const parsed = parseEmail(
      mail(
        'From: a@example.com',
        'Content-Type: multipart/mixed; boundary=b1',
        '',
        '--b1',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Disposition: attachment; filename="notes.txt"',
        '',
        'attached notes',
        '--b1--',
        '',
      ),
    );
    expect(parsed?.text).toBeNull();
    expect(parsed?.html).toBeNull();
  });

  it('honours the part charset', () => {
    const latin1 = Buffer.from('Hôtel Rivière, Zürich', 'latin1').toString('base64');
    const parsed = parseEmail(
      mail(
        'From: hotel@example.com',
        'Content-Type: text/plain; charset="iso-8859-1"',
        'Content-Transfer-Encoding: base64',
        '',
        latin1,
        '',
      ),
    );
    expect(parsed?.text).toBe('Hôtel Rivière, Zürich');
  });

  it('falls back to utf8 for an unknown charset', () => {
    const parsed = parseEmail(
      mail(
        'From: hotel@example.com',
        'Content-Type: text/plain; charset=x-made-up',
        'Content-Transfer-Encoding: base64',
        '',
        b64('Zürich Hbf'),
        '',
      ),
    );
    expect(parsed?.text).toBe('Zürich Hbf');
  });

  it('decodes RFC 2047 encoded-words in the subject', () => {
    const parsed = parseEmail(
      mail(
        'From: =?utf-8?q?Fl=C3=BCge?= <a@example.com>',
        `Subject: =?utf-8?B?${b64('Buchungsbestätigung')}?= =?utf-8?Q?_f=C3=BCr_M=C3=BCnchen?=`,
        'Content-Type: text/plain',
        '',
        'body',
        '',
      ),
    );
    expect(parsed?.headerLines).toContain('Subject: Buchungsbestätigung für München');
    expect(parsed?.headerLines).toContain('From: Flüge <a@example.com>');
  });

  it('unfolds headers that span multiple lines', () => {
    const parsed = parseEmail(
      mail(
        'From: a@example.com',
        'Subject: Booking',
        '\tconfirmation 12345',
        'Content-Type: text/plain;',
        ' charset=utf-8',
        '',
        'body',
        '',
      ),
    );
    expect(parsed?.headerLines).toContain('Subject: Booking confirmation 12345');
    expect(parsed?.text).toBe('body\n');
  });

  it('walks into a forwarded message/rfc822 part', () => {
    const inner = [
      'From: airline@example.com',
      'Subject: Original',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64('<p>Seat 12A</p>'),
    ].join('\r\n');
    const parsed = parseEmail(
      mail(
        'From: colleague@example.com',
        'Subject: Fwd: Original',
        'Content-Type: multipart/mixed; boundary=fwd',
        '',
        '--fwd',
        'Content-Type: message/rfc822',
        '',
        inner,
        '--fwd--',
        '',
      ),
    );
    expect(parsed?.html).toBe('<p>Seat 12A</p>');
  });

  it('returns empty bodies for a multipart without a usable boundary', () => {
    const parsed = parseEmail(
      mail('From: a@example.com', 'Content-Type: multipart/mixed', '', 'nothing to split here', ''),
    );
    expect(parsed?.html).toBeNull();
    expect(parsed?.text).toBeNull();
  });

  it('treats a message without a content-type as plain text', () => {
    const parsed = parseEmail(mail('From: a@example.com', 'Subject: Hi', '', 'Booking 4711', ''));
    expect(parsed?.text).toBe('Booking 4711\n');
  });
});
