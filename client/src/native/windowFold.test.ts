// FE-NATIVE-FOLD-001 onwards: the fold an Android foldable reports, as two-pane screens use it.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NativeWindowLayout } from './trekShell';
import { _resetWindowFold, foldOf, useWindowFold } from './windowFold';

const shell = vi.hoisted(() => ({
  features: [] as string[],
  layout: null as unknown,
  listener: null as null | ((layout: unknown) => void),
}));

vi.mock('./capabilities', () => ({
  hasNativeFeature: (feature: string) => shell.features.includes(feature),
  useNativeCapabilities: () => ({
    caps: { shellApi: 3, platform: 'android', appVersion: '', build: '', features: shell.features },
    updateRequired: false,
  }),
}));
vi.mock('./trekShell', () => ({
  TrekShell: {
    getWindowLayout: vi.fn(() => Promise.resolve(shell.layout)),
    addListener: vi.fn((_event: string, fn: (layout: unknown) => void) => {
      shell.listener = fn;
      return Promise.resolve({ remove: () => Promise.resolve() });
    }),
  },
}));

function layout(over: Partial<NativeWindowLayout> = {}): NativeWindowLayout {
  return {
    width: 841,
    height: 701,
    widthClass: 'expanded',
    heightClass: 'medium',
    posture: 'halfOpened',
    orientation: 'vertical',
    separating: true,
    hinge: { left: 420, top: 0, right: 421, bottom: 701 },
    ...over,
  };
}

beforeEach(() => {
  _resetWindowFold();
  shell.features = [];
  shell.layout = null;
  shell.listener = null;
});

afterEach(() => _resetWindowFold());

describe('foldOf', () => {
  it('FE-NATIVE-FOLD-001: a book posture splits the window at its hinge', () => {
    expect(foldOf(layout())).toEqual({ start: 420, end: 421 });
  });

  it('FE-NATIVE-FOLD-002: a seamless flat fold, a horizontal one or none at all splits nothing', () => {
    expect(foldOf(layout({ posture: 'flat', separating: false }))).toBeNull();
    expect(foldOf(layout({ orientation: 'horizontal' }))).toBeNull();
    expect(foldOf(layout({ posture: 'none', hinge: undefined }))).toBeNull();
    expect(foldOf(null)).toBeNull();
    // A hinge outside the window is not one to lay panes against.
    expect(foldOf(layout({ hinge: { left: 0, top: 0, right: 0, bottom: 701 } }))).toBeNull();
  });
});

describe('useWindowFold', () => {
  it('FE-NATIVE-FOLD-003: without the shell feature there is no fold to follow', () => {
    const { result } = renderHook(() => useWindowFold());
    expect(result.current).toBeNull();
    expect(shell.listener).toBeNull();
  });

  it('FE-NATIVE-FOLD-004: follows the layout the Android shell reports, as the device folds and unfolds', async () => {
    shell.features = ['windowLayout'];
    shell.layout = layout();
    const { result } = renderHook(() => useWindowFold());
    await waitFor(() => expect(result.current).toEqual({ start: 420, end: 421 }));

    act(() => shell.listener?.(layout({ posture: 'flat', separating: false })));
    expect(result.current).toBeNull();
  });
});
