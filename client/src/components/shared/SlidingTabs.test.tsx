import { render, waitFor, act } from '../../../tests/helpers/render';
import SlidingTabs from './SlidingTabs';

const TABS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
] as const;

// Query the absolutely-positioned pill (rendered with aria-hidden).
function pill(): HTMLElement | null {
  return document.querySelector('[aria-hidden="true"]');
}

describe('SlidingTabs', () => {
  const onChange = vi.fn();
  let rectSpy: ReturnType<typeof vi.spyOn>;
  // Mutable geometry so we can simulate the active label reflowing (e.g. after a font swap).
  let activeButtonRect: { left: number; width: number };
  let capturedResizeCallbacks: ResizeObserverCallback[];
  let resolveFonts: () => void;

  beforeEach(() => {
    onChange.mockClear();
    activeButtonRect = { left: 20, width: 100 };
    capturedResizeCallbacks = [];

    // jsdom has no real layout — stub geometry. Container sits at left 0; buttons report
    // the mutable rect (only the active button is ever measured).
    rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const base = { top: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
        if (this.tagName === 'BUTTON') {
          return { ...base, left: activeButtonRect.left, width: activeButtonRect.width } as DOMRect;
        }
        return { ...base, left: 0, width: 300 } as DOMRect;
      });

    // Capturing ResizeObserver so tests can drive the resize path (global mock is a no-op).
    class CapturingResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        capturedResizeCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', CapturingResizeObserver);

    // Controllable document.fonts.ready.
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: new Promise<void>(resolve => {
          resolveFonts = resolve;
        }),
      },
    });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    vi.unstubAllGlobals();
    // @ts-expect-error — remove the stub so it doesn't leak into other suites.
    delete document.fonts;
  });

  it('FE-COMP-TABS-001: positions the pill from the initial measurement', () => {
    render(<SlidingTabs tabs={TABS} activeTab="a" onChange={onChange} />);
    const el = pill();
    expect(el).toBeTruthy();
    // left = activeRect.left(20) - containerRect.left(0) + scrollLeft(0)
    expect(el!.style.left).toBe('20px');
    expect(el!.style.width).toBe('100px');
  });

  it('FE-COMP-TABS-002: re-measures after document.fonts.ready resolves (reload font swap)', async () => {
    render(<SlidingTabs tabs={TABS} activeTab="a" onChange={onChange} />);
    expect(pill()!.style.width).toBe('100px');

    // Font settles → active (bold) label reflows wider and recentres.
    activeButtonRect = { left: 12, width: 130 };
    await act(async () => {
      resolveFonts();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(pill()!.style.left).toBe('12px');
      expect(pill()!.style.width).toBe('130px');
    });
  });

  it('FE-COMP-TABS-003: re-measures when the ResizeObserver fires (window/container resize)', () => {
    render(<SlidingTabs tabs={TABS} activeTab="a" onChange={onChange} />);
    expect(pill()!.style.width).toBe('100px');

    activeButtonRect = { left: 40, width: 90 };
    act(() => {
      capturedResizeCallbacks.forEach(cb =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver),
      );
    });

    expect(pill()!.style.left).toBe('40px');
    expect(pill()!.style.width).toBe('90px');
  });
});
