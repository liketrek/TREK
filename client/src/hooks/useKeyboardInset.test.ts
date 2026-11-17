// FE-HOOK-KBINSET-001 to FE-HOOK-KBINSET-006
import { act, renderHook } from '@testing-library/react';

import { _resetNativeKeyboard, useKeyboardInset } from './useKeyboardInset';

const native = vi.hoisted(() => ({
  app: false,
  listeners: new Map<string, (info: { keyboardHeight: number }) => void>(),
}));
vi.mock('../native/platform', () => ({ isNativeApp: () => native.app }));
vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: (event: string, listener: (info: { keyboardHeight: number }) => void) => {
      native.listeners.set(event, listener);
      return Promise.resolve({ remove: () => Promise.resolve() });
    },
  },
}));

class FakeVisualViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
}

let viewport: FakeVisualViewport;

beforeEach(() => {
  viewport = new FakeVisualViewport();
  vi.stubGlobal('visualViewport', viewport);
  vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
  vi.unstubAllGlobals();
  _resetNativeKeyboard();
  native.app = false;
  native.listeners.clear();
});

function keyboard(height: number, offsetTop = 0) {
  act(() => {
    viewport.height = 800 - height - offsetTop;
    viewport.offsetTop = offsetTop;
    viewport.dispatchEvent(new Event('resize'));
  });
}

describe('useKeyboardInset', () => {
  it('FE-HOOK-KBINSET-001: is zero while no keyboard is up', () => {
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });

  it('FE-HOOK-KBINSET-002: follows the keyboard as it opens and closes', () => {
    const { result } = renderHook(() => useKeyboardInset());
    keyboard(320);
    expect(result.current).toBe(320);
    keyboard(0);
    expect(result.current).toBe(0);
  });

  it('FE-HOOK-KBINSET-003: leaves out the part the page scrolled the viewport by', () => {
    const { result } = renderHook(() => useKeyboardInset());
    act(() => {
      viewport.height = 480;
      viewport.offsetTop = 40;
      viewport.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(280);
  });

  it('FE-HOOK-KBINSET-004: stays at zero where the browser has no visual viewport', () => {
    vi.stubGlobal('visualViewport', null);
    const { result } = renderHook(() => useKeyboardInset());
    expect(result.current).toBe(0);
  });

  it('FE-HOOK-KBINSET-005: in the app, the keyboard the app reports counts, though the viewport did not shrink', () => {
    native.app = true;
    const { result } = renderHook(() => useKeyboardInset());
    act(() => native.listeners.get('keyboardWillShow')?.({ keyboardHeight: 336.4 }));
    expect(result.current).toBe(336);
    act(() => native.listeners.get('keyboardWillHide')?.({ keyboardHeight: 0 }));
    expect(result.current).toBe(0);
  });

  it('FE-HOOK-KBINSET-006: in a browser nothing listens for the app keyboard', () => {
    renderHook(() => useKeyboardInset());
    expect(native.listeners.size).toBe(0);
  });
});
