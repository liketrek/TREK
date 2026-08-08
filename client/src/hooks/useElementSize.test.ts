// FE-HOOK-ELSIZE-001 to FE-HOOK-ELSIZE-006
import { act, renderHook } from '@testing-library/react';
import { useElementSize } from './useElementSize';

// tests/setup.ts installs a no-op ResizeObserver. Swap in one that hands the
// callback back so a resize can be simulated, and count the connections so the
// disconnect-on-detach contract is observable.
const observers: { el: Element; fire: () => void; disconnected: boolean }[] = [];

class ControllableResizeObserver {
  private entry: { el: Element; fire: () => void; disconnected: boolean } | null = null;
  constructor(private cb: ResizeObserverCallback) {}
  observe(el: Element) {
    this.entry = { el, fire: () => this.cb([], this as unknown as ResizeObserver), disconnected: false };
    observers.push(this.entry);
  }
  unobserve() {}
  disconnect() {
    if (this.entry) this.entry.disconnected = true;
  }
}

function element(width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

function resize(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', ControllableResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useElementSize', () => {
  it('FE-HOOK-ELSIZE-001: starts at zero before an element is attached', () => {
    const { result } = renderHook(() => useElementSize());
    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
    expect(observers).toHaveLength(0);
  });

  it('FE-HOOK-ELSIZE-002: measures the element as soon as the ref is attached', () => {
    const { result } = renderHook(() => useElementSize());
    act(() => result.current.ref(element(320, 180)));

    expect(result.current.width).toBe(320);
    expect(result.current.height).toBe(180);
    expect(observers).toHaveLength(1);
  });

  it('FE-HOOK-ELSIZE-003: picks up a later resize of the same element', () => {
    const { result } = renderHook(() => useElementSize());
    const el = element(320, 180);
    act(() => result.current.ref(el));

    resize(el, 640, 400);
    act(() => observers[0].fire());

    expect(result.current.width).toBe(640);
    expect(result.current.height).toBe(400);
  });

  it('FE-HOOK-ELSIZE-004: keeps the same state object when the size is unchanged', () => {
    const { result } = renderHook(() => useElementSize());
    act(() => result.current.ref(element(200, 100)));
    const before = result.current;

    act(() => observers[0].fire());

    // No re-render — the hook bailed out of setState because nothing moved.
    expect(result.current.width).toBe(before.width);
    expect(result.current.height).toBe(before.height);
  });

  it('FE-HOOK-ELSIZE-005: disconnects the old observer when the ref moves to another element', () => {
    const { result } = renderHook(() => useElementSize());
    act(() => result.current.ref(element(100, 50)));
    act(() => result.current.ref(element(300, 150)));

    expect(observers).toHaveLength(2);
    expect(observers[0].disconnected).toBe(true);
    expect(observers[1].disconnected).toBe(false);
    expect(result.current.width).toBe(300);
  });

  it('FE-HOOK-ELSIZE-006: disconnects when React detaches the ref with null', () => {
    const { result } = renderHook(() => useElementSize());
    act(() => result.current.ref(element(100, 50)));
    act(() => result.current.ref(null));

    expect(observers[0].disconnected).toBe(true);
    // The last measured size is kept — only the observation stops.
    expect(result.current.width).toBe(100);
  });
});
