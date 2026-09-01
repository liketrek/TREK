import { describe, it, expect } from 'vitest';
import { contentDisposition } from '../../../src/nest/common/content-disposition';

// Node refuses header values with codepoints above 0xFF (ERR_INVALID_CHAR), so
// the builder must hand back printable ASCII no matter what the name holds —
// and stay byte-identical to the old hand-built header for plain ASCII names.
describe('contentDisposition (#2165)', () => {
  it('keeps a plain ASCII name byte-identical to the hand-built header', () => {
    expect(contentDisposition('Alpine-week.gpx', 'attachment')).toBe('attachment; filename="Alpine-week.gpx"');
    expect(contentDisposition('all-trips.ics', 'inline')).toBe('inline; filename="all-trips.ics"');
    // Spaces are fine inside a quoted-string; no reason to grow a filename*.
    expect(contentDisposition('My Trip 2025.ics', 'attachment')).toBe('attachment; filename="My Trip 2025.ics"');
    expect(contentDisposition('', 'attachment')).toBe('attachment; filename=""');
  });

  it('adds filename* only when the quoted fallback loses something', () => {
    expect(contentDisposition('沖縄-4泊5日.gpx', 'attachment')).toBe(
      'attachment; filename="__-4_5_.gpx"; filename*=UTF-8\'\'%E6%B2%96%E7%B8%84-4%E6%B3%8A5%E6%97%A5.gpx',
    );
  });

  it('folds an accent in both its composed and combining forms', () => {
    expect(contentDisposition('Café.gpx', 'attachment')).toBe(
      'attachment; filename="Caf_.gpx"; filename*=UTF-8\'\'Caf%C3%A9.gpx',
    );
    // NFKD output: 'e' + U+0301 — the combining mark alone is already > 0xFF.
    expect(contentDisposition('Café.gpx', 'attachment')).toBe(
      'attachment; filename="Cafe_.gpx"; filename*=UTF-8\'\'Cafe%CC%81.gpx',
    );
  });

  it('neutralizes CR/LF and quotes — nothing escapes the quoted-string', () => {
    expect(contentDisposition('evil\r\nContent-Length: 0"; x="y.gpx', 'attachment')).toBe(
      'attachment; filename="evil  Content-Length: 0_; x=_y.gpx"; filename*=UTF-8\'\'evil%20%20Content-Length%3A%200%22%3B%20x%3D%22y.gpx',
    );
  });

  it('folds a tab to a space instead of riding it into the header', () => {
    expect(contentDisposition('a\tb.ics', 'attachment')).toBe(
      'attachment; filename="a b.ics"; filename*=UTF-8\'\'a%20b.ics',
    );
  });

  it('catches the JS-\\s stragglers like U+3000', () => {
    expect(contentDisposition('a　b.ics', 'inline')).toBe(
      'inline; filename="a_b.ics"; filename*=UTF-8\'\'a%E3%80%80b.ics',
    );
  });

  it("escapes the RFC 5987 stragglers encodeURIComponent leaves bare: ' ( ) *", () => {
    expect(contentDisposition("日(1)'*.gpx", 'attachment')).toBe(
      'attachment; filename="_(1)\'*.gpx"; filename*=UTF-8\'\'%E6%97%A5%281%29%27%2A.gpx',
    );
  });

  it('falls back to download when the folding erased everything readable, keeping the extension', () => {
    expect(contentDisposition('日本語.gpx', 'attachment')).toBe(
      'attachment; filename="download.gpx"; filename*=UTF-8\'\'%E6%97%A5%E6%9C%AC%E8%AA%9E.gpx',
    );
    expect(contentDisposition('日本語', 'attachment')).toBe(
      'attachment; filename="download"; filename*=UTF-8\'\'%E6%97%A5%E6%9C%AC%E8%AA%9E',
    );
  });

  it('carries an emoji through filename* and survives a name cut mid-emoji', () => {
    expect(contentDisposition('\u{1F5FE}.gpx', 'attachment')).toBe(
      'attachment; filename="download.gpx"; filename*=UTF-8\'\'%F0%9F%97%BE.gpx',
    );
    // A lone surrogate would make encodeURIComponent throw "URI malformed" —
    // exactly the crash class this helper exists to end.
    expect(contentDisposition('\uD83D.gpx', 'attachment')).toBe(
      'attachment; filename="download.gpx"; filename*=UTF-8\'\'%EF%BF%BD.gpx',
    );
  });

  it('always yields a value Node accepts: printable ASCII, whatever comes in', () => {
    const nasty = [
      '沖縄 4泊5日.gpx',
      'a b c﻿.ics',
      '"\\.pkpass',
      '\x00\x1f\x7f.gpx',
      '\u{1F9ED}'.repeat(40),
      'plain.txt',
      '',
    ];
    for (const name of nasty) {
      expect(contentDisposition(name, 'attachment')).toMatch(/^[\x20-\x7e]+$/);
      expect(contentDisposition(name, 'inline')).toMatch(/^[\x20-\x7e]+$/);
    }
  });
});
