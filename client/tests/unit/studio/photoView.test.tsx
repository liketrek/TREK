import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared';
import { bookPageSetupSchema } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { SpreadView } from '../../../src/components/Studio/SpreadView';
import { render } from '../../helpers/render';

/**
 * The photo look as the page draws it, through SpreadView, the one renderer
 * the editor, the thumbnails and the print path share: border, hard shadow,
 * cutout, zoom, mirror, adjustments and duotone, and ids that stay unique
 * when a spread is drawn twice.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210',
  pageWidth: 210,
  pageHeight: 210,
  bleed: 3,
  safe: 5,
});

const frame = { x: 10, y: 20, w: 80, h: 60 };

const photo = (over: Record<string, unknown> = {}): BookElement =>
  ({
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    id: 'p1',
    kind: 'photo',
    photoId: 42,
    fit: 'cover',
    focalX: 0.5,
    focalY: 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: 'none',
    ...over,
  }) as BookElement;

const spread = (elements: BookElement[]): BookSpread => ({
  id: 's1',
  role: 'inner',
  background: null,
  elements,
  parked: [],
  entryId: null,
});

const draw = (elements: BookElement[], print = false) =>
  render(<SpreadView spread={spread(elements)} page={page} print={print} />);

/** The photo's own box: the sheet's first child. */
const outer = (container: HTMLElement) => container.firstElementChild?.firstElementChild as HTMLElement;
const styleOf = (el: Element | null | undefined) => el?.getAttribute('style') ?? '';

describe('the photo look on the page', () => {
  it('FE-STUDIO-PHOTO-001: draws a plain photo exactly as before, with no look layers', () => {
    const { container } = draw([photo()]);
    expect(outer(container).querySelector('svg')).toBeNull();
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.width).toBe('100%');
    expect(img.style.transform).toBe('');
    expect(styleOf(outer(container))).not.toContain('box-shadow');
  });

  it('FE-STUDIO-PHOTO-002: lays a border band over the edge of a rectangular picture, rounded with it', () => {
    const { container } = draw([photo({ border: { width: 4, color: '#ffffff' }, radius: 3 })]);
    const band = container.querySelector('img')?.parentElement?.querySelector('div[aria-hidden]') as HTMLElement;
    expect(band.style.borderWidth).toBe('4mm');
    expect(band.style.borderStyle).toBe('solid');
    expect(band.style.borderRadius).toBe('3mm');
  });

  it('FE-STUDIO-PHOTO-003: strokes the border along a mask, twice as wide so its inner half shows', () => {
    const { container } = draw([photo({ mask: 'heart', border: { width: 2.5, color: '#102030' } })]);
    const stroked = [...container.querySelectorAll('path')].find((p) => p.getAttribute('fill') === 'none');
    expect(stroked?.getAttribute('stroke')).toBe('#102030');
    expect(stroked?.getAttribute('stroke-width')).toBe('5');
  });

  it('FE-STUDIO-PHOTO-004: gives a rectangular frame its cutout and hard shadow as flat box shadows', () => {
    const { container } = draw([
      photo({ shadow: { dx: 2, dy: 3, color: '#000000', alpha: 0.5 }, cutout: { width: 3, color: '#ffffff' } }),
    ]);
    const css = styleOf(outer(container));
    expect(css).toContain('0 0 0 3mm');
    expect(css).toContain('2mm 3mm 0 3mm');
    expect(outer(container).querySelector('svg')).toBeNull();
  });

  it('FE-STUDIO-PHOTO-005: draws the cutout and shadow of a shaped frame as its path, behind the picture', () => {
    const { container } = draw([
      photo({
        mask: 'star-5',
        shadow: { dx: 1, dy: 1, color: '#222222', alpha: 0.4 },
        cutout: { width: 2, color: '#fafafa' },
      }),
    ]);
    const box = outer(container);
    const silhouette = box.firstElementChild as SVGElement;
    expect(silhouette.tagName.toLowerCase()).toBe('svg');
    const paths = silhouette.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[0]?.getAttribute('transform')).toBe('translate(1 1)');
    expect(paths[0]?.parentElement?.getAttribute('opacity')).toBe('0.4');
    expect(paths[1]?.getAttribute('stroke-width')).toBe('4');
    expect(styleOf(box)).not.toContain('box-shadow');
  });

  it('FE-STUDIO-PHOTO-006: a Polaroid keeps a rectangular shadow even with a mask, beside its soft one', () => {
    const { container } = draw([
      photo({ frameStyle: 'polaroid', mask: 'heart', shadow: { dx: 2, dy: 2, color: '#000000', alpha: 1 } }),
    ]);
    const css = styleOf(outer(container));
    expect(css).toContain('2mm 2mm 0 0mm');
    expect(css).toContain('1.2mm 3mm');
  });

  it('FE-STUDIO-PHOTO-007: zooms the picture about its focal point and mirrors it inside its frame', () => {
    const { container } = draw([photo({ zoom: 2, focalX: 0.5, focalY: 0.5, flipX: true })]);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.width).toBe('200%');
    expect(img.style.transform).toBe('translate(-25%, -25%)');
    expect(img.parentElement?.style.transform).toBe('scaleX(-1)');
  });

  it('FE-STUDIO-PHOTO-008: filters the picture with the adjustments and an SVG filter for warmth and duotone', () => {
    const { container } = draw([
      photo({
        filter: 'bw',
        adjust: { brightness: 0.2, warmth: 0.5 },
        duotone: { dark: '#000000', light: '#ffffff' },
      }),
    ]);
    const filter = container.querySelector('filter') as SVGFilterElement;
    expect(filter.querySelectorAll('feColorMatrix')).toHaveLength(2);
    const css = styleOf(container.querySelector('img'));
    expect(css).toContain('grayscale(1)');
    expect(css).toContain('brightness(1.1)');
    expect(css).toContain(`url(#${filter.id})`);
  });

  it('FE-STUDIO-PHOTO-009: gives every drawing of a spread its own clip and filter ids', () => {
    const el = photo({ mask: 'heart', duotone: { dark: '#000000', light: '#ffffff' } });
    const { container } = render(
      <>
        <SpreadView spread={spread([el])} page={page} />
        <SpreadView spread={spread([el])} page={page} />
      </>
    );
    const ids = [...container.querySelectorAll('clipPath, filter')].map((n) => n.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('FE-STUDIO-PHOTO-010: an empty frame wears no look, and prints nothing', () => {
    const look = { border: { width: 4, color: '#ffffff' }, cutout: { width: 2, color: '#ffffff' }, mask: 'heart' };
    const { container } = draw([photo({ photoId: null, ...look })]);
    expect(container.querySelector('img')).toBeNull();
    expect([...container.querySelectorAll('path')].some((p) => p.getAttribute('fill') === 'none')).toBe(false);
    const { container: printed } = draw([photo({ photoId: null, ...look })], true);
    expect(printed.querySelector('[style*="left: 10mm"]')).toBeNull();
  });
});
