// FE-UTIL-COLORSPACE-001 to FE-UTIL-COLORSPACE-003
import { describe, expect, it } from 'vitest';

import { hexToHsv, hsvToHex, hueHex, normalizeHex } from './colorSpace';

describe('colorSpace', () => {
  it('FE-UTIL-COLORSPACE-001: reads a typed colour in the forms people type it, and nothing else', () => {
    expect(normalizeHex('#ABCDEF')).toBe('#abcdef');
    expect(normalizeHex('abcdef')).toBe('#abcdef');
    expect(normalizeHex(' #f0a ')).toBe('#ff00aa');
    expect(normalizeHex('#abcd')).toBeNull();
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('')).toBeNull();
  });

  it('FE-UTIL-COLORSPACE-002: hue, saturation and value of the primaries, grey and black', () => {
    expect(hexToHsv('#ff0000')).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv('#00ff00')).toEqual({ h: 120, s: 1, v: 1 });
    expect(hexToHsv('#0000ff')).toEqual({ h: 240, s: 1, v: 1 });
    expect(hexToHsv('#808080')).toEqual({ h: 0, s: 0, v: 128 / 255 });
    expect(hexToHsv('#000000')).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('FE-UTIL-COLORSPACE-003: a colour survives the way there and back, and the hue alone is the pure one', () => {
    for (const hex of ['#6366f1', '#ec4899', '#f97316', '#10b981', '#64748b', '#ffffff', '#000000']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
    expect(hueHex(0)).toBe('#ff0000');
    expect(hueHex(120)).toBe('#00ff00');
    expect(hueHex(240)).toBe('#0000ff');
  });
});
