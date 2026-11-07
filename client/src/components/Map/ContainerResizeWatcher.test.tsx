import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// FE-MAP-RESIZE-001 onwards

const map = vi.hoisted(() => ({
  container: {} as HTMLElement,
  invalidateSize: vi.fn(),
  getContainer: vi.fn(),
  getCenter: vi.fn(() => ({ lat: 35, lng: 135.7 })),
  getZoom: vi.fn(() => 12),
  getSize: vi.fn(() => ({ x: 1376, y: 1032 })),
  setView: vi.fn(),
  whenReady: vi.fn((fn: () => void) => fn()),
  on: vi.fn(),
  off: vi.fn(),
}));
vi.mock('react-leaflet', () => ({ useMap: () => map }));
vi.mock('./lngFrameContext', () => ({ useLngFrame: () => null }));

import { computeMapViewport, TILE_SIZE_RASTER } from '../../utils/mapViewport';
import ContainerResizeWatcher, { MapCameraSnapshot, OpeningFrameFit } from './ContainerResizeWatcher';
import type { OpeningFrame } from './openingView';

const realObserver = globalThis.ResizeObserver;

describe('ContainerResizeWatcher', () => {
  afterEach(() => {
    globalThis.ResizeObserver = realObserver;
    vi.clearAllMocks();
  });

  it('FE-MAP-RESIZE-001: the map measures itself again whenever its box changes size', () => {
    const element = document.createElement('div');
    map.getContainer.mockReturnValue(element);
    let fire: () => void = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    globalThis.ResizeObserver = class {
      constructor(cb: () => void) {
        fire = cb;
      }
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    } as unknown as typeof ResizeObserver;

    const { unmount } = render(<ContainerResizeWatcher />);
    expect(observe).toHaveBeenCalledWith(element);
    fire();
    expect(map.invalidateSize).toHaveBeenCalledWith();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('FE-MAP-RESIZE-002: the camera snapshot reports where the map looks and stops on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = render(<MapCameraSnapshot onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith([35, 135.7], 12);
    expect(map.on).toHaveBeenCalledWith('moveend zoomend', expect.any(Function));
    unmount();
    expect(map.off).toHaveBeenCalledWith('moveend zoomend', expect.any(Function));
  });
});

describe('OpeningFrameFit', () => {
  // A day across Kyoto from Arashiyama in the west to Ginkaku-ji in the east, wider than tall.
  const points = [
    { lat: 35.0094, lng: 135.6668 },
    { lat: 35.005, lng: 135.7649 },
    { lat: 35.0037, lng: 135.7788 },
    { lat: 35.027, lng: 135.7982 },
  ];
  const padding = { top: 20, right: 40, bottom: 20, left: 40 };
  const windowFrame = (): OpeningFrame => {
    const view = computeMapViewport(points, { tileSize: TILE_SIZE_RASTER, padding, width: 1376, height: 1032 });
    if (!view) throw new Error('the day has places to frame');
    return { points, padding, wrapsWorld: false, center: view.center, zoom: view.zoom, width: 1376, height: 1032 };
  };

  afterEach(() => vi.clearAllMocks());

  it('FE-MAP-RESIZE-004: a map beside the plan, narrower than the window, frames the day again for its own size', () => {
    const frame = windowFrame();
    map.getSize.mockReturnValue({ x: 824, y: 1032 });
    map.getZoom.mockReturnValue(frame.zoom);
    map.getCenter.mockReturnValue({ lat: frame.center[0], lng: frame.center[1] });
    render(<OpeningFrameFit frame={frame} />);
    expect(map.setView).toHaveBeenCalledOnce();
    const [, zoom, options] = map.setView.mock.calls[0];
    // Further out than the window's frame, so the whole day fits the narrower map.
    expect(zoom).toBeLessThan(frame.zoom);
    expect(options).toEqual({ animate: false });
  });

  it('FE-MAP-RESIZE-005: a map the size of the window, or one that opened at a kept camera, stays where it is', () => {
    const frame = windowFrame();
    map.getSize.mockReturnValue({ x: 1376, y: 1000 });
    map.getZoom.mockReturnValue(frame.zoom);
    map.getCenter.mockReturnValue({ lat: frame.center[0], lng: frame.center[1] });
    const { unmount } = render(<OpeningFrameFit frame={frame} />);
    expect(map.setView).not.toHaveBeenCalled();
    unmount();

    map.getSize.mockReturnValue({ x: 824, y: 1032 });
    map.getZoom.mockReturnValue(9);
    render(<OpeningFrameFit frame={frame} />);
    expect(map.setView).not.toHaveBeenCalled();
  });
});
