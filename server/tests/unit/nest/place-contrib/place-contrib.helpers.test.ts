/**
 * The pure halves of the community enrichment: which places can be keyed, what
 * a field sends (or why it stays home), the OSM rule a week of hours becomes,
 * and the retry clock.
 */
import { MAX_RETRY_AFTER_MS, RETRY_DELAYS_MS } from '../../../../src/nest/place-contrib/place-contrib.constants';
import {
  baseHashOf,
  contribKeyOf,
  dayOf,
  gersOf,
  logResultOf,
  newEntryCid,
  osmHoursOf,
  payloadOf,
  requestCid,
  retryAfterMs,
  retryDelayMs,
  summaryOf,
} from '../../../../src/nest/place-contrib/place-contrib.helpers';
import { placeContribCidSchema, type PlaceOpeningHours } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const UUID = 'ceba0e62-172b-4343-bb3b-78b915a18383';
const open = (from: string, to: string) => ({ closed: false, open: from, close: to });
const closed = { closed: true };
const unset = { closed: false };

describe('contribKeyOf', () => {
  it('PCH-001: keys an index place by its gers id and an OSM element by type and id', () => {
    expect(contribKeyOf(`gers:${UUID}`)).toBe(`gers:${UUID}`);
    expect(contribKeyOf(`gers:${UUID.toUpperCase()}`)).toBe(`gers:${UUID}`);
    expect(contribKeyOf('gers:08f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5')).toBe('gers:08f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5');
    expect(contribKeyOf('node:123')).toBe('osm:node/123');
    expect(contribKeyOf('way:45')).toBe('osm:way/45');
    expect(contribKeyOf('relation:6')).toBe('osm:relation/6');
  });

  it('PCH-002: a free pin, a Google or Amap place, or a malformed id has no key', () => {
    for (const id of [
      null,
      undefined,
      '',
      'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
      'amap:B000A83M61',
      'gers:abc-123',
      'node:x',
    ]) {
      expect(contribKeyOf(id), String(id)).toBeNull();
    }
  });

  it('PCH-003: reads the gers id back out of a key', () => {
    expect(gersOf(`gers:${UUID}`)).toBe(UUID);
    expect(gersOf('osm:node/1')).toBeNull();
  });
});

describe('osmHoursOf', () => {
  it('PCH-010: folds equal neighbours into a range and names the closed days', () => {
    const week: PlaceOpeningHours = [
      open('09:00', '18:00'),
      open('09:00', '18:00'),
      open('09:00', '18:00'),
      open('09:00', '18:00'),
      open('09:00', '18:00'),
      open('10:00', '14:00'),
      closed,
    ];
    expect(osmHoursOf(week)).toBe('Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off');
  });

  it('PCH-011: leaves out the days nobody set instead of calling them closed', () => {
    const week: PlaceOpeningHours = [open('08:00', '12:00'), unset, unset, unset, unset, unset, unset];
    expect(osmHoursOf(week)).toBe('Mo 08:00-12:00');
    expect(osmHoursOf([unset, unset, unset, unset, unset, unset, unset])).toBeNull();
  });

  it('PCH-012: an interval past midnight stays one interval', () => {
    const week: PlaceOpeningHours = [unset, unset, unset, unset, open('22:00', '02:00'), open('22:00', '02:00'), unset];
    expect(osmHoursOf(week)).toBe('Fr-Sa 22:00-02:00');
  });
});

describe('payloadOf', () => {
  it('PCH-020: normalizes what the service reads', () => {
    expect(payloadOf('website', 'cafe-luna.de')).toEqual({ value: 'https://cafe-luna.de' });
    expect(payloadOf('email', '  Info@Cafe-Luna.DE ')).toEqual({ value: 'info@cafe-luna.de' });
    expect(payloadOf('phone', ' +49 381 1234 ')).toEqual({ value: '+49 381 1234' });
    expect(payloadOf('description', ' A small café. ')).toEqual({ value: 'A small café.' });
    expect(payloadOf('image', '/uploads/places/abc.jpg')).toEqual({ value: '/uploads/places/abc.jpg' });
  });

  it('PCH-021: turns stored hours into the OSM rule', () => {
    const week = JSON.stringify([closed, closed, closed, closed, closed, open('10:00', '16:00'), closed]);
    expect(payloadOf('opening_hours', week)).toEqual({ value: 'Mo-Fr off; Sa 10:00-16:00; Su off' });
  });

  it('PCH-022: keeps home what the service would refuse, saying why', () => {
    expect(payloadOf('website', '   ')).toEqual({ withheld: 'empty' });
    expect(payloadOf('website', 'not a site')).toEqual({ withheld: 'website_invalid' });
    expect(payloadOf('opening_hours', '{bad')).toEqual({ withheld: 'hours_unreadable' });
    const allClosed = JSON.stringify(Array.from({ length: 7 }, () => closed));
    expect(payloadOf('opening_hours', allClosed)).toEqual({ withheld: 'hours_all_closed' });
    const nothingSet = JSON.stringify(Array.from({ length: 7 }, () => unset));
    expect(payloadOf('opening_hours', nothingSet)).toEqual({ withheld: 'hours_empty' });
    expect(payloadOf('image', 'https://photos.example/a.jpg')).toEqual({ withheld: 'image_not_uploaded' });
    expect(payloadOf('image', '/api/maps/place-photo/x')).toEqual({ withheld: 'image_not_uploaded' });
    expect(payloadOf('description', 'x'.repeat(4001))).toEqual({ withheld: 'too_long' });
  });
});

describe('the log and the request ids', () => {
  it('PCH-030: a summary is one short line, and a picture is just a picture', () => {
    expect(summaryOf('description', 'Line one\n\nline   two')).toBe('Line one line two');
    expect(summaryOf('description', 'x'.repeat(200))).toHaveLength(80);
    expect(summaryOf('image', '/uploads/places/a.jpg')).toBe('image');
  });

  it('PCH-031: the base hash is a hex prefix of the served value, null for none', () => {
    expect(baseHashOf('https://cafe-luna.de/')).toMatch(/^[0-9a-f]{16}$/);
    expect(baseHashOf(' https://cafe-luna.de/ ')).toBe(baseHashOf('https://cafe-luna.de/'));
    expect(baseHashOf(null)).toBeNull();
    expect(baseHashOf('  ')).toBeNull();
  });

  it('PCH-032: a request id is stable for the same values and fits the service pattern', () => {
    const a = newEntryCid();
    const b = newEntryCid();
    expect(a).not.toBe(b);
    expect(requestCid([a, b])).toBe(requestCid([b, a]));
    expect(requestCid([a])).not.toBe(requestCid([a, b]));
    expect(placeContribCidSchema.safeParse(requestCid([a, b])).success).toBe(true);
  });

  it('PCH-033: maps what the service made of a field onto the log', () => {
    expect(logResultOf('published')).toBe('accepted');
    expect(logResultOf('review')).toBe('accepted');
    expect(logResultOf('checking')).toBe('accepted');
    expect(logResultOf('unchanged')).toBe('duplicate');
    expect(logResultOf('rejected')).toBe('rejected');
  });

  it('PCH-034: the day is the UTC date', () => {
    expect(dayOf(new Date('2026-10-30T23:30:00Z'))).toBe('2026-10-30');
  });
});

describe('the clock', () => {
  it('PCH-041: retries wait 10 min, 30 min, 2 h, then 6 h', () => {
    expect([1, 2, 3, 4, 5, 8].map(retryDelayMs)).toEqual([
      RETRY_DELAYS_MS[0],
      RETRY_DELAYS_MS[1],
      RETRY_DELAYS_MS[2],
      RETRY_DELAYS_MS[3],
      RETRY_DELAYS_MS[3],
      RETRY_DELAYS_MS[3],
    ]);
    expect(retryDelayMs(0)).toBe(RETRY_DELAYS_MS[0]);
  });

  it('PCH-042: reads Retry-After as seconds or a date, capped, and ignores nonsense', () => {
    const now = Date.parse('2026-10-30T12:00:00Z');
    expect(retryAfterMs('120', now)).toBe(120_000);
    expect(retryAfterMs('Fri, 30 Oct 2026 12:05:00 GMT', now)).toBe(300_000);
    expect(retryAfterMs(String(10 * 24 * 3600), now)).toBe(MAX_RETRY_AFTER_MS);
    expect(retryAfterMs(null, now)).toBeNull();
    expect(retryAfterMs('soon', now)).toBeNull();
    expect(retryAfterMs('Fri, 30 Oct 2026 11:00:00 GMT', now)).toBeNull();
  });
});
