// FE-HOOK-ELRECT-001 to FE-HOOK-ELRECT-007
import { act, renderHook } from '@testing-library/react';
import { useElementRect } from './useElementRect';

const observers: { fire: () => void; disconnected: boolean }[] = [];

class ControllableResizeObserver {
  private entry: { fire: () => void; disconnected: boolean } | null = null;
  constructor(private cb: ResizeObserverCallback) {}
  observe() {
    this.entry = { fire: () => this.cb([], this as unknown as ResizeObserver), disconnected: false };
    observers.push(this.entry);
  }
  unobserve() {}
  disconnect() {
    if (this.entry) this.entry.disconnected = true;
  }
}

function element(left: number, width: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left, width, right: left + width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ({}) });
  return el;
}

function moveTo(el: HTMLElement, left: number, width: number): void {
  el.getBoundingClientRect = () => ({ left, width, right: left + width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ({}) });
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', ControllableResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useElementRect', () => {
  it('FE-HOOK-ELRECT-001: has no rect until an element is attached', () => {
    const { result } = renderHook(() => useElementRect());
    expect(result.current.rect).toBeNull();
  });

  it('FE-HOOK-ELRECT-002: measures left and width on attach', () => {
    const { result } = renderHook(() => useElementRect());
    act(() => result.current.ref(element(240, 400)));
    expect(result.current.rect).toEqual({ left: 240, width: 400 });
  });

  it('FE-HOOK-ELRECT-003: re-measures when the element resizes', () => {
    const { result } = renderHook(() => useElementRect());
    const el = element(240, 400);
    act(() => result.current.ref(el));

    moveTo(el, 120, 560);
    act(() => observers[0].fire());

    expect(result.current.rect).toEqual({ left: 120, width: 560 });
  });

  it('FE-HOOK-ELRECT-004: re-measures on a window resize', () => {
    const { result } = renderHook(() => useElementRect());
    const el = element(240, 400);
    act(() => result.current.ref(el));

    moveTo(el, 0, 800);
    act(() => window.dispatchEvent(new Event('resize')));

    expect(result.current.rect).toEqual({ left: 0, width: 800 });
  });

  it('FE-HOOK-ELRECT-005: keeps the previous rect object when nothing moved', () => {
    const { result } = renderHook(() => useElementRect());
    act(() => result.current.ref(element(240, 400)));
    const before = result.current.rect;

    act(() => observers[0].fire());

    expect(result.current.rect).toBe(before);
  });

  it('FE-HOOK-ELRECT-006: clears the rect and disconnects when the ref detaches', () => {
    const { result } = renderHook(() => useElementRect());
    act(() => result.current.ref(element(240, 400)));
    act(() => result.current.ref(null));

    expect(result.current.rect).toBeNull();
    expect(observers[0].disconnected).toBe(true);
  });

  it('FE-HOOK-ELRECT-007: drops the window listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(() => useElementRect());
    act(() => result.current.ref(element(10, 20)));
    unmount();

    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    remove.mockRestore();
  });
});
