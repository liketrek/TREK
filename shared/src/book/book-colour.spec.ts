import {
  accentFromPalettes,
  clusterPalettes,
  contrastRatio,
  deltaE,
  greyLuminance,
  luminance,
  parseHex,
  readPalette,
  readableInk,
  requiredContrast,
  toHex,
  toHsl,
} from './book-colour';

import { describe, expect, it } from 'vitest';

/** The colour arithmetic the findings and the design engine stand on. */

describe('book colour', () => {
  it('BOOKCLR-001: reads #rrggbb in either case and refuses anything else, and writes it back in lower case', () => {
    expect(parseHex('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(parseHex('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(parseHex('ff8000')).toBeNull();
    expect(parseHex('#fff')).toBeNull();
    expect(toHex({ r: 255, g: 128, b: 0 })).toBe('#ff8000');
    expect(toHex({ r: 300, g: -5, b: 12.4 })).toBe('#ff000c');
  });

  it('BOOKCLR-002: measures WCAG luminance and contrast at the ends of the scale', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(contrastRatio('nope', '#ffffff')).toBe(1);
    expect(greyLuminance(255)).toBeCloseTo(1, 5);
  });

  it('BOOKCLR-003: asks 4.5:1 of small type and 3:1 from 18 pt', () => {
    expect(requiredContrast(10)).toBe(4.5);
    expect(requiredContrast(18)).toBe(3);
    // The grey the Studio set captions in does not reach 4.5:1 on cream; the near black does.
    expect(contrastRatio('#8a8578', '#faf8f4')).toBeLessThan(4.5);
    expect(contrastRatio('#1a1a1a', '#faf8f4')).toBeGreaterThan(4.5);
  });

  it('BOOKCLR-004: gives hue, saturation and lightness', () => {
    expect(toHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 1, l: 0.5 });
    const blue = toHsl({ r: 0, g: 0, b: 255 });
    expect(blue.h).toBeCloseTo(240, 5);
    expect(toHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });

  it('BOOKCLR-005: puts near colours close and different ones far apart in delta E', () => {
    expect(deltaE('#336699', '#336699')).toBe(0);
    expect(deltaE('#336699', '#35689b')).toBeLessThan(2);
    expect(deltaE('#336699', '#cc3300')).toBeGreaterThan(40);
    expect(deltaE('x', '#cc3300')).toBe(0);
  });

  it('BOOKCLR-006: reads a stored palette, shares and all, and skips what does not parse', () => {
    expect(readPalette(['#AA0000:0.6', '#00aa00', 'bad', '#0000aa:x'])).toEqual([
      { hex: '#aa0000', share: 0.6 },
      { hex: '#00aa00', share: 1 },
      { hex: '#0000aa', share: 1 },
    ]);
    expect(readPalette(null)).toEqual([]);
  });

  it('BOOKCLR-007: clusters near colours across photos, most common first, the same way every time', () => {
    const a = [{ hex: '#c0392b', share: 0.5 }];
    const b = [
      { hex: '#c23b2d', share: 0.4 },
      { hex: '#2c3e50', share: 0.2 },
    ];
    const clusters = clusterPalettes([a, b]);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]?.share).toBeCloseTo(0.9 / 1.1, 5);
    expect(clusterPalettes([b, a])[0]?.share).toBeCloseTo(clusters[0]?.share ?? 0, 5);
  });

  it('BOOKCLR-008: takes an accent that is a colour, not near black or white, and none from grey photos', () => {
    const red = [{ hex: '#c0392b', share: 0.3 }];
    const white = [{ hex: '#fafafa', share: 0.9 }];
    expect(accentFromPalettes([white, red])).toBe('#c0392b');
    expect(accentFromPalettes([[{ hex: '#808080', share: 1 }]])).toBeNull();
  });

  it('BOOKCLR-009: picks the ink that reads on a ground', () => {
    expect(readableInk('#ffffff')).toBe('#1a1a1a');
    expect(readableInk('#111111')).toBe('#ffffff');
  });
});
