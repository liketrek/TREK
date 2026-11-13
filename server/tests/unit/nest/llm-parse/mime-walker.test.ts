import {
  MAX_MAIL_ATTACHMENTS,
  MAX_MAIL_ATTACHMENT_BYTES,
  walkMail,
  type WalkedMail,
} from '../../../../src/nest/llm-parse/mime-walker';

import { afterEach, describe, expect, it, vi } from 'vitest';

/** Mail is CRLF-delimited on the wire: the fixtures are built the same way. */
const mail = (...lines: string[]) => Buffer.from(lines.join('\r\n'), 'latin1');

/** Base64 in 76-character lines, as mailers write it. */
const b64 = (data: Buffer | string) =>
  (typeof data === 'string' ? Buffer.from(data, 'utf8') : data).toString('base64').replace(/.{76}/g, '$&\r\n');

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\n%%EOF\n', 'latin1');
const PKPASS = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('pass.json')]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('IHDR')]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const ICS = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:LH 716\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';

/** One attachment part of a multipart/mixed body. */
const part = (type: string, name: string | null, data: Buffer | string, extra: string[] = []) => [
  '--mix',
  `Content-Type: ${type}${name ? `; name="${name}"` : ''}`,
  'Content-Transfer-Encoding: base64',
  ...(name ? [`Content-Disposition: attachment; filename="${name}"`] : []),
  ...extra,
  '',
  b64(data),
];

/** A forwarded booking with the given parts after its text. */
const mixed = (text: string, ...parts: string[][]) =>
  mail(
    'From: Ana <ana@example.org>',
    'To: in+token@trek.example',
    'Subject: Fwd: Your booking',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="mix"',
    '',
    '--mix',
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
    ...parts.flat(),
    '--mix--',
    '',
  );

afterEach(() => vi.restoreAllMocks());

describe('walkMail: the envelope and the body', () => {
  it('MIME-WALK-001: refuses bytes that are not a mail', () => {
    expect(walkMail(Buffer.from('<html><body>Flight AB123</body></html>'))).toBeNull();
    expect(walkMail(Buffer.from(''))).toBeNull();
  });

  it('MIME-WALK-002: keeps the envelope apart, decoded, and the body free of it', () => {
    const walked: WalkedMail = walkMail(
      mail(
        'Authentication-Results: mx.trek.example; dkim=pass header.d=example.org',
        'Authentication-Results: relay.example; dkim=fail',
        'Delivered-To: in+token@trek.example',
        'X-Original-To: in+token@trek.example',
        'From: =?utf-8?B?QW5hIE3DvGxsZXI=?= <ana@example.org>',
        'To: in+token@trek.example',
        'Cc: ben@example.org',
        'Subject: Fwd: WG: =?utf-8?Q?Ihre_Buchung_f=C3=BCr_Tokio?=',
        'Date: Mon, 12 May 2025 09:00:00 +0200',
        'Message-ID: <abc@example.org>',
        'List-Unsubscribe: <https://airline.example/unsubscribe>',
        'Precedence: bulk',
        'Auto-Submitted: auto-generated',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'Flight LH 716, booking ABC123',
        '',
      ),
    )!;
    expect(walked.envelope).toEqual({
      from: 'Ana Müller <ana@example.org>',
      to: 'in+token@trek.example',
      cc: 'ben@example.org',
      subject: 'Fwd: WG: Ihre Buchung für Tokio',
      date: 'Mon, 12 May 2025 09:00:00 +0200',
      messageId: '<abc@example.org>',
      deliveredTo: 'in+token@trek.example',
      xOriginalTo: 'in+token@trek.example',
      listUnsubscribe: '<https://airline.example/unsubscribe>',
      precedence: 'bulk',
      autoSubmitted: 'auto-generated',
      // The receiving server's own verdict is the topmost header.
      authenticationResults: 'mx.trek.example; dkim=pass header.d=example.org',
    });
    expect(walked.subject).toBe('Ihre Buchung für Tokio');
    expect(walked.body).toBe('Flight LH 716, booking ABC123');
    expect(walked.body).not.toContain('example.org');
    expect(walked.forwardLayers).toBe(0);
  });

  it('MIME-WALK-003: a missing header is null and a mail without a subject has none', () => {
    const walked = walkMail(mail('From: a@example.org', 'Content-Type: text/plain', '', 'Hotel', ''))!;
    expect(walked.subject).toBeNull();
    expect(walked.envelope.to).toBeNull();
    expect(walked.envelope.authenticationResults).toBeNull();
  });
});

describe('walkMail: forwarded and quoted messages', () => {
  it('MIME-WALK-010: a Gmail forward loses its marker and the header block under it', () => {
    const walked = walkMail(
      mail(
        'From: ana@example.org',
        'Subject: Fwd: Booking',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'See below',
        '',
        '---------- Forwarded message ---------',
        'From: Airline <noreply@airline.example>',
        'Date: Mon, 12 May 2025 at 09:00',
        'Subject: Your booking ABC123',
        'To: <ana@example.org>',
        '',
        'Flight LH 716 Frankfurt to Tokyo, booking ABC123',
        '',
      ),
    )!;
    expect(walked.body).toBe('See below\n\nFlight LH 716 Frankfurt to Tokyo, booking ABC123');
    expect(walked.body).not.toContain('airline.example');
    expect(walked.forwardLayers).toBe(1);
  });

  it('MIME-WALK-011: an Outlook forward in HTML, its rule and bold fields on their own lines', () => {
    const html = [
      '<div>FYI</div>',
      '<hr><div><b>From:</b> Hotel &lt;stay@hotel.example&gt;<br><b>Sent:</b> Monday<br>',
      '<b>To:</b> Ana<br><b>Subject:</b> Reservation H-77</div>',
      '<p>Check-in 2 September, reservation H-77</p>',
      '<img src="https://tracker.example/open.png">',
    ].join('');
    const walked = walkMail(
      mail('From: ana@example.org', 'Subject: WG: Reservation', 'Content-Type: text/html; charset=utf-8', '', html, ''),
    )!;
    expect(walked.body).toContain('Check-in 2 September, reservation H-77');
    expect(walked.body).not.toContain('hotel.example');
    expect(walked.body).not.toContain('Subject:');
  });

  it('MIME-WALK-012: a bare Outlook block goes, a French ticket that reads like one stays', () => {
    const walked = walkMail(
      mail(
        'From: ana@example.org',
        // The fixture is written byte for byte in latin1, so the "À" is declared as such.
        'Content-Type: text/plain; charset=iso-8859-1',
        '',
        'From: Rail <tickets@rail.example>',
        'Sent: Monday',
        'To: Ana',
        'Subject: Votre billet',
        '',
        'De : Paris',
        'À : Lyon',
        'Date : 12/05/2026',
        '',
      ),
    )!;
    expect(walked.body).toBe('De : Paris\nÀ : Lyon\nDate : 12/05/2026');
  });

  it('MIME-WALK-013: quoted lines are unquoted level by level, the attribution goes', () => {
    const walked = walkMail(
      mail(
        'From: ana@example.org',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'On Mon, 12 May 2025, Ben <ben@example.org> wrote:',
        '> Begin forwarded message:',
        '>',
        '> From: Ferry <info@ferry.example>',
        '> Subject: Ticket',
        '>',
        '>> Ferry Piraeus to Naxos, ticket F-12',
        '',
      ),
    )!;
    expect(walked.body).toBe('Ferry Piraeus to Naxos, ticket F-12');
    expect(walked.body).not.toMatch(/example\.org|ferry\.example/);
    expect(walked.forwardLayers).toBeGreaterThanOrEqual(2);
  });

  it('MIME-WALK-014: a mail forwarded as an attachment is read as a message of its own', () => {
    const inner = [
      'From: Airline <noreply@airline.example>',
      'Subject: Your booking',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Flight LH 716, booking ABC123',
    ].join('\r\n');
    const walked = walkMail(
      mail(
        'From: ana@example.org',
        'Subject: Fwd: Your booking',
        'Content-Type: multipart/mixed; boundary="mix"',
        '',
        '--mix',
        'Content-Type: text/plain',
        '',
        'Forwarding this',
        '--mix',
        'Content-Type: message/rfc822',
        'Content-Disposition: attachment; filename="booking.eml"',
        '',
        inner,
        '--mix--',
        '',
      ),
    )!;
    expect(walked.body).toBe('Forwarding this\n\nFlight LH 716, booking ABC123');
    expect(walked.body).not.toContain('airline.example');
    expect(walked.forwardLayers).toBe(1);
  });

  it('MIME-WALK-015: a message nested past the depth limit stops there instead of recursing on', () => {
    let message = ['From: deep@example.org', 'Content-Type: text/plain', '', 'Hotel H-77'].join('\r\n');
    for (let level = 0; level < 15; level++) {
      message = ['From: x@example.org', 'Content-Type: message/rfc822', '', message].join('\r\n');
    }
    const walked = walkMail(Buffer.from(message, 'latin1'))!;
    expect(walked.body).toBe('');
    expect(walked.forwardLayers).toBe(10);
  });
});

describe('walkMail: attachments', () => {
  it('MIME-WALK-020: keeps a PDF, a pass, a calendar and the three photo types, by type or by name', () => {
    const walked = walkMail(
      mixed(
        'Booking ABC123',
        part('application/pdf', 'ticket.pdf', PDF),
        part('application/octet-stream', 'boarding.pkpass', PKPASS),
        part('text/calendar', null, ICS),
        part('image/jpeg', 'scan.JPG', JPEG),
        part('image/png', 'pass.png', PNG),
      ),
    )!;
    expect(walked.attachments.map(({ fileName, kind, mimeType }) => ({ fileName, kind, mimeType }))).toEqual([
      { fileName: 'ticket.pdf', kind: 'pdf', mimeType: 'application/pdf' },
      { fileName: 'boarding.pkpass', kind: 'pkpass', mimeType: 'application/vnd.apple.pkpass' },
      { fileName: 'attachment-3.ics', kind: 'ics', mimeType: 'text/calendar' },
      { fileName: 'scan.JPG', kind: 'jpeg', mimeType: 'image/jpeg' },
      { fileName: 'pass.png', kind: 'png', mimeType: 'image/png' },
    ]);
    expect(walked.attachments[0].data.equals(PDF)).toBe(true);
    expect(walked.attachments[2].data.toString('utf8')).toBe(ICS);
    expect(walked.skippedAttachments).toBe(0);
    // The calendar is an attachment, not body text.
    expect(walked.body).toBe('Booking ABC123');
  });

  it('MIME-WALK-021: a layout image goes, a WebP the person attached stays', () => {
    const walked = walkMail(
      mixed(
        'Booking',
        part('image/png', null, PNG, ['Content-ID: <logo@airline>', 'Content-Disposition: inline']),
        part('image/webp', 'photo.webp', WEBP),
      ),
    )!;
    expect(walked.attachments.map((a) => a.kind)).toEqual(['webp']);
    expect(walked.skippedAttachments).toBe(0);
  });

  it('MIME-WALK-022: a file that is not what it claims is skipped, a type no booking travels in ignored', () => {
    const walked = walkMail(
      mixed(
        'Booking',
        part('application/pdf', 'ticket.pdf', Buffer.from('MZ not a pdf')),
        part('image/png', 'pass.png', JPEG),
        part('text/calendar', 'invite.ics', 'just text'),
        part('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'terms.docx', 'PK'),
      ),
    )!;
    expect(walked.attachments).toEqual([]);
    expect(walked.skippedAttachments).toBe(3);
  });

  it('MIME-WALK-023: past the count limit the rest are skipped and counted', () => {
    const pdfs = Array.from({ length: MAX_MAIL_ATTACHMENTS + 2 }, (_, i) => part('application/pdf', `t${i}.pdf`, PDF));
    const walked = walkMail(mixed('Booking', ...pdfs))!;
    expect(walked.attachments).toHaveLength(MAX_MAIL_ATTACHMENTS);
    expect(walked.skippedAttachments).toBe(2);
  });

  it('MIME-WALK-024: an attachment past the size limit is left out', () => {
    const big = Buffer.concat([PDF, Buffer.alloc(MAX_MAIL_ATTACHMENT_BYTES)]);
    const walked = walkMail(mixed('Booking', part('application/pdf', 'big.pdf', big)))!;
    expect(walked.attachments).toEqual([]);
    expect(walked.skippedAttachments).toBe(1);
  });

  it('MIME-WALK-025: a file name loses its path and control characters, an empty one is made up', () => {
    const walked = walkMail(
      mixed(
        'Booking',
        part('application/pdf', '../../etc/ticket\u0007.pdf', PDF),
        part('application/pdf', '..', PDF),
      ),
    )!;
    expect(walked.attachments.map((a) => a.fileName)).toEqual(['ticket.pdf', 'attachment-2.pdf']);
  });

  it('MIME-WALK-026: nothing is fetched, a remote image stays a string in the markup that is dropped', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const walked = walkMail(
      mail(
        'From: ana@example.org',
        'Content-Type: text/html; charset=utf-8',
        '',
        '<p>Booking ABC123</p><img src="https://tracker.example/pixel.gif">',
        '<link rel="stylesheet" href="https://x.example/a.css">',
        '',
      ),
    )!;
    expect(walked.body).toBe('Booking ABC123');
    expect(walked.attachments).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
