// FE-MAP-CAMERA-GL-001 to 003: the GL map moves where the assistant asks, on the same rules as the Leaflet map.
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_ZOOM_GL } from '../../utils/mapViewport';
import type { AssistantCamera } from './mapViewContract';
import { useAssistantCameraGL } from './useAssistantCameraGL';

const PADDING = { top: 60, right: 40, bottom: 60, left: 40 };

class Bounds {
  points: [number, number][] = [];
  extend(lngLat: [number, number]) {
    this.points.push(lngLat);
  }
}

function camera(key: string, over: Partial<AssistantCamera> = {}): AssistantCamera {
  return {
    key,
    points: [
      [41, 12],
      [43, 13],
    ],
    mode: 'fit',
    animate: true,
    auto: false,
    ...over,
  };
}

function setup(first: AssistantCamera | null, inside = false) {
  const container = document.createElement('div');
  const map = {
    getCanvasContainer: () => container,
    getBounds: () => ({ contains: () => inside }),
    fitBounds: vi.fn(),
    easeTo: vi.fn(),
  };
  const mapRef = { current: map };
  const gl = { LngLatBounds: Bounds };
  const hook = renderHook(
    ({ cam }) => useAssistantCameraGL({ mapRef, mapReady: true, gl, camera: cam, padding: PADDING }),
    { initialProps: { cam: first } }
  );
  return { map, container, hook };
}

afterEach(() => vi.useRealTimers());

describe('useAssistantCameraGL', () => {
  it('FE-MAP-CAMERA-GL-001: the request present at mount is skipped; a new one frames its points around the window', () => {
    const { map, hook } = setup(camera('1'));
    expect(map.fitBounds).not.toHaveBeenCalled();

    hook.rerender({ cam: camera('2', { cover: { side: 'right', px: 420 }, animate: false }) });
    expect(map.fitBounds).toHaveBeenCalledOnce();
    const [bounds, options] = map.fitBounds.mock.calls[0] ?? [];
    expect((bounds as Bounds).points).toEqual([
      [12, 41],
      [13, 43],
    ]);
    expect(options).toEqual({ padding: { ...PADDING, right: 420 }, maxZoom: MAX_ZOOM_GL, duration: 0 });

    hook.rerender({ cam: camera('2', { cover: null }) });
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });

  it('FE-MAP-CAMERA-GL-002: a pan moves only when the centre is out of view', () => {
    const inside = setup(null, true);
    inside.hook.rerender({ cam: camera('1', { mode: 'pan' }) });
    expect(inside.map.easeTo).not.toHaveBeenCalled();

    const outside = setup(null, false);
    outside.hook.rerender({ cam: camera('1', { mode: 'pan' }) });
    expect(outside.map.easeTo).toHaveBeenCalledWith({ center: [12.5, 42], duration: 600 });
  });

  it('FE-MAP-CAMERA-GL-003: a move nobody asked for waits while the user is moving the map', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T08:00:00Z'));
    const { map, container, hook } = setup(null);
    container.dispatchEvent(new Event('pointerdown'));
    hook.rerender({ cam: camera('1', { auto: true }) });
    expect(map.fitBounds).not.toHaveBeenCalled();

    vi.setSystemTime(new Date('2026-10-21T08:00:06Z'));
    hook.rerender({ cam: camera('2', { auto: true }) });
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });
});
