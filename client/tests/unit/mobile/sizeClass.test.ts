import { renderHook } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPLIT_QUERY, WIDE_QUERY, isWideViewport, useIsSplit, useIsWide } from '../../../src/hooks/sizeClass';
import { setSizeClass } from '../../helpers/sizeClass';

// FE-MOB-SIZE-001 onwards

const root = resolve(__dirname, '../../..');

describe('size classes', () => {
  it('FE-MOB-SIZE-001: the Tailwind variants and the stylesheet use the same queries as the hooks', () => {
    const tailwind = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8');
    expect(tailwind).toContain(`addVariant('wide', '@media ${WIDE_QUERY}')`);
    expect(tailwind).toContain(`addVariant('split', '@media ${SPLIT_QUERY}')`);
    const css = readFileSync(resolve(root, 'src/mobile/mobile.css'), 'utf8');
    const queries = [...css.matchAll(/@media ([^{]*min-height: 501px[^{]*)\{/g)].map((m) => m[1].trim());
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) expect(q).toBe(WIDE_QUERY);
  });

  it('FE-MOB-SIZE-002: a phone on its side stays compact, a tablet and an unfolded foldable do not', () => {
    // The queries evaluated by hand for the sizes that matter: jsdom has no height feature.
    const evaluate = (query: string, w: number, h: number) => {
      const minW = Number(/min-width: (\d+)px/.exec(query)?.[1]);
      const minH = Number(/min-height: (\d+)px/.exec(query)?.[1]);
      return w >= minW && h >= minH;
    };
    const sizes: Record<string, [number, number, boolean, boolean]> = {
      phone: [402, 874, false, false],
      phoneLandscape: [956, 440, false, false],
      ipadMiniPortrait: [744, 1133, true, false],
      ipad13Landscape: [1376, 1032, true, true],
      ipad11SplitHalf: [590, 834, false, false],
      ipad13SplitHalf: [683, 1032, true, false],
      duoUnfoldedLandscape: [1017, 699, true, true],
      duoUnfoldedPortrait: [699, 1017, true, false],
    };
    for (const [name, [w, h, wide, split]] of Object.entries(sizes)) {
      expect([name, evaluate(WIDE_QUERY, w, h)]).toEqual([name, wide]);
      expect([name, evaluate(SPLIT_QUERY, w, h)]).toEqual([name, split]);
    }
  });

  it('FE-MOB-SIZE-003: the hooks follow a change of size class, as on a rotation or a fold', () => {
    const wide = renderHook(() => useIsWide());
    const split = renderHook(() => useIsSplit());
    expect(wide.result.current).toBe(false);
    expect(split.result.current).toBe(false);

    setSizeClass('wide');
    expect(wide.result.current).toBe(true);
    expect(split.result.current).toBe(false);
    expect(isWideViewport()).toBe(true);

    setSizeClass('split');
    expect(split.result.current).toBe(true);

    setSizeClass('compact');
    expect(wide.result.current).toBe(false);
    expect(split.result.current).toBe(false);
  });
});
