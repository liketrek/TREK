import {
  describeFailure,
  isAllowlisted,
  keyFingerprint,
  readQuotaHeaders,
  retryAfterMs,
  sameServiceUrl,
  serverDateMs,
} from '../../../../src/nest/service-identity/service-identity.helpers';

import { describe, expect, it } from 'vitest';

describe('sameServiceUrl', () => {
  it.each([
    ['https://places.liketrek.com', 'https://places.liketrek.com'],
    ['https://places.liketrek.com/', 'https://places.liketrek.com'],
    ['HTTPS://Places.LikeTrek.com//', 'https://places.liketrek.com'],
    ['http://places.liketrek.com', 'https://places.liketrek.com'],
    ['places.liketrek.com', 'https://places.liketrek.com'],
    ['  https://places.liketrek.com  ', 'https://places.liketrek.com'],
  ])('SIHELP-001: reads %s as the public instance', (a, b) => {
    expect(sameServiceUrl(a, b)).toBe(true);
  });

  it.each([
    ['https://places.example.org', 'https://places.liketrek.com'],
    ['https://places.liketrek.com:8443', 'https://places.liketrek.com'],
    ['https://places.liketrek.com/mirror', 'https://places.liketrek.com'],
    ['', 'https://places.liketrek.com'],
    ['http://[broken', 'https://places.liketrek.com'],
  ])('SIHELP-002: reads %s as another service', (a, b) => {
    expect(sameServiceUrl(a, b)).toBe(false);
  });
});

describe('isAllowlisted', () => {
  const hosts = ['places.liketrek.com'];

  it('SIHELP-010: lets the key go to a listed host over https only', () => {
    expect(isAllowlisted(new URL('https://places.liketrek.com/v1/search'), hosts)).toBe(true);
    expect(isAllowlisted(new URL('https://PLACES.liketrek.com/v1/search'), hosts)).toBe(true);
    expect(isAllowlisted(new URL('http://places.liketrek.com/v1/search'), hosts)).toBe(false);
    expect(isAllowlisted(new URL('https://places.liketrek.com.evil.example/v1'), hosts)).toBe(false);
    expect(isAllowlisted(new URL('https://mirror.example.org/v1/search'), hosts)).toBe(false);
  });
});

describe('readQuotaHeaders', () => {
  it('SIHELP-020: reads tier and allowance, with the reset as an instant', () => {
    const headers = new Headers({
      'X-TREK-Tier': 'std',
      'X-TREK-Quota-Limit': '10000',
      'X-TREK-Quota-Remaining': '9960',
      'X-TREK-Quota-Reset': '1793059200',
    });
    expect(readQuotaHeaders(headers)).toEqual({
      tier: 'std',
      quota: { limit: 10_000, used: 40, remaining: 9_960, resetAt: new Date(1_793_059_200_000).toISOString() },
    });
  });

  it('SIHELP-021: keeps a tier without numbers, and numbers without a tier it knows', () => {
    expect(readQuotaHeaders(new Headers({ 'X-TREK-Tier': 'legacy' }))).toEqual({ tier: 'legacy', quota: null });
    const numbers = new Headers({
      'X-TREK-Tier': 'gold',
      'X-TREK-Quota-Limit': '5',
      'X-TREK-Quota-Remaining': '9',
      'X-TREK-Quota-Reset': '1',
    });
    expect(readQuotaHeaders(numbers)?.quota).toMatchObject({ limit: 5, used: 0, remaining: 9 });
    expect(readQuotaHeaders(numbers)?.tier).toBeNull();
  });

  it('SIHELP-022: answers null for an answer without them, or with numbers that are none', () => {
    expect(readQuotaHeaders(new Headers())).toBeNull();
    expect(readQuotaHeaders(new Headers({ 'X-TREK-Quota-Limit': '-1', 'X-TREK-Quota-Remaining': '1e3' }))).toBeNull();
  });
});

describe('retryAfterMs and serverDateMs', () => {
  it('SIHELP-030: reads Retry-After in seconds and as a date', () => {
    expect(retryAfterMs(new Headers({ 'Retry-After': '120' }))).toBe(120_000);
    const now = Date.parse('2026-10-29T12:00:00Z');
    expect(retryAfterMs(new Headers({ 'Retry-After': 'Thu, 29 Oct 2026 12:05:00 GMT' }), now)).toBe(300_000);
    expect(retryAfterMs(new Headers({ 'Retry-After': 'Thu, 29 Oct 2026 11:00:00 GMT' }), now)).toBe(0);
    expect(retryAfterMs(new Headers({ 'Retry-After': 'soon' }))).toBeNull();
    expect(retryAfterMs(new Headers())).toBeNull();
  });

  it('SIHELP-031: reads the Date header, or nothing', () => {
    expect(serverDateMs(new Headers({ Date: 'Thu, 29 Oct 2026 12:00:00 GMT' }))).toBe(
      Date.parse('2026-10-29T12:00:00Z'),
    );
    expect(serverDateMs(new Headers({ Date: 'yesterday' }))).toBeNull();
    expect(serverDateMs(new Headers())).toBeNull();
  });
});

describe('keyFingerprint', () => {
  it('SIHELP-040: names a key without containing it', () => {
    const token = 'tk1.kid.payload.signature';
    expect(keyFingerprint(token)).toMatch(/^[0-9a-f]{16}$/);
    expect(keyFingerprint(token)).toBe(keyFingerprint(token));
    expect(keyFingerprint(token)).not.toBe(keyFingerprint(`${token}x`));
  });
});

describe('describeFailure', () => {
  const attempt = (code: string, address: string, port = 443) =>
    Object.assign(new Error(`connect ${code} ${address}:${port}`), { code, address, port });

  it('spells out every address undici tried behind "fetch failed"', () => {
    const cause = new AggregateError(
      [attempt('ETIMEDOUT', '185.255.115.203'), attempt('ENETUNREACH', '2a0d:5940:140:bf4::2')],
      '',
    );
    const err = new TypeError('fetch failed', { cause });

    expect(describeFailure(err)).toBe(
      'fetch failed (ETIMEDOUT 185.255.115.203:443, ENETUNREACH [2a0d:5940:140:bf4::2]:443)',
    );
  });

  it('names a single cause by its code', () => {
    const cause = Object.assign(new Error('getaddrinfo ENOTFOUND places.liketrek.com'), { code: 'ENOTFOUND' });

    expect(describeFailure(new TypeError('fetch failed', { cause }))).toBe('fetch failed (ENOTFOUND)');
  });

  it('falls back to the cause message without a code', () => {
    const cause = new Error('unable to verify the first certificate');

    expect(describeFailure(new TypeError('fetch failed', { cause }))).toBe(
      'fetch failed (unable to verify the first certificate)',
    );
  });

  it('handles a cause list without usable entries and an address without a port', () => {
    const portless = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED', address: '192.0.2.1' });

    expect(describeFailure(new TypeError('fetch failed', { cause: new AggregateError([], '') }))).toBe('fetch failed');
    expect(describeFailure(new TypeError('fetch failed', { cause: new AggregateError(['odd'], '') }))).toBe(
      'fetch failed (odd)',
    );
    expect(describeFailure(new TypeError('fetch failed', { cause: portless }))).toBe(
      'fetch failed (ECONNREFUSED 192.0.2.1)',
    );
  });

  it('keeps a plain error or value as it is', () => {
    expect(describeFailure(new Error('the issuer answered 503'))).toBe('the issuer answered 503');
    expect(describeFailure('boom')).toBe('boom');
  });
});
