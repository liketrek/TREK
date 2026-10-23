import { bookPageSetupSchema, type BookPageSetup, type BookSpread } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { SpreadThumb } from '../../../src/components/Studio/SpreadThumb';
import { render } from '../../helpers/render';

/**
 * FE-STUDIO-THUMB-001 to FE-STUDIO-THUMB-003
 *
 * One spread drawn small: the editor's own SpreadView under a scale(), sized
 * by the width it is given and the page, always left to right, with the
 * crease only down an open double spread. The page rail and the Studio chat's
 * page card both draw with it.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210',
  pageWidth: 210,
  pageHeight: 210,
  bleed: 3,
  safe: 5,
});

function spread(role: BookSpread['role']): BookSpread {
  return { id: 'sp-1', role, background: '#f4efe6', elements: [], parked: [], entryId: null };
}

/** The sheet, the scaled page inside it and what else it holds. */
function drawn(container: HTMLElement) {
  const sheet = container.firstElementChild as HTMLElement;
  const scaled = sheet.firstElementChild as HTMLElement;
  return { sheet, scaled, children: sheet.children.length };
}

describe('SpreadThumb', () => {
  it('FE-STUDIO-THUMB-001: a double spread is as wide as asked and as high as its page, scaled from millimetres', () => {
    const { container } = render(<SpreadThumb spread={spread('inner')} page={page} width={200} className="sheet" />);
    const { sheet, scaled } = drawn(container);
    expect(sheet.className).toBe('sheet');
    expect(sheet.style.width).toBe('200px');
    expect(parseFloat(sheet.style.height)).toBeCloseTo(100, 5);
    expect(scaled.style.width).toBe('420mm');
    expect(scaled.style.transform).toBe(`scale(${200 / (420 * (96 / 25.4))})`);
    expect(scaled.style.transformOrigin).toBe('top left');
  });

  it('FE-STUDIO-THUMB-002: a single page is drawn at its own width, and every sheet reads left to right', () => {
    const { container } = render(<SpreadThumb spread={spread('cover')} page={page} width={100} />);
    const { sheet, scaled } = drawn(container);
    expect(sheet.getAttribute('dir')).toBe('ltr');
    expect(parseFloat(sheet.style.height)).toBeCloseTo(100, 5);
    expect(scaled.style.width).toBe('210mm');
  });

  it('FE-STUDIO-THUMB-003: the crease runs down an open double spread only', () => {
    const open = render(<SpreadThumb spread={spread('inner')} page={page} width={200} fold />);
    expect(drawn(open.container).children).toBe(2);
    const shut = render(<SpreadThumb spread={spread('inner')} page={page} width={200} />);
    expect(drawn(shut.container).children).toBe(1);
    const cover = render(<SpreadThumb spread={spread('cover')} page={page} width={100} fold />);
    expect(drawn(cover.container).children).toBe(1);
  });
});
