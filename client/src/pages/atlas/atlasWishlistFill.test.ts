import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWishlistPattern, hexToRgba, svgWishlistFill } from './atlasWishlistFill';

describe('hexToRgba', () => {
  it('turns a hex colour into an rgba string with the given alpha', () => {
    expect(hexToRgba('#ff8000', 0.2)).toBe('rgba(255,128,0,0.2)');
  });
});

describe('svgWishlistFill', () => {
  afterEach(() => {
    document.getElementById('trek-wish-patterns')?.remove();
  });

  it('references a pattern it adds once to a hidden defs block', () => {
    expect(svgWishlistFill('#123456', false)).toBe('url(#trek-wish-123456-l)');
    expect(svgWishlistFill('#123456', false)).toBe('url(#trek-wish-123456-l)');
    const host = document.getElementById('trek-wish-patterns');
    expect(host?.getAttribute('aria-hidden')).toBe('true');
    expect(host?.querySelectorAll('pattern')).toHaveLength(1);
  });

  it('keeps one pattern per theme, with a lighter tint in the dark theme', () => {
    svgWishlistFill('#123456', false);
    expect(svgWishlistFill('#123456', true)).toBe('url(#trek-wish-123456-d)');
    const dark = document.getElementById('trek-wish-123456-d');
    expect(dark?.querySelector('rect')?.getAttribute('fill')).toBe('rgba(18,52,86,0.14)');
    expect(document.querySelectorAll('#trek-wish-patterns pattern')).toHaveLength(2);
  });
});

describe('createWishlistPattern', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null where the canvas has no 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(createWishlistPattern('#123456', false)).toBeNull();
  });

  it('returns null when building the pattern throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('no canvas');
    });
    expect(createWishlistPattern('#123456', false)).toBeNull();
  });

  it('paints the tint and the stripes, then repeats them', () => {
    const pattern = {} as CanvasPattern;
    const ctx = {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createPattern: vi.fn(() => pattern),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
    expect(createWishlistPattern('#123456', true)).toBe(pattern);
    expect(ctx.fillStyle).toBe('rgba(18,52,86,0.14)');
    expect(ctx.strokeStyle).toBe('#123456');
    expect(ctx.createPattern).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 'repeat');
  });
});
