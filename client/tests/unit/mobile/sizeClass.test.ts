import { act, renderHook } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetSizeClass,
  isWideViewport,
  sizeClassOf,
  useIsSplit,
  useIsWide,
  useSizeClass,
} from '../../../src/hooks/sizeClass';
import { setSizeClass } from '../../helpers/sizeClass';

// FE-MOB-SIZE-001 onwards

const native = vi.hoisted(() => ({ app: false }));
vi.mock('../../../src/native/platform', () => ({
  isNativeApp: () => native.app,
  isNativeIos: () => false,
  isNativeAndroid: () => native.app,
  nativeServerHost: () => null,
}));

const root = resolve(__dirname, '../../..');

function resizeTo(width: number, height: number) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
  });
}

describe('size classes', () => {
  const initial = { width: window.innerWidth, height: window.innerHeight };
  beforeEach(() => {
    native.app = false;
    _resetSizeClass();
  });
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: initial.width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: initial.height });
    document.body.innerHTML = '';
  });

  it('FE-MOB-SIZE-001: the Tailwind variants and the stylesheet follow the class on the shell, not media queries of their own', () => {
    const tailwind = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8');
    expect(tailwind).toContain(
      `addVariant('wide', ':where(html:has(.m-shell[data-size="wide"], .m-shell[data-size="split"])) &')`
    );
    expect(tailwind).toContain(`addVariant('split', ':where(html:has(.m-shell[data-size="split"])) &')`);
    const css = readFileSync(resolve(root, 'src/mobile/mobile.css'), 'utf8');
    expect(css).not.toMatch(/min-height: 501px/);
    expect(css).toContain(`html:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-root {`);
  });

  it('FE-MOB-SIZE-002: a phone on its side stays compact, a tablet and an unfolded foldable do not', () => {
    const sizes: Record<string, [number, number, string]> = {
      phone: [402, 874, 'compact'],
      phoneLandscape: [956, 440, 'compact'],
      ipadMiniPortrait: [744, 1133, 'wide'],
      ipad13Landscape: [1376, 1032, 'split'],
      ipad11SplitHalf: [590, 834, 'compact'],
      ipad13SplitHalf: [683, 1032, 'wide'],
      duoUnfoldedLandscape: [1017, 699, 'split'],
      duoUnfoldedPortrait: [699, 1017, 'wide'],
      ipad11Portrait: [834, 1194, 'wide'],
      androidFoldUnfoldedLandscape: [841, 701, 'split'],
      androidFoldUnfoldedPortrait: [701, 841, 'wide'],
    };
    for (const [name, [w, h, expected]] of Object.entries(sizes)) {
      expect([name, sizeClassOf(w, h)]).toEqual([name, expected]);
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

  it('FE-MOB-SIZE-004: in a browser the touch shell stays compact at any size', () => {
    resizeTo(744, 1133);
    const cls = renderHook(() => useSizeClass());
    expect(cls.result.current).toBe('compact');
    resizeTo(1376, 1032);
    expect(cls.result.current).toBe('compact');
    expect(isWideViewport()).toBe(false);
  });

  it('FE-MOB-SIZE-005: in the app the class follows the window', () => {
    native.app = true;
    resizeTo(402, 874);
    const cls = renderHook(() => useSizeClass());
    expect(cls.result.current).toBe('compact');
    resizeTo(744, 1133);
    expect(cls.result.current).toBe('wide');
    resizeTo(1133, 744);
    expect(cls.result.current).toBe('split');
    resizeTo(874, 402);
    expect(cls.result.current).toBe('compact');
  });

  it('FE-MOB-SIZE-006: the soft keyboard taking height from the window leaves the class alone', () => {
    native.app = true;
    resizeTo(1280, 800);
    const cls = renderHook(() => useSizeClass());
    expect(cls.result.current).toBe('split');

    // A field gets focus and Android's keyboard shrinks the WebView to 400px.
    const field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();
    resizeTo(1280, 400);
    expect(cls.result.current).toBe('split');
    expect(document.activeElement).toBe(field);

    // The keyboard goes down: the window is whole again, nothing moved.
    resizeTo(1280, 800);
    expect(cls.result.current).toBe('split');

    // Without a field in focus a shorter window is a new window.
    field.blur();
    resizeTo(1280, 400);
    expect(cls.result.current).toBe('compact');
  });

  it('FE-MOB-SIZE-007: a turn while typing is still taken, the keyboard only holds the height', () => {
    native.app = true;
    resizeTo(701, 841);
    const cls = renderHook(() => useSizeClass());
    expect(cls.result.current).toBe('wide');
    const field = document.createElement('textarea');
    document.body.appendChild(field);
    field.focus();
    resizeTo(701, 470);
    expect(cls.result.current).toBe('wide');
    resizeTo(841, 701);
    expect(cls.result.current).toBe('split');
  });

  it('FE-MOB-SIZE-008: a checkbox in focus brings up no keyboard, so it holds nothing', () => {
    native.app = true;
    resizeTo(1280, 800);
    const cls = renderHook(() => useSizeClass());
    const box = document.createElement('input');
    box.type = 'checkbox';
    document.body.appendChild(box);
    box.focus();
    resizeTo(1280, 400);
    expect(cls.result.current).toBe('compact');
  });
});
