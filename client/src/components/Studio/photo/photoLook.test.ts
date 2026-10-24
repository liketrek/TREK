import { photoLookOf, type PhotoLook } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  adjustFilter,
  duotoneMatrix,
  pictureFilter,
  rgba,
  silhouetteShadows,
  svgFilterMatrices,
  warmthMatrix,
  zoomPlacement,
} from './photoLook';

/**
 * The numbers the photo look prints with: the CSS filter chain, the colour
 * matrices of the SVG filter, the box shadows of a rectangular frame and the
 * placement of a zoomed picture.
 */

const look = (over: Partial<PhotoLook> = {}): PhotoLook => ({ ...photoLookOf({}), ...over });
const adjust = (a: Partial<NonNullable<PhotoLook['adjust']>>) => ({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  ...a,
});

describe('photo look rendering', () => {
  it('FE-STUDIO-LOOK-001: turns adjustments into filter functions, leaving out what does not move', () => {
    expect(adjustFilter(null)).toEqual([]);
    expect(adjustFilter(adjust({ brightness: 0.2, contrast: -1, saturation: -1 }))).toEqual([
      'brightness(1.1)',
      'contrast(0.5)',
      'saturate(0)',
    ]);
    expect(adjustFilter(adjust({ warmth: 0.5 }))).toEqual([]);
  });

  it('FE-STUDIO-LOOK-002: chains the preset, the adjustments and the SVG filter, and draws nothing for none', () => {
    expect(pictureFilter(undefined, look(), null)).toBeUndefined();
    expect(pictureFilter('grayscale(1)', look({ adjust: adjust({ contrast: 0.4 }) }), 'f-x')).toBe(
      'grayscale(1) contrast(1.2) url(#f-x)'
    );
  });

  it('FE-STUDIO-LOOK-003: warms by raising red and lowering blue, and cools the other way', () => {
    expect(warmthMatrix(0)).toBeNull();
    expect(warmthMatrix(1)).toBe('1.12 0 0 0 0 0 1.03 0 0 0 0 0 0.88 0 0 0 0 0 1 0');
    expect(warmthMatrix(-1)).toBe('0.88 0 0 0 0 0 0.97 0 0 0 0 0 1.12 0 0 0 0 0 1 0');
  });

  it('FE-STUDIO-LOOK-004: maps black to the dark ink and white to the light one', () => {
    const values = duotoneMatrix({ dark: '#000000', light: '#ffffff' }).split(' ').map(Number);
    // Each colour row reads the luminance weights and starts from the dark ink.
    expect(values.slice(0, 5)).toEqual([0.213, 0.715, 0.072, 0, 0]);
    expect(values.slice(15)).toEqual([0, 0, 0, 1, 0]);
    const navy = duotoneMatrix({ dark: '#ff0000', light: '#ff0000' }).split(' ').map(Number);
    // The same ink at both ends is that ink, whatever the picture.
    expect(navy.slice(0, 5)).toEqual([0, 0, 0, 0, 1]);
    expect(navy.slice(5, 10)).toEqual([0, 0, 0, 0, 0]);
  });

  it('FE-STUDIO-LOOK-005: needs an SVG filter only for warmth or a duotone, warmth first', () => {
    expect(svgFilterMatrices(look())).toEqual([]);
    expect(svgFilterMatrices(look({ adjust: adjust({ brightness: 0.3 }) }))).toEqual([]);
    const both = svgFilterMatrices(
      look({ adjust: adjust({ warmth: 1 }), duotone: { dark: '#000000', light: '#ffffff' } })
    );
    expect(both).toHaveLength(2);
    expect(both[0]).toBe(warmthMatrix(1));
  });

  it('FE-STUDIO-LOOK-006: draws the cutout and a shadow grown by it as flat box shadows', () => {
    expect(silhouetteShadows(null, null)).toEqual([]);
    expect(silhouetteShadows({ dx: 2, dy: 3, color: '#102030', alpha: 0.5 }, null)).toEqual([
      '2mm 3mm 0 0mm rgba(16, 32, 48, 0.5)',
    ]);
    expect(silhouetteShadows({ dx: -1, dy: 1, color: '#000000', alpha: 1 }, { width: 3, color: '#ffffff' })).toEqual([
      '0 0 0 3mm #ffffff',
      '-1mm 1mm 0 3mm rgba(0, 0, 0, 1)',
    ]);
    expect(rgba('#ff8000', 0.25)).toBe('rgba(255, 128, 0, 0.25)');
  });

  it('FE-STUDIO-LOOK-007: places a zoomed picture so the focal point stays where it was', () => {
    expect(zoomPlacement(1, 0.5, 0.5)).toBeNull();
    expect(zoomPlacement(2, 0.5, 0.5)).toEqual({ size: '200%', transform: 'translate(-25%, -25%)' });
    expect(zoomPlacement(4, 0, 1)).toEqual({ size: '400%', transform: 'translate(0%, -75%)' });
  });
});
