// FE-MAP-ASSIST-CAMERA-001 to 004: what both renderers share when the assistant moves the map or marks a pin.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { centreOf, coverPadding, useAssistantMarkerClasses } from './assistantCamera';
import { carryAssistantMarks } from './useAssistantMapGL';

describe('assistantCamera', () => {
  it('FE-MAP-ASSIST-CAMERA-001: the window widens the padding on its side only, never narrows it', () => {
    const base = { top: 60, right: 340, bottom: 60, left: 40 };
    expect(coverPadding(base, null)).toBe(base);
    expect(coverPadding(base, { side: 'left', px: 400 })).toEqual({ ...base, left: 400 });
    expect(coverPadding(base, { side: 'right', px: 100 })).toEqual(base);
  });

  it('FE-MAP-ASSIST-CAMERA-002: the centre is the middle of the box the points span', () => {
    expect(
      centreOf([
        [40, 10],
        [44, 12],
        [42, 14],
      ])
    ).toEqual([42, 12]);
  });

  it('FE-MAP-ASSIST-CAMERA-003: a popped pin is marked for a moment, a pulsing one while it is hovered', async () => {
    const pins = new Map([
      [1, document.createElement('div')],
      [2, document.createElement('div')],
    ]);
    const markerEl = (id: number) => pins.get(id) ?? null;
    const popped: readonly number[] = [1];
    const { rerender } = renderHook(({ pulse }) => useAssistantMarkerClasses(markerEl, popped, pulse), {
      initialProps: { pulse: 2 as number | null },
    });
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(pins.get(1)?.classList.contains('trek-place-pop')).toBe(true);
    expect(pins.get(2)?.classList.contains('trek-place-pulse')).toBe(true);

    await act(() => new Promise((resolve) => setTimeout(resolve, 450)));
    expect(pins.get(1)?.classList.contains('trek-place-pop')).toBe(false);

    rerender({ pulse: null });
    expect(pins.get(2)?.classList.contains('trek-place-pulse')).toBe(false);
  });

  it('FE-MAP-ASSIST-CAMERA-004: a pin the GL map rebuilds keeps its marks, and they end on the new pin', async () => {
    const pins = new Map([
      [1, document.createElement('div')],
      [2, document.createElement('div')],
    ]);
    const markerEl = (id: number) => pins.get(id) ?? null;
    const popped: readonly number[] = [1];
    const { rerender } = renderHook(({ pulse }) => useAssistantMarkerClasses(markerEl, popped, pulse), {
      initialProps: { pulse: 2 as number | null },
    });
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    // A pan rebuilds both pins.
    for (const id of [1, 2]) {
      const rebuilt = document.createElement('div');
      carryAssistantMarks(pins.get(id) as HTMLElement, rebuilt);
      pins.set(id, rebuilt);
    }
    expect(pins.get(1)?.classList.contains('trek-place-pop')).toBe(true);
    expect(pins.get(2)?.classList.contains('trek-place-pulse')).toBe(true);
    expect(pins.get(2)?.classList.contains('trek-place-pop')).toBe(false);

    await act(() => new Promise((resolve) => setTimeout(resolve, 450)));
    expect(pins.get(1)?.classList.contains('trek-place-pop')).toBe(false);
    rerender({ pulse: null });
    expect(pins.get(2)?.classList.contains('trek-place-pulse')).toBe(false);
  });
});
