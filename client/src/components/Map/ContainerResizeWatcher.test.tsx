import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// FE-MAP-RESIZE-001 onwards

const map = vi.hoisted(() => ({
  container: {} as HTMLElement,
  invalidateSize: vi.fn(),
  getContainer: vi.fn(),
  getCenter: vi.fn(() => ({ lat: 35, lng: 135.7 })),
  getZoom: vi.fn(() => 12),
  whenReady: vi.fn((fn: () => void) => fn()),
  on: vi.fn(),
  off: vi.fn(),
}));
vi.mock('react-leaflet', () => ({ useMap: () => map }));

import ContainerResizeWatcher, { MapCameraSnapshot } from './ContainerResizeWatcher';

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
