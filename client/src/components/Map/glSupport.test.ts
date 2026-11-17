/**
 * Whether a map may be drawn with a GL engine (FE-MAP-GLSUP-*).
 *
 * MapLibre 6 and Mapbox GL 3 throw out of their Map constructor without WebGL2.
 * What is under test is the one decision every GL map goes through: the user's
 * provider when it can run here, Leaflet otherwise, and Leaflet from the moment a
 * GPU that claimed WebGL2 refuses the context after all.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasWebGL, resetWebGLProbe } from '../../utils/webgl';
import { buildGlMap, initialMapStyle, isGpuInitFailure, pickGlRenderer, useGlRenderer, useWebGL2 } from './glSupport';

const realGetContext = HTMLCanvasElement.prototype.getContext;

/** A browser whose canvas hands out a webgl2 context, or none. */
function browserWithWebGL2(available: boolean) {
  const ctx = { getExtension: vi.fn(() => ({ loseContext: vi.fn() })) };
  const getContext = vi.fn((type: string) => (available && type === 'webgl2' ? ctx : null));
  HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof realGetContext;
  return getContext;
}

function gpuError(): Error {
  const err = new Error('WebGL2 is required to display this map.');
  err.name = 'GPUInitializationError';
  return err;
}

beforeEach(() => {
  resetWebGLProbe();
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  resetWebGLProbe();
});

describe('pickGlRenderer', () => {
  it('FE-MAP-GLSUP-001: keeps the GL provider the user picked when WebGL2 is there', () => {
    expect(pickGlRenderer('maplibre-gl', '', () => true)).toBe('maplibre-gl');
    expect(pickGlRenderer('mapbox-gl', 'pk.token', () => true)).toBe('mapbox-gl');
  });

  it('FE-MAP-GLSUP-002: draws with Leaflet when the browser has no WebGL2', () => {
    expect(pickGlRenderer('maplibre-gl', '', () => false)).toBeNull();
    expect(pickGlRenderer('mapbox-gl', 'pk.token', () => false)).toBeNull();
  });

  it('FE-MAP-GLSUP-003: Mapbox without a token stays on Leaflet, MapLibre needs none', () => {
    expect(pickGlRenderer('mapbox-gl', '', () => true)).toBeNull();
    expect(pickGlRenderer('maplibre-gl', null, () => true)).toBe('maplibre-gl');
  });

  it('FE-MAP-GLSUP-004: a Leaflet user never pays for the probe', () => {
    const webgl2 = vi.fn(() => true);

    expect(pickGlRenderer('leaflet', 'pk.token', webgl2)).toBeNull();
    expect(pickGlRenderer(undefined, undefined, webgl2)).toBeNull();
    expect(webgl2).not.toHaveBeenCalled();
  });
});

describe('isGpuInitFailure', () => {
  it('FE-MAP-GLSUP-005: knows both engines’ way of saying the GPU refused', () => {
    expect(isGpuInitFailure(gpuError())).toBe(true);
    expect(isGpuInitFailure(new Error('Failed to initialize WebGL.'))).toBe(true);
  });

  it('FE-MAP-GLSUP-006: anything else is not a GPU failure', () => {
    expect(isGpuInitFailure(new TypeError('container is null'))).toBe(false);
    expect(isGpuInitFailure('Failed to initialize WebGL')).toBe(false);
    expect(isGpuInitFailure(null)).toBe(false);
  });
});

describe('buildGlMap', () => {
  it('FE-MAP-GLSUP-007: hands back the map the engine built', () => {
    const map = { remove: vi.fn() };

    expect(buildGlMap(() => map)).toBe(map);
  });

  it('FE-MAP-GLSUP-008: a GPU that claimed WebGL2 and refused it gives null and turns the answer to no', () => {
    browserWithWebGL2(true);
    expect(hasWebGL()).toBe(true);

    expect(
      buildGlMap(() => {
        throw gpuError();
      })
    ).toBeNull();
    expect(hasWebGL()).toBe(false);
  });

  it('FE-MAP-GLSUP-009: any other error is a bug and is thrown on', () => {
    browserWithWebGL2(true);

    expect(() =>
      buildGlMap(() => {
        throw new TypeError('style is undefined');
      })
    ).toThrow('style is undefined');
    expect(hasWebGL()).toBe(true);
  });
});

describe('followContainerSize', () => {
  type Observed = { callback: ResizeObserverCallback; target: Element | null; disconnected: boolean };
  const observers: Observed[] = [];

  function fakeMap() {
    let onRemove: (() => void) | undefined;
    const container = document.createElement('div');
    return {
      map: {
        getContainer: () => container,
        resize: vi.fn(),
        once: (_type: 'remove', listener: () => void) => {
          onRemove = listener;
        },
      },
      container,
      remove: () => onRemove?.(),
    };
  }

  beforeEach(() => {
    observers.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private readonly entry: Observed;
        constructor(callback: ResizeObserverCallback) {
          this.entry = { callback, target: null, disconnected: false };
          observers.push(this.entry);
        }
        observe(target: Element) {
          this.entry.target = target;
        }
        disconnect() {
          this.entry.disconnected = true;
        }
      }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const fire = () => observers[0].callback([], {} as ResizeObserver);

  it('FE-MAP-GLSUP-020: resizes the canvas when its box changes size without a window resize (#3023)', () => {
    const { map, container } = fakeMap();
    expect(buildGlMap(() => map)).toBe(map);
    expect(observers[0].target).toBe(container);

    fire();
    fire();
    fire();
    expect(map.resize).not.toHaveBeenCalled();
    vi.advanceTimersToNextFrame();
    expect(map.resize).toHaveBeenCalledTimes(1);

    fire();
    vi.advanceTimersToNextFrame();
    expect(map.resize).toHaveBeenCalledTimes(2);
  });

  it('FE-MAP-GLSUP-021: stops watching once the map is removed, a pending resize included', () => {
    const { map, remove } = fakeMap();
    buildGlMap(() => map);

    fire();
    remove();
    vi.advanceTimersToNextFrame();
    expect(observers[0].disconnected).toBe(true);
    expect(map.resize).not.toHaveBeenCalled();
  });

  it('FE-MAP-GLSUP-022: leaves a map without a container alone', () => {
    expect(buildGlMap(() => ({ remove: vi.fn() }))).toEqual({ remove: expect.any(Function) });
    expect(observers).toHaveLength(0);
  });
});

describe('useGlRenderer', () => {
  it('FE-MAP-GLSUP-010: asks the canvas for webgl2 only', () => {
    const getContext = browserWithWebGL2(false);

    const { result } = renderHook(() => useGlRenderer('maplibre-gl', ''));

    expect(result.current).toBeNull();
    expect(getContext.mock.calls.map((call) => call[0])).toEqual(['webgl2']);
  });

  it('FE-MAP-GLSUP-011: switches every mounted map to Leaflet once a GL map fails to build', () => {
    browserWithWebGL2(true);
    const trip = renderHook(() => useGlRenderer('maplibre-gl', ''));
    const terrain = renderHook(() => useWebGL2());
    expect(trip.result.current).toBe('maplibre-gl');
    expect(terrain.result.current).toBe(true);

    act(() => {
      buildGlMap(() => {
        throw gpuError();
      });
    });

    expect(trip.result.current).toBeNull();
    expect(terrain.result.current).toBe(false);
  });
});

describe('initialMapStyle', () => {
  it('FE-MAP-GLSUP-INIT-001: leaves the style as it is outside the iOS app, and always for Mapbox', () => {
    expect(initialMapStyle('maplibre-gl', 'https://tiles.openfreemap.org/styles/liberty')).toBe(
      'https://tiles.openfreemap.org/styles/liberty'
    );
    expect(initialMapStyle('mapbox-gl', 'mapbox://styles/mapbox/standard')).toBe('mapbox://styles/mapbox/standard');
  });
});
