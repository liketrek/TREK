// FE-HOOK-COLLAPSE-001 to FE-HOOK-COLLAPSE-006
import { act, renderHook } from '@testing-library/react';
import { useCollapseOnOverflow } from './useCollapseOnOverflow';

function strip(scrollWidth: number, clientWidth: number): HTMLDivElement {
  const el = document.createElement('div');
  setWidths(el, scrollWidth, clientWidth);
  return el;
}

function setWidths(el: HTMLElement, scrollWidth: number, clientWidth: number): void {
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
}

function resizeWindow(width: number): void {
  act(() => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  });
}

function mount(el: HTMLDivElement, key = 'a|b|c') {
  return renderHook(
    ({ k }) => {
      const result = useCollapseOnOverflow<HTMLDivElement>(k);
      result.ref.current = el;
      return result;
    },
    { initialProps: { k: key } }
  );
}

const originalWidth = window.innerWidth;
afterEach(() => {
  window.innerWidth = originalWidth;
});

describe('useCollapseOnOverflow', () => {
  it('FE-HOOK-COLLAPSE-001: keeps the labels while the strip fits', () => {
    window.innerWidth = 1600;
    const { result } = mount(strip(500, 500));
    resizeWindow(1500);
    expect(result.current.collapsed).toBe(false);
  });

  it('FE-HOOK-COLLAPSE-002: collapses once the strip overflows', () => {
    window.innerWidth = 1600;
    const el = strip(500, 500);
    const { result } = mount(el);
    setWidths(el, 740, 640);
    resizeWindow(1200);
    expect(result.current.collapsed).toBe(true);
  });

  it('FE-HOOK-COLLAPSE-003: brings the labels back only once the window has the missing width', () => {
    window.innerWidth = 1200;
    const el = strip(740, 640);
    const { result } = mount(el);
    expect(result.current.collapsed).toBe(true);
    // Collapsed, the strip fits by definition, so only the window width counts.
    setWidths(el, 320, 320);
    resizeWindow(1250);
    expect(result.current.collapsed).toBe(true);
    setWidths(el, 740, 740);
    resizeWindow(1300);
    expect(result.current.collapsed).toBe(false);
  });

  it('FE-HOOK-COLLAPSE-004: measures again when the set of items changes', () => {
    window.innerWidth = 1200;
    const el = strip(740, 640);
    const { result, rerender } = mount(el);
    expect(result.current.collapsed).toBe(true);
    // One tab fewer: the labels fit at the same window width.
    setWidths(el, 600, 600);
    rerender({ k: 'a|b' });
    expect(result.current.collapsed).toBe(false);
  });

  it('FE-HOOK-COLLAPSE-005: stops listening on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = mount(strip(500, 500));
    unmount();
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    remove.mockRestore();
  });
  it('FE-HOOK-COLLAPSE-006: measures again when the strip itself changes size, a font or text size with it', () => {
    let resized: (() => void) | null = null;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          resized = cb;
        }
        observe() {}
        disconnect() {}
      }
    );
    window.innerWidth = 1600;
    const el = strip(500, 500);
    const { result } = mount(el);
    expect(result.current.collapsed).toBe(false);
    setWidths(el, 700, 600);
    act(() => resized?.());
    expect(result.current.collapsed).toBe(true);
    vi.unstubAllGlobals();
  });
});
