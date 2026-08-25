import { describe, it, expect, vi } from 'vitest';

const { getText } = vi.hoisted(() => ({ getText: vi.fn(async () => ({ text: 'Hotel X — confirmation ABC' })) }));
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    getText = getText;
    destroy = vi.fn(async () => {});
  },
}));

import { isTextLike, isPdf, extractText } from '../../../../src/nest/llm-parse/text-extract';

describe('text-extract', () => {
  it('classifies text-like and pdf extensions', () => {
    expect(isTextLike('a.txt')).toBe(true);
    expect(isTextLike('a.html')).toBe(true);
    expect(isTextLike('a.eml')).toBe(true);
    expect(isTextLike('a.pdf')).toBe(false);
    expect(isPdf('a.PDF')).toBe(true);
    expect(isPdf('a.txt')).toBe(false);
  });

  it('decodes plain text', async () => {
    expect(await extractText(Buffer.from('hello world'), 'a.txt')).toBe('hello world');
  });

  it('strips markup from html/eml', async () => {
    const html = '<html><style>x{}</style><body><p>Flight AB123</p><script>1</script></body></html>';
    const out = await extractText(Buffer.from(html), 'a.html');
    expect(out).toContain('Flight AB123');
    expect(out).not.toContain('<p>');
    expect(out).not.toContain('x{}');
  });

  it('decodes html entities so the model reads the actual characters', async () => {
    const html =
      '<p>Zimmer f&uuml;r zwei &ndash; 120,00 &euro;</p><p>Gate &#88; / Terminal &#x58;</p>' +
      '<p>&Uuml;berfahrt: Meier &amp; S&ouml;hne</p>';
    const out = await extractText(Buffer.from(html, 'utf8'), 'a.html');
    expect(out).toContain('Zimmer für zwei – 120,00 €');
    expect(out).toContain('Gate X / Terminal X');
    expect(out).toContain('Überfahrt: Meier & Söhne');
    expect(out).not.toContain('&uuml;');
    expect(out).not.toContain('&#88;');
  });

  it('turns non-breaking spaces into normal ones and leaves unknown entities alone', async () => {
    const out = await extractText(
      Buffer.from('<p>Sitz&nbsp;12A</p><p>Gleis&#160;7</p><p>&notanentity;</p>', 'utf8'),
      'a.html',
    );
    expect(out).toContain('Sitz 12A');
    expect(out).toContain('Gleis 7');
    expect(out).toContain('&notanentity;');
  });

  it('resolves shouted entity names and keeps unusable numeric references', async () => {
    const out = await extractText(Buffer.from('<p>Preis 12 &EURO; &#0; &#xD800; &#1114112;</p>', 'utf8'), 'a.html');
    expect(out).toContain('Preis 12 €');
    expect(out).toContain('&#0;');
    expect(out).toContain('&#xD800;');
    expect(out).toContain('&#1114112;');
  });

  it('decodes entities after the tags are gone, so escaped markup survives', async () => {
    const out = await extractText(Buffer.from('<p>Regel: &lt;b&gt;fett&lt;/b&gt;</p>', 'utf8'), 'a.html');
    expect(out).toContain('Regel: <b>fett</b>');
  });

  it('extracts the embedded text layer from a pdf', async () => {
    const out = await extractText(Buffer.from('%PDF-1.4'), 'a.pdf');
    expect(out).toBe('Hotel X — confirmation ABC');
    expect(getText).toHaveBeenCalled();
  });

  describe('eml', () => {
    const mail = (...lines: string[]) => Buffer.from(lines.join('\r\n'), 'latin1');
    const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

    it('decodes a base64 html body instead of feeding the encoded blob to the model', async () => {
      const body = b64('<html><body><h1>Flight AB123</h1><p>Seat 12A</p></body></html>');
      const out = await extractText(
        mail(
          'From: Airline <noreply@airline.example>',
          'Subject: Your booking',
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: base64',
          '',
          body,
          '',
        ),
        'booking.eml',
      );
      expect(out).toContain('Flight AB123');
      expect(out).toContain('Seat 12A');
      expect(out).toContain('Subject: Your booking');
      expect(out).not.toContain(body.slice(0, 24));
      expect(out).not.toContain('<h1>');
    });

    it('decodes a quoted-printable html body', async () => {
      const out = await extractText(
        mail(
          'From: hotel@example.com',
          'Subject: Reservation',
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: quoted-printable',
          '',
          '<p>Zimmer f=C3=BCr zwei, 120,00 =E2=82=AC, Buchungsnummer=',
          ' XYZ-42</p>',
          '',
        ),
        'hotel.eml',
      );
      expect(out).toContain('Zimmer für zwei, 120,00 €, Buchungsnummer XYZ-42');
      expect(out).not.toContain('=C3=BC');
    });

    it('prefers the html part of a multipart/alternative', async () => {
      const out = await extractText(
        mail(
          'From: rail@example.com',
          'Subject: Ticket',
          'Content-Type: multipart/alternative; boundary="=_alt_1"',
          '',
          '--=_alt_1',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'plain fallback',
          '--=_alt_1',
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: base64',
          '',
          b64('<p>Train IC 2043, coach 7</p>'),
          '--=_alt_1--',
          '',
        ),
        'ticket.eml',
      );
      expect(out).toContain('Train IC 2043, coach 7');
      expect(out).not.toContain('plain fallback');
    });

    it('reads a plain-text mail', async () => {
      const out = await extractText(
        mail(
          'From: ferry@example.com',
          'Subject: Crossing',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'Booking 4711',
          'Departure 08:30',
          '',
        ),
        'ferry.eml',
      );
      expect(out).toContain('Booking 4711');
      expect(out).toContain('Departure 08:30');
    });

    it('falls back to markup stripping when the .eml is not a MIME message', async () => {
      const out = await extractText(Buffer.from('<html><body><p>Flight AB123</p></body></html>'), 'saved.eml');
      expect(out).toBe('Flight AB123');
    });

    it('keeps the raw content when the mail carries no readable body part', async () => {
      const attachment = b64('%PDF-1.4 ticket');
      const out = await extractText(
        mail(
          'From: airline@example.com',
          'Subject: Booking 4711',
          'MIME-Version: 1.0',
          'Content-Type: multipart/mixed; boundary="=_mix_1"',
          '',
          '--=_mix_1',
          'Content-Type: application/pdf; name="ticket.pdf"',
          'Content-Transfer-Encoding: base64',
          'Content-Disposition: attachment; filename="ticket.pdf"',
          '',
          attachment,
          '--=_mix_1--',
          '',
        ),
        'attached.eml',
      );
      expect(out).toContain('Subject: Booking 4711');
      expect(out).toContain(attachment);
    });

    it('uses the plain-text alternative when the html part is empty', async () => {
      const out = await extractText(
        mail(
          'From: hotel@example.com',
          'Subject: Reservation',
          'Content-Type: multipart/alternative; boundary="=_alt_2"',
          '',
          '--=_alt_2',
          'Content-Type: text/plain; charset=utf-8',
          '',
          'Zimmer 12, Anreise 04.08.',
          '--=_alt_2',
          'Content-Type: text/html; charset=utf-8',
          '',
          '<html><body></body></html>',
          '--=_alt_2--',
          '',
        ),
        'empty-html.eml',
      );
      expect(out).toContain('Zimmer 12, Anreise 04.08.');
    });

    it('decodes entities in an html mail body', async () => {
      const out = await extractText(
        mail(
          'From: hotel@example.com',
          'Subject: Reservierung',
          'Content-Type: text/html; charset=utf-8',
          '',
          '<p>Zimmer f&uuml;r zwei &ndash; 120,00 &euro;</p>',
          '',
        ),
        'entities.eml',
      );
      expect(out).toContain('Zimmer für zwei – 120,00 €');
    });
  });

  describe('pdf page markers', () => {
    const fromPdf = async (text: string) => {
      getText.mockResolvedValueOnce({ text });
      return extractText(Buffer.from('%PDF-1.4'), 'a.pdf');
    };

    it('drops a marker together with the blank lines around it', async () => {
      expect(await fromPdf('Hotel Ibis\n\n\n--- 3 of 12 ---\n\n\nCheck-in 04.08.')).toBe(
        'Hotel Ibis\n\nCheck-in 04.08.',
      );
    });

    it('drops a marker that opens or closes the document', async () => {
      expect(await fromPdf('--- 1 of 2 ---\nBoarding pass')).toBe('Boarding pass');
      expect(await fromPdf('Rechnung\n--- 4 of 4 ---')).toBe('Rechnung');
    });

    it('drops an indented marker, spaces or non-breaking ones', async () => {
      expect(await fromPdf('Gate 12\n    --- 2 of 12 ---\nSeat 4A')).toBe('Gate 12\n\nSeat 4A');
      expect(await fromPdf('Gate 12\n  --- 2 of 12 ---\nSeat 4A')).toBe('Gate 12\n\nSeat 4A');
    });

    it('reads the marker case-insensitively and across CRLF line ends', async () => {
      expect(await fromPdf('Zimmer 12\r\n\r\n-- 1 OF 9 --\r\nAnreise')).toBe('Zimmer 12\r\nAnreise');
    });

    it('clears every marker of a multi-page document and still de-kerns the text', async () => {
      const pages = 'A M S T E R D A M\n--- 1 of 3 ---\nGate  12\n-- 2 of 3 --\nSeat 4A\n--- 3 of 3 ---';
      expect(await fromPdf(pages)).toBe('AMSTERDAM\n\nGate 12\n\nSeat 4A');
    });

    it('keeps dashed lines that only look like a marker', async () => {
      const kept = [
        'Total -- 3 of 4 --', // not at the start of its line
        'Summe\n--- 3 of 4 --- netto', // something else follows on the line
        'Summe\n--- 3of 4 ---\nX', // no gap behind the page number
        'Summe\n--- 3 on 4 ---\nX',
        'Summe\n--- 3 of4 ---\nX',
        'Summe\n--- 3 of vier ---\nX',
        'Summe\n--- 3 of 4\nX', // nothing closes it
        'Summe\n--- keine Zahl ---\nX',
        'Summe\n----------\nX',
      ];
      for (const text of kept) expect(await fromPdf(text)).toBe(text);
    });

    it('stays linear on a page that is nothing but whitespace', async () => {
      const started = Date.now();
      expect(await fromPdf(' \n'.repeat(50000))).toBe('');
      // The pattern this replaced walked the whole run again from every line
      // start and needed ~4 s for these 100k characters.
      expect(Date.now() - started).toBeLessThan(1000);
    });
  });
  describe('tag stripping keeps the old regex edge cases', () => {
    it('leaves an empty `<>` alone, because `[^>]+` had nothing to match', async () => {
      expect(await extractText(Buffer.from('a<>b<p>c</p>'), 'a.html')).toBe('a<>b c');
    });

    it('keeps a `<` that nothing closes at all as literal text', async () => {
      expect(await extractText(Buffer.from('3 < 4'), 'a.html')).toBe('3 < 4');
    });

    it('treats a `<` inside a tag as content, the way the regex did', async () => {
      // `[^>]` matches `<` too, so `< 4 and <b>` is ONE tag, not a stray `<`
      // followed by a `<b>`. Narrowing the class would split it and leave the
      // first `<` behind — a different sanitiser output on malformed markup.
      expect(await extractText(Buffer.from('3 < 4 and <b>5</b>'), 'a.html')).toBe('3 5');
    });
  });
});
