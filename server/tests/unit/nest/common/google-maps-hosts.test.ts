/**
 * Which Google Maps links a pasted link may be (GMH-*): the host shape the
 * place and route imports check, and the narrower short and long link shapes
 * the city walk import follows and reads (CW-06).
 */
import {
  isGoogleMapsHost,
  isGoogleMapsLongLink,
  isGoogleMapsShortLink,
} from '../../../../src/nest/common/google-maps-hosts';

import { describe, expect, it } from 'vitest';

const url = (raw: string) => new URL(raw);

describe('isGoogleMapsHost', () => {
  it('GMH-001: takes Google on every country domain and the short hosts, nothing that only looks like it', () => {
    for (const host of [
      'google.com',
      'www.google.de',
      'maps.google.co.uk',
      'google.com.au',
      'maps.app.goo.gl',
      'goo.gl',
    ]) {
      expect(isGoogleMapsHost(host)).toBe(true);
    }
    for (const host of ['google.evil.com', 'evilgoogle.com', 'maps.google.com.evil.io', 'mail.google.com']) {
      expect(isGoogleMapsHost(host)).toBe(false);
    }
  });
});

describe('isGoogleMapsShortLink (CW-06)', () => {
  it('GMH-010: follows a maps.app.goo.gl code and a goo.gl/maps code', () => {
    expect(isGoogleMapsShortLink(url('https://maps.app.goo.gl/gwKHfs8TNxShEBBk7'))).toBe(true);
    expect(isGoogleMapsShortLink(url('https://maps.app.goo.gl/AbC1/'))).toBe(true);
    expect(isGoogleMapsShortLink(url('https://goo.gl/maps/AbC1'))).toBe(true);
    // The default port is no port.
    expect(isGoogleMapsShortLink(url('https://maps.app.goo.gl:443/AbC1'))).toBe(true);
  });

  it('GMH-011: refuses plain http, credentials, another port, other paths and look-alike hosts', () => {
    for (const raw of [
      'http://maps.app.goo.gl/AbC1',
      'https://user:pw@maps.app.goo.gl/AbC1',
      'https://user@maps.app.goo.gl/AbC1',
      'https://maps.app.goo.gl:8443/AbC1',
      'https://maps.app.goo.gl/',
      'https://maps.app.goo.gl/a/b',
      'https://goo.gl/xyz',
      'https://goo.gl/maps/a/b',
      'https://maps.app.goo.gl.evil.com/AbC1',
      'https://www.google.com/maps/dir/A/B',
    ]) {
      expect(isGoogleMapsShortLink(url(raw))).toBe(false);
    }
  });
});

describe('isGoogleMapsLongLink (CW-06)', () => {
  it('GMH-020: reads Google Maps on a country domain', () => {
    expect(isGoogleMapsLongLink(url('https://www.google.com/maps/dir/A/B'))).toBe(true);
    expect(isGoogleMapsLongLink(url('https://www.google.de/maps/dir/A/B'))).toBe(true);
    expect(isGoogleMapsLongLink(url('https://maps.google.co.uk/maps/dir/A/B'))).toBe(true);
  });

  it('GMH-021: refuses another host, a short host, credentials, another port and plain http', () => {
    for (const raw of [
      'https://google.evil.com/maps/dir/A/B',
      'https://maps.app.goo.gl/AbC1',
      'https://goo.gl/maps/AbC1',
      'https://user:pw@www.google.com/maps/dir/A/B',
      'https://www.google.com:8443/maps/dir/A/B',
      'http://www.google.com/maps/dir/A/B',
    ]) {
      expect(isGoogleMapsLongLink(url(raw))).toBe(false);
    }
  });
});
