import { sameHost } from '../../../src/nest/wanderer/wanderer.helpers';
import { decodePolyline, encodePolyline, thinLine } from '../../../src/utils/polyline';

import { describe, expect, it } from 'vitest';

describe('polyline', () => {
  it('decodes the reference line of the encoded polyline format', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it('round-trips a line at either precision', () => {
    const line: [number, number][] = [
      [47.42123, 10.98456],
      [47.43001, 11.00002],
      [-33.5, 151.25],
    ];
    expect(decodePolyline(encodePolyline(line, 5), 5)).toEqual(line);
    expect(decodePolyline(encodePolyline(line, 6), 6)).toEqual(line);
  });

  it('thins a long line to at most the given count, keeping its ends', () => {
    const line = Array.from({ length: 1000 }, (_, i) => i);
    const thin = thinLine(line, 50);
    expect(thin.length).toBeLessThanOrEqual(50);
    expect(thin[0]).toBe(0);
    expect(thin[thin.length - 1]).toBe(999);
    expect(thinLine([1, 2, 3], 50)).toEqual([1, 2, 3]);
  });
});

describe('sameHost', () => {
  it('compares scheme and host, nothing else', () => {
    expect(sameHost('https://w.example.org/api', 'https://w.example.org')).toBe(true);
    expect(sameHost('https://w.example.org', 'http://w.example.org')).toBe(false);
    expect(sameHost('https://w.example.org', 'https://w.example.org:8443')).toBe(false);
    expect(sameHost(null, 'https://w.example.org')).toBe(false);
    expect(sameHost('not a url', 'https://w.example.org')).toBe(false);
  });
});
