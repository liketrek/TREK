import type { BookGradientPaint, BookPaint } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  addStop,
  clampRadius,
  clampScale,
  clampUnit,
  colourAt,
  cssPaint,
  cssStops,
  dialAngle,
  gradientAs,
  kindOf,
  leadColour,
  mixHex,
  normAngle,
  paintAs,
  partnerOf,
  removeStop,
  reverseStops,
  updateStop,
} from '../../../src/components/Studio/paint/paintEdit';

/** The value, or a failed test saying it was missing. */
function need<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

/** The picker's arithmetic: kinds, stops, angles and the previews it draws of them. */

const grad: BookGradientPaint = {
  type: 'linear',
  angle: 90,
  stops: [
    { at: 0, color: '#000000' },
    { at: 1, color: '#ffffff', alpha: 0.5 },
  ],
};

describe('kinds', () => {
  it('names the kind of a paint, a gradient being linear or radial', () => {
    expect(kindOf(null)).toBe('none');
    expect(kindOf({ type: 'solid', color: '#000000' })).toBe('solid');
    expect(kindOf(grad)).toBe('gradient');
    expect(kindOf({ ...grad, type: 'radial', cx: 0.5, cy: 0.5, r: 1 } as BookPaint)).toBe('gradient');
    expect(kindOf({ type: 'pattern', pattern: 'dots', fg: '#000000', bg: null, scale: 1, angle: 0 })).toBe('pattern');
  });

  it('keeps the colour across kinds: a solid becomes a gradient from it and a pattern in it', () => {
    const solid: BookPaint = { type: 'solid', color: '#1e3a8a' };
    expect(paintAs('none', solid)).toBeNull();
    expect(paintAs('solid', grad)).toEqual({ type: 'solid', color: '#000000' });
    const g = paintAs('gradient', solid);
    expect(g).toMatchObject({ type: 'linear', angle: 180, stops: [{ at: 0, color: '#1e3a8a' }, { at: 1 }] });
    const p = paintAs('pattern', solid);
    expect(p).toMatchObject({ type: 'pattern', pattern: 'stripes', fg: '#1e3a8a', scale: 1, angle: 45 });
    expect(paintAs('solid', null)).toEqual({ type: 'solid', color: '#111111' });
  });

  it('brings back the paint a kind had when it was left', () => {
    const kept: BookPaint = { type: 'pattern', pattern: 'polka', fg: '#c2410c', bg: null, scale: 2, angle: 0 };
    expect(paintAs('pattern', grad, { pattern: kept })).toBe(kept);
  });

  it('reads the lead colour of a paint, with a fallback for none', () => {
    expect(leadColour(grad)).toBe('#000000');
    expect(leadColour(null, '#abcdef')).toBe('#abcdef');
  });

  it('finds a partner that is lighter for a dark colour and darker for a light one', () => {
    expect(partnerOf('#000000')).toBe(mixHex('#000000', '#ffffff', 0.65));
    expect(partnerOf('#ffffff')).toBe(mixHex('#ffffff', '#111111', 0.35));
    expect(partnerOf('nope')).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('bad', '#ffffff', 0.5)).toBe('bad');
  });
});

describe('stops', () => {
  it('reads the colour a gradient has at a point, alpha and all', () => {
    expect(colourAt(grad.stops, 0.5)).toEqual({ color: '#808080', alpha: 0.75 });
    expect(colourAt(grad.stops, -1)).toEqual({ color: '#000000', alpha: 1 });
    expect(colourAt(grad.stops, 2)).toEqual({ color: '#ffffff', alpha: 0.5 });
    expect(colourAt([], 0.5)).toEqual({ color: '#111111', alpha: 1 });
    expect(
      colourAt(
        [
          { at: 0.5, color: '#ff0000' },
          { at: 0.5, color: '#0000ff' },
        ],
        0.5
      ).color
    ).toBe('#ff0000');
  });

  it('adds a stop in the colour already there, and refuses a seventh', () => {
    const added = need(addStop(grad, 0.25));
    expect(added.index).toBe(2);
    expect(added.paint.stops[2]).toEqual({ at: 0.25, color: '#404040', alpha: 0.875 });
    let full: BookGradientPaint = grad;
    for (let i = 0; i < 4; i++) full = need(addStop(full, i / 10)).paint;
    expect(full.stops).toHaveLength(6);
    expect(addStop(full, 0.5)).toBeNull();
    expect(need(addStop(grad, 4)).paint.stops[2].at).toBe(1);
  });

  it('removes a stop but keeps two, and ignores an index that is not there', () => {
    const three = need(addStop(grad, 0.5)).paint;
    expect(removeStop(three, 2).stops).toHaveLength(2);
    expect(removeStop(grad, 0)).toBe(grad);
    expect(removeStop(three, 9)).toBe(three);
  });

  it('moves and recolours a stop, keeping it on the bar and dropping a full alpha', () => {
    const moved = updateStop(grad, 0, { at: 1.4 });
    expect(moved.stops[0].at).toBe(1);
    const opaque = updateStop(grad, 1, { alpha: 1 });
    expect('alpha' in opaque.stops[1]).toBe(false);
    expect(updateStop(grad, 1, { color: '#ff0000' }).stops[1]).toEqual({ at: 1, color: '#ff0000', alpha: 0.5 });
  });

  it('runs a gradient the other way, and turns linear into radial and back with its stops', () => {
    expect(reverseStops(grad).stops.map((s) => s.at)).toEqual([1, 0]);
    const r = gradientAs(grad, 'radial');
    expect(r).toEqual({ type: 'radial', cx: 0.5, cy: 0.5, r: 1, stops: grad.stops });
    expect(gradientAs(r, 'linear')).toEqual({ type: 'linear', angle: 180, stops: grad.stops });
    expect(gradientAs(grad, 'linear')).toBe(grad);
  });
});

describe('angles and ranges', () => {
  it('keeps an angle to whole degrees from 0 to 359', () => {
    expect(normAngle(360)).toBe(0);
    expect(normAngle(-90)).toBe(270);
    expect(normAngle(45.4)).toBe(45);
  });

  it('reads a pointer as an angle, 0 up and clockwise, snapping to the compass unless asked not to', () => {
    expect(dialAngle(0, -10)).toBe(0);
    expect(dialAngle(10, 0)).toBe(90);
    expect(dialAngle(0, 10)).toBe(180);
    expect(dialAngle(-10, 0)).toBe(270);
    // 47 degrees lands on 45; with the modifier it stays where it was pointed.
    const a = (47 * Math.PI) / 180;
    expect(dialAngle(Math.sin(a), -Math.cos(a))).toBe(45);
    expect(dialAngle(Math.sin(a), -Math.cos(a), true)).toBe(47);
    const b = (60 * Math.PI) / 180;
    expect(dialAngle(Math.sin(b), -Math.cos(b))).toBe(60);
  });

  it('holds scale, radius and a unit inside what the document takes', () => {
    expect(clampScale(10)).toBe(4);
    expect(clampScale(0.1)).toBe(0.25);
    expect(clampRadius(0)).toBe(0.05);
    expect(clampRadius(3)).toBe(2);
    expect(clampUnit(-1)).toBe(0);
    expect(clampUnit(0.12345)).toBe(0.123);
  });
});

describe('previews', () => {
  it('writes stops and paints as CSS for the picker chips', () => {
    expect(cssStops(grad.stops)).toBe('rgb(0 0 0 / 1) 0%, rgb(255 255 255 / 0.5) 100%');
    expect(cssPaint(null)).toBeUndefined();
    expect(cssPaint({ type: 'solid', color: '#ff0000', alpha: 0.2 })).toBe('rgb(255 0 0 / 0.2)');
    expect(cssPaint(grad)).toBe(`linear-gradient(90deg, ${cssStops(grad.stops)})`);
    expect(cssPaint({ type: 'radial', cx: 0.25, cy: 0.5, r: 1, stops: grad.stops })).toMatch(
      /^radial-gradient\(circle at 25% 50%/
    );
    expect(cssPaint({ type: 'pattern', pattern: 'dots', fg: '#000000', bg: '#ffffff', scale: 1, angle: 0 })).toBe(
      '#ffffff'
    );
    expect(cssPaint({ type: 'pattern', pattern: 'dots', fg: '#000000', bg: null, scale: 1, angle: 0 })).toBeUndefined();
  });
});
