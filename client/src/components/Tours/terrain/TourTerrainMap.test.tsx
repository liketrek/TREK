// FE-COMP-TERRAIN-001 to FE-COMP-TERRAIN-014
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '../../../../tests/helpers/render';
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry';
import TourTerrainMap, { type TourTerrainMapProps } from './TourTerrainMap';

type Handler = (event?: unknown) => void;

interface MarkerStub {
  element: HTMLElement;
  draggable: boolean;
  lngLat: [number, number];
  handlers: Record<string, Handler>;
  setLngLat: ReturnType<typeof vi.fn>;
  addTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  getLngLat: ReturnType<typeof vi.fn>;
}

const gl = vi.hoisted(() => {
  const listeners = new Map<string, Handler[]>();
  const sources = new Map<string, Record<string, unknown>>();
  const markers: MarkerStub[] = [];
  const listen = (type: string, fn: Handler) => listeners.set(type, [...(listeners.get(type) ?? []), fn]);
  const map = {
    on: vi.fn((type: string, fn: Handler) => {
      listen(type, fn);
      return map;
    }),
    once: vi.fn((type: string, fn: Handler) => {
      const wrapped: Handler = (event) => {
        listeners.set(
          type,
          (listeners.get(type) ?? []).filter((other) => other !== wrapped)
        );
        fn(event);
      };
      listen(type, wrapped);
      return map;
    }),
    remove: vi.fn(),
    fitBounds: vi.fn(),
    jumpTo: vi.fn(),
    setStyle: vi.fn(),
    setTerrain: vi.fn(),
    setSky: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn((id: string, spec: Record<string, unknown>) => sources.set(id, { ...spec, setData: vi.fn() })),
    getSource: vi.fn((id: string) => sources.get(id)),
    getStyle: vi.fn(() => ({ sources: Object.fromEntries(sources) })),
  };
  const fire = (type: string, event?: unknown) => [...(listeners.get(type) ?? [])].forEach((fn) => fn(event));
  const createMarker = (options: { element: HTMLElement; draggable?: boolean }): MarkerStub => {
    const marker: MarkerStub = {
      element: options.element,
      draggable: !!options.draggable,
      lngLat: [0, 0],
      handlers: {},
      setLngLat: vi.fn((at: [number, number]) => {
        marker.lngLat = at;
        return marker;
      }),
      addTo: vi.fn(() => marker),
      remove: vi.fn(),
      on: vi.fn((type: string, fn: Handler) => {
        marker.handlers[type] = fn;
        return marker;
      }),
      getLngLat: vi.fn(() => ({ lng: marker.lngLat[0], lat: marker.lngLat[1] })),
    };
    markers.push(marker);
    return marker;
  };
  const engine = {
    Map: vi.fn(function () {
      return map;
    }),
    Marker: vi.fn(function (options: { element: HTMLElement; draggable?: boolean }) {
      return createMarker(options);
    }),
  };
  const reset = () => {
    listeners.clear();
    sources.clear();
    markers.length = 0;
  };
  return { map, engine, markers, sources, fire, reset };
});

vi.mock('../../Map/engines/maplibre', () => ({ default: gl.engine }));

/** 300 m due north, 20 m up every 100 m, every sample with a position. */
const TOUR: DistanceIndexedProfileSample[] = [0, 1, 2, 3].map((i) => ({
  distanceMeters: i * 100,
  elevationMeters: 1000 + i * 20,
  lat: 46 + i * 0.0009,
  lng: 7,
}));

function props(overrides: Partial<TourTerrainMapProps> = {}): TourTerrainMapProps {
  return {
    samples: [],
    routes: null,
    trackColor: '#0a84ff',
    unit: 'metric',
    baseLayer: 'topo',
    onBaseLayerChange: vi.fn(),
    onExit: vi.fn(),
    focus: null,
    onFocusChange: vi.fn(),
    leftWidth: 300,
    rightWidth: 400,
    waypoints: { points: [], selectedId: null, onSelect: vi.fn() },
    framePoints: [[46, 7]],
    ...overrides,
  };
}

async function renderTerrain(overrides: Partial<TourTerrainMapProps> = {}) {
  const view = render(<TourTerrainMap {...props(overrides)} />);
  // The engine loads on demand; the rider marker exists once the map is wired up.
  await waitFor(() => expect(gl.markers.length).toBeGreaterThan(0));
  return view;
}

/** The style finishes loading, then its sources know their tile URLs. */
function loadStyle() {
  act(() => {
    gl.fire('style.load');
    gl.fire('load');
    gl.fire('idle');
  });
}

let openTiles: () => void = () => {};

beforeEach(() => {
  gl.reset();
  vi.clearAllMocks();
  const gate = new Promise<Response>((resolve) => {
    openTiles = () => resolve({ ok: true } as Response);
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => gate)
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TourTerrainMap', () => {
  it('FE-COMP-TERRAIN-001: opens a pitched GL map with the planner base layer and the layer pill in 3D', async () => {
    const onExit = vi.fn();
    await renderTerrain({ onExit });
    expect(gl.engine.Map).toHaveBeenCalledWith(expect.objectContaining({ pitch: 60, maxPitch: 75 }));
    const toggle = screen.getByRole('button', { name: '3D' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-TERRAIN-002: without a tour it says how to start, by whether the tour can be edited', async () => {
    const { rerender } = await renderTerrain();
    expect(screen.getByText('Open a tour on the right to fly it in 3D and colour it by grade.')).toBeInTheDocument();
    rerender(
      <TourTerrainMap {...props({ waypoints: { points: [], selectedId: null, onSelect: vi.fn(), onAdd: vi.fn() } })} />
    );
    expect(screen.getByText(/Click the terrain to set points/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play flyover' })).toBeNull();
  });

  it('FE-COMP-TERRAIN-003: a click on the terrain adds a control point only while editing', async () => {
    const onAdd = vi.fn();
    const { rerender } = await renderTerrain({ waypoints: { points: [], selectedId: null, onSelect: vi.fn(), onAdd } });
    act(() => gl.fire('click', { lngLat: { lat: 46.5, lng: 7.5 } }));
    expect(onAdd).toHaveBeenCalledWith(46.5, 7.5);

    rerender(<TourTerrainMap {...props()} />);
    act(() => gl.fire('click', { lngLat: { lat: 1, lng: 2 } }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-TERRAIN-004: drapes terrain, hillshade and track once the style is in, and frames the start', async () => {
    await renderTerrain();
    loadStyle();
    expect(gl.map.setTerrain).toHaveBeenCalledWith({ source: 'tour-terrain-dem', exaggeration: 1.5 });
    expect(gl.map.addLayer).toHaveBeenCalledTimes(3);
    expect(gl.map.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 0, padding: { top: 70, bottom: 150, left: 340, right: 440 } })
    );
  });

  it('FE-COMP-TERRAIN-005: pins the control points, selects one on click and puts a refused drag back', async () => {
    const onSelect = vi.fn();
    const onMove = vi.fn(() => false);
    await renderTerrain({
      waypoints: {
        points: [
          { id: 'a', lat: 46, lng: 7 },
          { id: 'b', lat: 46.01, lng: 7.01 },
        ],
        selectedId: 'b',
        onSelect,
        onMove,
      },
    });
    loadStyle();
    const pins = gl.markers.filter((marker) => marker.element.tagName === 'BUTTON');
    expect(pins.map((pin) => pin.element.textContent)).toEqual(['1', '2']);
    expect(pins.every((pin) => pin.draggable)).toBe(true);
    expect(pins[1].element.style.width).toBe('30px');

    fireEvent.click(pins[0].element);
    expect(onSelect).toHaveBeenCalledWith('a');

    pins[0].lngLat = [8, 47];
    pins[0].handlers.dragend();
    expect(onMove).toHaveBeenCalledWith('a', 47, 8);
    expect(pins[0].lngLat).toEqual([7, 46]);
  });

  it('FE-COMP-TERRAIN-006: keeps a pin where it was dropped when the move is taken', async () => {
    const onMove = vi.fn(() => true);
    await renderTerrain({
      waypoints: { points: [{ id: 'a', lat: 46, lng: 7 }], selectedId: null, onSelect: vi.fn(), onMove },
    });
    loadStyle();
    const [pin] = gl.markers.filter((marker) => marker.element.tagName === 'BUTTON');
    pin.lngLat = [8, 47];
    pin.handlers.dragend();
    expect(pin.lngLat).toEqual([8, 47]);
  });

  it('FE-COMP-TERRAIN-007: shows the landscape loading as a ring, then offers the flyover', async () => {
    await renderTerrain({ samples: TOUR });
    expect(screen.getByRole('progressbar', { name: 'Loading the landscape: 0 %' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    );
    loadStyle();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('elevation-tiles-prod'), expect.anything());
    // The play button only comes once the corridor is in the cache.
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();

    await act(async () => openTiles());
    expect(await screen.findByRole('button', { name: 'Play flyover' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('FE-COMP-TERRAIN-008: flies the route, moving the profile focus, and stops at its end', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const onFocusChange = vi.fn();
    await renderTerrain({ samples: TOUR, onFocusChange });
    loadStyle();
    await act(async () => openTiles());
    fireEvent.click(await screen.findByRole('button', { name: 'Play flyover' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    let now = performance.now();
    for (let i = 0; i < 400 && frames.length; i++) {
      const frame = frames.shift();
      now += 100;
      act(() => frame?.(now));
    }
    expect(gl.map.jumpTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 52, zoom: 13.4 }));
    const calls = onFocusChange.mock.calls;
    const last = calls[calls.length - 1]?.[0] as RouteProfileFocus | undefined;
    expect(last?.distanceMeters).toBe(300);
    expect(screen.getByRole('button', { name: 'Play flyover' })).toBeInTheDocument();
  });

  it('FE-COMP-TERRAIN-009: pauses, starts over and frames the whole route again', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    await renderTerrain({ samples: TOUR });
    loadStyle();
    await act(async () => openTiles());
    await screen.findByRole('button', { name: 'Play flyover' });
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Play flyover' })).toBeInTheDocument();

    gl.map.fitBounds.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    expect(gl.map.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 1200 }));
  });

  it('FE-COMP-TERRAIN-010: the rider follows the profile focus while the flyover is not running', async () => {
    const focus: RouteProfileFocus = {
      distanceMeters: 100,
      elevationMeters: 1020,
      lat: 46.0009,
      lng: 7,
      sampleIndex: 1,
    };
    const { rerender } = await renderTerrain({ samples: TOUR });
    const rider = gl.markers[0];
    rerender(<TourTerrainMap {...props({ samples: TOUR, focus })} />);
    expect(rider.setLngLat).toHaveBeenCalledWith([7, 46.0009]);
    expect(rider.addTo).toHaveBeenCalledWith(gl.map);
    rerender(<TourTerrainMap {...props({ samples: TOUR, focus: null })} />);
    expect(rider.remove).toHaveBeenCalled();
  });

  it('FE-COMP-TERRAIN-011: speed, relief and colour change the flight and the drawing', async () => {
    await renderTerrain({ samples: TOUR });
    loadStyle();
    await act(async () => openTiles());

    fireEvent.click(screen.getByRole('button', { name: '4×' }));
    expect(screen.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '1×' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.change(screen.getByRole('slider', { name: 'Relief' }), { target: { value: '2.5' } });
    expect(gl.map.setTerrain).toHaveBeenLastCalledWith({ source: 'tour-terrain-dem', exaggeration: 2.5 });
    expect(screen.getByText('2.5×')).toBeInTheDocument();

    const track = gl.sources.get('tour-terrain-track');
    const setData = track?.setData as ReturnType<typeof vi.fn> | undefined;
    setData?.mockClear();
    const colour = screen.getByRole('button', { name: 'Grade' });
    expect(colour).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(colour);
    expect(colour).toHaveAttribute('aria-pressed', 'false');
    const drawCalls = setData?.mock.calls ?? [];
    const drawn = drawCalls[drawCalls.length - 1]?.[0] as { features: { properties: { color: string } }[] } | undefined;
    expect(drawn?.features.every((feature) => feature.properties.color === '#0a84ff')).toBe(true);
  });

  it('FE-COMP-TERRAIN-012: unfolds the grade mix with its bands and the elevation credit', async () => {
    await renderTerrain({ samples: TOUR });
    const legend = screen.getByRole('button', { name: 'Grade mix' });
    expect(legend).toHaveAttribute('aria-expanded', 'false');
    expect(legend).toHaveTextContent('1060 m');
    expect(legend).toHaveTextContent('max 20 %');
    fireEvent.click(legend);
    expect(legend).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('18 to 27 %')).toBeInTheDocument();
    expect(screen.getByText('Elevation: Mapzen Terrain Tiles (AWS Open Data)')).toBeInTheDocument();
    fireEvent.click(legend);
    expect(screen.queryByText('18 to 27 %')).toBeNull();
  });

  it('FE-COMP-TERRAIN-013: swaps the style in place for another base layer and draws on it again', async () => {
    const { rerender } = await renderTerrain({ samples: TOUR });
    loadStyle();
    rerender(<TourTerrainMap {...props({ samples: TOUR, baseLayer: 'satellite' })} />);
    expect(gl.map.setStyle).toHaveBeenCalledTimes(1);
    expect(gl.engine.Map).toHaveBeenCalledTimes(1);
    gl.map.addLayer.mockClear();
    act(() => gl.fire('style.load'));
    expect(gl.map.addLayer).toHaveBeenCalledTimes(3);
  });

  it('FE-COMP-TERRAIN-014: removes the map with the view', async () => {
    const { unmount } = await renderTerrain({
      waypoints: { points: [{ id: 'a', lat: 46, lng: 7 }], selectedId: null, onSelect: vi.fn() },
    });
    loadStyle();
    const [pin] = gl.markers.filter((marker) => marker.element.tagName === 'BUTTON');
    unmount();
    expect(gl.map.remove).toHaveBeenCalledTimes(1);
    expect(pin.remove).toHaveBeenCalled();
  });
});
