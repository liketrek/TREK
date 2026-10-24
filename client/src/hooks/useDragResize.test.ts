// FE-HOOK-DRAG-001 to FE-HOOK-DRAG-019
import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import {
  clampRect,
  cornerRect,
  expandedRect,
  keyedRect,
  resizeRect,
  snapRect,
  useDragResize,
  type WindowRect,
  type WindowSize,
} from './useDragResize';

const MIN: WindowSize = { width: 340, height: 420 };
const bounds = (width = 1280, height = 800, topInset = 0) => ({
  viewport: { width, height },
  minSize: MIN,
  margin: 16,
  topInset,
});
const KEY = 'trek.test.window';
const OPTIONS = {
  storageKey: KEY,
  minSize: MIN,
  defaultSize: { width: 400, height: 600 },
  expandedSize: (viewport: WindowSize) => ({ width: 720, height: Math.round(viewport.height * 0.8) }),
  margin: 16,
  gap: 24,
};

const press = (key: string, mods: { shiftKey?: boolean; altKey?: boolean } = {}) => ({
  key,
  altKey: mods.altKey ?? true,
  shiftKey: mods.shiftKey ?? false,
  ctrlKey: false,
  metaKey: false,
});

function handle(): HTMLElement {
  const el = document.createElement('div');
  el.setPointerCapture = vi.fn();
  return el;
}

function pointerDown(el: HTMLElement, clientX: number, clientY: number) {
  return {
    button: 0,
    pointerId: 1,
    clientX,
    clientY,
    currentTarget: el,
    preventDefault: vi.fn(),
  } as unknown as ReactPointerEvent<HTMLElement>;
}

function pointer(el: HTMLElement, type: 'pointermove' | 'pointerup', clientX: number, clientY: number) {
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { clientX, clientY }));
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('innerHeight', 800);
  document.documentElement.dir = 'ltr';
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.dir = '';
});

describe('window geometry', () => {
  it('FE-HOOK-DRAG-001: clampRect keeps the rect inside the viewport, margins included', () => {
    expect(clampRect({ x: -50, y: 900, width: 400, height: 600 }, bounds())).toEqual({
      x: 16,
      y: 184,
      width: 400,
      height: 600,
    });
    expect(clampRect({ x: 0, y: 0, width: 100, height: 100 }, bounds())).toMatchObject({ width: 340, height: 420 });
  });

  it('FE-HOOK-DRAG-002: clampRect lets a small viewport win over the minimum size', () => {
    expect(clampRect({ x: 0, y: 0, width: 400, height: 600 }, bounds(300, 400))).toEqual({
      x: 16,
      y: 16,
      width: 268,
      height: 368,
    });
  });

  it('FE-HOOK-DRAG-003: cornerRect sits in the bottom end corner, gap from both edges', () => {
    expect(cornerRect({ width: 400, height: 600 }, 24, bounds())).toEqual({ x: 856, y: 176, width: 400, height: 600 });
  });

  it('FE-HOOK-DRAG-004: snapRect settles a window released near a corner into it', () => {
    expect(snapRect({ x: 20, y: 10, width: 400, height: 600 }, 24, bounds())).toEqual({
      x: 24,
      y: 24,
      width: 400,
      height: 600,
    });
    expect(snapRect({ x: 870, y: 190, width: 400, height: 600 }, 24, bounds())).toMatchObject({ x: 856, y: 176 });
  });

  it('FE-HOOK-DRAG-005: snapRect leaves a window near one edge only where it is', () => {
    const rect = { x: 20, y: 100, width: 400, height: 600 };
    expect(snapRect(rect, 24, bounds())).toBe(rect);
  });

  it('FE-HOOK-DRAG-006: resizeRect from the start edge keeps the end edge in place, down to the minimum', () => {
    const start: WindowRect = { x: 500, y: 100, width: 400, height: 600 };
    expect(resizeRect(start, 'start', -100, 0, bounds())).toEqual({ x: 400, y: 100, width: 500, height: 600 });
    expect(resizeRect(start, 'start', 300, 0, bounds())).toEqual({ x: 560, y: 100, width: 340, height: 600 });
  });

  it('FE-HOOK-DRAG-007: resizeRect from a corner pulls both edges, stopped by the viewport', () => {
    const start: WindowRect = { x: 500, y: 100, width: 400, height: 600 };
    expect(resizeRect(start, 's-end', 2000, 2000, bounds())).toEqual({ x: 500, y: 100, width: 764, height: 684 });
    expect(resizeRect(start, 'n', 0, -500, bounds())).toEqual({ x: 500, y: 16, width: 400, height: 684 });
  });

  it('FE-HOOK-DRAG-008: expandedRect sits at the inline end, centred from top to bottom', () => {
    expect(expandedRect({ width: 720, height: 640 }, 24, bounds())).toEqual({ x: 536, y: 80, width: 720, height: 640 });
  });

  it('FE-HOOK-DRAG-009: keyedRect moves with Alt+arrows, resizes with Alt+Shift+arrows, and reads arrows as seen', () => {
    const rect: WindowRect = { x: 500, y: 100, width: 400, height: 600 };
    expect(keyedRect(rect, press('ArrowRight'), false, bounds())).toMatchObject({ x: 516, y: 100 });
    expect(keyedRect(rect, press('ArrowRight'), true, bounds())).toMatchObject({ x: 484 });
    expect(keyedRect(rect, press('ArrowDown', { shiftKey: true }), false, bounds())).toMatchObject({ height: 616 });
    expect(keyedRect(rect, press('ArrowRight', { altKey: false }), false, bounds())).toBeNull();
    expect(keyedRect(rect, press('Enter'), false, bounds())).toBeNull();
  });

  it('FE-HOOK-DRAG-018: a top inset keeps the window below the bar there, in every placement', () => {
    const below = bounds(1280, 800, 64);
    expect(clampRect({ x: 100, y: 0, width: 400, height: 600 }, below)).toMatchObject({ y: 80 });
    expect(clampRect({ x: 0, y: 0, width: 400, height: 900 }, below)).toMatchObject({ y: 80, height: 704 });
    expect(snapRect({ x: 20, y: 80, width: 400, height: 600 }, 24, below)).toMatchObject({ x: 24, y: 88 });
    const start: WindowRect = { x: 500, y: 100, width: 400, height: 600 };
    expect(resizeRect(start, 'n', 0, -500, below)).toEqual({ x: 500, y: 80, width: 400, height: 620 });
    expect(expandedRect({ width: 720, height: 640 }, 24, below)).toMatchObject({ y: 112 });
  });
});

describe('useDragResize', () => {
  it('FE-HOOK-DRAG-010: opens in the bottom end corner on a first visit', () => {
    const { result } = renderHook(() => useDragResize(OPTIONS));
    expect(result.current.rect).toEqual({ x: 856, y: 176, width: 400, height: 600 });
    expect(result.current.active).toBe(false);
  });

  it('FE-HOOK-DRAG-011: comes back where it was left, clamped to the screen it opens on', () => {
    localStorage.setItem(KEY, JSON.stringify({ x: 2000, y: 50, width: 500, height: 500 }));
    const { result } = renderHook(() => useDragResize(OPTIONS));
    expect(result.current.rect).toEqual({ x: 764, y: 50, width: 500, height: 500 });
  });

  it('FE-HOOK-DRAG-012: ignores a stored value that is not a rect', () => {
    localStorage.setItem(KEY, '{"x":"left"}');
    const { result } = renderHook(() => useDragResize(OPTIONS));
    expect(result.current.rect).toMatchObject({ x: 856, y: 176 });
  });

  it('FE-HOOK-DRAG-013: drags by the handle, snaps into a corner on release and remembers it', () => {
    const { result } = renderHook(() => useDragResize(OPTIONS));
    const el = handle();
    act(() => result.current.handleProps.onPointerDown(pointerDown(el, 1000, 200)));
    expect(el.setPointerCapture).toHaveBeenCalledWith(1);
    expect(result.current.active).toBe(true);

    pointer(el, 'pointermove', 160, 40);
    expect(result.current.rect).toMatchObject({ x: 16, y: 16 });
    pointer(el, 'pointerup', 160, 40);

    expect(result.current.active).toBe(false);
    expect(result.current.rect).toMatchObject({ x: 24, y: 24 });
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ x: 24, y: 24, width: 400, height: 600 });
  });

  it('FE-HOOK-DRAG-014: a pointer moving left in a right-to-left page moves the window towards its end', () => {
    document.documentElement.dir = 'rtl';
    localStorage.setItem(KEY, JSON.stringify({ x: 400, y: 100, width: 400, height: 600 }));
    const { result } = renderHook(() => useDragResize(OPTIONS));
    const el = handle();
    act(() => result.current.handleProps.onPointerDown(pointerDown(el, 600, 300)));
    pointer(el, 'pointermove', 500, 300);
    expect(result.current.rect.x).toBe(500);
  });

  it('FE-HOOK-DRAG-015: resizes from an edge and switches to the large size and back on a double click', () => {
    const { result } = renderHook(() => useDragResize(OPTIONS));
    const el = handle();
    act(() => result.current.edgeProps('start').onPointerDown(pointerDown(el, 856, 400)));
    pointer(el, 'pointermove', 756, 400);
    pointer(el, 'pointerup', 756, 400);
    expect(result.current.rect).toEqual({ x: 756, y: 176, width: 500, height: 600 });

    act(() => result.current.handleProps.onDoubleClick({} as never));
    expect(result.current.rect).toEqual({ x: 536, y: 80, width: 720, height: 640 });
    act(() => result.current.handleProps.onDoubleClick({} as never));
    expect(result.current.rect).toEqual({ x: 756, y: 176, width: 500, height: 600 });
  });

  it('FE-HOOK-DRAG-017: the presses of a double click on the handle keep the way back to the compact size', () => {
    const { result } = renderHook(() => useDragResize(OPTIONS));
    const el = handle();
    const doubleClick = () => {
      act(() => result.current.handleProps.onPointerDown(pointerDown(el, 1000, 200)));
      pointer(el, 'pointerup', 1000, 200);
      act(() => result.current.handleProps.onPointerDown(pointerDown(el, 1000, 200)));
      pointer(el, 'pointerup', 1000, 200);
      act(() => result.current.handleProps.onDoubleClick({} as never));
    };

    doubleClick();
    expect(result.current.rect).toEqual({ x: 536, y: 80, width: 720, height: 640 });
    doubleClick();
    expect(result.current.rect).toEqual({ x: 856, y: 176, width: 400, height: 600 });
  });

  it('FE-HOOK-DRAG-016: Alt+arrows move it and claim the key, a shrinking browser pulls it back in', () => {
    const { result } = renderHook(() => useDragResize(OPTIONS));
    const preventDefault = vi.fn();
    act(() => result.current.onKeyDown({ ...press('ArrowUp'), preventDefault } as never));
    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.rect.y).toBe(160);

    act(() => {
      vi.stubGlobal('innerWidth', 900);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.rect).toMatchObject({ x: 484, width: 400 });
  });

  it('FE-HOOK-DRAG-019: Alt+arrows typed in a field stay with the field', () => {
    const { result } = renderHook(() => useDragResize({ ...OPTIONS, topInset: 64 }));
    const field = document.createElement('textarea');
    const preventDefault = vi.fn();
    act(() => result.current.onKeyDown({ ...press('ArrowLeft'), target: field, preventDefault } as never));
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.rect).toEqual({ x: 856, y: 176, width: 400, height: 600 });

    const el = handle();
    act(() => result.current.handleProps.onPointerDown(pointerDown(el, 1000, 200)));
    pointer(el, 'pointermove', 1000, 0);
    expect(result.current.rect.y).toBe(80);
  });
});
